"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import ProductCard from "@/components/storefront/ProductCard";
import ComparisonTable from "@/components/storefront/ComparisonTable";
import UseCaseCards from "@/components/storefront/UseCaseCards";
import ValueProps from "@/components/storefront/ValueProps";

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

/* ── Slug → filter tag mapping (core products only) ── */
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
  { titleKey: "stickerCat.related.safety", title: "Safety & Warning Decals", titleZh: "安全警示贴纸", desc: "Fire, PPE, hazard, lockout/tagout", descZh: "消防、PPE、危险、锁定/标签", href: `${BASE}/safety-warning-decals` },
  { titleKey: "stickerCat.related.industrial", title: "Industrial Labels", titleZh: "工业标签", desc: "Pipe markers, chemical, electrical", descZh: "管道标识、化学品、电气", href: `${BASE}/industrial-labels` },
  { titleKey: "stickerCat.related.facility", title: "Facility & Asset Labels", titleZh: "设施资产标签", desc: "Asset tags, cable labels, bin labels", descZh: "资产标签、线缆标签、箱标", href: `${BASE}/facility-asset-labels` },
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

/* ── Use cases ── */
const USE_CASES = [
  { key: "branding", icon: "🏷️", titleKey: "storefront.stickers.uc.branding.title", descKey: "storefront.stickers.uc.branding.desc", href: `${BASE}/die-cut-stickers` },
  { key: "packaging", icon: "📦", titleKey: "storefront.stickers.uc.packaging.title", descKey: "storefront.stickers.uc.packaging.desc", href: `${BASE}/roll-labels` },
  { key: "events", icon: "🎪", titleKey: "storefront.stickers.uc.events.title", descKey: "storefront.stickers.uc.events.desc", href: `${BASE}/kiss-cut-stickers` },
  { key: "retail", icon: "🛍️", titleKey: "storefront.stickers.uc.retail.title", descKey: "storefront.stickers.uc.retail.desc", href: `${BASE}/sticker-sheets` },
  { key: "vehicles", icon: "🚗", titleKey: "storefront.stickers.uc.vehicles.title", descKey: "storefront.stickers.uc.vehicles.desc", href: `${BASE}/vinyl-lettering` },
  { key: "safety", icon: "⚠️", titleKey: "storefront.stickers.uc.safety.title", descKey: "storefront.stickers.uc.safety.desc", href: `${BASE}/safety-warning-decals` },
];

/* ── Value props ── */
const VALUE_PROPS = [
  { icon: "💧", titleKey: "stickerCat.waterproof", descKey: "stickerCat.waterproofDesc" },
  { icon: "⚡", titleKey: "stickerCat.fastTurnaround", descKey: "stickerCat.fastTurnaroundDesc" },
  { icon: "✂️", titleKey: "stickerCat.anyShape", descKey: "stickerCat.anyShapeDesc", ctaKey: "configurator.requestQuote", ctaHref: "/quote" },
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
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("footer.stickersLabels") },
          ]}
        />

        {/* Hero */}
        <div className="mt-6">
          <CategoryHero
            category="stickers-labels-decals"
            title="Custom Stickers & Labels"
            icon="🏷️"
          />
        </div>

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

        {/* Product grid — unified ProductCard */}
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

        {/* Comparison Table: Which sticker is right for you? */}
        <ComparisonTable
          title="storefront.comparison.title"
          subtitle="storefront.comparison.subtitle"
          columns={COMPARISON_COLUMNS}
          features={COMPARISON_FEATURES}
        />

        {/* Popular Use Cases */}
        <UseCaseCards
          title="storefront.useCases.title"
          cases={USE_CASES}
        />

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

        {/* Why Choose Us — unified ValueProps */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">{t("stickerCat.whyChooseUs")}</h2>
          <ValueProps props={VALUE_PROPS} />
        </section>

        {/* FAQ */}
        <CategoryFaq category="stickers-labels-decals" />

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("product.allCategories")}
          </Link>
        </div>
      </div>
    </main>
  );
}
