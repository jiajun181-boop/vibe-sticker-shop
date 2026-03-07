// lib/stamp-order-config.js — Stamp product configuration
// Size labels MUST match marketing-print-order-config.js for pricing API compatibility.

export const STAMP_MODELS = [
  { id: "s510", label: 'S-510 (1.5" × 0.5")',    w: 1.5,   h: 0.5,    shape: "rect",  slug: "stamps-s510" },
  { id: "s520", label: 'S-520 (1.875" × 0.75")',  w: 1.875, h: 0.75,   shape: "rect",  slug: "stamps-s520" },
  { id: "s542", label: 'S-542 (2.375" × 1.125")', w: 2.375, h: 1.125,  shape: "rect",  slug: "stamps-s542" },
  { id: "s827", label: 'S-827 (2.0" × 1.1875")',  w: 2.0,   h: 1.1875, shape: "rect",  slug: "stamps-s827" },
  { id: "r512", label: 'R-512 (0.5" Round)',       w: 0.5,   h: 0.5,    shape: "round", slug: "stamps-r512" },
  { id: "r524", label: 'R-524 (1" Round)',          w: 1,     h: 1,      shape: "round", slug: "stamps-r524" },
  { id: "r532", label: 'R-532 (1.25" Round)',       w: 1.25,  h: 1.25,   shape: "round", slug: "stamps-r532" },
  { id: "r552", label: 'R-552 (1.625" Round)',       w: 1.625, h: 1.625,  shape: "round", slug: "stamps-r552" },
];

export const STAMP_QUANTITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Slug matcher for configurator-router
const STAMP_SLUGS = new Set([
  "stamps", "stamps-self-inking", "self-inking-stamps",
  ...STAMP_MODELS.map((m) => m.slug),
]);

export function isStampSlug(slug) {
  return STAMP_SLUGS.has(slug);
}
