"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuickAddButton from "@/components/product/QuickAddButton";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

// Categories that show the sticker configurator CTA banner
const STICKER_CONFIGURATOR_CATEGORIES = new Set([
  "stickers-labels-decals",
  "custom-stickers",
]);

const CATEGORY_USE_CASES = {
  "marketing-business-print": [
    { key: "grand-opening", label: "Grand Opening", hint: "flyers postcards door hanger", cta: "引流促销" },
    { key: "daily-ops", label: "Daily Operations", hint: "ncr forms notepads stamps", cta: "日常办公" },
    { key: "events", label: "Events & Booth", hint: "brochures rack cards table tents", cta: "活动展会" },
  ],
  "windows-walls-floors": [
    { key: "storefront", label: "Storefront Branding", hint: "window graphics frosted window", cta: "门店形象" },
    { key: "privacy", label: "Office Privacy", hint: "frosted privacy one-way vision", cta: "隐私隔断" },
    { key: "wayfinding", label: "Wayfinding", hint: "floor graphics wall graphics", cta: "导视动线" },
  ],
  "vehicle-graphics-fleet": [
    { key: "fleet-branding", label: "Fleet Branding", hint: "vehicle wraps decals", cta: "车队广告" },
    { key: "compliance", label: "Compliance", hint: "dot mc unit ids", cta: "合规标识" },
    { key: "partial", label: "Budget Partial Wrap", hint: "door panel graphics magnets", cta: "预算友好" },
  ],
  "custom-stickers": [
    { key: "brand-logo", label: "Brand & Logo", hint: "die-cut stickers packaging labels", cta: "Brand" },
    { key: "events-giveaways", label: "Events & Giveaways", hint: "sticker sheets handouts", cta: "Events" },
    { key: "outdoor-vehicle", label: "Outdoor & Vehicle", hint: "bumper stickers decals vinyl", cta: "Outdoor" },
  ],
};

