import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { isActive: true },
  select: {
    slug: true, name: true, category: true, pricingUnit: true, basePrice: true,
    optionsConfig: true,
    pricingPreset: { select: { model: true, key: true } },
  },
  orderBy: [{ category: "asc" }, { slug: "asc" }],
});

const byCat = {};
let totalBare = 0;
let totalConfigured = 0;

for (const p of products) {
  const opts = p.optionsConfig && typeof p.optionsConfig === "object" ? p.optionsConfig : {};
  const hasSizes = Array.isArray(opts.sizes) && opts.sizes.length > 0;
  const hasMaterials = Array.isArray(opts.materials) && opts.materials.length > 0;
  const hasEditor = !!opts.editor;
  const hasQty = Array.isArray(opts.quantityChoices) && opts.quantityChoices.length > 0;
  const configured = hasSizes || hasEditor || hasMaterials || hasQty;

  if (!byCat[p.category]) byCat[p.category] = { configured: 0, bare: 0, bareSlugs: [] };
  if (configured) {
    byCat[p.category].configured++;
    totalConfigured++;
  } else {
    byCat[p.category].bare++;
    byCat[p.category].bareSlugs.push(p.slug);
    totalBare++;
  }
}

console.log("=== Product optionsConfig Status ===\n");

for (const [cat, info] of Object.entries(byCat).sort((a, b) => a[0].localeCompare(b[0]))) {
  const total = info.configured + info.bare;
  const pct = ((info.configured / total) * 100).toFixed(0);
  console.log(`${cat.padEnd(35)} ${info.configured}/${total} configured (${pct}%)`);
  if (info.bare > 0) {
    for (const s of info.bareSlugs) {
      console.log(`  BARE: ${s}`);
    }
  }
}

console.log(`\nTOTAL: ${totalConfigured}/${totalConfigured + totalBare} configured, ${totalBare} bare`);

await prisma.$disconnect();
