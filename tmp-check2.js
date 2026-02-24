const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MARKETING_PRICE_MAP = {
  "business-cards": ["business-cards-classic", "business-cards-gloss", "business-cards-matte", "business-cards-soft-touch", "business-cards-gold-foil", "business-cards-linen", "business-cards-pearl", "business-cards-thick"],
  "flyers": ["flyers"],
  "brochures": ["brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold"],
  "postcards": ["postcards"],
  "posters": ["posters", "posters-glossy", "posters-matte", "posters-adhesive", "posters-backlit"],
  "booklets": ["booklets", "booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o"],
  "letterhead": ["letterhead"],
  "notepads": ["notepads", "notepads-custom"],
  "stamps": ["stamps-s510", "stamps-s520", "stamps-s827", "stamps-s542", "stamps-r512", "stamps-r524", "stamps-r532", "stamps-r552"],
  "calendars": ["calendars-wall", "calendars-wall-desk"],
  "certificates": ["certificates"],
  "envelopes": ["envelopes"],
  "menus": ["menus-laminated", "menus-takeout", "table-mat"],
  "table-tents": ["table-tents-4x6", "table-tent-cards", "table-display-cards"],
  "shelf-displays": ["shelf-talkers", "shelf-danglers", "shelf-wobblers"],
  "rack-cards": ["rack-cards"],
  "door-hangers": ["door-hangers-standard", "door-hangers-perforated", "door-hangers-large"],
  "tags": ["hang-tags", "retail-tags"],
  "ncr-forms": ["ncr-forms-duplicate", "ncr-forms-triplicate", "ncr-invoices"],
  "tickets-coupons": ["tickets", "coupons", "loyalty-cards"],
  "greeting-invitation-cards": ["greeting-cards", "invitation-cards", "invitations-flat"],
  "bookmarks": ["bookmarks", "bookmarks-custom"],
  "loyalty-cards": ["loyalty-cards"],
  "document-printing": ["document-printing"],
};

async function main() {
  const cats = ['marketing-business-print','business-cards','stamps','business-forms','paper-marketing','flyers-brochures','posters-prints','marketing-prints','retail-promo','packaging'];
  const products = await prisma.product.findMany({
    where: { category: { in: cats }, isActive: true },
    select: { slug: true, basePrice: true },
  });

  const marketingPrices = {};
  for (const [key, slugs] of Object.entries(MARKETING_PRICE_MAP)) {
    const slugSet = new Set(slugs);
    const matching = products.filter(p => slugSet.has(p.slug));
    if (matching.length > 0) {
      const prices = matching.map(p => p.basePrice || 0).filter(p => p > 0);
      marketingPrices[key] = prices.length > 0 ? Math.min(...prices) : 0;
    }
  }

  console.log('=== marketingPrices keys (items that would render) ===');
  for (const [key, price] of Object.entries(marketingPrices).sort((a,b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${key}: ${price} cents ($${(price/100).toFixed(2)})`);
  }

  const allSectionItems = [
    'business-cards', 'flyers', 'brochures', 'postcards', 'posters', 'booklets',
    'letterhead', 'notepads', 'stamps', 'calendars', 'certificates', 'envelopes',
    'menus', 'table-tents', 'shelf-displays', 'rack-cards', 'door-hangers', 'tags',
    'ncr-forms', 'tickets-coupons', 'greeting-invitation-cards', 'bookmarks', 'loyalty-cards', 'document-printing',
  ];

  console.log('\n=== Items NOT in marketingPrices (would NOT render) ===');
  const missing = allSectionItems.filter(item => !(item in marketingPrices));
  if (missing.length === 0) console.log('  (none - all items would render)');
  else missing.forEach(m => console.log(`  MISSING: ${m}`));

  await prisma.$disconnect();
}
main().catch(console.error);
