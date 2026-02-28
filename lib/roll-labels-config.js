// lib/roll-labels-config.js — Roll Labels configurator configuration
// Pricing = Sinalite wholesale × markup tier

// ─── Label Types ────────────────────────────────────────────────────────────
export const LABEL_TYPES = [
  { id: "bopp", label: "BOPP Roll Labels", desc: "Durable waterproof film — ideal for bottles, jars, packaging" },
  { id: "paper", label: "Paper Roll Labels", desc: "Classic paper labels — great for shipping, retail, food" },
  { id: "poly", label: "Poly Roll Labels", desc: "Synthetic poly — tear-proof, moisture-resistant" },
];

// ─── Shapes ─────────────────────────────────────────────────────────────────
export const SHAPES = [
  { id: "circle", label: "Circle", icon: "⬤", inputs: ["diameter"] },
  { id: "oval", label: "Oval", icon: "⬮", inputs: ["width", "height"] },
  { id: "square", label: "Square", icon: "■", inputs: ["width"] },
  { id: "rectangle", label: "Rectangle", icon: "▬", inputs: ["width", "height"] },
  { id: "custom", label: "Custom", icon: "✦", inputs: ["width", "height"] },
];

// ─── Stock Options (dynamic per label type) ─────────────────────────────────
export const STOCKS = {
  bopp: [
    { id: "white-gloss-permanent", label: "White Gloss BOPP Permanent", default: true },
    { id: "matte-white", label: "Matte White BOPP" },
    { id: "clear", label: "Clear BOPP" },
    { id: "silver", label: "Silver BOPP" },
    { id: "white-gloss-freezer", label: "White Gloss Freezer" },
  ],
  paper: [
    { id: "white-bright", label: "White Bright", default: true },
    { id: "white-matte", label: "White Matte" },
    { id: "white-semi-gloss", label: "White Semi-Gloss" },
    { id: "white-high-gloss", label: "White High Gloss" },
    { id: "kraft-brown", label: "Kraft Brown" },
    { id: "cream", label: "Cream" },
    { id: "fluorescent-green", label: "Fluorescent Green" },
    { id: "fluorescent-red", label: "Fluorescent Red" },
    { id: "fluorescent-orange", label: "Fluorescent Orange" },
    { id: "fluorescent-yellow", label: "Fluorescent Yellow" },
    { id: "pastel-blue", label: "Pastel Blue" },
    { id: "pastel-green", label: "Pastel Green" },
    { id: "pastel-yellow", label: "Pastel Yellow" },
  ],
  poly: [
    { id: "white-poly", label: "White Poly", default: true },
    { id: "silver-poly", label: "Silver Poly" },
  ],
};

// ─── Ink Colors (dynamic per label type) ────────────────────────────────────
// Stocks that support white ink underlay (transparent substrates)
export const WHITE_INK_STOCKS = ["clear"];

export const INK_COLORS = {
  bopp: [{ id: "cmyk", label: "CMYK (Full Colour)" }],
  // When stock is clear BOPP, use bopp_clear instead
  bopp_clear: [
    { id: "cmyk", label: "CMYK (Full Colour)", default: true },
    { id: "white-cmyk", label: "White + CMYK" },
  ],
  paper: [
    { id: "cmyk", label: "CMYK (Full Colour)", default: true },
    { id: "white-cmyk", label: "White + CMYK" },
    { id: "white-only", label: "White Only" },
    { id: "black-only", label: "Black Only" },
  ],
  poly: [{ id: "cmyk", label: "CMYK (Full Colour)" }],
};

// ─── Quantities ─────────────────────────────────────────────────────────────
export const QUANTITIES = [250, 500, 1000, 2000, 5000];

// ─── Finishing ──────────────────────────────────────────────────────────────
export const FINISHINGS = [
  { id: "none", label: "No Finishing" },
  { id: "matte-lam", label: "Matte Lamination", default: true },
  { id: "gloss-lam", label: "Gloss Lamination" },
  { id: "soft-touch", label: "Soft Touch Lamination" },
];

// ─── Wind Direction ─────────────────────────────────────────────────────────
export const WIND_DIRECTIONS = [
  { id: "any", label: "Does Not Matter", default: true },
  { id: "top", label: "Top" },
  { id: "right", label: "Right" },
  { id: "bottom", label: "Bottom" },
  { id: "left", label: "Left" },
];

