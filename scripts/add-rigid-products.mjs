// scripts/add-rigid-products.mjs
// Seeds rigid substrate (signs & boards) products + pricing preset.
// Safe to re-run — skips existing slugs, upserts preset.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── Pricing Preset ─────────────────────────────────────

const PRESET = {
  key: "rigid_sheets_default",
  name: "Rigid Sheets — Default",
  model: "AREA_TIERED",
  config: {
    tiers: [
      { upToSqft: 4, rate: 8.0 },
      { upToSqft: 12, rate: 6.5 },
      { upToSqft: 32, rate: 5.0 },
      { upToSqft: 100, rate: 4.0 },
      { upToSqft: 9999, rate: 3.5 },
    ],
    fileFee: 10.0,
    minimumPrice: 50.0,
    materials: [
      { id: "foamboard_3_16", name: 'Foamboard 3/16"', multiplier: 1.0 },
      { id: "foamboard_1_2", name: 'Foamboard 1/2"', multiplier: 1.4 },
      { id: "coroplast_4mm", name: "Coroplast 4mm", multiplier: 0.8 },
      { id: "coroplast_6mm", name: "Coroplast 6mm", multiplier: 1.0 },
      { id: "coroplast_10mm", name: "Coroplast 10mm", multiplier: 1.3 },
      { id: "pvc_3mm", name: "PVC (Sintra) 3mm", multiplier: 1.5 },
    ],
    finishings: [
      { id: "lamination_gloss", name: "Gloss Lamination", type: "per_sqft", price: 1.5 },
      { id: "lamination_matte", name: "Matte Lamination", type: "per_sqft", price: 1.5 },
      { id: "contour_cut", name: "Contour Cut", type: "flat", price: 25.0 },
      { id: "drilled_holes", name: "Drilled Holes (4)", type: "flat", price: 5.0 },
      { id: "grommets_4", name: "Corner Grommets", type: "per_unit", price: 0.75 },
    ],
  },
};

// ─── Shared fields ──────────────────────────────────────

const SHARED = {
  category: "signs-boards",
  type: "sign",
  acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
  minDpi: 150,
  requiresBleed: true,
  bleedIn: 0.125,
};

const BOARD_DIMS = {
  minWidthIn: 6,
  minHeightIn: 6,
  maxWidthIn: 48,
  maxHeightIn: 96,
};

// ─── Retail Products (active) ───────────────────────────

