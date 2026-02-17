#!/usr/bin/env node
/**
 * Backfill product.minPrice using the computeFromPrice engine.
 * This caches the "From $X" value so listing pages skip live computation.
 *
 * Run:  node scripts/backfill-min-price.mjs
 * Safe to re-run — updates all products each time.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { pricingPreset: true },
  });

  console.log(`Found ${products.length} active products. Computing minPrice...`);

  // Dynamic import to handle ESM/path aliasing — quote engine is pure JS, no DB calls.
  const { computeFromPrice } = await import("../lib/pricing/from-price.js");

  let updated = 0;
  for (const product of products) {
    const computed = computeFromPrice(product);
    if (typeof computed === "number" && computed > 0 && computed !== product.minPrice) {
      await prisma.product.update({
        where: { id: product.id },
        data: { minPrice: computed },
      });
      console.log(`  ${product.slug}: ${product.minPrice ?? "null"} -> ${computed} cents`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} of ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
