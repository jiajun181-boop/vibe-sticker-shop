/**
 * Signs + Banners — unified family data.
 *
 * Both SignsCategoryClient and BannersCategoryClient import from here
 * so comparison, browse-by-need, value props, and product enrichment
 * are consistent across the two pages.
 */

/* ── Comparison: signs vs banners — which is right for you? ── */
export const SIGNS_FAMILY_COMPARISON_COLUMNS = [
  {
    key: "coroplast",
    nameKey: "storefront.signs.cmp.coroplast",
    href: "/shop/signs-rigid-boards/coroplast-signs",
    features: {
      material: "storefront.signs.cmp.mat.coroplast",
      indoor: true,
      outdoor: true,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.coroplast",
      customSize: true,
    },
  },
  {
    key: "foamBoard",
    nameKey: "storefront.signs.cmp.foamBoard",
    href: "/shop/signs-rigid-boards/foam-board-prints",
    features: {
      material: "storefront.signs.cmp.mat.foam",
      indoor: true,
      outdoor: false,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.foam",
      customSize: true,
    },
  },
  {
    key: "vinylBanner",
    nameKey: "storefront.signs.cmp.vinylBanner",
    href: "/shop/banners-displays/vinyl-banners",
    features: {
      material: "storefront.signs.cmp.mat.vinyl",
      indoor: true,
      outdoor: true,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.vinyl",
      customSize: true,
    },
  },
  {
    key: "rollUp",
    nameKey: "storefront.signs.cmp.rollUp",
    href: "/shop/banners-displays/roll-up-banners",
    features: {
      material: "storefront.signs.cmp.mat.rollUp",
      indoor: true,
      outdoor: false,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.rollUp",
      customSize: false,
    },
  },
];

export const SIGNS_FAMILY_COMPARISON_FEATURES = [
  { key: "material", labelKey: "storefront.signs.cmp.feat.material" },
  { key: "indoor", labelKey: "storefront.signs.cmp.feat.indoor" },
  { key: "outdoor", labelKey: "storefront.signs.cmp.feat.outdoor" },
  { key: "portable", labelKey: "storefront.signs.cmp.feat.portable" },
  { key: "bestFor", labelKey: "storefront.signs.cmp.feat.bestFor" },
  { key: "customSize", labelKey: "storefront.signs.cmp.feat.customSize" },
];

/* ── Browse by Need: 6 need-based scenarios spanning both categories ── */
export const SIGNS_FAMILY_BROWSE_CASES = [
  { key: "indoor", icon: "\uD83C\uDFE2", titleKey: "storefront.signsFamily.browse.indoor.title", descKey: "storefront.signsFamily.browse.indoor.desc", href: "/shop/signs-rigid-boards/foam-board-prints" },
  { key: "outdoor", icon: "\uD83C\uDF1E", titleKey: "storefront.signsFamily.browse.outdoor.title", descKey: "storefront.signsFamily.browse.outdoor.desc", href: "/shop/signs-rigid-boards/coroplast-signs" },
  { key: "events", icon: "\uD83C\uDF89", titleKey: "storefront.signsFamily.browse.events.title", descKey: "storefront.signsFamily.browse.events.desc", href: "/shop/banners-displays/vinyl-banners" },
  { key: "realEstate", icon: "\uD83C\uDFE0", titleKey: "storefront.signsFamily.browse.realEstate.title", descKey: "storefront.signsFamily.browse.realEstate.desc", href: "/shop/signs-rigid-boards/real-estate-sign" },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.signsFamily.browse.tradeshow.title", descKey: "storefront.signsFamily.browse.tradeshow.desc", href: "/shop/banners-displays/telescopic-backdrop" },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.signsFamily.browse.retail.title", descKey: "storefront.signsFamily.browse.retail.desc", href: "/shop/banners-displays/roll-up-banners" },
];

/* ── Use cases (light supplement for bottom of page) ── */
export const SIGNS_FAMILY_USE_CASES = [
  { key: "realEstate", icon: "\uD83C\uDFE0", titleKey: "storefront.signs.uc.realEstate.title", descKey: "storefront.signs.uc.realEstate.desc", href: "/shop/signs-rigid-boards/real-estate-sign" },
  { key: "events", icon: "\uD83D\uDC92", titleKey: "storefront.signs.uc.events.title", descKey: "storefront.signs.uc.events.desc", href: "/shop/signs-rigid-boards/selfie-frame-board" },
  { key: "retail", icon: "\uD83C\uDFEA", titleKey: "storefront.signs.uc.retail.title", descKey: "storefront.signs.uc.retail.desc", href: "/shop/banners-displays/roll-up-banners" },
  { key: "construction", icon: "\uD83D\uDEA7", titleKey: "storefront.signs.uc.construction.title", descKey: "storefront.signs.uc.construction.desc", href: "/shop/signs-rigid-boards/construction-site-signs" },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.signs.uc.tradeshow.title", descKey: "storefront.signs.uc.tradeshow.desc", href: "/shop/banners-displays/telescopic-backdrop" },
  { key: "community", icon: "\uD83D\uDDF3\uFE0F", titleKey: "storefront.signs.uc.community.title", descKey: "storefront.signs.uc.community.desc", href: "/shop/signs-rigid-boards/election-signs" },
];

/* ── Value props (unified for signs + banners) ── */
export const SIGNS_FAMILY_VALUE_PROPS = [
  { icon: "\uD83C\uDF27\uFE0F", titleKey: "storefront.signsFamily.vp.weatherproof.title", descKey: "storefront.signsFamily.vp.weatherproof.desc" },
  { icon: "\u26A1", titleKey: "storefront.signsFamily.vp.fast.title", descKey: "storefront.signsFamily.vp.fast.desc" },
  { icon: "\uD83D\uDCD0", titleKey: "storefront.signsFamily.vp.customSize.title", descKey: "storefront.signsFamily.vp.customSize.desc" },
];

/* ── Product enrichment for signs ── */
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
