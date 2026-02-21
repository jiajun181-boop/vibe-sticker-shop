// lib/surface-order-config.js — Windows/Walls/Floors type definitions + reverse-lookup

export const SURFACE_TYPES = [
  // ── Series 1: Light Effect ──
  // Material IDs match COST_PLUS preset keys for direct pricing lookup
  {
    id: "transparent-color",
    defaultSlug: "window-graphics-transparent-color",
    application: "window",
    materials: [
      { id: "transparent-film", label: "Translucent Vinyl", printMode: "cmyk" },
      { id: "clear-film", label: "Clear Film (higher clarity)", printMode: "cmyk" },
    ],
    finishings: [],
    defaultFinishing: "none",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 72"', w: 48, h: 72 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "gradient-film",
    defaultSlug: "gradient-window-film",
    application: "window",
    materials: [
      { id: "transparent-film", label: "Clear → Color Gradient", printMode: "cmyk" },
      { id: "frosted-film", label: "Clear → Frosted Gradient", printMode: "cmyk" },
    ],
    finishings: [],
    defaultFinishing: "none",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 72"', w: 48, h: 72 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },

  // ── Series 2: Vision Control ──
  {
    id: "one-way-vision",
    defaultSlug: "one-way-vision",
    application: "window",
    materials: [
      { id: "perforated-vinyl", label: "Perforated Vinyl", printMode: "cmyk-w" },
    ],
    finishings: ["overlaminate"],
    defaultFinishing: "overlaminate",
    cutTypes: ["rectangular"],
    sizes: [
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 72"', w: 48, h: 72 },
      { label: '53" × 96"', w: 53, h: 96 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "blockout-vinyl",
    defaultSlug: "window-graphics-blockout",
    application: "window",
    materials: [
      { id: "blockout-vinyl", label: "Blockout Vinyl (Permanent)", printMode: "cmyk" },
      { id: "blockout-vinyl-rem", label: "Blockout Vinyl (Removable)", printMode: "cmyk" },
    ],
    finishings: ["gloss-lam", "matte-lam"],
    defaultFinishing: "none",
    cutTypes: ["rectangular"],
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 72"', w: 48, h: 72 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25, 50],
  },

  // ── Series 3: Frosted & Specialty ──
  {
    id: "frosted-printed",
    defaultSlug: "frosted-window-graphics",
    application: "window",
    materials: [
      { id: "frosted-film", label: "Frosted Vinyl (Etch Glass)", printMode: "cmyk-w" },
    ],
    finishings: [],
    defaultFinishing: "none",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 96"', w: 48, h: 96 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "static-cling-frosted",
    defaultSlug: "static-cling-frosted",
    application: "window",
    materials: [
      { id: "static-cling-frosted", label: "Frosted Static Cling (no adhesive)", printMode: "cmyk" },
    ],
    finishings: [],
    defaultFinishing: "none",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
    ],
    minIn: 6, maxW: 47, maxH: 96,
    quantities: [1, 5, 10, 25, 50],
  },

  // ── Series 4: Standard Opaque ──
  {
    id: "window-standard",
    defaultSlug: "window-graphics-standard",
    application: "window",
    materials: [
      { id: "white-vinyl", label: "Regular White Vinyl", printMode: "cmyk" },
      { id: "removable-white", label: "Removable White Vinyl", printMode: "cmyk" },
    ],
    finishings: ["gloss-lam", "matte-lam"],
    defaultFinishing: "none",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 72"', w: 48, h: 72 },
    ],
    minIn: 6, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25, 50],
  },
  {
    id: "window-double-sided",
    defaultSlug: "window-graphics-double-sided",
    application: "window",
    materials: [
      { id: "clear-vinyl", label: "Clear Vinyl (Color+White+Color)", printMode: "cmyk-w-cmyk" },
    ],
    finishings: ["gloss-lam", "matte-lam"],
    defaultFinishing: "none",
    cutTypes: ["rectangular"],
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 72"', w: 48, h: 72 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "static-cling-standard",
    defaultSlug: "static-cling-standard",
    application: "window",
    materials: [
      { id: "static-cling-clear", label: "Clear Static Cling", printMode: "cmyk" },
    ],
    finishings: [],
    defaultFinishing: "none",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '24" × 36"', w: 24, h: 36 },
    ],
    minIn: 6, maxW: 47, maxH: 96,
    quantities: [1, 5, 10, 25, 50, 100],
  },

  // ── Wall & Floor (COST_PLUS) ──
  {
    id: "wall-graphic",
    defaultSlug: "wall-graphics",
    application: "wall",
    materials: [
      { id: "wall-repositionable", label: "Repositionable Vinyl", printMode: "cmyk" },
      { id: "wall-permanent", label: "Permanent Vinyl", printMode: "cmyk" },
      { id: "wall-fabric", label: "Fabric Wallpaper", printMode: "cmyk" },
    ],
    finishings: ["matte-lam", "gloss-lam"],
    defaultFinishing: "none",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 96"', w: 48, h: 96 },
    ],
    minIn: 6, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "floor-graphic",
    defaultSlug: "floor-graphics",
    application: "floor",
    materials: [
      { id: "floor-vinyl-nonslip", label: "Vinyl + Non-Slip Laminate", printMode: "cmyk" },
      { id: "floor-removable", label: "Removable Floor Vinyl", printMode: "cmyk" },
    ],
    finishings: ["nonslip-laminate"],
    defaultFinishing: "nonslip-laminate",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '12" × 12"', w: 12, h: 12 },
      { label: '24" × 24"', w: 24, h: 24 },
      { label: '36" × 36"', w: 36, h: 36 },
      { label: '48" × 48"', w: 48, h: 48 },
    ],
    minIn: 6, maxW: 53, maxH: 120,
    quantities: [1, 2, 5, 10, 25, 50],
  },
];

