/**
 * Marketing & Business Print \u2014 family shared config.
 *
 * All sections, comparison, browse-by-need, use cases, and value props
 * for the marketing-business-print family live here.
 * MarketingCategoryClient imports this and only handles rendering.
 */

const BASE = "/shop/marketing-business-print";

/* \u2500\u2500 Item slug \u2192 i18n key map \u2500\u2500 */
export const MARKETING_ITEM_I18N = {
  "business-cards": "mc.item.businessCards",
  "flyers": "mc.item.flyers",
  "brochures": "mc.item.brochures",
  "postcards": "mc.item.postcards",
  "posters": "mc.item.posters",
  "booklets": "mc.item.booklets",
  "letterhead": "mc.item.letterhead",
  "notepads": "mc.item.notepads",
  "stamps": "mc.item.stamps",
  "calendars": "mc.item.calendars",
  "certificates": "mc.item.certificates",
  "envelopes": "mc.item.envelopes",
  "menus": "mc.item.menus",
  "table-tents": "mc.item.tableTents",
  "shelf-displays": "mc.item.shelfDisplays",
  "rack-cards": "mc.item.rackCards",
  "door-hangers": "mc.item.doorHangers",
  "tags": "mc.item.tags",
  "ncr-forms": "mc.item.ncrForms",
  "tickets-coupons": "mc.item.ticketsCoupons",
  "greeting-invitation-cards": "mc.item.greetingCards",
  "bookmarks": "mc.item.bookmarks",
  "loyalty-cards": "mc.item.loyaltyCards",
  "document-printing": "mc.item.documentPrinting",
};

/* \u2500\u2500 Section definitions \u2500\u2500 */
export const MARKETING_SECTIONS = [
  {
    key: "essentials",
    id: "marketing-essentials",
    titleKey: "mc.section.essentials.title",
    subtitleKey: "mc.section.essentials.subtitle",
    items: [
      { key: "business-cards", href: `${BASE}/business-cards`, gradient: "from-amber-400 to-orange-400" },
      { key: "flyers", href: `${BASE}/flyers`, gradient: "from-rose-400 to-pink-400" },
      { key: "brochures", href: `${BASE}/brochures`, gradient: "from-violet-400 to-fuchsia-400" },
      { key: "postcards", href: `${BASE}/postcards`, gradient: "from-sky-400 to-cyan-400" },
      { key: "posters", href: `${BASE}/posters`, gradient: "from-emerald-400 to-teal-400" },
      { key: "booklets", href: `${BASE}/booklets`, gradient: "from-indigo-400 to-blue-400" },
    ],
  },
  {
    key: "corporate",
    id: "marketing-corporate",
    titleKey: "mc.section.corporate.title",
    subtitleKey: "mc.section.corporate.subtitle",
    items: [
      { key: "letterhead", href: `${BASE}/letterhead`, gradient: "from-slate-400 to-gray-400" },
      { key: "notepads", href: `${BASE}/notepads`, gradient: "from-amber-400 to-yellow-400" },
      { key: "stamps", href: `${BASE}/stamps`, gradient: "from-red-400 to-rose-400" },
      { key: "calendars", href: `${BASE}/calendars`, gradient: "from-teal-400 to-cyan-400" },
      { key: "certificates", href: `${BASE}/certificates`, gradient: "from-orange-400 to-amber-400" },
      { key: "magnets-business-card", href: `${BASE}/magnets-business-card`, gradient: "from-blue-400 to-indigo-400" },
    ],
  },
  {
    key: "retail",
    id: "marketing-retail",
    titleKey: "mc.section.retail.title",
    subtitleKey: "mc.section.retail.subtitle",
    items: [
      { key: "menus", href: `${BASE}/menus`, gradient: "from-orange-400 to-red-400" },
      { key: "table-tents", href: `${BASE}/table-tents`, gradient: "from-pink-400 to-fuchsia-400" },
      { key: "shelf-displays", href: `${BASE}/shelf-displays`, gradient: "from-emerald-400 to-green-400" },
      { key: "rack-cards", href: `${BASE}/rack-cards`, gradient: "from-cyan-400 to-sky-400" },
      { key: "door-hangers", href: `${BASE}/door-hangers`, gradient: "from-violet-400 to-purple-400" },
      { key: "tags", href: `${BASE}/tags`, gradient: "from-amber-400 to-orange-400" },
      { key: "tabletop-displays", href: `${BASE}/tabletop-displays`, gradient: "from-teal-400 to-emerald-400" },
      { key: "inserts-packaging", href: `${BASE}/inserts-packaging`, gradient: "from-pink-400 to-rose-400" },
    ],
  },
  {
    key: "forms",
    id: "marketing-forms",
    titleKey: "mc.section.forms.title",
    subtitleKey: "mc.section.forms.subtitle",
    items: [
      { key: "ncr-forms", href: `${BASE}/ncr-forms`, gradient: "from-slate-400 to-zinc-400" },
      { key: "tickets-coupons", href: `${BASE}/tickets-coupons`, gradient: "from-rose-400 to-pink-400" },
      { key: "greeting-invitation-cards", href: `${BASE}/greeting-invitation-cards`, gradient: "from-fuchsia-400 to-pink-400" },
      { key: "bookmarks", href: `${BASE}/bookmarks`, gradient: "from-indigo-400 to-violet-400" },
      { key: "loyalty-cards", href: `${BASE}/loyalty-cards`, gradient: "from-emerald-400 to-teal-400" },
      { key: "document-printing", href: `${BASE}/document-printing`, gradient: "from-gray-400 to-slate-400" },
      { key: "presentation-folders", href: `${BASE}/presentation-folders`, gradient: "from-slate-400 to-blue-400" },
    ],
  },
];

