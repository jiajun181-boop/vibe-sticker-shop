import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { isActive: true, category: "windows-walls-floors" },
  select: {
    slug: true, name: true, pricingUnit: true, basePrice: true,
    optionsConfig: true, tags: true,
    pricingPreset: { select: { model: true, key: true } },
  },
  orderBy: { slug: "asc" },
});

console.log(`Total active products in windows-walls-floors: ${products.length}\n`);

let bare = 0;
let configured = 0;

for (const p of products) {
  const opts = p.optionsConfig && typeof p.optionsConfig === "object" ? p.optionsConfig : {};
  const hasSizes = Array.isArray(opts.sizes) && opts.sizes.length > 0;
  const hasMaterials = Array.isArray(opts.materials) && opts.materials.length > 0;
  const hasEditor = !!opts.editor;
  if (hasSizes || hasEditor || hasMaterials) {
    configured++;
    console.log(
      "  OK  ",
      p.slug.padEnd(48),
      "configured"
    );
    continue;
  }
  bare++;
  const model = p.pricingPreset?.model || "NONE";
  const key = p.pricingPreset?.key || "";
  console.log(
    "  BARE",
    p.slug.padEnd(48),
    model.padEnd(14),
    key.padEnd(35),
    p.pricingUnit.padEnd(10),
    "$" + (p.basePrice / 100).toFixed(2)
  );
}

console.log(`\n${bare} bare, ${configured} configured`);

await prisma.$disconnect();
