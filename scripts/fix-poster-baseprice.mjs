#!/usr/bin/env node
/**
 * One-time fix: update poster basePrice to match actual configurator prices.
 * Run: node scripts/fix-poster-baseprice.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPDATES = [
  { slug: "posters-glossy",   basePrice: 899,  label: "Glossy Poster" },
  { slug: "posters-matte",    basePrice: 899,  label: "Matte Poster" },
  { slug: "posters-adhesive", basePrice: 1499, label: "Adhesive Poster" },
  { slug: "posters-backlit",  basePrice: 2499, label: "Backlit Poster" },
];

async function main() {
  for (const { slug, basePrice, label } of UPDATES) {
    const result = await prisma.product.updateMany({
      where: { slug },
      data: { basePrice },
    });
    const status = result.count > 0 ? "UPDATED" : "NOT FOUND";
    console.log(`[${status}] ${label} (${slug}) → basePrice = ${basePrice} ($${ (basePrice / 100).toFixed(2) })`);
  }

  // Verify
  console.log("\n--- Verification ---");
  const products = await prisma.product.findMany({
    where: { slug: { in: UPDATES.map((u) => u.slug) } },
    select: { slug: true, name: true, basePrice: true },
  });
  for (const p of products) {
    const expected = UPDATES.find((u) => u.slug === p.slug)?.basePrice;
    const match = p.basePrice === expected ? "OK" : "MISMATCH";
    console.log(`  [${match}] ${p.slug}: basePrice = ${p.basePrice} (expected ${expected})`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
