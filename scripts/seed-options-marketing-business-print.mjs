#!/usr/bin/env node
/**
 * Seed optionsConfig for marketing-business-print products.
 * Covers: mp-* marketing packages, stamps, cardstock-prints, table-mat.
 *
 * Run:  node scripts/seed-options-marketing-business-print.mjs          (dry-run)
 *       node scripts/seed-options-marketing-business-print.mjs --apply  (write to DB)
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// ─── Size & Material templates ────────────────────────────────

// Marketing package (mp-) products — QTY_TIERED with size options
const SIZES_BROCHURE = [
  { label: '8.5" x 11" Tri-fold', widthIn: 8.5, heightIn: 11, quantityChoices: [100, 250, 500, 1000, 2500] },
  { label: '8.5" x 14" Tri-fold', widthIn: 8.5, heightIn: 14, quantityChoices: [100, 250, 500, 1000, 2500] },
  { label: '11" x 17" Bi-fold', widthIn: 11, heightIn: 17, quantityChoices: [100, 250, 500, 1000, 2500] },
];
const SIZES_COUPON = [
  { label: '2" x 3.5" (Business card)', widthIn: 2, heightIn: 3.5, quantityChoices: [250, 500, 1000, 2500, 5000] },
  { label: '3.5" x 8.5" (Rack card)', widthIn: 3.5, heightIn: 8.5, quantityChoices: [250, 500, 1000, 2500, 5000] },
  { label: '4" x 6" (Postcard)', widthIn: 4, heightIn: 6, quantityChoices: [250, 500, 1000, 2500, 5000] },
];
const SIZES_DOOR_HANGER = [
  { label: '3.5" x 8.5"', widthIn: 3.5, heightIn: 8.5, quantityChoices: [250, 500, 1000, 2500, 5000] },
  { label: '4.25" x 11"', widthIn: 4.25, heightIn: 11, quantityChoices: [250, 500, 1000, 2500, 5000] },
];
const SIZES_POSTCARD = [
  { label: '4" x 6"', widthIn: 4, heightIn: 6, quantityChoices: [100, 250, 500, 1000, 2500, 5000] },
  { label: '5" x 7"', widthIn: 5, heightIn: 7, quantityChoices: [100, 250, 500, 1000, 2500, 5000] },
  { label: '6" x 9"', widthIn: 6, heightIn: 9, quantityChoices: [100, 250, 500, 1000, 2500] },
];
const SIZES_LETTERHEAD = [
  { label: '8.5" x 11" (Letter)', widthIn: 8.5, heightIn: 11, quantityChoices: [100, 250, 500, 1000, 2500] },
];
const SIZES_NOTEPAD = [
  { label: '4" x 6" (50 sheets)', widthIn: 4, heightIn: 6, quantityChoices: [10, 25, 50, 100, 250] },
  { label: '5.5" x 8.5" (50 sheets)', widthIn: 5.5, heightIn: 8.5, quantityChoices: [10, 25, 50, 100, 250] },
  { label: '8.5" x 11" (50 sheets)', widthIn: 8.5, heightIn: 11, quantityChoices: [10, 25, 50, 100, 250] },
];
const SIZES_CERT = [
  { label: '8.5" x 11"', widthIn: 8.5, heightIn: 11, quantityChoices: [25, 50, 100, 250, 500] },
];
const SIZES_MENU = [
  { label: '8.5" x 11" (Single page)', widthIn: 8.5, heightIn: 11, quantityChoices: [25, 50, 100, 250, 500] },
  { label: '8.5" x 14" (Legal)', widthIn: 8.5, heightIn: 14, quantityChoices: [25, 50, 100, 250, 500] },
  { label: '11" x 17" (Tabloid fold)', widthIn: 11, heightIn: 17, quantityChoices: [25, 50, 100, 250, 500] },
];
const SIZES_TICKET = [
  { label: '2" x 5.5"', widthIn: 2, heightIn: 5.5, quantityChoices: [250, 500, 1000, 2500, 5000] },
  { label: '2.75" x 8.5"', widthIn: 2.75, heightIn: 8.5, quantityChoices: [250, 500, 1000, 2500, 5000] },
];
const SIZES_FOLDER = [
  { label: '9" x 12" (Standard)', widthIn: 9, heightIn: 12, quantityChoices: [50, 100, 250, 500, 1000] },
  { label: '9.5" x 14.5" (Legal)', widthIn: 9.5, heightIn: 14.5, quantityChoices: [50, 100, 250, 500] },
];
const SIZES_HANG_TAG = [
  { label: '2" x 3.5"', widthIn: 2, heightIn: 3.5, quantityChoices: [100, 250, 500, 1000, 2500] },
  { label: '2.5" x 4"', widthIn: 2.5, heightIn: 4, quantityChoices: [100, 250, 500, 1000, 2500] },
  { label: '3" x 5"', widthIn: 3, heightIn: 5, quantityChoices: [100, 250, 500, 1000, 2500] },
];

// Paper stock materials for mp- products
const MAT_PAPER = [
  { id: "14pt-gloss", name: "14pt Gloss", multiplier: 1.0 },
  { id: "14pt-matte", name: "14pt Matte", multiplier: 1.0 },
  { id: "16pt-gloss", name: "16pt Gloss", multiplier: 1.15 },
  { id: "uncoated-100lb", name: "100lb Uncoated", multiplier: 0.9 },
];
const MAT_PAPER_LIGHT = [
  { id: "100lb-gloss", name: "100lb Gloss Text", multiplier: 1.0 },
  { id: "100lb-matte", name: "100lb Matte Text", multiplier: 1.0 },
  { id: "80lb-uncoated", name: "80lb Uncoated", multiplier: 0.85 },
];
const MAT_NOTEPAD = [
  { id: "60lb-uncoated", name: "60lb Uncoated", multiplier: 1.0 },
  { id: "70lb-uncoated", name: "70lb Uncoated", multiplier: 1.1 },
];
const MAT_FOLDER = [
  { id: "14pt-gloss", name: "14pt Gloss", multiplier: 1.0 },
  { id: "16pt-matte", name: "16pt Matte", multiplier: 1.1 },
  { id: "linen", name: "Linen Textured", multiplier: 1.25 },
];

// ─── Stamp configs ────────────────────────────────────────────
function stampConfig(label, widthMm, heightMm, shape) {
  return {
    quantityChoices: [1, 2, 5, 10],
    sizes: [{ label, widthIn: +(widthMm / 25.4).toFixed(2), heightIn: +(heightMm / 25.4).toFixed(2) }],
    editor: {
      type: "text",
      mode: "box",
      sizes: [{
        label,
        shape: shape || "rect",
        mm: `${widthMm}x${heightMm}`,
        widthIn: +(widthMm / 25.4).toFixed(2),
        heightIn: +(heightMm / 25.4).toFixed(2),
      }],
    },
  };
}

// ─── Product → optionsConfig mapping ──────────────────────────
const CONFIG = {
  // mp- marketing packages
  "mp-brochures":             { sizes: SIZES_BROCHURE, materials: MAT_PAPER_LIGHT },
  "mp-certificates":          { sizes: SIZES_CERT, materials: MAT_PAPER },
  "mp-coupons":               { sizes: SIZES_COUPON, materials: MAT_PAPER },
  "mp-door-hangers":          { sizes: SIZES_DOOR_HANGER, materials: MAT_PAPER },
  "mp-letterhead":            { sizes: SIZES_LETTERHEAD, materials: MAT_PAPER_LIGHT },
  "mp-menus":                 { sizes: SIZES_MENU, materials: MAT_PAPER },
  "mp-notepads":              { sizes: SIZES_NOTEPAD, materials: MAT_NOTEPAD },
  "mp-postcards":             { sizes: SIZES_POSTCARD, materials: MAT_PAPER },
  "mp-presentation-folders":  { sizes: SIZES_FOLDER, materials: MAT_FOLDER },
  "mp-tickets":               { sizes: SIZES_TICKET, materials: MAT_PAPER },

  // Stamps (self-inking, fixed impression sizes)
  "stamps-s827": stampConfig("S827 (60x40mm)", 60, 40),
  "stamps-s510": stampConfig("S510 (40x12mm)", 40, 12),
  "stamps-s520": stampConfig("S520 (38x14mm)", 38, 14),
  "stamps-s542": stampConfig("S542 (42x25mm)", 42, 25),
  "stamps-r512": stampConfig("R512 (12mm)", 12, 12, "round"),
  "stamps-r524": stampConfig("R524 (24mm)", 24, 24, "round"),
  "stamps-r532": stampConfig("R532 (32mm)", 32, 32, "round"),
  "stamps-r552": stampConfig("R552 (52mm)", 52, 52, "round"),

  // Cardstock (AREA_TIERED) — materials only
  "cardstock-prints": {
    materials: [
      { id: "14pt-gloss", name: "14pt Gloss Cardstock", multiplier: 1.0 },
      { id: "14pt-matte", name: "14pt Matte Cardstock", multiplier: 1.0 },
      { id: "16pt-gloss", name: "16pt Gloss Cardstock", multiplier: 1.15 },
      { id: "18pt-thick", name: "18pt Extra Thick", multiplier: 1.3 },
    ],
  },

  // Table mat
  "table-mat": {
    sizes: [
      { label: '11" x 17"', widthIn: 11, heightIn: 17, quantityChoices: [25, 50, 100, 250, 500] },
      { label: '12" x 18"', widthIn: 12, heightIn: 18, quantityChoices: [25, 50, 100, 250, 500] },
    ],
    materials: [
      { id: "100lb-gloss", name: "100lb Gloss", multiplier: 1.0 },
      { id: "laminated", name: "Laminated", multiplier: 1.3 },
    ],
  },
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
    if (newConfig.editor && !existing.editor) merged.editor = newConfig.editor;

    const sizeCount = merged.sizes?.length || 0;
    const matCount = merged.materials?.length || 0;
    const qtyCount = merged.quantityChoices?.length || 0;
    const model = product.pricingPreset?.model || "?";
    const label = APPLY ? "WRITE" : "DRY  ";

    console.log(
      `  ${label} ${slug.padEnd(40)} ${model.padEnd(14)} sizes=${sizeCount} mats=${matCount} qty=${qtyCount}`
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
