/**
 * Windows, Walls & Floors \u2014 unified family data.
 *
 * Extracted from WindowsWallsFloorsCategoryClient so all shared config
 * (browse-by-need, comparison, sections, value props, use cases, cross-links)
 * lives in one place. WindowsWallsFloorsCategoryClient imports from here.
 */

const BASE = "/shop/windows-walls-floors";

/* ========================================================================
 * BROWSE BY NEED \u2014 6 scenarios answering "What are you trying to do?"
 * ======================================================================== */
export const WWF_BROWSE_CASES = [
  {
    key: "storefront",
    icon: "\uD83C\uDFEA",
    titleKey: "wwf.browse.storefront.title",
    descKey: "wwf.browse.storefront.desc",
    href: `${BASE}/one-way-vision`,
  },
  {
    key: "privacy",
    icon: "\uD83E\uDEAA",
    titleKey: "wwf.browse.privacy.title",
    descKey: "wwf.browse.privacy.desc",
    href: `${BASE}/frosted-window-film`,
  },
  {
    key: "promo",
    icon: "\uD83C\uDF1F",
    titleKey: "wwf.browse.promo.title",
    descKey: "wwf.browse.promo.desc",
    href: `${BASE}/opaque-window-graphics`,
  },
  {
    key: "walls",
    icon: "\uD83C\uDFA8",
    titleKey: "wwf.browse.walls.title",
    descKey: "wwf.browse.walls.desc",
    href: "#wall",
  },
  {
    key: "floor",
    icon: "\uD83D\uDEB6",
    titleKey: "wwf.browse.floor.title",
    descKey: "wwf.browse.floor.desc",
    href: "#floor",
  },
  {
    key: "temporary",
    icon: "\u2699\uFE0F",
    titleKey: "wwf.browse.temporary.title",
    descKey: "wwf.browse.temporary.desc",
    href: `${BASE}/static-cling`,
  },
];

/* ========================================================================
 * COMPARISON TABLE \u2014 "Which surface graphic is right for you?"
 *
 * Answers the real decision: frosted vs clear vs perforated,
 * permanent vs removable, indoor vs outdoor.
 * ======================================================================== */
export const WWF_COMPARISON_COLUMNS = [
  {
    key: "oneWayVision",
    nameKey: "wwf.cmp.oneWayVision",
    taglineKey: "wwf.cmp.tagline.oneWayVision",
    href: `${BASE}/one-way-vision`,
    need: "storefront",
    popular: true,
    features: {
      material: "wwf.cmp.mat.oneWayVision",
      transparency: "wwf.cmp.trans.oneWayVision",
      adhesive: "wwf.cmp.adh.oneWayVision",
      removable: false,
      outdoor: true,
      bestFor: "wwf.cmp.bestFor.oneWayVision",
      notFor: "wwf.cmp.notFor.oneWayVision",
    },
  },
  {
    key: "frosted",
    nameKey: "wwf.cmp.frosted",
    taglineKey: "wwf.cmp.tagline.frosted",
    href: `${BASE}/frosted-window-film`,
    need: "privacy",
    features: {
      material: "wwf.cmp.mat.frosted",
      transparency: "wwf.cmp.trans.frosted",
      adhesive: "wwf.cmp.adh.frosted",
      removable: false,
      outdoor: true,
      bestFor: "wwf.cmp.bestFor.frosted",
      notFor: "wwf.cmp.notFor.frosted",
    },
  },
  {
    key: "staticCling",
    nameKey: "wwf.cmp.staticCling",
    taglineKey: "wwf.cmp.tagline.staticCling",
    href: `${BASE}/static-cling`,
    need: "temporary",
    features: {
      material: "wwf.cmp.mat.staticCling",
      transparency: "wwf.cmp.trans.staticCling",
      adhesive: "wwf.cmp.adh.staticCling",
      removable: true,
      outdoor: false,
      bestFor: "wwf.cmp.bestFor.staticCling",
      notFor: "wwf.cmp.notFor.staticCling",
    },
  },
  {
    key: "opaqueGraphics",
    nameKey: "wwf.cmp.opaqueGraphics",
    taglineKey: "wwf.cmp.tagline.opaqueGraphics",
    href: `${BASE}/opaque-window-graphics`,
    need: "promo",
    features: {
      material: "wwf.cmp.mat.opaqueGraphics",
      transparency: "wwf.cmp.trans.opaqueGraphics",
      adhesive: "wwf.cmp.adh.opaqueGraphics",
      removable: false,
      outdoor: true,
      bestFor: "wwf.cmp.bestFor.opaqueGraphics",
      notFor: "wwf.cmp.notFor.opaqueGraphics",
    },
  },
  {
    key: "floorGraphics",
    nameKey: "wwf.cmp.floorGraphics",
    taglineKey: "wwf.cmp.tagline.floorGraphics",
    href: `${BASE}/floor-graphics`,
    need: "floor",
    features: {
      material: "wwf.cmp.mat.floorGraphics",
      transparency: "wwf.cmp.trans.floorGraphics",
      adhesive: "wwf.cmp.adh.floorGraphics",
      removable: false,
      outdoor: false,
      bestFor: "wwf.cmp.bestFor.floorGraphics",
      notFor: "wwf.cmp.notFor.floorGraphics",
    },
  },
];

