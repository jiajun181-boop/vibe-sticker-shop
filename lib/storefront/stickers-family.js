/**
 * Stickers, Labels & Decals \u2014 family shared config.
 *
 * All product data, comparison, browse-by-need, use cases, value props,
 * and product enrichment for the stickers-labels-decals family.
 * StickersCategoryClient imports this and only handles rendering + filter state.
 */

const BASE = "/shop/stickers-labels-decals";

/* \u2500\u2500 Core sticker products (whitelist, in display order) \u2500\u2500 */
export const STICKERS_CORE_SLUGS = [
  "die-cut-stickers",
  "kiss-cut-stickers",
  "sticker-sheets",
  "kiss-cut-sticker-sheets",
  "roll-labels",
  "vinyl-lettering",
];
export const STICKERS_CORE_SET = new Set(STICKERS_CORE_SLUGS);
export const STICKERS_CORE_ORDER = new Map(STICKERS_CORE_SLUGS.map((s, i) => [s, i]));

/* \u2500\u2500 Slug \u2192 filter tag mapping \u2500\u2500 */
export const STICKERS_SLUG_TAG = {
  "die-cut-stickers": "stickers",
  "kiss-cut-stickers": "stickers",
  "sticker-sheets": "sheets",
  "kiss-cut-sticker-sheets": "sheets",
  "roll-labels": "roll-labels",
  "vinyl-lettering": "lettering",
};

/* \u2500\u2500 Filter tabs \u2500\u2500 */
export const STICKERS_FILTER_TABS = [
  { id: "all", key: "stickerCat.filter.all" },
  { id: "stickers", key: "stickerCat.filter.stickers" },
  { id: "sheets", key: "stickerCat.filter.sheets" },
  { id: "roll-labels", key: "stickerCat.filter.rollLabels" },
  { id: "lettering", key: "stickerCat.filter.lettering" },
];

/* \u2500\u2500 Related categories (proper i18n, no hardcoded locale strings) \u2500\u2500 */
export const STICKERS_RELATED = [
  { titleKey: "stickerCat.related.safety.title", descKey: "stickerCat.related.safety.desc", href: `${BASE}/safety-warning-decals` },
  { titleKey: "stickerCat.related.industrial.title", descKey: "stickerCat.related.industrial.desc", href: `${BASE}/industrial-labels` },
  { titleKey: "stickerCat.related.facility.title", descKey: "stickerCat.related.facility.desc", href: `${BASE}/facility-asset-labels` },
];

/* \u2500\u2500 Comparison data (4 main sticker types, enhanced with taglines) \u2500\u2500 */
export const STICKERS_COMPARISON_COLUMNS = [
  {
    key: "die-cut",
    nameKey: "storefront.stickers.cmp.dieCut",
    taglineKey: "storefront.stickers.cmp.tagline.dieCut",
    href: `${BASE}/die-cut-stickers`,
    popular: true,
    features: {
      customShape: true,
      easyPeel: true,
      multiDesign: false,
      bulkPackaging: false,
      waterproof: true,
      bestFor: "storefront.stickers.cmp.bestFor.dieCut",
      minOrder: "storefront.stickers.cmp.min.dieCut",
    },
  },
  {
    key: "kiss-cut",
    nameKey: "storefront.stickers.cmp.kissCut",
    taglineKey: "storefront.stickers.cmp.tagline.kissCut",
    href: `${BASE}/kiss-cut-stickers`,
    features: {
      customShape: true,
      easyPeel: true,
      multiDesign: false,
      bulkPackaging: false,
      waterproof: true,
      bestFor: "storefront.stickers.cmp.bestFor.kissCut",
      minOrder: "storefront.stickers.cmp.min.kissCut",
    },
  },
  {
    key: "sheets",
    nameKey: "storefront.stickers.cmp.sheets",
    taglineKey: "storefront.stickers.cmp.tagline.sheets",
    href: `${BASE}/sticker-sheets`,
    features: {
      customShape: true,
      easyPeel: true,
      multiDesign: true,
      bulkPackaging: false,
      waterproof: true,
      bestFor: "storefront.stickers.cmp.bestFor.sheets",
      minOrder: "storefront.stickers.cmp.min.sheets",
    },
  },
  {
    key: "roll-labels",
    nameKey: "storefront.stickers.cmp.rollLabels",
    taglineKey: "storefront.stickers.cmp.tagline.rollLabels",
    href: `${BASE}/roll-labels`,
    features: {
      customShape: true,
      easyPeel: true,
      multiDesign: false,
      bulkPackaging: true,
      waterproof: true,
      bestFor: "storefront.stickers.cmp.bestFor.rollLabels",
      minOrder: "storefront.stickers.cmp.min.rollLabels",
    },
  },
];