const retailProducts = [
  {
    name: "Photo Board",
    slug: "photo-board",
    pricingUnit: "per_sqft",
    basePrice: 4500,
    description:
      "Custom photo prints on foam board. Perfect for events, décor, memorials, and gifts.",
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "foamboard_1_2", label: 'Foamboard 1/2"' },
      ],
    },
  },
  {
    name: "Handheld Sign",
    slug: "handheld-sign",
    pricingUnit: "per_sqft",
    basePrice: 2500,
    description:
      "Lightweight handheld signs for events, rallies, photo ops, and queues.",
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
      ],
    },
  },
  {
    name: "Custom Foam Board Sign",
    slug: "custom-foam-board",
    pricingUnit: "per_sqft",
    basePrice: 5000,
    description:
      "Indoor foam board signage for POP displays, presentations, and retail.",
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "foamboard_1_2", label: 'Foamboard 1/2"' },
        { value: "pvc_3mm", label: "PVC (Sintra) 3mm" },
      ],
    },
  },
  {
    name: "Yard Sign",
    slug: "yard-sign",
    pricingUnit: "per_piece",
    basePrice: 1800,
    description:
      "Corrugated plastic yard signs. Weather-resistant, double-sided available.",
    minWidthIn: 12,
    minHeightIn: 12,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
      ],
      sizes: [
        {
          label: "12×18",
          widthIn: 12,
          heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 1800 },
            { qty: 10, unitCents: 950 },
            { qty: 25, unitCents: 750 },
            { qty: 50, unitCents: 625 },
            { qty: 100, unitCents: 550 },
          ],
        },
        {
          label: "18×24",
          widthIn: 18,
          heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 2500 },
            { qty: 10, unitCents: 1250 },
            { qty: 25, unitCents: 1050 },
            { qty: 50, unitCents: 850 },
            { qty: 100, unitCents: 725 },
          ],
        },
        {
          label: "24×36",
          widthIn: 24,
          heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 10, unitCents: 2800 },
            { qty: 25, unitCents: 2200 },
            { qty: 50, unitCents: 1800 },
          ],
        },
      ],
    },
  },
  {
    name: "Yard Sign + H-Frame",
    slug: "yard-sign-h-frame",
    pricingUnit: "per_piece",
    basePrice: 2200,
    description:
      "Coroplast yard sign with galvanized H-wire stake included. Ready to plant.",
    minWidthIn: 12,
    minHeightIn: 12,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
      ],
      sizes: [
        {
          label: "12×18 + H-Frame",
          widthIn: 12,
          heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 2200 },
            { qty: 10, unitCents: 1200 },
            { qty: 25, unitCents: 1000 },
            { qty: 50, unitCents: 875 },
            { qty: 100, unitCents: 800 },
          ],
        },
        {
          label: "18×24 + H-Frame",
          widthIn: 18,
          heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 3000 },
            { qty: 10, unitCents: 1500 },
            { qty: 25, unitCents: 1300 },
            { qty: 50, unitCents: 1100 },
            { qty: 100, unitCents: 975 },
          ],
        },
        {
          label: "24×36 + H-Frame",
          widthIn: 24,
          heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 5000 },
            { qty: 10, unitCents: 3100 },
            { qty: 25, unitCents: 2500 },
            { qty: 50, unitCents: 2100 },
          ],
        },
      ],
    },
  },
  {
    name: "Real Estate Sign",
    slug: "real-estate-sign",
    pricingUnit: "per_piece",
    basePrice: 3500,
    description:
      "Realtor signs for listings, open house, and directional signage. Heavy-duty coroplast.",
    minWidthIn: 12,
    minHeightIn: 12,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
        { value: "coroplast_10mm", label: "Coroplast 10mm" },
      ],
      sizes: [
        {
          label: "18×24",
          widthIn: 18,
          heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 3500 },
            { qty: 10, unitCents: 2000 },
            { qty: 25, unitCents: 1600 },
          ],
        },
        {
          label: "24×36",
          widthIn: 24,
          heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 10, unitCents: 3500 },
            { qty: 25, unitCents: 2800 },
          ],
        },
      ],
    },
  },
  {
    name: "Table Easel Display",
    slug: "table-easel-display",
    pricingUnit: "per_sqft",
    basePrice: 3500,
    description:
      'Foam board with easel back — stand-alone countertop display. 1/2" thick for stability.',
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2"' },
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
      ],
    },
  },
  {
    name: "A-Frame Sandwich Board",
    slug: "a-frame-sandwich-board",
    pricingUnit: "per_piece",
    basePrice: 8500,
    description:
      "Sidewalk A-frame with two printed coroplast inserts. Double-sided visibility.",
    minWidthIn: 18,
    minHeightIn: 24,
    maxWidthIn: 24,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
        { value: "coroplast_10mm", label: "Coroplast 10mm" },
      ],
      sizes: [
        {
          label: "18×24 (A-Frame)",
          widthIn: 18,
          heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 5, unitCents: 7500 },
            { qty: 10, unitCents: 6500 },
          ],
        },
        {
          label: "24×36 (A-Frame)",
          widthIn: 24,
          heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 12500 },
            { qty: 5, unitCents: 11000 },
            { qty: 10, unitCents: 9500 },
          ],
        },
      ],
    },
  },
  {
    name: "Election / Campaign Sign",
    slug: "election-campaign-sign",
    pricingUnit: "per_piece",
    basePrice: 1800,
    description:
      "Political and campaign lawn signs. Bulk pricing available. Fast turnaround.",
    minWidthIn: 12,
    minHeightIn: 12,
    maxWidthIn: 48,
    maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
      ],
      sizes: [
        {
          label: "12×18",
          widthIn: 12,
          heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 1800 },
            { qty: 25, unitCents: 700 },
            { qty: 50, unitCents: 600 },
            { qty: 100, unitCents: 500 },
            { qty: 250, unitCents: 425 },
            { qty: 500, unitCents: 375 },
          ],
        },
        {
          label: "18×24",
          widthIn: 18,
          heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 2500 },
            { qty: 25, unitCents: 1000 },
            { qty: 50, unitCents: 800 },
            { qty: 100, unitCents: 700 },
            { qty: 250, unitCents: 600 },
            { qty: 500, unitCents: 525 },
          ],
        },
      ],
    },
  },
  {
    name: "Directional Arrow Sign",
    slug: "directional-arrow-sign",
    pricingUnit: "per_piece",
    basePrice: 1500,
    description:
      "Arrow-shaped directional signs for events, open houses, and wayfinding.",
    minWidthIn: 6,
    minHeightIn: 12,
    maxWidthIn: 24,
    maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
      ],
      sizes: [
        {
          label: "6×18 Arrow",
          widthIn: 6,
          heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 1500 },
            { qty: 10, unitCents: 900 },
            { qty: 25, unitCents: 700 },
          ],
        },
        {
          label: "12×24 Arrow",
          widthIn: 12,
          heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 2500 },
            { qty: 10, unitCents: 1400 },
            { qty: 25, unitCents: 1100 },
          ],
        },
      ],
    },
  },
];

