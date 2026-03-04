// lib/sticker-order-config.js — Cutting type definitions for /order/stickers

export const STICKER_SHAPES = [
  { id: "circle",    label: "stickerOrder.shape.circle" },
  { id: "square",    label: "stickerOrder.shape.square" },
  { id: "rectangle", label: "stickerOrder.shape.rectangle" },
  { id: "oval",      label: "stickerOrder.shape.oval" },
  { id: "custom",    label: "stickerOrder.shape.custom" },
];

// ── New exports: lamination rules, white ink, foil, turnaround, print modes ──

/** Materials where lamination should be hidden (not applicable) */
export const LAMINATION_RULES = {
  hide: [
    "clear-static-cling", "frosted-static-cling", "white-static-cling",
    "foil-stamping", "holographic-vinyl", "3m-reflective",
  ],
  paperWarning: [
    "gloss-paper", "matte-paper", "soft-touch-paper",
  ],
};

/** Materials that support white ink / print mode selection */
export const WHITE_INK_MATERIALS = [
  "clear-vinyl", "frosted-vinyl", "holographic-vinyl",
  "clear-static-cling", "frosted-static-cling",
  "clear-bopp",
];

/** Foil sub-options when foil-stamping is selected */
export const FOIL_SUB_OPTIONS = [
  { id: "gold", label: "stickerOrder.foil.gold" },
  { id: "silver", label: "stickerOrder.foil.silver" },
  { id: "rose-gold", label: "stickerOrder.foil.roseGold" },
];

/** Turnaround options */
export const TURNAROUND_OPTIONS = [
  { id: "standard", label: "stickerOrder.turnaround.standard", desc: "stickerOrder.turnaround.standardDesc", multiplier: 1.0 },
  { id: "rush", label: "stickerOrder.turnaround.rush", desc: "stickerOrder.turnaround.rushDesc", multiplier: 1.5 },
];

/** Print modes for white ink materials */
export const PRINT_MODES = [
  { id: "color_only", label: "stickerOrder.printMode.colorOnly" },
  { id: "white_only", label: "stickerOrder.printMode.whiteOnly" },
  { id: "white_color", label: "stickerOrder.printMode.whiteColor" },
  { id: "color_white_color", label: "stickerOrder.printMode.colorWhiteColor" },
];

/** Custom shape surcharge percentage */
export const CUSTOM_SHAPE_SURCHARGE = 0.15;

/** Material group display labels */
export const MATERIAL_GROUP_LABELS = {
  vinyl: "Vinyl",
  paper: "Paper",
  cling: "Static Cling",
  special: "Special",
  bopp: "BOPP",
};

