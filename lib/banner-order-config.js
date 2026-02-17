// lib/banner-order-config.js — Banner & display type definitions + reverse-lookup

export const BANNER_TYPES = [
  {
    id: "vinyl-banner",
    defaultSlug: "vinyl-banners",
    hasDimensions: true,
    materials: [
      { id: "13oz-vinyl", label: "13oz Vinyl", multiplier: 1.0 },
      { id: "15oz-blockout", label: "15oz Blockout", multiplier: 1.15 },
    ],
    finishings: ["hems", "grommets", "pole-pockets", "wind-slits"],
    defaultFinishings: ["hems", "grommets"],
    sizes: [
      { label: '2\' × 4\'', w: 24, h: 48 },
      { label: '3\' × 6\'', w: 36, h: 72 },
      { label: '4\' × 8\'', w: 48, h: 96 },
    ],
    minIn: 12, maxW: 196, maxH: 600,
    quantities: [1, 2, 5, 10, 25, 50],
  },
  {
    id: "mesh-banner",
    defaultSlug: "mesh-banners",
    hasDimensions: true,
    materials: [
      { id: "mesh-standard", label: "Standard Mesh", multiplier: 1.0 },
      { id: "mesh-heavy", label: "Heavy-Duty Mesh", multiplier: 1.2 },
    ],
    finishings: ["hems", "grommets", "wind-slits"],
    defaultFinishings: ["hems", "grommets"],
    sizes: [
      { label: '3\' × 6\'', w: 36, h: 72 },
      { label: '4\' × 8\'', w: 48, h: 96 },
      { label: '5\' × 10\'', w: 60, h: 120 },
    ],
    minIn: 12, maxW: 196, maxH: 600,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "fabric-banner",
    defaultSlug: "fabric-banner",
    hasDimensions: true,
    materials: [
      { id: "polyester", label: "Polyester Fabric", multiplier: 1.0 },
      { id: "satin", label: "Satin Fabric", multiplier: 1.2 },
    ],
    finishings: ["hems", "pole-pockets", "grommets"],
    defaultFinishings: ["hems"],
    sizes: [
      { label: '2\' × 4\'', w: 24, h: 48 },
      { label: '3\' × 6\'', w: 36, h: 72 },
      { label: '4\' × 8\'', w: 48, h: 96 },
    ],
    minIn: 12, maxW: 120, maxH: 300,
    quantities: [1, 2, 5, 10, 25],
  },
  {
    id: "pole-banner",
    defaultSlug: "pole-banners",
    hasDimensions: true,
    materials: [
      { id: "18oz-vinyl", label: "18oz Heavy Vinyl", multiplier: 1.0 },
      { id: "polyester", label: "Polyester Fabric", multiplier: 1.15 },
    ],
    finishings: ["pole-pockets", "hems"],
    defaultFinishings: ["pole-pockets"],
    sizes: [
      { label: '24" × 48"', w: 24, h: 48 },
      { label: '30" × 60"', w: 30, h: 60 },
      { label: '36" × 72"', w: 36, h: 72 },
    ],
    minIn: 18, maxW: 48, maxH: 120,
    quantities: [2, 4, 10, 20, 50],
  },
  {
    id: "retractable-stand",
    defaultSlug: "roll-up-banners",
    hasDimensions: false,
    materials: [
      { id: "premium-vinyl", label: "Premium Vinyl", multiplier: 1.0 },
      { id: "fabric", label: "Fabric", multiplier: 1.2 },
    ],
    finishings: [],
    defaultFinishings: [],
    sizes: [
      { label: '33" × 81"', w: 33, h: 81 },
      { label: '36" × 92"', w: 36, h: 92 },
      { label: '47" × 81"', w: 47, h: 81 },
    ],
    minIn: 24, maxW: 60, maxH: 96,
    quantities: [1, 2, 5, 10, 25],
    includesHardware: true,
  },
  {
    id: "x-banner-stand",
    defaultSlug: "x-banner-prints",
    hasDimensions: false,
    materials: [
      { id: "premium-vinyl", label: "Premium Vinyl", multiplier: 1.0 },
    ],
    finishings: [],
    defaultFinishings: [],
    sizes: [
      { label: '24" × 63"', w: 24, h: 63 },
      { label: '32" × 71"', w: 32, h: 71 },
    ],
    minIn: 24, maxW: 36, maxH: 80,
    quantities: [1, 2, 5, 10],
    includesHardware: true,
  },
  {
    id: "feather-flag",
    defaultSlug: "feather-flags",
    hasDimensions: false,
    materials: [
      { id: "polyester", label: "Polyester Fabric", multiplier: 1.0 },
    ],
    finishings: [],
    defaultFinishings: [],
    sizes: [
      { label: 'Small (7\')', w: 24, h: 84 },
      { label: 'Medium (11\')', w: 28, h: 132 },
      { label: 'Large (15\')', w: 33, h: 180 },
    ],
    minIn: 24, maxW: 42, maxH: 192,
    quantities: [1, 2, 5, 10, 25],
    includesHardware: true,
  },
  {
    id: "teardrop-flag",
    defaultSlug: "teardrop-flags",
    hasDimensions: false,
    materials: [
      { id: "polyester", label: "Polyester Fabric", multiplier: 1.0 },
    ],
    finishings: [],
    defaultFinishings: [],
    sizes: [
      { label: 'Small (7\')', w: 24, h: 84 },
      { label: 'Medium (9.5\')', w: 28, h: 114 },
    ],
    minIn: 24, maxW: 36, maxH: 120,
    quantities: [1, 2, 5, 10, 25],
    includesHardware: true,
  },
  {
    id: "backdrop",
    defaultSlug: "step-repeat-backdrops",
    hasDimensions: true,
    materials: [
      { id: "vinyl", label: "Vinyl", multiplier: 1.0 },
      { id: "fabric", label: "Tension Fabric", multiplier: 1.25 },
    ],
    finishings: ["grommets", "pole-pockets"],
    defaultFinishings: ["grommets"],
    sizes: [
      { label: '8\' × 8\'', w: 96, h: 96 },
      { label: '8\' × 10\'', w: 96, h: 120 },
      { label: '10\' × 10\'', w: 120, h: 120 },
    ],
    minIn: 48, maxW: 240, maxH: 240,
    quantities: [1, 2, 5],
  },
  {
    id: "tabletop",
    defaultSlug: "tabletop-banner-a3",
    hasDimensions: false,
    materials: [
      { id: "premium-vinyl", label: "Premium Vinyl", multiplier: 1.0 },
    ],
    finishings: [],
    defaultFinishings: [],
    sizes: [
      { label: 'A4 (8" × 12")', w: 8, h: 12 },
      { label: 'A3 (12" × 17")', w: 12, h: 17 },
    ],
    minIn: 6, maxW: 18, maxH: 24,
    quantities: [1, 2, 5, 10, 25],
    includesHardware: true,
  },
];

