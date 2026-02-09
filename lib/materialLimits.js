// lib/materialLimits.js
// Material dimension constraints for roll and board substrates.

export const ROLL_MAX_WIDTH_IN = 63; // Nominal roll width
export const ROLL_TRIM_IN = 0.5; // Trim margin per side
export const ROLL_EFFECTIVE_MAX_WIDTH_IN = ROLL_MAX_WIDTH_IN - ROLL_TRIM_IN * 2; // 62"
export const ROLL_MIN_LENGTH_IN = 6;

export const BOARD_MAX_WIDTH_IN = 48;
export const BOARD_MAX_HEIGHT_IN = 96;
// Metric equivalent: 2.5m x 1.4m → 98.43" x 55.12"
// Imperial 48x96 is stricter on width, metric 55.12" is stricter on height? No:
// 48" < 55.12" so imperial is stricter on width.
// 96" < 98.43" so imperial is stricter on height.
// Imperial wins on both axes — use 48x96.

// Per-material limits (inches). Extend as needed.
const MATERIAL_LIMITS = {
  // Roll materials — unlimited length, limited width (effective = nominal - trim)
  "vinyl":          { maxW: 62, maxH: 1200, minW: 2, minH: 2 },
  "banner":         { maxW: 62, maxH: 1200, minW: 12, minH: 12 },
  "mesh":           { maxW: 62, maxH: 1200, minW: 12, minH: 12 },
  "canvas":         { maxW: 59, maxH: 1200, minW: 8, minH: 8 },
  "wallpaper":      { maxW: 53, maxH: 1200, minW: 12, minH: 12 },
  "perforated":     { maxW: 53, maxH: 1200, minW: 12, minH: 12 },
  "floor":          { maxW: 53, maxH: 1200, minW: 6, minH: 6 },
  "sticker":        { maxW: 53, maxH: 1200, minW: 0.5, minH: 0.5 },
  "label":          { maxW: 12, maxH: 18, minW: 0.5, minH: 0.5 },
  // Board materials — both dimensions limited
  "foam board":     { maxW: 48, maxH: 96, minW: 4, minH: 4 },
  "foamcore":       { maxW: 48, maxH: 96, minW: 4, minH: 4 },
  "gatorboard":     { maxW: 48, maxH: 96, minW: 4, minH: 4 },
  "coroplast":      { maxW: 48, maxH: 96, minW: 6, minH: 6 },
  "acm":            { maxW: 48, maxH: 96, minW: 6, minH: 6 },
  "dibond":         { maxW: 48, maxH: 96, minW: 6, minH: 6 },
  "aluminum":       { maxW: 48, maxH: 96, minW: 6, minH: 6 },
  "acrylic":        { maxW: 48, maxH: 96, minW: 4, minH: 4 },
  "pvc":            { maxW: 48, maxH: 96, minW: 4, minH: 4 },
  "sintra":         { maxW: 48, maxH: 96, minW: 4, minH: 4 },
};

/**
 * Look up limits for a material string.
 * Fuzzy-matches against known material keys.
 */
function getLimits(materialStr) {
  if (!materialStr) return null;
  const lower = materialStr.toLowerCase();
  if (MATERIAL_LIMITS[lower]) return MATERIAL_LIMITS[lower];
  for (const [key, limits] of Object.entries(MATERIAL_LIMITS)) {
    if (lower.includes(key) || key.includes(lower)) return limits;
  }
  return null;
}

// Category → materialType mapping
const ROLL_CATEGORIES = new Set([
  "stickers-labels", "banners-displays",
  "window-graphics", "large-format-graphics",
]);
const BOARD_CATEGORIES = new Set(["rigid-signs"]);

/**
 * Infer material type from product category.
 * @param {string} category
 * @returns {"roll"|"board"|null}
 */
export function inferMaterialType(category) {
  if (ROLL_CATEGORIES.has(category)) return "roll";
  if (BOARD_CATEGORIES.has(category)) return "board";
  return null;
}

/**
 * Validate dimensions against material limits.
 * @param {number} widthIn - Width in inches
 * @param {number} heightIn - Height in inches
 * @param {string} [material] - Material name (optional, for specific limits)
 * @param {object} [product] - Product object with maxWidthIn/maxHeightIn/category
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDimensions(widthIn, heightIn, material, product) {
  const errors = [];
  const w = Number(widthIn);
  const h = Number(heightIn);

  if (!w || w <= 0) {
    errors.push("Width must be greater than 0.");
    return { valid: false, errors };
  }
  if (!h || h <= 0) {
    errors.push("Height must be greater than 0.");
    return { valid: false, errors };
  }

  // Product-level limits take precedence
  if (product?.minWidthIn && w < product.minWidthIn) {
    errors.push(`Minimum width is ${product.minWidthIn}".`);
  }
  if (product?.minHeightIn && h < product.minHeightIn) {
    errors.push(`Minimum height is ${product.minHeightIn}".`);
  }
  if (product?.maxWidthIn && w > product.maxWidthIn) {
    errors.push(`Maximum width is ${product.maxWidthIn}".`);
  }
  if (product?.maxHeightIn && h > product.maxHeightIn) {
    errors.push(`Maximum height is ${product.maxHeightIn}".`);
  }

  // Material-level limits
  const limits = getLimits(material);
  if (limits) {
    if (w < limits.minW) errors.push(`Minimum width for ${material} is ${limits.minW}".`);
    if (h < limits.minH) errors.push(`Minimum height for ${material} is ${limits.minH}".`);
    if (w > limits.maxW) errors.push(`Maximum width for ${material} is ${limits.maxW}" (${ROLL_TRIM_IN}" trim each side).`);
    if (h > limits.maxH) errors.push(`Maximum height for ${material} is ${limits.maxH}".`);
  } else {
    // Fallback: use category-based materialType limits
    const matType = product?.category ? inferMaterialType(product.category) : null;
    if (matType === "roll") {
      if (w > ROLL_EFFECTIVE_MAX_WIDTH_IN) {
        errors.push(`Maximum printable width is ${ROLL_EFFECTIVE_MAX_WIDTH_IN}" (${ROLL_TRIM_IN}" trim each side of ${ROLL_MAX_WIDTH_IN}" roll).`);
      }
    } else if (matType === "board") {
      if (w > BOARD_MAX_WIDTH_IN) {
        errors.push(`Maximum width for rigid boards is ${BOARD_MAX_WIDTH_IN}".`);
      }
      if (h > BOARD_MAX_HEIGHT_IN) {
        errors.push(`Maximum height for rigid boards is ${BOARD_MAX_HEIGHT_IN}".`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
