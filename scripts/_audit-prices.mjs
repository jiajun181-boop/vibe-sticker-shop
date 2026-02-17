import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { isActive: true },
  select: {
    slug: true, category: true, name: true,
    basePrice: true, minPrice: true, displayFromPrice: true,
    pricingUnit: true,
    pricingPreset: { select: { model: true, key: true, config: true } },
  },
  orderBy: [{ category: "asc" }, { slug: "asc" }],
});

// Group by category
const byCat = {};
for (const p of products) {
  if (!byCat[p.category]) byCat[p.category] = [];
  byCat[p.category].push(p);
}

for (const [cat, prods] of Object.entries(byCat).sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`${cat} (${prods.length} products)`);
  console.log(`${"=".repeat(80)}`);

  for (const p of prods) {
    const base = `$${(p.basePrice / 100).toFixed(2)}`;
    const min = p.minPrice ? `$${(p.minPrice / 100).toFixed(2)}` : "—";
    const display = p.displayFromPrice ? `$${(p.displayFromPrice / 100).toFixed(2)}` : "—";
    const model = p.pricingPreset?.model || "NONE";
    const tiers = p.pricingPreset?.config?.tiers;

    let tierInfo = "";
    if (Array.isArray(tiers) && tiers.length > 0) {
      const sorted = [...tiers].sort((a, b) => Number(a.minQty) - Number(b.minQty));
      const prices = sorted.map(t => {
        const price = t.unitPrice || t.pricePerSqft || t.price;
        const qty = t.minQty || t.minSqft || "?";
        return `${qty}+→$${Number(price).toFixed(2)}`;
      });
      tierInfo = prices.join("  ");
    }

    console.log(
      `  ${p.slug.padEnd(45)} base:${base.padEnd(8)} min:${min.padEnd(8)} display:${display.padEnd(8)} ${p.pricingUnit.padEnd(10)} ${model.padEnd(12)} ${tierInfo}`
    );
  }
}

// Summary stats
console.log(`\n${"=".repeat(80)}`);
console.log("PRICE SUMMARY");
console.log(`${"=".repeat(80)}`);

let noPreset = 0;
let zeroBase = 0;
let suspiciouslyLow = 0;
let suspiciouslyHigh = 0;

for (const p of products) {
  if (!p.pricingPreset) noPreset++;
  if (p.basePrice === 0) zeroBase++;
  if (p.basePrice > 0 && p.basePrice < 50) suspiciouslyLow++; // < $0.50
  if (p.basePrice > 100000) suspiciouslyHigh++; // > $1000
}

console.log(`Total: ${products.length}`);
console.log(`No pricing preset: ${noPreset}`);
console.log(`Zero basePrice: ${zeroBase}`);
console.log(`basePrice < $0.50: ${suspiciouslyLow}`);
console.log(`basePrice > $1000: ${suspiciouslyHigh}`);

await prisma.$disconnect();
