// lib/sign-order-config.js — Signs & rigid boards type definitions + reverse-lookup

export const SIGN_TYPES = [
  {
    id: "yard-sign",
    defaultSlug: "yard-sign",
    materialGroup: "coroplast",
    materials: [
      { id: "4mm-coroplast", label: "4mm Coroplast", multiplier: 1.0 },
      { id: "6mm-coroplast", label: "6mm Coroplast", multiplier: 1.15 },
    ],
    sizes: [
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 36"', w: 24, h: 36 },
    ],
    accessories: ["h-stake", "wire-stake"],
    defaultAccessories: ["h-stake"],
    minIn: 6, maxW: 48, maxH: 48,
    quantities: [1, 5, 10, 25, 50, 100],
    doubleSided: true,
  },
  {
    id: "foam-board",
    defaultSlug: "foam-board-prints",
    materialGroup: "foam",
    materials: [
      { id: "3/16-foam", label: '3/16" Foam Board', multiplier: 1.0 },
      { id: "1/2-foam", label: '1/2" Foam Board', multiplier: 1.25 },
      { id: "gatorboard", label: "Gatorboard (Heavy-Duty)", multiplier: 1.5 },
    ],
    sizes: [
      { label: '8" × 10"', w: 8, h: 10 },
      { label: '11" × 17"', w: 11, h: 17 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 36"', w: 24, h: 36 },
    ],
    accessories: ["easel-back", "standoffs"],
    defaultAccessories: [],
    minIn: 4, maxW: 48, maxH: 96,
    quantities: [1, 2, 5, 10, 25, 50],
    doubleSided: false,
  },
  {
    id: "acrylic-sign",
    defaultSlug: "acrylic-signs",
    materialGroup: "acrylic",
    materials: [
      { id: "clear-acrylic", label: "Clear Acrylic", multiplier: 1.0 },
      { id: "frosted-acrylic", label: "Frosted Acrylic", multiplier: 1.1 },
      { id: "black-acrylic", label: "Black Acrylic", multiplier: 1.1 },
    ],
    sizes: [
      { label: '8" × 10"', w: 8, h: 10 },
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 36"', w: 24, h: 36 },
    ],
    accessories: ["standoffs", "wall-spacers"],
    defaultAccessories: ["standoffs"],
    minIn: 4, maxW: 48, maxH: 48,
    quantities: [1, 2, 5, 10, 25],
    doubleSided: false,
  },
  {
    id: "aluminum-sign",
    defaultSlug: "aluminum-signs",
    materialGroup: "metal",
    materials: [
      { id: "aluminum-040", label: '.040" Aluminum', multiplier: 1.0 },
      { id: "aluminum-063", label: '.063" Aluminum', multiplier: 1.2 },
      { id: "acm-dibond", label: "ACM / Dibond", multiplier: 1.35 },
    ],
    sizes: [
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '36" × 48"', w: 36, h: 48 },
    ],
    accessories: ["drilled-holes", "standoffs", "post-mount"],
    defaultAccessories: ["drilled-holes"],
    minIn: 6, maxW: 48, maxH: 96,
    quantities: [1, 2, 5, 10, 25],
    doubleSided: false,
  },
  {
    id: "pvc-sign",
    defaultSlug: "pvc-sintra-signs",
    materialGroup: "pvc",
    materials: [
      { id: "3mm-pvc", label: "3mm PVC / Sintra", multiplier: 1.0 },
      { id: "6mm-pvc", label: "6mm PVC / Sintra", multiplier: 1.15 },
    ],
    sizes: [
      { label: '12" × 18"', w: 12, h: 18 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 36"', w: 24, h: 36 },
    ],
    accessories: ["drilled-holes", "standoffs"],
    defaultAccessories: [],
    minIn: 6, maxW: 48, maxH: 96,
    quantities: [1, 2, 5, 10, 25, 50],
    doubleSided: false,
  },
  {
    id: "a-frame",
    defaultSlug: "a-frame-sandwich-board",
    materialGroup: "coroplast",
    materials: [
      { id: "4mm-coroplast", label: "4mm Coroplast Insert", multiplier: 1.0 },
      { id: "aluminum-panel", label: "Aluminum Panel", multiplier: 1.5 },
    ],
    sizes: [
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '24" × 48"', w: 24, h: 48 },
    ],
    accessories: ["a-frame-stand"],
    defaultAccessories: ["a-frame-stand"],
    minIn: 18, maxW: 30, maxH: 48,
    quantities: [1, 2, 5, 10],
    doubleSided: true,
    includesHardware: true,
  },
  {
    id: "real-estate",
    defaultSlug: "real-estate-sign",
    materialGroup: "coroplast",
    materials: [
      { id: "4mm-coroplast", label: "4mm Coroplast", multiplier: 1.0 },
      { id: "aluminum-040", label: ".040 Aluminum", multiplier: 1.5 },
    ],
    sizes: [
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 18"', w: 24, h: 18 },
      { label: '24" × 36"', w: 24, h: 36 },
    ],
    accessories: ["h-stake", "real-estate-frame", "rider-clips"],
    defaultAccessories: [],
    minIn: 12, maxW: 36, maxH: 48,
    quantities: [1, 5, 10, 25, 50, 100],
    doubleSided: true,
  },
  {
    id: "event-board",
    defaultSlug: "photo-board",
    materialGroup: "foam",
    materials: [
      { id: "3/16-foam", label: '3/16" Foam Board', multiplier: 1.0 },
      { id: "gatorboard", label: "Gatorboard", multiplier: 1.5 },
    ],
    sizes: [
      { label: '16" × 20"', w: 16, h: 20 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '30" × 40"', w: 30, h: 40 },
    ],
    accessories: ["easel-back"],
    defaultAccessories: ["easel-back"],
    minIn: 8, maxW: 48, maxH: 96,
    quantities: [1, 2, 5, 10, 25],
    doubleSided: false,
  },
];

