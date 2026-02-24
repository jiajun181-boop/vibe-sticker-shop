const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = ['marketing-business-print','business-cards','stamps','business-forms','paper-marketing','flyers-brochures','posters-prints','marketing-prints','retail-promo','packaging'];
  const products = await prisma.product.findMany({
    where: { category: { in: cats }, isActive: true },
    select: { slug: true, name: true, category: true },
    orderBy: { name: 'asc' },
  });
  products.forEach(p => console.log(p.category + ' | ' + p.slug + ' | ' + p.name));
  console.log('---');
  console.log('Total:', products.length);

  // Check specific slugs from MARKETING_PRICE_MAP
  const checkSlugs = [
    'flyers',
    'business-cards-classic', 'business-cards-gloss', 'business-cards-matte',
    'ncr-forms-duplicate', 'ncr-forms-triplicate', 'ncr-invoices',
    'brochures-bi-fold', 'brochures-tri-fold', 'brochures-z-fold',
    'table-tents-4x6', 'table-tent-cards', 'table-display-cards',
  ];
  console.log('\n--- Checking specific slug matches ---');
  for (const s of checkSlugs) {
    const found = products.find(p => p.slug === s);
    console.log(s + ': ' + (found ? 'FOUND (' + found.category + ')' : 'MISSING'));
  }

  await prisma.$disconnect();
}
main().catch(console.error);