/* \u2500\u2500 Comparison data (4 high-frequency standard products) \u2500\u2500 */
export const MARKETING_COMPARISON_COLUMNS = [
  {
    key: "cards",
    nameKey: "storefront.marketing.cmp.businessCards",
    taglineKey: "storefront.marketing.cmp.tagline.cards",
    href: `${BASE}/business-cards`,
    popular: true,
    features: {
      paperStock: "storefront.marketing.cmp.paper.cards",
      doubleSided: true,
      foldOptions: "storefront.marketing.cmp.folds.none",
      bestFor: "storefront.marketing.cmp.bestFor.cards",
      turnaround: "storefront.marketing.cmp.turn.cards",
    },
  },
  {
    key: "flyers",
    nameKey: "storefront.marketing.cmp.flyers",
    taglineKey: "storefront.marketing.cmp.tagline.flyers",
    href: `${BASE}/flyers`,
    features: {
      paperStock: "storefront.marketing.cmp.paper.flyers",
      doubleSided: true,
      foldOptions: "storefront.marketing.cmp.folds.none",
      bestFor: "storefront.marketing.cmp.bestFor.flyers",
      turnaround: "storefront.marketing.cmp.turn.flyers",
    },
  },
  {
    key: "brochures",
    nameKey: "storefront.marketing.cmp.brochures",
    taglineKey: "storefront.marketing.cmp.tagline.brochures",
    href: `${BASE}/brochures`,
    features: {
      paperStock: "storefront.marketing.cmp.paper.brochures",
      doubleSided: true,
      foldOptions: "storefront.marketing.cmp.folds.brochure",
      bestFor: "storefront.marketing.cmp.bestFor.brochures",
      turnaround: "storefront.marketing.cmp.turn.brochures",
    },
  },
  {
    key: "postcards",
    nameKey: "storefront.marketing.cmp.postcards",
    taglineKey: "storefront.marketing.cmp.tagline.postcards",
    href: `${BASE}/postcards`,
    features: {
      paperStock: "storefront.marketing.cmp.paper.postcards",
      doubleSided: true,
      foldOptions: "storefront.marketing.cmp.folds.none",
      bestFor: "storefront.marketing.cmp.bestFor.postcards",
      turnaround: "storefront.marketing.cmp.turn.postcards",
    },
  },
];

