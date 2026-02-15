import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const presets = await p.pricingPreset.findMany({
  where: { isActive: true },
  include: { _count: { select: { products: true } } },
  orderBy: { key: "asc" },
});

console.log("=== Active Pricing Presets ===\n");
console.log("Preset Key".padEnd(40) + "Model".padEnd(15) + "Products");
console.log("-".repeat(65));
let totalProducts = 0;
for (const pr of presets) {
  console.log(pr.key.padEnd(40) + pr.model.padEnd(15) + pr._count.products);
  totalProducts += pr._count.products;
}
console.log("-".repeat(65));
console.log("Total".padEnd(55) + totalProducts);

const noPreset = await p.product.count({ where: { isActive: true, pricingPresetId: null } });
console.log(`\nProducts without preset: ${noPreset}`);

// Check for products with $0 basePrice and generic presets
const zeroPriceCount = await p.product.count({
  where: { isActive: true, basePrice: 0 },
});
console.log(`Products with $0 basePrice: ${zeroPriceCount} (these use preset tiers for pricing)`);

await p.$disconnect();
