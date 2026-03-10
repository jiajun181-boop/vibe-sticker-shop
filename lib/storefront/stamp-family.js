/**
 * Stamps \u2014 unified family data.
 *
 * Extracted so StampFamilyClient stays thin.
 * All shared config (browse-by-need, comparison, sections, value props,
 * use cases, cross-links) lives here.
 *
 * Products: 8 standard models (4 rect + 4 round) + 3 personalized presets.
 * All in marketing-business-print category, priced per piece (fixed basePrice).
 */

const BASE = "/shop/marketing-business-print";

/* ========================================================================
 * BROWSE BY NEED \u2014 6 scenarios answering "What kind of stamp do you need?"
 * Users choose by PURPOSE, not by model number.
 * ======================================================================== */
export const STAMP_BROWSE_CASES = [
  {
    key: "office",
    icon: "\uD83C\uDFE2",
    titleKey: "stf.browse.office.title",
    descKey: "stf.browse.office.desc",
    href: `${BASE}/stamps-s827`,
  },
  {
    key: "approval",
    icon: "\u2705",
    titleKey: "stf.browse.approval.title",
    descKey: "stf.browse.approval.desc",
    href: `${BASE}/stamps-s520`,
  },
  {
    key: "address",
    icon: "\uD83D\uDCEC",
    titleKey: "stf.browse.address.title",
    descKey: "stf.browse.address.desc",
    href: `${BASE}/stamps-s542`,
  },
  {
    key: "logo",
    icon: "\uD83D\uDD16",
    titleKey: "stf.browse.logo.title",
    descKey: "stf.browse.logo.desc",
    href: `${BASE}/stamps-r532`,
  },
  {
    key: "fun",
    icon: "\uD83D\uDE04",
    titleKey: "stf.browse.fun.title",
    descKey: "stf.browse.fun.desc",
    href: `${BASE}/funny-approval-stamp`,
  },
  {
    key: "signature",
    icon: "\u270D\uFE0F",
    titleKey: "stf.browse.signature.title",
    descKey: "stf.browse.signature.desc",
    href: `${BASE}/stamps-s827`,
  },
];

/* ========================================================================
 * COMPARISON TABLE \u2014 "Which stamp size is right for you?"
 *
 * Answers: small rect vs standard rect vs large rect vs small round
 * vs large round. Each has text-line capacity, logo support, best-for.
 * ======================================================================== */
export const STAMP_COMPARISON_COLUMNS = [
  {
    key: "smallRect",
    nameKey: "stf.cmp.smallRect",
    taglineKey: "stf.cmp.tagline.smallRect",
    href: `${BASE}/stamps-s520`,
    need: "approval",
    features: {
      size: "stf.cmp.size.smallRect",
      textLines: "stf.cmp.lines.smallRect",
      logoSupport: false,
      curvedText: false,
      bestFor: "stf.cmp.bestFor.smallRect",
      notFor: "stf.cmp.notFor.smallRect",
    },
  },
  {
    key: "standardRect",
    nameKey: "stf.cmp.standardRect",
    taglineKey: "stf.cmp.tagline.standardRect",
    href: `${BASE}/stamps-s827`,
    need: "office",
    popular: true,
    features: {
      size: "stf.cmp.size.standardRect",
      textLines: "stf.cmp.lines.standardRect",
      logoSupport: true,
      curvedText: false,
      bestFor: "stf.cmp.bestFor.standardRect",
      notFor: "stf.cmp.notFor.standardRect",
    },
  },
  {
    key: "largeRect",
    nameKey: "stf.cmp.largeRect",
    taglineKey: "stf.cmp.tagline.largeRect",
    href: `${BASE}/stamps-s542`,
    need: "address",
    features: {
      size: "stf.cmp.size.largeRect",
      textLines: "stf.cmp.lines.largeRect",
      logoSupport: true,
      curvedText: false,
      bestFor: "stf.cmp.bestFor.largeRect",
      notFor: "stf.cmp.notFor.largeRect",
    },
  },
  {
    key: "smallRound",
    nameKey: "stf.cmp.smallRound",
    taglineKey: "stf.cmp.tagline.smallRound",
    href: `${BASE}/stamps-r524`,
    need: "logo",
    features: {
      size: "stf.cmp.size.smallRound",
      textLines: "stf.cmp.lines.smallRound",
      logoSupport: true,
      curvedText: true,
      bestFor: "stf.cmp.bestFor.smallRound",
      notFor: "stf.cmp.notFor.smallRound",
    },
  },
  {
    key: "largeRound",
    nameKey: "stf.cmp.largeRound",
    taglineKey: "stf.cmp.tagline.largeRound",
    href: `${BASE}/stamps-r552`,
    need: "logo",
    features: {
      size: "stf.cmp.size.largeRound",
      textLines: "stf.cmp.lines.largeRound",
      logoSupport: true,
      curvedText: true,
      bestFor: "stf.cmp.bestFor.largeRound",
      notFor: "stf.cmp.notFor.largeRound",
    },
  },
];

