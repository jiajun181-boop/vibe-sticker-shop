/**
 * Product Cleanup — February 2026
 *
 * 1. Deactivate 17 products (non-printable / duplicate / no equipment)
 * 2. Set 3 canvas-collage products to pricingUnit: "quote"
 *
 * Run: node scripts/product-cleanup-2026-02.mjs
 * Safe to re-run (idempotent).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUGS_TO_DEACTIVATE = [
  // Non-printable / no equipment
  "parking-lot-stencils",         // not a print product
  "valve-tags-engraved",          // needs engraver
  "equipment-rating-plates",      // metal etching
  "aisle-markers-hanging",        // aluminum hardware
  "clear-acrylic-signs",          // no UV flatbed
  "frosted-acrylic-signs",        // no UV flatbed
  "ifta-cab-card-holder",         // physical folder
  "fleet-vehicle-inspection-book",// physical booklet
  "hours-of-service-log-holder",  // physical folder

  // Duplicates
  "removable-stickers",           // dup of kiss-cut-stickers
  "labels-roll-quote",            // dup of sticker-rolls
  "canvas-gallery-wrap",          // dup of classic-canvas
  "canvas-framed",                // no float frame
  "gallery-wrap-canvas-prints",   // dup of classic-canvas
  "framed-canvas-prints",         // no float frame

  // Merged into sticker-sheets
  "kiss-cut-sticker-sheets",      // merged → sticker-sheets
  "stickers-multi-on-sheet",      // merged → sticker-sheets
];

const CANVAS_QUOTE_SLUGS = [
  "canvas-split-2",
  "canvas-split-5",
  "split-panel-canvas-prints",
];

async function main() {
  console.log("=== Product Cleanup — February 2026 ===\n");

  // --- Deactivate products ---
  for (const slug of SLUGS_TO_DEACTIVATE) {
    const product = await prisma.product.findFirst({ where: { slug } });
    if (!product) {
      console.log(`  SKIP  ${slug} — not found in DB`);
      continue;
    }
    if (!product.isActive) {
      console.log(`  SKIP  ${slug} — already inactive`);
      continue;
    }

    // Delete related records (no ProductVariant model in schema)
    const imgCount = await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const revCount = await prisma.review.deleteMany({ where: { productId: product.id } });

    // Deactivate
    await prisma.product.update({
      where: { id: product.id },
      data: { isActive: false },
    });

    console.log(`  DONE  ${slug} — deactivated (deleted ${imgCount.count} images, ${revCount.count} reviews)`);
  }

  // --- Canvas collages → quote-only ---
  console.log("\n--- Canvas collages → quote-only ---\n");
  for (const slug of CANVAS_QUOTE_SLUGS) {
    const result = await prisma.product.updateMany({
      where: { slug, isActive: true },
      data: { pricingUnit: "quote" },
    });
    if (result.count > 0) {
      console.log(`  DONE  ${slug} — set pricingUnit = "quote"`);
    } else {
      console.log(`  SKIP  ${slug} — not found or already inactive`);
    }
  }

  // --- Summary ---
  console.log("\n=== Summary ===");
  const activeCount = await prisma.product.count({ where: { isActive: true } });
  const inactiveCount = await prisma.product.count({ where: { isActive: false } });
  console.log(`  Active products:   ${activeCount}`);
  console.log(`  Inactive products: ${inactiveCount}`);
  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
