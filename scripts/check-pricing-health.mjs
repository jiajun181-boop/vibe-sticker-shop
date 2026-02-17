import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hasSizePricing(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return false;
  const sizes = Array.isArray(optionsConfig.sizes) ? optionsConfig.sizes : [];
  return sizes.some((s) => {
    if (!s || typeof s !== "object") return false;
    if (s.priceByQty && typeof s.priceByQty === "object" && Object.keys(s.priceByQty).length > 0) return true;
    if (typeof s.unitCents === "number" || typeof s.unitPriceCents === "number") return true;
    if (Array.isArray(s.tiers) && s.tiers.length > 0) return true;
    return false;
  });
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      name: true,
      category: true,
      type: true,
      basePrice: true,
      pricingUnit: true,
      pricingPresetId: true,
      optionsConfig: true,
    },
  });

  const missingQuoteability = [];
  const nonPositiveBase = [];
  const suspiciousLow = [];
  const suspiciousHigh = [];
  const fallbackOnly = [];
  const byCategoryValues = {};

  for (const p of products) {
    const hasPreset = !!p.pricingPresetId;
    const hasBase = Number.isFinite(p.basePrice) && p.basePrice > 0;
    const hasOptions = hasSizePricing(p.optionsConfig);

    if (!hasPreset && !hasBase && !hasOptions) {
      missingQuoteability.push(p);
    }
    if (!hasBase) {
      nonPositiveBase.push(p);
    }
    if (!hasPreset && hasBase && !hasOptions) {
      fallbackOnly.push(p);
    }

    byCategoryValues[p.category] ||= [];
    if (hasBase) byCategoryValues[p.category].push(p.basePrice);
  }

  const catMedian = Object.fromEntries(
    Object.entries(byCategoryValues).map(([cat, vals]) => [cat, median(vals)])
  );

  for (const p of products) {
    const base = Number(p.basePrice) || 0;
    if (base <= 0) continue;
    const med = catMedian[p.category] || 0;

    if (p.category !== "packaging" && p.pricingUnit === "per_piece" && base < 100) {
      suspiciousLow.push({ ...p, reason: "per_piece below 100 cents outside packaging" });
      continue;
    }
    if (med > 0 && base < Math.round(med * 0.2)) {
      suspiciousLow.push({ ...p, reason: `below 20% of category median (${med})` });
    }
    if (med > 0 && base > Math.round(med * 5)) {
      suspiciousHigh.push({ ...p, reason: `above 5x category median (${med})` });
    }
  }

  const byCategoryFallback = {};
  for (const p of fallbackOnly) {
    byCategoryFallback[p.category] = (byCategoryFallback[p.category] || 0) + 1;
  }

  const report = {
    totals: {
      activeProducts: products.length,
      missingQuoteability: missingQuoteability.length,
      nonPositiveBase: nonPositiveBase.length,
      fallbackOnly: fallbackOnly.length,
      suspiciousLow: suspiciousLow.length,
      suspiciousHigh: suspiciousHigh.length,
    },
    categoryMedianBasePrice: catMedian,
    fallbackOnlyByCategory: byCategoryFallback,
    samples: {
      missingQuoteability: missingQuoteability.slice(0, 20),
      suspiciousLow: suspiciousLow.slice(0, 20),
      suspiciousHigh: suspiciousHigh.slice(0, 20),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

