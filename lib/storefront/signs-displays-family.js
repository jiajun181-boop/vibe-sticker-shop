/**
 * Signs + Banners \u2014 unified family data.
 *
 * Both SignsCategoryClient and BannersCategoryClient import from here
 * so comparison, browse-by-need, value props, and product enrichment
 * are consistent across the two pages.
 */

const SIGNS_BASE = "/shop/signs-rigid-boards";
const BANNERS_BASE = "/shop/banners-displays";

/* \u2500\u2500 Comparison: signs vs banners \u2014 which is right for you? \u2500\u2500 */
export const SIGNS_FAMILY_COMPARISON_COLUMNS = [
  {
    key: "coroplast",
    nameKey: "storefront.signs.cmp.coroplast",
    taglineKey: "storefront.signs.cmp.tagline.coroplast",
    href: `${SIGNS_BASE}/coroplast-signs`,
    need: "outdoor",
    popular: true,
    features: {
      material: "storefront.signs.cmp.mat.coroplast",
      durability: "storefront.signs.cmp.dur.coroplast",
      indoor: true,
      outdoor: true,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.coroplast",
      notFor: "storefront.signs.cmp.notFor.coroplast",
    },
  },
  {
    key: "foamBoard",
    nameKey: "storefront.signs.cmp.foamBoard",
    taglineKey: "storefront.signs.cmp.tagline.foamBoard",
    href: `${SIGNS_BASE}/foam-board-prints`,
    need: "indoor",
    features: {
      material: "storefront.signs.cmp.mat.foam",
      durability: "storefront.signs.cmp.dur.foam",
      indoor: true,
      outdoor: false,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.foam",
      notFor: "storefront.signs.cmp.notFor.foam",
    },
  },
  {
    key: "vinylBanner",
    nameKey: "storefront.signs.cmp.vinylBanner",
    taglineKey: "storefront.signs.cmp.tagline.vinylBanner",
    href: `${BANNERS_BASE}/vinyl-banners`,
    need: "events",
    features: {
      material: "storefront.signs.cmp.mat.vinyl",
      durability: "storefront.signs.cmp.dur.vinyl",
      indoor: true,
      outdoor: true,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.vinyl",
      notFor: "storefront.signs.cmp.notFor.vinyl",
    },
  },
  {
    key: "rollUp",
    nameKey: "storefront.signs.cmp.rollUp",
    taglineKey: "storefront.signs.cmp.tagline.rollUp",
    href: `${BANNERS_BASE}/roll-up-banners`,
    need: "retail",
    features: {
      material: "storefront.signs.cmp.mat.rollUp",
      durability: "storefront.signs.cmp.dur.rollUp",
      indoor: true,
      outdoor: false,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.rollUp",
      notFor: "storefront.signs.cmp.notFor.rollUp",
    },
  },
  {
    key: "backdrop",
    nameKey: "storefront.signs.cmp.backdrop",
    taglineKey: "storefront.signs.cmp.tagline.backdrop",
    href: `${BANNERS_BASE}/telescopic-backdrop`,
    need: "tradeshow",
    features: {
      material: "storefront.signs.cmp.mat.backdrop",
      durability: "storefront.signs.cmp.dur.backdrop",
      indoor: true,
      outdoor: false,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.backdrop",
      notFor: "storefront.signs.cmp.notFor.backdrop",
    },
  },
  {
    key: "featherFlag",
    nameKey: "storefront.signs.cmp.featherFlag",
    taglineKey: "storefront.signs.cmp.tagline.featherFlag",
    href: `${BANNERS_BASE}/feather-flags`,
    need: "outdoor",
    features: {
      material: "storefront.signs.cmp.mat.featherFlag",
      durability: "storefront.signs.cmp.dur.featherFlag",
      indoor: false,
      outdoor: true,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.featherFlag",
      notFor: "storefront.signs.cmp.notFor.featherFlag",
    },
  },
];

