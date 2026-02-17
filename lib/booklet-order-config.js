// lib/booklet-order-config.js — Binding type definitions + reverse-lookup for /order/booklets

export const BINDINGS = [
  {
    id: "saddle-stitch",
    slug: "booklets-saddle-stitch",
    icon: "staple",
    pageRule: "multiple-of-4",
    minPages: 8,
    maxPages: 64,
  },
  {
    id: "perfect-bound",
    slug: "booklets-perfect-bound",
    icon: "spine",
    pageRule: "any",
    minPages: 24,
    maxPages: 400,
  },
  {
    id: "wire-o",
    slug: "booklets-wire-o",
    icon: "coil",
    pageRule: "any",
    minPages: 12,
    maxPages: 200,
  },
];

export const SIZES = [
  { id: "half-letter", label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
  { id: "letter", label: '8.5" × 11"', w: 8.5, h: 11 },
  { id: "6x9", label: '6" × 9"', w: 6, h: 9 },
  { id: "letter-landscape", label: '8.5" × 5.5" (横)', w: 8.5, h: 5.5 },
];

export const INTERIOR_PAPERS = [
  { id: "100lb-gloss-text", label: "100lb Gloss Text" },
  { id: "100lb-matte-text", label: "100lb Matte Text" },
  { id: "80lb-uncoated", label: "80lb Uncoated" },
  { id: "70lb-offset", label: "70lb Offset" },
];

export const COVER_PAPERS = [
  { id: "self-cover", label: null },
  { id: "100lb-gloss-cover", label: "100lb Gloss Cover" },
  { id: "14pt-c2s", label: "14pt C2S" },
  { id: "16pt-c2s", label: "16pt C2S" },
];

export const COVER_COATINGS = [
  { id: "none", label: null },
  { id: "gloss-lam", label: null },
  { id: "matte-lam", label: null },
  { id: "soft-touch", label: null },
];

export const QUANTITIES = [25, 50, 100, 250, 500, 1000];

export const PAGE_COUNTS_SADDLE = [8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64];
export const PAGE_COUNTS_GENERAL = [12, 16, 20, 24, 28, 32, 36, 40, 48, 64, 80, 100, 120, 160, 200];

// Reverse-lookup: product slug → binding id
const _slugToBinding = new Map();
for (const b of BINDINGS) {
  _slugToBinding.set(b.slug, b.id);
}
// Also the parent "booklets" slug defaults to saddle-stitch
_slugToBinding.set("booklets", "saddle-stitch");

/**
 * Given a product slug, return the booklet binding id if it matches, or null.
 */
export function getBookletBindingForSlug(productSlug) {
  return _slugToBinding.get(productSlug) || null;
}

export function getBinding(id) {
  return BINDINGS.find((b) => b.id === id) || BINDINGS[0];
}