export const ACCESSORY_OPTIONS = {
  "h-stake": { label: "H-Stakes", surcharge: 150 },          // cents/unit
  "wire-stake": { label: "Wire Stakes", surcharge: 100 },
  "a-frame-stand": { label: "A-Frame Stand", surcharge: 0 },  // included
  "easel-back": { label: "Easel Back", surcharge: 75 },
  standoffs: { label: "Standoff Mounts", surcharge: 400 },
  "wall-spacers": { label: "Wall Spacers", surcharge: 200 },
  "drilled-holes": { label: "Pre-Drilled Holes", surcharge: 0 },
  "post-mount": { label: "Post-Mount Holes", surcharge: 0 },
  "real-estate-frame": { label: "Metal Frame", surcharge: 1200 },
  "rider-clips": { label: "Rider Sign Clips", surcharge: 150 },
};

export function getSignType(id) {
  return SIGN_TYPES.find((st) => st.id === id) || SIGN_TYPES[0];
}

// Reverse-lookup
const _slugToSign = new Map();
for (const st of SIGN_TYPES) {
  _slugToSign.set(st.defaultSlug, st.id);
}

const _signSlugAliases = {
  "yard-sign-h-frame": "yard-sign",
  "yard-sign-panel-only": "yard-sign",
  "yard-signs-coroplast": "yard-sign",
  "coroplast-yard-signs": "yard-sign",
  "coroplast-signs": "yard-sign",
  "lawn-signs-h-stake": "yard-sign",
  "double-sided-lawn-signs": "yard-sign",
  "election-campaign-sign": "yard-sign",
  "foam-board": "foam-board",
  "custom-foam-board": "foam-board",
  "rigid-foam-board-prints": "foam-board",
  "foam-board-easel": "foam-board",
  "gatorboard-signs": "foam-board",
  "tri-fold-presentation-board": "foam-board",
  "clear-acrylic-signs": "acrylic-sign",
  "frosted-acrylic-signs": "acrylic-sign",
  "standoff-mounted-signs": "acrylic-sign",
  "ada-braille-signs": "acrylic-sign",
  "aluminum-composite": "aluminum-sign",
  "acm-dibond-signs": "aluminum-sign",
  "safety-signs": "aluminum-sign",
  "parking-property-signs": "aluminum-sign",
  "construction-site-signs": "aluminum-sign",
  "wayfinding-signs": "aluminum-sign",
  "directional-arrow-sign": "aluminum-sign",
  "directional-arrow-signs": "aluminum-sign",
  "business-hours-sign": "aluminum-sign",
  "address-house-number-signs": "aluminum-sign",
  "qr-code-signs": "aluminum-sign",
  "a-frame-double-sided": "a-frame",
  "a-frame-insert-prints": "a-frame",
  "a-frame-sign-stand": "a-frame",
  "a-frame-stand": "a-frame",
  "real-estate-agent-sign": "real-estate",
  "real-estate-frame": "real-estate",
  "real-estate-riders": "real-estate",
  "open-house-sign-kit": "real-estate",
  "event-celebration-board": "event-board",
  "event-photo-backdrop": "event-board",
  "backdrop-board": "event-board",
  "welcome-sign-board": "event-board",
  "seating-chart-board": "event-board",
  "memorial-tribute-board": "event-board",
  "photo-collage-board": "event-board",
  "selfie-frame-board": "event-board",
  "face-in-hole-board": "event-board",
  "handheld-prop-board": "event-board",
  "handheld-sign": "event-board",
  "handheld-signs": "event-board",
  "life-size-cutout": "event-board",
  "giant-presentation-check": "event-board",
  "floor-standup-display": "event-board",
  "menu-boards": "foam-board",
  "rigid-tabletop-signs": "foam-board",
  "tabletop-signs": "foam-board",
  "table-easel-display": "foam-board",
  "dry-erase-rigid-board": "foam-board",
  "tags-tickets-rigid": "foam-board",
};

for (const [slug, stId] of Object.entries(_signSlugAliases)) {
  if (!_slugToSign.has(slug)) _slugToSign.set(slug, stId);
}

export function getSignTypeForSlug(productSlug) {
  return _slugToSign.get(productSlug) || null;
}
