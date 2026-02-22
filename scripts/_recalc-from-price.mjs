/**
 * _recalc-from-price.mjs
 * Recalculates displayFromPrice for all active products using their
 * pricing configuration (preset tiers, fixedPrices, or basePrice).
 *
 * Usage: node scripts/_recalc-from-price.mjs
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Legacy discount (same as quote-server.js) ──
function getLegacyDiscount(qty) {
  if (qty >= 1000) return 0.82;
  if (qty >= 500) return 0.88;
  if (qty >= 250) return 0.93;
  if (qty >= 100) return 0.97;
  return 1;
}

// ── Compute minimum from-price for a product ──
function computeMinPrice(product) {
  const preset = product.pricingPreset;
  const presetConfig = preset?.config;
  const model = preset?.model;
  const optCfg = product.optionsConfig || {};
  const pricingCfg = product.pricingConfig || {};

  // 1. fixedPrices (outsourced products like business cards)
  const fixedPrices = pricingCfg.fixedPrices || optCfg.fixedPrices;
  if (fixedPrices && typeof fixedPrices === "object") {
    let minCents = Infinity;
    for (const sizeKey of Object.keys(fixedPrices)) {
      const tiers = fixedPrices[sizeKey];
      if (!tiers || typeof tiers !== "object") continue;
      for (const [qtyStr, totalCents] of Object.entries(tiers)) {
        const c = Number(totalCents);
        if (Number.isFinite(c) && c > 0 && c < minCents) minCents = c;
      }
    }
    if (minCents < Infinity) return minCents;
  }

  // 2. QTY_TIERED preset — use smallest tier qty
  if (model === "QTY_TIERED" && presetConfig) {
    const tiers = Array.isArray(presetConfig.tiers) ? presetConfig.tiers : [];
    const sorted = [...tiers]
      .filter((t) => t && typeof t === "object")
      .sort((a, b) => Number(a.minQty || 0) - Number(b.minQty || 0));
    if (sorted.length > 0) {
      const first = sorted[0];
      const qty = Number(first.minQty) || 1;
      const unitCents =
        typeof first.unitCents === "number"
          ? first.unitCents
          : typeof first.unitPriceCents === "number"
            ? first.unitPriceCents
            : 0;
      if (unitCents > 0) return Math.round(unitCents * qty);
    }
  }

  // 3. AREA_TIERED preset — use min dimensions
  if (model === "AREA_TIERED" && presetConfig) {
    const tiers = Array.isArray(presetConfig.tiers) ? presetConfig.tiers : [];
    const sorted = [...tiers]
      .filter((t) => t && typeof t === "object")
      .sort((a, b) => Number(a.minSqft || 0) - Number(b.minSqft || 0));
    if (sorted.length > 0) {
      const first = sorted[0];
      const minSize = optCfg.displayMinSize;
      const w = Number(minSize?.widthIn) || product.minWidthIn || 24;
      const h = Number(minSize?.heightIn) || product.minHeightIn || 36;
      const sqft = (w * h) / 144;
      const pricePer =
        typeof first.unitCents === "number"
          ? first.unitCents / 100
          : typeof first.pricePerSqft === "number"
            ? first.pricePerSqft
            : 0;
      if (pricePer > 0) return Math.round(pricePer * sqft * 100);
    }
  }

  // 4. QTY_OPTIONS preset — use first size, first qty tier
  if (model === "QTY_OPTIONS" && presetConfig) {
    // Try product-level optionsConfig.sizes first
    const optSizes = Array.isArray(optCfg.sizes) ? optCfg.sizes : [];
    for (const size of optSizes) {
      if (!size || typeof size !== "object") continue;
      // priceByQty: { "50": 2800, "100": 3600, ... }
      if (size.priceByQty && typeof size.priceByQty === "object") {
        const entries = Object.entries(size.priceByQty)
          .map(([q, c]) => [Number(q), Number(c)])
          .filter(([q, c]) => Number.isFinite(q) && Number.isFinite(c) && c > 0)
          .sort((a, b) => a[1] - b[1]);
        if (entries.length > 0) return Math.round(entries[0][1]);
      }
      // tiers: [{ qty, unitCents }]
      if (Array.isArray(size.tiers) && size.tiers.length > 0) {
        const sorted = [...size.tiers]
          .filter((t) => t && typeof t === "object")
          .sort((a, b) => Number(a.minQty || a.qty || 0) - Number(b.minQty || b.qty || 0));
        if (sorted.length > 0) {
          const first = sorted[0];
          const qty = Number(first.minQty || first.qty) || 1;
          const uc =
            typeof first.unitCents === "number" ? first.unitCents
            : typeof first.unitPriceCents === "number" ? first.unitPriceCents
            : 0;
          if (uc > 0) return Math.round(uc * qty);
        }
      }
    }

    // Fallback to preset config sizes
    const presetSizes = Array.isArray(presetConfig.sizes) ? presetConfig.sizes : [];
    for (const size of presetSizes) {
      if (!size || typeof size !== "object") continue;
      if (Array.isArray(size.tiers) && size.tiers.length > 0) {
        const sorted = [...size.tiers]
          .filter((t) => t && typeof t === "object")
          .sort((a, b) => Number(a.qty || a.minQty || 0) - Number(b.qty || b.minQty || 0));
        if (sorted.length > 0) {
          const first = sorted[0];
          const qty = Number(first.qty || first.minQty) || 1;
          const uc =
            typeof first.unitCents === "number" ? first.unitCents
            : typeof first.unitPriceCents === "number" ? first.unitPriceCents
            : 0;
          if (uc > 0) return Math.round(uc * qty);
        }
      }
    }
  }

  // 5. COST_PLUS — estimate from base material cost + margin at min size
  if (model === "COST_PLUS" && presetConfig) {
    const defaults = optCfg.costPlusDefaults || {};
    const w = Number(optCfg.displayMinSize?.widthIn) || product.minWidthIn || 24;
    const h = Number(optCfg.displayMinSize?.heightIn) || product.minHeightIn || 36;
    const sqft = (w * h) / 144;

    // Try to extract base rate from preset config
    const costPerSqft =
      typeof presetConfig.materialCostPerSqft === "number"
        ? presetConfig.materialCostPerSqft
        : typeof presetConfig.baseCostPerSqft === "number"
          ? presetConfig.baseCostPerSqft
          : 0;
    const margin = typeof presetConfig.marginPercent === "number"
      ? presetConfig.marginPercent / 100
      : 0.5;

    if (costPerSqft > 0) {
      const cost = costPerSqft * sqft;
      const price = cost / (1 - margin);
      return Math.round(price * 100);
    }

    // If basePrice is set, use it scaled by area
    if (product.basePrice > 0) {
      return Math.round(product.basePrice * sqft * getLegacyDiscount(1));
    }
  }

  // 6. basePrice fallback
  if (product.basePrice > 0) return product.basePrice;

  return 0;
}

// ── Main ──
(async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { pricingPreset: true },
    orderBy: { slug: "asc" },
  });

  console.log(`Processing ${products.length} active products...\n`);

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const p of products) {
    const computed = computeMinPrice(p);

    if (computed <= 0) {
      skipped++;
      continue;
    }

    if (p.displayFromPrice === computed) {
      unchanged++;
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: { displayFromPrice: computed },
    });
    updated++;

    const old = p.displayFromPrice || 0;
    const arrow = old > 0 ? `$${(old / 100).toFixed(2)} → ` : "";
    console.log(`  ${p.slug}: ${arrow}$${(computed / 100).toFixed(2)}`);
  }

  console.log(`\n========== SUMMARY ==========`);
  console.log(`  Total active : ${products.length}`);
  console.log(`  Updated      : ${updated}`);
  console.log(`  Unchanged    : ${unchanged}`);
  console.log(`  Skipped (0)  : ${skipped}`);
  console.log(`Done.`);

  await prisma.$disconnect();
})();
