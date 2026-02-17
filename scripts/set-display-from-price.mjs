#!/usr/bin/env node
/**
 * Set displayFromPrice for AREA_TIERED products.
 *
 * These products (banners, signs, wraps) price by square footage, and the
 * automatic "from price" calculation can produce misleadingly low prices
 * (e.g. 1 sqft = $2.50) that don't reflect real purchase minimums.
 *
 * This script computes a sensible "from" price using each product's
 * minimum dimensions or a reasonable default (2×3 ft for banners, etc.)
 * and writes it to the displayFromPrice column.
 *
 * Run:  node scripts/set-display-from-price.mjs
 * Safe to re-run — only touches AREA_TIERED products.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sensible minimum display sizes by category (inches)
const CATEGORY_MIN_SIZES = {
  "banners-displays":        { w: 24, h: 36 },   // 2×3 ft
  "signs-rigid-boards":      { w: 18, h: 24 },   // 1.5×2 ft
  "vehicle-branding-advertising": { w: 24, h: 12 }, // 2ft × 1ft strip
  "safety-warning-decals":   { w: 12, h: 12 },   // 1×1 ft
  "facility-asset-labels":   { w: 12, h: 12 },   // 1×1 ft
};
const FALLBACK_SIZE = { w: 24, h: 36 }; // 2×3 ft

async function main() {
  // Load quote engine dynamically (uses path aliases, works with --loader)
  const { quoteProduct } = await import("../lib/pricing/quote-server.js");

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      pricingPreset: { model: "AREA_TIERED" },
    },
    include: { pricingPreset: true },
  });

  console.log(`Found ${products.length} AREA_TIERED products.\n`);

  let updated = 0;

  for (const product of products) {
    // Determine display minimum size
    const catSize = CATEGORY_MIN_SIZES[product.category];
    const optMinSize = product.optionsConfig?.displayMinSize;

    // Priority: product-level override > product min dimensions > category default > fallback
    const w = Number(optMinSize?.widthIn)  || product.minWidthIn  || catSize?.w || FALLBACK_SIZE.w;
    const h = Number(optMinSize?.heightIn) || product.minHeightIn || catSize?.h || FALLBACK_SIZE.h;

    let priceCents = 0;
    try {
      const result = quoteProduct(product, {
        slug: product.slug,
        quantity: 1,
        widthIn: w,
        heightIn: h,
      });
      priceCents = Number(result.totalCents) || 0;
    } catch (err) {
      console.warn(`  WARN ${product.slug}: quote failed (${err.message}), using basePrice`);
      priceCents = product.basePrice || 0;
    }

    if (priceCents <= 0) {
      console.log(`  SKIP ${product.slug}: price=0, nothing to set`);
      continue;
    }

    const sqft = ((w * h) / 144).toFixed(1);
    const changed = priceCents !== product.displayFromPrice;
    const label = changed ? "UPDATE" : "OK";

    console.log(
      `  ${label} ${product.slug}: ${w}"x${h}" (${sqft} sqft) = $${(priceCents / 100).toFixed(2)}` +
      (changed ? ` (was ${product.displayFromPrice ?? "null"})` : "")
    );

    if (changed) {
      await prisma.product.update({
        where: { id: product.id },
        data: { displayFromPrice: priceCents },
      });
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} of ${products.length} AREA_TIERED products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
