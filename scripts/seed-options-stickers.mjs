#!/usr/bin/env node
/**
 * Bulk-apply optionsConfig for stickers-labels-decals products.
 *
 * Run:  node scripts/seed-options-stickers.mjs           (dry-run)
 * Run:  node scripts/seed-options-stickers.mjs --apply   (write to DB)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

// ─── Option templates ────────────────────────────────────────────

const CUSTOM_STICKER_SIZES = {
  quantityChoices: [25, 50, 100, 250, 500, 1000],
  materials: [
    { id: "white-vinyl", name: "White Vinyl", multiplier: 1.0 },
    { id: "clear-vinyl", name: "Clear Vinyl", multiplier: 1.15 },
    { id: "holographic", name: "Holographic", multiplier: 1.4 },
    { id: "kraft-paper", name: "Kraft Paper", multiplier: 1.05 },
  ],
  addons: [
    { id: "lamination", name: "Matte Lamination", pricePer: 0, type: "per_unit", multiplier: 1.1 },
  ],
};

const DIECUT_STICKERS = {
  ...CUSTOM_STICKER_SIZES,
  ui: { cutType: "die-cut" },
};

const KISSCUT_STICKERS = {
  ...CUSTOM_STICKER_SIZES,
  ui: { cutType: "kiss-cut" },
};

const STICKER_SHEETS = {
  quantityChoices: [10, 25, 50, 100, 250, 500],
  materials: [
    { id: "white-vinyl", name: "White Vinyl", multiplier: 1.0 },
    { id: "clear-vinyl", name: "Clear Vinyl", multiplier: 1.15 },
  ],
};

const STICKER_PACKS = {
  quantityChoices: [10, 25, 50, 100, 250],
};

const ROLL_LABELS = {
  quantityChoices: [250, 500, 1000, 2500, 5000, 10000],
  materials: [
    { id: "white-bopp", name: "White BOPP", multiplier: 1.0 },
    { id: "clear-bopp", name: "Clear BOPP", multiplier: 1.1 },
    { id: "kraft-paper", name: "Kraft Paper", multiplier: 0.95 },
    { id: "white-vinyl", name: "White Vinyl", multiplier: 1.15 },
  ],
};

const BARCODE_QR_LABELS = {
  quantityChoices: [100, 250, 500, 1000, 2500, 5000],
  materials: [
    { id: "white-bopp", name: "White BOPP", multiplier: 1.0 },
    { id: "clear-bopp", name: "Clear BOPP", multiplier: 1.1 },
    { id: "polyester", name: "Polyester (weatherproof)", multiplier: 1.3 },
  ],
};

const SAFETY_LABELS_SMALL = {
  quantityChoices: [5, 10, 25, 50, 100, 250],
  materials: [
    { id: "vinyl", name: "Vinyl", multiplier: 1.0 },
    { id: "reflective", name: "Reflective", multiplier: 1.5 },
    { id: "polyester", name: "Polyester (UV-resistant)", multiplier: 1.3 },
  ],
};

const SAFETY_SIGNS = {
  quantityChoices: [1, 2, 5, 10, 25, 50],
  materials: [
    { id: "vinyl-sticker", name: "Vinyl Sticker", multiplier: 1.0 },
    { id: "aluminum", name: "Aluminum Sign", multiplier: 2.0 },
    { id: "plastic", name: "Rigid Plastic", multiplier: 1.5 },
    { id: "reflective", name: "Reflective Vinyl", multiplier: 1.6 },
  ],
};

const SAFETY_DECAL_PACK = {
  quantityChoices: [1, 2, 5, 10, 25],
};

const ASSET_TAGS = {
  quantityChoices: [50, 100, 250, 500, 1000, 2500],
  materials: [
    { id: "polyester", name: "Polyester", multiplier: 1.0 },
    { id: "tamper-evident", name: "Tamper-Evident", multiplier: 1.4 },
    { id: "metal-foil", name: "Metal Foil", multiplier: 1.6 },
  ],
};

const INDUSTRIAL_LABELS = {
  quantityChoices: [25, 50, 100, 250, 500, 1000],
  materials: [
    { id: "vinyl", name: "Vinyl", multiplier: 1.0 },
    { id: "polyester", name: "Polyester", multiplier: 1.2 },
  ],
};

const PIPE_MARKERS = {
  quantityChoices: [10, 25, 50, 100, 250],
  materials: [
    { id: "vinyl", name: "Self-Adhesive Vinyl", multiplier: 1.0 },
    { id: "snap-on", name: "Snap-On Marker", multiplier: 1.8 },
  ],
};

const WAREHOUSE_LABELS = {
  quantityChoices: [10, 25, 50, 100, 250, 500],
  materials: [
    { id: "vinyl", name: "Vinyl", multiplier: 1.0 },
    { id: "magnetic", name: "Magnetic", multiplier: 2.0 },
    { id: "reflective", name: "Reflective", multiplier: 1.5 },
  ],
};

const FOIL_STICKERS = {
  quantityChoices: [25, 50, 100, 250, 500],
  materials: [
    { id: "gold-foil", name: "Gold Foil", multiplier: 1.0 },
    { id: "silver-foil", name: "Silver Foil", multiplier: 1.0 },
    { id: "holographic", name: "Holographic", multiplier: 1.2 },
  ],
};

const CLEAR_SINGLES = {
  // AREA_TIERED — page auto-shows width/height inputs
  materials: [
    { id: "clear-vinyl", name: "Clear Vinyl", multiplier: 1.0 },
    { id: "clear-static-cling", name: "Static Cling (removable)", multiplier: 1.1 },
  ],
};

const HOLOGRAPHIC_SINGLES = {
  materials: [
    { id: "holographic-vinyl", name: "Holographic Vinyl", multiplier: 1.0 },
    { id: "iridescent", name: "Iridescent", multiplier: 1.1 },
  ],
};

// ─── Slug → template mapping ─────────────────────────────────────

const SLUG_MAP = {
  // Custom stickers — die-cut
  "die-cut-stickers": DIECUT_STICKERS,
  "die-cut-singles": CLEAR_SINGLES, // AREA_TIERED
  "stickers-die-cut-custom": DIECUT_STICKERS,
  "stickers-single-diecut": DIECUT_STICKERS,

  // Custom stickers — kiss-cut
  "kiss-cut-sticker-sheets": KISSCUT_STICKERS,
  "stickers-sheet-kisscut": KISSCUT_STICKERS,
  "stickers-multi-on-sheet": KISSCUT_STICKERS,

  // Sticker sheets & packs
  "sticker-sheets": STICKER_SHEETS,
  "sticker-packs": STICKER_PACKS,
  "stickers-color-on-clear": { ...CUSTOM_STICKER_SIZES, materials: [{ id: "clear-vinyl", name: "Clear Vinyl", multiplier: 1.0 }] },
  "stickers-color-on-white": { ...CUSTOM_STICKER_SIZES, materials: [{ id: "white-vinyl", name: "White Vinyl", multiplier: 1.0 }] },
  "heavy-duty-vinyl-stickers": { ...CUSTOM_STICKER_SIZES, materials: [{ id: "heavy-duty-vinyl", name: "Heavy-Duty Vinyl (outdoor)", multiplier: 1.0 }] },
  "removable-stickers": { ...CUSTOM_STICKER_SIZES, materials: [{ id: "removable-vinyl", name: "Removable Vinyl", multiplier: 1.0 }] },

  // Roll labels
  "roll-labels": ROLL_LABELS,
  "stickers-roll-labels": ROLL_LABELS,
  "labels-roll-quote": ROLL_LABELS,
  "labels-white-bopp": ROLL_LABELS,
  "labels-clear": { ...ROLL_LABELS, materials: [{ id: "clear-bopp", name: "Clear BOPP", multiplier: 1.0 }] },
  "white-bopp-labels": { ...ROLL_LABELS, materials: [{ id: "white-bopp", name: "White BOPP", multiplier: 1.0 }] },
  "clear-labels": { ...ROLL_LABELS, materials: [{ id: "clear-bopp", name: "Clear BOPP", multiplier: 1.0 }] },
  "freezer-labels": { ...ROLL_LABELS, materials: [{ id: "freezer-grade", name: "Freezer-Grade Vinyl", multiplier: 1.0 }] },
  "kraft-paper-labels": { ...ROLL_LABELS, materials: [{ id: "kraft-paper", name: "Kraft Paper", multiplier: 1.0 }] },

  // Barcode / QR
  "barcode-labels": BARCODE_QR_LABELS,
  "qr-code-labels": BARCODE_QR_LABELS,

  // Foil & holographic
  "foil-stickers": FOIL_STICKERS,
  "holographic-stickers": FOIL_STICKERS,
  "holographic-singles": HOLOGRAPHIC_SINGLES, // AREA_TIERED
  "clear-singles": CLEAR_SINGLES, // AREA_TIERED

  // Safety & warning — small labels
  "fire-extinguisher-location-stickers": SAFETY_LABELS_SMALL,
  "first-aid-location-stickers": SAFETY_LABELS_SMALL,
  "hazard-ghs-labels": SAFETY_LABELS_SMALL,
  "arc-flash-labels": SAFETY_LABELS_SMALL,
  "slip-trip-hazard-signs": SAFETY_LABELS_SMALL,
  "chemical-storage-labels": SAFETY_LABELS_SMALL,
  "lockout-tagout-labels": SAFETY_LABELS_SMALL,
  "no-smoking-decals-set": SAFETY_DECAL_PACK,
  "safety-notice-decal-pack": SAFETY_DECAL_PACK,
  "forklift-safety-decals": SAFETY_DECAL_PACK,
  "whmis-workplace-labels": SAFETY_LABELS_SMALL,

  // Safety signs (bigger, multiple material options)
  "high-voltage-warning-signs": SAFETY_SIGNS,
  "confined-space-warning-signs": SAFETY_SIGNS,
  "ppe-required-signs": SAFETY_SIGNS,
  "emergency-exit-egress-signs-set": SAFETY_SIGNS,

  // Asset & equipment tags
  "asset-tags-qr-barcode": ASSET_TAGS,
  "asset-tags-tamper-evident": ASSET_TAGS,
  "ppe-hard-hat-stickers": ASSET_TAGS,
  "equipment-rating-plates": ASSET_TAGS,
  "valve-tags-engraved": ASSET_TAGS,
  "tool-box-bin-labels": ASSET_TAGS,

  // Industrial labels
  "cable-panel-labels": INDUSTRIAL_LABELS,
  "electrical-panel-labels": INDUSTRIAL_LABELS,
  "crane-lift-capacity-labels": INDUSTRIAL_LABELS,
  "dock-door-numbers": INDUSTRIAL_LABELS,
  "aisle-markers-hanging": INDUSTRIAL_LABELS,

  // Pipe markers
  "pipe-markers-color-coded": PIPE_MARKERS,
  "pipe-markers-custom": PIPE_MARKERS,

  // Warehouse
  "warehouse-zone-labels": WAREHOUSE_LABELS,
  "rack-labels-warehouse": WAREHOUSE_LABELS,
  "parking-lot-stencils": { quantityChoices: [1, 2, 5, 10, 25] },
};

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true, category: "stickers-labels-decals" },
    select: { id: true, slug: true, optionsConfig: true },
    orderBy: { slug: "asc" },
  });

  console.log(`${apply ? "APPLY" : "DRY-RUN"} — ${products.length} products in stickers-labels-decals\n`);

  let updated = 0;
  let skipped = 0;
  let alreadyHas = 0;

  for (const p of products) {
    const opts = p.optionsConfig && typeof p.optionsConfig === "object" ? p.optionsConfig : {};
    const hasSizes = Array.isArray(opts.sizes) && opts.sizes.length > 0;
    const hasEditor = !!opts.editor;
    if (hasSizes || hasEditor) {
      alreadyHas++;
      continue;
    }

    const template = SLUG_MAP[p.slug];
    if (!template) {
      console.log(`  SKIP  ${p.slug.padEnd(48)} — no template defined`);
      skipped++;
      continue;
    }

    // Merge: keep existing fields, add new ones
    const merged = { ...opts, ...template };

    console.log(`  SET   ${p.slug.padEnd(48)} — qty:${(template.quantityChoices || []).join(",") || "area"} mat:${(template.materials || []).length}`);

    if (apply) {
      await prisma.product.update({
        where: { id: p.id },
        data: { optionsConfig: merged },
      });
    }
    updated++;
  }

  console.log(`\nDone: ${updated} ${apply ? "updated" : "would update"}, ${alreadyHas} already configured, ${skipped} skipped`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
