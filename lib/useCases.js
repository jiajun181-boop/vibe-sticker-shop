// lib/useCases.js
// Use-case quick-entry configuration. Parallel to industryTags — additive, not replacing.

export const USE_CASES = [
  { slug: "gifting", icon: "\u{1F381}" },
  { slug: "wedding", icon: "\u{1F48D}" },
  { slug: "corporate", icon: "\u{1F3E2}" },
  { slug: "campus", icon: "\u{1F393}" },
  { slug: "events", icon: "\u{1F3EA}" },
];

export const USE_CASE_SLUGS = USE_CASES.map((u) => u.slug);

// Map use-case slug → product slugs to surface.
// Slugs must match active products in the database.
export const USE_CASE_META = {
  gifting: { relatedIndustries: ["retail", "event"] },
  wedding: { relatedIndustries: ["event", "beauty"] },
  corporate: { relatedIndustries: ["finance", "real-estate", "construction"] },
  campus: { relatedIndustries: ["education"] },
  events: { relatedIndustries: ["event", "fitness", "beauty"] },
};

export const USE_CASE_PRODUCTS = {
  gifting: [
    "stickers-single-diecut",
    "stickers-sheet-kisscut",
    "labels-clear",
    "postcards",
    "greeting-cards",
    "tags-hang-tags",
    "bookmarks",
    "stickers-color-on-white",
    "stickers-color-on-clear",
  ],
  wedding: [
    "invitation-cards",
    "greeting-cards",
    "envelopes",
    "mp-menus",
    "tags-hang-tags",
    "stickers-single-diecut",
    "postcards",
    "bookmarks",
    "certificates",
  ],
  corporate: [
    "flyers",
    "brochures",
    "postcards",
    "rack-cards",
    "mp-presentation-folders",
    "mp-letterhead",
    "envelopes",
    "ncr-invoices",
    "vinyl-banners",
  ],
  campus: [
    "stickers-single-diecut",
    "stickers-sheet-kisscut",
    "flyers",
    "postcards",
    "bookmarks",
    "posters",
    "vinyl-banners",
    "coroplast-signs",
  ],
  events: [
    "vinyl-banners",
    "mesh-banners",
    "feather-flags",
    "teardrop-flags",
    "mp-tickets",
    "flyers",
    "postcards",
    "posters",
    "pull-up-banner",
    "x-banner-prints",
  ],
};
