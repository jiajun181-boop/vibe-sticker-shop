// lib/turnaroundConfig.js
// Category-level turnaround defaults. Products can override via optionsConfig.turnaround.

const CATEGORY_TURNAROUND = {
  "marketing-business-print":     "2_3days",
  "stickers-labels-decals":       "2_3days",
  "signs-rigid-boards":           "2_3days",
  "banners-displays":             "2_3days",
  "canvas-prints":                "3_5days",
  "windows-walls-floors":         "3_5days",
  "vehicle-graphics-fleet":       "3_5days",
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
