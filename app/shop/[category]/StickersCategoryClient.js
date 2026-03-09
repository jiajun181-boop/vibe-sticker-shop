"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import ProductCard from "@/components/storefront/ProductCard";
import {
  STICKERS_CORE_SET,
  STICKERS_CORE_ORDER,
  STICKERS_SLUG_TAG,
  STICKERS_FILTER_TABS,
  STICKERS_RELATED,
  STICKERS_COMPARISON_COLUMNS,
  STICKERS_COMPARISON_FEATURES,
  STICKERS_BROWSE_CASES,
  STICKERS_USE_CASES,
  STICKERS_VALUE_PROPS,
  enrichStickerProduct,
} from "@/lib/storefront/stickers-family";

/* ── Main Component ── */
export default function StickersCategoryClient({ products = [] }) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");

  // Whitelist + enrich: only core sticker products, sorted by display order
  const taggedProducts = useMemo(() => {
    return products
      .filter((p) => p.isActive !== false && STICKERS_CORE_SET.has(p.slug))
      .map((p) => enrichStickerProduct({ ...p, filterTag: STICKERS_SLUG_TAG[p.slug] || "stickers" }))
      .sort((a, b) => (STICKERS_CORE_ORDER.get(a.slug) ?? 99) - (STICKERS_CORE_ORDER.get(b.slug) ?? 99));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return taggedProducts;
    return taggedProducts.filter((p) => p.filterTag === activeFilter);
  }, [taggedProducts, activeFilter]);

  // Count per filter
  const filterCounts = useMemo(() => {
    const counts = { all: taggedProducts.length };
    for (const tab of STICKERS_FILTER_TABS) {
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
      heroIcon={"\uD83C\uDFF7\uFE0F"}
      browseByNeed={{
        titleKey: "storefront.browseByNeed.title",
        subtitleKey: "storefront.browseByNeed.subtitle",
        cases: STICKERS_BROWSE_CASES,
      }}
      comparison={{
        title: "storefront.comparison.title",
        subtitle: "storefront.comparison.subtitle",
        columns: STICKERS_COMPARISON_COLUMNS,
        features: STICKERS_COMPARISON_FEATURES,
      }}
      useCases={{
        title: "storefront.useCases.title",
        cases: STICKERS_USE_CASES,
      }}
      valueProps={STICKERS_VALUE_PROPS}
      faqCategory="stickers-labels-decals"
      backLabelKey="product.allCategories"
    >
      {/* Filter tabs \u2014 sticky on scroll */}
      <div className="sticky top-[calc(var(--promo-offset,0px)+var(--nav-offset,72px))] z-10 -mx-4 sm:-mx-6 mt-6 border-b border-[var(--color-gray-200)] bg-[var(--color-gray-50)]/95 px-4 sm:px-6 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap gap-2">
          {STICKERS_FILTER_TABS.map((tab) => {
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
          {STICKERS_RELATED.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
                  {t(cat.titleKey)}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-gray-500)] truncate">
                  {t(cat.descKey)}
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
