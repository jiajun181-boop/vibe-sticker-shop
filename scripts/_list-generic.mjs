import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const products = await p.product.findMany({
  where: { isActive: true, pricingPreset: { key: { in: ["stickers_default", "business_cards_default", "largeformat_roll_default", "rigid_sheets_default"] } } },
  select: { slug: true, category: true, pricingUnit: true, basePrice: true, pricingPreset: { select: { key: true } } },
  orderBy: [{ category: "asc" }, { slug: "asc" }],
});

let lastCat = "";
for (const pr of products) {
  if (pr.category !== lastCat) {
    console.log(`\n--- ${pr.category} (${pr.pricingPreset.key}) ---`);
    lastCat = pr.category;
  }
  console.log(`  ${pr.slug} | ${pr.pricingUnit} | $${(pr.basePrice / 100).toFixed(2)}`);
}
console.log(`\nTotal: ${products.length}`);
await p.$disconnect();
