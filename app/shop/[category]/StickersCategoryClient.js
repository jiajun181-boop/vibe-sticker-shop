"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import ProductCard from "@/components/storefront/ProductCard";

const BASE = "/shop/stickers-labels-decals";

/* ── Core sticker products shown on main page (whitelist, in display order) ── */
const CORE_STICKER_SLUGS = [
  "die-cut-stickers",
  "kiss-cut-stickers",
  "sticker-sheets",
  "kiss-cut-sticker-sheets",
  "roll-labels",
  "vinyl-lettering",
];
const CORE_SET = new Set(CORE_STICKER_SLUGS);
const CORE_ORDER = new Map(CORE_STICKER_SLUGS.map((s, i) => [s, i]));

/* ── Slug \u2192 filter tag mapping (core products only) ── */
const SLUG_TAG = {
  "die-cut-stickers": "stickers",
  "kiss-cut-stickers": "stickers",
  "sticker-sheets": "sheets",
  "kiss-cut-sticker-sheets": "sheets",
  "roll-labels": "roll-labels",
  "vinyl-lettering": "lettering",
};

const FILTER_TABS = [
  { id: "all", key: "stickerCat.filter.all" },
  { id: "stickers", key: "stickerCat.filter.stickers" },
  { id: "sheets", key: "stickerCat.filter.sheets" },
  { id: "roll-labels", key: "stickerCat.filter.rollLabels" },
  { id: "lettering", key: "stickerCat.filter.lettering" },
];

/* ── Related categories ── */
const RELATED = [
  { titleKey: "stickerCat.related.safety", title: "Safety & Warning Decals", titleZh: "\u5B89\u5168\u8B66\u793A\u8D34\u7EB8", desc: "Fire, PPE, hazard, lockout/tagout", descZh: "\u6D88\u9632\u3001PPE\u3001\u5371\u9669\u3001\u9501\u5B9A/\u6807\u7B7E", href: `${BASE}/safety-warning-decals` },
  { titleKey: "stickerCat.related.industrial", title: "Industrial Labels", titleZh: "\u5DE5\u4E1A\u6807\u7B7E", desc: "Pipe markers, chemical, electrical", descZh: "\u7BA1\u9053\u6807\u8BC6\u3001\u5316\u5B66\u54C1\u3001\u7535\u6C14", href: `${BASE}/industrial-labels` },
  { titleKey: "stickerCat.related.facility", title: "Facility & Asset Labels", titleZh: "\u8BBE\u65BD\u8D44\u4EA7\u6807\u7B7E", desc: "Asset tags, cable labels, bin labels", descZh: "\u8D44\u4EA7\u6807\u7B7E\u3001\u7EBF\u7F06\u6807\u7B7E\u3001\u7BB1\u6807", href: `${BASE}/facility-asset-labels` },
];

