#!/usr/bin/env node
/**
 * sync-configurator-products.mjs
 *
 * Ensures every product slug referenced by frontend configurators
 * exists in the database as an active Product record.
 *
 * - Checks all 127+ slugs from 10 configurator config files
 * - Creates missing products with correct category + pricingUnit
 * - Reactivates deactivated products (isActive: false → true)
 * - Safe to run multiple times (idempotent upsert)
 *
 * Usage: node scripts/sync-configurator-products.mjs
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── All configurator slugs grouped by category ──

const SLUGS = [
  // ── Marketing & Business Print (paper_print template) ──
  ...([
    "business-cards", "business-card-magnets", "postcards", "flyers",
    "brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold",
    "posters", "menus-laminated", "menus-takeout", "table-mat",
    "rack-cards", "door-hangers-standard", "door-hangers-perforated", "door-hangers-large",
    "greeting-cards", "letterheads", "envelopes", "bookmarks",
    "calendars-wall", "calendars-desk", "certificates", "coupons", "tickets",
    "stamps", "tags", "notepads", "document-printing", "invitation-cards",
    "table-tents", "shelf-talkers", "shelf-danglers", "shelf-wobblers",
    "retail-tags", "loyalty-cards", "tabletop-displays",
    "inserts-packaging", "presentation-folders",
  ].map(s => ({ slug: s, category: "marketing-business-print", pricingUnit: "per_piece" }))),

  // ── Business Cards (9 dedicated variants) ──
  ...([
    "business-cards-classic", "business-cards-gloss", "business-cards-matte",
    "business-cards-soft-touch", "business-cards-gold-foil", "business-cards-linen",
    "business-cards-pearl", "business-cards-thick", "magnets-business-card",
  ].map(s => ({ slug: s, category: "marketing-business-print", pricingUnit: "per_piece" }))),

  // ── Booklets ──
  ...([
    "booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o",
  ].map(s => ({ slug: s, category: "marketing-business-print", pricingUnit: "per_piece" }))),

  // ── NCR Forms ──
  ...([
    "ncr-forms-duplicate", "ncr-forms-triplicate", "ncr-invoices",
  ].map(s => ({ slug: s, category: "marketing-business-print", pricingUnit: "per_piece" }))),

  // ── Stickers & Labels (vinyl_print template) ──
  ...([
    "die-cut-stickers", "kiss-cut-stickers", "sticker-sheets",
    "roll-labels", "vinyl-lettering",
    "window-decals", "clear-singles", "floor-decals",
    "transfer-stickers", "static-cling-stickers", "magnet-stickers",
  ].map(s => ({ slug: s, category: "stickers-labels-decals", pricingUnit: "per_piece" }))),

  // ── Signs & Rigid Boards (board_sign template) ──
  ...([
    "yard-sign", "foam-board-prints", "aluminum-signs", "pvc-sintra-signs",
    "a-frame-sandwich-board", "real-estate-sign", "photo-board",
  ].map(s => ({ slug: s, category: "signs-rigid-boards", pricingUnit: "per_sqft" }))),

  // ── Banners & Displays (banner template) ──
  ...([
    "vinyl-banners", "mesh-banners", "fabric-banner", "pole-banners",
    "roll-up-banners", "x-banner-prints",
    "feather-flags", "teardrop-flags", "step-repeat-backdrops", "tabletop-banner-a3",
  ].map(s => ({ slug: s, category: "banners-displays", pricingUnit: "per_sqft" }))),

  // ── Vehicle Graphics (vinyl_cut template) ──
  ...([
    "full-vehicle-wrap-design-print", "partial-wrap-spot-graphics",
    "printed-truck-door-decals-full-color", "long-term-outdoor-vehicle-decals",
    "magnetic-car-signs", "fleet-graphic-package",
    "usdot-number-decals", "truck-door-compliance-kit",
  ].map(s => ({ slug: s, category: "vehicle-graphics-fleet", pricingUnit: "quote" }))),

  // ── Canvas Prints (canvas template) ──
  ...([
    "canvas-standard", "canvas-gallery-wrap", "canvas-framed", "canvas-panoramic",
    "canvas-split-2", "canvas-split-3", "canvas-split-5",
  ].map(s => ({ slug: s, category: "canvas-prints", pricingUnit: "per_sqft" }))),

  // ── Windows, Walls & Floors (vinyl_print template) ──
  ...([
    "window-graphics-transparent-color", "one-way-vision", "window-graphics-blockout",
    "frosted-window-graphics", "static-cling-frosted",
    "window-graphics-standard", "window-graphics-double-sided", "static-cling-standard",
    "wall-graphics", "floor-graphics",
  ].map(s => ({ slug: s, category: "windows-walls-floors", pricingUnit: "per_sqft" }))),
];

function slugToName(slug) {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  console.log(`\nChecking ${SLUGS.length} configurator product slugs...\n`);

  let created = 0;
  let reactivated = 0;
  let ok = 0;

  for (const { slug, category, pricingUnit } of SLUGS) {
    const existing = await prisma.product.findUnique({ where: { slug } });

    if (!existing) {
      // Create missing product
      await prisma.product.create({
        data: {
          slug,
          name: slugToName(slug),
          description: `Custom ${slugToName(slug).toLowerCase()}`,
          category,
          pricingUnit,
          basePrice: 0,
          isActive: true,
        },
      });
      console.log(`  ✅ CREATED: ${slug} (${category})`);
      created++;
    } else if (!existing.isActive) {
      // Reactivate
      await prisma.product.update({
        where: { slug },
        data: { isActive: true },
      });
      console.log(`  🔄 REACTIVATED: ${slug}`);
      reactivated++;
    } else {
      ok++;
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Already OK:    ${ok}`);
  console.log(`  Created:       ${created}`);
  console.log(`  Reactivated:   ${reactivated}`);
  console.log(`  Total checked: ${SLUGS.length}\n`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
