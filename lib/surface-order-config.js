// lib/surface-order-config.js — Windows/Walls/Floors type definitions + reverse-lookup

export const SURFACE_TYPES = [
  {
    id: "window-graphic",
    defaultSlug: "window-graphics",
    application: "window",
    materials: [
      { id: "clear-vinyl", label: "Clear Vinyl", multiplier: 1.0 },
      { id: "white-vinyl", label: "White Vinyl", multiplier: 0.95 },
      { id: "perforated", label: "Perforated (See-Through)", multiplier: 1.2 },
    ],
    finishings: ["gloss-lam", "matte-lam"],
    defaultFinishing: "none",
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 72"', w: 48, h: 72 },
    ],
    minIn: 6, maxW: 196, maxH: 600,
    quantities: [1, 2, 5, 10, 25, 50],
  },
  {
    id: "window-film",
    defaultSlug: "frosted-privacy-film",
    application: "window",
    materials: [
      { id: "frosted", label: "Frosted / Privacy Film", multiplier: 1.0 },
      { id: "decorative", label: "Decorative Film", multiplier: 1.1 },
      { id: "holographic", label: "Holographic / Iridescent", multiplier: 1.35 },
    ],
    finishings: [],
    defaultFinishing: "none",
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 96"', w: 48, h: 96 },
    ],
    minIn: 12, maxW: 60, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "one-way-vision",
    defaultSlug: "one-way-vision-graphics",
    application: "window",
    materials: [
      { id: "perforated-50", label: "50% Perforation", multiplier: 1.0 },
      { id: "perforated-65", label: "65% Perforation", multiplier: 1.1 },
    ],
    finishings: ["overlaminate"],
    defaultFinishing: "overlaminate",
    sizes: [
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 72"', w: 48, h: 72 },
      { label: '60" × 96"', w: 60, h: 96 },
    ],
    minIn: 12, maxW: 196, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "window-lettering",
    defaultSlug: "window-lettering-cut-vinyl",
    application: "window",
    materials: [
      { id: "outdoor-vinyl", label: "Outdoor Vinyl", multiplier: 1.0 },
      { id: "frosted-vinyl", label: "Frosted Vinyl", multiplier: 1.15 },
    ],
    finishings: [],
    defaultFinishing: "none",
    sizes: [
      { label: '12" × 4"', w: 12, h: 4 },
      { label: '24" × 8"', w: 24, h: 8 },
      { label: '36" × 12"', w: 36, h: 12 },
    ],
    minIn: 3, maxW: 120, maxH: 48,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "static-cling",
    defaultSlug: "clear-static-cling",
    application: "window",
    materials: [
      { id: "clear-cling", label: "Clear Static Cling", multiplier: 1.0 },
      { id: "frosted-cling", label: "Frosted Static Cling", multiplier: 1.1 },
      { id: "white-cling", label: "White Static Cling", multiplier: 1.0 },
    ],
    finishings: [],
    defaultFinishing: "none",
    sizes: [
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '24" × 36"', w: 24, h: 36 },
    ],
    minIn: 3, maxW: 48, maxH: 96,
    quantities: [1, 5, 10, 25, 50, 100],
  },
  {
    id: "wall-graphic",
    defaultSlug: "wall-graphics",
    application: "wall",
    materials: [
      { id: "repositionable", label: "Repositionable Vinyl", multiplier: 1.0 },
      { id: "permanent", label: "Permanent Vinyl", multiplier: 0.9 },
      { id: "fabric", label: "Fabric Wallpaper", multiplier: 1.3 },
    ],
    finishings: ["matte-lam", "gloss-lam"],
    defaultFinishing: "none",
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
      { label: '48" × 96"', w: 48, h: 96 },
    ],
    minIn: 6, maxW: 196, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "floor-graphic",
    defaultSlug: "floor-graphics",
    application: "floor",
    materials: [
      { id: "vinyl-nonslip", label: "Vinyl + Non-Slip Laminate", multiplier: 1.0 },
      { id: "removable", label: "Removable Floor Vinyl", multiplier: 1.1 },
    ],
    finishings: ["nonslip-laminate"],
    defaultFinishing: "nonslip-laminate",
    sizes: [
      { label: '12" × 12"', w: 12, h: 12 },
      { label: '24" × 24"', w: 24, h: 24 },
      { label: '36" × 36"', w: 36, h: 36 },
      { label: '48" × 48"', w: 48, h: 48 },
    ],
    minIn: 6, maxW: 60, maxH: 120,
    quantities: [1, 2, 5, 10, 25, 50],
  },
  {
    id: "canvas-print",
    defaultSlug: "canvas-prints-standard",
    application: "wall",
    materials: [
      { id: "cotton-canvas", label: "Cotton Canvas", multiplier: 1.0 },
      { id: "poly-canvas", label: "Poly-Cotton Blend", multiplier: 0.9 },
    ],
    finishings: ["gallery-wrap", "framed", "standard-wrap"],
    defaultFinishing: "gallery-wrap",
    sizes: [
      { label: '8" × 10"', w: 8, h: 10 },
      { label: '16" × 20"', w: 16, h: 20 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '30" × 40"', w: 30, h: 40 },
    ],
    minIn: 6, maxW: 60, maxH: 120,
    quantities: [1, 2, 5, 10],
  },
];

export const FINISHING_OPTIONS = {
  "gloss-lam": { label: "Gloss Laminate", surcharge: 25 },
  "matte-lam": { label: "Matte Laminate", surcharge: 30 },
  overlaminate: { label: "Overlaminate (UV Protection)", surcharge: 35 },
  "nonslip-laminate": { label: "Non-Slip Laminate", surcharge: 40 },
  "gallery-wrap": { label: "Gallery Wrap (1.5\" depth)", surcharge: 0 },
  framed: { label: "Framed", surcharge: 500 }, // per unit
  "standard-wrap": { label: "Standard Wrap (0.75\" depth)", surcharge: 0 },
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
  "full-window-graphics": "window-graphic",
  "window-decals": "window-graphic",
  "color-white-color-clear-vinyl": "window-graphic",
  "color-white-on-clear-vinyl": "window-graphic",
  "window-graphics-perforated": "one-way-vision",
  "perforated-window-film": "one-way-vision",
  "window-perforated": "one-way-vision",
  "vehicle-window-tint-graphic": "one-way-vision",
  "frosted-matte-window-film": "window-film",
  "frosted-privacy-window-film": "window-film",
  "window-frosted": "window-film",
  "holographic-iridescent-film": "window-film",
  "frosted-static-cling": "static-cling",
  "window-cut-vinyl-lettering": "window-lettering",
  "window-lettering-business": "window-lettering",
  "storefront-hours-door-decal-cut-vinyl": "window-lettering",
  "wall-decals": "wall-graphic",
  "wall-mural-graphic": "wall-graphic",
  "wall-murals": "wall-graphic",
  "floor-decals": "floor-graphic",
  "floor-logo-graphic": "floor-graphic",
  "floor-direction-arrows-set": "floor-graphic",
  "floor-number-markers-set": "floor-graphic",
  "lf-floor-graphics": "floor-graphic",
  "warehouse-floor-safety-graphics": "floor-graphic",
  "framed-canvas-prints": "canvas-print",
  "gallery-wrap-canvas-prints": "canvas-print",
  "panoramic-canvas-prints": "canvas-print",
  "split-panel-canvas-prints": "canvas-print",
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
