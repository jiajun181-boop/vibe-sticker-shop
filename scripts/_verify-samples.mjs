import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Sample products from each category, including ones we just seeded
const testSlugs = [
  // stickers (my seed)
  "die-cut-stickers",
  "roll-labels",
  "fire-extinguisher-location-stickers",
  // banners (my seed)
  "vinyl-banners",
  "feather-flag",
  "branded-table-cover-6ft",
  // windows (my seed)
  "frosted-privacy-film",
  "floor-graphics",
  "window-decals",
  "wall-murals",
  // signs (Claude B's territory)
  "coroplast-signs",
  "aluminum-signs",
  // vehicle (Claude B)
  "full-vehicle-wrap",
  // marketing (Claude B)
  "business-cards-standard",
];

const products = await prisma.product.findMany({
  where: { slug: { in: testSlugs } },
  select: { slug: true, category: true, optionsConfig: true, pricingUnit: true },
});

for (const slug of testSlugs) {
  const p = products.find(x => x.slug === slug);
  if (!p) {
    console.log(`\n❌ NOT FOUND: ${slug}`);
    continue;
  }
  const opts = p.optionsConfig && typeof p.optionsConfig === "object" ? p.optionsConfig : {};
  const keys = Object.keys(opts);
  const hasMat = Array.isArray(opts.materials) && opts.materials.length > 0;
  const hasQty = Array.isArray(opts.quantityChoices) && opts.quantityChoices.length > 0;
  const hasSizes = Array.isArray(opts.sizes) && opts.sizes.length > 0;
  const hasEditor = !!opts.editor;

  const flags = [];
  if (hasMat) flags.push(`materials(${opts.materials.length})`);
  if (hasQty) flags.push(`qty[${opts.quantityChoices.join(",")}]`);
  if (hasSizes) flags.push(`sizes(${opts.sizes.length})`);
  if (hasEditor) flags.push("editor");
  if (opts.addons) flags.push(`addons(${opts.addons.length})`);
  if (opts.ui) flags.push(`ui:${JSON.stringify(opts.ui)}`);

  const status = flags.length > 0 ? "✅" : "⚠️ EMPTY";
  console.log(`\n${status} ${slug} [${p.category}] (${p.pricingUnit})`);
  console.log(`   keys: ${keys.join(", ") || "(none)"}`);
  console.log(`   ${flags.join(" | ") || "NO OPTIONS"}`);
  if (hasMat) {
    console.log(`   materials: ${opts.materials.map(m => m.name).join(", ")}`);
  }
}

// Count truly empty configs
const allProducts = await prisma.product.findMany({
  where: { isActive: true },
  select: { slug: true, category: true, optionsConfig: true },
});

let empty = 0;
for (const p of allProducts) {
  const opts = p.optionsConfig && typeof p.optionsConfig === "object" ? p.optionsConfig : {};
  const hasMat = Array.isArray(opts.materials) && opts.materials.length > 0;
  const hasQty = Array.isArray(opts.quantityChoices) && opts.quantityChoices.length > 0;
  const hasSizes = Array.isArray(opts.sizes) && opts.sizes.length > 0;
  const hasEditor = !!opts.editor;
  if (!hasMat && !hasQty && !hasSizes && !hasEditor) {
    empty++;
    console.log(`\n⚠️  TRULY BARE: ${p.slug} [${p.category}] — config: ${JSON.stringify(opts)}`);
  }
}

console.log(`\n=== FINAL: ${allProducts.length - empty}/${allProducts.length} truly configured, ${empty} truly bare ===`);

await prisma.$disconnect();
