/**
 * Sticker & Label Pricing Engine
 *
 * Two pricing models:
 * 1. Vinyl stickers (Die-Cut, Kiss-Cut) — cost-plus with target margin
 * 2. Paper labels (Sticker Sheets) — per-sheet tiered pricing
 *
 * Plus: multi-design setup fees, material surcharges, finishing add-ons.
 */

// ═══════════════════════════════════════════════════════════════
//  A. VINYL STICKER PRICING (Die-Cut & Kiss-Cut)
// ═══════════════════════════════════════════════════════════════

/** Material cost in $/sq ft */
export const VINYL_MATERIAL_COST = {
  white_vinyl:    0.30,
  matte_vinyl:    0.30,
  clear_vinyl:    0.43,
  frosted_vinyl:  0.70,
  reflective_3m:  0.45,
  static_cling_clear:   0.45,
  static_cling_frosted: 0.45,
  static_cling_white:   0.45,
};

/** Material display config for UI */
export const VINYL_MATERIALS = [
  // ── Vinyl ──
  { id: "white_vinyl",    group: "vinyl",   label: "White Vinyl",    surchargeLabel: null,   surchargePercent: 0 },
  { id: "matte_vinyl",    group: "vinyl",   label: "Matte Vinyl",    surchargeLabel: null,   surchargePercent: 0 },
  { id: "clear_vinyl",    group: "vinyl",   label: "Clear Vinyl",    surchargeLabel: "+11%", surchargePercent: 11 },
  { id: "frosted_vinyl",  group: "vinyl",   label: "Frosted Vinyl",  surchargeLabel: "+32%", surchargePercent: 32 },
  { id: "reflective_3m",  group: "vinyl",   label: "3M Reflective",  surchargeLabel: "+12%", surchargePercent: 12 },
  // ── Paper ──
  { id: "paper_gloss",    group: "paper",   label: "Gloss Paper",    surchargeLabel: null,   surchargePercent: 0 },
  { id: "paper_matte",    group: "paper",   label: "Matte Paper",    surchargeLabel: null,   surchargePercent: 0 },
  { id: "paper_soft",     group: "paper",   label: "Soft Touch",     surchargeLabel: null,   surchargePercent: 0 },
  { id: "paper_foil",     group: "paper",   label: "Foil Stamping",  surchargeLabel: null,   surchargePercent: 0, requiresSoftTouch: true },
  // ── Static Clings (Die-Cut only) ──
  { id: "static_cling_clear",   group: "cling", label: "Clear Cling",   surchargeLabel: "+12%", surchargePercent: 12 },
  { id: "static_cling_frosted", group: "cling", label: "Frosted Cling", surchargeLabel: "+12%", surchargePercent: 12 },
  { id: "static_cling_white",   group: "cling", label: "White Cling",   surchargeLabel: "+12%", surchargePercent: 12 },
];

/**
 * Material × Cut Type compatibility matrix.
 * true = compatible, false/undefined = incompatible.
 */
export const MATERIAL_COMPAT = {
  white_vinyl:           { die_cut: true, kiss_cut: true, sheets: true, vinyl_lettering: true },
  matte_vinyl:           { die_cut: true, kiss_cut: true, sheets: true, vinyl_lettering: true },
  clear_vinyl:           { die_cut: true, kiss_cut: true, sheets: true, vinyl_lettering: false },
  frosted_vinyl:         { die_cut: true, kiss_cut: true, sheets: false, vinyl_lettering: false },
  reflective_3m:         { die_cut: true, kiss_cut: true, sheets: false, vinyl_lettering: false },
  static_cling_clear:    { die_cut: true, kiss_cut: false, sheets: false, vinyl_lettering: false },
  static_cling_frosted:  { die_cut: true, kiss_cut: false, sheets: false, vinyl_lettering: false },
  static_cling_white:    { die_cut: true, kiss_cut: false, sheets: false, vinyl_lettering: false },
  paper_gloss:           { die_cut: true, kiss_cut: true, sheets: true, vinyl_lettering: false },
  paper_matte:           { die_cut: true, kiss_cut: true, sheets: true, vinyl_lettering: false },
  paper_soft:            { die_cut: true, kiss_cut: true, sheets: true, vinyl_lettering: false },
  paper_foil:            { die_cut: true, kiss_cut: true, sheets: true, vinyl_lettering: false },
};