export const WWF_COMPARISON_FEATURES = [
  { key: "material", labelKey: "wwf.cmp.feat.material" },
  { key: "transparency", labelKey: "wwf.cmp.feat.transparency" },
  { key: "adhesive", labelKey: "wwf.cmp.feat.adhesive" },
  { key: "removable", labelKey: "wwf.cmp.feat.removable" },
  { key: "outdoor", labelKey: "wwf.cmp.feat.outdoor" },
  { key: "bestFor", labelKey: "wwf.cmp.feat.bestFor" },
  { key: "notFor", labelKey: "wwf.cmp.feat.notFor" },
];

/* ========================================================================
 * PRODUCT SECTIONS \u2014 the 5 sections of the category page grid.
 * ======================================================================== */
export const WWF_SECTIONS = [
  {
    key: "window-decals-films",
    titleKey: "wwf.section.window.title",
    subtitleKey: "wwf.section.window.subtitle",
    items: [
      { key: "one-way-vision", href: `${BASE}/one-way-vision`, gradient: "from-sky-400 to-blue-400" },
      { key: "frosted-window-film", href: `${BASE}/frosted-window-film`, gradient: "from-slate-300 to-blue-200" },
      { key: "static-cling", href: `${BASE}/static-cling`, gradient: "from-cyan-400 to-teal-400" },
      { key: "transparent-color-film", href: `${BASE}/transparent-color-film`, gradient: "from-violet-400 to-fuchsia-400" },
      { key: "blockout-vinyl", href: `${BASE}/blockout-vinyl`, gradient: "from-gray-500 to-slate-600" },
      { key: "opaque-window-graphics", href: `${BASE}/opaque-window-graphics`, gradient: "from-indigo-400 to-blue-400" },
      { key: "glass-waistline", href: `${BASE}/glass-waistline`, gradient: "from-amber-300 to-orange-300" },
    ],
  },
  {
    key: "wall",
    titleKey: "wwf.section.wall.title",
    subtitleKey: "wwf.section.wall.subtitle",
    items: [
      { key: "wall-graphics", href: `${BASE}/wall-graphics`, gradient: "from-emerald-400 to-teal-400" },
    ],
  },
  {
    key: "floor",
    titleKey: "wwf.section.floor.title",
    subtitleKey: "wwf.section.floor.subtitle",
    items: [
      { key: "floor-graphics", href: `${BASE}/floor-graphics`, gradient: "from-orange-400 to-red-400" },
    ],
  },
  {
    key: "custom-decals",
    titleKey: "wwf.section.customDecals.title",
    subtitleKey: "wwf.section.customDecals.subtitle",
    items: [
      { key: "decals", href: `${BASE}/decals`, gradient: "from-rose-400 to-pink-400" },
    ],
  },
  {
    key: "related-banners",
    titleKey: "wwf.section.relatedBanners.title",
    subtitleKey: "wwf.section.relatedBanners.subtitle",
    items: [
      { key: "vinyl-banners", href: "/shop/banners-displays/vinyl-banners", gradient: "from-sky-400 to-blue-400" },
      { key: "telescopic-backdrop", href: "/shop/banners-displays/telescopic-backdrop", gradient: "from-violet-400 to-purple-400" },
    ],
  },
];

/* ========================================================================
 * I18N MAPS \u2014 slug \u2192 i18n key lookups
 * ======================================================================== */
export const ITEM_I18N = {
  "one-way-vision": "wwf.item.oneWayVision",
  "frosted-window-film": "wwf.item.frostedFilm",
  "static-cling": "wwf.item.staticCling",
  "transparent-color-film": "wwf.item.transparentColor",
  "blockout-vinyl": "wwf.item.blockoutVinyl",
  "opaque-window-graphics": "wwf.item.opaqueGraphics",
  "glass-waistline": "wwf.item.glassWaistline",
  "wall-graphics": "wwf.item.wallGraphics",
  "floor-graphics": "wwf.item.floorGraphics",
  "decals": "wwf.item.customDecals",
  "vinyl-banners": "wwf.item.vinylBanners",
  "telescopic-backdrop": "wwf.item.displayBackdrop",
};

export const TAGLINE_KEYS = {
  "one-way-vision": "wwf.tagline.oneWayVision",
  "frosted-window-film": "wwf.tagline.frostedFilm",
  "static-cling": "wwf.tagline.staticCling",
  "transparent-color-film": "wwf.tagline.transparentColor",
  "blockout-vinyl": "wwf.tagline.blockoutVinyl",
  "opaque-window-graphics": "wwf.tagline.opaqueGraphics",
  "glass-waistline": "wwf.tagline.glassWaistline",
  "wall-graphics": "wwf.tagline.wallGraphics",
  "floor-graphics": "wwf.tagline.floorGraphics",
  "decals": "wwf.tagline.customDecals",
  "vinyl-banners": "wwf.tagline.vinylBanners",
  "telescopic-backdrop": "wwf.tagline.telescopicBackdrop",
};