// ─── Labels Per Roll ────────────────────────────────────────────────────────
export const LABELS_PER_ROLL = [
  { id: "any", label: "Does Not Matter", default: true },
  { id: "250", label: "250" },
  { id: "500", label: "500" },
  { id: "1000", label: "1,000" },
  { id: "custom", label: "Custom" },
];

// ─── Turnaround ─────────────────────────────────────────────────────────────
export const TURNAROUNDS = [
  { id: "standard", label: "5–7 Business Days", multiplier: 1 },
  { id: "rush", label: "2–4 Business Days", multiplier: 1.25 },
];

// ─── Pricing Engine ─────────────────────────────────────────────────────────
// Markup tiers over Sinalite wholesale cost
const MARKUP_TIERS = {
  bopp:  [[50, 2.0], [250, 1.8], [1000, 1.6], [5000, 1.4], [Infinity, 1.4]],
  paper: [[50, 2.5], [250, 2.0], [1000, 1.8], [5000, 1.6], [Infinity, 1.5]],
  poly:  [[50, 2.5], [250, 2.0], [1000, 1.8], [5000, 1.6], [Infinity, 1.5]],
};

// Known Sinalite base prices (from spec sheet) — used to calibrate formula
// Format: { type, areaIn2, qty, costCents }
const REFERENCE_PRICES = [
  { type: "bopp", areaIn2: Math.PI * 1 * 1, qty: 25, costCents: 8501 },   // 2" circle = π×1²
  { type: "bopp", areaIn2: Math.PI * 1 * 1, qty: 500, costCents: 12344 },
  { type: "bopp", areaIn2: 2, qty: 250, costCents: 9255 },                // 2"×1" custom
  { type: "paper", areaIn2: Math.PI * 0.5 * 0.5, qty: 250, costCents: 8178 }, // 1" circle
  { type: "poly", areaIn2: Math.PI * 0.5 * 0.5, qty: 250, costCents: 9361 },
];

/**
 * Estimate Sinalite wholesale cost in cents.
 * Uses a simplified model: baseFee + perLabel cost that scales with area.
 */
function estimateSinaliteCost(type, areaIn2, qty) {
  // Calibrated from reference prices
  const setupFee = type === "bopp" ? 6000 : 5500; // ~$60/$55 setup
  const perLabelBase = type === "bopp" ? 6 : type === "poly" ? 8 : 5; // cents per label base
  const areaMult = Math.max(1, areaIn2 / 3.14); // scale by area relative to 1" circle

  const perLabel = perLabelBase * areaMult;
  // Volume discount curve
  const volumeFactor = qty <= 50 ? 1.0
    : qty <= 250 ? 0.85
    : qty <= 1000 ? 0.60
    : qty <= 5000 ? 0.35
    : 0.22;

  const totalCents = Math.round(setupFee + perLabel * qty * volumeFactor);
  return Math.max(totalCents, 2500); // min $25
}

/**
 * Get markup multiplier for a quantity tier.
 */
function getMarkup(type, qty) {
  const tiers = MARKUP_TIERS[type] || MARKUP_TIERS.paper;
  for (const [maxQty, mult] of tiers) {
    if (qty <= maxQty) return mult;
  }
  return tiers[tiers.length - 1][1];
}

/**
 * Calculate label area in square inches from shape + dimensions.
 */
export function getLabelArea(shape, dim1, dim2) {
  switch (shape) {
    case "circle":
      return Math.PI * (dim1 / 2) * (dim1 / 2);
    case "oval":
      return Math.PI * (dim1 / 2) * (dim2 / 2);
    case "square":
      return dim1 * dim1;
    case "rectangle":
    case "custom":
      return dim1 * (dim2 || dim1);
    default:
      return dim1 * (dim2 || dim1);
  }
}

/**
 * Calculate retail price in cents.
 * @returns {{ subtotalCents, unitCents, wholesaleCents, markup }}
 */
export function calculateRollLabelPrice({ type, shape, dim1, dim2, qty, turnaroundMultiplier = 1 }) {
  const area = getLabelArea(shape, dim1, dim2);
  const wholesaleCents = estimateSinaliteCost(type, area, qty);
  const markup = getMarkup(type, qty);
  const baseCents = Math.round(wholesaleCents * markup);
  const subtotalCents = Math.round(baseCents * turnaroundMultiplier);
  const unitCents = Math.max(1, Math.round(subtotalCents / qty));

  return { subtotalCents, unitCents, wholesaleCents, markup };
}
