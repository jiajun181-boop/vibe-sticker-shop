// lib/wwf-product-config.js — Windows, Walls & Floors product definitions (9 products)

export const WWF_APPLICATION_SIDES = {
  inside: { id: "inside", label: "Inside Glass" },
  outside: { id: "outside", label: "Outside Glass" },
};

export const WWF_PRODUCTS = [
  {
    id: "one-way-vision",
    slug: "one-way-vision",
    name: "One-Way Vision",
    description: "See-through perforated vinyl for storefronts. Full graphics on outside, clear view from inside.",
    fixedMaterial: "perforated-vinyl",
    application: "window",
    cutTypes: ["rectangular"],
    sizes: [
      { label: '36" \u00d7 48"', w: 36, h: 48 },
      { label: '48" \u00d7 72"', w: 48, h: 72 },
      { label: '53" \u00d7 96"', w: 53, h: 96 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
    finishings: ["overlaminate"],
    defaultFinishing: "overlaminate",
  },
  {
    id: "frosted-window-film",
    slug: "frosted-window-film",
    name: "Frosted Window Film",
    description: "Elegant etched-glass look for privacy and branding. Printed or solid frosted vinyl.",
    fixedMaterial: "frosted-film",
    application: "window",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" \u00d7 36"', w: 24, h: 36 },
      { label: '36" \u00d7 48"', w: 36, h: 48 },
      { label: '48" \u00d7 96"', w: 48, h: 96 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
    finishings: [],
    defaultFinishing: "none",
  },
  {
    id: "static-cling",
    slug: "static-cling",
    name: "Static Cling",
    description: "Adhesive-free window film that clings with static. Easy to apply, remove, and reuse.",
    fixedMaterial: "static-cling-frosted",
    application: "window",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '12" \u00d7 18"', w: 12, h: 18 },
      { label: '24" \u00d7 36"', w: 24, h: 36 },
      { label: '36" \u00d7 48"', w: 36, h: 48 },
    ],
    minIn: 6, maxW: 47, maxH: 96,
    quantities: [1, 5, 10, 25, 50],
    finishings: [],
    defaultFinishing: "none",
  },
  {
    id: "transparent-color-film",
    slug: "transparent-color-film",
    name: "Transparent Color Film",
    description: "Translucent printed vinyl that lets light through. Ideal for coloured window displays.",
    fixedMaterial: "transparent-film",
    application: "window",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" \u00d7 36"', w: 24, h: 36 },
      { label: '36" \u00d7 48"', w: 36, h: 48 },
      { label: '48" \u00d7 72"', w: 48, h: 72 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
    finishings: [],
    defaultFinishing: "none",
  },
  {
    id: "blockout-vinyl",
    slug: "blockout-vinyl",
    name: "Blockout Vinyl",
    description: "Opaque vinyl that fully blocks light and view. Perfect for full-coverage window graphics.",
    fixedMaterial: "blockout-vinyl",
    application: "window",
    cutTypes: ["rectangular"],
    sizes: [
      { label: '24" \u00d7 36"', w: 24, h: 36 },
      { label: '36" \u00d7 48"', w: 36, h: 48 },
      { label: '48" \u00d7 72"', w: 48, h: 72 },
    ],
    minIn: 12, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25, 50],
    finishings: ["gloss-lam", "matte-lam"],
    defaultFinishing: "none",
  },
  {
    id: "opaque-window-graphics",
    slug: "opaque-window-graphics",
    name: "Opaque Window Graphics",
    description: "Standard white vinyl applied to glass for bold, full-colour window signage and lettering.",
    fixedMaterial: "white-vinyl",
    application: "window",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" \u00d7 36"', w: 24, h: 36 },
      { label: '36" \u00d7 48"', w: 36, h: 48 },
      { label: '48" \u00d7 72"', w: 48, h: 72 },
    ],
    minIn: 6, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25, 50],
    finishings: ["gloss-lam", "matte-lam"],
    defaultFinishing: "none",
  },
  {
    id: "glass-waistline",
    slug: "glass-waistline",
    name: "Glass Waistline",
    description: "Decorative safety strip for glass doors and partitions. Required by building codes for visibility.",
    fixedMaterial: null, // multi-material
    application: "window",
    materials: [
      { id: "frosted-film", label: "Frosted Film" },
      { id: "transparent-film", label: "Coloured Translucent" },
      { id: "white-vinyl", label: "Opaque White Vinyl" },
    ],
    cutTypes: ["rectangular"],
    sizes: [
      { label: '4" \u00d7 48"', w: 4, h: 48 },
      { label: '6" \u00d7 48"', w: 6, h: 48 },
      { label: '8" \u00d7 48"', w: 8, h: 48 },
      { label: '4" \u00d7 96"', w: 4, h: 96 },
      { label: '6" \u00d7 96"', w: 6, h: 96 },
      { label: '8" \u00d7 96"', w: 8, h: 96 },
    ],
    minIn: 2, maxW: 12, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
    finishings: [],
    defaultFinishing: "none",
  },
  {
    id: "wall-graphics",
    slug: "wall-graphics",
    name: "Wall Graphics",
    description: "Repositionable printed vinyl for interior walls. Damage-free application for offices and retail.",
    fixedMaterial: "wall-repositionable",
    application: "wall",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '24" \u00d7 36"', w: 24, h: 36 },
      { label: '36" \u00d7 48"', w: 36, h: 48 },
      { label: '48" \u00d7 96"', w: 48, h: 96 },
    ],
    minIn: 6, maxW: 53, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
    finishings: ["matte-lam", "gloss-lam"],
    defaultFinishing: "none",
  },
  {
    id: "floor-graphics",
    slug: "floor-graphics",
    name: "Floor Graphics",
    description: "Non-slip laminated vinyl for indoor floors. Wayfinding, branding, and safety messaging.",
    fixedMaterial: "floor-vinyl-nonslip",
    application: "floor",
    cutTypes: ["rectangular", "contour"],
    sizes: [
      { label: '12" \u00d7 12"', w: 12, h: 12 },
      { label: '24" \u00d7 24"', w: 24, h: 24 },
      { label: '36" \u00d7 36"', w: 36, h: 36 },
      { label: '48" \u00d7 48"', w: 48, h: 48 },
    ],
    minIn: 6, maxW: 53, maxH: 120,
    quantities: [1, 2, 5, 10, 25, 50],
    finishings: ["nonslip-laminate"],
    defaultFinishing: "nonslip-laminate",
  },
];

