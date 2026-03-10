/**
 * Vehicle Graphics & Fleet \u2014 unified family data.
 *
 * Extracted from VehicleCategoryClient so all shared config
 * (browse-by-need, comparison, sections, value props, production guidance)
 * lives in one place. VehicleCategoryClient imports from here.
 */

const BASE = "/shop/vehicle-graphics-fleet";

/* ========================================================================
 * BROWSE BY NEED \u2014 6 scenarios answering "What are you trying to do?"
 * These appear at the top of the family page, before any product grid.
 * ======================================================================== */
export const VEHICLE_BROWSE_CASES = [
  {
    key: "door-branding",
    icon: "\uD83D\uDEBB",
    titleKey: "vc.browse.doorBranding.title",
    descKey: "vc.browse.doorBranding.desc",
    href: "#door-decals-magnets",
  },
  {
    key: "partial-wrap",
    icon: "\uD83C\uDFA8",
    titleKey: "vc.browse.partialWrap.title",
    descKey: "vc.browse.partialWrap.desc",
    href: "#wraps-large",
  },
  {
    key: "full-wrap",
    icon: "\uD83D\uDE9A",
    titleKey: "vc.browse.fullWrap.title",
    descKey: "vc.browse.fullWrap.desc",
    href: "#wraps-large",
  },
  {
    key: "magnetic",
    icon: "\uD83E\uDDF2",
    titleKey: "vc.browse.magnetic.title",
    descKey: "vc.browse.magnetic.desc",
    href: "#door-decals-magnets",
  },
  {
    key: "compliance",
    icon: "\uD83D\uDCCB",
    titleKey: "vc.browse.compliance.title",
    descKey: "vc.browse.compliance.desc",
    href: "#dot-fleet-compliance",
  },
  {
    key: "safety",
    icon: "\u26A0\uFE0F",
    titleKey: "vc.browse.safety.title",
    descKey: "vc.browse.safety.desc",
    href: "#safety-spec-labels",
  },
];

/* ========================================================================
 * COMPARISON TABLE \u2014 "Which vehicle graphic is right for you?"
 *
 * Answers the real decision question: decals vs lettering vs magnetic
 * vs partial wrap vs full wrap vs window/perf.
 * Each column has bestFor + notFor so users self-select.
 * ======================================================================== */
export const VEHICLE_COMPARISON_COLUMNS = [
  {
    key: "cutLettering",
    nameKey: "vc.cmp.cutLettering",
    taglineKey: "vc.cmp.tagline.cutLettering",
    href: `${BASE}/custom-truck-door-lettering-kit`,
    need: "door-branding",
    popular: true,
    features: {
      material: "vc.cmp.mat.cutLettering",
      durability: "vc.cmp.dur.cutLettering",
      removable: false,
      outdoor: true,
      install: "vc.cmp.install.cutLettering",
      bestFor: "vc.cmp.bestFor.cutLettering",
      notFor: "vc.cmp.notFor.cutLettering",
    },
  },
  {
    key: "printedDecal",
    nameKey: "vc.cmp.printedDecal",
    taglineKey: "vc.cmp.tagline.printedDecal",
    href: `${BASE}/printed-truck-door-decals-full-color`,
    need: "door-branding",
    features: {
      material: "vc.cmp.mat.printedDecal",
      durability: "vc.cmp.dur.printedDecal",
      removable: false,
      outdoor: true,
      install: "vc.cmp.install.printedDecal",
      bestFor: "vc.cmp.bestFor.printedDecal",
      notFor: "vc.cmp.notFor.printedDecal",
    },
  },
  {
    key: "magnetic",
    nameKey: "vc.cmp.magnetic",
    taglineKey: "vc.cmp.tagline.magnetic",
    href: `${BASE}/magnetic-truck-door-signs`,
    need: "magnetic",
    features: {
      material: "vc.cmp.mat.magnetic",
      durability: "vc.cmp.dur.magnetic",
      removable: true,
      outdoor: true,
      install: "vc.cmp.install.magnetic",
      bestFor: "vc.cmp.bestFor.magnetic",
      notFor: "vc.cmp.notFor.magnetic",
    },
  },
  {
    key: "partialWrap",
    nameKey: "vc.cmp.partialWrap",
    taglineKey: "vc.cmp.tagline.partialWrap",
    href: `${BASE}/partial-wrap-spot-graphics`,
    need: "partial-wrap",
    features: {
      material: "vc.cmp.mat.partialWrap",
      durability: "vc.cmp.dur.partialWrap",
      removable: false,
      outdoor: true,
      install: "vc.cmp.install.partialWrap",
      bestFor: "vc.cmp.bestFor.partialWrap",
      notFor: "vc.cmp.notFor.partialWrap",
    },
  },
  {
    key: "fullWrap",
    nameKey: "vc.cmp.fullWrap",
    taglineKey: "vc.cmp.tagline.fullWrap",
    href: `${BASE}/full-vehicle-wrap-design-print`,
    need: "full-wrap",
    features: {
      material: "vc.cmp.mat.fullWrap",
      durability: "vc.cmp.dur.fullWrap",
      removable: false,
      outdoor: true,
      install: "vc.cmp.install.fullWrap",
      bestFor: "vc.cmp.bestFor.fullWrap",
      notFor: "vc.cmp.notFor.fullWrap",
    },
  },
];