function ProductCard({ product, t, compact }) {
  const href = `/shop/${product.category}/${product.slug}`;
  const image = product.images?.[0];

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={`relative bg-[var(--color-gray-100)] ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            unoptimized={image.url.endsWith(".svg")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-gray-100)] to-[var(--color-gray-200)]">
            <div className="text-center px-3">
              <svg
                className="mx-auto h-8 w-8 text-[var(--color-gray-300)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="mt-1 text-xs font-medium text-[var(--color-gray-400)]">
                {product.name}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={compact ? "p-2.5" : "p-3 sm:p-4"}>
        {!compact && (() => {
          const tk = getTurnaround(product);
          return (
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1 ${turnaroundColor(tk)}`}>
              {t(turnaroundI18nKey(tk))}
            </span>
          );
        })()}
        <h3 className={`font-semibold text-[var(--color-gray-900)] leading-snug ${compact ? "text-xs" : "text-sm"}`}>
          {product.name}
        </h3>
        {!compact && product.description && (
          <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2">
            {product.description}
          </p>
        )}
        {(product.fromPrice || product.basePrice) > 0 && (
          <p className={`font-bold text-[var(--color-gray-900)] ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
            {t("product.from", { price: formatCad(product.fromPrice || product.basePrice) })}
          </p>
        )}
        {!compact ? (
          <div className="mt-2 flex items-center gap-2">
            <QuickAddButton product={product} />
            <span className="inline-block rounded-xl bg-[var(--color-gray-900)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-black">
              {t("mp.landing.viewOrder")}
            </span>
          </div>
        ) : (
          <span className="mt-1.5 inline-block rounded-xl bg-[var(--color-gray-900)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-black">
            {t("mp.landing.viewOrder")}
          </span>
        )}
      </div>
    </Link>
  );
}

function sortProducts(list, sortBy) {
  const arr = [...list];
  if (sortBy === "price-asc") arr.sort((a, b) => a.basePrice - b.basePrice);
  else if (sortBy === "price-desc") arr.sort((a, b) => b.basePrice - a.basePrice);
  else if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
  // default "popular" keeps original sortOrder from server
  return arr;
}

export default function CategoryLandingClient({
  category,
  categoryTitle,
  categoryIcon,
  products,
  filterGroups = [],
  turnaroundGroups = [],
}) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState(null);
  const [turnaroundFilter, setTurnaroundFilter] = useState(null);
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");

  const hasFilters = filterGroups.length > 1;
  const hasTurnaroundFilters = turnaroundGroups.length > 1;

  // Build lookup: slug → set of db slugs for active filter
  const activeSlugSet = useMemo(() => {
    if (!activeFilter) return null;
    const group = filterGroups.find((g) => g.slug === activeFilter);
    return group ? new Set(group.dbSlugs) : null;
  }, [activeFilter, filterGroups]);

  // Build lookup: turnaround key → set of product IDs
  const turnaroundIdSet = useMemo(() => {
    if (!turnaroundFilter) return null;
    const group = turnaroundGroups.find((g) => g.key === turnaroundFilter);
    return group ? new Set(group.productIds) : null;
  }, [turnaroundFilter, turnaroundGroups]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeSlugSet) {
      list = list.filter((p) => activeSlugSet.has(p.slug));
    }
    if (turnaroundIdSet) {
      list = list.filter((p) => turnaroundIdSet.has(p.id));
    }
    if (searchQuery.trim()) {
      const sq = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(sq) ||
          (p.description || "").toLowerCase().includes(sq)
      );
    }
    return sortProducts(list, sortBy);
  }, [products, activeSlugSet, turnaroundIdSet, searchQuery, sortBy]);

  const useCaseCards = CATEGORY_USE_CASES[category] || [];

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: categoryTitle },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                {categoryIcon && <span className="mr-2">{categoryIcon}</span>}
                {categoryTitle}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">
                {products.length} {t("mp.landing.products")}
              </p>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-400)]">{t("shop.sort")}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-[var(--color-gray-300)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-gray-900)] focus:outline-none"
              >
                <option value="popular">{t("shop.sortPopular")}</option>
                <option value="price-asc">{t("shop.sortPriceAsc")}</option>
                <option value="price-desc">{t("shop.sortPriceDesc")}</option>
                <option value="name">{t("shop.sortName")}</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4 w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-gray-400)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("shop.searchCategory") || "Search products..."}
              className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white pl-9 pr-4 py-2 text-sm focus:border-[var(--color-gray-400)] focus:outline-none"
            />
          </div>
        </header>

        {/* Sticker configurator CTA */}
        {STICKER_CONFIGURATOR_CATEGORIES.has(category) && (
          <Link
            href="/order/stickers"
            className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-gray-900 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-5 text-white transition-all hover:shadow-xl hover:shadow-gray-900/20 group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-14 sm:w-14">
              <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black sm:text-lg">Build Your Custom Sticker</p>
              <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">Choose type, size, material & quantity - get instant pricing</p>
            </div>
            <div className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 transition-transform group-hover:scale-105">
              Start Now
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </div>
          </Link>
        )}

        {useCaseCards.length > 0 && (
          <section className="mt-5 rounded-2xl border border-[var(--color-gray-200)] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">Shop by Use Case</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {useCaseCards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setSearchQuery(card.hint)}
                  className="rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3 text-left transition-colors hover:border-[var(--color-gray-400)] hover:bg-white"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-500)]">{card.cta}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-gray-900)]">{card.label}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filter chips */}
        {hasFilters && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveFilter(null)}
              className={`flex-none rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === null
                  ? "bg-[var(--color-gray-900)] text-white"
                  : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
              }`}
            >
              {t("shop.all")} ({products.length})
            </button>
            {filterGroups.map((group) => (
              <button
                key={group.slug}
                onClick={() =>
                  setActiveFilter(activeFilter === group.slug ? null : group.slug)
                }
                className={`flex-none rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === group.slug
                    ? "bg-[var(--color-gray-900)] text-white"
                    : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
                }`}
              >
                {group.label} ({group.count})
              </button>
            ))}
          </div>
        )}

        {/* Turnaround filter chips */}
        {hasTurnaroundFilters && (
          <div className={`${hasFilters ? "mt-3" : "mt-5"} flex gap-2 overflow-x-auto pb-1 scrollbar-hide`}>
            <span className="flex-none self-center text-[10px] uppercase tracking-[0.14em] text-[var(--color-gray-400)] mr-1">
              {t("shop.turnaround")}
            </span>
            {turnaroundGroups.map((tg) => (
              <button
                key={tg.key}
                onClick={() => setTurnaroundFilter(turnaroundFilter === tg.key ? null : tg.key)}
                className={`flex-none rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  turnaroundFilter === tg.key
                    ? turnaroundColor(tg.key)
                    : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
                }`}
              >
                {t(turnaroundI18nKey(tg.key))} ({tg.count})
              </button>
            ))}
          </div>
        )}

        {/* Product grid — compact on mobile to show more products */}
        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} t={t} compact={false} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-sm text-[var(--color-gray-500)]">{t("shop.noResults")}</p>
            {(activeFilter || turnaroundFilter) && (
              <button
                onClick={() => { setActiveFilter(null); setTurnaroundFilter(null); }}
                className="mt-3 rounded-xl border border-[var(--color-gray-300)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)]"
              >
                {t("shop.clearFilters")}
              </button>
            )}
          </div>
        )}

        {/* Browse all categories link */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("shop.backToCategories")}
          </Link>
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.qualityTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-gray-700)]">
              {["quality1", "quality2", "quality3", "quality4"].map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t(`mp.landing.${k}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.turnaroundTitle")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mp.landing.turnaroundText")}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mp.landing.customText")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-xl bg-[var(--color-gray-900)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-black"
            >
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


