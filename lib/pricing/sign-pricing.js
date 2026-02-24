/**
 * Signs & Rigid Boards — Client-Side Pricing Engine
 *
 * Reference-table pricing calibrated to competitive market rates.
 * Uses 12×18 Coroplast as anchor, scales by area for other sizes.
 * PVC boards: 1.4× multiplier (3mm), 1.4×1.25 (6mm).
 *
 * No API calls — pure functions for instant UI feedback.
 */

// ═══════════════════════════════════════════════════════════════
//  A. CONSTANTS
// ═══════════════════════════════════════════════════════════════

const REF_AREA = 12 * 18; // 216 sq in — anchor size
const AREA_EXPONENT = 0.42; // sub-linear area scaling
const MIN_UNIT_PRICE = 5; // floor price per sign ($)

/** PVC material multipliers relative to Coroplast */
const PVC_MULTIPLIER = {
  "pvc-3mm": 1.4,
  "pvc-6mm": 1.4 * 1.25, // 1.75
};

/**
 * Reference unit prices for 12×18 Coroplast, single-sided.
 * [qty, unitPrice$]
 */
const REF_PRICE_TABLE = [
  [1, 28],
  [5, 20],
  [10, 16],
  [25, 13],
  [50, 11],
  [100, 9],
  [250, 7],
];

/** File setup fee per additional file */
export const FILE_SETUP_FEE = 500; // cents ($5)

// ═══════════════════════════════════════════════════════════════
//  B. SIZE PRESETS
// ═══════════════════════════════════════════════════════════════

export const COROPLAST_SIZE_PRESETS = [
  { w: 12, h: 18, label: '12" \u00d7 18"' },
  { w: 18, h: 24, label: '18" \u00d7 24"' },
  { w: 24, h: 36, label: '24" \u00d7 36"' },
  { w: 36, h: 48, label: '36" \u00d7 48"' },
];

export const PVC_SIZE_PRESETS = [
  { w: 12, h: 18, label: '12" \u00d7 18"' },
  { w: 18, h: 24, label: '18" \u00d7 24"' },
  { w: 24, h: 36, label: '24" \u00d7 36"' },
];

// ═══════════════════════════════════════════════════════════════
//  C. SHAPES
// ═══════════════════════════════════════════════════════════════

export const SIGN_SHAPES = [
  { id: "rectangle", label: "Rectangle" },
  { id: "arrow", label: "Arrow" },
  { id: "custom-die-cut", label: "Custom Die-Cut" },
];

// ═══════════════════════════════════════════════════════════════
//  D. ACCESSORY PRICES (cents)
// ═══════════════════════════════════════════════════════════════

export const SIGN_ACCESSORY_PRICES = {
  "h-stake": { label: "H-Stakes", price: 200 },
  grommet: { label: "Grommets", price: 100 },
  "a-frame": { label: "A-Frame Stand", price: 10000 },
  "re-frame": { label: "Real Estate Frame", price: 17500 },
  rider: { label: "Rider Clips", price: 800 },
};

// ═══════════════════════════════════════════════════════════════
//  E. CORE PRICING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Log-linear interpolation on the reference price table.
 * Returns unit price ($) for 12×18 coroplast at given qty.
 */
function lookupRefUnit(qty) {
  if (qty <= 0) return 0;
  const table = REF_PRICE_TABLE;
  if (qty <= table[0][0]) return table[0][1];
  if (qty >= table[table.length - 1][0]) {
    // Extrapolate with declining unit price
    const [q1, p1] = table[table.length - 2];
    const [q2, p2] = table[table.length - 1];
    const logRatio = Math.log(p2 / p1) / Math.log(q2 / q1);
    return p2 * Math.pow(qty / q2, logRatio);
  }
  for (let i = 0; i < table.length - 1; i++) {
    const [q1, p1] = table[i];
    const [q2, p2] = table[i + 1];
    if (qty >= q1 && qty <= q2) {
      const t = Math.log(qty / q1) / Math.log(q2 / q1);
      return p1 * Math.pow(p2 / p1, t);
    }
  }
  return table[table.length - 1][1];
}

/**
 * How many signs fit on one 4×8 Coroplast sheet.
 * Tries both orientations and returns the best nesting.
 */
export function boardsPerSheet(w, h) {
  const a = Math.floor(48 / w) * Math.floor(96 / h);
  const b = Math.floor(48 / h) * Math.floor(96 / w);
  return Math.max(a, b, 1);
}

/**
 * Calculate Coroplast/PVC sign pricing.
 *
 * @param {number} w - width in inches
 * @param {number} h - height in inches
 * @param {number} qty - quantity
 * @param {object} [opts]
 * @param {boolean} [opts.doubleSided] - 1.5× for double-sided
 * @param {string}  [opts.materialType] - "coroplast" | "pvc-3mm" | "pvc-6mm"
 * @param {number}  [opts.extraFiles] - additional files beyond 1 (each +$5)
 * @returns {{ unitPrice: number, totalPrice: number, unitPriceCents: number, totalPriceCents: number }}
 */
export function calcCoroplastPrice(w, h, qty, opts = {}) {
  if (w <= 0 || h <= 0 || qty <= 0) {
    return { unitPrice: 0, totalPrice: 0, unitPriceCents: 0, totalPriceCents: 0 };
  }

  // Area-based scaling relative to 12×18 reference
  const area = w * h;
  const areaScale = Math.pow(area / REF_AREA, AREA_EXPONENT);

  // Base unit price from reference table
  const refUnit = lookupRefUnit(qty);
  let unitPrice = Math.max(refUnit * areaScale, MIN_UNIT_PRICE);

  // PVC material multiplier
  const matType = opts.materialType || "coroplast";
  const pvcMult = PVC_MULTIPLIER[matType];
  if (pvcMult) {
    unitPrice *= pvcMult;
  }

  // Double-sided: 1.5×
  if (opts.doubleSided) {
    unitPrice *= 1.5;
  }

  // Round to cents
  let unitPriceCents = Math.round(unitPrice * 100);
  let totalPriceCents = unitPriceCents * qty;

  // File setup fee for additional files
  const extraFiles = opts.extraFiles || 0;
  if (extraFiles > 0) {
    totalPriceCents += extraFiles * FILE_SETUP_FEE;
  }

  return {
    unitPrice: unitPriceCents / 100,
    totalPrice: totalPriceCents / 100,
    unitPriceCents,
    totalPriceCents,
  };
}

// ═══════════════════════════════════════════════════════════════
//  F. TIER PREVIEW
// ═══════════════════════════════════════════════════════════════

/**
 * Volume tier table for UI — shows price at key breakpoints.
 * @param {number} w
 * @param {number} h
 * @param {string} [materialType]
 * @returns {Array<{ qty: number, unitPrice: number, totalPrice: number }>}
 */
export function getSignTierPreview(w, h, materialType = "coroplast") {
  const tiers = [1, 5, 10, 25, 50, 100, 250];
  return tiers.map((qty) => {
    const { unitPrice, totalPrice } = calcCoroplastPrice(w, h, qty, { materialType });
    return { qty, unitPrice, totalPrice };
  });
}
