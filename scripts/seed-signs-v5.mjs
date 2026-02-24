/**
 * Seed script for Signs & Display Boards v5.
 *
 * 1. Soft-deactivate removed products
 * 2. Upsert 4 new products
 * 3. Ensure existing products are active
 *
 * Usage:  node scripts/seed-signs-v5.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CATEGORY = "signs-rigid-boards";

async function main() {
  console.log("Signs v5 seed — starting...\n");

  // 1. Soft-deactivate removed/fake products
  const deactivateSlugs = [
    "construction-site-signs",
    "coroplast-signs",
    "foam-board",
  ];

  for (const slug of deactivateSlugs) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug },
        data: { isActive: false },
      });
      console.log(`  Deactivated: ${slug}`);
    } else {
      console.log(`  Skip (not found): ${slug}`);
    }
  }

  // 2. Upsert 4 new products
  const newProducts = [
    {
      slug: "election-signs",
      name: "Election & Campaign Signs",
      description: "Custom election and campaign signs on durable Coroplast. Double-sided, weatherproof, volume pricing for 10\u2013250+ signs.",
      category: CATEGORY,
      basePrice: 2800,
      pricingUnit: "per_piece",
      isActive: true,
      sortOrder: 3,
    },
    {
      slug: "open-house-signs",
      name: "Open House Signs",
      description: "Directional arrow signs and standard open house signs for realtors. Double-sided Coroplast with H-stakes available.",
      category: CATEGORY,
      basePrice: 2800,
      pricingUnit: "per_piece",
      isActive: true,
      sortOrder: 4,
    },
    {
      slug: "directional-signs",
      name: "Directional & Wayfinding Signs",
      description: "Arrow-shaped and rectangular directional signs for events, parking, and property navigation. Weatherproof Coroplast.",
      category: CATEGORY,
      basePrice: 2800,
      pricingUnit: "per_piece",
      isActive: true,
      sortOrder: 5,
    },
    {
      slug: "pvc-board-signs",
      name: "PVC Board Signs",
      description: "Smooth, rigid PVC (Sintra) boards in 3mm and 6mm. Perfect for indoor displays, retail signage, and semi-permanent outdoor use.",
      category: CATEGORY,
      basePrice: 3920,
      pricingUnit: "per_piece",
      isActive: true,
      sortOrder: 6,
    },
  ];

  for (const p of newProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: p,
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        basePrice: p.basePrice,
        isActive: p.isActive,
        sortOrder: p.sortOrder,
      },
    });
    console.log(`  Upserted: ${p.slug}`);
  }

  // 3. Ensure existing products are active and in correct category
  const ensureActiveSlugs = [
    { slug: "yard-sign", sortOrder: 1 },
    { slug: "real-estate-sign", sortOrder: 2 },
    { slug: "selfie-frame-board", sortOrder: 7 },
    { slug: "welcome-sign-board", sortOrder: 8 },
    { slug: "tri-fold-presentation-board", sortOrder: 9 },
    { slug: "a-frame-sign-stand", sortOrder: 10 },
    { slug: "h-stakes", sortOrder: 11 },
    { slug: "real-estate-frame", sortOrder: 12 },
  ];

  for (const { slug, sortOrder } of ensureActiveSlugs) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug },
        data: { isActive: true, category: CATEGORY, sortOrder },
      });
      console.log(`  Ensured active: ${slug} (order: ${sortOrder})`);
    } else {
      console.log(`  Skip (not in DB): ${slug}`);
    }
  }

  console.log("\nSigns v5 seed — done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