// ─── B2B Material Sheets (inactive) ────────────────────

const b2bProducts = [
  {
    name: 'Foamboard Sheet 3/16" (4\u00d78 ft)',
    slug: "foamboard-sheet-3-16",
    pricingUnit: "per_piece",
    basePrice: 2800,
    description: 'Full 4\u00d78 ft foamboard sheet, 3/16" thick. B2B pricing.',
    ...BOARD_DIMS,
  },
  {
    name: 'Foamboard Sheet 1/2" (4\u00d78 ft)',
    slug: "foamboard-sheet-1-2",
    pricingUnit: "per_piece",
    basePrice: 4500,
    description: 'Full 4\u00d78 ft foamboard sheet, 1/2" thick. B2B pricing.',
    ...BOARD_DIMS,
  },
  {
    name: "Coroplast Sheet 4mm (4\u00d78 ft)",
    slug: "coroplast-sheet-4mm",
    pricingUnit: "per_piece",
    basePrice: 2200,
    description: "Full 4\u00d78 ft corrugated plastic sheet, 4mm. B2B pricing.",
    ...BOARD_DIMS,
  },
  {
    name: "Coroplast Sheet 6mm (4\u00d78 ft)",
    slug: "coroplast-sheet-6mm",
    pricingUnit: "per_piece",
    basePrice: 3200,
    description: "Full 4\u00d78 ft corrugated plastic sheet, 6mm. B2B pricing.",
    ...BOARD_DIMS,
  },
  {
    name: "Coroplast Sheet 10mm (4\u00d78 ft)",
    slug: "coroplast-sheet-10mm",
    pricingUnit: "per_piece",
    basePrice: 4800,
    description: "Full 4\u00d78 ft corrugated plastic sheet, 10mm. B2B pricing.",
    ...BOARD_DIMS,
  },
  {
    name: "PVC (Sintra) Sheet 3mm (4\u00d78 ft)",
    slug: "pvc-sheet-3mm",
    pricingUnit: "per_piece",
    basePrice: 5500,
    description: "Full 4\u00d78 ft PVC/Sintra sheet, 3mm. B2B pricing.",
    ...BOARD_DIMS,
  },
];

// ─── Placeholder images ─────────────────────────────────