export const VEHICLE_COMPARISON_FEATURES = [
  { key: "material", labelKey: "vc.cmp.feat.material" },
  { key: "durability", labelKey: "vc.cmp.feat.durability" },
  { key: "removable", labelKey: "vc.cmp.feat.removable" },
  { key: "outdoor", labelKey: "vc.cmp.feat.outdoor" },
  { key: "install", labelKey: "vc.cmp.feat.install" },
  { key: "bestFor", labelKey: "vc.cmp.feat.bestFor" },
  { key: "notFor", labelKey: "vc.cmp.feat.notFor" },
];

/* ========================================================================
 * PRODUCT SECTIONS \u2014 the 4 sections of the category page grid.
 * Moved from VehicleCategoryClient to share with shell.
 * ======================================================================== */
export const VEHICLE_SECTIONS = [
  {
    key: "wraps-large",
    jumpLabelKey: "vc.section.wrapsLarge.jump",
    titleKey: "vc.section.wrapsLarge.title",
    subtitleKey: "vc.section.wrapsLarge.subtitle",
    ui: "premium",
    items: [
      { key: "full-vehicle-wrap-design-print", href: `${BASE}/full-vehicle-wrap-design-print`, priceKeys: ["full-vehicle-wrap-design-print"], badgeKeys: ["Quote-Only", "Install Available"], gradient: "from-violet-700 via-fuchsia-600 to-pink-500" },
      { key: "partial-wrap-spot-graphics", href: `${BASE}/partial-wrap-spot-graphics`, priceKeys: ["partial-wrap-spot-graphics"], gradient: "from-indigo-700 via-blue-600 to-cyan-500" },
      { key: "trailer-box-truck-large-graphics", href: `${BASE}/trailer-box-truck-large-graphics`, priceKeys: ["trailer-box-truck-large-graphics", "trailer-full-wrap"], gradient: "from-slate-700 via-slate-600 to-blue-500" },
      { key: "vehicle-roof-wrap", href: `${BASE}/vehicle-roof-wrap`, priceKeys: ["vehicle-roof-wrap"], gradient: "from-emerald-700 via-teal-600 to-cyan-500" },
    ],
  },
  {
    key: "door-decals-magnets",
    jumpLabelKey: "vc.section.doorDecals.jump",
    titleKey: "vc.section.doorDecals.title",
    subtitleKey: "vc.section.doorDecals.subtitle",
    ui: "cards",
    items: [
      { key: "custom-truck-door-lettering-kit", href: `${BASE}/custom-truck-door-lettering-kit`, priceKeys: ["custom-truck-door-lettering-kit"], gradient: "from-blue-500 to-indigo-500" },
      { key: "magnetic-truck-door-signs", href: `${BASE}/magnetic-truck-door-signs`, priceKeys: ["magnetic-truck-door-signs"], gradient: "from-slate-500 to-slate-700" },
      { key: "car-door-magnets-pair", href: `${BASE}/car-door-magnets-pair`, priceKeys: ["car-door-magnets-pair", "magnetic-car-signs"], gradient: "from-violet-500 to-fuchsia-500" },
      { key: "printed-truck-door-decals-full-color", href: `${BASE}/printed-truck-door-decals-full-color`, priceKeys: ["printed-truck-door-decals-full-color"], gradient: "from-cyan-500 to-sky-500" },
    ],
  },
  {
    key: "dot-fleet-compliance",
    jumpLabelKey: "vc.section.dotCompliance.jump",
    titleKey: "vc.section.dotCompliance.title",
    subtitleKey: "vc.section.dotCompliance.subtitle",
    ui: "list",
    items: [
      { key: "usdot-number-decals", href: `${BASE}/usdot-number-decals`, priceKeys: ["usdot-number-decals"], badgeKeys: ["Same-Day"] },
      { key: "cvor-number-decals", href: `${BASE}/cvor-number-decals`, priceKeys: ["cvor-number-decals"], badgeKeys: ["Same-Day"] },
      { key: "mc-nsc-number-decals", href: `${BASE}/mc-number-decals`, priceKeys: ["mc-number-decals", "nsc-number-decals"], badgeKeys: ["Same-Day"] },
      { key: "tssa-truck-number-lettering-cut-vinyl", href: `${BASE}/tssa-truck-number-lettering-cut-vinyl`, priceKeys: ["tssa-truck-number-lettering-cut-vinyl"] },
      { key: "gvw-tare-weight-lettering", href: `${BASE}/gvw-tare-weight-lettering`, priceKeys: ["gvw-tare-weight-lettering"] },
      { key: "fleet-unit-number-stickers", href: `${BASE}/fleet-unit-number-stickers`, priceKeys: ["fleet-unit-number-stickers"] },
    ],
  },
  {
    key: "safety-spec-labels",
    jumpLabelKey: "vc.section.safetyLabels.jump",
    titleKey: "vc.section.safetyLabels.title",
    subtitleKey: "vc.section.safetyLabels.subtitle",
    ui: "cards",
    items: [
      { key: "vehicle-inspection-maintenance-stickers", href: `${BASE}/vehicle-inspection-maintenance-stickers`, priceKeys: ["vehicle-inspection-maintenance-stickers"], gradient: "from-rose-500 to-red-500" },
      { key: "fuel-type-labels-diesel-gas", href: `${BASE}/fuel-type-labels-diesel-gas`, priceKeys: ["fuel-type-labels-diesel-gas"], gradient: "from-amber-500 to-orange-500" },
      { key: "dangerous-goods-placards", href: `${BASE}/dangerous-goods-placards`, priceKeys: ["dangerous-goods-placards"], gradient: "from-red-600 to-rose-600" },
      { key: "tire-pressure-load-labels", href: `${BASE}/tire-pressure-load-labels`, priceKeys: ["tire-pressure-load-labels"], gradient: "from-zinc-600 to-slate-600" },
      { key: "reflective-conspicuity-chevron-kits", href: `${BASE}/reflective-conspicuity-tape-kit`, priceKeys: ["reflective-conspicuity-tape-kit", "high-visibility-rear-chevron-kit", "reflective-safety-stripes-kit"], gradient: "from-yellow-500 to-red-500" },
    ],
  },
];

