// lib/vehicle-order-config.js — Vehicle graphics & fleet type definitions + reverse-lookup

export const VEHICLE_TYPES = [
  {
    id: "full-wrap",
    defaultSlug: "full-vehicle-wrap-design-print",
    quoteOnly: true, // no instant pricing, show "Request Quote"
    vehicleTypes: ["car", "suv", "van", "pickup", "box-truck", "trailer"],
    materials: [
      { id: "cast-vinyl", label: "3M Cast Vinyl", multiplier: 1.0 },
      { id: "avery-cast", label: "Avery Cast Vinyl", multiplier: 1.0 },
    ],
    sizes: [],
    minIn: 0, maxW: 0, maxH: 0,
    quantities: [1],
    hasDimensions: false,
  },
  {
    id: "partial-wrap",
    defaultSlug: "partial-wrap-spot-graphics",
    quoteOnly: false,
    vehicleTypes: ["car", "suv", "van", "pickup", "box-truck"],
    materials: [
      { id: "cast-vinyl", label: "3M Cast Vinyl", multiplier: 1.0 },
      { id: "calendered", label: "Calendered Vinyl", multiplier: 0.8 },
    ],
    sizes: [
      { label: "Quarter Panel", w: 24, h: 24 },
      { label: "Half Side", w: 72, h: 36 },
      { label: "Full Side", w: 144, h: 48 },
    ],
    minIn: 12, maxW: 240, maxH: 96,
    quantities: [1, 2, 5],
    hasDimensions: true,
  },
  {
    id: "door-graphics",
    defaultSlug: "printed-truck-door-decals-full-color",
    quoteOnly: false,
    vehicleTypes: ["car", "van", "pickup", "box-truck"],
    materials: [
      { id: "cast-vinyl", label: "Cast Vinyl (3+ years)", multiplier: 1.0 },
      { id: "calendered", label: "Calendered Vinyl (1-3 years)", multiplier: 0.8 },
    ],
    sizes: [
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 24"', w: 24, h: 24 },
    ],
    minIn: 6, maxW: 48, maxH: 48,
    quantities: [1, 2, 4, 10, 25],
    hasDimensions: true,
  },
  {
    id: "vehicle-decal",
    defaultSlug: "long-term-outdoor-vehicle-decals",
    quoteOnly: false,
    vehicleTypes: [],
    materials: [
      { id: "cast-vinyl", label: "Cast Vinyl", multiplier: 1.0 },
      { id: "reflective", label: "Reflective Vinyl", multiplier: 1.4 },
    ],
    sizes: [
      { label: '6" × 6"', w: 6, h: 6 },
      { label: '12" × 12"', w: 12, h: 12 },
      { label: '24" × 12"', w: 24, h: 12 },
    ],
    minIn: 2, maxW: 96, maxH: 48,
    quantities: [1, 2, 5, 10, 25, 50],
    hasDimensions: true,
  },
  {
    id: "magnetic-sign",
    defaultSlug: "magnetic-car-signs",
    quoteOnly: false,
    vehicleTypes: [],
    materials: [
      { id: "magnetic-30mil", label: "30mil Magnetic", multiplier: 1.0 },
    ],
    sizes: [
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '12" × 24"', w: 12, h: 24 },
      { label: '18" × 24"', w: 18, h: 24 },
    ],
    minIn: 6, maxW: 24, maxH: 36,
    quantities: [1, 2, 4, 10, 25],
    hasDimensions: true,
  },
  {
    id: "fleet-package",
    defaultSlug: "fleet-graphic-package",
    quoteOnly: true,
    vehicleTypes: ["car", "suv", "van", "pickup", "box-truck", "trailer"],
    materials: [
      { id: "cast-vinyl", label: "3M Cast Vinyl", multiplier: 1.0 },
    ],
    sizes: [],
    minIn: 0, maxW: 0, maxH: 0,
    quantities: [1, 5, 10, 25, 50],
    hasDimensions: false,
  },
  {
    id: "dot-numbers",
    defaultSlug: "usdot-number-decals",
    quoteOnly: false,
    vehicleTypes: [],
    materials: [
      { id: "outdoor-vinyl", label: "Outdoor Vinyl", multiplier: 1.0 },
      { id: "reflective", label: "Reflective Vinyl", multiplier: 1.4 },
    ],
    sizes: [
      { label: '2" height', w: 24, h: 2 },
      { label: '3" height', w: 36, h: 3 },
      { label: '4" height', w: 48, h: 4 },
    ],
    minIn: 1, maxW: 96, maxH: 12,
    quantities: [1, 2, 4, 10, 25],
    hasDimensions: false,
    hasTextInput: true,
  },
  {
    id: "compliance",
    defaultSlug: "truck-door-compliance-kit",
    quoteOnly: false,
    vehicleTypes: [],
    materials: [
      { id: "outdoor-vinyl", label: "Outdoor Vinyl", multiplier: 1.0 },
      { id: "reflective", label: "Reflective Vinyl", multiplier: 1.4 },
    ],
    sizes: [
      { label: "Standard Kit", w: 24, h: 12 },
    ],
    minIn: 6, maxW: 48, maxH: 24,
    quantities: [1, 2, 5, 10, 25],
    hasDimensions: false,
    hasTextInput: true,
  },
];

