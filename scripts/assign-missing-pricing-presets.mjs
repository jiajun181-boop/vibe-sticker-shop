import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function resolvePresetKey(product) {
  const category = String(product.category || "");
  const pricingUnit = String(product.pricingUnit || "");

  if (pricingUnit === "per_sqft") {
    if (category === "rigid-signs") return "rigid_sheets_default";
    return "largeformat_roll_default";
  }

  // Per-piece fallback should always be quoteable without sizeLabel.
  // Use QTY_TIERED baseline, then tune category-specific presets later.
  return "stickers_default";
}

async function main() {
  const presets = await prisma.pricingPreset.findMany({
    where: { isActive: true },
    select: { id: true, key: true, model: true },
  });
  const presetIdByKey = new Map(presets.map((p) => [p.key, p.id]));

  const missing = await prisma.product.findMany({
    where: { isActive: true, pricingPresetId: null },
    select: { id: true, slug: true, category: true, pricingUnit: true },
    orderBy: [{ category: "asc" }, { slug: "asc" }],
  });

  const plan = missing
    .map((p) => {
      const key = resolvePresetKey(p);
      const presetId = presetIdByKey.get(key) || null;
      return { ...p, key, presetId };
    })
    .filter((p) => p.presetId);

  const byKey = {};
  for (const row of plan) byKey[row.key] = (byKey[row.key] || 0) + 1;

  console.log(`[pricing-assign] missing active products: ${missing.length}`);
  console.log(`[pricing-assign] planned assignments: ${plan.length}`);
  console.log("[pricing-assign] by preset:", byKey);

  if (!APPLY) {
    console.log("[pricing-assign] dry-run mode. Pass --apply to write changes.");
    const preview = plan.slice(0, 30).map((p) => `${p.slug} -> ${p.key}`);
    console.log(preview.join("\n"));
    return;
  }

  let updated = 0;
  for (const row of plan) {
    await prisma.product.update({
      where: { id: row.id },
      data: { pricingPresetId: row.presetId },
    });
    updated += 1;
  }

  const remaining = await prisma.product.count({
    where: { isActive: true, pricingPresetId: null },
  });

  console.log(`[pricing-assign] updated: ${updated}`);
  console.log(`[pricing-assign] remaining unassigned active products: ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