export const SIGNS_FAMILY_COMPARISON_FEATURES = [
  { key: "material", labelKey: "storefront.signs.cmp.feat.material" },
  { key: "durability", labelKey: "storefront.signs.cmp.feat.durability" },
  { key: "indoor", labelKey: "storefront.signs.cmp.feat.indoor" },
  { key: "outdoor", labelKey: "storefront.signs.cmp.feat.outdoor" },
  { key: "portable", labelKey: "storefront.signs.cmp.feat.portable" },
  { key: "bestFor", labelKey: "storefront.signs.cmp.feat.bestFor" },
  { key: "notFor", labelKey: "storefront.signs.cmp.feat.notFor" },
];

/* \u2500\u2500 Browse by Need: signs page \u2014 scroll to sections \u2500\u2500 */
export const SIGNS_BROWSE_CASES = [
  { key: "outdoor", icon: "\uD83C\uDF1E", titleKey: "storefront.signsFamily.browse.outdoor.title", descKey: "storefront.signsFamily.browse.outdoor.desc", action: "scroll:outdoor-business-signs" },
  { key: "realEstate", icon: "\uD83C\uDFE0", titleKey: "storefront.signsFamily.browse.realEstate.title", descKey: "storefront.signsFamily.browse.realEstate.desc", action: "scroll:outdoor-business-signs" },
  { key: "events", icon: "\uD83D\uDDBC\uFE0F", titleKey: "storefront.signsFamily.browse.events.title", descKey: "storefront.signsFamily.browse.events.desc", action: "scroll:events-weddings" },
  { key: "indoor", icon: "\uD83C\uDFE2", titleKey: "storefront.signsFamily.browse.indoor.title", descKey: "storefront.signsFamily.browse.indoor.desc", action: "scroll:boards-material" },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.signsFamily.browse.tradeshow.title", descKey: "storefront.signsFamily.browse.tradeshow.desc", href: `${BANNERS_BASE}#banners-tradeshow` },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.signsFamily.browse.retail.title", descKey: "storefront.signsFamily.browse.retail.desc", href: `${BANNERS_BASE}#banners-stands` },
];

/* \u2500\u2500 Browse by Need: banners page \u2014 scroll to sections \u2500\u2500 */
export const BANNERS_BROWSE_CASES = [
  { key: "events", icon: "\uD83C\uDF89", titleKey: "storefront.signsFamily.browse.events.title", descKey: "storefront.signsFamily.browse.events.desc", action: "scroll:banners-outdoor" },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.signsFamily.browse.retail.title", descKey: "storefront.signsFamily.browse.retail.desc", action: "scroll:banners-stands" },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.signsFamily.browse.tradeshow.title", descKey: "storefront.signsFamily.browse.tradeshow.desc", action: "scroll:banners-tradeshow" },
  { key: "outdoor", icon: "\uD83C\uDF1E", titleKey: "storefront.signsFamily.browse.flagsOutdoor.title", descKey: "storefront.signsFamily.browse.flagsOutdoor.desc", action: "scroll:banners-flags" },
  { key: "rigid", icon: "\uD83E\uDEA7", titleKey: "storefront.signsFamily.browse.needRigid.title", descKey: "storefront.signsFamily.browse.needRigid.desc", href: SIGNS_BASE },
  { key: "realEstate", icon: "\uD83C\uDFE0", titleKey: "storefront.signsFamily.browse.realEstate.title", descKey: "storefront.signsFamily.browse.realEstate.desc", href: SIGNS_BASE },
];

