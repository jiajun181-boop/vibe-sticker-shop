#!/usr/bin/env node
/**
 * Seed optionsConfig for vehicle-graphics-fleet products.
 *
 * Run:  node scripts/seed-options-vehicle-graphics-fleet.mjs          (dry-run)
 *       node scripts/seed-options-vehicle-graphics-fleet.mjs --apply  (write to DB)
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// ─── Material palettes ────────────────────────────────────────
const MAT_CAST_VINYL = [
  { id: "cast-vinyl", name: "Cast Vinyl (7yr)", multiplier: 1.0 },
  { id: "calendered", name: "Calendered Vinyl (3yr)", multiplier: 0.75 },
];
const MAT_VEHICLE_FULL = [
  { id: "cast-vinyl", name: "Cast Vinyl (7yr)", multiplier: 1.0 },
  { id: "cast-laminated", name: "Cast Vinyl + Laminate", multiplier: 1.2 },
];
const MAT_REFLECTIVE = [
  { id: "cast-vinyl", name: "Cast Vinyl (7yr)", multiplier: 1.0 },
  { id: "reflective", name: "Reflective (DOT)", multiplier: 1.5 },
];
const MAT_MAGNETIC = [
  { id: "magnetic-30mil", name: "Magnetic 30mil", multiplier: 1.0 },
  { id: "magnetic-45mil", name: "Magnetic 45mil (Premium)", multiplier: 1.25 },
];
const MAT_COMPLIANCE = [
  { id: "cut-vinyl", name: "Cut Vinyl", multiplier: 1.0 },
  { id: "reflective", name: "Reflective", multiplier: 1.5 },
];

// ─── Size templates ───────────────────────────────────────────
const SIZES_MAGNETIC = [
  { label: '12" x 18"', widthIn: 12, heightIn: 18, quantityChoices: [1, 2, 5, 10] },
  { label: '12" x 24"', widthIn: 12, heightIn: 24, quantityChoices: [1, 2, 5, 10] },
  { label: '18" x 24"', widthIn: 18, heightIn: 24, quantityChoices: [1, 2, 5, 10] },
];

// ─── Product → optionsConfig mapping ──────────────────────────

// AREA_TIERED wraps — materials only, dimensions via width/height input
const AREA_WRAPS = {
  "full-vehicle-wrap-design-print": { materials: MAT_VEHICLE_FULL },
  "vehicle-roof-wrap":              { materials: MAT_VEHICLE_FULL },
  "trailer-full-wrap":              { materials: MAT_VEHICLE_FULL },
  "vehicle-wrap-print-only-quote":  { materials: MAT_CAST_VINYL },
  "fleet-graphic-package":          { materials: MAT_VEHICLE_FULL },
  "partial-wrap-spot-graphics":     { materials: MAT_CAST_VINYL },
  "car-graphics":                   { materials: MAT_VEHICLE_FULL },
  "trailer-box-truck-large-graphics": { materials: MAT_CAST_VINYL },
};

// AREA_TIERED door/panel decals
const AREA_DOOR_PANEL = {
  "custom-truck-door-lettering-kit":     { materials: MAT_CAST_VINYL },
  "printed-truck-door-decals-full-color": { materials: MAT_CAST_VINYL },
  "truck-side-panel-printed-decal":      { materials: MAT_CAST_VINYL },
  "tailgate-rear-door-printed-decal":    { materials: MAT_CAST_VINYL },
};

// AREA_TIERED decals (general vehicle)
const AREA_DECALS = {
  "car-hood-decal":                      { materials: MAT_CAST_VINYL },
  "custom-cut-vinyl-lettering-any-text": { materials: MAT_CAST_VINYL },
  "custom-printed-vehicle-logo-decals":  { materials: MAT_CAST_VINYL },
  "long-term-outdoor-vehicle-decals":    { materials: MAT_CAST_VINYL },
  "removable-promo-vehicle-decals":      { materials: [{ id: "removable-vinyl", name: "Removable Vinyl", multiplier: 1.0 }, { id: "calendered", name: "Calendered Vinyl (3yr)", multiplier: 0.85 }] },
  "social-qr-vehicle-decals":            { materials: MAT_CAST_VINYL },
  "stay-back-warning-decals":            { materials: MAT_REFLECTIVE },
  "boat-lettering-registration":         { materials: MAT_CAST_VINYL },
  "bumper-sticker-custom":               { materials: MAT_CAST_VINYL },
};

// AREA_TIERED reflective/safety
const AREA_SAFETY = {
  "high-visibility-rear-chevron-kit":  { materials: MAT_REFLECTIVE },
  "reflective-conspicuity-tape-kit":   { materials: [{ id: "dot-c2-red-white", name: "DOT-C2 Red/White", multiplier: 1.0 }, { id: "dot-c2-yellow", name: "DOT-C2 Yellow", multiplier: 1.1 }] },
  "reflective-safety-stripes-kit":     { materials: MAT_REFLECTIVE },
};

// AREA_TIERED magnetic signs — with size options
const AREA_MAGNETIC = {
  "magnetic-car-signs":        { sizes: SIZES_MAGNETIC, materials: MAT_MAGNETIC },
  "magnetic-rooftop-sign":     { sizes: [{ label: '12" x 36"', widthIn: 12, heightIn: 36, quantityChoices: [1, 2, 5] }, { label: '12" x 48"', widthIn: 12, heightIn: 48, quantityChoices: [1, 2, 5] }], materials: MAT_MAGNETIC },
  "magnetic-truck-door-signs": { sizes: SIZES_MAGNETIC, materials: MAT_MAGNETIC },
  "car-door-magnets-pair":     { sizes: SIZES_MAGNETIC, materials: MAT_MAGNETIC },
};

// QTY_TIERED compliance decals
const QTY_COMPLIANCE = {
  "cvor-number-decals":            { quantityChoices: [1, 2, 5, 10, 25], materials: MAT_COMPLIANCE },
  "mc-number-decals":              { quantityChoices: [1, 2, 5, 10, 25], materials: MAT_COMPLIANCE },
  "nsc-number-decals":             { quantityChoices: [1, 2, 5, 10, 25], materials: MAT_COMPLIANCE },
  "usdot-number-decals":           { quantityChoices: [1, 2, 5, 10, 25], materials: MAT_COMPLIANCE },
  "tssa-truck-number-lettering-cut-vinyl": { quantityChoices: [1, 2, 5, 10, 25], materials: MAT_COMPLIANCE },
  "dangerous-goods-placards":      { quantityChoices: [1, 2, 5, 10, 25, 50] },
  "gvw-tare-weight-lettering":     { quantityChoices: [1, 2, 5, 10, 25], materials: MAT_COMPLIANCE },
  "truck-door-compliance-kit":     { quantityChoices: [1, 2, 5, 10], materials: MAT_COMPLIANCE },
};

// QTY_TIERED fleet labels/stickers
const QTY_FLEET_LABELS = {
  "fleet-unit-number-stickers":           { quantityChoices: [1, 2, 5, 10, 25, 50, 100], materials: MAT_COMPLIANCE },
  "equipment-id-decals-cut-vinyl":        { quantityChoices: [1, 2, 5, 10, 25, 50, 100], materials: MAT_COMPLIANCE },
  "trailer-id-number-decals":             { quantityChoices: [1, 2, 5, 10, 25, 50], materials: MAT_COMPLIANCE },
  "fuel-type-labels-diesel-gas":          { quantityChoices: [1, 2, 5, 10, 25, 50, 100] },
  "tire-pressure-load-labels":            { quantityChoices: [1, 2, 5, 10, 25, 50, 100] },
  "vehicle-inspection-maintenance-stickers": { quantityChoices: [5, 10, 25, 50, 100] },
};

// QTY_TIERED office/supplies
const QTY_OFFICE = {
  "fleet-vehicle-inspection-book": { quantityChoices: [1, 2, 5, 10, 25] },
  "hours-of-service-log-holder":   { quantityChoices: [1, 2, 5, 10, 25] },
  "ifta-cab-card-holder":          { quantityChoices: [1, 2, 5, 10, 25] },
  "magnets-flexible":              { quantityChoices: [5, 10, 25, 50, 100, 250] },
};

// Merge all configs
const CONFIG = {
  ...AREA_WRAPS,
  ...AREA_DOOR_PANEL,
  ...AREA_DECALS,
  ...AREA_SAFETY,
  ...AREA_MAGNETIC,
  ...QTY_COMPLIANCE,
  ...QTY_FLEET_LABELS,
  ...QTY_OFFICE,
};

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  const slugs = Object.keys(CONFIG);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: { id: true, slug: true, name: true, optionsConfig: true, pricingPreset: { select: { model: true } } },
  });

  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  let updated = 0;
  let skipped = 0;

  for (const [slug, newConfig] of Object.entries(CONFIG)) {
    const product = bySlug[slug];
    if (!product) {
      console.log(`  SKIP  ${slug} — not found in DB`);
      skipped++;
      continue;
    }

    const existing = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig : {};
    const merged = { ...existing };

    if (newConfig.sizes && !Array.isArray(existing.sizes)) merged.sizes = newConfig.sizes;
    if (newConfig.materials && !Array.isArray(existing.materials)) merged.materials = newConfig.materials;
    if (newConfig.quantityChoices && !Array.isArray(existing.quantityChoices)) merged.quantityChoices = newConfig.quantityChoices;

    const sizeCount = merged.sizes?.length || 0;
    const matCount = merged.materials?.length || 0;
    const qtyCount = merged.quantityChoices?.length || 0;
    const model = product.pricingPreset?.model || "?";
    const label = APPLY ? "WRITE" : "DRY  ";

    console.log(
      `  ${label} ${slug.padEnd(50)} ${model.padEnd(14)} sizes=${sizeCount} mats=${matCount} qty=${qtyCount}`
    );

    if (APPLY) {
      await prisma.product.update({
        where: { id: product.id },
        data: { optionsConfig: merged },
      });
      updated++;
    }
  }

  console.log(`\n${APPLY ? "Applied" : "Dry run"}: ${updated} updated, ${skipped} skipped of ${slugs.length} configured.`);
  if (!APPLY) console.log("Run with --apply to write to database.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