/* ========================================================================
 * I18N MAPS \u2014 slug \u2192 i18n key lookups
 * ======================================================================== */
export const ITEM_I18N = {
  "full-vehicle-wrap-design-print": "vc.item.fullWrap",
  "partial-wrap-spot-graphics": "vc.item.partialWrap",
  "trailer-box-truck-large-graphics": "vc.item.trailerGraphics",
  "vehicle-roof-wrap": "vc.item.roofWrap",
  "custom-truck-door-lettering-kit": "vc.item.doorLettering",
  "magnetic-truck-door-signs": "vc.item.magneticTruck",
  "car-door-magnets-pair": "vc.item.magneticCar",
  "printed-truck-door-decals-full-color": "vc.item.printedDoorDecals",
  "usdot-number-decals": "vc.item.usdot",
  "cvor-number-decals": "vc.item.cvor",
  "mc-nsc-number-decals": "vc.item.mcNsc",
  "tssa-truck-number-lettering-cut-vinyl": "vc.item.tssa",
  "gvw-tare-weight-lettering": "vc.item.gvwTare",
  "fleet-unit-number-stickers": "vc.item.fleetUnit",
  "vehicle-inspection-maintenance-stickers": "vc.item.inspection",
  "fuel-type-labels-diesel-gas": "vc.item.fuelType",
  "dangerous-goods-placards": "vc.item.dangerousGoods",
  "tire-pressure-load-labels": "vc.item.tirePressure",
  "reflective-conspicuity-chevron-kits": "vc.item.reflectiveTape",
};

