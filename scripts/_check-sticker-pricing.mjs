#!/usr/bin/env node
/**
 * Quick check: verify custom-stickers pricing in DB.
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const products = await p.product.findMany({
  where: { category: "custom-stickers" },
  select: { slug: true, name: true, basePrice: true, optionsConfig: true },
  orderBy: { sortOrder: "asc" },
});

console.log(`\n${products.length} products in custom-stickers:\n`);
console.log(
  "Slug".padEnd(26),
  "Base".padStart(8),
  "Model".padEnd(18),
  "Sizes",
);
console.log("-".repeat(80));

for (const prod of products) {
  const oc = prod.optionsConfig || {};
  const sizes = oc.sizes || [];
  const model = oc.pricingModel || "none";

  console.log(
    prod.slug.padEnd(26),
    `$${(prod.basePrice / 100).toFixed(2)}`.padStart(8),
    model.padEnd(18),
    sizes.map((s) => s.label).join(" | "),
  );

  // Show price table for first size
  for (const s of sizes) {
    if (!s.priceByQty) continue;
    const qtys = Object.entries(s.priceByQty)
      .map(([q, c]) => `${q}→$${(c / 100).toFixed(0)}`)
      .join("  ");
    console.log(`  ${s.label.padEnd(12)} ${qtys}`);
  }
}

await p.$disconnect();