/** Check if material is compatible with a cut type */
export function isMaterialCompatible(materialId, cutType) {
  return !!MATERIAL_COMPAT[materialId]?.[cutType];
}

/** Get compatible materials for a cut type */
export function getCompatibleMaterials(cutType) {
  return VINYL_MATERIALS.filter((m) => isMaterialCompatible(m.id, cutType));
}

const STICKER_GAP_INCHES = 0.125;
const ROLL_WIDTH_INCHES = 54;

/**
 * Reference price table: White Vinyl 2×2 Die-Cut (the anchor).
 * All other sizes/materials scale from these data points.
 * Prices set at Sticker Mule × 0.65-0.75.
 */
const BASE_PRICE_TABLE = [
  // [qty, totalPrice]
  [25,    25],
  [50,    38],
  [100,   52],
  [250,   85],
  [500,   135],
  [1000,  200],
  [2500,  400],
  [5000,  700],
  [10000, 1200],
];
const BASE_SIZE_AREA = 4; // 2×2 = 4 sq in

/**
 * Log-linear interpolation on the base price table.
 * Returns total price for a given qty at 2×2 white vinyl die-cut.
 */
function lookupBaseTotal(qty) {
  if (qty <= 0) return 0;
  const table = BASE_PRICE_TABLE;
  // Clamp
  if (qty <= table[0][0]) {
    return table[0][1] * (qty / table[0][0]);
  }
  if (qty >= table[table.length - 1][0]) {
    const last = table[table.length - 1];
    const prev = table[table.length - 2];
    const unitLast = last[1] / last[0];
    const unitPrev = prev[1] / prev[0];
    // Extrapolate unit price decline
    const ratio = unitLast / unitPrev;
    const extraSteps = Math.log(qty / last[0]) / Math.log(last[0] / prev[0]);
    const unitExtra = unitLast * Math.pow(ratio, extraSteps);
    return qty * Math.max(unitExtra, 0.08);
  }
  // Interpolate between two tiers
  for (let i = 0; i < table.length - 1; i++) {
    const [q1, p1] = table[i];
    const [q2, p2] = table[i + 1];
    if (qty >= q1 && qty <= q2) {
      // Log-linear interpolation
      const logQ = Math.log(qty);
      const logQ1 = Math.log(q1);
      const logQ2 = Math.log(q2);
      const t = (logQ - logQ1) / (logQ2 - logQ1);
      const logP1 = Math.log(p1);
      const logP2 = Math.log(p2);
      return Math.exp(logP1 + t * (logP2 - logP1));
    }
  }
  return table[table.length - 1][1];
}

/**
 * Material price multiplier (relative to white vinyl = 1.0).
 */
const MATERIAL_MULTIPLIER = {
  white_vinyl: 1.0,
  matte_vinyl: 1.0,
  clear_vinyl: 1.11,
  frosted_vinyl: 1.32,
  reflective_3m: 1.12,
  static_cling_clear: 1.12,
  static_cling_frosted: 1.12,
  static_cling_white: 1.12,
  // Paper materials handled separately
  paper_gloss: 1.0,
  paper_matte: 1.0,
  paper_soft: 1.12,
  paper_foil: 1.50,
};

/**
 * Calculate vinyl sticker price.
 *
 * Uses reference price table (2×2 white vinyl die-cut) as anchor,
 * then scales by area and material multiplier.
 *
 * @param {number} width  - sticker width in inches
 * @param {number} height - sticker height in inches
 * @param {number} qty    - total quantity
 * @param {string} material - material ID (e.g. "white_vinyl")
 * @param {"die_cut"|"kiss_cut"} cutType
 * @param {object} [opts]
 * @param {boolean} [opts.colorWhiteColor] - clear vinyl CWC printing (+$0.05/ea)
 * @param {boolean} [opts.individualPacking] - wrap each piece (+$0.10/ea)
 * @returns {{ unitPrice: number, totalPrice: number }}
 */
