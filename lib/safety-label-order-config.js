// lib/safety-label-order-config.js — Safety & Compliance Label configuration
// Extracted from SafetyLabelOrderClient for reuse and testability.

export const CATEGORIES = [
  { id: "fire-emergency" },
  { id: "hazard-warning" },
  { id: "ppe-equipment" },
  { id: "electrical-chemical" },
];

export const SIZES = [
  { id: "2x3", label: '2" \u00d7 3"', w: 2, h: 3 },
  { id: "3x5", label: '3" \u00d7 5"', w: 3, h: 5 },
  { id: "4x6", label: '4" \u00d7 6"', w: 4, h: 6 },
  { id: "7x10", label: '7" \u00d7 10"', w: 7, h: 10 },
];

export const MATERIALS = [
  { id: "vinyl", surcharge: 0 },
  { id: "polyester", surcharge: 5 },
  { id: "reflective", surcharge: 12 },
];

export const ADHESIVES = [
  { id: "permanent", surcharge: 0 },
  { id: "removable", surcharge: 3 },
];

export const QUANTITIES = [10, 25, 50, 100, 250, 500];

// Category → specific product slug for pricing API and cart.
// Each maps to a real product in the safety-warning-decals DB category.
export const SLUG_MAP = {
  "fire-emergency": "confined-space-warning-signs",
  "hazard-warning": "slip-trip-hazard-signs",
  "ppe-equipment": "ppe-required-signs",
  "electrical-chemical": "high-voltage-warning-signs",
};
