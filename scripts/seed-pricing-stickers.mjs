#!/usr/bin/env node
/**
 * COST_PLUS pricing preset for stickers/labels/decals.
 * Used for CUSTOM SIZE quotes — preset sizes still use OPTIONS_EXACT_QTY.
 *
 * Key differences from window film:
 *   - Higher contour cutting rates (die-cut per piece)
 *   - Higher waste for tiny items
 *   - Contour minimum fee (minimum cutting cost)
 *   - Different qty efficiency curve (stickers = higher volume runs)
 *
 * Run:  node scripts/seed-pricing-stickers.mjs           (dry-run)
 * Run:  node scripts/seed-pricing-stickers.mjs --apply   (write to DB)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

// ── Sticker COST_PLUS Config ─────────────────────────────────────

const STICKER_COST_PLUS_CONFIG = {
  materials: {
    "white-vinyl":     { costPerSqft: 0.32, label: "White Vinyl (Permanent)" },
    "removable-white": { costPerSqft: 0.30, label: "White Vinyl (Removable)" },
    "clear-vinyl":     { costPerSqft: 0.43, label: "Clear Vinyl" },
    "holographic":     { costPerSqft: 0.85, label: "Holographic Film" },
    "reflective":      { costPerSqft: 0.40, label: "Reflective Vinyl" },
    "floor-vinyl":     { costPerSqft: 0.75, label: "Floor Vinyl + Anti-Slip Lam" },
    "transfer-vinyl":  { costPerSqft: 0.45, label: "Transfer Vinyl" },
    "static-cling-white": { costPerSqft: 0.44, label: "Static Cling (White)" },
    "magnetic-vinyl":  { costPerSqft: 1.00, label: "Magnetic Vinyl" },
  },
  defaultMaterial: "white-vinyl",

  inkCosts: {
    cmyk:          { inkPerSqft: 0.234, sqmPerHour: 15, label: "CMYK" },
    "cmyk-w":      { inkPerSqft: 0.468, sqmPerHour: 8,  label: "CMYK + White" },
    "cmyk-w-cmyk": { inkPerSqft: 0.702, sqmPerHour: 5,  label: "CMYK + White + CMYK" },
  },
  defaultPrintMode: "cmyk",

  machineLabor: { hourlyRate: 60 },

  cutting: {
    rectangularPerFt: 0.15,
    contourPerSqft: 6.0,    // die-cut stickers: weeding + sorting per piece
    contourMinimum: 12,     // minimum cutting charge
  },
  defaultCutType: "contour",

  waste: {
    tiers: [
      { maxSqft: 0.1,  factor: 20 },  // tiny stickers = more waste
      { maxSqft: 0.5,  factor: 15 },
      { maxSqft: 2,    factor: 10 },
      { maxSqft: 6,    factor: 8 },
      { maxSqft: 9999, factor: 5 },
    ],
  },

  qtyEfficiency: {
    tiers: [
      { maxQty: 5,    factor: 1.0 },
      { maxQty: 25,   factor: 0.70 },
      { maxQty: 50,   factor: 0.55 },
      { maxQty: 100,  factor: 0.42 },
      { maxQty: 250,  factor: 0.32 },
      { maxQty: 500,  factor: 0.25 },
      { maxQty: 1000, factor: 0.20 },
      { maxQty: 9999, factor: 0.16 },
    ],
  },

  markup: {
    floor: 1.6,
    retailTiers: [
      { maxSqft: 0.1,  factor: 2.8 },
      { maxSqft: 0.25, factor: 2.5 },
      { maxSqft: 0.5,  factor: 2.3 },
      { maxSqft: 1,    factor: 2.1 },
      { maxSqft: 4,    factor: 1.9 },
      { maxSqft: 9999, factor: 1.7 },
    ],
    b2bTiers: [
      { maxSqft: 0.1,  factor: 2.0 },
      { maxSqft: 0.25, factor: 1.8 },
      { maxSqft: 0.5,  factor: 1.7 },
      { maxSqft: 1,    factor: 1.6 },
      { maxSqft: 4,    factor: 1.5 },
      { maxSqft: 9999, factor: 1.5 },
    ],
  },

  fileFee: 5,
  minimumPrice: 12,
};

// ── Per-product costPlusDefaults ──────────────────────────────────
// These get merged into each product's optionsConfig.costPlusDefaults
// and tell the quote engine which material/printMode/cutType to use.

const PRODUCT_DEFAULTS = {
  "die-cut-singles": {
    material: "white-vinyl", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 0.5, maxWidthIn: 53, maxHeightIn: 53,
  },
  "holographic-singles": {
    material: "holographic", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 0.5, maxWidthIn: 53, maxHeightIn: 53,
  },
  "removable-stickers": {
    material: "removable-white", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 0.5, maxWidthIn: 53, maxHeightIn: 53,
  },
  "sticker-sheets": {
    material: "white-vinyl", printMode: "cmyk", cutType: "rectangular",
    minDimensionIn: 2, maxWidthIn: 12, maxHeightIn: 18,
  },
  "window-decals": {
    material: "white-vinyl", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 1, maxWidthIn: 53, maxHeightIn: 53,
  },
  "vinyl-lettering": {
    material: "white-vinyl", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 1, maxWidthIn: 53, maxHeightIn: 53,
  },
  "clear-singles": {
    material: "clear-vinyl", printMode: "cmyk-w", cutType: "contour",
    minDimensionIn: 0.5, maxWidthIn: 53, maxHeightIn: 53,
  },
  "floor-decals": {
    material: "floor-vinyl", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 1, maxWidthIn: 53, maxHeightIn: 53,
  },
  "sticker-packs": {
    material: "white-vinyl", printMode: "cmyk", cutType: "rectangular",
    minDimensionIn: 2, maxWidthIn: 12, maxHeightIn: 18,
  },
  "transfer-stickers": {
    material: "transfer-vinyl", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 0.5, maxWidthIn: 53, maxHeightIn: 53,
  },
  "static-cling-stickers": {
    material: "static-cling-white", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 1, maxWidthIn: 47, maxHeightIn: 47,
  },
  "magnet-stickers": {
    material: "magnetic-vinyl", printMode: "cmyk", cutType: "rectangular",
    minDimensionIn: 1, maxWidthIn: 24, maxHeightIn: 36,
  },
  "reflective-stickers": {
    material: "reflective", printMode: "cmyk", cutType: "contour",
    minDimensionIn: 0.5, maxWidthIn: 53, maxHeightIn: 53,
  },
  // Roll labels: outsourced, NO custom sizes
  // "roll-labels", "clear-labels", "kraft-paper-labels" → skip
};

// ── Simulation engine (mirror of costPlus.js) ────────────────────

function interp(tiers, value, floor = 0, key = "maxSqft") {
  if (!tiers?.length) return 2.5;
  if (value <= tiers[0][key]) return Math.max(tiers[0].factor, floor);
  for (let i = 1; i < tiers.length; i++) {
    if (value <= tiers[i][key]) {
      const p = tiers[i - 1], c = tiers[i];
      const t = (value - p[key]) / (c[key] - p[key]);
      return Math.max(p.factor + t * (c.factor - p.factor), floor);
    }
  }
  return Math.max(tiers[tiers.length - 1].factor, floor);
}

function roundTo99(d) { return Math.floor(d) + 0.99; }

function simulate(matKey, mode, w, h, qty, cut = "contour") {
  const C = STICKER_COST_PLUS_CONFIG;
  const sqft = (w * h) / 144;
  const sqm = sqft / 10.7639;
  const perim = (2 * (w + h)) / 12;
  const mat = C.materials[matKey];
  const ink = C.inkCosts[mode];
  if (!mat || !ink) return null;

  const matCost = mat.costPerSqft * sqft * qty;
  const inkCost = ink.inkPerSqft * sqft * qty;
  const laborBase = ink.sqmPerHour > 0 ? (sqm * qty / ink.sqmPerHour) * C.machineLabor.hourlyRate : 0;
  const cutBase = cut === "contour"
    ? Math.max(C.cutting.contourPerSqft * sqft * qty, C.cutting.contourMinimum)
    : C.cutting.rectangularPerFt * perim * qty;
  const qtyEff = interp(C.qtyEfficiency.tiers, qty, 0.3, "maxQty");
  const labor = laborBase * qtyEff;
  const cutting = cutBase * qtyEff;

  const sub = matCost + inkCost + labor + cutting;
  const wastePct = interp(C.waste.tiers, sqft);
  const raw = sub * (1 + wastePct / 100);
  const markup = interp(C.markup.retailTiers, sqft, C.markup.floor);
  const price = Math.max(roundTo99(raw * markup + C.fileFee), C.minimumPrice);

  return { price, unit: price / qty, rawCost: raw, markup, waste: wastePct, qtyEff, sqft };
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log(`${apply ? "APPLY" : "DRY-RUN"} — sticker COST_PLUS preset\n`);

  // 1) Upsert preset
  if (apply) {
    await prisma.pricingPreset.upsert({
      where: { key: "sticker_costplus" },
      create: {
        key: "sticker_costplus",
        name: "Stickers — Cost Plus",
        model: "COST_PLUS",
        config: STICKER_COST_PLUS_CONFIG,
      },
      update: {
        name: "Stickers — Cost Plus",
        model: "COST_PLUS",
        config: STICKER_COST_PLUS_CONFIG,
      },
    });
  }
  console.log("  Preset: sticker_costplus\n");

  // 2) Link products
  const presetRow = apply
    ? await prisma.pricingPreset.findUnique({ where: { key: "sticker_costplus" } })
    : { id: "(dry-run)" };

  for (const [slug, defaults] of Object.entries(PRODUCT_DEFAULTS)) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) { console.log(`  SKIP  ${slug} (not found)`); continue; }

    const existing = product.optionsConfig && typeof product.optionsConfig === "object"
      ? product.optionsConfig
      : {};

    const updated = {
      ...existing,
      costPlusDefaults: defaults,
      allowCustomSize: true,
    };

    if (apply) {
      await prisma.product.update({
        where: { slug },
        data: {
          pricingPresetId: presetRow.id,
          optionsConfig: updated,
        },
      });
    }
    console.log(`  OK  ${slug.padEnd(26)} material=${defaults.material}  cut=${defaults.cutType}`);
  }

  // 3) Simulation: compare COST_PLUS vs OPTIONS_EXACT_QTY for reference
  console.log("\n\n===== COST_PLUS vs Preset Prices (reference) =====\n");
  console.log(
    "Product".padEnd(22),
    "Size".padEnd(10),
    "Qty".padStart(5),
    "Preset".padStart(9),
    "CostPlus".padStart(10),
    "Delta".padStart(8),
  );
  console.log("-".repeat(70));

  const comparisons = [
    ["die-cut-singles",     "white-vinyl",     "cmyk",   2, 2,  25, 2900, "contour"],
    ["die-cut-singles",     "white-vinyl",     "cmyk",   3, 3,  100, 7900, "contour"],
    ["die-cut-singles",     "white-vinyl",     "cmyk",   4, 4,  250, 17900, "contour"],
    ["holographic-singles", "holographic",     "cmyk",   3, 3,  100, 11100, "contour"],
    ["clear-singles",       "clear-vinyl",     "cmyk-w", 3, 3,  100, 9100,  "contour"],
    ["removable-stickers",  "removable-white", "cmyk",   3, 3,  100, 7200,  "contour"],
    ["window-decals",       "white-vinyl",     "cmyk",   6, 6,  10,  9900,  "contour"],
    ["window-decals",       "white-vinyl",     "cmyk",  12,12,  25,  39900, "contour"],
    ["floor-decals",        "floor-vinyl",     "cmyk",   6, 6,  10,  14400, "contour"],
  ];

  for (const [slug, mat, mode, w, h, qty, presetCents, cut] of comparisons) {
    const r = simulate(mat, mode, w, h, qty, cut);
    if (!r) continue;
    const presetPrice = presetCents / 100;
    const delta = ((r.price - presetPrice) / presetPrice * 100).toFixed(0);
    console.log(
      slug.padEnd(22),
      `${w}"×${h}"`.padEnd(10),
      String(qty).padStart(5),
      `$${presetPrice.toFixed(0)}`.padStart(9),
      `$${r.price.toFixed(0)}`.padStart(10),
      `${delta > 0 ? "+" : ""}${delta}%`.padStart(8),
    );
  }

  // 4) Custom size examples (not in preset table)
  console.log("\n\n===== Custom Size Examples (no preset) =====\n");
  const customs = [
    ["2.5\"×2.5\" ×50 white",   "white-vinyl", "cmyk", 2.5, 2.5, 50, "contour"],
    ["5\"×3\" ×100 white",       "white-vinyl", "cmyk", 5, 3, 100, "contour"],
    ["1.5\"×1.5\" ×500 clear",   "clear-vinyl", "cmyk-w", 1.5, 1.5, 500, "contour"],
    ["8\"×4\" ×25 holographic",   "holographic", "cmyk", 8, 4, 25, "contour"],
    ["10\"×10\" ×10 floor",       "floor-vinyl", "cmyk", 10, 10, 10, "contour"],
  ];

  for (const [label, mat, mode, w, h, qty, cut] of customs) {
    const r = simulate(mat, mode, w, h, qty, cut);
    if (!r) continue;
    console.log(`  ${label.padEnd(32)} → $${r.price.toFixed(2)} ($${r.unit.toFixed(2)}/ea)  markup=${r.markup.toFixed(1)}x  raw=$${r.rawCost.toFixed(2)}`);
  }

  if (!apply) console.log("\n  (re-run with --apply to write to DB)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
