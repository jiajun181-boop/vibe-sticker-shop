#!/usr/bin/env node
/**
 * Signs & Rigid Boards — v4: Fill remaining gaps.
 *
 * Group 1: A-Frames (a-frame-sign-stand, a-frame-double-sided)
 * Group 2: Yard & Lawn (yard-sign-panel-only, directional-arrow-signs, h-stakes)
 * Group 3: Event (backdrop-board)
 * Group 4: Display & Tabletop (rigid-tabletop-signs, tabletop-signs, tags-tickets-rigid, handheld-signs)
 * Group 5: By Material (foam-board, rigid-foam-board-prints, clear-acrylic-signs, frosted-acrylic-signs, aluminum-composite, acm-dibond-signs)
 *
 * Safe to re-run — skips existing slugs (re-categorizes if needed).
 * Run: node scripts/seed-rigid-boards-v4.mjs
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

// ─── Group 1: A-Frames ──────────────────────────────────

const GROUP_AFRAMES = [
  {
    name: "A-Frame Sign Stand",
    slug: "a-frame-sign-stand",
    pricingUnit: "per_piece",
    basePrice: 14900,
    sortOrder: 1,
    description:
      "Portable A-frame sign stands with double-sided coroplast inserts — set them on the sidewalk in the morning, fold flat and bring inside at night. " +
      "Restaurants (daily specials, happy hour menus), cafés (\"Fresh Brewed Coffee →\"), retail stores (sidewalk sale), " +
      "salons (walk-ins welcome), real estate open houses, construction sites (detour/caution), " +
      "churches (event announcements), and farmers' markets. " +
      "Heavy-duty steel or plastic frame with slide-in coroplast panels — swap your message in seconds. " +
      "Wind-resistant design stays upright in moderate breezes. " +
      "Order the frame with inserts, or just the inserts if you already have a frame.",
    minWidthIn: 18,
    minHeightIn: 24,
    maxWidthIn: 24,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm (Heavy Duty)" },
      ],
      sizes: [
        {
          label: '18×24" A-Frame',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 14900 },
            { qty: 2, unitCents: 12900 },
            { qty: 5, unitCents: 10900 },
          ],
        },
        {
          label: '24×36" A-Frame',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 19900 },
            { qty: 2, unitCents: 17500 },
            { qty: 5, unitCents: 14900 },
          ],
        },
      ],
    },
    keywords: ["a-frame sign", "sidewalk sign", "sandwich board", "a frame stand", "portable sign", "folding sign"],
    tags: ["outdoor", "retail", "restaurant", "portable"],
  },
  {
    name: "A-Frame Double-Sided Insert",
    slug: "a-frame-double-sided",
    pricingUnit: "per_piece",
    basePrice: 3500,
    sortOrder: 2,
    description:
      "Replacement double-sided coroplast inserts for standard A-frame sign stands. " +
      "Print a different message on each side, or the same design for consistent branding from both directions. " +
      "Swap inserts seasonally, for daily specials, or whenever your promotion changes — " +
      "keep a library of inserts and rotate them as needed. " +
      "Fits standard 18×24\" and 24×36\" A-frame holders. " +
      "Printed on durable corrugated plastic that withstands rain, sun, and wind.",
    minWidthIn: 18,
    minHeightIn: 24,
    maxWidthIn: 24,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm (Heavy Duty)" },
      ],
      sizes: [
        {
          label: '18×24" Insert (Double-Sided)',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 3500 },
            { qty: 2, unitCents: 2800 },
            { qty: 5, unitCents: 2200 },
            { qty: 10, unitCents: 1800 },
          ],
        },
        {
          label: '24×36" Insert (Double-Sided)',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 2, unitCents: 4500 },
            { qty: 5, unitCents: 3800 },
            { qty: 10, unitCents: 3200 },
          ],
        },
      ],
    },
    keywords: ["a-frame insert", "sandwich board insert", "a frame replacement", "double sided insert", "sign insert"],
    tags: ["outdoor", "replacement", "double-sided"],
  },
];

// ─── Group 2: Yard & Lawn ────────────────────────────────

const GROUP_YARD = [
  {
    name: "Yard Sign Panel Only",
    slug: "yard-sign-panel-only",
    pricingUnit: "per_piece",
    basePrice: 4200,
    sortOrder: 10,
    description:
      "Corrugated plastic (coroplast) yard sign panels — print only, no stake included. " +
      "Perfect when you already have H-stakes or frames, or need panels for window display, wall mounting, or zip-tie attachment to fences. " +
      "Political campaigns, garage sales, open houses, contractor job site signs, " +
      "directional parking signs, and event wayfinding. " +
      "4mm fluted plastic with full-colour UV printing — lightweight, weatherproof, and recyclable. " +
      "Single-sided or double-sided printing available.",
    minWidthIn: 12,
    minHeightIn: 18,
    maxWidthIn: 24,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm (Standard)" },
        { value: "coroplast_6mm", label: "Coroplast 6mm (Heavy Duty)" },
      ],
      sizes: [
        {
          label: '12×18" Panel',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 2500 },
            { qty: 5, unitCents: 1800 },
            { qty: 10, unitCents: 1400 },
            { qty: 25, unitCents: 1100 },
            { qty: 50, unitCents: 900 },
          ],
        },
        {
          label: '18×24" Panel',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 4200 },
            { qty: 5, unitCents: 3200 },
            { qty: 10, unitCents: 2500 },
            { qty: 25, unitCents: 2000 },
            { qty: 50, unitCents: 1600 },
          ],
        },
        {
          label: '24×36" Panel',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 6500 },
            { qty: 5, unitCents: 5000 },
            { qty: 10, unitCents: 4200 },
            { qty: 25, unitCents: 3500 },
          ],
        },
      ],
    },
    keywords: ["yard sign panel", "coroplast panel", "sign panel only", "yard sign no stake", "corrugated sign"],
    tags: ["outdoor", "yard", "coroplast"],
  },
  {
    name: "Directional Arrow Signs",
    slug: "directional-arrow-signs",
    pricingUnit: "per_piece",
    basePrice: 2200,
    sortOrder: 11,
    description:
      "Custom directional arrow signs for guiding traffic, visitors, and customers to the right place. " +
      "Open houses (\"Open House →\"), events (\"Parking ↓\", \"Registration →\"), " +
      "construction sites (\"Detour\"), churches (\"Entrance\"), schools (\"Drop-off Lane →\"), " +
      "and commercial properties (\"Deliveries →\", \"Visitor Parking →\"). " +
      "Printed on coroplast with optional H-stakes for ground mounting. " +
      "Arrow-shaped die-cut or rectangular with printed arrow — your choice. " +
      "Compact 6×18\" for tight spaces or 12×24\" for high visibility.",
    minWidthIn: 6,
    minHeightIn: 18,
    maxWidthIn: 12,
    maxHeightIn: 24,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
      ],
      sizes: [
        {
          label: '6×18" Arrow',
          widthIn: 6, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 2200 },
            { qty: 5, unitCents: 1500 },
            { qty: 10, unitCents: 1100 },
            { qty: 25, unitCents: 850 },
          ],
        },
        {
          label: '12×24" Arrow',
          widthIn: 12, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 3800 },
            { qty: 5, unitCents: 2800 },
            { qty: 10, unitCents: 2200 },
            { qty: 25, unitCents: 1800 },
          ],
        },
      ],
    },
    keywords: ["directional sign", "arrow sign", "wayfinding arrow", "direction sign", "pointing sign"],
    tags: ["outdoor", "directional", "event", "real-estate"],
  },
  {
    // Hardware item — no print specs
    name: "H-Stakes",
    slug: "h-stakes",
    pricingUnit: "per_piece",
    basePrice: 1200,
    sortOrder: 15,
    description:
      "Heavy-duty galvanized wire H-stakes for yard signs and coroplast panels. " +
      "Simply slide the corrugated flutes of your sign over the H-stake and push into the ground — no tools required. " +
      "9-gauge steel wire with rust-resistant galvanized coating. " +
      "Standard 10\" wide × 30\" tall fits 18×24\" and 24×36\" signs. " +
      "Reusable season after season — pull up, store flat, and re-deploy. " +
      "Essential for real estate signs, political campaigns, garage sales, and event wayfinding. " +
      "Order in bulk and always have spares on hand.",
    // Override SHARED — hardware, not a printed sign
    ...(() => {
      const { type, acceptedFormats, minDpi, requiresBleed, bleedIn, ...rest } = SHARED;
      return rest;
    })(),
    type: "other",
    optionsConfig: {
      sizes: [
        {
          label: 'H-Stake 10×30" (Standard)',
          tiers: [
            { qty: 1, unitCents: 1200 },
            { qty: 5, unitCents: 900 },
            { qty: 10, unitCents: 750 },
            { qty: 25, unitCents: 600 },
            { qty: 50, unitCents: 500 },
            { qty: 100, unitCents: 400 },
          ],
        },
      ],
    },
    keywords: ["h-stake", "h stake", "wire stake", "yard sign stake", "sign stake", "ground stake"],
    tags: ["hardware", "yard", "accessory"],
    _skipShared: true, // flag to skip merging SHARED fields
  },
];

// ─── Group 3: Event ──────────────────────────────────────

const GROUP_EVENT = [
  {
    name: "Backdrop Board",
    slug: "backdrop-board",
    pricingUnit: "per_piece",
    basePrice: 8500,
    sortOrder: 70,
    description:
      "Large rigid backdrop boards for events, trade shows, and photo opportunities. " +
      "Step-and-repeat backdrops for galas and red carpet events, branded photo walls for product launches, " +
      "wedding photo stations, birthday party backdrops, graduation photo areas, and corporate event branding. " +
      "Printed on thick foam board or gator board with full-colour graphics. " +
      "Freestanding with fold-out support legs or lean against a wall. " +
      "Available in custom sizes up to 4×8 feet. " +
      "Lightweight enough to transport, rigid enough to stand on its own.",
    minWidthIn: 36,
    minHeightIn: 48,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Standard)' },
        { value: "gatorboard_3_16", label: 'Gator Board 3/16" (Premium)' },
        { value: "coroplast_6mm", label: "Coroplast 6mm (Outdoor)" },
      ],
      sizes: [
        {
          label: '3×5 ft (36×60")',
          widthIn: 36, heightIn: 60,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 2, unitCents: 7200 },
            { qty: 5, unitCents: 6200 },
          ],
        },
        {
          label: '4×6 ft (48×72")',
          widthIn: 48, heightIn: 72,
          tiers: [
            { qty: 1, unitCents: 13500 },
            { qty: 2, unitCents: 11500 },
            { qty: 5, unitCents: 9800 },
          ],
        },
        {
          label: '4×8 ft (48×96")',
          widthIn: 48, heightIn: 96,
          tiers: [
            { qty: 1, unitCents: 17500 },
            { qty: 2, unitCents: 15000 },
            { qty: 5, unitCents: 13000 },
          ],
        },
      ],
    },
    keywords: ["backdrop board", "event backdrop", "photo backdrop", "step and repeat", "photo wall", "event board"],
    tags: ["event", "photo-op", "corporate", "wedding"],
  },
];

// ─── Group 4: Display & Tabletop ─────────────────────────

const GROUP_DISPLAY = [
  {
    name: "Rigid Tabletop Signs",
    slug: "rigid-tabletop-signs",
    pricingUnit: "per_piece",
    basePrice: 3900,
    sortOrder: 30,
    description:
      "Countertop and tabletop signs on rigid substrates for professional point-of-sale and informational displays. " +
      "QR code menus (scan-to-order), pricing displays, promotional offers, " +
      "\"Please Wait to Be Seated\", \"Employees Only\", tip jars, checkout upsells, " +
      "hotel room amenity cards, conference room nameplates, and trade show product info cards. " +
      "Printed on acrylic, PVC, or foam board with an optional easel back for freestanding display. " +
      "Sleek and professional — replaces flimsy paper tent cards with something that lasts.",
    minWidthIn: 4,
    minHeightIn: 4,
    maxWidthIn: 12,
    maxHeightIn: 18,
    optionsConfig: {
      materials: [
        { value: "acrylic_3mm", label: "Acrylic 3mm (Premium)" },
        { value: "pvc_3mm", label: "PVC 3mm" },
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
      ],
      sizes: [
        {
          label: '4×6" Table Card',
          widthIn: 4, heightIn: 6,
          tiers: [
            { qty: 1, unitCents: 3900 },
            { qty: 5, unitCents: 2800 },
            { qty: 10, unitCents: 2200 },
            { qty: 25, unitCents: 1800 },
          ],
        },
        {
          label: '5×7" Counter Sign',
          widthIn: 5, heightIn: 7,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 5, unitCents: 3400 },
            { qty: 10, unitCents: 2700 },
            { qty: 25, unitCents: 2200 },
          ],
        },
        {
          label: '8.5×11" Tabletop Sign',
          widthIn: 8.5, heightIn: 11,
          tiers: [
            { qty: 1, unitCents: 5900 },
            { qty: 5, unitCents: 4500 },
            { qty: 10, unitCents: 3600 },
          ],
        },
      ],
    },
    keywords: ["tabletop sign", "countertop sign", "desk sign", "point of sale sign", "counter display", "easel sign"],
    tags: ["retail", "restaurant", "corporate", "tabletop"],
  },
  {
    name: "Tabletop Signs",
    slug: "tabletop-signs",
    pricingUnit: "per_piece",
    basePrice: 3900,
    sortOrder: 31,
    description:
      "Freestanding counter and tabletop signs for restaurants, hotels, and retail counters. " +
      "QR code menus, promotional offers, daily specials, \"Ask About Our Loyalty Program\", " +
      "Wi-Fi passwords, payment method accepted, and tip suggestions. " +
      "Printed on rigid acrylic or PVC with a built-in easel back — no stand required. " +
      "Compact sizes designed for limited counter space. " +
      "Easy to wipe clean and built to withstand daily handling by staff and customers.",
    minWidthIn: 4,
    minHeightIn: 4,
    maxWidthIn: 12,
    maxHeightIn: 18,
    optionsConfig: {
      materials: [
        { value: "acrylic_3mm", label: "Acrylic 3mm (Premium)" },
        { value: "pvc_3mm", label: "PVC 3mm" },
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
      ],
      sizes: [
        {
          label: '4×6" Table Card',
          widthIn: 4, heightIn: 6,
          tiers: [
            { qty: 1, unitCents: 3900 },
            { qty: 5, unitCents: 2800 },
            { qty: 10, unitCents: 2200 },
            { qty: 25, unitCents: 1800 },
          ],
        },
        {
          label: '5×7" Counter Sign',
          widthIn: 5, heightIn: 7,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 5, unitCents: 3400 },
            { qty: 10, unitCents: 2700 },
            { qty: 25, unitCents: 2200 },
          ],
        },
        {
          label: '8.5×11" Tabletop Sign',
          widthIn: 8.5, heightIn: 11,
          tiers: [
            { qty: 1, unitCents: 5900 },
            { qty: 5, unitCents: 4500 },
            { qty: 10, unitCents: 3600 },
          ],
        },
      ],
    },
    keywords: ["tabletop sign", "table sign", "counter sign", "restaurant sign", "menu sign", "freestanding sign"],
    tags: ["retail", "restaurant", "tabletop"],
  },
  {
    name: "Tags & Tickets (Rigid)",
    slug: "tags-tickets-rigid",
    pricingUnit: "per_piece",
    basePrice: 1500,
    sortOrder: 35,
    description:
      "Rigid printed tags and tickets on thick PVC, foam board, or acrylic for retail pricing, " +
      "event admission, VIP passes, and inventory tracking. " +
      "Clothing store price tags, wine bottle neck tags, gift tags, " +
      "event lanyards with rigid badge inserts, raffle tickets, coat check tags, " +
      "warehouse bin labels, and plant identification stakes. " +
      "Full-colour printing with optional die-cut shapes, rounded corners, and hole punch. " +
      "More durable than paper — won't bend, tear, or smudge.",
    minWidthIn: 2,
    minHeightIn: 3,
    maxWidthIn: 6,
    maxHeightIn: 8,
    optionsConfig: {
      materials: [
        { value: "pvc_3mm", label: "PVC 3mm (Durable)" },
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "acrylic_3mm", label: "Acrylic 3mm (Premium)" },
      ],
      sizes: [
        {
          label: '2×3.5" (Business Card Tag)',
          widthIn: 2, heightIn: 3.5,
          tiers: [
            { qty: 10, unitCents: 1500 },
            { qty: 25, unitCents: 1000 },
            { qty: 50, unitCents: 750 },
            { qty: 100, unitCents: 550 },
          ],
        },
        {
          label: '3×5" (Standard Tag)',
          widthIn: 3, heightIn: 5,
          tiers: [
            { qty: 10, unitCents: 2000 },
            { qty: 25, unitCents: 1400 },
            { qty: 50, unitCents: 1000 },
            { qty: 100, unitCents: 750 },
          ],
        },
        {
          label: '4×6" (Large Tag)',
          widthIn: 4, heightIn: 6,
          tiers: [
            { qty: 10, unitCents: 2800 },
            { qty: 25, unitCents: 2000 },
            { qty: 50, unitCents: 1500 },
            { qty: 100, unitCents: 1100 },
          ],
        },
      ],
    },
    keywords: ["rigid tag", "rigid ticket", "pvc tag", "price tag rigid", "event badge", "rigid label"],
    tags: ["retail", "event", "tags"],
  },
  {
    name: "Handheld Signs",
    slug: "handheld-signs",
    pricingUnit: "per_piece",
    basePrice: 2500,
    sortOrder: 36,
    description:
      "Lightweight handheld signs on foam board or coroplast for events, rallies, queues, and photo ops. " +
      "Trade show booth staff (\"Ask Me About...\"), event check-in (\"Registration →\"), " +
      "crowd control (\"Line Starts Here\"), rallies and marches, sports fans (\"Go Team!\"), " +
      "wedding parties (\"Mr. & Mrs.\"), photo booth props, and classroom activities. " +
      "Full-colour printing with optional wooden or plastic handle attachment. " +
      "Easy to carry and wave — lightweight enough for all-day use.",
    minWidthIn: 8,
    minHeightIn: 8,
    maxWidthIn: 24,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16" (Lightweight)' },
        { value: "coroplast_4mm", label: "Coroplast 4mm (Outdoor)" },
      ],
      sizes: [
        {
          label: '8×10" (Compact)',
          widthIn: 8, heightIn: 10,
          tiers: [
            { qty: 1, unitCents: 2500 },
            { qty: 5, unitCents: 1800 },
            { qty: 10, unitCents: 1400 },
            { qty: 25, unitCents: 1000 },
          ],
        },
        {
          label: '12×18" (Standard)',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 4000 },
            { qty: 5, unitCents: 3000 },
            { qty: 10, unitCents: 2400 },
            { qty: 25, unitCents: 1800 },
          ],
        },
        {
          label: '18×24" (Large)',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 5, unitCents: 4200 },
            { qty: 10, unitCents: 3500 },
          ],
        },
      ],
    },
    keywords: ["handheld sign", "hand held sign", "protest sign", "rally sign", "event sign", "photo prop sign"],
    tags: ["event", "portable", "photo-op"],
  },
];

// ─── Group 5: By Material ────────────────────────────────

const GROUP_MATERIAL = [
  {
    name: "Foam Board",
    slug: "foam-board",
    pricingUnit: "per_sqft",
    basePrice: 1200,
    sortOrder: 40,
    description:
      "Lightweight foam board (foamcore) for indoor displays, presentations, and photo mounting. " +
      "Art shows, galleries, school projects, trade show graphics, retail POP displays, " +
      "office signage, museum exhibits, and architectural model bases. " +
      "Full-colour direct-print or vinyl-applied graphics on smooth white foam core. " +
      "Available in 3/16\" (standard) and 1/2\" (sturdy) thicknesses. " +
      "Custom sizes up to 48×96 inches. " +
      "Easy to cut, lightweight to hang, and cost-effective for large-format indoor graphics.",
    minWidthIn: 8,
    minHeightIn: 8,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16" (Standard)' },
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Sturdy)' },
      ],
    },
    keywords: ["foam board", "foamcore", "foam core", "foam board print", "lightweight sign", "indoor sign"],
    tags: ["indoor", "lightweight", "presentation", "area-pricing"],
  },
  {
    name: "Rigid Foam Board Prints",
    slug: "rigid-foam-board-prints",
    pricingUnit: "per_piece",
    basePrice: 5200,
    sortOrder: 41,
    description:
      "Full-colour prints mounted on rigid foam board — ready to hang or display on an easel. " +
      "Photo prints, posters, infographics, presentation boards, menu boards, " +
      "seating charts, event timelines, and retail promotional displays. " +
      "Direct UV printing on 3/16\" or 1/2\" foam core with vibrant colour reproduction. " +
      "Lightweight enough to hang with adhesive strips, rigid enough to stand on a tabletop easel. " +
      "Available in standard poster sizes or custom dimensions.",
    minWidthIn: 8,
    minHeightIn: 10,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16" (Standard)' },
        { value: "foamboard_1_2", label: 'Foamboard 1/2" (Premium)' },
      ],
      sizes: [
        {
          label: '11×17" (Tabloid)',
          widthIn: 11, heightIn: 17,
          tiers: [
            { qty: 1, unitCents: 3500 },
            { qty: 5, unitCents: 2800 },
            { qty: 10, unitCents: 2200 },
          ],
        },
        {
          label: '18×24" (Small Poster)',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 5200 },
            { qty: 5, unitCents: 4200 },
            { qty: 10, unitCents: 3500 },
          ],
        },
        {
          label: '24×36" (Poster)',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 5, unitCents: 7000 },
            { qty: 10, unitCents: 5800 },
          ],
        },
        {
          label: '36×48" (Large)',
          widthIn: 36, heightIn: 48,
          tiers: [
            { qty: 1, unitCents: 14000 },
            { qty: 3, unitCents: 12000 },
            { qty: 5, unitCents: 10000 },
          ],
        },
      ],
    },
    keywords: ["foam board print", "mounted print", "foam core print", "poster board", "rigid print", "mounted poster"],
    tags: ["indoor", "presentation", "poster"],
  },
  {
    name: "Clear Acrylic Signs",
    slug: "clear-acrylic-signs",
    pricingUnit: "per_piece",
    basePrice: 9900,
    sortOrder: 42,
    description:
      "Modern clear acrylic signs with sharp UV-printed graphics for a high-end, professional look. " +
      "Office lobbies (company logo), conference rooms (room names), retail (brand displays), " +
      "restaurants (menu boards), hotels (room numbers), medical offices (doctor nameplates), " +
      "salons (service menus), and real estate offices (agent directories). " +
      "Crystal-clear 3mm or 6mm cast acrylic with vibrant UV-direct printing. " +
      "Available with standoff mounting hardware for a floating effect, " +
      "or flush mounting with adhesive backing. " +
      "Edge-polished for a premium, glass-like finish.",
    minWidthIn: 4,
    minHeightIn: 4,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "acrylic_3mm", label: "Clear Acrylic 3mm" },
        { value: "acrylic_6mm", label: "Clear Acrylic 6mm (Premium)" },
      ],
      sizes: [
        {
          label: '8×10" (Small)',
          widthIn: 8, heightIn: 10,
          tiers: [
            { qty: 1, unitCents: 9900 },
            { qty: 3, unitCents: 8200 },
            { qty: 5, unitCents: 7000 },
          ],
        },
        {
          label: '12×18" (Medium)',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 15500 },
            { qty: 3, unitCents: 13000 },
            { qty: 5, unitCents: 11000 },
          ],
        },
        {
          label: '18×24" (Large)',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 22000 },
            { qty: 3, unitCents: 18500 },
            { qty: 5, unitCents: 16000 },
          ],
        },
        {
          label: '24×36" (XL)',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 35000 },
            { qty: 3, unitCents: 30000 },
            { qty: 5, unitCents: 26000 },
          ],
        },
      ],
    },
    keywords: ["clear acrylic sign", "acrylic sign", "glass sign", "lobby sign", "office sign", "modern sign"],
    tags: ["indoor", "premium", "corporate", "acrylic"],
  },
  {
    name: "Frosted Acrylic Signs",
    slug: "frosted-acrylic-signs",
    pricingUnit: "per_piece",
    basePrice: 9900,
    sortOrder: 43,
    description:
      "Frosted acrylic signs combining privacy with branding for a sophisticated, etched-glass appearance. " +
      "Office suite nameplates, conference room signs, privacy partitions with branding, " +
      "retail display signage, spa and salon service menus, medical office directories, " +
      "and upscale restaurant menu boards. " +
      "Elegant satin finish with UV-printed or vinyl-cut graphics on one side. " +
      "Standoff mounting for a floating wall effect, or adhesive back for doors and glass. " +
      "The frosted surface diffuses light beautifully — especially striking with backlighting.",
    minWidthIn: 4,
    minHeightIn: 4,
    maxWidthIn: 36,
    maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "acrylic_frosted_3mm", label: "Frosted Acrylic 3mm" },
        { value: "acrylic_frosted_6mm", label: "Frosted Acrylic 6mm (Premium)" },
      ],
      sizes: [
        {
          label: '8×10" (Small)',
          widthIn: 8, heightIn: 10,
          tiers: [
            { qty: 1, unitCents: 9900 },
            { qty: 3, unitCents: 8200 },
            { qty: 5, unitCents: 7000 },
          ],
        },
        {
          label: '12×18" (Medium)',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 15500 },
            { qty: 3, unitCents: 13000 },
            { qty: 5, unitCents: 11000 },
          ],
        },
        {
          label: '18×24" (Large)',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 22000 },
            { qty: 3, unitCents: 18500 },
            { qty: 5, unitCents: 16000 },
          ],
        },
        {
          label: '24×36" (XL)',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 35000 },
            { qty: 3, unitCents: 30000 },
            { qty: 5, unitCents: 26000 },
          ],
        },
      ],
    },
    keywords: ["frosted acrylic sign", "frosted sign", "etched glass sign", "privacy sign", "satin acrylic", "frosted nameplate"],
    tags: ["indoor", "premium", "corporate", "acrylic"],
  },
  {
    name: "Aluminum Composite Panel",
    slug: "aluminum-composite",
    pricingUnit: "per_sqft",
    basePrice: 2200,
    sortOrder: 44,
    description:
      "3mm Aluminum Composite Material (ACM / Dibond) panels for heavy-duty indoor and outdoor signage. " +
      "Building signs, storefront signage, real estate signs, construction site boards, " +
      "parking lot signs, directional wayfinding, and permanent outdoor branding. " +
      "Two thin aluminum sheets bonded to a polyethylene core — lightweight yet extremely rigid. " +
      "Weather-resistant, UV-stable, and rated for years of outdoor exposure. " +
      "Sleek professional finish with vibrant UV-printed graphics. " +
      "Pre-drilled mounting holes or channel rail installation available. " +
      "Custom sizes — priced per square foot.",
    minWidthIn: 6,
    minHeightIn: 6,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "aluminum_composite_3mm", label: "ACM 3mm (Standard)" },
        { value: "aluminum_composite_6mm", label: "ACM 6mm (Heavy Duty)" },
      ],
    },
    keywords: ["aluminum composite", "acm sign", "dibond sign", "aluminum sign", "metal sign", "outdoor sign"],
    tags: ["outdoor", "permanent", "commercial", "area-pricing"],
  },
  {
    name: "ACM / Dibond Signs",
    slug: "acm-dibond-signs",
    pricingUnit: "per_piece",
    basePrice: 8900,
    sortOrder: 45,
    description:
      "Pre-sized ACM (Dibond) signs in popular dimensions — ready to mount and display. " +
      "Business entrance signs, \"Now Open\" signs, directional parking signs, " +
      "real estate \"For Sale / For Lease\" signs, construction project boards, " +
      "\"No Trespassing / Private Property\" signs, and outdoor menu boards. " +
      "3mm aluminum composite with UV-printed full-colour graphics on one or both sides. " +
      "Rust-proof, fade-resistant, and built to last outdoors for 5+ years. " +
      "Available with pre-drilled holes, grommets, or smooth edges for frame mounting.",
    minWidthIn: 12,
    minHeightIn: 12,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "aluminum_composite_3mm", label: "ACM 3mm (Standard)" },
      ],
      sizes: [
        {
          label: '12×18"',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 8900 },
            { qty: 3, unitCents: 7500 },
            { qty: 5, unitCents: 6500 },
          ],
        },
        {
          label: '18×24"',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 13500 },
            { qty: 3, unitCents: 11500 },
            { qty: 5, unitCents: 9800 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 22000 },
            { qty: 3, unitCents: 18500 },
            { qty: 5, unitCents: 16000 },
          ],
        },
        {
          label: '36×48"',
          widthIn: 36, heightIn: 48,
          tiers: [
            { qty: 1, unitCents: 35000 },
            { qty: 3, unitCents: 30000 },
            { qty: 5, unitCents: 26000 },
          ],
        },
      ],
    },
    keywords: ["acm sign", "dibond sign", "aluminum composite sign", "metal sign", "outdoor metal sign"],
    tags: ["outdoor", "permanent", "commercial"],
  },
];

const ALL_PRODUCTS = [
  ...GROUP_AFRAMES,
  ...GROUP_YARD,
  ...GROUP_EVENT,
  ...GROUP_DISPLAY,
  ...GROUP_MATERIAL,
];

// ─── Placeholder images ─────────────────────────────────

const placeholders = {
  "a-frame-sign-stand":     "https://placehold.co/400x400/e74c3c/ffffff/png?text=A-Frame+Stand",
  "a-frame-double-sided":   "https://placehold.co/400x400/e74c3c/ffffff/png?text=A-Frame+Insert",
  "yard-sign-panel-only":   "https://placehold.co/400x400/27ae60/ffffff/png?text=Yard+Panel",
  "directional-arrow-signs":"https://placehold.co/400x400/2ecc71/ffffff/png?text=Arrow+Signs",
  "h-stakes":               "https://placehold.co/400x400/7f8c8d/ffffff/png?text=H-Stakes",
  "backdrop-board":         "https://placehold.co/400x400/8e44ad/ffffff/png?text=Backdrop+Board",
  "rigid-tabletop-signs":   "https://placehold.co/400x400/3498db/ffffff/png?text=Tabletop+Sign",
  "tabletop-signs":         "https://placehold.co/400x400/2980b9/ffffff/png?text=Tabletop+Sign",
  "tags-tickets-rigid":     "https://placehold.co/400x400/f39c12/333333/png?text=Tags+Tickets",
  "handheld-signs":         "https://placehold.co/400x400/e67e22/ffffff/png?text=Handheld+Sign",
  "foam-board":             "https://placehold.co/400x400/0984e3/ffffff/png?text=Foam+Board",
  "rigid-foam-board-prints":"https://placehold.co/400x400/0984e3/ffffff/png?text=Foam+Board+Print",
  "clear-acrylic-signs":    "https://placehold.co/400x400/00cec9/333333/png?text=Clear+Acrylic",
  "frosted-acrylic-signs":  "https://placehold.co/400x400/dfe6e9/333333/png?text=Frosted+Acrylic",
  "aluminum-composite":     "https://placehold.co/400x400/636e72/ffffff/png?text=ACM+Panel",
  "acm-dibond-signs":       "https://placehold.co/400x400/636e72/ffffff/png?text=ACM+Dibond",
};

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("── Signs & Rigid Boards v4: Fill remaining gaps ──\n");

  const preset = await prisma.pricingPreset.findUnique({ where: { key: "rigid_sheets_default" } });
  if (!preset) {
    console.log("ERROR: rigid_sheets_default preset not found. Run seed-rigid-boards.mjs first.");
    return;
  }

  let created = 0;
  let skipped = 0;
  let recategorized = 0;

  for (const p of ALL_PRODUCTS) {
    const isHardware = p._skipShared === true;
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) {
      if (exists.category !== CATEGORY) {
        await prisma.product.update({ where: { slug: p.slug }, data: { category: CATEGORY } });
        console.log(`  Re-categorized: ${p.slug}`);
        recategorized++;
      } else {
        console.log(`  Skip: ${p.slug} (exists)`);
      }
      skipped++;
      continue;
    }

    const imgUrl = placeholders[p.slug] || `https://placehold.co/400x400/png?text=${encodeURIComponent(p.name.slice(0, 20))}`;
    const { sortOrder, keywords, tags, _skipShared, ...fields } = p;

    const baseFields = isHardware
      ? { category: CATEGORY }
      : SHARED;

    await prisma.product.create({
      data: {
        ...baseFields,
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
  console.log(`  Skipped: ${skipped} (${recategorized} re-categorized)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
