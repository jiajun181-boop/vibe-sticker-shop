/**
 * Sub-product configuration.
 * Parent slug -> child db slugs.
 */

export const SUB_PRODUCT_CONFIG = {
  // marketing-prints groups
  "business-cards": {
    category: "marketing-business-print",
    slugPrefix: "business-cards-",
    dbSlugs: [
      "business-cards",
      "business-cards-classic",
      "business-cards-gloss",
      "business-cards-matte",
      "business-cards-soft-touch",
      "business-cards-gold-foil",
      "business-cards-linen",
      "business-cards-pearl",
      "business-cards-thick",
      "magnets-business-card",
    ],
  },
  "ncr-forms": {
    category: "marketing-business-print",
    slugPrefix: "ncr-",
    dbSlugs: [
      "ncr-forms-duplicate",
      "ncr-forms-triplicate",
      "ncr-invoices",
    ],
  },
  "door-hangers": {
    category: "marketing-business-print",
    slugPrefix: "door-hangers-",
    dbSlugs: ["door-hangers-standard", "door-hangers-perforated", "door-hangers-large"],
  },
  brochures: {
    category: "marketing-business-print",
    slugPrefix: "brochures-",
    dbSlugs: ["brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold"],
  },
  booklets: {
    category: "marketing-business-print",
    slugPrefix: "booklets-",
    dbSlugs: ["booklets", "booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o", "catalog-booklets"],
  },
  posters: {
    category: "marketing-business-print",
    slugPrefix: "posters-",
    dbSlugs: ["posters", "posters-glossy", "posters-matte", "posters-adhesive", "posters-backlit"],
  },
  menus: {
    category: "marketing-business-print",
    slugPrefix: "menus-",
    dbSlugs: ["menus-laminated", "menus-takeout", "table-mat"],
  },
  letterhead: {
    category: "marketing-business-print",
    slugPrefix: "letterhead-",
    dbSlugs: [
      "letterhead",
      "letterhead-standard",
    ],
  },
  envelopes: {
    category: "marketing-business-print",
    slugPrefix: "envelopes-",
    dbSlugs: [
      "envelopes",
      "envelopes-standard",
      "envelopes-10-business",
      "envelopes-a7-invitation",
      "envelopes-6x9-catalog",
      "envelopes-9x12-catalog",
    ],
  },
  notepads: {
    category: "marketing-business-print",
    slugPrefix: "notepads-",
    dbSlugs: [
      "notepads",
      "notepads-custom",
    ],
  },
  bookmarks: {
    category: "marketing-business-print",
    slugPrefix: "bookmarks-",
    dbSlugs: [
      "bookmarks",
      "bookmarks-custom",
    ],
  },
  calendars: {
    category: "marketing-business-print",
    slugPrefix: "calendars-",
    dbSlugs: ["calendars-wall", "calendars-wall-desk", "calendars-desk"],
  },
  stamps: {
    category: "marketing-business-print",
    slugPrefix: "stamps-",
    dbSlugs: [
      "self-inking-stamps",
      "stamps-s827",
      "stamps-s510",
      "stamps-s520",
      "stamps-s542",
      "stamps-r512",
      "stamps-r524",
      "stamps-r532",
      "stamps-r552",
      "funny-approval-stamp",
      "custom-face-stamp",
      "book-name-stamp",
    ],
    groups: [
      {
        id: "office",
        label: "Office & Business Stamps",
        slugs: ["self-inking-stamps", "stamps-s827", "stamps-s510", "stamps-s520", "stamps-s542", "stamps-r512", "stamps-r524", "stamps-r532", "stamps-r552"],
      },
      {
        id: "personalized",
        label: "Personalized & Fun Stamps",
        slugs: ["funny-approval-stamp", "custom-face-stamp", "book-name-stamp"],
      },
    ],
  },
  "greeting-invitation-cards": {
    category: "marketing-business-print",
    slugPrefix: "cards-",
    dbSlugs: [
      "greeting-cards",
      "invitation-cards",
      "invitations-flat",
    ],
  },

  // custom-stickers groups — replaced by variant pages (stickers, labels, decals)

  // large-format-graphics groups
  "wall-graphics": {
    category: "windows-walls-floors",
    slugPrefix: "wall-",
    dbSlugs: ["wall-mural-graphic", "wall-murals", "wall-graphics", "wall-decals", "decals-wall"],
  },
  "floor-graphics": {
    category: "windows-walls-floors",
    slugPrefix: "floor-",
    dbSlugs: ["floor-graphics", "warehouse-floor-graphics", "warehouse-floor-safety-graphics", "floor-arrows", "floor-number-markers", "floor-decals", "floor-direction-arrows-set", "floor-logo-graphic", "floor-number-markers-set", "decals-floor"],
  },
  "decals": {
    category: "windows-walls-floors",
    slugPrefix: "decal-",
    dbSlugs: ["decals", "custom-decals", "vinyl-decals"],
  },
  "window-graphics": {
    category: "windows-walls-floors",
    slugPrefix: "window-",
    dbSlugs: [
      "window-graphics",
      "window-perforated",
      "window-frosted",
      "window-graphics-blockout",
      "window-graphics-double-sided",
      "window-graphics-standard",
      "frosted-window-graphics",
      "decals-window",
      "window-decals",
      "window-graphics-transparent-color",
    ],
  },

  // stickers-labels groups
  "sticker-sheets": {
    category: "stickers-labels-decals",
    slugPrefix: "sticker-",
    dbSlugs: ["sticker-sheets"],
  },
  "kiss-cut-sticker-sheets": {
    category: "stickers-labels-decals",
    slugPrefix: "sticker-",
    dbSlugs: ["kiss-cut-sticker-sheets"],
  },
  "die-cut-stickers": {
    category: "stickers-labels-decals",
    slugPrefix: "die-cut-",
    dbSlugs: ["die-cut-stickers", "stickers-die-cut-custom"],
  },
  "kiss-cut-stickers": {
    category: "stickers-labels-decals",
    slugPrefix: "kiss-cut-",
    dbSlugs: ["kiss-cut-stickers"],
  },
  "roll-labels": {
    category: "stickers-labels-decals",
    slugPrefix: "roll-",
    dbSlugs: ["roll-labels", "stickers-roll-labels"],
  },
  // vinyl-lettering is a core product (not a sub-group) — routed via configurator-router
  "safety-warning-decals": {
    category: "stickers-labels-decals",
    slugPrefix: "safety-",
    dbSlugs: [
      "arc-flash-labels",
      "confined-space-warning-signs",
      "crane-lift-capacity-labels",
      "emergency-exit-egress-signs-set",
      "fire-extinguisher-location-stickers",
      "first-aid-location-stickers",
      "forklift-safety-decals",
      "ppe-hard-hat-stickers",
      "hazard-ghs-labels",
      "high-voltage-warning-signs",
      "lockout-tagout-labels",
      "no-smoking-decals-set",
      "ppe-required-signs",
      "safety-notice-decal-pack",
      "slip-trip-hazard-signs",
      "whmis-workplace-labels",
    ],
  },
  "facility-asset-labels": {
    category: "stickers-labels-decals",
    slugPrefix: "facility-",
    dbSlugs: [
      "asset-tags-tamper-evident",
      "asset-tags-qr-barcode",
      "tool-box-bin-labels",
      "chemical-storage-labels",
      "pipe-markers-color-coded",
      "electrical-panel-labels",
      "pipe-markers-custom",
      "dock-door-numbers",
      "cable-panel-labels",
      "rack-labels-warehouse",
      "warehouse-zone-labels",
    ],
  },
  // packaging groups
  tags: {
    category: "marketing-business-print",
    slugPrefix: "tags-",
    dbSlugs: ["hang-tags", "hang-tags-custom", "tags-hang-tags", "label-sets", "retail-tags"],
  },

  // banners-displays groups
  "vinyl-banners": {
    category: "banners-displays",
    slugPrefix: "vinyl-",
    dbSlugs: ["vinyl-banners", "vinyl-banner-13oz", "blockout-banners", "double-sided-banners"],
  },
  "mesh-banners": {
    category: "banners-displays",
    slugPrefix: "mesh-",
    dbSlugs: ["mesh-banners", "mesh-banner-heavy-duty"],
  },
  "pole-banners": {
    category: "banners-displays",
    slugPrefix: "pole-",
    dbSlugs: ["pole-banners", "pole-banner-single-sided", "pole-banner-double-sided", "pole-banner-hardware-kit"],
  },
  "classic-canvas-prints": {
    category: "canvas-prints",
    slugPrefix: "canvas-",
    dbSlugs: ["canvas-standard", "canvas-prints-standard"],
  },
  "large-format-canvas": {
    category: "canvas-prints",
    slugPrefix: "canvas-",
    dbSlugs: ["canvas-panoramic", "panoramic-canvas-prints"],
  },
  "canvas-collages": {
    category: "canvas-prints",
    slugPrefix: "canvas-",
    dbSlugs: ["canvas-split-2", "canvas-split-5", "split-panel-canvas-prints"],
  },
  "triptych-canvas-split": {
    category: "canvas-prints",
    slugPrefix: "canvas-",
    dbSlugs: ["canvas-split-3"],
  },
  "rolled-canvas-prints": {
    category: "canvas-prints",
    slugPrefix: "rolled-",
    dbSlugs: [],
  },
  "fabric-banners": {
    category: "banners-displays",
    slugPrefix: "fabric-",
    dbSlugs: ["fabric-banner", "fabric-banner-double-sided", "fabric-banner-hanging"],
  },

  // window-glass-films groups
  "static-clings": {
    category: "windows-walls-floors",
    slugPrefix: "static-",
    dbSlugs: ["clear-static-cling", "frosted-static-cling", "static-cling-frosted", "static-cling-standard"],
  },
  "adhesive-films": {
    category: "windows-walls-floors",
    slugPrefix: "adhesive-",
    dbSlugs: ["frosted-matte-window-film", "holographic-iridescent-film", "color-white-on-clear-vinyl", "color-white-color-clear-vinyl", "dichroic-window-film", "gradient-window-film"],
  },
  "one-way-vision": {
    category: "windows-walls-floors",
    slugPrefix: "one-way-",
    dbSlugs: ["one-way-vision", "window-graphics-perforated", "one-way-vision-graphics", "perforated-window-film", "vehicle-window-tint-graphic"],
  },
  "privacy-films": {
    category: "windows-walls-floors",
    slugPrefix: "privacy-",
    dbSlugs: ["frosted-privacy-window-film", "frosted-privacy-film"],
  },
  "window-lettering": {
    category: "windows-walls-floors",
    slugPrefix: "window-lettering-",
    dbSlugs: ["vinyl-lettering", "window-cut-vinyl-lettering", "window-lettering-business", "window-lettering-cut-vinyl", "storefront-hours-door-decal-cut-vinyl"],
  },

  // display-stands groups
  "retractable-stands": {
    category: "banners-displays",
    slugPrefix: "retractable-",
    dbSlugs: ["retractable-banner-stand-premium", "deluxe-rollup-banner", "pull-up-banner", "roll-up-banners", "roll-up-stand-hardware", "banner-stand-rollup", "l-base-banner-stand", "banner-stand-l-base"],
  },
  "x-banner-stands": {
    category: "banners-displays",
    slugPrefix: "x-banner-",
    dbSlugs: ["x-banner-stand-standard", "x-banner-stand-large", "x-stand-hardware", "banner-stand-x", "tabletop-x-banner", "x-banner-frame-print", "x-banner-prints"],
  },
  "tabletop-displays": {
    category: "banners-displays",
    slugPrefix: "tabletop-",
    dbSlugs: ["tabletop-banner-a4", "tabletop-banner-a3", "deluxe-tabletop-retractable-a3", "tabletop-signs", "rigid-tabletop-signs", "table-easel-display", "standoff-hardware-set", "velcro-strips", "installation-service"],
  },
  "trade-show-furniture": {
    category: "banners-displays",
    slugPrefix: "table-",
    dbSlugs: ["branded-table-cover-6ft", "branded-table-runner", "table-cloth"],
  },
  "backdrops-popups": {
    category: "banners-displays",
    slugPrefix: "backdrop-",
    dbSlugs: ["telescopic-backdrop", "step-repeat-backdrops", "step-and-repeat-stand-kit", "media-wall-pop-up", "backdrop-board", "backdrop-stand-hardware", "step-repeat-backdrop-8x8", "popup-display-curved-8ft", "popup-display-straight-8ft", "tension-fabric-display-3x3", "tension-fabric-display-8ft", "tension-fabric-display-10ft", "pillowcase-display-frame"],
  },
  "flags-hardware": {
    category: "banners-displays",
    slugPrefix: "flag-",
    dbSlugs: ["feather-flags", "feather-flag-pole-set", "feather-flag-medium", "feather-flag-large", "teardrop-flags", "teardrop-flag-pole-set", "teardrop-flag-medium", "flag-base-ground-stake", "flag-base-water-bag", "flag-bases-cross"],
  },
  "a-frames-signs": {
    category: "signs-rigid-boards",
    slugPrefix: "a-frame-",
    dbSlugs: ["a-frame-sign-stand"],
  },
  "tents-outdoor": {
    category: "banners-displays",
    slugPrefix: "tent-",
    dbSlugs: ["tent-frame-10x10", "tent-walls-set", "outdoor-canopy-tent-10x10", "tent-half-walls", "tent-custom-print"],
  },

  // vehicle-branding-advertising groups
  "vehicle-wraps": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "wrap-",
    dbSlugs: ["full-vehicle-wrap-design-print", "vehicle-wrap-print-only-quote", "partial-wrap-spot-graphics", "vehicle-roof-wrap", "trailer-full-wrap", "trailer-box-truck-large-graphics", "car-graphics"],
  },
  "door-panel-graphics": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "door-",
    dbSlugs: ["custom-truck-door-lettering-kit", "printed-truck-door-decals-full-color", "truck-side-panel-printed-decal", "car-hood-decal", "tailgate-rear-door-printed-decal"],
  },
  "vehicle-decals": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "vehicle-decal-",
    dbSlugs: ["vinyl-lettering", "custom-printed-vehicle-logo-decals", "custom-cut-vinyl-lettering-any-text", "removable-promo-vehicle-decals", "long-term-outdoor-vehicle-decals", "social-qr-vehicle-decals", "bumper-sticker-custom", "boat-lettering-registration"],
  },
  "magnetic-signs": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "magnetic-",
    dbSlugs: ["magnetic-truck-door-signs", "magnetic-car-signs", "car-door-magnets-pair", "magnetic-rooftop-sign", "magnets-flexible"],
  },
  "fleet-packages": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "fleet-",
    dbSlugs: ["fleet-graphic-package", "high-visibility-rear-chevron-kit", "reflective-conspicuity-tape-kit", "reflective-safety-stripes-kit", "stay-back-warning-decals"],
  },

  // fleet-compliance-id groups
  "dot-mc-numbers": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "dot-",
    dbSlugs: ["usdot-number-decals", "mc-number-decals", "tssa-truck-number-lettering-cut-vinyl", "cvor-number-decals", "nsc-number-decals", "trailer-id-number-decals"],
  },
  "unit-weight-ids": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "unit-",
    dbSlugs: ["fleet-unit-number-stickers", "gvw-tare-weight-lettering", "equipment-id-decals-cut-vinyl"],
  },
  "spec-labels": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "spec-",
    dbSlugs: ["fuel-type-labels-diesel-gas", "tire-pressure-load-labels", "dangerous-goods-placards"],
  },
  "inspection-compliance": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "inspection-",
    dbSlugs: ["vehicle-inspection-maintenance-stickers", "truck-door-compliance-kit"],
  },


  // retail-promo groups
  "shelf-displays": {
    category: "marketing-business-print",
    slugPrefix: "shelf-",
    dbSlugs: ["shelf-talkers", "shelf-danglers", "shelf-wobblers", "shelf-displays", "wobblers", "danglers"],
  },
  "table-tents": {
    category: "marketing-business-print",
    slugPrefix: "table-",
    dbSlugs: ["table-tent-cards"],
  },
  "tickets-coupons": {
    category: "marketing-business-print",
    slugPrefix: "tc-",
    dbSlugs: ["coupons", "tickets", "cardstock-prints", "loyalty-cards"],
  },

};

