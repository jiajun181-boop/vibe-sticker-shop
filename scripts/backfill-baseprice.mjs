#!/usr/bin/env node
/**
 * Backfill basePrice for all products where basePrice <= 0
 * using the pricing engine inline (no @/ alias).
 *
 * Run:  node scripts/backfill-baseprice.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Minimal inline from-price calculator (mirrors lib/pricing/from-price.js
 * but without @/ imports).
 */
function computeFromPriceInline(product) {
  if (!product) return 0;
  try {
    const preset = product.pricingPreset;
    const config = preset?.config;
    const model = preset?.model;
    if (!config || !model) return 0;

    if (model === "QTY_TIERED") {
      const tiers = Array.isArray(config.tiers) ? config.tiers : [];
      const sorted = [...tiers].sort((a, b) => Number(a.minQty) - Number(b.minQty));
      if (!sorted.length) return 0;
      const minQty = Number(sorted[0].minQty) || 1;
      const unitPrice = Number(sorted[0].unitPrice) || 0;
      const fileFee = Number(config.fileFee || 0);
      const minimumPrice = Number(config.minimumPrice || 0);
      const raw = unitPrice * minQty + fileFee;
      return Math.round(Math.max(raw, minimumPrice) * 100);
    }

    if (model === "AREA_TIERED") {
      const tiers = Array.isArray(config.tiers) ? config.tiers : [];
      if (!tiers.length) return 0;
      const sorted = [...tiers].sort((a, b) => Number(a.upToSqft) - Number(b.upToSqft));
      // 1 sqft = 12x12 inches, qty 1
      const sqft = 1;
      const tier = sorted.find((t) => sqft <= Number(t.upToSqft)) || sorted[sorted.length - 1];
      const rate = Number(tier.rate);
      const fileFee = Number(config.fileFee || 0);
      const minimumPrice = Number(config.minimumPrice || 0);
      const raw = rate * sqft + fileFee;
      return Math.round(Math.max(raw, minimumPrice) * 100);
    }

    if (model === "QTY_OPTIONS") {
      const sizes = Array.isArray(config.sizes) ? config.sizes : [];
      if (!sizes.length) return 0;
      const firstSize = sizes[0];
      const tiers = Array.isArray(firstSize.tiers) ? firstSize.tiers : [];
      const sorted = [...tiers].sort((a, b) => Number(a.qty) - Number(b.qty));
      if (!sorted.length) return 0;
      const minQty = Number(sorted[0].qty) || 1;
      const unitPrice = Number(sorted[0].unitPrice) || 0;
      const fileFee = Number(config.fileFee || 0);
      const minimumPrice = Number(config.minimumPrice || 0);
      const raw = unitPrice * minQty + fileFee;
      return Math.round(Math.max(raw, minimumPrice) * 100);
    }

    return 0;
  } catch {
    return 0;
  }
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true, basePrice: { lte: 0 } },
    include: { pricingPreset: true },
    orderBy: { slug: "asc" },
  });

  console.log(`Found ${products.length} products with basePrice <= 0\n`);

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    const fromPrice = computeFromPriceInline(p);
    if (fromPrice > 0) {
      await prisma.product.update({
        where: { id: p.id },
        data: { basePrice: fromPrice },
      });
      console.log(`  ${p.slug.padEnd(48)} → $${(fromPrice / 100).toFixed(2)}`);
      updated++;
    } else {
      console.log(`  ${p.slug.padEnd(48)} — no preset / could not compute`);
      skipped++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