export const FINISHING_OPTIONS = {
  "gloss-lam": { label: "Gloss Laminate", surcharge: 25 },
  "matte-lam": { label: "Matte Laminate", surcharge: 30 },
  overlaminate: { label: "Overlaminate (UV Protection)", surcharge: 35 },
  "nonslip-laminate": { label: "Non-Slip Laminate", surcharge: 40 },
};

export function getSurfaceType(id) {
  return SURFACE_TYPES.find((st) => st.id === id) || SURFACE_TYPES[0];
}

// Reverse-lookup: product slug → surface type id
const _slugToSurface = new Map();
for (const st of SURFACE_TYPES) {
  _slugToSurface.set(st.defaultSlug, st.id);
}

const _surfaceSlugAliases = {
  // Wall & Floor aliases
  "wall-decals": "wall-graphic",
  "wall-mural-graphic": "wall-graphic",
  "wall-murals": "wall-graphic",
  "floor-decals": "floor-graphic",
  "floor-logo-graphic": "floor-graphic",
  "floor-direction-arrows-set": "floor-graphic",
  "floor-number-markers-set": "floor-graphic",
  "lf-floor-graphics": "floor-graphic",
  "warehouse-floor-safety-graphics": "floor-graphic",
  // WWF v2 slug aliases → old surface type ids (for /order/ route backwards compat)
  "frosted-window-film": "frosted-printed",
  "static-cling": "static-cling-frosted",
  "transparent-color-film": "transparent-color",
  "blockout-vinyl": "blockout-vinyl",
  "opaque-window-graphics": "window-standard",
  "glass-waistline": "frosted-printed",
};

for (const [slug, stId] of Object.entries(_surfaceSlugAliases)) {
  if (!_slugToSurface.has(slug)) _slugToSurface.set(slug, stId);
}

/**
 * Given a product slug, return the surface type id if it matches, or null.
 */
export function getSurfaceTypeForSlug(productSlug) {
  return _slugToSurface.get(productSlug) || null;
}