export function getSubProducts(parentSlug) {
  if (parentSlug === "letterhead-stationery") {
    return {
      category: "marketing-business-print",
      slugPrefix: "stationery-",
      dbSlugs: [
        "letterhead",
        "letterhead-standard",
        "notepads",
        "notepads-custom",
        "bookmarks",
        "bookmarks-custom",
      ],
    };
  }
  if (parentSlug === "brochures-booklets") {
    return {
      category: "marketing-business-print",
      slugPrefix: "brochures-",
      dbSlugs: [
        "brochures",
        "brochures-bi-fold",
        "brochures-tri-fold",
        "brochures-z-fold",
        "booklets-saddle-stitch",
        "booklets-perfect-bound",
        "booklets-wire-o",
      ],
    };
  }
  return SUB_PRODUCT_CONFIG[parentSlug] ?? null;
}

export const SUB_PRODUCT_PARENTS = Object.keys(SUB_PRODUCT_CONFIG);

const ALL_SUB_SLUGS = new Set(Object.values(SUB_PRODUCT_CONFIG).flatMap((cfg) => cfg.dbSlugs));

export function isSubProduct(slug) {
  return ALL_SUB_SLUGS.has(slug);
}

export function getSubProductsForCategory(category) {
  return Object.entries(SUB_PRODUCT_CONFIG).filter(([, cfg]) => cfg.category === category);
}