export const VEHICLE_TYPE_OPTIONS = [
  { id: "car", label: "Car / Sedan" },
  { id: "suv", label: "SUV / Crossover" },
  { id: "van", label: "Van / Cargo Van" },
  { id: "pickup", label: "Pickup Truck" },
  { id: "box-truck", label: "Box Truck" },
  { id: "trailer", label: "53ft Trailer" },
];

export function getVehicleType(id) {
  return VEHICLE_TYPES.find((vt) => vt.id === id) || VEHICLE_TYPES[0];
}

// Reverse-lookup
const _slugToVehicle = new Map();
for (const vt of VEHICLE_TYPES) {
  _slugToVehicle.set(vt.defaultSlug, vt.id);
}

const _vehicleSlugAliases = {
  "vehicle-wrap-print-only-quote": "full-wrap",
  "vehicle-roof-wrap": "partial-wrap",
  "car-hood-decal": "partial-wrap",
  "truck-side-panel-printed-decal": "partial-wrap",
  "tailgate-rear-door-printed-decal": "partial-wrap",
  "trailer-box-truck-large-graphics": "partial-wrap",
  "trailer-full-wrap": "full-wrap",
  "custom-truck-door-lettering-kit": "door-graphics",
  "custom-printed-vehicle-logo-decals": "door-graphics",
  "car-graphics": "door-graphics",
  "bumper-sticker-custom": "vehicle-decal",
  "removable-promo-vehicle-decals": "vehicle-decal",
  "social-qr-vehicle-decals": "vehicle-decal",
  "boat-lettering-registration": "vehicle-decal",
  "custom-cut-vinyl-lettering-any-text": "vehicle-decal",
  "car-door-magnets-pair": "magnetic-sign",
  "magnetic-truck-door-signs": "magnetic-sign",
  "magnetic-rooftop-sign": "magnetic-sign",
  "magnets-flexible": "magnetic-sign",
  "cvor-number-decals": "dot-numbers",
  "mc-number-decals": "dot-numbers",
  "nsc-number-decals": "dot-numbers",
  "tssa-truck-number-lettering-cut-vinyl": "dot-numbers",
  "gvw-tare-weight-lettering": "dot-numbers",
  "trailer-id-number-decals": "dot-numbers",
  "fleet-unit-number-stickers": "dot-numbers",
  "dangerous-goods-placards": "compliance",
  "reflective-conspicuity-tape-kit": "compliance",
  "reflective-safety-stripes-kit": "compliance",
  "high-visibility-rear-chevron-kit": "compliance",
  "stay-back-warning-decals": "compliance",
  "tire-pressure-load-labels": "compliance",
  "fuel-type-labels-diesel-gas": "compliance",
  "vehicle-inspection-maintenance-stickers": "compliance",
  "equipment-id-decals-cut-vinyl": "compliance",
  "ifta-cab-card-holder": "compliance",
  "hours-of-service-log-holder": "compliance",
  "fleet-vehicle-inspection-book": "compliance",
};

for (const [slug, vtId] of Object.entries(_vehicleSlugAliases)) {
  if (!_slugToVehicle.has(slug)) _slugToVehicle.set(slug, vtId);
}

export function getVehicleTypeForSlug(productSlug) {
  return _slugToVehicle.get(productSlug) || null;
}