export function calcVinylPrice(width, height, qty, material, cutType, opts = {}) {
  // Paper materials delegate to sheet pricing
  const isPaper = material.startsWith("paper_");
  if (isPaper) {
    return calcPaperVinylFallback(width, height, qty, material, cutType, opts);
  }

  // Area-based scaling: sub-linear so small stickers aren't too cheap
  const area = width * height;
  const areaRatio = area / BASE_SIZE_AREA;
  // Power 0.7: a 4× larger sticker costs ~2.6× more (not 4×)
  const areaMultiplier = Math.pow(Math.max(areaRatio, 0.1), 0.7);

  // Base total from reference table
  const baseTotal = lookupBaseTotal(qty);

  // Material multiplier
  const matMult = MATERIAL_MULTIPLIER[material] || 1.0;

  let totalPrice = baseTotal * areaMultiplier * matMult;
  totalPrice = Math.max(totalPrice, 15); // minimum $15

  // Kiss-Cut: same price (industry convention — easier to peel = premium feel)
  // No adjustment needed

  // Add-ons
  if (opts.colorWhiteColor && material === "clear_vinyl") {
    totalPrice += 0.05 * qty;
  }
  if (opts.individualPacking) {
    totalPrice += 0.10 * qty;
  }

  // Round to nice price
  totalPrice = Math.round(totalPrice * 100) / 100;
  const unitPrice = totalPrice / qty;

  return {
    unitPrice: Math.round(unitPrice * 1000) / 1000,
    totalPrice,
  };
}

/**
 * For paper materials on die-cut/kiss-cut, use sheet-based cost model
 * but present as per-piece pricing to match vinyl UX.
 */
function calcPaperVinylFallback(width, height, qty, material, cutType, opts) {
  const lam = material === "paper_gloss" ? "gloss"
    : material === "paper_matte" ? "matte"
    : material === "paper_soft" ? "soft_touch"
    : material === "paper_foil" ? "foil"
    : "gloss";

  const result = calcPaperLabelPrice(width, height, qty, "rect", lam);
  let totalPrice = result.totalPrice;

  // Die-cut paper has additional cutting cost
  if (cutType === "die_cut") {
    totalPrice *= 1.15; // 15% surcharge for die-cutting paper
  }

  if (opts?.individualPacking) {
    totalPrice += 0.10 * qty;
  }

  totalPrice = Math.max(totalPrice, 15);

  return {
    unitPrice: Math.round((totalPrice / qty) * 1000) / 1000,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}


// ═══════════════════════════════════════════════════════════════
//  B. PAPER LABEL PRICING (Sticker Sheets)
// ═══════════════════════════════════════════════════════════════

const SHEET_USABLE_W = 12; // inches (on 13×19 sheet)
const SHEET_USABLE_H = 18;

/**
 * Calculate how many stickers fit on one 13×19 sheet.
 * @param {number} w - sticker width
 * @param {number} h - sticker height
 * @param {"rect"|"circle"} shape - rect uses 0 gap (shared cut lines), circle uses 0.125"
 */
export function stickersPerSheet(w, h, shape = "rect") {
  const gap = shape === "rect" ? 0 : STICKER_GAP_INCHES;

  const cols1 = Math.floor(SHEET_USABLE_W / (w + gap));
  const rows1 = Math.floor(SHEET_USABLE_H / (h + gap));
  // Try rotated
  const cols2 = Math.floor(SHEET_USABLE_W / (h + gap));
  const rows2 = Math.floor(SHEET_USABLE_H / (w + gap));

  return Math.max(cols1 * rows1, cols2 * rows2, 1);
}

/**
 * Per-sheet selling price based on volume tier.
 * @param {number} sheetsNeeded - total number of 13×19 sheets
 * @param {"gloss"|"matte"|"soft_touch"|"foil"} lamination
 */
export function sheetPrice(sheetsNeeded, lamination = "gloss") {
  let base;
  if (sheetsNeeded <= 2)        base = 15.00;
  else if (sheetsNeeded <= 5)   base = 13.60;
  else if (sheetsNeeded <= 10)  base = 9.80;
  else if (sheetsNeeded <= 20)  base = 9.40;
  else if (sheetsNeeded <= 35)  base = 8.75;
  else if (sheetsNeeded <= 50)  base = 7.78;
  else if (sheetsNeeded <= 70)  base = 7.20;
  else if (sheetsNeeded <= 100) base = 6.50;
  else if (sheetsNeeded <= 140) base = 5.82;
  else if (sheetsNeeded <= 180) base = 5.60;
  else if (sheetsNeeded <= 230) base = 5.30;
  else                          base = 4.72;

  const lamMultiplier = {
    gloss: 1.0,
    matte: 1.0,
    soft_touch: 1.12,
    foil: 1.50,
  };

  return base * (lamMultiplier[lamination] || 1.0);
}

/**
 * Calculate paper label (sticker sheet) price.
 *
 * @param {number} width  - individual sticker width
 * @param {number} height - individual sticker height
 * @param {number} qty    - total sticker count desired
 * @param {"rect"|"circle"} shape
 * @param {"gloss"|"matte"|"soft_touch"|"foil"} lamination
 * @returns {{ totalPrice, unitPrice, perSheet, sheetsNeeded, actualQty }}
 */
export function calcPaperLabelPrice(width, height, qty, shape = "rect", lamination = "gloss") {
  const perSheet = stickersPerSheet(width, height, shape);
  const sheetsNeeded = Math.max(1, Math.ceil(qty / perSheet));
  const pricePerSheet = sheetPrice(sheetsNeeded, lamination);

  let totalPrice = sheetsNeeded * pricePerSheet;
  totalPrice = Math.max(totalPrice, 15); // minimum $15

  const actualQty = sheetsNeeded * perSheet;

  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    unitPrice: Math.round((totalPrice / actualQty) * 1000) / 1000,
    perSheet,
    sheetsNeeded,
    actualQty,
  };
}


