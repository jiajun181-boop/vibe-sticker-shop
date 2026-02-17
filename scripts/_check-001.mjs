import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  where: { isActive: true },
  select: { slug: true, pricingPreset: { select: { key: true, config: true } } },
});
let count = 0;
for (const p of products) {
  const tiers = p.pricingPreset?.config?.tiers || [];
  const has001 = tiers.some(t => Number(t.unitPrice) === 0.01);
  if (has001) { count++; console.log(p.slug, p.pricingPreset.key); }
}
console.log("Total with $0.01:", count);
await prisma.$disconnect();
