import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function fallbackPresetKey(product) {
  const category = String(product.category || "");
  const pricingUnit = String(product.pricingUnit || "");

  if (pricingUnit === "per_sqft") {
    if (category === "rigid-signs") return "rigid_sheets_default";
    return "largeformat_roll_default";
  }

  // Use QTY_TIERED generic fallback for per-piece products.
  return "stickers_default";
}

async function main() {
  const catPresets = await prisma.pricingPreset.findMany({
    where: { key: { startsWith: "cat_" }, isActive: true },
    select: { id: true, key: true },
  });
  const catPresetIdSet = new Set(catPresets.map((p) => p.id));

  const activeProducts = await prisma.product.findMany({
    where: { isActive: true, pricingPresetId: { in: [...catPresetIdSet] } },
    select: {
      id: true,
      slug: true,
      category: true,
      pricingUnit: true,
      pricingPreset: { select: { key: true } },
    },
    orderBy: [{ category: "asc" }, { slug: "asc" }],
  });

  const presets = await prisma.pricingPreset.findMany({
    where: {
      key: {
        in: ["stickers_default", "largeformat_roll_default", "rigid_sheets_default"],
      },
    },
    select: { id: true, key: true },
  });
  const presetIdByKey = new Map(presets.map((p) => [p.key, p.id]));

  const plan = activeProducts.map((p) => {
    const toKey = fallbackPresetKey(p);
    return { ...p, toKey, toId: presetIdByKey.get(toKey) || null };
  });

  const invalid = plan.filter((p) => !p.toId);
  if (invalid.length > 0) {
    throw new Error(`Missing fallback presets for ${invalid.length} products`);
  }

  const byKey = {};
  for (const row of plan) byKey[row.toKey] = (byKey[row.toKey] || 0) + 1;

  console.log(`[revert-cat] cat presets active: ${catPresets.length}`);
  console.log(`[revert-cat] products to reassign: ${plan.length}`);
  console.log("[revert-cat] fallback distribution:", byKey);

  if (!APPLY) {
    console.log("[revert-cat] dry-run mode. Pass --apply to write changes.");
    console.log(
      plan
        .slice(0, 40)
        .map((r) => `${r.slug}: ${r.pricingPreset?.key} -> ${r.toKey}`)
        .join("\n")
    );
    return;
  }

  for (const row of plan) {
    await prisma.product.update({
      where: { id: row.id },
      data: { pricingPresetId: row.toId },
    });
  }

  await prisma.pricingPreset.updateMany({
    where: { key: { startsWith: "cat_" } },
    data: { isActive: false },
  });

  const remainingCat = await prisma.product.count({
    where: {
      isActive: true,
      pricingPreset: { key: { startsWith: "cat_" } },
    },
  });
  const withoutPreset = await prisma.product.count({
    where: { isActive: true, pricingPresetId: null },
  });

  console.log(`[revert-cat] remaining active products on cat_* presets: ${remainingCat}`);
  console.log(`[revert-cat] active products without preset: ${withoutPreset}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