export const NOTE_I18N = {
  "full-vehicle-wrap-design-print": "vc.item.fullWrap.note",
  "partial-wrap-spot-graphics": "vc.item.partialWrap.note",
  "trailer-box-truck-large-graphics": "vc.item.trailerGraphics.note",
  "vehicle-roof-wrap": "vc.item.roofWrap.note",
  "custom-truck-door-lettering-kit": "vc.item.doorLettering.note",
  "magnetic-truck-door-signs": "vc.item.magneticTruck.note",
  "car-door-magnets-pair": "vc.item.magneticCar.note",
  "printed-truck-door-decals-full-color": "vc.item.printedDoorDecals.note",
  "vehicle-inspection-maintenance-stickers": "vc.item.inspection.note",
  "fuel-type-labels-diesel-gas": "vc.item.fuelType.note",
  "dangerous-goods-placards": "vc.item.dangerousGoods.note",
  "tire-pressure-load-labels": "vc.item.tirePressure.note",
  "reflective-conspicuity-chevron-kits": "vc.item.reflectiveTape.note",
};

export const TAGLINE_KEYS = {
  "full-vehicle-wrap-design-print": "vc.tagline.fullWrap",
  "partial-wrap-spot-graphics": "vc.tagline.partialWrap",
  "trailer-box-truck-large-graphics": "vc.tagline.trailerGraphics",
  "vehicle-roof-wrap": "vc.tagline.roofWrap",
  "custom-truck-door-lettering-kit": "vc.tagline.doorLettering",
  "magnetic-truck-door-signs": "vc.tagline.magneticTruck",
  "car-door-magnets-pair": "vc.tagline.magneticCar",
  "printed-truck-door-decals-full-color": "vc.tagline.printedDoorDecals",
  "usdot-number-decals": "vc.tagline.usdot",
  "cvor-number-decals": "vc.tagline.cvor",
  "mc-nsc-number-decals": "vc.tagline.mcNsc",
  "tssa-truck-number-lettering-cut-vinyl": "vc.tagline.tssa",
  "gvw-tare-weight-lettering": "vc.tagline.gvwTare",
  "fleet-unit-number-stickers": "vc.tagline.fleetUnit",
  "vehicle-inspection-maintenance-stickers": "vc.tagline.inspection",
  "fuel-type-labels-diesel-gas": "vc.tagline.fuelType",
  "dangerous-goods-placards": "vc.tagline.dangerousGoods",
  "tire-pressure-load-labels": "vc.tagline.tirePressure",
  "reflective-conspicuity-chevron-kits": "vc.tagline.reflectiveTape",
};

export const BADGE_I18N = {
  "Quote-Only": "vc.badge.quoteOnly",
  "Install Available": "vc.badge.installAvailable",
  "Same-Day": "vc.badge.sameDay",
  "Premium": "vc.badge.premium",
};

/* ========================================================================
 * VALUE PROPS \u2014 "Why choose La Lunar for vehicle graphics?"
 * These replace the 3 hardcoded feature cards.
 * ======================================================================== */