export const CUTTING_TYPES = [
  {
    id: "die-cut",
    icon: "scissors",
    sizes: [
      { label: '2" × 2"', w: 2, h: 2 },
      { label: '2" × 3.5"', w: 2, h: 3.5 },
      { label: '3" × 3"', w: 3, h: 3 },
      { label: '3" × 5"', w: 3, h: 5 },
      { label: '4" × 4"', w: 4, h: 4 },
    ],
    materials: [
      // Vinyl (10 materials: 7 vinyl + 3 static cling)
      { id: "white-vinyl", multiplier: 1.0, group: "vinyl" },
      { id: "matte-vinyl", multiplier: 1.0, group: "vinyl" },
      { id: "clear-vinyl", multiplier: 1.15, group: "vinyl" },
      { id: "frosted-vinyl", multiplier: 1.32, group: "vinyl" },
      { id: "holographic-vinyl", multiplier: 1.35, group: "vinyl" },
      { id: "3m-reflective", multiplier: 1.25, group: "vinyl" },
      { id: "heavy-duty-vinyl", multiplier: 1.15, group: "vinyl" },
      // Static Cling
      { id: "clear-static-cling", multiplier: 1.12, group: "cling" },
      { id: "frosted-static-cling", multiplier: 1.12, group: "cling" },
      { id: "white-static-cling", multiplier: 1.12, group: "cling" },
    ],
    lamination: [
      { id: "none", multiplier: 1.0 },
      { id: "gloss", multiplier: 1.10 },
      { id: "matte-lam", multiplier: 1.10 },
    ],
    quantities: [25, 50, 100, 250, 500, 1000, 2500],
    minIn: 0.5,
    maxW: 12,
    maxH: 12,
    slugMap: {
      "white-vinyl": "die-cut-stickers",
      "matte-vinyl": "die-cut-stickers",
      "clear-vinyl": "die-cut-stickers",
      "frosted-vinyl": "die-cut-stickers",
      "holographic-vinyl": "die-cut-stickers",
      "3m-reflective": "die-cut-stickers",
      "heavy-duty-vinyl": "die-cut-stickers",
      "clear-static-cling": "die-cut-stickers",
      "frosted-static-cling": "die-cut-stickers",
      "white-static-cling": "die-cut-stickers",
    },
    shapes: STICKER_SHAPES,
  },
  {
    id: "kiss-cut",
    icon: "layers",
    sizes: [
      { label: '2" × 2"', w: 2, h: 2 },
      { label: '3" × 3"', w: 3, h: 3 },
      { label: '4" × 4"', w: 4, h: 4 },
      { label: '4" × 6"', w: 4, h: 6 },
    ],
    materials: [
      // Vinyl only (7 materials — no paper, no static cling)
      { id: "white-vinyl", multiplier: 1.0, group: "vinyl" },
      { id: "matte-vinyl", multiplier: 1.0, group: "vinyl" },
      { id: "clear-vinyl", multiplier: 1.15, group: "vinyl" },
      { id: "frosted-vinyl", multiplier: 1.32, group: "vinyl" },
      { id: "holographic-vinyl", multiplier: 1.35, group: "vinyl" },
      { id: "3m-reflective", multiplier: 1.25, group: "vinyl" },
      { id: "heavy-duty-vinyl", multiplier: 1.15, group: "vinyl" },
    ],
    lamination: [
      { id: "none", multiplier: 1.0 },
      { id: "gloss", multiplier: 1.10 },
      { id: "matte-lam", multiplier: 1.10 },
    ],
    quantities: [25, 50, 100, 250, 500, 1000, 2500],
    minIn: 0.5,
    maxW: 12,
    maxH: 12,
    slugMap: {
      "white-vinyl": "kiss-cut-stickers",
      "matte-vinyl": "kiss-cut-stickers",
      "clear-vinyl": "kiss-cut-stickers",
      "frosted-vinyl": "kiss-cut-stickers",
      "holographic-vinyl": "kiss-cut-stickers",
      "3m-reflective": "kiss-cut-stickers",
      "heavy-duty-vinyl": "kiss-cut-stickers",
    },
    shapes: STICKER_SHAPES,
  },
  {
    id: "sheets",
    icon: "grid",
    sizes: [
      { label: '4" × 6"', w: 4, h: 6 },
      { label: '5" × 7"', w: 5, h: 7 },
      { label: '8.5" × 11"', w: 8.5, h: 11 },
    ],
    materials: [
      // Paper (most affordable — show first for sheets)
      { id: "gloss-paper", multiplier: 0.85, group: "paper" },
      { id: "matte-paper", multiplier: 0.85, group: "paper" },
      { id: "soft-touch-paper", multiplier: 1.12, group: "paper" },
      // Vinyl
      { id: "white-vinyl", multiplier: 1.0, group: "vinyl" },
      { id: "matte-vinyl", multiplier: 1.0, group: "vinyl" },
      { id: "clear-vinyl", multiplier: 1.15, group: "vinyl" },
      { id: "frosted-vinyl", multiplier: 1.32, group: "vinyl" },
      { id: "holographic-vinyl", multiplier: 1.35, group: "vinyl" },
      { id: "3m-reflective", multiplier: 1.25, group: "vinyl" },
      { id: "heavy-duty-vinyl", multiplier: 1.15, group: "vinyl" },
      // Special
      { id: "foil-stamping", multiplier: 1.50, group: "special" },
    ],
    lamination: [
      { id: "none", multiplier: 1.0 },
      { id: "gloss", multiplier: 1.10 },
      { id: "matte-lam", multiplier: 1.10 },
    ],
    quantities: [25, 50, 100, 250, 500],
    minIn: 2,
    maxW: 12,
    maxH: 18,
    slugMap: {
      "white-vinyl": "sticker-sheets",
      "matte-vinyl": "sticker-sheets",
      "clear-vinyl": "sticker-sheets",
      "frosted-vinyl": "sticker-sheets",
      "holographic-vinyl": "sticker-sheets",
      "3m-reflective": "sticker-sheets",
      "heavy-duty-vinyl": "sticker-sheets",
      "gloss-paper": "sticker-sheets",
      "matte-paper": "sticker-sheets",
      "soft-touch-paper": "sticker-sheets",
      "foil-stamping": "sticker-sheets",
    },
  },
  {
    id: "roll-labels",
    icon: "circle",
    sizes: [
      { label: '1" × 1"', w: 1, h: 1 },
      { label: '2" × 2"', w: 2, h: 2 },
      { label: '3" × 2"', w: 3, h: 2 },
    ],
    materials: [
      // 4 BOPP stocks (no matte-white)
      { id: "white-gloss-bopp", multiplier: 1.0 },
      { id: "clear-bopp", multiplier: 1.1 },
      { id: "silver-brushed-bopp", multiplier: 1.25 },
      { id: "freezer-grade-bopp", multiplier: 1.15 },
    ],
    quantities: [250, 500, 1000, 2000, 5000],
    minIn: 0.5,
    maxW: 12,
    maxH: 18,
    slugMap: {
      "white-gloss-bopp": "roll-labels",
      "clear-bopp": "roll-labels",
      "silver-brushed-bopp": "roll-labels",
      "freezer-grade-bopp": "roll-labels",
    },
  },
  {
    id: "vinyl-lettering",
    icon: "type",
    sizes: [
      { label: '6" × 2"', w: 6, h: 2 },
      { label: '12" × 3"', w: 12, h: 3 },
      { label: '24" × 6"', w: 24, h: 6 },
    ],
    materials: [
      { id: "outdoor", multiplier: 1.0 },
      { id: "indoor", multiplier: 0.9 },
      { id: "reflective", multiplier: 1.4 },
    ],
    quantities: [1, 5, 10, 25, 50, 100],
    minIn: 1,
    maxW: 48,
    maxH: 48,
    slugMap: {
      outdoor: "vinyl-lettering",
      indoor: "vinyl-lettering",
      reflective: "vinyl-lettering",
    },
  },
  {
    id: "decals",
    icon: "square",
    sizes: [
      { label: '3" × 3"', w: 3, h: 3 },
      { label: '6" × 6"', w: 6, h: 6 },
      { label: '12" × 12"', w: 12, h: 12 },
    ],
    materials: [
      { id: "white-vinyl", multiplier: 1.0 },
      { id: "clear", multiplier: 1.15 },
      { id: "perforated", multiplier: 1.3 },
      { id: "floor-nonslip", multiplier: 1.45 },
    ],
    quantities: [1, 5, 10, 25, 50, 100],
    minIn: 1,
    maxW: 48,
    maxH: 48,
    slugMap: {
      "white-vinyl": "window-decals",
      clear: "clear-singles",
      perforated: "window-decals",
      "floor-nonslip": "floor-decals",
    },
    shapes: STICKER_SHAPES,
  },
  {
    id: "transfer",
    icon: "arrow-up-right",
    sizes: [
      { label: '2" × 2"', w: 2, h: 2 },
      { label: '3" × 3"', w: 3, h: 3 },
      { label: '4" × 4"', w: 4, h: 4 },
    ],
    materials: [
      { id: "transfer-vinyl", multiplier: 1.0 },
    ],
    quantities: [25, 50, 100, 250, 500, 1000],
    minIn: 0.5,
    maxW: 48,
    maxH: 48,
    slugMap: {
      "transfer-vinyl": "transfer-stickers",
    },
    shapes: STICKER_SHAPES,
  },
  {
    id: "static-cling",
    icon: "zap",
    sizes: [
      { label: '3" × 3"', w: 3, h: 3 },
      { label: '4" × 4"', w: 4, h: 4 },
      { label: '6" × 6"', w: 6, h: 6 },
    ],
    materials: [
      { id: "white-cling", multiplier: 1.0 },
      { id: "clear-cling", multiplier: 1.1 },
    ],
    quantities: [25, 50, 100, 250, 500, 1000],
    minIn: 1,
    maxW: 47,
    maxH: 47,
    slugMap: {
      "white-cling": "static-cling-stickers",
      "clear-cling": "static-cling-stickers",
    },
    shapes: STICKER_SHAPES,
  },
  {
    id: "magnets",
    icon: "magnet",
    sizes: [
      { label: '2" × 3.5"', w: 2, h: 3.5 },
      { label: '4" × 6"', w: 4, h: 6 },
      { label: '5" × 7"', w: 5, h: 7 },
    ],
    materials: [
      { id: "magnetic-vinyl", multiplier: 1.0 },
    ],
    quantities: [10, 25, 50, 100, 250, 500],
    minIn: 1,
    maxW: 24,
    maxH: 36,
    slugMap: {
      "magnetic-vinyl": "magnet-stickers",
    },
    shapes: STICKER_SHAPES,
  },
];

