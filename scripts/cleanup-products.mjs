// scripts/cleanup-products.mjs
// 1. Delete mp- prefixed duplicate products
// 2. Strip Chinese characters from all product names
// 3. Update business-cards optionsConfig to English-only labels

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Strip Chinese chars + trailing separators from a string
function stripChinese(str) {
  if (!str) return str;
  return str
    .replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g, "") // Chinese chars + fullwidth punctuation
    .replace(/\s*[/／]\s*$/g, "")   // trailing slash
    .replace(/\s*—\s*$/g, "")       // trailing dash
    .replace(/\s+$/g, "")           // trailing spaces
    .trim();
}

async function main() {
  console.log("── Product Cleanup ──\n");

  // 1. Delete mp- prefixed duplicates
  const mpProducts = await prisma.product.findMany({
    where: { slug: { startsWith: "mp-" } },
    select: { id: true, slug: true, name: true },
  });
  console.log(`Found ${mpProducts.length} mp- prefixed products to delete:`);
  for (const p of mpProducts) {
    console.log(`  - ${p.slug} (${p.name})`);
  }
  if (mpProducts.length > 0) {
    const ids = mpProducts.map((p) => p.id);
    // Delete related records first
    await prisma.productImage.deleteMany({ where: { productId: { in: ids } } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    console.log(`  ✅ Deleted ${mpProducts.length} mp- products\n`);
  }

  // 2. Strip Chinese from all product names
  const allProducts = await prisma.product.findMany({
    select: { id: true, slug: true, name: true },
  });
  let namesCleaned = 0;
  for (const p of allProducts) {
    const cleaned = stripChinese(p.name);
    if (cleaned !== p.name && cleaned.length > 0) {
      await prisma.product.update({
        where: { id: p.id },
        data: { name: cleaned },
      });
      console.log(`  Renamed: "${p.name}" → "${cleaned}"`);
      namesCleaned++;
    }
  }
  console.log(`\n  ✅ Cleaned ${namesCleaned} product names\n`);

  // 3. Update business-cards optionsConfig to English-only
  const bc = await prisma.product.findUnique({ where: { slug: "business-cards" } });
  if (bc) {
    const config = bc.optionsConfig || {};
    config.cardTypes = [
      { id: "classic",    label: "Classic",    desc: "Standard 14pt card stock" },
      { id: "gloss",      label: "Gloss",      desc: "Glossy UV coating" },
      { id: "matte",      label: "Matte",      desc: "Matte finish" },
      { id: "soft-touch", label: "Soft Touch",  desc: "Velvety soft-touch coating" },
      { id: "gold-foil",  label: "Gold Foil",   desc: "Hot foil stamping" },
      { id: "linen",      label: "Linen",      desc: "Textured linen stock" },
      { id: "pearl",      label: "Pearl",      desc: "Pearlescent shimmer finish" },
      { id: "thick",      label: "Thick",      desc: "Double or triple layered" },
    ];
    config.sidesOptions = [
      { id: "single", label: "Single Side" },
      { id: "double", label: "Double Side" },
    ];
    config.thickLayers = [
      { id: "double-layer", label: "Double Layer" },
      { id: "triple-layer", label: "Triple Layer" },
    ];
    await prisma.product.update({
      where: { slug: "business-cards" },
      data: { optionsConfig: config },
    });
    console.log("  ✅ Updated business-cards optionsConfig (English-only labels)");

    // Also update the preset addons to English-only
    if (bc.pricingPresetId) {
      const preset = await prisma.pricingPreset.findUnique({ where: { id: bc.pricingPresetId } });
      if (preset) {
        const pc = preset.config || {};
        pc.addons = [
          { id: "rounded",          name: "Rounded Corners",        price: 0.01,  type: "per_unit" },
          { id: "lam-single",       name: "Lamination (Front)",     price: 0.015, type: "per_unit" },
          { id: "lam-double",       name: "Lamination (Both)",      price: 0.025, type: "per_unit" },
          { id: "foil-single",      name: "Gold Foil (Front)",      price: 0.04,  type: "per_unit" },
          { id: "foil-double",      name: "Gold Foil (Both)",       price: 0.07,  type: "per_unit" },
          { id: "triple-layer",     name: "Triple Layer Upgrade",   price: 0.03,  type: "per_unit" },
          { id: "finish-gloss",     name: "Gloss Finish",           price: 0,     type: "flat" },
          { id: "finish-matte",     name: "Matte Finish",           price: 0,     type: "flat" },
          { id: "finish-softtouch", name: "Soft Touch Finish",      price: 0.01,  type: "per_unit" },
        ];
        await prisma.pricingPreset.update({
          where: { id: preset.id },
          data: { config: pc },
        });
        console.log("  ✅ Updated preset addons (English-only names)");
      }
    }
  }

  // 4. Final count
  const remaining = await prisma.product.count({ where: { isActive: true } });
  console.log(`\n  Total active products: ${remaining}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