export const WWF_FINISHING_OPTIONS = {
  "gloss-lam": { label: "Gloss Laminate", surcharge: 25 },
  "matte-lam": { label: "Matte Laminate", surcharge: 30 },
  overlaminate: { label: "Overlaminate (UV Protection)", surcharge: 35 },
  "nonslip-laminate": { label: "Non-Slip Laminate", surcharge: 40 },
};

// Slug aliases for old product URLs
const _slugAliases = {
  "frosted-window-graphics": "frosted-window-film",
  "static-cling-frosted": "static-cling",
  "static-cling-standard": "static-cling",
  "window-graphics-transparent-color": "transparent-color-film",
  "window-graphics-blockout": "blockout-vinyl",
  "window-graphics-standard": "opaque-window-graphics",
  "window-graphics-double-sided": "opaque-window-graphics",
  "window-lettering": "opaque-window-graphics",
  "gradient-window-film": "transparent-color-film",
  "dichroic-window-film": null, // removed
};

export function getWwfProduct(id) {
  return WWF_PRODUCTS.find((p) => p.id === id) || null;
}

export function getWwfProductForSlug(slug) {
  // Direct match
  const direct = WWF_PRODUCTS.find((p) => p.slug === slug);
  if (direct) return direct;
  // Alias match
  const aliasId = _slugAliases[slug];
  if (aliasId) return WWF_PRODUCTS.find((p) => p.id === aliasId) || null;
  return null;
}
