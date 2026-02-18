// lib/canvas-order-config.js — Canvas Print type definitions + reverse-lookup

export const CANVAS_TYPES = [
  // ── Single Canvas ──
  {
    id: "standard",
    defaultSlug: "canvas-standard",
    label: "Standard Canvas",
    barDepth: 0.75,
    panels: 1,
    materials: [
      { id: "cotton-canvas", label: "Cotton Canvas", printMode: "cmyk-pigment" },
      { id: "poly-canvas", label: "Poly-Cotton Blend", printMode: "cmyk-pigment" },
    ],
    edgeTreatments: [
      { id: "mirror", label: "Mirror Wrap" },
      { id: "white", label: "White Edge" },
      { id: "color", label: "Solid Color Edge" },
    ],
    defaultEdge: "mirror",
    frameOptions: null,
    sizes: [
      { label: '8" × 10"', w: 8, h: 10 },
      { label: '11" × 14"', w: 11, h: 14 },
      { label: '16" × 20"', w: 16, h: 20 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '30" × 40"', w: 30, h: 40 },
    ],
    minIn: 6,
    maxW: 60,
    maxH: 120,
    quantities: [1, 2, 3, 5, 10],
  },
  {
    id: "gallery-wrap",
    defaultSlug: "canvas-gallery-wrap",
    label: "Gallery Wrap",
    barDepth: 1.5,
    panels: 1,
    materials: [
      { id: "cotton-canvas", label: "Cotton Canvas", printMode: "cmyk-pigment" },
      { id: "poly-canvas", label: "Poly-Cotton Blend", printMode: "cmyk-pigment" },
    ],
    edgeTreatments: [
      { id: "image-wrap", label: "Image Wrap (extends to edges)" },
      { id: "mirror", label: "Mirror Wrap" },
      { id: "white", label: "White Edge" },
    ],
    defaultEdge: "image-wrap",
    frameOptions: null,
    sizes: [
      { label: '12" × 16"', w: 12, h: 16 },
      { label: '16" × 20"', w: 16, h: 20 },
      { label: '20" × 30"', w: 20, h: 30 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '30" × 40"', w: 30, h: 40 },
      { label: '36" × 48"', w: 36, h: 48 },
    ],
    minIn: 8,
    maxW: 60,
    maxH: 120,
    quantities: [1, 2, 3, 5, 10],
  },
  {
    id: "framed",
    defaultSlug: "canvas-framed",
    label: "Framed Canvas",
    barDepth: 1.5,
    panels: 1,
    materials: [
      { id: "cotton-canvas", label: "Cotton Canvas", printMode: "cmyk-pigment" },
      { id: "poly-canvas", label: "Poly-Cotton Blend", printMode: "cmyk-pigment" },
    ],
    edgeTreatments: [],
    defaultEdge: null,
    frameOptions: [
      { id: "black", label: "Black Frame", surcharge: 0 },
      { id: "white", label: "White Frame", surcharge: 0 },
      { id: "oak", label: "Oak Frame", surcharge: 1500 },
      { id: "walnut", label: "Walnut Frame", surcharge: 2000 },
    ],
    defaultFrame: "black",
    sizes: [
      { label: '8" × 10"', w: 8, h: 10 },
      { label: '11" × 14"', w: 11, h: 14 },
      { label: '16" × 20"', w: 16, h: 20 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '30" × 40"', w: 30, h: 40 },
    ],
    minIn: 8,
    maxW: 48,
    maxH: 60,
    quantities: [1, 2, 3, 5],
  },
  {
    id: "panoramic",
    defaultSlug: "canvas-panoramic",
    label: "Panoramic Canvas",
    barDepth: 1.5,
    panels: 1,
    materials: [
      { id: "cotton-canvas", label: "Cotton Canvas", printMode: "cmyk-pigment" },
      { id: "poly-canvas", label: "Poly-Cotton Blend", printMode: "cmyk-pigment" },
    ],
    edgeTreatments: [
      { id: "image-wrap", label: "Image Wrap" },
      { id: "mirror", label: "Mirror Wrap" },
      { id: "white", label: "White Edge" },
    ],
    defaultEdge: "image-wrap",
    frameOptions: null,
    sizes: [
      { label: '12" × 36"', w: 12, h: 36 },
      { label: '16" × 48"', w: 16, h: 48 },
      { label: '20" × 60"', w: 20, h: 60 },
    ],
    minIn: 8,
    maxW: 24,
    maxH: 120,
    quantities: [1, 2, 3, 5],
  },

  // ── Split Panel Sets ──
  {
    id: "split-2",
    defaultSlug: "canvas-split-2",
    label: "2-Panel Diptych",
    barDepth: 1.5,
    panels: 2,
    gapInches: 2,
    materials: [
      { id: "cotton-canvas", label: "Cotton Canvas", printMode: "cmyk-pigment" },
      { id: "poly-canvas", label: "Poly-Cotton Blend", printMode: "cmyk-pigment" },
    ],
    edgeTreatments: [
      { id: "image-wrap", label: "Image Wrap" },
      { id: "mirror", label: "Mirror Wrap" },
    ],
    defaultEdge: "image-wrap",
    frameOptions: null,
    sizes: [
      { label: '24" × 36" total', w: 24, h: 36 },
      { label: '32" × 48" total', w: 32, h: 48 },
      { label: '40" × 60" total', w: 40, h: 60 },
    ],
    minIn: 16,
    maxW: 60,
    maxH: 120,
    quantities: [1, 2, 3],
  },
  {
    id: "split-3",
    defaultSlug: "canvas-split-3",
    label: "3-Panel Triptych",
    barDepth: 1.5,
    panels: 3,
    gapInches: 2,
    materials: [
      { id: "cotton-canvas", label: "Cotton Canvas", printMode: "cmyk-pigment" },
      { id: "poly-canvas", label: "Poly-Cotton Blend", printMode: "cmyk-pigment" },
    ],
    edgeTreatments: [
      { id: "image-wrap", label: "Image Wrap" },
      { id: "mirror", label: "Mirror Wrap" },
    ],
    defaultEdge: "image-wrap",
    frameOptions: null,
    sizes: [
      { label: '30" × 60" total', w: 30, h: 60 },
      { label: '36" × 72" total', w: 36, h: 72 },
      { label: '40" × 80" total', w: 40, h: 80 },
    ],
    minIn: 20,
    maxW: 60,
    maxH: 120,
    quantities: [1, 2, 3],
  },
  {
    id: "split-5",
    defaultSlug: "canvas-split-5",
    label: "5-Panel Set",
    barDepth: 1.5,
    panels: 5,
    gapInches: 2,
    materials: [
      { id: "cotton-canvas", label: "Cotton Canvas", printMode: "cmyk-pigment" },
      { id: "poly-canvas", label: "Poly-Cotton Blend", printMode: "cmyk-pigment" },
    ],
    edgeTreatments: [
      { id: "image-wrap", label: "Image Wrap" },
      { id: "mirror", label: "Mirror Wrap" },
    ],
    defaultEdge: "image-wrap",
    frameOptions: null,
    sizes: [
      { label: '36" × 80" total', w: 36, h: 80 },
      { label: '40" × 100" total', w: 40, h: 100 },
      { label: '48" × 120" total', w: 48, h: 120 },
    ],
    minIn: 24,
    maxW: 60,
    maxH: 120,
    quantities: [1, 2],
  },
];

export function getCanvasType(id) {
  return CANVAS_TYPES.find((ct) => ct.id === id) || CANVAS_TYPES[0];
}

// Reverse-lookup: product slug → canvas type id
const _slugToCanvas = new Map();
for (const ct of CANVAS_TYPES) {
  _slugToCanvas.set(ct.defaultSlug, ct.id);
}

const _canvasSlugAliases = {
  "canvas-prints-standard": "standard",
  "framed-canvas-prints": "framed",
  "gallery-wrap-canvas-prints": "gallery-wrap",
  "panoramic-canvas-prints": "panoramic",
  "split-panel-canvas-prints": "split-3",
};

for (const [slug, ctId] of Object.entries(_canvasSlugAliases)) {
  if (!_slugToCanvas.has(slug)) _slugToCanvas.set(slug, ctId);
}

export function getCanvasTypeForSlug(productSlug) {
  return _slugToCanvas.get(productSlug) || null;
}