export const FINISHING_OPTIONS = {
  hems: { label: "Heat-Welded Hems", surcharge: 0 },
  grommets: { label: "Grommets (every 2ft)", surcharge: 0 },
  "pole-pockets": { label: "Pole Pockets", surcharge: 50 }, // cents/unit
  "wind-slits": { label: "Wind Slits", surcharge: 25 },
};

export function getBannerType(id) {
  return BANNER_TYPES.find((bt) => bt.id === id) || BANNER_TYPES[0];
}

// Reverse-lookup: product slug → banner type id
const _slugToBanner = new Map();
for (const bt of BANNER_TYPES) {
  _slugToBanner.set(bt.defaultSlug, bt.id);
}
// Additional slug aliases
const _bannerSlugAliases = {
  "vinyl-banner-13oz": "vinyl-banner",
  "blockout-banners": "vinyl-banner",
  "double-sided-banners": "vinyl-banner",
  "mesh-banner": "mesh-banner",
  "mesh-banner-heavy-duty": "mesh-banner",
  "fabric-banner-double-sided": "fabric-banner",
  "fabric-banner-hanging": "fabric-banner",
  "pole-banner-single-sided": "pole-banner",
  "pole-banner-double-sided": "pole-banner",
  "deluxe-rollup-banner": "retractable-stand",
  "pull-up-banner": "retractable-stand",
  "retractable-banner-stand-premium": "retractable-stand",
  "x-banner-frame-print": "x-banner-stand",
  "x-banner-stand-standard": "x-banner-stand",
  "x-banner-stand-large": "x-banner-stand",
  "tabletop-x-banner": "x-banner-stand",
  "feather-flag": "feather-flag",
  "feather-flag-medium": "feather-flag",
  "feather-flag-large": "feather-flag",
  "teardrop-flag": "teardrop-flag",
  "teardrop-flag-medium": "teardrop-flag",
  "step-repeat-backdrop-8x8": "backdrop",
  "telescopic-backdrop": "backdrop",
  "media-wall-pop-up": "backdrop",
  "tabletop-banner-a4": "tabletop",
  "tabletop-banner-a3": "tabletop",
  "deluxe-tabletop-retractable-a3": "tabletop",
  "popup-display-curved-8ft": "backdrop",
  "popup-display-straight-8ft": "backdrop",
  "tension-fabric-display-8ft": "backdrop",
  "tension-fabric-display-10ft": "backdrop",
  "tension-fabric-display-3x3": "backdrop",
  "pillowcase-display-frame": "backdrop",
  "branded-table-cover-6ft": "tabletop",
  "branded-table-runner": "tabletop",
  "outdoor-canopy-tent-10x10": "backdrop",
};

for (const [slug, btId] of Object.entries(_bannerSlugAliases)) {
  if (!_slugToBanner.has(slug)) _slugToBanner.set(slug, btId);
}

/**
 * Given a product slug, return the banner type id if it matches, or null.
 */
export function getBannerTypeForSlug(productSlug) {
  return _slugToBanner.get(productSlug) || null;
}
