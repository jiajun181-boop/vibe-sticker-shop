#!/usr/bin/env node
/**
 * Signs & Rigid Boards — v3: Tier 1 + Tier 2 expansion.
 *
 * Tier 1: Real estate riders, face-in-hole boards, QR code signs, address signs
 * Tier 2: Tri-fold boards, business hours signs, open house kits, ADA/braille signs
 *
 * Run: node scripts/seed-rigid-boards-v3.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRINT_FORMATS = ["ai", "pdf", "eps", "tiff", "jpg", "png"];
const CATEGORY = "signs-rigid-boards";

const SHARED = {
  category: CATEGORY,
  type: "sign",
  acceptedFormats: PRINT_FORMATS,
  minDpi: 150,
  requiresBleed: true,
  bleedIn: 0.125,
};

// ─── Tier 1 Products ─────────────────────────────────────

const TIER1 = [
  // ── Real Estate Riders ──
  {
    name: "Real Estate Rider Signs",
    slug: "real-estate-riders",
    pricingUnit: "per_piece",
    basePrice: 1500,
    sortOrder: 13,
    description:
      "Small rider signs that attach above or below your main real estate sign — swap the message without replacing the whole sign. " +
      "\"Just Listed\", \"Open House Sunday 1-4\", \"Sold!\", \"Sold Over Asking!\", \"Price Reduced\", " +
      "\"Coming Soon\", \"New Price\", \"Virtual Tour Available\", \"By Appointment Only\", " +
      "\"For Lease\", \"Model Home Open\", and custom agent branding riders. " +
      "Printed on heavy-duty coroplast or aluminum composite. Pre-drilled holes for standard real estate frames. " +
      "Order in bulk — most agents keep a stack of 10-20 riders in their trunk for quick sign updates. " +
      "Also available as double-sided for corner lot visibility.",
    minWidthIn: 6,
    minHeightIn: 18,
    maxWidthIn: 8,
    maxHeightIn: 30,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
        { value: "aluminum_composite", label: "Aluminum Composite (ACM)" },
      ],
      sizes: [
        {
          label: '6×24" Rider',
          widthIn: 6, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 1500 },
            { qty: 5, unitCents: 1000 },
            { qty: 10, unitCents: 800 },
            { qty: 25, unitCents: 650 },
            { qty: 50, unitCents: 550 },
          ],
        },
        {
          label: '6×18" Rider',
          widthIn: 6, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 1200 },
            { qty: 5, unitCents: 850 },
            { qty: 10, unitCents: 700 },
            { qty: 25, unitCents: 575 },
            { qty: 50, unitCents: 500 },
          ],
        },
        {
          label: '8×30" Rider (Large)',
          widthIn: 8, heightIn: 30,
          tiers: [
            { qty: 1, unitCents: 2000 },
            { qty: 5, unitCents: 1400 },
            { qty: 10, unitCents: 1100 },
            { qty: 25, unitCents: 900 },
          ],
        },
      ],
    },
    keywords: ["real estate rider", "sign rider", "rider sign", "just listed", "sold sign", "open house rider", "sign topper"],
    tags: ["real-estate", "outdoor", "bulk"],
  },

  // ── Face-in-Hole Board ──
  {
    name: "Face-in-Hole Photo Board",
    slug: "face-in-hole-board",
    pricingUnit: "per_piece",
    basePrice: 12000,
    sortOrder: 72,
    description:
      "The classic face-in-hole photo board — paint a scene, cut out the faces, and let guests become the characters. " +
      "Amusement parks (cowboy/astronaut/superhero cutouts), festivals, carnivals, " +
      "corporate team-building (\"Our CEO of the Year!\"), school fun fairs, " +
      "Christmas parties (Santa & Elf), Halloween (Frankenstein & Bride), " +
      "Lunar New Year (zodiac animal scenes), Canada Day, Thanksgiving, " +
      "sports events (put your head on a hockey player's body), " +
      "wedding photo stations (bride & groom caricature), baby showers (stork delivery scene), " +
      "and zoo/aquarium gift shops. " +
      "Printed on thick 1/2\" foam board or 6mm coroplast with precision-cut face openings. " +
      "Freestanding with fold-out support legs. Designed to withstand hundreds of photo ops per event. " +
      "We print at full size — you just upload the artwork with face positions marked.",
    minWidthIn: 36,
    minHeightIn: 48,
    maxWidthIn: 72,
    maxHeightIn: 84,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Indoor)' },
        { value: "coroplast_6mm", label: "Coroplast 6mm (Outdoor)" },
        { value: "pvc_4mm", label: "PVC 4mm (Premium Outdoor)" },
      ],
      sizes: [
        {
          label: "4×5 ft (48×60) — 1-2 Face Holes",
          widthIn: 48, heightIn: 60,
          tiers: [
            { qty: 1, unitCents: 12000 },
            { qty: 3, unitCents: 10000 },
            { qty: 5, unitCents: 8800 },
          ],
        },
        {
          label: "5×6 ft (60×72) — 2-3 Face Holes",
          widthIn: 60, heightIn: 72,
          tiers: [
            { qty: 1, unitCents: 16500 },
            { qty: 3, unitCents: 14000 },
            { qty: 5, unitCents: 12500 },
          ],
        },
        {
          label: "6×7 ft (72×84) — 2-4 Face Holes",
          widthIn: 72, heightIn: 84,
          tiers: [
            { qty: 1, unitCents: 22000 },
            { qty: 3, unitCents: 19000 },
            { qty: 5, unitCents: 17000 },
          ],
        },
      ],
    },
    keywords: ["face in hole", "face cutout board", "photo op board", "head in hole", "photo stand in", "carnival cutout"],
    tags: ["event", "photo-op", "festival", "holiday", "contour-cut"],
  },

  // ── QR Code Signs ──
  {
    name: "QR Code Signs",
    slug: "qr-code-signs",
    pricingUnit: "per_piece",
    basePrice: 3000,
    sortOrder: 50,
    description:
      "Custom rigid signs with a prominent QR code — scan to menu, scan to pay, scan to follow, scan to review. " +
      "Restaurants (touchless menu), cafés (\"Order & Pay Here\"), retail (\"Follow Us on Instagram\"), " +
      "hotels (\"Wi-Fi Login\", \"Room Service Menu\"), salons (\"Book Your Next Appointment\"), " +
      "real estate (\"Virtual Tour\", \"View Listing\"), trade shows (\"Download Our Brochure\"), " +
      "museums (\"Audio Guide\"), gyms (\"Class Schedule\"), and churches (\"Donate Here\"). " +
      "Also used for Google Review collection (\"Love our service? Scan & leave a review!\"), " +
      "Wi-Fi login screens, app downloads, event registration, and digital business cards. " +
      "Printed on PVC or acrylic for permanent installations, or foam board for temporary use. " +
      "We generate the QR code from your URL — or use your existing one.",
    minWidthIn: 4,
    minHeightIn: 4,
    maxWidthIn: 24,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "pvc_4mm", label: "PVC 4mm (Outdoor Durable)" },
        { value: "pvc_3mm", label: "PVC 3mm" },
        { value: "acrylic_3mm", label: "Acrylic 3mm (Premium)" },
        { value: "foamboard_3_16", label: 'Foamboard 3/16" (Temporary)' },
      ],
      sizes: [
        {
          label: '4×6" Table Sign',
          widthIn: 4, heightIn: 6,
          tiers: [
            { qty: 1, unitCents: 3000 },
            { qty: 5, unitCents: 2000 },
            { qty: 10, unitCents: 1500 },
            { qty: 25, unitCents: 1200 },
          ],
        },
        {
          label: '5×7" Counter Sign',
          widthIn: 5, heightIn: 7,
          tiers: [
            { qty: 1, unitCents: 3500 },
            { qty: 5, unitCents: 2400 },
            { qty: 10, unitCents: 1800 },
            { qty: 25, unitCents: 1400 },
          ],
        },
        {
          label: '8.5×11" Wall Sign',
          widthIn: 8.5, heightIn: 11,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 5, unitCents: 3200 },
            { qty: 10, unitCents: 2500 },
            { qty: 25, unitCents: 2000 },
          ],
        },
        {
          label: '12×18" Poster Sign',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 6500 },
            { qty: 5, unitCents: 5000 },
            { qty: 10, unitCents: 4200 },
          ],
        },
      ],
    },
    keywords: ["qr code sign", "qr code menu", "scan to pay", "touchless menu", "qr code display", "scan sign"],
    tags: ["restaurant", "retail", "corporate", "qr-code"],
  },

  // ── Address / House Number Signs ──
  {
    name: "Address & House Number Signs",
    slug: "address-house-number-signs",
    pricingUnit: "per_piece",
    basePrice: 5500,
    sortOrder: 51,
    description:
      "Custom house number and address signs that add curb appeal and help delivery drivers find you. " +
      "Residential homes, condos, townhouses, commercial buildings, offices, warehouses, and rural properties. " +
      "Choose from modern minimalist (floating numbers on acrylic), classic (engraved-look on aluminum), " +
      "rustic (vinyl on stained wood-look PVC), and illuminated styles. " +
      "Materials engineered for permanent outdoor installation — UV-resistant, waterproof, and frost-proof. " +
      "Aluminum composite for maximum durability, acrylic for a sleek modern look, " +
      "or PVC for a cost-effective option that still looks premium. " +
      "Available with pre-drilled mounting holes or adhesive backing. " +
      "Also great for unit numbers in apartment buildings, suite numbers in office towers, " +
      "and lot numbers in industrial parks.",
    minWidthIn: 4,
    minHeightIn: 4,
    maxWidthIn: 24,
    maxHeightIn: 12,
    optionsConfig: {
      materials: [
        { value: "aluminum_composite", label: "Aluminum Composite (ACM)" },
        { value: "acrylic_6mm", label: "Acrylic 6mm (Modern)" },
        { value: "acrylic_3mm", label: "Acrylic 3mm" },
        { value: "pvc_4mm", label: "PVC 4mm (Outdoor)" },
      ],
      sizes: [
        {
          label: '4×8" (Small)',
          widthIn: 4, heightIn: 8,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 3, unitCents: 4500 },
            { qty: 5, unitCents: 3800 },
          ],
        },
        {
          label: '6×12" (Standard)',
          widthIn: 6, heightIn: 12,
          tiers: [
            { qty: 1, unitCents: 7500 },
            { qty: 3, unitCents: 6200 },
            { qty: 5, unitCents: 5500 },
          ],
        },
        {
          label: '8×16" (Large)',
          widthIn: 8, heightIn: 16,
          tiers: [
            { qty: 1, unitCents: 10000 },
            { qty: 3, unitCents: 8500 },
            { qty: 5, unitCents: 7500 },
          ],
        },
        {
          label: '12×24" (XL / Commercial)',
          widthIn: 12, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 15000 },
            { qty: 3, unitCents: 12500 },
            { qty: 5, unitCents: 11000 },
          ],
        },
      ],
    },
    keywords: ["address sign", "house number", "house number sign", "address plaque", "door number", "unit number"],
    tags: ["residential", "outdoor", "permanent", "commercial"],
  },
];

// ─── Tier 2 Products ─────────────────────────────────────

const TIER2 = [
  // ── Tri-Fold Presentation Board ──
  {
    name: "Tri-Fold Presentation Board",
    slug: "tri-fold-presentation-board",
    pricingUnit: "per_piece",
    basePrice: 5500,
    sortOrder: 22,
    description:
      "Self-standing tri-fold display boards — the classic three-panel layout that folds flat for transport and opens wide on a tabletop. " +
      "Science fairs (elementary to university), trade shows, job fairs, school projects, " +
      "art portfolios, research poster sessions, real estate listing presentations, " +
      "corporate training materials, nonprofit fundraising displays, and product demos. " +
      "Full-colour print on all three panels with your custom graphics, charts, photos, and text. " +
      "Printed on foam board (lightweight) or gator board (extra rigid for repeated use). " +
      "Ships flat — folds open in seconds with reinforced hinges. " +
      "Standard sizes fit regulation science fair requirements.",
    minWidthIn: 36,
    minHeightIn: 24,
    maxWidthIn: 48,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Sturdy)' },
        { value: "gatorboard_3_16", label: 'Gator Board 3/16" (Premium)' },
      ],
      sizes: [
        {
          label: '36×48" Tri-Fold (Standard)',
          widthIn: 48, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 3, unitCents: 4500 },
            { qty: 5, unitCents: 3800 },
            { qty: 10, unitCents: 3200 },
          ],
        },
        {
          label: '48×36" Tri-Fold (Wide)',
          widthIn: 48, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 3, unitCents: 4500 },
            { qty: 5, unitCents: 3800 },
            { qty: 10, unitCents: 3200 },
          ],
        },
        {
          label: '40×28" Tri-Fold (Compact)',
          widthIn: 40, heightIn: 28,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 3, unitCents: 3600 },
            { qty: 5, unitCents: 3000 },
            { qty: 10, unitCents: 2600 },
          ],
        },
      ],
    },
    keywords: ["tri-fold board", "presentation board", "science fair board", "trifold display", "project board", "display board"],
    tags: ["school", "trade-show", "corporate", "presentation"],
  },

  // ── Business Hours Sign ──
  {
    name: "Business Hours Sign",
    slug: "business-hours-sign",
    pricingUnit: "per_piece",
    basePrice: 4000,
    sortOrder: 52,
    description:
      "Rigid business hours signs — more durable and professional than a printed sticker on the door. " +
      "Display your store hours, office hours, clinic hours, or restaurant hours on weather-proof material " +
      "that lasts years outdoors. " +
      "Restaurants, retail stores, salons, clinics, dental offices, law firms, auto shops, " +
      "churches, libraries, community centres, and government offices. " +
      "Choose from aluminum composite (permanent outdoor), acrylic (sleek lobby display), " +
      "or PVC (cost-effective outdoor). " +
      "Add your logo, phone number, website, and QR code for Google Maps directions. " +
      "Seasonal hours? Order two signs and swap them — or go with our dry-erase option. " +
      "Pre-drilled mounting holes or adhesive backing included.",
    minWidthIn: 6,
    minHeightIn: 8,
    maxWidthIn: 18,
    maxHeightIn: 24,
    optionsConfig: {
      materials: [
        { value: "aluminum_composite", label: "Aluminum Composite (ACM)" },
        { value: "acrylic_3mm", label: "Acrylic 3mm" },
        { value: "pvc_4mm", label: "PVC 4mm (Outdoor)" },
        { value: "pvc_3mm", label: "PVC 3mm" },
      ],
      sizes: [
        {
          label: '8×10"',
          widthIn: 8, heightIn: 10,
          tiers: [
            { qty: 1, unitCents: 4000 },
            { qty: 3, unitCents: 3200 },
            { qty: 5, unitCents: 2800 },
          ],
        },
        {
          label: '8.5×11" (Letter)',
          widthIn: 8.5, heightIn: 11,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 3, unitCents: 3600 },
            { qty: 5, unitCents: 3000 },
          ],
        },
        {
          label: '12×18"',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 6500 },
            { qty: 3, unitCents: 5200 },
            { qty: 5, unitCents: 4500 },
          ],
        },
      ],
    },
    keywords: ["business hours", "store hours sign", "open hours", "office hours sign", "operating hours", "hours of operation"],
    tags: ["retail", "restaurant", "outdoor", "permanent"],
  },

  // ── Open House Sign Kit ──
  {
    name: "Open House Sign Kit",
    slug: "open-house-sign-kit",
    pricingUnit: "per_piece",
    basePrice: 8500,
    sortOrder: 14,
    description:
      "Everything you need for a successful open house — bundled and ready to go. " +
      "Kit includes: 1 main property sign (18×24\"), 2 directional arrow signs (12×18\"), " +
      "and 2 rider signs (6×24\" — \"Open House\" + \"Sunday 1-4 PM\"). " +
      "All printed on durable 6mm coroplast with H-frame wire stakes included. " +
      "Place directional arrows at key intersections to guide buyers from the main road to the front door. " +
      "Perfect for realtors, property managers, estate sales, and model home tours. " +
      "Save 20% vs. ordering each sign individually. " +
      "Custom branding on every piece — your logo, colours, and contact info. " +
      "Double-sided printing on all signs for maximum visibility.",
    minWidthIn: 12,
    minHeightIn: 18,
    maxWidthIn: 24,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "coroplast_6mm", label: "Coroplast 6mm (Standard)" },
        { value: "coroplast_10mm", label: "Coroplast 10mm (Heavy Duty)" },
      ],
      sizes: [
        {
          label: "Standard Kit (5 signs + stakes)",
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 3, unitCents: 7200 },
            { qty: 5, unitCents: 6500 },
            { qty: 10, unitCents: 5800 },
          ],
        },
        {
          label: "Premium Kit (5 signs + 3 extra arrows)",
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 11500 },
            { qty: 3, unitCents: 9800 },
            { qty: 5, unitCents: 8800 },
            { qty: 10, unitCents: 7800 },
          ],
        },
      ],
    },
    keywords: ["open house kit", "real estate sign kit", "open house signs", "directional signs", "realtor kit", "open house bundle"],
    tags: ["real-estate", "outdoor", "kit", "bundle"],
  },

  // ── ADA / Braille Signs ──
  {
    name: "ADA & Braille Signs",
    slug: "ada-braille-signs",
    pricingUnit: "per_piece",
    basePrice: 6500,
    sortOrder: 53,
    description:
      "ADA-compliant tactile and braille signs — meet accessibility requirements while maintaining your brand's look. " +
      "Restroom signs (Men, Women, All-Gender, Accessible), room numbers, exit signs, " +
      "stairwell floor numbers, elevator signs, conference room names, office nameplates, " +
      "fire evacuation routes, and custom wayfinding signs. " +
      "Raised tactile lettering + Grade 2 Braille per ADA/AODA standards. " +
      "Printed on rigid acrylic or PVC with a photopolymer tactile overlay. " +
      "Required by law in most public, commercial, and institutional buildings in Canada and the US. " +
      "Consistent style across all signs creates a cohesive, professional facility. " +
      "We handle the braille translation — just tell us the text.",
    minWidthIn: 4,
    minHeightIn: 4,
    maxWidthIn: 18,
    maxHeightIn: 18,
    optionsConfig: {
      materials: [
        { value: "acrylic_3mm", label: "Acrylic 3mm (Standard)" },
        { value: "acrylic_6mm", label: "Acrylic 6mm (Premium)" },
        { value: "pvc_3mm", label: "PVC 3mm" },
      ],
      sizes: [
        {
          label: '4×4" (Pictogram Only)',
          widthIn: 4, heightIn: 4,
          tiers: [
            { qty: 1, unitCents: 6500 },
            { qty: 5, unitCents: 5000 },
            { qty: 10, unitCents: 4200 },
            { qty: 25, unitCents: 3500 },
          ],
        },
        {
          label: '6×8" (Standard Room Sign)',
          widthIn: 6, heightIn: 8,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 5, unitCents: 6800 },
            { qty: 10, unitCents: 5800 },
            { qty: 25, unitCents: 4800 },
          ],
        },
        {
          label: '8×10" (Detailed Sign)',
          widthIn: 8, heightIn: 10,
          tiers: [
            { qty: 1, unitCents: 11000 },
            { qty: 5, unitCents: 9000 },
            { qty: 10, unitCents: 7500 },
            { qty: 25, unitCents: 6200 },
          ],
        },
        {
          label: '12×18" (Directional / Evacuation)',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 16000 },
            { qty: 5, unitCents: 13000 },
            { qty: 10, unitCents: 11000 },
          ],
        },
      ],
    },
    keywords: ["ada sign", "braille sign", "tactile sign", "accessible sign", "restroom sign", "aoda sign", "compliance sign"],
    tags: ["compliance", "accessibility", "commercial", "institutional"],
  },
];

const ALL_PRODUCTS = [...TIER1, ...TIER2];

// ─── Placeholder images ─────────────────────────────────────

const placeholders = {
  "real-estate-riders": "https://placehold.co/400x400/d63031/ffffff/png?text=RE+Riders",
  "face-in-hole-board": "https://placehold.co/400x400/6c5ce7/ffffff/png?text=Face+In+Hole",
  "qr-code-signs": "https://placehold.co/400x400/00cec9/333333/png?text=QR+Code+Sign",
  "address-house-number-signs": "https://placehold.co/400x400/2c3e50/ffffff/png?text=Address+Sign",
  "tri-fold-presentation-board": "https://placehold.co/400x400/fdcb6e/333333/png?text=Tri-Fold",
  "business-hours-sign": "https://placehold.co/400x400/0984e3/ffffff/png?text=Hours+Sign",
  "open-house-sign-kit": "https://placehold.co/400x400/e17055/ffffff/png?text=Open+House+Kit",
  "ada-braille-signs": "https://placehold.co/400x400/636e72/ffffff/png?text=ADA+Braille",
};

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("── Signs & Rigid Boards v3: Tier 1 + Tier 2 ──\n");

  const preset = await prisma.pricingPreset.findUnique({ where: { key: "rigid_sheets_default" } });
  if (!preset) {
    console.log("ERROR: rigid_sheets_default preset not found. Run seed-rigid-boards.mjs first.");
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const p of ALL_PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) {
      if (exists.category !== CATEGORY) {
        await prisma.product.update({ where: { slug: p.slug }, data: { category: CATEGORY } });
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

  console.log(`\n── Summary ──`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
