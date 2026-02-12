/**
 * Sub-product configuration for the 10 marketing-prints product categories.
 *
 * Each top-level key is a "parent" concept (shown on the landing page).
 * `subs` lists the actual DB product slugs that belong to this group.
 *
 * The landing page fetches these products from DB and renders them as cards.
 * Clicking a card navigates to the standard product page.
 */

export const SUB_PRODUCT_CONFIG = {
  /* ───────────────────── 1. Flyers ───────────────────── */
  flyers: {
    slugPrefix: "flyers-",
    dbSlugs: ["flyers-small", "flyers-standard", "flyers-large"],
  },

  /* ───────────────────── 2. Postcards ────────────────── */
  postcards: {
    slugPrefix: "postcards-",
    dbSlugs: ["postcards-standard", "postcards-medium", "postcards-large", "postcards-eddm"],
  },

  /* ───────────────────── 3. Brochures ────────────────── */
  brochures: {
    slugPrefix: "brochures-",
    dbSlugs: ["brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold"],
  },

  /* ───────────────────── 4. Posters ──────────────────── */
  posters: {
    slugPrefix: "posters-",
    dbSlugs: ["posters-glossy", "posters-matte", "posters-adhesive", "posters-backlit"],
  },

  /* ───────────────────── 5. Booklets ─────────────────── */
  booklets: {
    slugPrefix: "booklets-",
    dbSlugs: ["booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o"],
  },

  /* ───────────────────── 6. Menus ────────────────────── */
  menus: {
    slugPrefix: "menus-",
    dbSlugs: ["menus-flat", "menus-folded", "menus-laminated", "menus-takeout"],
  },

  /* ───────────────────── 7. Envelopes ────────────────── */
  envelopes: {
    slugPrefix: "envelopes-",
    dbSlugs: ["envelopes-10-business", "envelopes-a7-invitation", "envelopes-6x9-catalog", "envelopes-9x12-catalog"],
  },

  /* ───────────────────── 8. Rack Cards ───────────────── */
  "rack-cards": {
    slugPrefix: "rack-cards-",
    dbSlugs: ["rack-cards-standard", "rack-cards-tear-off", "rack-cards-folded"],
  },

  /* ───────────────────── 9. Door Hangers ─────────────── */
  "door-hangers": {
    slugPrefix: "door-hangers-",
    dbSlugs: ["door-hangers-standard", "door-hangers-large", "door-hangers-perforated"],
  },

  /* ───────────────────── 10. Presentation Folders ────── */
  "presentation-folders": {
    slugPrefix: "presentation-folders-",
    dbSlugs: ["presentation-folders-standard", "presentation-folders-reinforced", "presentation-folders-legal", "presentation-folders-die-cut"],
  },
};

/**
 * Look up sub-product config for a parent slug.
 * Returns null when the slug has no sub-product split.
 */
export function getSubProducts(parentSlug) {
  return SUB_PRODUCT_CONFIG[parentSlug] ?? null;
}

/**
 * All parent slugs that have sub-product pages.
 */
export const SUB_PRODUCT_PARENTS = Object.keys(SUB_PRODUCT_CONFIG);

/** Set of all leaf sub-product slugs for fast lookup. */
const ALL_SUB_SLUGS = new Set(
  Object.values(SUB_PRODUCT_CONFIG).flatMap((cfg) => cfg.dbSlugs)
);

/**
 * Returns true if the slug is a leaf sub-product (e.g. "postcards-standard").
 */
export function isSubProduct(slug) {
  return ALL_SUB_SLUGS.has(slug);
}
