import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const BATCH1 = process.argv.includes("--batch1");

function toCentsFromTier(tier) {
  if (!tier || typeof tier !== "object") return null;
  if (typeof tier.unitCents === "number" && Number.isFinite(tier.unitCents) && tier.unitCents > 0) return Math.round(tier.unitCents);
  if (typeof tier.unitPriceCents === "number" && Number.isFinite(tier.unitPriceCents) && tier.unitPriceCents > 0) return Math.round(tier.unitPriceCents);
  if (typeof tier.unitPrice === "number" && Number.isFinite(tier.unitPrice) && tier.unitPrice > 0) return Math.round(tier.unitPrice * 100);
  return null;
}

function minTotalFromPriceByQty(size) {
  if (!size || typeof size !== "object") return null;
  const pbq = size.priceByQty;
  if (!pbq || typeof pbq !== "object") return null;

  const totals = Object.values(pbq)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0)
    .map((v) => Math.round(v));

  if (totals.length === 0) return null;
  return Math.max(1, Math.min(...totals));
}

function deriveFromOptionSizes(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return null;
  const sizes = Array.isArray(optionsConfig.sizes) ? optionsConfig.sizes : [];
  const candidates = [];

  for (const size of sizes) {
    const minTotal = minTotalFromPriceByQty(size);
    if (minTotal != null) candidates.push(minTotal);
  }

  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

function tierTotalCents(tier) {
  const unitCents = toCentsFromTier(tier);
  if (unitCents == null) return null;

  const qty = Number(tier?.qty ?? tier?.minQty ?? 1);
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  return Math.max(1, Math.round(unitCents * safeQty));
}

function deriveFromPreset(preset) {
  if (!preset || typeof preset !== "object") return null;
  const model = preset.model;
  const config = preset.config && typeof preset.config === "object" ? preset.config : {};
  const candidates = [];

  if (model === "QTY_TIERED" && Array.isArray(config.tiers)) {
    for (const tier of config.tiers) {
      const total = tierTotalCents(tier);
      if (total != null) candidates.push(total);
    }
  }

  if (model === "QTY_OPTIONS" && Array.isArray(config.sizes)) {
    for (const size of config.sizes) {
      if (!size || typeof size !== "object") continue;
      if (!Array.isArray(size.tiers)) continue;
      for (const tier of size.tiers) {
        const total = tierTotalCents(tier);
        if (total != null) candidates.push(total);
      }
    }
  }

  if (typeof config.minimumPrice === "number" && Number.isFinite(config.minimumPrice) && config.minimumPrice > 0) {
    const cents = config.minimumPrice > 100 ? Math.round(config.minimumPrice) : Math.round(config.minimumPrice * 100);
    candidates.push(cents);
  }

  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

function deriveTarget(product) {
  const fromOptions = deriveFromOptionSizes(product.optionsConfig);
  if (fromOptions != null) return { value: fromOptions, source: "options" };

  const fromPreset = deriveFromPreset(product.pricingPreset);
  if (fromPreset != null) return { value: fromPreset, source: "preset" };

  return null;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true, category: "marketing-business-print" },
    select: {
      id: true,
      slug: true,
      name: true,
      basePrice: true,
      optionsConfig: true,
      pricingPreset: { select: { key: true, model: true, config: true } },
    },
    orderBy: [{ slug: "asc" }],
  });

  const targets = BATCH1
    ? products.filter((p) => (Number(p.basePrice) || 0) >= 10000 || p.slug.startsWith("mp-") || (Number(p.basePrice) || 0) === 3900)
    : products;

  const plan = [];
  for (const p of targets) {
    const target = deriveTarget(p);
    if (!target || !Number.isFinite(target.value) || target.value <= 0) continue;

    // Safety: only auto-tune from real option price ladders.
    if (target.source !== "options") continue;

    const next = Math.max(1, Math.round(target.value));
    const current = Number(p.basePrice) || 0;
    if (next === current) continue;
    if (Math.abs(next - current) < 5) continue;

    plan.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      from: current,
      to: next,
      source: target.source,
      preset: p.pricingPreset?.key || null,
      model: p.pricingPreset?.model || null,
    });
  }

  console.log(`[marketing-baseprice] active products: ${products.length}`);
  if (BATCH1) console.log(`[marketing-baseprice] batch1 targets: ${targets.length}`);
  console.log(`[marketing-baseprice] updates planned: ${plan.length}`);
  console.log(JSON.stringify({ sample: plan.slice(0, 50) }, null, 2));

  if (!APPLY) {
    console.log(BATCH1 ? "[marketing-baseprice] dry-run only. Pass --batch1 --apply to write." : "[marketing-baseprice] dry-run only. Pass --apply to write.");
    return;
  }

  let updated = 0;
  for (const row of plan) {
    await prisma.product.update({ where: { id: row.id }, data: { basePrice: row.to } });
    updated += 1;
  }

  console.log(`[marketing-baseprice] updated: ${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
