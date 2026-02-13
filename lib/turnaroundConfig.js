// lib/turnaroundConfig.js
// Category-level turnaround defaults. Products can override via optionsConfig.turnaround.

const CATEGORY_TURNAROUND = {
  "stickers-labels":              "2_3days",
  "rigid-signs":                  "2_3days",
  "display-stands":               "1day",
  "vehicle-branding-advertising": "3_5days",
  "facility-asset-labels":        "2_3days",
  "marketing-prints":             "2_3days",
  "banners-displays":             "2_3days",
  "large-format-graphics":        "3_5days",
  "retail-promo":                 "2_3days",
  packaging:                      "3_5days",
};

/**
 * Get turnaround key for a product.
 * Priority: product.optionsConfig.turnaround > category default > "2_3days"
 */
export function getTurnaround(product) {
  if (product?.optionsConfig?.turnaround) return product.optionsConfig.turnaround;
  if (product?.category && CATEGORY_TURNAROUND[product.category]) {
    return CATEGORY_TURNAROUND[product.category];
  }
  return "2_3days";
}

/**
 * Turnaround key → i18n translation key
 */
export function turnaroundI18nKey(key) {
  const map = {
    sameDay: "trust.turnaround.sameDay",
    "1day":  "trust.turnaround.1day",
    "2_3days": "trust.turnaround.2_3days",
    "3_5days": "trust.turnaround.3_5days",
    custom: "trust.turnaround.custom",
  };
  return map[key] || "trust.turnaround.2_3days";
}

/**
 * Turnaround key → badge color class
 */
export function turnaroundColor(key) {
  if (key === "sameDay" || key === "1day") return "bg-emerald-100 text-emerald-700";
  if (key === "2_3days") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
}
