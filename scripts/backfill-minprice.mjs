#!/usr/bin/env node
/**
 * Backfill `minPrice` for all active products using the pricing engine.
 * Respects `displayFromPrice` when already set (does not overwrite it).
 *
 * Run:  node scripts/backfill-minprice.mjs           (dry-run)
 * Run:  node scripts/backfill-minprice.mjs --apply   (write to DB)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

/**
 * Inline from-price calculator — mirrors lib/pricing/from-price.js logic
 * but avoids @/ alias imports so it can run as a standalone script.
 * Also checks product-level optionsConfig.sizes for split-product pricing.
 */
function computeMinPriceCents(product) {
  if (!product) return 0;
  try {
    // 1) Product-level optionsConfig sizes (split products like business card variants)
    const optionSizes = Array.isArray(product.optionsConfig?.sizes) ? product.optionsConfig.sizes : [];
    if (optionSizes.length > 0) {
      let lowestCents = Infinity;
      for (const size of optionSizes) {
        // priceByQty lookup
        if (size.priceByQty && typeof size.priceByQty === "object") {
          for (const total of Object.values(size.priceByQty)) {
            const c = Math.round(Number(total));
            if (Number.isFinite(c) && c > 0 && c < lowestCents) lowestCents = c;
          }
        }
        // Per-size tiers
        if (Array.isArray(size.tiers)) {
          for (const tier of size.tiers) {
            const qty = Number(tier.qty ?? tier.minQty ?? 0);
            const unitPrice = Number(tier.unitPrice ?? tier.unitPriceCents ? (tier.unitPriceCents / 100) : 0);
            const unitCents = tier.unitCents != null ? Number(tier.unitCents) : Math.round(unitPrice * 100);
            if (qty > 0 && unitCents > 0) {
              const total = unitCents * qty;
              if (total < lowestCents) lowestCents = total;
            }
          }
        }
      }
      if (Number.isFinite(lowestCents) && lowestCents > 0) return lowestCents;
    }

    // 2) Pricing preset
    const preset = product.pricingPreset;
    const config = preset?.config;
    const model = preset?.model;
    if (!config || !model) return product.basePrice || 0;

    if (model === "QTY_TIERED") {
      const tiers = Array.isArray(config.tiers) ? config.tiers : [];
      const sorted = [...tiers].sort((a, b) => Number(a.minQty) - Number(b.minQty));
      if (!sorted.length) return product.basePrice || 0;
      const minQty = Number(sorted[0].minQty) || 1;
      const unitPrice = Number(sorted[0].unitPrice) || 0;
      const fileFee = Number(config.fileFee || 0);
      const minimumPrice = Number(config.minimumPrice || 0);
      const raw = unitPrice * minQty + fileFee;
      return Math.round(Math.max(raw, minimumPrice) * 100);
    }

    if (model === "AREA_TIERED") {
      const tiers = Array.isArray(config.tiers) ? config.tiers : [];
      if (!tiers.length) return product.basePrice || 0;
      // Use the lowest rate * 1 sqft (12x12 in) as minimum
      const lowestRate = Math.min(...tiers.map((t) => Number(t.rate)).filter((r) => r > 0));
      const fileFee = Number(config.fileFee || 0);
      const minimumPrice = Number(config.minimumPrice || 0);
      const raw = lowestRate * 1 + fileFee; // 1 sqft
      return Math.round(Math.max(raw, minimumPrice) * 100);
    }

    if (model === "QTY_OPTIONS") {
      const sizes = Array.isArray(config.sizes) ? config.sizes : [];
      if (!sizes.length) return product.basePrice || 0;
      let lowestCents = Infinity;
      for (const size of sizes) {
        const tiers = Array.isArray(size.tiers) ? size.tiers : [];
        const sorted = [...tiers].sort((a, b) => Number(a.qty) - Number(b.qty));
        if (!sorted.length) continue;
        const minQty = Number(sorted[0].qty) || 1;
        const unitPrice = Number(sorted[0].unitPrice) || 0;
        const fileFee = Number(config.fileFee || 0);
        const minimumPrice = Number(config.minimumPrice || 0);
        const raw = unitPrice * minQty + fileFee;
        const cents = Math.round(Math.max(raw, minimumPrice) * 100);
        if (cents > 0 && cents < lowestCents) lowestCents = cents;
      }
      return Number.isFinite(lowestCents) && lowestCents > 0 ? lowestCents : (product.basePrice || 0);
    }

    return product.basePrice || 0;
  } catch {
    return product.basePrice || 0;
  }
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { pricingPreset: true },
    orderBy: { slug: "asc" },
  });

  console.log(`${apply ? "APPLY" : "DRY-RUN"} — ${products.length} active products\n`);

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const p of products) {
    const computed = computeMinPriceCents(p);
    if (computed <= 0) {
      console.log(`  SKIP  ${p.slug.padEnd(48)} — no price computable`);
      skipped++;
      continue;
    }

    if (p.minPrice === computed) {
      unchanged++;
      continue;
    }

    const display = p.displayFromPrice || computed;
    console.log(
      `  ${p.minPrice ? "UPD" : "SET"}   ${p.slug.padEnd(48)} minPrice=$${(computed / 100).toFixed(2)}` +
      (p.displayFromPrice ? `  displayFromPrice=$${(p.displayFromPrice / 100).toFixed(2)} (kept)` : "")
    );

    if (apply) {
      await prisma.product.update({
        where: { id: p.id },
        data: { minPrice: computed },
      });
    }
    updated++;
  }

  console.log(`\nDone: ${updated} ${apply ? "updated" : "would update"}, ${unchanged} unchanged, ${skipped} skipped`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
