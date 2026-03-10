/**
 * Family Entry Context \u2014 shared helpers for passing browse context
 * from family landing pages into product detail pages.
 *
 * Query params: ?ff=<family>&fn=<need>
 *   ff = fromFamily (e.g. "stickers", "signs", "marketing")
 *   fn = fromNeed   (e.g. "branding", "packaging", "outdoor")
 *
 * Short param names to keep URLs clean.
 */

/**
 * Append family entry context to a product href.
 * Returns the href unchanged if no context is provided.
 *
 * @param {string} href  \u2014 base product URL (e.g. "/shop/stickers/die-cut-stickers")
 * @param {object} [ctx] \u2014 { family, need }
 * @returns {string}
 */
export function withFamilyEntry(href, ctx) {
  if (!ctx?.family) return href;
  const sep = href.includes("?") ? "&" : "?";
  const parts = [`ff=${encodeURIComponent(ctx.family)}`];
  if (ctx.need) parts.push(`fn=${encodeURIComponent(ctx.need)}`);
  return `${href}${sep}${parts.join("&")}`;
}

/**
 * Parse family entry context from search params (client-side).
 * Returns null if no family context is present.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ family: string, need?: string } | null}
 */
export function parseFamilyEntry(searchParams) {
  const family = searchParams?.get("ff");
  if (!family) return null;
  const need = searchParams?.get("fn") || undefined;
  return { family, need };
}

/* \u2500\u2500 Family display config \u2500\u2500 */
const FAMILY_CONFIG = {
  stickers: {
    labelKey: "storefront.family.stickers",
    href: "/shop/stickers-labels-decals",
  },
  signs: {
    labelKey: "storefront.family.signs",
    href: "/shop/signs-rigid-boards",
  },
  banners: {
    labelKey: "storefront.family.banners",
    href: "/shop/banners-displays",
  },
  marketing: {
    labelKey: "storefront.family.marketing",
    href: "/shop/marketing-business-print",
  },
};

/* \u2500\u2500 Need display config \u2014 maps need keys to i18n keys \u2500\u2500 */
const NEED_CONFIG = {
  // Stickers
  branding:  "storefront.stickers.uc.branding.title",
  packaging: "storefront.stickers.uc.packaging.title",
  events:    "storefront.stickers.uc.events.title",
  retail:    "storefront.stickers.uc.retail.title",
  vehicles:  "storefront.stickers.uc.vehicles.title",
  safety:    "storefront.stickers.uc.safety.title",
  // Signs + Banners
  indoor:    "storefront.signsFamily.browse.indoor.title",
  outdoor:   "storefront.signsFamily.browse.outdoor.title",
  realEstate: "storefront.signsFamily.browse.realEstate.title",
  tradeshow: "storefront.signsFamily.browse.tradeshow.title",
  // Marketing
  "new-business": "storefront.marketing.uc.newBiz.title",
  "direct-mail":  "storefront.marketing.uc.directMail.title",
  restaurant:     "storefront.marketing.uc.restaurant.title",
  corporate:      "storefront.marketing.uc.corporate.title",
};

/**
 * Get display info for a family entry context.
 * @param {{ family: string, need?: string }} ctx
 * @returns {{ familyLabel: string, familyHref: string, needLabel?: string } | null}
 */
export function getFamilyEntryDisplay(ctx) {
  if (!ctx?.family) return null;
  const fam = FAMILY_CONFIG[ctx.family];
  if (!fam) return null;
  return {
    familyLabelKey: fam.labelKey,
    familyHref: fam.href,
    needLabelKey: ctx.need ? NEED_CONFIG[ctx.need] : undefined,
  };
}