export const MARKETING_COMPARISON_FEATURES = [
  { key: "paperStock", labelKey: "storefront.marketing.cmp.feat.paperStock" },
  { key: "doubleSided", labelKey: "storefront.marketing.cmp.feat.doubleSided" },
  { key: "foldOptions", labelKey: "storefront.marketing.cmp.feat.foldOptions" },
  { key: "bestFor", labelKey: "storefront.marketing.cmp.feat.bestFor" },
  { key: "turnaround", labelKey: "storefront.marketing.cmp.feat.turnaround" },
];

/* \u2500\u2500 Browse by Need (strong entry at top) \u2500\u2500
 * Mix of section scroll targets (#id) and direct product links.
 * BrowseByNeed component handles both via href convention.
 */
export const MARKETING_BROWSE_CASES = [
  { key: "newBiz", icon: "\uD83C\uDFE2", titleKey: "storefront.marketing.uc.newBiz.title", descKey: "storefront.marketing.uc.newBiz.desc", href: "#marketing-essentials" },
  { key: "directMail", icon: "\uD83D\uDCEC", titleKey: "storefront.marketing.uc.directMail.title", descKey: "storefront.marketing.uc.directMail.desc", href: `${BASE}/postcards` },
  { key: "restaurant", icon: "\uD83C\uDF7D\uFE0F", titleKey: "storefront.marketing.uc.restaurant.title", descKey: "storefront.marketing.uc.restaurant.desc", href: `${BASE}/menus` },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.marketing.uc.tradeshow.title", descKey: "storefront.marketing.uc.tradeshow.desc", href: `${BASE}/brochures` },
  { key: "corporate", icon: "\uD83D\uDCBC", titleKey: "storefront.marketing.uc.corporate.title", descKey: "storefront.marketing.uc.corporate.desc", href: "#marketing-corporate" },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.marketing.uc.retail.title", descKey: "storefront.marketing.uc.retail.desc", href: "#marketing-retail" },
];

/* \u2500\u2500 Use cases (light supplement at bottom) \u2500\u2500 */
export const MARKETING_USE_CASES = [
  { key: "newBiz", icon: "\uD83C\uDFE2", titleKey: "storefront.marketing.uc.newBiz.title", descKey: "storefront.marketing.uc.newBiz.desc", href: `${BASE}/business-cards` },
  { key: "directMail", icon: "\uD83D\uDCEC", titleKey: "storefront.marketing.uc.directMail.title", descKey: "storefront.marketing.uc.directMail.desc", href: `${BASE}/postcards` },
  { key: "restaurant", icon: "\uD83C\uDF7D\uFE0F", titleKey: "storefront.marketing.uc.restaurant.title", descKey: "storefront.marketing.uc.restaurant.desc", href: `${BASE}/menus` },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.marketing.uc.tradeshow.title", descKey: "storefront.marketing.uc.tradeshow.desc", href: `${BASE}/brochures` },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.marketing.uc.retail.title", descKey: "storefront.marketing.uc.retail.desc", href: `${BASE}/shelf-displays` },
  { key: "corporate", icon: "\uD83D\uDCBC", titleKey: "storefront.marketing.uc.corporate.title", descKey: "storefront.marketing.uc.corporate.desc", href: `${BASE}/letterhead` },
];

/* \u2500\u2500 Value props \u2500\u2500 */
export const MARKETING_VALUE_PROPS = [
  { icon: "\uD83C\uDFA8", titleKey: "mc.vp1.title", descKey: "mc.vp1.desc" },
  { icon: "\uD83D\uDCE6", titleKey: "mc.vp2.title", descKey: "mc.vp2.desc" },
  { icon: "\uD83D\uDCAC", titleKey: "mc.vp3.title", descKey: "mc.vp3.desc", ctaKey: "shop.contactUs", ctaHref: "/quote" },
];
