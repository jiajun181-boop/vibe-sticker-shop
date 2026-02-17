// lib/ncr-order-config.js — NCR form type definitions + reverse-lookup for /order/ncr

export const FORM_TYPES = [
  { id: "duplicate", parts: 2, slug: "ncr-forms-duplicate" },
  { id: "triplicate", parts: 3, slug: "ncr-forms-triplicate" },
  { id: "invoices", parts: 2, slug: "ncr-invoices" },
  { id: "invoice-books", parts: 2, slug: "ncr-invoice-books" },
];

export const SIZES = [
  { id: "half-letter", label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
  { id: "letter", label: '8.5" × 11"', w: 8.5, h: 11 },
  { id: "legal", label: '8.5" × 14"', w: 8.5, h: 14 },
  { id: "a4", label: "A4", w: 8.27, h: 11.69 },
];

export const QUANTITIES = [100, 250, 500, 1000, 2500, 5000];

// Reverse-lookup: product slug → form type id
const _slugToFormType = new Map();
for (const ft of FORM_TYPES) {
  _slugToFormType.set(ft.slug, ft.id);
}
// Parent slug
_slugToFormType.set("ncr-forms", "duplicate");

/**
 * Given a product slug, return the NCR form type id if it matches, or null.
 */
export function getNcrTypeForSlug(productSlug) {
  return _slugToFormType.get(productSlug) || null;
}

export function getFormType(id) {
  return FORM_TYPES.find((ft) => ft.id === id) || FORM_TYPES[0];
}
