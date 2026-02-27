#!/usr/bin/env node
// cleanup-merge-products.mjs
// Deletes duplicate/merged products per Jay's confirmation.
// Usage:
//   node scripts/cleanup-merge-products.mjs          # dry-run
//   node scripts/cleanup-merge-products.mjs --delete  # actually delete

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes("--delete");

const DELETE_SLUGS = [
  // removable-stickers: duplicate of kiss-cut-stickers (even has same name in DB)
  "removable-stickers",
  // kiss-cut-sticker-sheets: merge into sticker-sheets
  "kiss-cut-sticker-sheets",
  // stickers-multi-on-sheet: merge into sticker-sheets
  "stickers-multi-on-sheet",
  // labels-roll-quote: redundant with roll-labels + sticker-rolls
  "labels-roll-quote",
];

async function main() {
  console.log(DRY_RUN ? "\n🔍 DRY RUN — listing products to delete:\n" : "\n🗑️  DELETING products...\n");

  const products = await prisma.product.findMany({
    where: { slug: { in: DELETE_SLUGS } },
    select: { id: true, slug: true, name: true, category: true, isActive: true },
  });

  if (products.length === 0) {
    console.log("✅ No matching products found.");
    await prisma.$disconnect();
    return;
  }

  console.log("Products to delete:");
  console.log("─".repeat(90));
  for (const p of products) {
    console.log(`  ${p.slug.padEnd(35)} ${p.name.padEnd(30)} ${p.category}`);
  }
  console.log("─".repeat(90));
  console.log(`Total: ${products.length}\n`);

  if (DRY_RUN) {
    console.log("Run with --delete to actually remove these.");
    await prisma.$disconnect();
    return;
  }

  const ids = products.map((p) => p.id);

  const reviewResult = await prisma.review.deleteMany({ where: { productId: { in: ids } } });
  console.log(`Deleted ${reviewResult.count} reviews`);

  const productResult = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${productResult.count} products (images auto-cascaded)`);

  console.log("\n✅ Cleanup complete!");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
