import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function numberOrNaN(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function computeMinQuoteCents(product) {
  const preset = product.pricingPreset;
  const config = preset?.config || {};
  const model = preset?.model;

  if (model === "QTY_TIERED") {
    const tiers = [...(Array.isArray(config.tiers) ? config.tiers : [])].sort(
      (a, b) => numberOrNaN(a.minQty) - numberOrNaN(b.minQty)
    );
    if (!tiers.length) throw new Error("QTY_TIERED no tiers");
    const minQty = numberOrNaN(tiers[0].minQty);
    const unitPrice = numberOrNaN(tiers[0].unitPrice);
    const fileFee = Math.max(0, numberOrNaN(config.fileFee) || 0);
    const minimumPrice = Math.max(0, numberOrNaN(config.minimumPrice) || 0);
    const raw = unitPrice * minQty + fileFee;
    return Math.round(Math.max(raw, minimumPrice) * 100);
  }

  if (model === "QTY_OPTIONS") {
    const sizes = Array.isArray(config.sizes) ? config.sizes : [];
    if (!sizes.length) throw new Error("QTY_OPTIONS no sizes");
    const firstSize = sizes[0];
    const tiers = [...(Array.isArray(firstSize.tiers) ? firstSize.tiers : [])].sort(
      (a, b) => numberOrNaN(a.qty) - numberOrNaN(b.qty)
    );
    if (!tiers.length) throw new Error("QTY_OPTIONS no tiers");
    const minQty = numberOrNaN(tiers[0].qty);
    const unitPrice = numberOrNaN(tiers[0].unitPrice);
    const fileFee = Math.max(0, numberOrNaN(config.fileFee) || 0);
    const minimumPrice = Math.max(0, numberOrNaN(config.minimumPrice) || 0);
    const raw = unitPrice * minQty + fileFee;
    return Math.round(Math.max(raw, minimumPrice) * 100);
  }

  if (model === "AREA_TIERED") {
    const tiers = [...(Array.isArray(config.tiers) ? config.tiers : [])].sort(
      (a, b) => numberOrNaN(a.upToSqft) - numberOrNaN(b.upToSqft)
    );
    if (!tiers.length) throw new Error("AREA_TIERED no tiers");
    const rate = numberOrNaN(tiers[0].rate);
    const fileFee = Math.max(0, numberOrNaN(config.fileFee) || 0);
    const minimumPrice = Math.max(0, numberOrNaN(config.minimumPrice) || 0);
    const raw = rate + fileFee; // 1 sqft sample
    return Math.round(Math.max(raw, minimumPrice) * 100);
  }

  throw new Error(`Unknown pricing model: ${String(model)}`);
}

function buildBaseDrivenQtyTieredConfig(basePriceCents) {
  const baseUnit = Math.max(0.25, Number(basePriceCents || 0) / 100);
  const qtys = [1, 5, 10, 25, 50, 100];
  const multipliers = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75];
  const tiers = qtys.map((minQty, i) => ({
    minQty,
    unitPrice: Number((baseUnit * multipliers[i]).toFixed(4)),
  }));
  return {
    tiers,
    minimumPrice: 0,
    fileFee: 0,
    finishings: [],
    materials: [],
  };
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      basePrice: true,
      pricingPresetId: true,
      pricingPreset: { select: { key: true, model: true, config: true, isActive: true } },
    },
    orderBy: { slug: "asc" },
  });

  const targets = [];
  for (const p of products) {
    if (!p.pricingPreset || !p.pricingPreset.isActive) continue;
    if (p.pricingPreset.key !== "stickers_default") continue;
    if (!p.basePrice || p.basePrice <= 0) continue;

    const minQuoteCents = computeMinQuoteCents(p);
    const ratio = minQuoteCents / p.basePrice;
    if (ratio < 0.35 || ratio > 3.5) {
      targets.push({
        id: p.id,
        slug: p.slug,
        basePrice: p.basePrice,
        ratio: Number(ratio.toFixed(2)),
        minQuoteCents,
      });
    }
  }

  console.log(`[outlier-fix] targets: ${targets.length}`);
  if (!targets.length) return;

  for (const t of targets.slice(0, 20)) {
    console.log(
      `  - ${t.slug} | base $${(t.basePrice / 100).toFixed(2)} | min $${(t.minQuoteCents / 100).toFixed(2)} | ratio ${t.ratio}`
    );
  }
  if (targets.length > 20) console.log(`  ... and ${targets.length - 20} more`);

  if (!APPLY) {
    console.log("[outlier-fix] dry-run mode. Pass --apply to write changes.");
    return;
  }

  let createdOrUpdated = 0;
  let assigned = 0;

  for (const t of targets) {
    const key = `auto_base_${t.slug}`.slice(0, 120);
    const name = `Auto Base Price - ${t.slug}`.slice(0, 190);
    const config = buildBaseDrivenQtyTieredConfig(t.basePrice);

    const preset = await prisma.pricingPreset.upsert({
      where: { key },
      update: {
        name,
        model: "QTY_TIERED",
        config,
        isActive: true,
      },
      create: {
        key,
        name,
        model: "QTY_TIERED",
        config,
        isActive: true,
      },
      select: { id: true },
    });
    createdOrUpdated += 1;

    await prisma.product.update({
      where: { id: t.id },
      data: { pricingPresetId: preset.id },
    });
    assigned += 1;
  }

  console.log(`[outlier-fix] presets upserted: ${createdOrUpdated}`);
  console.log(`[outlier-fix] products reassigned: ${assigned}`);
}

await main()
  .catch((e) => {
    console.error("[outlier-fix] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

