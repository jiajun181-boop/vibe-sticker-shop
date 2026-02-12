#!/usr/bin/env node
// scripts/seed-stamps.mjs
// Seeds 8 self-inking stamp products (one per model) into the database.
// Run:  node scripts/seed-stamps.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const STAMPS = [
  {
    slug: "stamps-s827",
    name: "Self-Inking Stamp S-827",
    description: "Rectangular self-inking stamp, 1.1875 × 2 in (30 × 50 mm). Printer Line series — fast, clean impressions every time.",
    basePrice: 3999,
    sortOrder: 50,
    shape: "rect",
    dimensions: '1.1875" × 2.0"',
    mm: "30 × 50 mm",
    type: "Rectangular",
    details: "Printer Line series",
    replacementPad: "S-827-7",
  },
  {
    slug: "stamps-s510",
    name: "Self-Inking Stamp S-510",
    description: "Square self-inking stamp, 0.5 × 0.5 in (12 × 12 mm). Compact Printer Line — black top, clear bottom.",
    basePrice: 1999,
    sortOrder: 51,
    shape: "rect",
    dimensions: '0.5" × 0.5"',
    mm: "12 × 12 mm",
    type: "Square",
    details: "Black top, clear bottom",
    replacementPad: "S-510-7",
  },
  {
    slug: "stamps-s520",
    name: "Self-Inking Stamp S-520",
    description: "Square self-inking stamp, 0.75 × 0.75 in (20 × 20 mm). Black top, clear bottom.",
    basePrice: 2499,
    sortOrder: 52,
    shape: "rect",
    dimensions: '0.75" × 0.75"',
    mm: "20 × 20 mm",
    type: "Square",
    details: "Black top, clear bottom",
    replacementPad: "S-520-7",
  },
  {
    slug: "stamps-s542",
    name: "Self-Inking Stamp S-542",
    description: "Large square self-inking stamp, 1.625 × 1.625 in (42 × 42 mm). Black top.",
    basePrice: 4499,
    sortOrder: 53,
    shape: "rect",
    dimensions: '1.625" × 1.625"',
    mm: "42 × 42 mm",
    type: "Square",
    details: "Black top",
    replacementPad: "S-542-7",
  },
  {
    slug: "stamps-r512",
    name: "Self-Inking Stamp R-512",
    description: "Round self-inking stamp, 0.5 in diameter (12 mm). Compact round design, black top.",
    basePrice: 1999,
    sortOrder: 54,
    shape: "round",
    dimensions: '0.5" diameter',
    mm: "12 mm",
    type: "Round",
    details: "Black top",
    replacementPad: "R-512-7",
  },
  {
    slug: "stamps-r524",
    name: "Self-Inking Stamp R-524",
    description: "Round self-inking stamp, 1.0 in diameter (24 mm). Black top, clear bottom.",
    basePrice: 2799,
    sortOrder: 55,
    shape: "round",
    dimensions: '1.0" diameter',
    mm: "24 mm",
    type: "Round",
    details: "Black top, clear bottom",
    replacementPad: "R-524-7",
  },
  {
    slug: "stamps-r532",
    name: "Self-Inking Stamp R-532",
    description: "Round self-inking stamp, 1.25 in diameter (32 mm). Black top.",
    basePrice: 3499,
    sortOrder: 56,
    shape: "round",
    dimensions: '1.25" diameter',
    mm: "32 mm",
    type: "Round",
    details: "Black top",
    replacementPad: "R-532-7",
  },
  {
    slug: "stamps-r552",
    name: "Self-Inking Stamp R-552",
    description: "Large round self-inking stamp, 2.0 in diameter (52 mm). Black top.",
    basePrice: 5999,
    sortOrder: 57,
    shape: "round",
    dimensions: '2.0" diameter',
    mm: "52 mm",
    type: "Round",
    details: "Black top",
    replacementPad: "R-552-7",
  },
];

async function main() {
  // Deactivate old combined stamp product if exists
  await prisma.product.updateMany({
    where: { slug: "self-inking-stamps" },
    data: { isActive: false },
  });

  for (const s of STAMPS) {
    const optionsConfig = {
      editor: {
        type: "text",
        mode: "box",
        defaultText: "YOUR COMPANY\nPHONE",
        defaultColor: "#111111",
        fonts: ["Helvetica", "Arial", "sans-serif"],
        sizes: [
          {
            label: s.slug.replace("stamps-", "").toUpperCase(),
            shape: s.shape,
            ...(s.shape === "round"
              ? { diameterIn: parseFloat(s.dimensions) || 1 }
              : {
                  widthIn: parseFloat(s.dimensions.split("×")[0]) || 1,
                  heightIn: parseFloat((s.dimensions.split("×")[1] || "").replace(/"/g, "")) || 1,
                }),
            type: s.type,
            details: s.details,
            replacementPad: s.replacementPad,
            unitCents: s.basePrice,
          },
        ],
      },
      specs: {
        dimensions: s.dimensions,
        metric: s.mm,
        shape: s.type,
        details: s.details,
        replacementPad: s.replacementPad,
      },
      ui: {
        showFromPrice: false,
      },
    };

    await prisma.product.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        basePrice: s.basePrice,
        category: "marketing-prints",
        pricingUnit: "per_piece",

        isActive: true,
        sortOrder: s.sortOrder,
        optionsConfig,
      },
      create: {
        slug: s.slug,
        name: s.name,
        description: s.description,
        basePrice: s.basePrice,
        category: "marketing-prints",
        pricingUnit: "per_piece",

        isActive: true,
        sortOrder: s.sortOrder,
        optionsConfig,
      },
    });

    console.log(`  + ${s.slug} — ${s.name} ($${(s.basePrice / 100).toFixed(2)})`);
  }

  console.log(`\nDone — ${STAMPS.length} stamp products seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
