/**
 * Sub-product configuration.
 *
 * Each top-level key is a "parent" concept slug (shown as a sub-product landing).
 * `dbSlugs` lists the actual DB product slugs that belong to this group.
 * `category` is the DB category these products live in.
 *
 * The category landing page groups products by these parents.
 * The [product] page checks getSubProducts() to render either a
 * SubProductLandingClient (card grid) or ProductClient (configurator).
 */

export const SUB_PRODUCT_CONFIG = {
  /* ─── business-cards (own category) ────────────────────────── */
  "business-cards": {
    category: "business-cards",
    slugPrefix: "business-cards-",
    dbSlugs: [
      "business-cards-classic", "business-cards-gloss", "business-cards-matte",
      "business-cards-soft-touch", "business-cards-gold-foil", "business-cards-linen",
      "business-cards-pearl", "business-cards-thick",
    ],
  },

  /* ─── stamps (own category) ────────────────────────────────── */
  stamps: {
    category: "stamps",
    slugPrefix: "stamps-",
    dbSlugs: [
      "stamps-s827", "stamps-s510", "stamps-s520", "stamps-s542",
      "stamps-r512", "stamps-r524", "stamps-r532", "stamps-r552",
    ],
  },

  /* ─── marketing-prints sub-groups ──────────────────────────── */
  flyers: {
    category: "marketing-prints",
    slugPrefix: "flyers-",
    dbSlugs: ["flyers-small", "flyers-standard", "flyers-large"],
  },
  postcards: {
    category: "marketing-prints",
    slugPrefix: "postcards-",
    dbSlugs: ["postcards-standard", "postcards-medium", "postcards-large", "postcards-eddm"],
  },
  brochures: {
    category: "marketing-prints",
    slugPrefix: "brochures-",
    dbSlugs: ["brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold"],
  },
  booklets: {
    category: "marketing-prints",
    slugPrefix: "booklets-",
    dbSlugs: ["booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o"],
  },
  menus: {
    category: "marketing-prints",
    slugPrefix: "menus-",
    dbSlugs: ["menus-flat", "menus-folded", "menus-laminated", "menus-takeout"],
  },
  envelopes: {
    category: "marketing-prints",
    slugPrefix: "envelopes-",
    dbSlugs: ["envelopes-10-business", "envelopes-a7-invitation", "envelopes-6x9-catalog", "envelopes-9x12-catalog"],
  },
  "presentation-folders": {
    category: "marketing-prints",
    slugPrefix: "presentation-folders-",
    dbSlugs: ["presentation-folders-standard", "presentation-folders-reinforced", "presentation-folders-legal", "presentation-folders-die-cut"],
  },
  posters: {
    category: "marketing-prints",
    slugPrefix: "posters-",
    dbSlugs: ["posters-glossy", "posters-matte", "posters-adhesive", "posters-backlit"],
  },
  "rack-cards": {
    category: "marketing-prints",
    slugPrefix: "rack-cards-",
    dbSlugs: ["rack-cards-standard", "rack-cards-tear-off", "rack-cards-folded"],
  },
  "door-hangers": {
    category: "marketing-prints",
    slugPrefix: "door-hangers-",
    dbSlugs: ["door-hangers-standard", "door-hangers-large", "door-hangers-perforated"],
  },

  /* ─── stickers-labels sub-groups ─────────────────────────────── */
  "sticker-pages": {
    category: "stickers-labels",
    slugPrefix: "sticker-",
    dbSlugs: [
      "sticker-sheets", "kiss-cut-sticker-sheets", "stickers-sheet-kisscut",
      "stickers-multi-on-sheet", "sticker-packs",
    ],
  },
  "die-cut-stickers": {
    category: "stickers-labels",
    slugPrefix: "die-cut-",
    dbSlugs: [
      "die-cut-singles", "die-cut-stickers", "stickers-single-diecut",
      "holographic-singles", "holographic-stickers", "foil-stickers",
      "clear-singles", "heavy-duty-vinyl-stickers",
      "stickers-color-on-white", "stickers-color-on-clear",
    ],
  },
  "kiss-cut-singles": {
    category: "stickers-labels",
    slugPrefix: "kiss-cut-",
    dbSlugs: ["removable-stickers"],
  },
  "sticker-rolls": {
    category: "stickers-labels",
    slugPrefix: "roll-",
    dbSlugs: [
      "roll-labels", "labels-roll-quote", "clear-labels", "labels-clear",
      "white-bopp-labels", "labels-white-bopp", "kraft-paper-labels",
      "freezer-labels", "barcode-labels", "qr-code-labels",
    ],
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

/**
 * Get all sub-product groups belonging to a specific category.
 * Returns an array of [parentSlug, config] pairs.
 */
export function getSubProductsForCategory(category) {
  return Object.entries(SUB_PRODUCT_CONFIG).filter(
    ([, cfg]) => cfg.category === category
  );
}
