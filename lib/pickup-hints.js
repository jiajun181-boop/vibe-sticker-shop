/**
 * Large-format product slugs that benefit from local pickup.
 * Used to show pickup hints on product pages and in the cart.
 */
export const LARGE_FORMAT_SLUGS = [
  "vinyl-banners",
  "mesh-banners",
  "retractable-banner",
  "x-banner",
  "feather-flag",
  "teardrop-flag",
  "a-frame-sign",
  "full-vehicle-wrap",
  "partial-vehicle-wrap",
  "foam-board",
  "acrylic-sign",
  "aluminum-sign",
  "pvc-board-signs",
  // legacy slugs from rich pages
  "vehicle-wraps",
  "fleet-package",
  "fabric-banners",
  "backdrops",
  "retractable-stands",
  "x-banner-stands",
  "a-frame-signs",
  "yard-signs",
];

export const LARGE_FORMAT_CATEGORIES = [
  "vehicle-graphics-fleet",
  "banners-displays",
];

/**
 * Check if a product slug or category qualifies as large-format / oversized.
 * @param {string} slug
 * @param {string} [category]
 * @returns {boolean}
 */
export function isOversizedProduct(slug, category) {
  if (LARGE_FORMAT_SLUGS.includes(slug)) return true;
  if (category && LARGE_FORMAT_CATEGORIES.includes(category)) return true;
  return false;
}
