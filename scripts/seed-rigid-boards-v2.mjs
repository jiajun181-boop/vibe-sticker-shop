#!/usr/bin/env node
/**
 * Signs & Rigid Boards — v2 expansion.
 *
 * 1. Add PVC 4mm (outdoor) to the rigid_sheets_default pricing preset
 * 2. Create 12 new "event-boards" products (selfie frames, cutouts, backdrops, etc.)
 * 3. Update existing product descriptions with rich application scenarios
 *
 * Safe to re-run — skips existing slugs, upserts preset.
 * Run: node scripts/seed-rigid-boards-v2.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRINT_FORMATS = ["ai", "pdf", "eps", "tiff", "jpg", "png"];
const CATEGORY = "signs-rigid-boards";

// ─── Step 1: Update pricing preset — add PVC 4mm ─────────

async function updatePreset() {
  console.log("Step 1: Update pricing preset — add PVC 4mm outdoor\n");

  const preset = await prisma.pricingPreset.findUnique({
    where: { key: "rigid_sheets_default" },
  });
  if (!preset) {
    console.log("  Preset not found — run seed-rigid-boards.mjs first");
    return null;
  }

  const config = preset.config;
  const hasPvc4 = config.materials?.some((m) => m.id === "pvc_4mm");
  if (!hasPvc4) {
    // Insert PVC 4mm right after PVC 3mm
    const idx = config.materials.findIndex((m) => m.id === "pvc_3mm");
    const pvc4mm = { id: "pvc_4mm", name: "PVC (Sintra) 4mm — Outdoor", multiplier: 1.7 };
    if (idx >= 0) {
      config.materials.splice(idx + 1, 0, pvc4mm);
    } else {
      config.materials.push(pvc4mm);
    }
    await prisma.pricingPreset.update({
      where: { key: "rigid_sheets_default" },
      data: { config },
    });
    console.log("  Added PVC 4mm (outdoor, multiplier 1.7) to preset");
  } else {
    console.log("  PVC 4mm already in preset — skip");
  }

  return preset;
}

// ─── Step 2: New event-boards products ────────────────────

const SHARED = {
  category: CATEGORY,
  type: "sign",
  acceptedFormats: PRINT_FORMATS,
  minDpi: 150,
  requiresBleed: true,
  bleedIn: 0.125,
};

const EVENT_PRODUCTS = [
  // ── Selfie Frame Board ──
  {
    name: "Selfie Frame Board",
    slug: "selfie-frame-board",
    pricingUnit: "per_piece",
    basePrice: 6500,
    sortOrder: 60,
    description:
      "Custom photo-op selfie frames — guests hold the frame, snap a pic, and share instantly. " +
      "Printed on rigid foam board or coroplast with a precision-cut window. " +
      "Perfect for weddings (\"Just Married!\"), birthdays (\"Turning 30!\"), baby showers, graduation parties, " +
      "corporate galas, trade shows, product launches, holiday parties (Christmas, Halloween, Lunar New Year), " +
      "and brand activations. Add your logo, hashtag, date, or theme — every photo becomes a free ad. " +
      "Available in portrait or landscape orientation. Laminated for durability at outdoor events.",
    minWidthIn: 20,
    minHeightIn: 24,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Indoor)' },
        { value: "coroplast_6mm", label: "Coroplast 6mm (Outdoor)" },
        { value: "pvc_4mm", label: "PVC 4mm (Premium Outdoor)" },
      ],
      sizes: [
        {
          label: "24×36 Selfie Frame",
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 6500 },
            { qty: 5, unitCents: 5500 },
            { qty: 10, unitCents: 4800 },
          ],
        },
        {
          label: "30×40 Selfie Frame",
          widthIn: 30, heightIn: 40,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 5, unitCents: 7200 },
            { qty: 10, unitCents: 6200 },
          ],
        },
        {
          label: "36×48 Selfie Frame (XL)",
          widthIn: 36, heightIn: 48,
          tiers: [
            { qty: 1, unitCents: 11500 },
            { qty: 5, unitCents: 9800 },
            { qty: 10, unitCents: 8500 },
          ],
        },
      ],
    },
    keywords: ["selfie frame", "photo frame board", "photo op", "event photo", "social media frame", "hashtag frame"],
    tags: ["event", "wedding", "birthday", "corporate", "photo-op"],
  },

  // ── Life-Size Cutout ──
  {
    name: "Life-Size Cutout Standee",
    slug: "life-size-cutout",
    pricingUnit: "per_piece",
    basePrice: 8500,
    sortOrder: 61,
    description:
      "Custom life-size cutouts that make guests do a double-take. Upload any photo — a person, mascot, character, or product — " +
      "and we contour-cut it to shape with a fold-out easel stand. " +
      "Birthday milestones (\"Look who's 50!\"), graduation celebrations, retirement parties, fan meet-and-greets, " +
      "movie premieres, store entrances, trade show booths, and corporate lobbies. " +
      "Also popular for memorial tributes, pet portraits, sports team promotions, and holiday decorations (Santa, Elf, Nutcracker). " +
      "Printed on durable 6mm coroplast or PVC with waterproof UV ink — use indoors or outdoors.",
    minWidthIn: 18,
    minHeightIn: 36,
    maxWidthIn: 48,
    maxHeightIn: 84,
    optionsConfig: {
      materials: [
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
        { value: "pvc_4mm", label: "PVC 4mm (Premium)" },
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Indoor)' },
      ],
      sizes: [
        {
          label: "Half-Body (24×48)",
          widthIn: 24, heightIn: 48,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 3, unitCents: 7200 },
            { qty: 5, unitCents: 6500 },
          ],
        },
        {
          label: "Full-Body (36×72)",
          widthIn: 36, heightIn: 72,
          tiers: [
            { qty: 1, unitCents: 14500 },
            { qty: 3, unitCents: 12500 },
            { qty: 5, unitCents: 11000 },
          ],
        },
        {
          label: "Full-Body XL (48×84)",
          widthIn: 48, heightIn: 84,
          tiers: [
            { qty: 1, unitCents: 19500 },
            { qty: 3, unitCents: 17000 },
            { qty: 5, unitCents: 15000 },
          ],
        },
      ],
    },
    keywords: ["life size cutout", "standee", "cardboard cutout", "standup", "contour cut", "person cutout"],
    tags: ["event", "birthday", "corporate", "photo-op", "contour-cut"],
  },

  // ── Giant Presentation Check ──
  {
    name: "Giant Presentation Cheque",
    slug: "giant-presentation-check",
    pricingUnit: "per_piece",
    basePrice: 7500,
    sortOrder: 62,
    description:
      "Oversized presentation cheques for donation ceremonies, fundraisers, award presentations, charity galas, " +
      "scholarship announcements, contest winners, and corporate milestones. " +
      "Full-colour UV print on rigid foam board or PVC. Optional dry-erase laminate so you can reuse the cheque " +
      "with different amounts and recipients — perfect for organizations that present cheques regularly. " +
      "Available with optional easel stand for tabletop display or photo-op holding.",
    minWidthIn: 24,
    minHeightIn: 12,
    maxWidthIn: 48,
    maxHeightIn: 24,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2"' },
        { value: "pvc_3mm", label: "PVC 3mm" },
        { value: "pvc_4mm", label: "PVC 4mm (Dry-Erase Compatible)" },
      ],
      sizes: [
        {
          label: '24×12" (Standard)',
          widthIn: 24, heightIn: 12,
          tiers: [
            { qty: 1, unitCents: 7500 },
            { qty: 3, unitCents: 6000 },
            { qty: 5, unitCents: 5200 },
          ],
        },
        {
          label: '36×18" (Large)',
          widthIn: 36, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 11000 },
            { qty: 3, unitCents: 9000 },
            { qty: 5, unitCents: 7800 },
          ],
        },
        {
          label: '48×24" (Jumbo)',
          widthIn: 48, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 16000 },
            { qty: 3, unitCents: 13500 },
            { qty: 5, unitCents: 12000 },
          ],
        },
      ],
    },
    keywords: ["giant check", "presentation cheque", "big check", "ceremony check", "donation check", "oversized cheque"],
    tags: ["event", "corporate", "charity", "ceremony"],
  },

  // ── Welcome Sign Board ──
  {
    name: "Welcome Sign Board",
    slug: "welcome-sign-board",
    pricingUnit: "per_piece",
    basePrice: 4500,
    sortOrder: 63,
    description:
      "Custom welcome signs that set the tone the moment guests arrive. " +
      "Weddings (\"Welcome to the Smith Wedding\"), baby showers (\"Oh Baby!\"), bridal showers, engagement parties, " +
      "birthday celebrations, baptisms, bar/bat mitzvahs, anniversary dinners, holiday open houses, " +
      "corporate events, store grand openings, and open houses. " +
      "Choose from arch, rectangle, or rounded shapes. Printed on premium foam board with optional easel stand. " +
      "Seasonal themes available: spring florals, autumn leaves, winter snowflakes, summer tropical, " +
      "Christmas, Diwali, Eid, Lunar New Year, Valentine's Day, and more.",
    minWidthIn: 16,
    minHeightIn: 20,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2" + Easel' },
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "acrylic_3mm", label: "Acrylic 3mm (Premium)" },
        { value: "pvc_4mm", label: "PVC 4mm (Outdoor)" },
      ],
      sizes: [
        {
          label: '16×20"',
          widthIn: 16, heightIn: 20,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 3, unitCents: 3800 },
            { qty: 5, unitCents: 3200 },
          ],
        },
        {
          label: '18×24"',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 3, unitCents: 4500 },
            { qty: 5, unitCents: 3800 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 3, unitCents: 7000 },
            { qty: 5, unitCents: 6000 },
          ],
        },
      ],
    },
    keywords: ["welcome sign", "event welcome", "wedding sign", "baby shower sign", "party sign"],
    tags: ["event", "wedding", "baby-shower", "birthday", "holiday"],
  },

  // ── Seating Chart Board ──
  {
    name: "Seating Chart Board",
    slug: "seating-chart-board",
    pricingUnit: "per_piece",
    basePrice: 6000,
    sortOrder: 64,
    description:
      "Elegant seating chart displays for weddings, galas, and formal dinners. " +
      "Upload your design or use our templates — we print on premium foam board, acrylic, or PVC " +
      "with crisp, easy-to-read text. Pair with an easel stand for a stunning reception centrepiece. " +
      "Also great for classroom seating, conference table assignments, and corporate event layouts. " +
      "Popular themes: rustic wood, greenery botanical, minimalist modern, gold calligraphy, and vintage floral.",
    minWidthIn: 18,
    minHeightIn: 24,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2" + Easel' },
        { value: "acrylic_3mm", label: "Acrylic 3mm (Premium)" },
        { value: "pvc_3mm", label: "PVC 3mm" },
      ],
      sizes: [
        {
          label: '18×24"',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 6000 },
            { qty: 3, unitCents: 5000 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 9000 },
            { qty: 3, unitCents: 7500 },
          ],
        },
        {
          label: '36×48"',
          widthIn: 36, heightIn: 48,
          tiers: [
            { qty: 1, unitCents: 14000 },
            { qty: 3, unitCents: 12000 },
          ],
        },
      ],
    },
    keywords: ["seating chart", "wedding seating", "table plan", "reception chart"],
    tags: ["event", "wedding", "formal"],
  },

  // ── Event Celebration Board ──
  {
    name: "Celebration & Milestone Board",
    slug: "event-celebration-board",
    pricingUnit: "per_piece",
    basePrice: 4000,
    sortOrder: 65,
    description:
      "Custom celebration boards for life's big moments. " +
      "Birthdays (1st birthday milestones, Sweet 16, 30th/40th/50th with photo timelines), " +
      "graduations (\"Class of 2026\" with school colours and photos), " +
      "baby showers (gender reveal, baby stats, name announcement), " +
      "retirements (career timeline, farewell messages), " +
      "anniversaries (then-and-now photo boards), " +
      "and seasonal celebrations (Christmas, Easter, Thanksgiving, Mother's Day, Father's Day). " +
      "Foam board with optional easel or wall-mount. Send us your photos and we'll design the layout, " +
      "or upload your own finished artwork.",
    minWidthIn: 11,
    minHeightIn: 14,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "foamboard_1_2", label: 'Foamboard 1/2" + Easel' },
      ],
      sizes: [
        {
          label: '11×14"',
          widthIn: 11, heightIn: 14,
          tiers: [
            { qty: 1, unitCents: 4000 },
            { qty: 3, unitCents: 3200 },
            { qty: 5, unitCents: 2800 },
          ],
        },
        {
          label: '16×20"',
          widthIn: 16, heightIn: 20,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 3, unitCents: 4500 },
            { qty: 5, unitCents: 3800 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 9500 },
            { qty: 3, unitCents: 8000 },
            { qty: 5, unitCents: 7000 },
          ],
        },
      ],
    },
    keywords: ["celebration board", "milestone board", "birthday board", "graduation board", "retirement board"],
    tags: ["event", "birthday", "graduation", "baby-shower", "retirement", "holiday"],
  },

  // ── Memorial / Tribute Board ──
  {
    name: "Memorial & Tribute Board",
    slug: "memorial-tribute-board",
    pricingUnit: "per_piece",
    basePrice: 5500,
    sortOrder: 66,
    description:
      "Honouring a life lived — custom memorial photo boards for funerals, celebrations of life, " +
      "remembrance services, and tribute displays. Print a photo collage, timeline, or single portrait " +
      "on premium foam board with a dignified finish. " +
      "Also used for veteran tributes, pet memorials, and community remembrance walls. " +
      "Rush turnaround available — we understand these moments don't wait. " +
      "Includes optional black or white easel stand.",
    minWidthIn: 16,
    minHeightIn: 20,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2" + Easel' },
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
      ],
      sizes: [
        {
          label: '16×20"',
          widthIn: 16, heightIn: 20,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 3, unitCents: 4500 },
          ],
        },
        {
          label: '20×30"',
          widthIn: 20, heightIn: 30,
          tiers: [
            { qty: 1, unitCents: 7500 },
            { qty: 3, unitCents: 6200 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 10000 },
            { qty: 3, unitCents: 8500 },
          ],
        },
      ],
    },
    keywords: ["memorial board", "tribute board", "funeral photo board", "celebration of life", "remembrance"],
    tags: ["event", "memorial", "tribute"],
  },

  // ── Photo Collage Board ──
  {
    name: "Photo Collage Board",
    slug: "photo-collage-board",
    pricingUnit: "per_piece",
    basePrice: 5000,
    sortOrder: 67,
    description:
      "A collage of your favourite photos printed on a single rigid board — " +
      "the centrepiece for graduation parties, anniversary celebrations, retirement send-offs, " +
      "memorial displays, baby first-year timelines, and family reunions. " +
      "Send us 10-50 photos and we'll arrange them beautifully, or upload your own collage design. " +
      "Printed on premium foam board with vivid, colour-accurate UV ink. " +
      "Also popular as a permanent home décor piece — kitchen gallery wall, nursery art, or dorm room display.",
    minWidthIn: 11,
    minHeightIn: 14,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "foamboard_1_2", label: 'Foamboard 1/2"' },
        { value: "gatorboard_3_16", label: 'Gator Board 3/16" (Premium)' },
      ],
      sizes: [
        {
          label: '11×14"',
          widthIn: 11, heightIn: 14,
          tiers: [
            { qty: 1, unitCents: 5000 },
            { qty: 3, unitCents: 4000 },
            { qty: 5, unitCents: 3500 },
          ],
        },
        {
          label: '16×20"',
          widthIn: 16, heightIn: 20,
          tiers: [
            { qty: 1, unitCents: 6500 },
            { qty: 3, unitCents: 5500 },
            { qty: 5, unitCents: 4800 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 10500 },
            { qty: 3, unitCents: 9000 },
            { qty: 5, unitCents: 7800 },
          ],
        },
      ],
    },
    keywords: ["photo collage", "photo board", "collage print", "photo display board", "memory board"],
    tags: ["event", "home-decor", "birthday", "graduation", "memorial"],
  },

  // ── Event Photo Backdrop ──
  {
    name: "Photo Backdrop Board",
    slug: "event-photo-backdrop",
    pricingUnit: "per_piece",
    basePrice: 15000,
    sortOrder: 68,
    description:
      "Large rigid backdrop boards for photo stations at events — step-and-repeat logos, " +
      "themed scenery, branded selfie walls, and social media photo spots. " +
      "Weddings (floral wall, greenery backdrop), birthday parties (balloon arch backdrop), " +
      "corporate events (logo repeat wall), product launches, store openings, " +
      "holiday parties (Christmas, Halloween, Lunar New Year themed backdrops), " +
      "and trade show booths. " +
      "Printed on rigid foam board, coroplast, or PVC — freestanding with support legs " +
      "or wall-mounted. Can be assembled from multiple panels for extra-large installations. " +
      "Reusable season after season with proper storage.",
    minWidthIn: 36,
    minHeightIn: 48,
    maxWidthIn: 96,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Indoor)' },
        { value: "coroplast_6mm", label: "Coroplast 6mm (Indoor/Outdoor)" },
        { value: "pvc_4mm", label: "PVC 4mm (Premium Outdoor)" },
      ],
      sizes: [
        {
          label: "4×6 ft (48×72)",
          widthIn: 48, heightIn: 72,
          tiers: [
            { qty: 1, unitCents: 15000 },
            { qty: 3, unitCents: 12500 },
          ],
        },
        {
          label: "4×8 ft (48×96)",
          widthIn: 48, heightIn: 96,
          tiers: [
            { qty: 1, unitCents: 19500 },
            { qty: 3, unitCents: 16500 },
          ],
        },
        {
          label: "8×8 ft (96×96) — 2 panels",
          widthIn: 96, heightIn: 96,
          tiers: [
            { qty: 1, unitCents: 35000 },
            { qty: 3, unitCents: 30000 },
          ],
        },
      ],
    },
    keywords: ["photo backdrop", "backdrop board", "selfie wall", "step and repeat", "event backdrop", "photo wall"],
    tags: ["event", "wedding", "corporate", "photo-op", "trade-show"],
  },

  // ── Handheld Photo Prop Board ──
  {
    name: "Handheld Photo Prop Board",
    slug: "handheld-prop-board",
    pricingUnit: "per_piece",
    basePrice: 2000,
    sortOrder: 69,
    description:
      "Fun handheld photo props for guests to pose with — speech bubbles (\"I Do!\", \"Best Day Ever!\"), " +
      "emojis, hashtags, arrows (\"The Bride →\"), moustaches, lips, crowns, and custom shapes. " +
      "Weddings, birthday parties, baby showers, graduation parties, corporate team events, " +
      "photo booths, holiday gatherings (\"Ho Ho Ho!\", \"Happy New Year 2026!\"), " +
      "and brand activations. " +
      "Printed on foam board or coroplast and contour-cut to shape with a handle or stick. " +
      "Order a full set of 10-20 different props to outfit an entire photo station. " +
      "Lightweight enough for kids and seniors to hold comfortably.",
    minWidthIn: 6,
    minHeightIn: 6,
    maxWidthIn: 24,
    maxHeightIn: 24,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
      ],
      sizes: [
        {
          label: "Small Prop (8×8)",
          widthIn: 8, heightIn: 8,
          tiers: [
            { qty: 1, unitCents: 2000 },
            { qty: 5, unitCents: 1200 },
            { qty: 10, unitCents: 900 },
            { qty: 20, unitCents: 700 },
          ],
        },
        {
          label: "Medium Prop (12×12)",
          widthIn: 12, heightIn: 12,
          tiers: [
            { qty: 1, unitCents: 3000 },
            { qty: 5, unitCents: 2000 },
            { qty: 10, unitCents: 1500 },
            { qty: 20, unitCents: 1200 },
          ],
        },
        {
          label: "Large Prop (18×18)",
          widthIn: 18, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 5, unitCents: 3200 },
            { qty: 10, unitCents: 2500 },
            { qty: 20, unitCents: 2000 },
          ],
        },
      ],
    },
    keywords: ["photo prop", "prop board", "photo booth prop", "speech bubble", "handheld prop", "party prop"],
    tags: ["event", "wedding", "birthday", "photo-op", "contour-cut"],
  },

  // ── Custom Dry-Erase Board ──
  {
    name: "Custom Dry-Erase Board",
    slug: "dry-erase-rigid-board",
    pricingUnit: "per_piece",
    basePrice: 6000,
    sortOrder: 70,
    description:
      "Reusable dry-erase boards with your custom design permanently printed underneath — " +
      "write, wipe, repeat. Perfect for restaurant menus that change daily, café specials boards, " +
      "office to-do boards with company branding, classroom schedules, gym workout trackers, " +
      "event schedule boards, and trade show lead capture boards. " +
      "Printed on rigid PVC with a dry-erase laminate surface. " +
      "Works with standard dry-erase markers. Cleans easily with a dry cloth. " +
      "Also available as a magnetic dry-erase option for fridge or filing cabinet mounting.",
    minWidthIn: 8,
    minHeightIn: 10,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "pvc_4mm", label: "PVC 4mm + Dry-Erase Laminate" },
        { value: "pvc_3mm", label: "PVC 3mm + Dry-Erase Laminate" },
      ],
      sizes: [
        {
          label: '8.5×11" (Letter)',
          widthIn: 8.5, heightIn: 11,
          tiers: [
            { qty: 1, unitCents: 6000 },
            { qty: 5, unitCents: 4500 },
            { qty: 10, unitCents: 3800 },
          ],
        },
        {
          label: '11×17" (Tabloid)',
          widthIn: 11, heightIn: 17,
          tiers: [
            { qty: 1, unitCents: 8000 },
            { qty: 5, unitCents: 6500 },
            { qty: 10, unitCents: 5500 },
          ],
        },
        {
          label: '18×24"',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 12000 },
            { qty: 5, unitCents: 10000 },
            { qty: 10, unitCents: 8500 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 18000 },
            { qty: 5, unitCents: 15000 },
            { qty: 10, unitCents: 13000 },
          ],
        },
      ],
    },
    keywords: ["dry erase", "whiteboard", "reusable sign", "menu board", "dry erase board"],
    tags: ["restaurant", "office", "reusable", "corporate"],
  },

  // ── Floor Standup Display ──
  {
    name: "Floor Standup Display",
    slug: "floor-standup-display",
    pricingUnit: "per_piece",
    basePrice: 7500,
    sortOrder: 71,
    description:
      "Self-standing floor displays with a built-in fold-out easel — no wall, no frame, no hardware. " +
      "Place them in store entrances, restaurant lobbies, hotel corridors, trade show aisles, " +
      "church foyers, or event venues. " +
      "Retail promotions, directional info, welcome messages, menu displays, event schedules, " +
      "product features, and brand storytelling. " +
      "Holiday themes work great: Valentine's Day promotions, Back-to-School sales, " +
      "Black Friday doorbusters, Christmas gift guides. " +
      "Printed on thick foam board or PVC with integrated stand. Folds flat for easy storage and transport.",
    minWidthIn: 18,
    minHeightIn: 24,
    maxWidthIn: 36,
    maxHeightIn: 72,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Indoor)' },
        { value: "pvc_4mm", label: "PVC 4mm (Durable)" },
        { value: "coroplast_6mm", label: "Coroplast 6mm (Lightweight)" },
      ],
      sizes: [
        {
          label: "18×24 Floor Standup",
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 7500 },
            { qty: 3, unitCents: 6200 },
            { qty: 5, unitCents: 5500 },
          ],
        },
        {
          label: "24×48 Floor Standup",
          widthIn: 24, heightIn: 48,
          tiers: [
            { qty: 1, unitCents: 12000 },
            { qty: 3, unitCents: 10000 },
            { qty: 5, unitCents: 8800 },
          ],
        },
        {
          label: "36×72 Floor Standup (Tall)",
          widthIn: 36, heightIn: 72,
          tiers: [
            { qty: 1, unitCents: 18000 },
            { qty: 3, unitCents: 15500 },
            { qty: 5, unitCents: 13500 },
          ],
        },
      ],
    },
    keywords: ["floor standup", "floor display", "standup sign", "freestanding sign", "floor sign"],
    tags: ["retail", "event", "restaurant", "corporate"],
  },
];

// ─── Step 3: Update existing product descriptions ─────────

const DESCRIPTION_UPDATES = [
  {
    slug: "photo-board",
    description:
      "Custom photo prints mounted on rigid foam board — sharp, vivid, and ready to display. " +
      "Weddings (engagement photo display, guest memory wall), birthday parties (photo timeline boards), " +
      "graduations (\"Through the Years\" collage), baby showers (ultrasound & family photos), " +
      "funerals & celebrations of life, corporate events (team photos, achievement walls), " +
      "and home décor (family portraits, vacation memories, nursery art). " +
      "Lightweight and easy to hang or prop on an easel. Gloss or matte lamination available for protection.",
    keywords: ["photo board", "photo print", "foam board photo", "photo display", "memorial board", "wedding photos"],
    tags: ["event", "wedding", "home-decor", "memorial", "birthday"],
  },
  {
    slug: "handheld-sign",
    description:
      "Lightweight handheld signs — grab, hold, and get noticed. " +
      "Rallies and marches (protest signs, solidarity messages), sports events (Go Team! signs), " +
      "parades, trade shows (product promos), concerts, bridal party entrance signs, " +
      "photo booth props (\"Cheers!\", \"Best Day Ever!\"), picket lines, and cheering sections. " +
      "Also used for directional signage at outdoor festivals, queues, and parking lots. " +
      "Printed on foam board or coroplast — lightweight enough to hold overhead for hours.",
    keywords: ["handheld sign", "protest sign", "rally sign", "cheer sign", "hand held board"],
    tags: ["event", "rally", "sports", "photo-op"],
  },
  {
    slug: "custom-foam-board",
    description:
      "Indoor foam board signage for any purpose — POP displays that turn browsers into buyers, " +
      "trade show booth graphics that draw a crowd, presentation boards that impress the boardroom, " +
      "school science fair displays, art exhibition mounts, retail sale announcements, " +
      "restaurant daily specials, and real estate listing info boards. " +
      "Full-colour UV print on rigid foam board with optional PVC (Sintra) upgrade for extra durability. " +
      "Lightweight enough to hang with Command Strips, sturdy enough to lean on an easel.",
    keywords: ["foam board sign", "custom foam board", "display sign", "POP display", "trade show board"],
    tags: ["retail", "corporate", "trade-show", "school"],
  },
  {
    slug: "foam-board-prints",
    description:
      "Full-colour prints mounted on rigid foam board — lightweight, affordable, and versatile. " +
      "Presentations, office décor, classroom visuals, art reproductions, architectural renderings, " +
      "trade show graphics, retail displays, and event signage. " +
      "Perfect for temporary installations that still need to look polished. " +
      "Available in 3/16\" (lightweight) or 1/2\" (self-supporting) thickness. " +
      "Pair with an easel for a clean, professional tabletop display.",
    keywords: ["foam board print", "mounted print", "board print", "presentation board"],
    tags: ["corporate", "school", "art", "retail"],
  },
  {
    slug: "foam-board-easel",
    description:
      "Self-standing foam board sign with integrated easel back — set it down and it stands on its own. " +
      "Perfect for reception desks (\"Welcome!\"), restaurant counters (daily specials), " +
      "retail checkout counters (\"Ask about our loyalty program!\"), " +
      "wedding welcome tables, baby shower gift tables, open house listings, " +
      "conference registration desks, and hotel lobby directories. " +
      "1/2\" thick foam board for stability. Folds flat for storage between uses.",
    keywords: ["foam board easel", "tabletop sign", "counter sign", "welcome sign", "easel display"],
    tags: ["retail", "event", "wedding", "restaurant"],
  },
  {
    slug: "a-frame-sandwich-board",
    description:
      "Sidewalk A-frame with two printed coroplast inserts — double-sided visibility that catches " +
      "foot traffic from both directions. Restaurants (\"Lunch Special $9.99\"), cafés (\"Fresh Brewed!\"), " +
      "salons (\"Walk-Ins Welcome\"), boutiques (\"Sale Inside\"), real estate open houses, " +
      "event directional signs, farmer's markets, and seasonal promotions. " +
      "Weather-resistant coroplast inserts slide in and out — swap them for holidays, new promos, or seasonal menus. " +
      "Sturdy enough for wind, light enough to carry inside at closing time.",
    keywords: ["a-frame sign", "sandwich board", "sidewalk sign", "restaurant sign", "cafe sign"],
    tags: ["retail", "restaurant", "outdoor"],
  },
  {
    slug: "election-campaign-sign",
    description:
      "Political and campaign lawn signs that build name recognition one yard at a time. " +
      "Municipal elections, school board races, provincial/federal campaigns, referendum initiatives, " +
      "union elections, HOA votes, and student council elections. " +
      "Bold full-colour print on durable corrugated plastic (coroplast) — weather-proof and fade-resistant. " +
      "Bulk pricing starts at 25 units because campaigns need volume. Fast turnaround for tight election cycles. " +
      "Also available with H-frame wire stakes (sold separately or bundled).",
    keywords: ["election sign", "campaign sign", "political sign", "vote sign", "lawn sign"],
    tags: ["election", "campaign", "outdoor"],
  },
  {
    slug: "yard-sign",
    description:
      "The classic corrugated plastic yard sign — seen on every other lawn during open house season, " +
      "election week, and graduation month. Single or double-sided full-colour print on weather-tough coroplast. " +
      "Real estate listings, garage sale announcements, birthday celebrations (\"Honk! It's my birthday!\"), " +
      "graduation yard signs (\"Congrats Class of 2026!\"), baby announcements (\"It's a Girl!\"), " +
      "contractor jobsite signs, church event promos, and community event directions. " +
      "Lasts months outdoors in Canadian weather. Pairs with our H-frame wire stakes.",
    keywords: ["yard sign", "lawn sign", "coroplast sign", "outdoor sign", "garage sale sign"],
    tags: ["outdoor", "real-estate", "event", "birthday", "graduation"],
  },
  {
    slug: "real-estate-sign",
    description:
      "Professional real estate signs built to sell — literally. For sale, sold, open house, exclusive listing, " +
      "coming soon, and price reduced. Heavy-duty 6mm or 10mm coroplast stands up to rain, snow, and UV. " +
      "Standard sizes fit all major real estate frames (not included). " +
      "Brokerage branding, agent photo, QR code to listing, and phone number — " +
      "everything a buyer needs to take the next step. " +
      "Also available in aluminum composite (ACM) for premium, permanent installations. " +
      "Volume discounts for teams and brokerages ordering 10+ signs.",
    keywords: ["real estate sign", "for sale sign", "open house sign", "realtor sign", "property sign"],
    tags: ["real-estate", "outdoor"],
  },
  {
    slug: "acrylic-signs",
    description:
      "Custom printed acrylic signs — clean, modern, and unmistakably premium. " +
      "Office door nameplates, lobby directories, reception logos, restroom signs, room numbers, " +
      "retail brand displays, restaurant table numbers, wedding table numbers, " +
      "and museum/gallery labels. " +
      "Available in clear (see-through elegance) or frosted (diffused, sophisticated look). " +
      "UV-printed directly on acrylic for scratch-resistant, fade-proof graphics. " +
      "Pair with our stainless steel standoff hardware for a floating wall-mount effect.",
    keywords: ["acrylic sign", "plexiglass sign", "clear sign", "office sign", "lobby sign"],
    tags: ["corporate", "retail", "premium"],
  },
  {
    slug: "menu-boards",
    description:
      "Rigid menu boards that make your food look as good as it tastes. " +
      "Restaurants, cafés, food trucks, bakeries, ice cream shops, smoothie bars, and catering companies. " +
      "Print your full menu, daily specials, or seasonal offerings on foam board, PVC, or acrylic. " +
      "Mount on the wall, prop on a counter easel, or hang from the ceiling. " +
      "Seasonal menus for patio season, holiday specials (Thanksgiving prix fixe, Valentine's dinner), " +
      "and rotating craft beer/cocktail lists. Easy to swap — just order a new board when the menu changes.",
    keywords: ["menu board", "restaurant menu", "food menu sign", "cafe menu", "menu sign"],
    tags: ["restaurant", "food-truck", "retail"],
  },
];

// ─── Placeholder images ─────────────────────────────────────

const placeholders = {
  "selfie-frame-board": "https://placehold.co/400x400/fd79a8/ffffff/png?text=Selfie+Frame",
  "life-size-cutout": "https://placehold.co/400x400/6c5ce7/ffffff/png?text=Life-Size+Cutout",
  "giant-presentation-check": "https://placehold.co/400x400/00b894/ffffff/png?text=Giant+Cheque",
  "welcome-sign-board": "https://placehold.co/400x400/e17055/ffffff/png?text=Welcome+Sign",
  "seating-chart-board": "https://placehold.co/400x400/a29bfe/333333/png?text=Seating+Chart",
  "event-celebration-board": "https://placehold.co/400x400/ffeaa7/333333/png?text=Celebration",
  "memorial-tribute-board": "https://placehold.co/400x400/636e72/ffffff/png?text=Memorial+Board",
  "photo-collage-board": "https://placehold.co/400x400/74b9ff/333333/png?text=Photo+Collage",
  "event-photo-backdrop": "https://placehold.co/400x400/2d3436/ffffff/png?text=Photo+Backdrop",
  "handheld-prop-board": "https://placehold.co/400x400/fdcb6e/333333/png?text=Photo+Props",
  "dry-erase-rigid-board": "https://placehold.co/400x400/dfe6e9/333333/png?text=Dry+Erase",
  "floor-standup-display": "https://placehold.co/400x400/0984e3/ffffff/png?text=Floor+Standup",
};

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("── Signs & Rigid Boards v2: event boards + rich descriptions ──\n");

  // Step 1: Update pricing preset
  const preset = await updatePreset();
  if (!preset) return;

  // Step 2: Create new event board products
  console.log("\nStep 2: Create event-boards products\n");
  let created = 0;
  let skipped = 0;

  for (const p of EVENT_PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) {
      // Still update the description if it exists
      if (exists.category !== CATEGORY) {
        await prisma.product.update({
          where: { slug: p.slug },
          data: { category: CATEGORY },
        });
        console.log(`  Re-categorized: ${p.slug}`);
      } else {
        console.log(`  Skip: ${p.slug} (exists)`);
      }
      skipped++;
      continue;
    }

    const imgUrl = placeholders[p.slug] || `https://placehold.co/400x400/png?text=${encodeURIComponent(p.name.slice(0, 20))}`;
    const { sortOrder, keywords, tags, ...fields } = p;

    await prisma.product.create({
      data: {
        ...SHARED,
        ...fields,
        sortOrder,
        keywords: keywords || [],
        tags: tags || [],
        isActive: true,
        pricingPresetId: preset.id,
        images: {
          create: [{ url: imgUrl, alt: p.name, sortOrder: 0 }],
        },
      },
    });
    console.log(`  Created: ${p.name}`);
    created++;
  }

  // Step 3: Update existing product descriptions
  console.log("\nStep 3: Update existing product descriptions\n");
  let updated = 0;

  for (const u of DESCRIPTION_UPDATES) {
    const exists = await prisma.product.findUnique({ where: { slug: u.slug } });
    if (!exists) {
      console.log(`  Not found: ${u.slug} — skip`);
      continue;
    }

    const data = { description: u.description };
    if (u.keywords) data.keywords = u.keywords;
    if (u.tags) data.tags = u.tags;

    await prisma.product.update({
      where: { slug: u.slug },
      data,
    });
    console.log(`  Updated: ${u.slug}`);
    updated++;
  }

  // ─── Summary ──
  console.log(`\n── Summary ──`);
  console.log(`  Preset: PVC 4mm added`);
  console.log(`  New products created: ${created}`);
  console.log(`  Existing skipped: ${skipped}`);
  console.log(`  Descriptions updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