/* \u2500\u2500 Use cases (light supplement for bottom of page) \u2500\u2500 */
export const SIGNS_FAMILY_USE_CASES = [
  { key: "realEstate", icon: "\uD83C\uDFE0", titleKey: "storefront.signs.uc.realEstate.title", descKey: "storefront.signs.uc.realEstate.desc", href: `${SIGNS_BASE}/real-estate-sign` },
  { key: "events", icon: "\uD83D\uDC92", titleKey: "storefront.signs.uc.events.title", descKey: "storefront.signs.uc.events.desc", href: `${SIGNS_BASE}/selfie-frame-board` },
  { key: "retail", icon: "\uD83C\uDFEA", titleKey: "storefront.signs.uc.retail.title", descKey: "storefront.signs.uc.retail.desc", href: `${BANNERS_BASE}/roll-up-banners` },
  { key: "construction", icon: "\uD83D\uDEA7", titleKey: "storefront.signs.uc.construction.title", descKey: "storefront.signs.uc.construction.desc", href: `${SIGNS_BASE}/construction-site-signs` },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.signs.uc.tradeshow.title", descKey: "storefront.signs.uc.tradeshow.desc", href: `${BANNERS_BASE}/telescopic-backdrop` },
  { key: "community", icon: "\uD83D\uDDF3\uFE0F", titleKey: "storefront.signs.uc.community.title", descKey: "storefront.signs.uc.community.desc", href: `${SIGNS_BASE}/election-signs` },
];

/* \u2500\u2500 Value props (unified for signs + banners) \u2500\u2500 */
export const SIGNS_FAMILY_VALUE_PROPS = [
  { icon: "\uD83C\uDF27\uFE0F", titleKey: "storefront.signsFamily.vp.weatherproof.title", descKey: "storefront.signsFamily.vp.weatherproof.desc" },
  { icon: "\u26A1", titleKey: "storefront.signsFamily.vp.fast.title", descKey: "storefront.signsFamily.vp.fast.desc" },
  { icon: "\uD83D\uDCD0", titleKey: "storefront.signsFamily.vp.customSize.title", descKey: "storefront.signsFamily.vp.customSize.desc" },
];

/* \u2500\u2500 Cross-link data \u2014 explicit reasons, not just "also explore" \u2500\u2500 */
export const SIGNS_CROSS_LINKS = [
  {
    icon: "\uD83C\uDFAA",
    titleKey: "storefront.signsFamily.crossLink.banners",
    descKey: "storefront.signsFamily.crossLink.bannersDesc",
    href: BANNERS_BASE,
    reasonKey: "storefront.signsFamily.crossReason.toBanners",
  },
];

export const BANNERS_CROSS_LINKS = [
  {
    icon: "\uD83E\uDEA7",
    titleKey: "storefront.signsFamily.crossLink.signs",
    descKey: "storefront.signsFamily.crossLink.signsDesc",
    href: SIGNS_BASE,
    reasonKey: "storefront.signsFamily.crossReason.toSigns",
  },
];

/* \u2500\u2500 Banners & Displays: item i18n + sections \u2500\u2500 */
export const BANNERS_ITEM_I18N = {
  "vinyl-banners": "bd.item.vinylBanners",
  "mesh-banners": "bd.item.meshBanners",
  "pole-banners": "bd.item.poleBanners",
  "double-sided-banners": "bd.item.doubleSided",
  "roll-up-banners": "bd.item.rollUp",
  "x-banner-frame-print": "bd.item.xBanner",
  "tabletop-x-banner": "bd.item.tabletopX",
  "deluxe-tabletop-retractable-a3": "bd.item.tabletopRetractable",
  "telescopic-backdrop": "bd.item.telescopic",
  "popup-display-curved-8ft": "bd.item.popupDisplay",
  "table-cloth": "bd.item.tableCloth",
  "feather-flags": "bd.item.featherFlags",
  "teardrop-flags": "bd.item.teardropFlags",
  "outdoor-canopy-tent-10x10": "bd.item.canopyTent",
};

