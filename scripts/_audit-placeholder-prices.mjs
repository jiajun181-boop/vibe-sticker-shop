import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { isActive: true },
  select: {
    id: true, slug: true, name: true, category: true,
    basePrice: true, pricingUnit: true,
    pricingPreset: { select: { id: true, model: true, key: true, config: true } },
  },
  orderBy: [{ category: "asc" }, { slug: "asc" }],
});

console.log("=== Products with $0.01 placeholder tier prices ===\n");

for (const p of products) {
  const tiers = p.pricingPreset?.config?.tiers;
  if (!Array.isArray(tiers)) continue;

  const hasPlaceholder = tiers.some(t => {
    const price = Number(t.unitPrice || t.rate || t.price || 0);
    return price > 0 && price <= 0.05;
  });

  if (!hasPlaceholder) continue;

  const tierStr = tiers.map(t => {
    const qty = t.minQty || t.upToSqft || "?";
    const price = t.unitPrice || t.rate || t.price || 0;
    return `${qty}+→$${Number(price).toFixed(2)}`;
  }).join("  ");

  console.log(`${p.category.padEnd(28)} ${p.slug.padEnd(45)} ${p.name}`);
  console.log(`${"".padEnd(28)} base:$${(p.basePrice/100).toFixed(2)}  ${p.pricingUnit}  preset:${p.pricingPreset?.key}`);
  console.log(`${"".padEnd(28)} tiers: ${tierStr}`);
  console.log();
}

await prisma.$disconnect();