export const STAMP_COMPARISON_FEATURES = [
  { key: "size", labelKey: "stf.cmp.feat.size" },
  { key: "textLines", labelKey: "stf.cmp.feat.textLines" },
  { key: "logoSupport", labelKey: "stf.cmp.feat.logoSupport" },
  { key: "curvedText", labelKey: "stf.cmp.feat.curvedText" },
  { key: "bestFor", labelKey: "stf.cmp.feat.bestFor" },
  { key: "notFor", labelKey: "stf.cmp.feat.notFor" },
];

/* ========================================================================
 * PRODUCT SECTIONS \u2014 3 groups on the family page
 * ======================================================================== */
export const STAMP_SECTIONS = [
  {
    key: "rectangular",
    titleKey: "stf.section.rect.title",
    subtitleKey: "stf.section.rect.subtitle",
    slugs: ["stamps-s510", "stamps-s520", "stamps-s827", "stamps-s542"],
  },
  {
    key: "round",
    titleKey: "stf.section.round.title",
    subtitleKey: "stf.section.round.subtitle",
    slugs: ["stamps-r512", "stamps-r524", "stamps-r532", "stamps-r552"],
  },
  {
    key: "personalized",
    titleKey: "stf.section.personalized.title",
    subtitleKey: "stf.section.personalized.subtitle",
    slugs: ["funny-approval-stamp", "custom-face-stamp", "book-name-stamp"],
  },
];

/* ========================================================================
 * VALUE PROPS \u2014 "Why choose La Lunar for stamps?"
 * ======================================================================== */
export const STAMP_VALUE_PROPS = [
  {
    icon: "\uD83D\uDD0B",
    titleKey: "stf.vp.inkPad.title",
    descKey: "stf.vp.inkPad.desc",
  },
  {
    icon: "\u26A1",
    titleKey: "stf.vp.laserEngraved.title",
    descKey: "stf.vp.laserEngraved.desc",
  },
  {
    icon: "\uD83C\uDFA8",
    titleKey: "stf.vp.livePreview.title",
    descKey: "stf.vp.livePreview.desc",
  },
];

/* ========================================================================
 * USE CASES \u2014 light supplement at bottom
 * ======================================================================== */
export const STAMP_USE_CASES = [
  { key: "smallBiz", icon: "\uD83C\uDFEA", titleKey: "stf.uc.smallBiz.title", descKey: "stf.uc.smallBiz.desc", href: `${BASE}/stamps-s827` },
  { key: "legal", icon: "\u2696\uFE0F", titleKey: "stf.uc.legal.title", descKey: "stf.uc.legal.desc", href: `${BASE}/stamps-r552` },
  { key: "warehouse", icon: "\uD83D\uDCE6", titleKey: "stf.uc.warehouse.title", descKey: "stf.uc.warehouse.desc", href: `${BASE}/stamps-s520` },
  { key: "teacher", icon: "\uD83C\uDF4E", titleKey: "stf.uc.teacher.title", descKey: "stf.uc.teacher.desc", href: `${BASE}/funny-approval-stamp` },
  { key: "bookLover", icon: "\uD83D\uDCDA", titleKey: "stf.uc.bookLover.title", descKey: "stf.uc.bookLover.desc", href: `${BASE}/book-name-stamp` },
  { key: "creative", icon: "\uD83C\uDFA8", titleKey: "stf.uc.creative.title", descKey: "stf.uc.creative.desc", href: `${BASE}/custom-face-stamp` },
];

/* ========================================================================
 * CROSS-LINKS \u2014 related sub-groups in marketing-business-print
 * ======================================================================== */
export const STAMP_CROSS_LINKS = [
  { titleKey: "stf.cross.notepads", descKey: "stf.cross.notepadsDesc", href: `${BASE}/notepads` },
  { titleKey: "stf.cross.letterhead", descKey: "stf.cross.letterheadDesc", href: `${BASE}/letterhead` },
  { titleKey: "stf.cross.businessCards", descKey: "stf.cross.businessCardsDesc", href: `${BASE}/business-cards` },
];

/* ========================================================================
 * ENRICHMENT \u2014 transform DB products into shared ProductCard shape
 * ======================================================================== */

/**
 * Enrich a DB product for the shared ProductCard.
 * Adds description override from stamp-specific taglines.
 */
export function enrichStampProduct(product) {
  // Products already have name, fromPrice, etc. from DB.
  // Just ensure category is set for ProductCard href resolution.
  return {
    ...product,
    category: product.category || "marketing-business-print",
  };
}
