// lib/industrial-label-order-config.js — Industrial & Asset Label configuration
// Extracted from IndustrialLabelOrderClient for reuse and testability.

export const TYPES = [
  { id: "asset-tag", icon: "asset" },
  { id: "pipe-marker", icon: "pipe" },
  { id: "warehouse", icon: "warehouse" },
  { id: "cable", icon: "cable" },
];

export const SIZES_BY_TYPE = {
  "asset-tag": [
    { id: "1.5x3", label: '1.5" \u00d7 3"', w: 1.5, h: 3 },
    { id: "2x4", label: '2" \u00d7 4"', w: 2, h: 4 },
    { id: "3x5", label: '3" \u00d7 5"', w: 3, h: 5 },
  ],
  "pipe-marker": [
    { id: "1x8", label: '1" \u00d7 8"', w: 1, h: 8 },
    { id: "2x8", label: '2" \u00d7 8"', w: 2, h: 8 },
    { id: "4x24", label: '4" \u00d7 24"', w: 4, h: 24 },
  ],
  "warehouse": [
    { id: "2x4", label: '2" \u00d7 4"', w: 2, h: 4 },
    { id: "3x5", label: '3" \u00d7 5"', w: 3, h: 5 },
    { id: "4x6", label: '4" \u00d7 6"', w: 4, h: 6 },
  ],
  "cable": [
    { id: "0.5x1.5", label: '0.5" \u00d7 1.5"', w: 0.5, h: 1.5 },
    { id: "0.75x2", label: '0.75" \u00d7 2"', w: 0.75, h: 2 },
    { id: "1x3", label: '1" \u00d7 3"', w: 1, h: 3 },
  ],
};

export const DEFAULT_SIZE_IDX = {
  "asset-tag": 1,
  "pipe-marker": 1,
  "warehouse": 0,
  "cable": 1,
};

export const MATERIALS = [
  { id: "vinyl", surcharge: 0 },
  { id: "polyester", surcharge: 5 },
  { id: "aluminum-foil", surcharge: 12 },
];

export const LAMINATIONS = [
  { id: "gloss-lam", surcharge: 0 },
  { id: "matte-lam", surcharge: 2 },
  { id: "extra-durable", surcharge: 6 },
];

export const QUANTITIES = [25, 50, 100, 250, 500, 1000];

// Type → specific product slug for pricing API and cart.
// Each maps to a real product in the facility-asset-labels DB category.
export const SLUG_MAP = {
  "asset-tag": "asset-tags-tamper-evident",
  "pipe-marker": "pipe-markers-color-coded",
  "warehouse": "rack-labels-warehouse",
  "cable": "electrical-panel-labels",
};