export const CUES = {
  "one-way-vision": ["cue.privacy", "cue.outdoor"],
  "frosted-window-film": ["cue.privacy", "cue.decorative"],
  "static-cling": ["cue.noAdhesive", "cue.removable"],
  "transparent-color-film": ["cue.decorative"],
  "blockout-vinyl": ["cue.opaque", "cue.privacy"],
  "opaque-window-graphics": ["cue.fullColor", "cue.outdoor"],
  "glass-waistline": ["cue.safety"],
  "wall-graphics": ["cue.indoor", "cue.fullColor"],
  "floor-graphics": ["cue.antiSlip", "cue.indoor"],
  "decals": ["cue.outdoor", "cue.customShape"],
  "vinyl-banners": ["cue.outdoor", "cue.durable"],
  "telescopic-backdrop": ["cue.portable", "cue.event"],
};

/* ========================================================================
 * VALUE PROPS \u2014 "Why choose La Lunar for surface graphics?"
 * ======================================================================== */
export const WWF_VALUE_PROPS = [
  {
    icon: "\uD83D\uDD27",
    titleKey: "wwf.vp1.title",
    descKey: "wwf.vp1.desc",
  },
  {
    icon: "\u2600\uFE0F",
    titleKey: "wwf.vp2.title",
    descKey: "wwf.vp2.desc",
  },
  {
    icon: "\uD83D\uDCCF",
    titleKey: "wwf.vp3.title",
    descKey: "wwf.vp3.desc",
    ctaKey: "nav.getQuote",
    ctaHref: "/quote",
  },
];

/* ========================================================================
 * USE CASES \u2014 light supplement at bottom (linked to products)
 * ======================================================================== */
export const WWF_USE_CASES = [
  { key: "retail", icon: "\uD83D\uDED2", titleKey: "wwf.uc.retail.title", descKey: "wwf.uc.retail.desc", href: `${BASE}/one-way-vision` },
  { key: "medical", icon: "\uD83C\uDFE5", titleKey: "wwf.uc.medical.title", descKey: "wwf.uc.medical.desc", href: `${BASE}/frosted-window-film` },
  { key: "restaurant", icon: "\uD83C\uDF7D\uFE0F", titleKey: "wwf.uc.restaurant.title", descKey: "wwf.uc.restaurant.desc", href: `${BASE}/opaque-window-graphics` },
  { key: "corporate", icon: "\uD83C\uDFE2", titleKey: "wwf.uc.corporate.title", descKey: "wwf.uc.corporate.desc", href: `${BASE}/wall-graphics` },
  { key: "warehouse", icon: "\uD83C\uDFED", titleKey: "wwf.uc.warehouse.title", descKey: "wwf.uc.warehouse.desc", href: `${BASE}/floor-graphics` },
  { key: "seasonal", icon: "\uD83C\uDF84", titleKey: "wwf.uc.seasonal.title", descKey: "wwf.uc.seasonal.desc", href: `${BASE}/static-cling` },
];

/* ========================================================================
 * CROSS-LINKS \u2014 related categories with clear reasons
 * ======================================================================== */
export const WWF_CROSS_LINKS = [
  { titleKey: "wwf.cross.signs", descKey: "wwf.cross.signsDesc", href: "/shop/signs-rigid-boards" },
  { titleKey: "wwf.cross.banners", descKey: "wwf.cross.bannersDesc", href: "/shop/banners-displays" },
  { titleKey: "wwf.cross.vehicle", descKey: "wwf.cross.vehicleDesc", href: "/shop/vehicle-graphics-fleet" },
];

/* ========================================================================
 * ENRICHMENT \u2014 transform section items into product-shaped objects
 * for the shared ProductCard component.
 * ======================================================================== */

/**
 * Convert a WWF section item + runtime data into a product object
 * consumable by the shared ProductCard.
 *
 * @param {object} item       — { key, href, gradient }
 * @param {object} opts
 * @param {object} opts.prices — wwfPrices map (slug \u2192 number)
 * @param {object} opts.images — wwfImages map (slug \u2192 url)
 * @param {Function} opts.t   — translation function
 * @returns {{ product, imageSrc, hoverImageSrc, tags, href, gradientFallback }}
 */
export function enrichWwfItem(item, { prices, images, images2, t }) {
  const product = {
    slug: item.key,
    name: t(ITEM_I18N[item.key] || item.key),
    description: TAGLINE_KEYS[item.key] ? t(TAGLINE_KEYS[item.key]) : "",
    fromPrice: prices[item.key] || 0,
    category: "windows-walls-floors",
  };
  const tags = (CUES[item.key] || []).map((c) => t(c));
  return {
    product,
    imageSrc: images[item.key],
    hoverImageSrc: images2?.[item.key],
    tags,
    href: item.href,
    gradientFallback: item.gradient,
  };
}
