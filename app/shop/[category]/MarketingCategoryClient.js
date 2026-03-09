"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import FamilySectionHeader from "@/components/storefront/FamilySectionHeader";
import ProductCard from "@/components/storefront/ProductCard";

const BASE = "/shop/marketing-business-print";

/* ── Item slug \u2192 i18n key map ── */
const ITEM_I18N = {
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

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "essentials",
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

/* ── Comparison data ── */
const COMPARISON_COLUMNS = [
  {
    key: "cards",
    nameKey: "storefront.marketing.cmp.businessCards",
    href: `${BASE}/business-cards`,
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

const COMPARISON_FEATURES = [
  { key: "paperStock", labelKey: "storefront.marketing.cmp.feat.paperStock" },
  { key: "doubleSided", labelKey: "storefront.marketing.cmp.feat.doubleSided" },
  { key: "foldOptions", labelKey: "storefront.marketing.cmp.feat.foldOptions" },
  { key: "bestFor", labelKey: "storefront.marketing.cmp.feat.bestFor" },
  { key: "turnaround", labelKey: "storefront.marketing.cmp.feat.turnaround" },
];

/* ── Browse by need (strong entry at top) ── */
const BROWSE_CASES = [
  { key: "newBiz", icon: "\uD83C\uDFE2", titleKey: "storefront.marketing.uc.newBiz.title", descKey: "storefront.marketing.uc.newBiz.desc", href: `${BASE}/business-cards` },
  { key: "directMail", icon: "\uD83D\uDCEC", titleKey: "storefront.marketing.uc.directMail.title", descKey: "storefront.marketing.uc.directMail.desc", href: `${BASE}/postcards` },
  { key: "restaurant", icon: "\uD83C\uDF7D\uFE0F", titleKey: "storefront.marketing.uc.restaurant.title", descKey: "storefront.marketing.uc.restaurant.desc", href: `${BASE}/menus` },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.marketing.uc.tradeshow.title", descKey: "storefront.marketing.uc.tradeshow.desc", href: `${BASE}/brochures` },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.marketing.uc.retail.title", descKey: "storefront.marketing.uc.retail.desc", href: `${BASE}/shelf-displays` },
  { key: "corporate", icon: "\uD83D\uDCBC", titleKey: "storefront.marketing.uc.corporate.title", descKey: "storefront.marketing.uc.corporate.desc", href: `${BASE}/letterhead` },
];

/* ── Use cases (light supplement at bottom) ── */
const USE_CASES = [
  { key: "newBiz", icon: "\uD83C\uDFE2", titleKey: "storefront.marketing.uc.newBiz.title", descKey: "storefront.marketing.uc.newBiz.desc", href: `${BASE}/business-cards` },
  { key: "directMail", icon: "\uD83D\uDCEC", titleKey: "storefront.marketing.uc.directMail.title", descKey: "storefront.marketing.uc.directMail.desc", href: `${BASE}/postcards` },
  { key: "restaurant", icon: "\uD83C\uDF7D\uFE0F", titleKey: "storefront.marketing.uc.restaurant.title", descKey: "storefront.marketing.uc.restaurant.desc", href: `${BASE}/menus` },
  { key: "tradeshow", icon: "\uD83C\uDFAA", titleKey: "storefront.marketing.uc.tradeshow.title", descKey: "storefront.marketing.uc.tradeshow.desc", href: `${BASE}/brochures` },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.marketing.uc.retail.title", descKey: "storefront.marketing.uc.retail.desc", href: `${BASE}/shelf-displays` },
  { key: "corporate", icon: "\uD83D\uDCBC", titleKey: "storefront.marketing.uc.corporate.title", descKey: "storefront.marketing.uc.corporate.desc", href: `${BASE}/letterhead` },
];

/* ── Value props ── */
const VALUE_PROPS = [
  { icon: "\uD83C\uDFA8", titleKey: "mc.vp1.title", descKey: "mc.vp1.desc" },
  { icon: "\uD83D\uDCE6", titleKey: "mc.vp2.title", descKey: "mc.vp2.desc" },
  { icon: "\uD83D\uDCAC", titleKey: "mc.vp3.title", descKey: "mc.vp3.desc", ctaKey: "shop.contactUs", ctaHref: "/quote" },
];

export default function MarketingCategoryClient({ marketingPrices = {}, marketingImages = {}, marketingImages2 = {} }) {
  const { t } = useTranslation();

  return (
    <FamilyLandingShell
      bgClassName="bg-gradient-to-b from-amber-50 to-white"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("mc.breadcrumb") },
      ]}
      heroCategory="marketing-business-print"
      heroTitle={t("mc.title")}
      heroIcon="\uD83D\uDCC4"
      browseByNeed={{
        titleKey: "storefront.browseByNeed.title",
        subtitleKey: "storefront.browseByNeed.subtitle",
        cases: BROWSE_CASES,
      }}
      comparison={{
        title: "storefront.comparison.title",
        subtitle: "storefront.comparison.subtitle",
        columns: COMPARISON_COLUMNS,
        features: COMPARISON_FEATURES,
      }}
      useCases={{
        title: "storefront.useCases.title",
        cases: USE_CASES,
      }}
      valueProps={VALUE_PROPS}
      faqCategory="marketing-business-print"
    >
      {/* Product sections — family-specific grid */}
      {SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => item.key in marketingPrices);
        if (visibleItems.length === 0) return null;

        return (
          <section key={section.key} className="mt-8">
            <FamilySectionHeader titleKey={section.titleKey} subtitleKey={section.subtitleKey} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleItems.map((item) => {
                const name = t(ITEM_I18N[item.key] || item.key);
                const product = {
                  slug: item.key,
                  name,
                  category: "marketing-business-print",
                  fromPrice: marketingPrices[item.key] || 0,
                };
                return (
                  <ProductCard
                    key={item.key}
                    product={product}
                    href={item.href}
                    imageSrc={marketingImages[item.key]}
                    hoverImageSrc={marketingImages2[item.key]}
                    showTurnaround={false}
                    gradientFallback={item.gradient}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </FamilyLandingShell>
  );
}