export const BANNERS_SECTIONS = [
  {
    key: "banners",
    id: "banners-outdoor",
    titleKey: "bd.section.banners.title",
    subtitleKey: "bd.section.banners.subtitle",
    size: "large",
    items: [
      { key: "vinyl-banners", href: `${BANNERS_BASE}/vinyl-banners`, gradient: "from-rose-400 to-pink-400" },
      { key: "mesh-banners", href: `${BANNERS_BASE}/mesh-banners`, gradient: "from-sky-400 to-cyan-400" },
      { key: "pole-banners", href: `${BANNERS_BASE}/pole-banners`, gradient: "from-amber-400 to-orange-400" },
      { key: "double-sided-banners", href: `${BANNERS_BASE}/double-sided-banners`, gradient: "from-violet-400 to-fuchsia-400" },
    ],
  },
  {
    key: "stands",
    id: "banners-stands",
    titleKey: "bd.section.stands.title",
    subtitleKey: "bd.section.stands.subtitle",
    size: "medium",
    items: [
      { key: "roll-up-banners", href: `${BANNERS_BASE}/roll-up-banners`, gradient: "from-emerald-400 to-teal-400" },
      { key: "x-banner-frame-print", href: `${BANNERS_BASE}/x-banner-frame-print`, gradient: "from-indigo-400 to-blue-400" },
      { key: "tabletop-x-banner", href: `${BANNERS_BASE}/tabletop-x-banner`, gradient: "from-pink-400 to-rose-400" },
      { key: "deluxe-tabletop-retractable-a3", href: `${BANNERS_BASE}/deluxe-tabletop-retractable-a3`, gradient: "from-amber-400 to-yellow-400" },
    ],
  },
  {
    key: "tradeshow",
    id: "banners-tradeshow",
    titleKey: "bd.section.tradeshow.title",
    subtitleKey: "bd.section.tradeshow.subtitle",
    size: "medium",
    items: [
      { key: "telescopic-backdrop", href: `${BANNERS_BASE}/telescopic-backdrop`, gradient: "from-slate-400 to-gray-400" },
      { key: "popup-display-curved-8ft", href: `${BANNERS_BASE}/popup-display-curved-8ft`, gradient: "from-blue-400 to-indigo-400" },
      { key: "table-cloth", href: `${BANNERS_BASE}/table-cloth`, gradient: "from-teal-400 to-cyan-400" },
    ],
  },
  {
    key: "outdoor",
    id: "banners-flags",
    titleKey: "bd.section.outdoor.title",
    subtitleKey: "bd.section.outdoor.subtitle",
    size: "medium",
    items: [
      { key: "feather-flags", href: `${BANNERS_BASE}/feather-flags`, gradient: "from-orange-400 to-red-400" },
      { key: "teardrop-flags", href: `${BANNERS_BASE}/teardrop-flags`, gradient: "from-cyan-400 to-sky-400" },
      { key: "outdoor-canopy-tent-10x10", href: `${BANNERS_BASE}/outdoor-canopy-tent-10x10`, gradient: "from-emerald-400 to-green-400" },
    ],
  },
];

/* \u2500\u2500 Product enrichment for signs \u2500\u2500 */
const SIGNS_PRODUCT_BADGES = {
  "real-estate-sign": { labelKey: "shop.bestSeller", color: "bg-orange-100 text-orange-700" },
  "yard-sign": { labelKey: "shop.sameDayAvailable", color: "bg-emerald-100 text-emerald-700" },
};

const SIGNS_SIMPLE_ADD_SLUGS = new Set(["h-stakes", "real-estate-frame"]);

/**
 * Enrich a signs product with badge and ctaKey based on slug.
 * Called from page.js before passing products to SignsCategoryClient.
 */
export function enrichSignsProduct(product, t) {
  const badgeCfg = SIGNS_PRODUCT_BADGES[product.slug];
  const badge = badgeCfg ? { label: t(badgeCfg.labelKey), color: badgeCfg.color } : undefined;
  const ctaKey = SIGNS_SIMPLE_ADD_SLUGS.has(product.slug) ? "shop.addToCart" : undefined;
  return { ...product, ...(badge && { badge }), ...(ctaKey && { ctaKey }) };
}