export const VEHICLE_VALUE_PROPS = [
  {
    icon: "\u26A1",
    titleKey: "vc.vp.fastFleet.title",
    descKey: "vc.vp.fastFleet.desc",
  },
  {
    icon: "\uD83D\uDEE1\uFE0F",
    titleKey: "vc.vp.outdoor.title",
    descKey: "vc.vp.outdoor.desc",
  },
  {
    icon: "\uD83D\uDD27",
    titleKey: "vc.vp.installSupport.title",
    descKey: "vc.vp.installSupport.desc",
    ctaKey: "vc.getQuote",
    ctaHref: "/quote",
  },
];

/* ========================================================================
 * USE CASES \u2014 light supplement at bottom (linked to products)
 * ======================================================================== */
export const VEHICLE_USE_CASES = [
  { key: "plumber", icon: "\uD83D\uDD27", titleKey: "vc.uc.plumber.title", descKey: "vc.uc.plumber.desc", href: `${BASE}/custom-truck-door-lettering-kit` },
  { key: "realtor", icon: "\uD83C\uDFE0", titleKey: "vc.uc.realtor.title", descKey: "vc.uc.realtor.desc", href: `${BASE}/car-door-magnets-pair` },
  { key: "foodTruck", icon: "\uD83C\uDF55", titleKey: "vc.uc.foodTruck.title", descKey: "vc.uc.foodTruck.desc", href: `${BASE}/full-vehicle-wrap-design-print` },
  { key: "logistics", icon: "\uD83D\uDCE6", titleKey: "vc.uc.logistics.title", descKey: "vc.uc.logistics.desc", href: `${BASE}/usdot-number-decals` },
  { key: "landscape", icon: "\uD83C\uDF33", titleKey: "vc.uc.landscape.title", descKey: "vc.uc.landscape.desc", href: `${BASE}/partial-wrap-spot-graphics` },
  { key: "fleet", icon: "\uD83D\uDE9B", titleKey: "vc.uc.fleet.title", descKey: "vc.uc.fleet.desc", href: `${BASE}/full-vehicle-wrap-design-print` },
];

/* ========================================================================
 * PRODUCTION GUIDANCE \u2014 key production differences that matter
 * to customers, CSRs, salespeople, and production staff.
 *
 * Surfaced on the family page between value props and FAQ so
 * everyone speaks the same language about what they're ordering.
 * ======================================================================== */
export const VEHICLE_PRODUCTION_GUIDE = [
  {
    key: "laminate",
    iconKey: "\uD83C\uDF27\uFE0F",
    titleKey: "vc.prod.laminate.title",
    descKey: "vc.prod.laminate.desc",
  },
  {
    key: "install",
    iconKey: "\uD83D\uDD27",
    titleKey: "vc.prod.install.title",
    descKey: "vc.prod.install.desc",
  },
  {
    key: "surface",
    iconKey: "\uD83D\uDE97",
    titleKey: "vc.prod.surface.title",
    descKey: "vc.prod.surface.desc",
  },
  {
    key: "removable",
    iconKey: "\uD83E\uDDF2",
    titleKey: "vc.prod.removable.title",
    descKey: "vc.prod.removable.desc",
  },
  {
    key: "artwork",
    iconKey: "\uD83D\uDDBC\uFE0F",
    titleKey: "vc.prod.artwork.title",
    descKey: "vc.prod.artwork.desc",
  },
];

/* ========================================================================
 * CROSS-LINKS \u2014 related categories with clear reasons
 * ======================================================================== */
export const VEHICLE_CROSS_LINKS = [
  { titleKey: "vc.cross.signs", descKey: "vc.cross.signsDesc", href: "/shop/signs-rigid-boards" },
  { titleKey: "vc.cross.banners", descKey: "vc.cross.bannersDesc", href: "/shop/banners-displays" },
  { titleKey: "vc.cross.wwf", descKey: "vc.cross.wwfDesc", href: "/shop/windows-walls-floors" },
];