export const STICKERS_COMPARISON_FEATURES = [
  { key: "customShape", labelKey: "storefront.stickers.cmp.feat.customShape" },
  { key: "easyPeel", labelKey: "storefront.stickers.cmp.feat.easyPeel" },
  { key: "multiDesign", labelKey: "storefront.stickers.cmp.feat.multiDesign" },
  { key: "bulkPackaging", labelKey: "storefront.stickers.cmp.feat.bulkPackaging" },
  { key: "waterproof", labelKey: "storefront.stickers.cmp.feat.waterproof" },
  { key: "bestFor", labelKey: "storefront.stickers.cmp.feat.bestFor" },
  { key: "minOrder", labelKey: "storefront.stickers.cmp.feat.minOrder" },
];

/* \u2500\u2500 Browse by Need (strong entry at top) \u2500\u2500 */
export const STICKERS_BROWSE_CASES = [
  { key: "branding", icon: "\uD83C\uDFF7\uFE0F", titleKey: "storefront.stickers.uc.branding.title", descKey: "storefront.stickers.uc.branding.desc", href: `${BASE}/die-cut-stickers` },
  { key: "packaging", icon: "\uD83D\uDCE6", titleKey: "storefront.stickers.uc.packaging.title", descKey: "storefront.stickers.uc.packaging.desc", href: `${BASE}/roll-labels` },
  { key: "events", icon: "\uD83C\uDFAA", titleKey: "storefront.stickers.uc.events.title", descKey: "storefront.stickers.uc.events.desc", href: `${BASE}/kiss-cut-stickers` },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.stickers.uc.retail.title", descKey: "storefront.stickers.uc.retail.desc", href: `${BASE}/sticker-sheets` },
  { key: "vehicles", icon: "\uD83D\uDE97", titleKey: "storefront.stickers.uc.vehicles.title", descKey: "storefront.stickers.uc.vehicles.desc", href: `${BASE}/vinyl-lettering` },
  { key: "safety", icon: "\u26A0\uFE0F", titleKey: "storefront.stickers.uc.safety.title", descKey: "storefront.stickers.uc.safety.desc", href: `${BASE}/safety-warning-decals` },
];

/* \u2500\u2500 Use cases (light supplement at bottom) \u2500\u2500 */
export const STICKERS_USE_CASES = [
  { key: "branding", icon: "\uD83C\uDFF7\uFE0F", titleKey: "storefront.stickers.uc.branding.title", descKey: "storefront.stickers.uc.branding.desc", href: `${BASE}/die-cut-stickers` },
  { key: "packaging", icon: "\uD83D\uDCE6", titleKey: "storefront.stickers.uc.packaging.title", descKey: "storefront.stickers.uc.packaging.desc", href: `${BASE}/roll-labels` },
  { key: "events", icon: "\uD83C\uDFAA", titleKey: "storefront.stickers.uc.events.title", descKey: "storefront.stickers.uc.events.desc", href: `${BASE}/kiss-cut-stickers` },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.stickers.uc.retail.title", descKey: "storefront.stickers.uc.retail.desc", href: `${BASE}/sticker-sheets` },
  { key: "vehicles", icon: "\uD83D\uDE97", titleKey: "storefront.stickers.uc.vehicles.title", descKey: "storefront.stickers.uc.vehicles.desc", href: `${BASE}/vinyl-lettering` },
  { key: "safety", icon: "\u26A0\uFE0F", titleKey: "storefront.stickers.uc.safety.title", descKey: "storefront.stickers.uc.safety.desc", href: `${BASE}/safety-warning-decals` },
];

/* \u2500\u2500 Value props \u2500\u2500 */
export const STICKERS_VALUE_PROPS = [
  { icon: "\uD83D\uDCA7", titleKey: "stickerCat.waterproof", descKey: "stickerCat.waterproofDesc" },
  { icon: "\u26A1", titleKey: "stickerCat.fastTurnaround", descKey: "stickerCat.fastTurnaroundDesc" },
  { icon: "\u2702\uFE0F", titleKey: "stickerCat.anyShape", descKey: "stickerCat.anyShapeDesc", ctaKey: "configurator.requestQuote", ctaHref: "/quote" },
];

/* \u2500\u2500 Product badges via shared config \u2500\u2500 */
const STICKER_BADGES = {
  "die-cut-stickers": "storefront.stickers.badge.popular",
  "roll-labels": "storefront.stickers.badge.highVolume",
  "vinyl-lettering": "storefront.stickers.badge.outdoor",
};

/**
 * Enrich a sticker product with badge from shared config.
 * Called by StickersCategoryClient on each product.
 */
export function enrichStickerProduct(product) {
  const badge = STICKER_BADGES[product.slug];
  if (badge) {
    return { ...product, badge };
  }
  return product;
}