// ═══════════════════════════════════════════════════════════════
//  C. MULTI-DESIGN SETUP FEE
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate setup fee for multiple designs.
 * First design free, each additional +$10.
 */
export function setupFee(numDesigns) {
  if (numDesigns <= 1) return 0;
  return (numDesigns - 1) * 10;
}


// ═══════════════════════════════════════════════════════════════
//  D. SHAPE CONFIG
// ═══════════════════════════════════════════════════════════════

export const SHAPES = [
  { id: "custom",    label: "Custom Shape", icon: "scissors",  lockAspect: false },
  { id: "circle",    label: "Circle",       icon: "circle",    lockAspect: true },
  { id: "square",    label: "Square",       icon: "square",    lockAspect: true },
  { id: "oval",      label: "Oval",         icon: "oval",      lockAspect: false },
  { id: "rectangle", label: "Rectangle",    icon: "rectangle", lockAspect: false },
];

/** Preset sizes (inches) by shape group */
export const SIZE_PRESETS = {
  locked: [ // Circle & Square
    { w: 2, h: 2, label: '2"×2"' },
    { w: 3, h: 3, label: '3"×3"' },
    { w: 4, h: 4, label: '4"×4"' },
  ],
  free: [ // Rectangle, Oval, Custom
    { w: 2, h: 2, label: '2"×2"' },
    { w: 2, h: 3.5, label: '2"×3.5"' },
    { w: 3, h: 3, label: '3"×3"' },
    { w: 3, h: 5, label: '3"×5"' },
    { w: 4, h: 4, label: '4"×4"' },
  ],
};

export const MIN_SIZE = 0.5;
export const MAX_SIZE = 12;

/** Quantity presets */
export const QTY_PRESETS = {
  retail: [25, 50, 100, 200],
  wholesale: [250, 500, 1000, 2000, 2500, 5000, 10000],
};

/** Sticker Sheets quantity presets */
export const SHEET_QTY_PRESETS = {
  retail: [25, 50, 100, 200],
  wholesale: [250, 500, 1000, 2000, 3000, 5000, 10000, 15000],
};


// ═══════════════════════════════════════════════════════════════
//  E. TIER PRICE PREVIEW
// ═══════════════════════════════════════════════════════════════

/**
 * Generate tier price preview for a given size/material/cutType.
 * Shown next to the quantity selector so customers see volume discounts.
 */
export function getTierPreview(width, height, material, cutType) {
  const tiers = [25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  return tiers.map((qty) => {
    const { unitPrice, totalPrice } = calcVinylPrice(width, height, qty, material, cutType);
    return { qty, unitPrice, totalPrice };
  });
}