/* ── Comparison data ── */
const COMPARISON_COLUMNS = [
  {
    key: "die-cut",
    nameKey: "storefront.stickers.cmp.dieCut",
    href: `${BASE}/die-cut-stickers`,
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

const COMPARISON_FEATURES = [
  { key: "customShape", labelKey: "storefront.stickers.cmp.feat.customShape" },
  { key: "easyPeel", labelKey: "storefront.stickers.cmp.feat.easyPeel" },
  { key: "multiDesign", labelKey: "storefront.stickers.cmp.feat.multiDesign" },
  { key: "bulkPackaging", labelKey: "storefront.stickers.cmp.feat.bulkPackaging" },
  { key: "waterproof", labelKey: "storefront.stickers.cmp.feat.waterproof" },
  { key: "bestFor", labelKey: "storefront.stickers.cmp.feat.bestFor" },
  { key: "minOrder", labelKey: "storefront.stickers.cmp.feat.minOrder" },
];

/* ── Browse by need (strong entry at top) ── */
const BROWSE_CASES = [
  { key: "branding", icon: "\uD83C\uDFF7\uFE0F", titleKey: "storefront.stickers.uc.branding.title", descKey: "storefront.stickers.uc.branding.desc", href: `${BASE}/die-cut-stickers` },
  { key: "packaging", icon: "\uD83D\uDCE6", titleKey: "storefront.stickers.uc.packaging.title", descKey: "storefront.stickers.uc.packaging.desc", href: `${BASE}/roll-labels` },
  { key: "events", icon: "\uD83C\uDFAA", titleKey: "storefront.stickers.uc.events.title", descKey: "storefront.stickers.uc.events.desc", href: `${BASE}/kiss-cut-stickers` },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.stickers.uc.retail.title", descKey: "storefront.stickers.uc.retail.desc", href: `${BASE}/sticker-sheets` },
  { key: "vehicles", icon: "\uD83D\uDE97", titleKey: "storefront.stickers.uc.vehicles.title", descKey: "storefront.stickers.uc.vehicles.desc", href: `${BASE}/vinyl-lettering` },
  { key: "safety", icon: "\u26A0\uFE0F", titleKey: "storefront.stickers.uc.safety.title", descKey: "storefront.stickers.uc.safety.desc", href: `${BASE}/safety-warning-decals` },
];

/* ── Use cases (light supplement at bottom) ── */
const USE_CASES = [
  { key: "branding", icon: "\uD83C\uDFF7\uFE0F", titleKey: "storefront.stickers.uc.branding.title", descKey: "storefront.stickers.uc.branding.desc", href: `${BASE}/die-cut-stickers` },
  { key: "packaging", icon: "\uD83D\uDCE6", titleKey: "storefront.stickers.uc.packaging.title", descKey: "storefront.stickers.uc.packaging.desc", href: `${BASE}/roll-labels` },
  { key: "events", icon: "\uD83C\uDFAA", titleKey: "storefront.stickers.uc.events.title", descKey: "storefront.stickers.uc.events.desc", href: `${BASE}/kiss-cut-stickers` },
  { key: "retail", icon: "\uD83D\uDECD\uFE0F", titleKey: "storefront.stickers.uc.retail.title", descKey: "storefront.stickers.uc.retail.desc", href: `${BASE}/sticker-sheets` },
  { key: "vehicles", icon: "\uD83D\uDE97", titleKey: "storefront.stickers.uc.vehicles.title", descKey: "storefront.stickers.uc.vehicles.desc", href: `${BASE}/vinyl-lettering` },
  { key: "safety", icon: "\u26A0\uFE0F", titleKey: "storefront.stickers.uc.safety.title", descKey: "storefront.stickers.uc.safety.desc", href: `${BASE}/safety-warning-decals` },
];

/* ── Value props ── */
const VALUE_PROPS = [
  { icon: "\uD83D\uDCA7", titleKey: "stickerCat.waterproof", descKey: "stickerCat.waterproofDesc" },
  { icon: "\u26A1", titleKey: "stickerCat.fastTurnaround", descKey: "stickerCat.fastTurnaroundDesc" },
  { icon: "\u2702\uFE0F", titleKey: "stickerCat.anyShape", descKey: "stickerCat.anyShapeDesc", ctaKey: "configurator.requestQuote", ctaHref: "/quote" },
];

/* ── Main Component ── */
export default function StickersCategoryClient({ products = [] }) {
  const { t, locale } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");

  // Whitelist: only show core sticker products, sorted by display order
  const taggedProducts = useMemo(() => {
    return products
      .filter((p) => p.isActive !== false && CORE_SET.has(p.slug))
      .map((p) => ({ ...p, filterTag: SLUG_TAG[p.slug] || "stickers" }))
      .sort((a, b) => (CORE_ORDER.get(a.slug) ?? 99) - (CORE_ORDER.get(b.slug) ?? 99));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return taggedProducts;
    return taggedProducts.filter((p) => p.filterTag === activeFilter);
  }, [taggedProducts, activeFilter]);

  // Count per filter
  const filterCounts = useMemo(() => {
    const counts = { all: taggedProducts.length };
    for (const tab of FILTER_TABS) {
      if (tab.id !== "all") {
        counts[tab.id] = taggedProducts.filter((p) => p.filterTag === tab.id).length;
      }
    }
    return counts;
  }, [taggedProducts]);

  return (
    <FamilyLandingShell
      bgClassName="bg-[var(--color-gray-50)]"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("footer.stickersLabels") },
      ]}
      heroCategory="stickers-labels-decals"
      heroTitle="Custom Stickers & Labels"
      heroIcon="\uD83C\uDFF7\uFE0F"
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
      faqCategory="stickers-labels-decals"
      backLabelKey="product.allCategories"
    >
      {/* Filter tabs — sticky on scroll */}
      <div className="sticky top-[calc(var(--promo-offset,0px)+var(--nav-offset,72px))] z-10 -mx-4 sm:-mx-6 mt-6 border-b border-[var(--color-gray-200)] bg-[var(--color-gray-50)]/95 px-4 sm:px-6 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const count = filterCounts[tab.id] || 0;
            if (tab.id !== "all" && count === 0) return null;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-brand)] text-white shadow-sm"
                    : "bg-white text-[var(--color-gray-600)] border border-[var(--color-gray-200)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                }`}
              >
                {t(tab.key)}
                <span className={`ml-1.5 text-xs ${isActive ? "text-white/70" : "text-[var(--color-gray-400)]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product grid */}
      <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showTurnaround={true}
            showDescription={true}
            ctaKey="mp.landing.viewOrder"
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--color-gray-400)]">{t("shop.noProducts")}</p>
        </div>
      )}

      {/* Related categories */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">{t("stickerCat.related")}</h2>
        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {RELATED.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
                  {locale === "zh" ? cat.titleZh : cat.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-gray-500)] truncate">
                  {locale === "zh" ? cat.descZh : cat.desc}
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </FamilyLandingShell>
  );
}
