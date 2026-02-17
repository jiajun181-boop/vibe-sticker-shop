// lib/sticker-order-config.js — Cutting type definitions for /order/stickers

export const CUTTING_TYPES = [
  {
    id: "die-cut",
    icon: "scissors",
    sizes: [
      { label: '2" × 2"', w: 2, h: 2 },
      { label: '3" × 3"', w: 3, h: 3 },
      { label: '4" × 4"', w: 4, h: 4 },
    ],
    materials: [
      { id: "white-vinyl", multiplier: 1.0 },
      { id: "matte", multiplier: 1.0 },
      { id: "clear", multiplier: 1.15 },
      { id: "holographic", multiplier: 1.35 },
    ],
    quantities: [25, 50, 100, 250, 500, 1000],
    minIn: 0.5,
    maxW: 53,
    maxH: 53,
    slugMap: {
      "white-vinyl": "die-cut-singles",
      matte: "die-cut-singles",
      clear: "clear-singles",
      holographic: "holographic-singles",
    },
  },
  {
    id: "kiss-cut",
    icon: "layers",
    sizes: [
      { label: '2" × 2"', w: 2, h: 2 },
      { label: '3" × 3"', w: 3, h: 3 },
      { label: '4" × 6"', w: 4, h: 6 },
    ],
    materials: [
      { id: "white-vinyl", multiplier: 1.0 },
      { id: "matte", multiplier: 1.0 },
      { id: "clear", multiplier: 1.15 },
    ],
    quantities: [25, 50, 100, 250, 500, 1000],
    minIn: 0.5,
    maxW: 53,
    maxH: 53,
    slugMap: {
      "white-vinyl": "removable-stickers",
      matte: "removable-stickers",
      clear: "removable-stickers",
    },
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
      { id: "white-vinyl", multiplier: 1.0 },
      { id: "matte", multiplier: 1.0 },
      { id: "glossy-paper", multiplier: 0.85 },
    ],
    quantities: [10, 25, 50, 100, 250, 500],
    minIn: 2,
    maxW: 12,
    maxH: 18,
    slugMap: {
      "white-vinyl": "sticker-sheets",
      matte: "sticker-sheets",
      "glossy-paper": "sticker-sheets",
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
      { id: "white-bopp", multiplier: 1.0 },
      { id: "clear-bopp", multiplier: 1.1 },
      { id: "kraft-paper", multiplier: 1.05 },
      { id: "silver", multiplier: 1.25 },
    ],
    quantities: [100, 250, 500, 1000, 2500, 5000],
    minIn: 0.5,
    maxW: 12,
    maxH: 18,
    slugMap: {
      "white-bopp": "roll-labels",
      "clear-bopp": "clear-labels",
      "kraft-paper": "kraft-paper-labels",
      silver: "roll-labels",
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
    maxW: 53,
    maxH: 53,
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
    maxW: 53,
    maxH: 53,
    slugMap: {
      "white-vinyl": "window-decals",
      clear: "window-decals",
      perforated: "window-decals",
      "floor-nonslip": "floor-decals",
    },
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
  "stickers-single-diecut": "die-cut",
  "stickers-die-cut-custom": "die-cut",
  "heavy-duty-vinyl-stickers": "die-cut",
  "stickers-color-on-white": "die-cut",
  "stickers-color-on-clear": "die-cut",
  "foil-stickers": "die-cut",
  "stickers-sheet-kisscut": "sheets",
  "stickers-multi-on-sheet": "sheets",
  "sticker-packs": "sheets",
  "stickers-roll-labels": "roll-labels",
  "labels-roll-quote": "roll-labels",
  "labels-clear": "roll-labels",
  "labels-white-bopp": "roll-labels",
  "freezer-labels": "roll-labels",
  "barcode-labels": "roll-labels",
  "qr-code-labels": "roll-labels",
  "transfer-vinyl-lettering": "vinyl-lettering",
  "window-decals": "decals",
  "floor-decals": "decals",
};
for (const [slug, ctId] of Object.entries(_extraSlugAliases)) {
  if (!_slugToCutting.has(slug)) _slugToCutting.set(slug, ctId);
}

export function getCuttingTypeForSlug(productSlug) {
  return _slugToCutting.get(productSlug) || null;
}