const placeholders = {
  "photo-board": "https://placehold.co/400x400/6c5ce7/ffffff/png?text=Photo+Board",
  "handheld-sign": "https://placehold.co/400x400/00b894/ffffff/png?text=Handheld+Sign",
  "custom-foam-board": "https://placehold.co/400x400/0984e3/ffffff/png?text=Foam+Board",
  "yard-sign": "https://placehold.co/400x400/fdcb6e/333333/png?text=Yard+Sign",
  "yard-sign-h-frame": "https://placehold.co/400x400/e17055/ffffff/png?text=Yard+Sign+H-Frame",
  "real-estate-sign": "https://placehold.co/400x400/d63031/ffffff/png?text=Real+Estate",
  "table-easel-display": "https://placehold.co/400x400/a29bfe/333333/png?text=Table+Easel",
  "a-frame-sandwich-board": "https://placehold.co/400x400/2d3436/ffffff/png?text=A-Frame",
  "election-campaign-sign": "https://placehold.co/400x400/0052cc/ffffff/png?text=Election+Sign",
  "directional-arrow-sign": "https://placehold.co/400x400/ff7675/ffffff/png?text=Arrow+Sign",
  "foamboard-sheet-3-16": "https://placehold.co/400x400/dfe6e9/333333/png?text=Foam+3/16",
  "foamboard-sheet-1-2": "https://placehold.co/400x400/b2bec3/333333/png?text=Foam+1/2",
  "coroplast-sheet-4mm": "https://placehold.co/400x400/ffeaa7/333333/png?text=Coroplast+4mm",
  "coroplast-sheet-6mm": "https://placehold.co/400x400/fab1a0/333333/png?text=Coroplast+6mm",
  "coroplast-sheet-10mm": "https://placehold.co/400x400/e17055/ffffff/png?text=Coroplast+10mm",
  "pvc-sheet-3mm": "https://placehold.co/400x400/636e72/ffffff/png?text=PVC+3mm",
};

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log("── Seeding rigid substrate products (signs-boards) ──\n");

  // 1. Upsert pricing preset
  const preset = await prisma.pricingPreset.upsert({
    where: { key: PRESET.key },
    create: {
      key: PRESET.key,
      name: PRESET.name,
      model: PRESET.model,
      config: PRESET.config,
    },
    update: {
      name: PRESET.name,
      model: PRESET.model,
      config: PRESET.config,
    },
  });
  console.log(`Preset: ${PRESET.key} → ${preset.id}\n`);

  // 2. Create retail products
  console.log("── Retail Products (active) ──");
  let created = 0;
  let skipped = 0;

  for (const p of retailProducts) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    });
    if (existing) {
      console.log(`  ⏭ ${p.name} (exists)`);
      skipped++;
      continue;
    }
    await prisma.product.create({
      data: {
        ...SHARED,
        name: p.name,
        slug: p.slug,
        pricingUnit: p.pricingUnit,
        basePrice: p.basePrice,
        description: p.description,
        minWidthIn: p.minWidthIn,
        minHeightIn: p.minHeightIn,
        maxWidthIn: p.maxWidthIn,
        maxHeightIn: p.maxHeightIn,
        optionsConfig: p.optionsConfig || null,
        isActive: true,
        sortOrder: 0,
        pricingPresetId: preset.id,
        images: {
          create: [
            {
              url: placeholders[p.slug],
              alt: p.name,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    console.log(`  ✅ ${p.name}`);
    created++;
  }

  // 3. Create B2B products (inactive)
  console.log("\n── B2B Material Sheets (inactive) ──");
  for (const p of b2bProducts) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    });
    if (existing) {
      console.log(`  ⏭ ${p.name} (exists)`);
      skipped++;
      continue;
    }
    await prisma.product.create({
      data: {
        ...SHARED,
        name: p.name,
        slug: p.slug,
        pricingUnit: p.pricingUnit,
        basePrice: p.basePrice,
        description: p.description,
        minWidthIn: p.minWidthIn,
        minHeightIn: p.minHeightIn,
        maxWidthIn: p.maxWidthIn,
        maxHeightIn: p.maxHeightIn,
        isActive: false,
        sortOrder: 100,
        pricingPresetId: preset.id,
        images: {
          create: [
            {
              url: placeholders[p.slug],
              alt: p.name,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    console.log(`  ✅ ${p.name}`);
    created++;
  }

  console.log(`\n── Summary ──`);
  console.log(`  Preset: ${PRESET.key}`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (existing): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
