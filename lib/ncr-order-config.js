// lib/ncr-order-config.js — NCR form type definitions + reverse-lookup for /order/ncr

export const FORM_TYPES = [
  { id: "2-copy", parts: 2, slug: "ncr-forms-duplicate", label: "2 Copy", colors: "White / Yellow" },
  { id: "3-copy", parts: 3, slug: "ncr-forms-triplicate", label: "3 Copy", colors: "White / Yellow / Pink" },
  { id: "4-copy", parts: 4, slug: "ncr-invoices", label: "4 Copy", colors: "White / Yellow / Pink / Gold" },
];

export const SIZES = [
  { id: "half-letter", label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
  { id: "letter", label: '8.5" × 11"', w: 8.5, h: 11 },
  { id: "legal", label: '8.5" × 14"', w: 8.5, h: 14 },
];

export const QUANTITIES = [100, 250, 500, 1000, 2500, 5000, 7500, 10000];

// Reverse-lookup: product slug → form type id
const _slugToFormType = new Map();
for (const ft of FORM_TYPES) {
  _slugToFormType.set(ft.slug, ft.id);
}
// Parent slug
_slugToFormType.set("ncr-forms", "2-copy");

/**
 * Given a product slug, return the NCR form type id if it matches, or null.
 */
export function getNcrTypeForSlug(productSlug) {
  return _slugToFormType.get(productSlug) || null;
}

export function getFormType(id) {
  return FORM_TYPES.find((ft) => ft.id === id) || FORM_TYPES[0];
}