export function getCuttingType(id) {
  return CUTTING_TYPES.find((ct) => ct.id === id) || CUTTING_TYPES[0];
}

export function resolveProductSlug(cuttingTypeId, materialId) {
  const ct = getCuttingType(cuttingTypeId);
  return ct.slugMap[materialId] || Object.values(ct.slugMap)[0];
}

// Reverse-lookup: given a product slug, return the cutting type id (or null)
const _slugToCutting = new Map();
for (const ct of CUTTING_TYPES) {
  for (const slug of Object.values(ct.slugMap)) {
    if (!_slugToCutting.has(slug)) _slugToCutting.set(slug, ct.id);
  }
}
// Also map the cutting type id itself (e.g. "die-cut" → "die-cut")
for (const ct of CUTTING_TYPES) {
  _slugToCutting.set(ct.id, ct.id);
}
// Extra slug aliases that aren't in slugMap but should resolve
const _extraSlugAliases = {
  // Sub-group slug → cutting type mapping (for category page integration)
  "kiss-cut-singles": "kiss-cut",
  "sticker-pages": "sheets",
  "sticker-rolls": "roll-labels",
  // Legacy aliases
  "stickers-single-diecut": "die-cut",
  "stickers-die-cut-custom": "die-cut",
  "heavy-duty-vinyl-stickers": "die-cut",
  "stickers-color-on-white": "die-cut",
  "stickers-color-on-clear": "die-cut",
  "foil-stickers": "die-cut",
  "die-cut-stickers": "die-cut",
  "holographic-stickers": "die-cut",
  "ppe-hard-hat-stickers": "die-cut",
  "stickers-sheet-kisscut": "sheets",
  "sticker-packs": "sheets",
  "transfer-stickers": "transfer",
  "static-cling-stickers": "static-cling",
  "magnet-stickers": "magnets",
  "reflective-stickers": "die-cut",
  "stickers-roll-labels": "roll-labels",
  "custom-roll-labels": "roll-labels",
  "labels-clear": "roll-labels",
  "labels-white-bopp": "roll-labels",
  "white-bopp-labels": "roll-labels",
  "freezer-labels": "roll-labels",
  "barcode-labels": "roll-labels",
  "qr-code-labels": "roll-labels",
  "arc-flash-labels": "roll-labels",
  "asset-tags-qr-barcode": "roll-labels",
  "asset-tags-tamper-evident": "roll-labels",
  "cable-panel-labels": "roll-labels",
  "chemical-storage-labels": "roll-labels",
  "crane-lift-capacity-labels": "roll-labels",
  "electrical-panel-labels": "roll-labels",
  "hazard-ghs-labels": "roll-labels",
  "lockout-tagout-labels": "roll-labels",
  "pipe-markers-color-coded": "roll-labels",
  "pipe-markers-custom": "roll-labels",
  "rack-labels-warehouse": "roll-labels",
  "tool-box-bin-labels": "roll-labels",
  "warehouse-zone-labels": "roll-labels",
  "whmis-workplace-labels": "roll-labels",
  "transfer-vinyl-lettering": "vinyl-lettering",
  "custom-cut-vinyl-lettering-any-text": "vinyl-lettering",
  "window-decals": "decals",
  "floor-decals": "decals",
  "confined-space-warning-signs": "decals",
  "dock-door-numbers": "decals",
  "emergency-exit-egress-signs-set": "decals",
  "fire-extinguisher-location-stickers": "decals",
  "first-aid-location-stickers": "decals",
  "forklift-safety-decals": "decals",
  "high-voltage-warning-signs": "decals",
  "no-smoking-decals-set": "decals",
  "ppe-required-signs": "decals",
  "safety-notice-decal-pack": "decals",
  "slip-trip-hazard-signs": "decals",
  // Backward-compat aliases for old material IDs
  matte: "die-cut",
  "glossy-paper": "die-cut",
  clear: "die-cut",
  holographic: "die-cut",
  reflective: "die-cut",
  "white-bopp": "roll-labels",
  "clear-bopp": "roll-labels",
  "kraft-paper": "roll-labels",
  silver: "roll-labels",
};
for (const [slug, ctId] of Object.entries(_extraSlugAliases)) {
  if (!_slugToCutting.has(slug)) _slugToCutting.set(slug, ctId);
}

export function getCuttingTypeForSlug(productSlug) {
  return _slugToCutting.get(productSlug) || null;
}
