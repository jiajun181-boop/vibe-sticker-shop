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
      "ncr-invoice-books",
      "ncr-invoices",
      "ncr-forms-duplicate",
      "ncr-forms-triplicate",
    ],
  },
  "order-forms": {
    category: "marketing-business-print",
    slugPrefix: "order-",
    dbSlugs: ["order-form-pads", "order-forms-single"],
  },
  "waivers-releases": {
    category: "marketing-business-print",
    slugPrefix: "waiver-",
    dbSlugs: ["release-waiver-forms", "release-forms"],
  },
  flyers: {
    category: "marketing-business-print",
    slugPrefix: "flyers-",
    dbSlugs: ["flyers", "flyers-small", "flyers-standard", "flyers-large"],
  },
  "rack-cards": {
    category: "marketing-business-print",
    slugPrefix: "rack-cards-",
    dbSlugs: ["rack-cards", "rack-cards-standard", "rack-cards-tear-off", "rack-cards-folded"],
  },
  "door-hangers": {
    category: "marketing-business-print",
    slugPrefix: "door-hangers-",
    dbSlugs: ["door-hangers", "door-hangers-standard", "door-hangers-large", "door-hangers-perforated"],
  },
  postcards: {
    category: "marketing-business-print",
    slugPrefix: "postcards-",
    dbSlugs: ["postcards", "postcards-standard", "postcards-medium", "postcards-large", "postcards-eddm"],
  },
  brochures: {
    category: "marketing-business-print",
    slugPrefix: "brochures-",
    dbSlugs: ["brochures", "brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold"],
  },
  booklets: {
    category: "marketing-business-print",
    slugPrefix: "booklets-",
    dbSlugs: ["booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o", "catalog-booklets"],
  },
  posters: {
    category: "marketing-business-print",
    slugPrefix: "posters-",
    dbSlugs: ["posters", "posters-glossy", "posters-matte", "posters-adhesive", "posters-backlit"],
  },
  menus: {
    category: "marketing-business-print",
    slugPrefix: "menus-",
    dbSlugs: ["menus", "menus-flat", "menus-folded", "menus-laminated", "menus-takeout", "table-mat", "rp-menus"],
  },
  envelopes: {
    category: "marketing-business-print",
    slugPrefix: "envelopes-",
    dbSlugs: ["envelopes", "envelopes-10-business", "envelopes-a7-invitation", "envelopes-6x9-catalog", "envelopes-9x12-catalog"],
  },
  "presentation-folders": {
    category: "marketing-business-print",
    slugPrefix: "presentation-folders-",
    dbSlugs: ["presentation-folders", "presentation-folders-standard", "presentation-folders-reinforced", "presentation-folders-legal", "presentation-folders-die-cut"],
  },
  letterhead: {
    category: "marketing-business-print",
    slugPrefix: "letterhead-",
    dbSlugs: [
      "letterhead",
      "letterhead-standard",
      "bf-letterhead",
    ],
  },
  notepads: {
    category: "marketing-business-print",
    slugPrefix: "notepads-",
    dbSlugs: [
      "notepads",
      "notepads-custom",
      "bf-notepads",
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
    dbSlugs: ["calendars", "calendars-wall", "calendars-wall-desk"],
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
    ],
  },
  certificates: {
    category: "marketing-business-print",
    slugPrefix: "certificates-",
    dbSlugs: [
      "certificates",
      "bf-certificates",
      "gift-certificates",
    ],
  },
  "greeting-cards": {
    category: "marketing-business-print",
    slugPrefix: "greeting-cards-",
    dbSlugs: [
      "greeting-cards",
    ],
  },
  "invitation-cards": {
    category: "marketing-business-print",
    slugPrefix: "invitation-",
    dbSlugs: [
      "invitation-cards",
      "invitations-flat",
    ],
  },
  "loyalty-cards": {
    category: "marketing-business-print",
    slugPrefix: "loyalty-cards-",
    dbSlugs: [
      "loyalty-cards",
    ],
  },

  // custom-stickers groups — replaced by variant pages (stickers, labels, decals)

  // large-format-graphics groups
  "wall-graphics": {
    category: "windows-walls-floors",
    slugPrefix: "wall-",
    dbSlugs: ["wall-mural-graphic", "wall-murals", "wall-graphics", "wall-decals"],
  },
  "floor-graphics": {
    category: "windows-walls-floors",
    slugPrefix: "floor-",
    dbSlugs: ["floor-graphics", "lf-floor-graphics", "warehouse-floor-graphics", "warehouse-floor-safety-graphics", "floor-arrows", "floor-number-markers", "floor-decals", "floor-direction-arrows-set", "floor-logo-graphic", "floor-number-markers-set"],
  },
  "window-graphics": {
    category: "windows-walls-floors",
    slugPrefix: "window-",
    dbSlugs: [
      "window-graphics",
      "full-window-graphics",
      "window-perforated",
      "window-frosted",
    ],
  },
  "vehicle-graphics": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "vehicle-",
    dbSlugs: ["car-graphics"],
  },

  // stickers-labels groups
  "sticker-pages": {
    category: "stickers-labels-decals",
    slugPrefix: "sticker-",
    dbSlugs: ["sticker-sheets", "kiss-cut-sticker-sheets", "stickers-sheet-kisscut", "stickers-multi-on-sheet", "sticker-packs"],
  },
  "die-cut-stickers": {
    category: "stickers-labels-decals",
    slugPrefix: "die-cut-",
    dbSlugs: ["die-cut-singles", "die-cut-stickers", "stickers-single-diecut", "stickers-die-cut-custom", "holographic-singles", "holographic-stickers", "foil-stickers", "clear-singles", "heavy-duty-vinyl-stickers", "stickers-color-on-white", "stickers-color-on-clear"],
  },
  "kiss-cut-singles": {
    category: "stickers-labels-decals",
    slugPrefix: "kiss-cut-",
    dbSlugs: ["removable-stickers"],
  },
  "sticker-rolls": {
    category: "stickers-labels-decals",
    slugPrefix: "roll-",
    dbSlugs: ["roll-labels", "stickers-roll-labels", "labels-roll-quote", "clear-labels", "labels-clear", "white-bopp-labels", "labels-white-bopp", "kraft-paper-labels", "freezer-labels", "barcode-labels", "qr-code-labels"],
  },
  "vinyl-lettering": {
    category: "stickers-labels-decals",
    slugPrefix: "vinyl-",
    dbSlugs: ["vinyl-lettering", "transfer-vinyl-lettering"],
  },
  specialty: {
    category: "stickers-labels-decals",
    slugPrefix: "specialty-",
    dbSlugs: [],
  },

  // packaging groups
  tags: {
    category: "marketing-business-print",
    slugPrefix: "tags-",
    dbSlugs: ["hang-tags", "hang-tags-custom", "tags-hang-tags", "label-sets"],
  },
  "inserts-packaging": {
    category: "marketing-business-print",
    slugPrefix: "inserts-",
    dbSlugs: ["packaging-inserts", "product-inserts", "packing-slips", "sticker-seals", "thank-you-cards", "box-sleeves"],
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
    dbSlugs: ["mesh-banner", "mesh-banners", "mesh-banner-heavy-duty"],
  },
  "pole-banners": {
    category: "banners-displays",
    slugPrefix: "pole-",
    dbSlugs: ["pole-banners", "pole-banner-single-sided", "pole-banner-double-sided", "pole-banner-hardware-kit"],
  },
  "canvas-prints": {
    category: "canvas-prints",
    slugPrefix: "canvas-",
    dbSlugs: [
      "canvas-standard",
      "canvas-gallery-wrap",
      "canvas-framed",
      "canvas-panoramic",
      "canvas-split-2",
      "canvas-split-3",
      "canvas-split-5",
    ],
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
    dbSlugs: ["clear-static-cling", "frosted-static-cling"],
  },
  "adhesive-films": {
    category: "windows-walls-floors",
    slugPrefix: "adhesive-",
    dbSlugs: ["frosted-matte-window-film", "holographic-iridescent-film", "color-white-on-clear-vinyl", "color-white-color-clear-vinyl"],
  },
  "one-way-vision": {
    category: "windows-walls-floors",
    slugPrefix: "one-way-",
    dbSlugs: ["window-graphics-perforated", "one-way-vision-graphics", "perforated-window-film", "vehicle-window-tint-graphic"],
  },
  "privacy-films": {
    category: "windows-walls-floors",
    slugPrefix: "privacy-",
    dbSlugs: ["frosted-privacy-window-film", "frosted-privacy-film"],
  },
  "window-lettering": {
    category: "windows-walls-floors",
    slugPrefix: "window-lettering-",
    dbSlugs: ["window-cut-vinyl-lettering", "window-lettering-business", "window-lettering-cut-vinyl", "storefront-hours-door-decal-cut-vinyl"],
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
    dbSlugs: ["tabletop-banner-a4", "tabletop-banner-a3", "deluxe-tabletop-retractable-a3", "tabletop-signs", "rigid-tabletop-signs", "table-easel-display", "branded-table-cover-6ft", "branded-table-runner", "table-cloth", "standoff-hardware-set", "banner-hems", "grommets-service", "drilled-holes-service", "pole-pockets", "double-sided-tape", "velcro-strips", "installation-service"],
  },
  "backdrops-popups": {
    category: "banners-displays",
    slugPrefix: "backdrop-",
    dbSlugs: ["telescopic-backdrop", "step-repeat-backdrops", "step-and-repeat-stand-kit", "media-wall-pop-up", "backdrop-board", "backdrop-stand-hardware", "step-repeat-backdrop-8x8", "popup-display-curved-8ft", "popup-display-straight-8ft", "tension-fabric-display-3x3", "tension-fabric-display-8ft", "tension-fabric-display-10ft", "pillowcase-display-frame"],
  },
  "flags-hardware": {
    category: "banners-displays",
    slugPrefix: "flag-",
    dbSlugs: ["feather-flag", "feather-flags", "feather-flag-pole-set", "feather-flag-medium", "feather-flag-large", "teardrop-flag", "teardrop-flags", "teardrop-flag-pole-set", "teardrop-flag-medium", "flag-base-ground-stake", "flag-base-water-bag", "flag-bases-cross"],
  },
  "a-frames-signs": {
    category: "signs-rigid-boards",
    slugPrefix: "a-frame-",
    dbSlugs: ["a-frame-stand", "a-frame-sign-stand", "a-frame-sandwich-board", "a-frame-insert-prints", "a-frame-double-sided", "handheld-sign", "handheld-signs"],
  },
  "lawn-yard-signs": {
    category: "signs-rigid-boards",
    slugPrefix: "yard-",
    dbSlugs: ["coroplast-yard-signs", "lawn-signs-h-stake", "double-sided-lawn-signs", "yard-sign", "yard-sign-h-frame", "yard-sign-panel-only", "h-stakes", "h-stake-wire", "real-estate-sign", "real-estate-agent-sign", "real-estate-frame", "election-campaign-sign"],
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
    dbSlugs: ["full-vehicle-wrap-design-print", "vehicle-wrap-print-only-quote", "partial-wrap-spot-graphics", "vehicle-roof-wrap", "trailer-full-wrap", "trailer-box-truck-large-graphics"],
  },
  "door-panel-graphics": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "door-",
    dbSlugs: ["custom-truck-door-lettering-kit", "printed-truck-door-decals-full-color", "truck-side-panel-printed-decal", "car-hood-decal", "tailgate-rear-door-printed-decal"],
  },
  "vehicle-decals": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "vehicle-decal-",
    dbSlugs: ["custom-printed-vehicle-logo-decals", "custom-cut-vinyl-lettering-any-text", "removable-promo-vehicle-decals", "long-term-outdoor-vehicle-decals", "social-qr-vehicle-decals", "bumper-sticker-custom", "boat-lettering-registration"],
  },
  "magnetic-signs": {
    category: "vehicle-graphics-fleet",
    slugPrefix: "magnetic-",
    dbSlugs: ["magnetic-truck-door-signs", "magnetic-car-signs", "car-door-magnets-pair", "magnetic-rooftop-sign"],
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
    dbSlugs: ["vehicle-inspection-maintenance-stickers", "truck-door-compliance-kit", "fleet-vehicle-inspection-book", "ifta-cab-card-holder", "hours-of-service-log-holder"],
  },

  // safety-warning-decals groups
  "reflective-visibility": {
    category: "stickers-labels-decals",
    slugPrefix: "reflective-",
    dbSlugs: ["reflective-conspicuity-tape-kit", "high-visibility-rear-chevron-kit", "reflective-safety-stripes-kit"],
  },
  "fire-emergency": {
    category: "stickers-labels-decals",
    slugPrefix: "fire-",
    dbSlugs: ["fire-extinguisher-location-stickers", "first-aid-location-stickers", "emergency-exit-egress-signs-set"],
  },
  "hazard-warning": {
    category: "stickers-labels-decals",
    slugPrefix: "hazard-",
    dbSlugs: ["hazard-ghs-labels", "no-smoking-decals-set", "stay-back-warning-decals", "safety-notice-decal-pack", "parking-lot-stencils", "confined-space-warning-signs", "slip-trip-hazard-signs"],
  },
  "ppe-equipment": {
    category: "stickers-labels-decals",
    slugPrefix: "ppe-",
    dbSlugs: ["ppe-hard-hat-stickers", "ppe-required-signs", "forklift-safety-decals", "crane-lift-capacity-labels"],
  },
  "electrical-chemical": {
    category: "stickers-labels-decals",
    slugPrefix: "electrical-",
    dbSlugs: ["lockout-tagout-labels", "arc-flash-labels", "chemical-storage-labels", "high-voltage-warning-signs", "whmis-workplace-labels"],
  },

  // rigid-signs groups (by end-user use case)
  "yard-lawn-signs": {
    category: "signs-rigid-boards",
    slugPrefix: "yard-",
    dbSlugs: ["yard-sign", "yard-sign-h-frame", "yard-signs-coroplast", "yard-sign-panel-only", "coroplast-signs", "coroplast-yard-signs", "lawn-signs-h-stake", "double-sided-lawn-signs", "directional-arrow-sign", "directional-arrow-signs", "election-campaign-sign", "coroplast-sheet-4mm", "coroplast-sheet-6mm", "coroplast-sheet-10mm"],
  },
  "real-estate-signs": {
    category: "signs-rigid-boards",
    slugPrefix: "re-",
    dbSlugs: ["real-estate-sign", "real-estate-agent-sign", "real-estate-riders", "open-house-sign-kit"],
  },
  "event-photo-boards": {
    category: "signs-rigid-boards",
    slugPrefix: "event-",
    dbSlugs: ["selfie-frame-board", "life-size-cutout", "giant-presentation-check", "welcome-sign-board", "seating-chart-board", "event-celebration-board", "memorial-tribute-board", "photo-collage-board", "event-photo-backdrop", "handheld-prop-board", "face-in-hole-board", "photo-board", "backdrop-board"],
  },
  "business-property": {
    category: "signs-rigid-boards",
    slugPrefix: "biz-",
    dbSlugs: ["business-hours-sign", "construction-site-signs", "safety-signs", "wayfinding-signs", "parking-property-signs", "qr-code-signs", "address-house-number-signs", "ada-braille-signs"],
  },
  "display-tabletop": {
    category: "signs-rigid-boards",
    slugPrefix: "display-",
    dbSlugs: ["a-frame-sandwich-board", "a-frame-insert-prints", "handheld-sign", "handheld-signs", "table-easel-display", "rigid-tabletop-signs", "tabletop-signs", "standoff-mounted-signs", "menu-boards", "tags-tickets-rigid", "floor-standup-display", "dry-erase-rigid-board", "tri-fold-presentation-board"],
  },
  "by-material": {
    category: "signs-rigid-boards",
    slugPrefix: "mat-",
    dbSlugs: ["foam-board", "custom-foam-board", "foam-board-easel", "foam-board-prints", "rigid-foam-board-prints", "foamboard-sheet-3-16", "foamboard-sheet-1-2", "acrylic-signs", "clear-acrylic-signs", "frosted-acrylic-signs", "aluminum-signs", "aluminum-composite", "acm-dibond-signs", "pvc-sintra-signs", "pvc-sheet-3mm", "gatorboard-signs"],
  },

  // retail-promo groups
  "shelf-displays": {
    category: "marketing-business-print",
    slugPrefix: "shelf-",
    dbSlugs: ["wobblers", "danglers", "shelf-talkers"],
  },
  "table-tents": {
    category: "marketing-business-print",
    slugPrefix: "table-",
    dbSlugs: ["table-tent-cards", "table-tents-4x6", "table-display-cards"],
  },
  "tickets-coupons": {
    category: "marketing-business-print",
    slugPrefix: "tc-",
    dbSlugs: ["rp-tickets", "rp-coupons", "coupons", "tickets", "cardstock-prints"],
  },
  "retail-tags": {
    category: "marketing-business-print",
    slugPrefix: "rt-",
    dbSlugs: ["rp-hang-tags"],
  },

  // facility-asset-labels groups
  "asset-equipment-tags": {
    category: "stickers-labels-decals",
    slugPrefix: "asset-",
    dbSlugs: ["asset-tags-qr-barcode", "asset-tags-tamper-evident", "equipment-rating-plates", "tool-box-bin-labels"],
  },
  "pipe-valve-labels": {
    category: "stickers-labels-decals",
    slugPrefix: "pipe-",
    dbSlugs: ["pipe-markers-color-coded", "pipe-markers-custom", "valve-tags-engraved"],
  },
  "warehouse-labels": {
    category: "stickers-labels-decals",
    slugPrefix: "warehouse-",
    dbSlugs: ["warehouse-zone-labels", "rack-labels-warehouse", "aisle-markers-hanging", "dock-door-numbers"],
  },
  "electrical-cable-labels": {
    category: "stickers-labels-decals",
    slugPrefix: "cable-",
    dbSlugs: ["cable-panel-labels", "electrical-panel-labels"],
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
        "bf-letterhead",
        "notepads",
        "notepads-custom",
        "bf-notepads",
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
