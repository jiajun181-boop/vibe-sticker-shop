import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const RATIO_LIMIT = 2.2;

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildConfig(basePriceCents) {
  const baseUnit = Math.max(0.25, Number(basePriceCents || 0) / 100);
  const qtys = [1, 5, 10, 25, 50, 100];
  const multipliers = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75];
  return {
    tiers: qtys.map((minQty, i) => ({
      minQty,
      unitPrice: Number((baseUnit * multipliers[i]).toFixed(4)),
    })),
    minimumPrice: 0,
    fileFee: 0,
    finishings: [],
    materials: [],
  };
}

function medianCents(items) {
  const vals = items.map((x) => Number(x.basePrice || 0)).sort((a, b) => a - b);
  const mid = Math.floor(vals.length / 2);
  if (vals.length % 2 === 0) return Math.round((vals[mid - 1] + vals[mid]) / 2);
  return vals[mid];
}

function bucketizeByRatio(sortedItems, ratioLimit) {
  const buckets = [];
  let cur = [];
  let min = null;
  let max = null;

  for (const item of sortedItems) {
    const p = Number(item.basePrice || 0);
    if (!cur.length) {
      cur = [item];
      min = p;
      max = p;
      continue;
    }
    const nextMin = Math.min(min, p);
    const nextMax = Math.max(max, p);
    if (nextMax / Math.max(1, nextMin) <= ratioLimit) {
      cur.push(item);
      min = nextMin;
      max = nextMax;
    } else {
      buckets.push(cur);
      cur = [item];
      min = p;
      max = p;
    }
  }
  if (cur.length) buckets.push(cur);
  return buckets;
}

async function main() {
  const autoProducts = await prisma.product.findMany({
    where: { isActive: true, pricingPreset: { key: { startsWith: "auto_base_" } } },
    select: {
      id: true,
      slug: true,
      category: true,
      basePrice: true,
      pricingPresetId: true,
    },
    orderBy: [{ category: "asc" }, { basePrice: "asc" }, { slug: "asc" }],
  });

  console.log(`[consolidate] auto products: ${autoProducts.length}`);
  if (!autoProducts.length) return;

  const groups = new Map();
  for (const p of autoProducts) {
    const key = p.category || "uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  const plan = [];
  for (const [category, items] of groups.entries()) {
    const buckets = bucketizeByRatio(items, RATIO_LIMIT);
    buckets.forEach((bucket, idx) => {
      plan.push({
        category,
        idx: idx + 1,
        count: bucket.length,
        bucket,
        medianBasePrice: medianCents(bucket),
      });
    });
  }

  console.log(`[consolidate] target consolidated presets: ${plan.length}`);
  for (const x of plan) {
    const min = Math.min(...x.bucket.map((b) => b.basePrice || 0));
    const max = Math.max(...x.bucket.map((b) => b.basePrice || 0));
    console.log(
      `  - ${x.category} #${x.idx}: ${x.count} products | base $${(min / 100).toFixed(2)}-$${(max / 100).toFixed(2)}`
    );
  }

  if (!APPLY) {
    console.log("[consolidate] dry-run mode. Pass --apply to write changes.");
    return;
  }

  let presetWrites = 0;
  let assignments = 0;

  for (const x of plan) {
    const key = `catbase_${slugify(x.category)}_${String(x.idx).padStart(2, "0")}`;
    const name = `Category Base ${x.category} #${x.idx}`;
    const preset = await prisma.pricingPreset.upsert({
      where: { key },
      update: {
        name,
        model: "QTY_TIERED",
        config: buildConfig(x.medianBasePrice),
        isActive: true,
      },
      create: {
        key,
        name,
        model: "QTY_TIERED",
        config: buildConfig(x.medianBasePrice),
        isActive: true,
      },
      select: { id: true },
    });
    presetWrites += 1;

    for (const product of x.bucket) {
      await prisma.product.update({
        where: { id: product.id },
        data: { pricingPresetId: preset.id },
      });
      assignments += 1;
    }
  }

  // deactivate old auto presets once products moved away
  const oldAutos = await prisma.pricingPreset.findMany({
    where: { key: { startsWith: "auto_base_" }, isActive: true },
    select: { id: true, key: true, _count: { select: { products: true } } },
  });
  let deactivated = 0;
  for (const p of oldAutos) {
    if (p._count.products === 0) {
      await prisma.pricingPreset.update({ where: { id: p.id }, data: { isActive: false } });
      deactivated += 1;
    }
  }

  console.log(`[consolidate] presets upserted: ${presetWrites}`);
  console.log(`[consolidate] product assignments: ${assignments}`);
  console.log(`[consolidate] deactivated old auto presets: ${deactivated}`);
}

await main()
  .catch((err) => {
    console.error("[consolidate] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

