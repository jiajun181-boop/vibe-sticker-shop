const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Import sub-product config inline (can't use ESM import)
const SUB_PRODUCT_CONFIG = {
  "business-cards": [
    "business-cards", "business-cards-classic", "business-cards-gloss",
    "business-cards-matte", "business-cards-soft-touch", "business-cards-gold-foil",
    "business-cards-linen", "business-cards-pearl", "business-cards-thick",
    "magnets-business-card"
  ],
  "ncr-forms": [
    "ncr-forms-duplicate", "ncr-forms-triplicate", "ncr-invoices"
  ],
  "table-tents": [
    "table-tents", "table-tent-cards", "table-tents-4x6", "table-display-cards"
  ],
  "brochures": [
    "brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold"
  ],
};

async function main() {
  // Collect all slugs
  const allSlugs = [...new Set(Object.values(SUB_PRODUCT_CONFIG).flat())];

  const products = await p.product.findMany({
    where: { slug: { in: allSlugs } },
    select: { slug: true, name: true, isActive: true },
  });

  const dbMap = new Map(products.map(pr => [pr.slug, pr]));

  for (const [parent, slugs] of Object.entries(SUB_PRODUCT_CONFIG)) {
    console.log(`\n=== ${parent} (${slugs.length} configured slugs) ===`);
    for (const slug of slugs) {
      const pr = dbMap.get(slug);
      if (!pr) {
        console.log(`  ${slug} | NOT IN DB`);
      } else if (!pr.isActive) {
        console.log(`  ${slug} | INACTIVE | ${pr.name}`);
      } else {
        console.log(`  ${slug} | ACTIVE   | ${pr.name}`);
      }
    }
  }

  await p.$disconnect();
}
main().catch(console.error);
