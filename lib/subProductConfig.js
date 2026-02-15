/**
 * Sub-product configuration.
 * Parent slug -> child db slugs.
 */

export const SUB_PRODUCT_CONFIG = {
  // marketing-prints groups
  "business-cards": {
    category: "marketing-prints",
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
    ],
  },
  "ncr-forms": {
    category: "marketing-prints",
    slugPrefix: "ncr-",
    dbSlugs: [
      "ncr-invoice-books",
      "ncr-invoices",
      "ncr-forms-duplicate",
      "ncr-forms-triplicate",
    ],
  },
  "order-forms": {
    category: "marketing-prints",
    slugPrefix: "order-",
    dbSlugs: ["order-form-pads", "order-forms-single"],
  },
  "waivers-releases": {
    category: "marketing-prints",
    slugPrefix: "waiver-",
    dbSlugs: ["release-waiver-forms", "release-forms"],
  },
  flyers: {
    category: "marketing-prints",
    slugPrefix: "flyers-",
    dbSlugs: ["flyers", "flyers-small", "flyers-standard", "flyers-large", "rack-cards", "rack-cards-standard", "rack-cards-tear-off", "rack-cards-folded", "door-hangers", "door-hangers-standard", "door-hangers-large", "door-hangers-perforated"],
  },
  postcards: {
    category: "marketing-prints",
    slugPrefix: "postcards-",
    dbSlugs: ["postcards", "postcards-standard", "postcards-medium", "postcards-large", "postcards-eddm"],
  },
  "brochures-booklets": {
    category: "marketing-prints",
    slugPrefix: "brochures-",
    dbSlugs: ["brochures", "brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold", "booklets", "booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o"],
  },
  posters: {
    category: "marketing-prints",
    slugPrefix: "posters-",
    dbSlugs: ["posters", "posters-glossy", "posters-matte", "posters-adhesive", "posters-backlit"],
  },
  menus: {
    category: "marketing-prints",
    slugPrefix: "menus-",
    dbSlugs: ["menus", "menus-flat", "menus-folded", "menus-laminated", "menus-takeout"],
  },
  envelopes: {
    category: "marketing-prints",
    slugPrefix: "envelopes-",
    dbSlugs: ["envelopes", "envelopes-10-business", "envelopes-a7-invitation", "envelopes-6x9-catalog", "envelopes-9x12-catalog"],
  },
  "presentation-folders": {
    category: "marketing-prints",
    slugPrefix: "presentation-folders-",
    dbSlugs: ["presentation-folders", "presentation-folders-standard", "presentation-folders-reinforced", "presentation-folders-legal", "presentation-folders-die-cut"],
  },
  "letterhead-stationery": {
    category: "marketing-prints",
    slugPrefix: "stationery-",
    dbSlugs: [
      "letterhead",
      "letterhead-standard",
      "bf-letterhead",
      "notepads",
      "notepads-custom",
      "bf-notepads",
      "calendars",
      "calendars-wall",
      "bookmarks",
      "bookmarks-custom",
      "self-inking-stamps",
      "stamps-s827",
      "stamps-s510",
      "stamps-s520",
      "stamps-s542",
      "stamps-r512",
      "stamps-r524",
      "stamps-r532",
      "stamps-r552",
    ],
  },
  "greeting-cards": {
    category: "marketing-prints",
    slugPrefix: "cards-",
    dbSlugs: [
      "invitation-cards",
      "invitations-flat",
      "greeting-cards",
      "gift-certificates",
      "loyalty-cards",
      "certificates",
      "bf-certificates",
    ],
  },

  // large-format-graphics groups
  "wall-graphics": {
    category: "large-format-graphics",
    slugPrefix: "wall-",
    dbSlugs: ["wall-mural-graphic", "wall-murals", "wall-graphics", "wall-decals"],
  },
  "floor-graphics": {
    category: "large-format-graphics",
    slugPrefix: "floor-",
    dbSlugs: ["floor-graphics", "lf-floor-graphics", "warehouse-floor-graphics", "warehouse-floor-safety-graphics", "floor-arrows", "floor-number-markers", "floor-decals", "floor-direction-arrows-set", "floor-logo-graphic", "floor-number-markers-set"],
  },
  "window-graphics": {
    category: "large-format-graphics",
    slugPrefix: "window-",
    dbSlugs: [
      "window-graphics",
      "full-window-graphics",
      "one-way-vision-graphics",
      "window-perforated",
      "frosted-privacy-film",
      "window-frosted",
      "perforated-window-film",
    ],
  },
  "vehicle-graphics": {
    category: "large-format-graphics",
    slugPrefix: "vehicle-",
    dbSlugs: ["car-graphics"],
  },

  // stickers-labels groups
  "sticker-pages": {
    category: "stickers-labels",
    slugPrefix: "sticker-",
    dbSlugs: ["sticker-sheets", "kiss-cut-sticker-sheets", "stickers-sheet-kisscut", "stickers-multi-on-sheet", "sticker-packs"],
  },
  "die-cut-stickers": {
    category: "stickers-labels",
    slugPrefix: "die-cut-",
    dbSlugs: ["die-cut-singles", "die-cut-stickers", "stickers-single-diecut", "holographic-singles", "holographic-stickers", "foil-stickers", "clear-singles", "heavy-duty-vinyl-stickers", "stickers-color-on-white", "stickers-color-on-clear"],
  },
  "kiss-cut-singles": {
    category: "stickers-labels",
    slugPrefix: "kiss-cut-",
    dbSlugs: ["removable-stickers"],
  },
  "sticker-rolls": {
    category: "stickers-labels",
    slugPrefix: "roll-",
    dbSlugs: ["roll-labels", "labels-roll-quote", "clear-labels", "labels-clear", "white-bopp-labels", "labels-white-bopp", "kraft-paper-labels", "freezer-labels", "barcode-labels", "qr-code-labels"],
  },
  "vinyl-lettering": {
    category: "stickers-labels",
    slugPrefix: "vinyl-",
    dbSlugs: ["vinyl-lettering", "transfer-vinyl-lettering"],
  },
  decals: {
    category: "stickers-labels",
    slugPrefix: "decal-",
    dbSlugs: ["window-decals", "wall-decals", "floor-decals"],
  },
  specialty: {
    category: "stickers-labels",
    slugPrefix: "specialty-",
    dbSlugs: ["magnets-flexible", "perforated-window-film"],
  },

  // packaging groups
  tags: {
    category: "packaging",
    slugPrefix: "tags-",
    dbSlugs: ["hang-tags", "hang-tags-custom", "tags-hang-tags", "label-sets"],
  },
  "inserts-packaging": {
    category: "packaging",
    slugPrefix: "inserts-",
    dbSlugs: ["packaging-inserts", "product-inserts", "sticker-seals", "thank-you-cards", "box-sleeves"],
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
    dbSlugs: ["mesh-banner", "mesh-banners"],
  },
  "pole-banners": {
    category: "banners-displays",
    slugPrefix: "pole-",
    dbSlugs: ["pole-banners"],
  },
  "canvas-prints": {
    category: "banners-displays",
    slugPrefix: "canvas-",
    dbSlugs: ["canvas-prints"],
  },

  // window-glass-films groups
  "static-clings": {
    category: "window-glass-films",
    slugPrefix: "static-",
    dbSlugs: ["clear-static-cling", "frosted-static-cling"],
  },
  "adhesive-films": {
    category: "window-glass-films",
    slugPrefix: "adhesive-",
    dbSlugs: ["frosted-matte-window-film", "holographic-iridescent-film", "color-white-on-clear-vinyl", "color-white-color-clear-vinyl"],
  },
  "one-way-vision": {
    category: "window-glass-films",
    slugPrefix: "one-way-",
    dbSlugs: ["window-graphics-perforated", "one-way-vision-graphics", "perforated-window-film", "vehicle-window-tint-graphic"],
  },
  "privacy-films": {
    category: "window-glass-films",
    slugPrefix: "privacy-",
    dbSlugs: ["frosted-privacy-window-film", "frosted-privacy-film"],
  },
  "window-lettering": {
    category: "window-glass-films",
    slugPrefix: "window-lettering-",
    dbSlugs: ["window-cut-vinyl-lettering", "window-lettering-business", "window-lettering-cut-vinyl", "storefront-hours-door-decal-cut-vinyl"],
  },

  // display-stands groups
  "retractable-stands": {
    category: "display-stands",
    slugPrefix: "retractable-",
    dbSlugs: ["retractable-banner-stand-premium", "deluxe-rollup-banner", "pull-up-banner", "roll-up-banners", "roll-up-stand-hardware"],
  },
  "x-banner-stands": {
    category: "display-stands",
    slugPrefix: "x-banner-",
    dbSlugs: ["x-banner-stand-standard", "x-banner-stand-large", "x-stand-hardware", "tabletop-x-banner", "x-banner-frame-print", "x-banner-prints"],
  },
  "tabletop-displays": {
    category: "display-stands",
    slugPrefix: "tabletop-",
    dbSlugs: ["tabletop-banner-a4", "tabletop-banner-a3", "deluxe-tabletop-retractable-a3", "tabletop-signs", "rigid-tabletop-signs", "table-easel-display", "branded-table-cover-6ft", "branded-table-runner", "table-cloth"],
  },
  "backdrops-popups": {
    category: "display-stands",
    slugPrefix: "backdrop-",
    dbSlugs: ["telescopic-backdrop", "step-repeat-backdrops", "step-and-repeat-stand-kit", "media-wall-pop-up", "backdrop-board", "backdrop-stand-hardware", "step-repeat-backdrop-8x8", "popup-display-curved-8ft", "popup-display-straight-8ft", "tension-fabric-display-3x3", "pillowcase-display-frame"],
  },
  "flags-hardware": {
    category: "display-stands",
    slugPrefix: "flag-",
    dbSlugs: ["feather-flag", "feather-flags", "feather-flag-pole-set", "feather-flag-medium", "feather-flag-large", "teardrop-flag", "teardrop-flags", "teardrop-flag-pole-set", "teardrop-flag-medium", "flag-base-ground-stake", "flag-base-water-bag", "flag-bases-cross"],
  },
  "a-frames-signs": {
    category: "display-stands",
    slugPrefix: "a-frame-",
    dbSlugs: ["a-frame-stand", "a-frame-sign-stand", "a-frame-sandwich-board", "a-frame-insert-prints", "handheld-sign", "handheld-signs"],
  },
  "lawn-yard-signs": {
    category: "display-stands",
    slugPrefix: "yard-",
    dbSlugs: ["coroplast-yard-signs", "lawn-signs-h-stake", "double-sided-lawn-signs", "yard-sign", "yard-sign-h-frame", "yard-sign-panel-only", "h-stakes", "h-stake-wire", "real-estate-sign", "real-estate-agent-sign", "real-estate-frame", "election-campaign-sign"],
  },
  "tents-outdoor": {
    category: "display-stands",
    slugPrefix: "tent-",
    dbSlugs: ["tent-frame-10x10", "tent-walls-set", "outdoor-canopy-tent-10x10"],
  },

  // vehicle-branding-advertising groups
  "vehicle-wraps": {
    category: "vehicle-branding-advertising",
    slugPrefix: "wrap-",
    dbSlugs: ["full-vehicle-wrap-design-print", "vehicle-wrap-print-only-quote", "partial-wrap-spot-graphics", "vehicle-roof-wrap", "trailer-full-wrap", "trailer-box-truck-large-graphics"],
  },
  "door-panel-graphics": {
    category: "vehicle-branding-advertising",
    slugPrefix: "door-",
    dbSlugs: ["custom-truck-door-lettering-kit", "printed-truck-door-decals-full-color", "truck-side-panel-printed-decal", "car-hood-decal", "tailgate-rear-door-printed-decal"],
  },
  "vehicle-decals": {
    category: "vehicle-branding-advertising",
    slugPrefix: "vehicle-decal-",
    dbSlugs: ["custom-printed-vehicle-logo-decals", "custom-cut-vinyl-lettering-any-text", "removable-promo-vehicle-decals", "long-term-outdoor-vehicle-decals", "social-qr-vehicle-decals", "bumper-sticker-custom", "boat-lettering-registration"],
  },
  "magnetic-signs": {
    category: "vehicle-branding-advertising",
    slugPrefix: "magnetic-",
    dbSlugs: ["magnetic-truck-door-signs", "magnetic-car-signs", "car-door-magnets-pair", "magnetic-rooftop-sign"],
  },
  "fleet-packages": {
    category: "vehicle-branding-advertising",
    slugPrefix: "fleet-",
    dbSlugs: ["fleet-graphic-package", "high-visibility-rear-chevron-kit", "reflective-conspicuity-tape-kit", "reflective-safety-stripes-kit", "stay-back-warning-decals"],
  },

  // fleet-compliance-id groups
  "dot-mc-numbers": {
    category: "fleet-compliance-id",
    slugPrefix: "dot-",
    dbSlugs: ["usdot-number-decals", "mc-number-decals", "tssa-truck-number-lettering-cut-vinyl", "cvor-number-decals", "nsc-number-decals", "trailer-id-number-decals"],
  },
  "unit-weight-ids": {
    category: "fleet-compliance-id",
    slugPrefix: "unit-",
    dbSlugs: ["fleet-unit-number-stickers", "gvw-tare-weight-lettering", "equipment-id-decals-cut-vinyl"],
  },
  "spec-labels": {
    category: "fleet-compliance-id",
    slugPrefix: "spec-",
    dbSlugs: ["fuel-type-labels-diesel-gas", "tire-pressure-load-labels", "dangerous-goods-placards"],
  },
  "inspection-compliance": {
    category: "fleet-compliance-id",
    slugPrefix: "inspection-",
    dbSlugs: ["vehicle-inspection-maintenance-stickers", "truck-door-compliance-kit", "fleet-vehicle-inspection-book", "ifta-cab-card-holder", "hours-of-service-log-holder"],
  },

  // safety-warning-decals groups
  "reflective-visibility": {
    category: "safety-warning-decals",
    slugPrefix: "reflective-",
    dbSlugs: ["reflective-conspicuity-tape-kit", "high-visibility-rear-chevron-kit", "reflective-safety-stripes-kit"],
  },
  "fire-emergency": {
    category: "safety-warning-decals",
    slugPrefix: "fire-",
    dbSlugs: ["fire-extinguisher-location-stickers", "first-aid-location-stickers", "emergency-exit-egress-signs-set"],
  },
  "hazard-warning": {
    category: "safety-warning-decals",
    slugPrefix: "hazard-",
    dbSlugs: ["hazard-ghs-labels", "no-smoking-decals-set", "stay-back-warning-decals", "safety-notice-decal-pack", "confined-space-warning-signs", "slip-trip-hazard-signs"],
  },
  "ppe-equipment": {
    category: "safety-warning-decals",
    slugPrefix: "ppe-",
    dbSlugs: ["ppe-hard-hat-stickers", "ppe-required-signs", "forklift-safety-decals", "crane-lift-capacity-labels"],
  },
  "electrical-chemical": {
    category: "safety-warning-decals",
    slugPrefix: "electrical-",
    dbSlugs: ["lockout-tagout-labels", "arc-flash-labels", "chemical-storage-labels", "high-voltage-warning-signs", "whmis-workplace-labels"],
  },

  // rigid-signs groups
  "yard-signs": {
    category: "rigid-signs",
    slugPrefix: "yard-",
    dbSlugs: ["yard-sign", "yard-sign-h-frame", "directional-arrow-sign"],
  },
  "real-estate-signs": {
    category: "rigid-signs",
    slugPrefix: "re-",
    dbSlugs: ["real-estate-sign"],
  },
  "foam-board-signs": {
    category: "rigid-signs",
    slugPrefix: "foam-",
    dbSlugs: ["custom-foam-board", "photo-board"],
  },
  "a-frame-signs": {
    category: "rigid-signs",
    slugPrefix: "aframe-",
    dbSlugs: ["a-frame-sandwich-board"],
  },
  "election-signs": {
    category: "rigid-signs",
    slugPrefix: "election-",
    dbSlugs: ["election-campaign-sign"],
  },
  "display-signs": {
    category: "rigid-signs",
    slugPrefix: "display-",
    dbSlugs: ["handheld-sign", "table-easel-display"],
  },

  // retail-promo groups
  "shelf-displays": {
    category: "retail-promo",
    slugPrefix: "shelf-",
    dbSlugs: ["wobblers", "danglers", "shelf-talkers"],
  },
  "table-tents": {
    category: "retail-promo",
    slugPrefix: "table-",
    dbSlugs: ["table-tent-cards", "table-tents-4x6", "table-display-cards"],
  },
  "tickets-coupons": {
    category: "retail-promo",
    slugPrefix: "tc-",
    dbSlugs: ["rp-tickets", "rp-coupons", "coupons", "tickets", "cardstock-prints"],
  },
  "retail-tags": {
    category: "retail-promo",
    slugPrefix: "rt-",
    dbSlugs: ["rp-hang-tags", "rp-menus"],
  },

  // facility-asset-labels groups
  "asset-equipment-tags": {
    category: "facility-asset-labels",
    slugPrefix: "asset-",
    dbSlugs: ["asset-tags-qr-barcode", "asset-tags-tamper-evident", "equipment-rating-plates", "tool-box-bin-labels"],
  },
  "pipe-valve-labels": {
    category: "facility-asset-labels",
    slugPrefix: "pipe-",
    dbSlugs: ["pipe-markers-color-coded", "pipe-markers-custom", "valve-tags-engraved"],
  },
  "warehouse-labels": {
    category: "facility-asset-labels",
    slugPrefix: "warehouse-",
    dbSlugs: ["warehouse-zone-labels", "rack-labels-warehouse", "aisle-markers-hanging", "dock-door-numbers"],
  },
  "electrical-cable-labels": {
    category: "facility-asset-labels",
    slugPrefix: "cable-",
    dbSlugs: ["cable-panel-labels", "electrical-panel-labels"],
  },
};

export function getSubProducts(parentSlug) {
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
