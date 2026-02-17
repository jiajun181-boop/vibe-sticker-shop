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

function ProductCard({ product, t, compact }) {
  const href = `/shop/${product.category}/${product.slug}`;
  const image = product.images?.[0];

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={`relative bg-gray-100 ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
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
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center px-3">
              <svg
                className="mx-auto h-8 w-8 text-gray-300"
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
              <p className="mt-1 text-xs font-medium text-gray-400">
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
        <h3 className={`font-semibold text-gray-900 leading-snug ${compact ? "text-xs" : "text-sm"}`}>
          {product.name}
        </h3>
        {!compact && product.description && (
          <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">
            {product.description}
          </p>
        )}
        {product.basePrice > 0 && (
          <p className={`font-bold text-gray-900 ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
            {t("product.from", { price: formatCad(product.basePrice) })}
          </p>
        )}
        {!compact ? (
          <div className="mt-2 flex items-center gap-2">
            <QuickAddButton product={product} />
            <span className="inline-block rounded-full bg-gray-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition-colors group-hover:bg-black">
              {t("mp.landing.viewOrder")}
            </span>
          </div>
        ) : (
          <span className="mt-1.5 inline-block rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition-colors group-hover:bg-black">
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

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
              <p className="mt-1 text-sm text-gray-500">
                {products.length} {t("mp.landing.products")}
              </p>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-[0.15em] text-gray-400">{t("shop.sort")}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("shop.searchCategory") || "Search products..."}
              className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </header>

        {/* Filter chips */}
        {hasFilters && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveFilter(null)}
              className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === null
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
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
                className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === group.slug
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
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
            <span className="flex-none self-center text-[10px] uppercase tracking-[0.15em] text-gray-400 mr-1">
              {t("shop.turnaround")}
            </span>
            {turnaroundGroups.map((tg) => (
              <button
                key={tg.key}
                onClick={() => setTurnaroundFilter(turnaroundFilter === tg.key ? null : tg.key)}
                className={`flex-none rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  turnaroundFilter === tg.key
                    ? turnaroundColor(tg.key)
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {t(turnaroundI18nKey(tg.key))} ({tg.count})
              </button>
            ))}
          </div>
        )}

        {/* Product grid — compact on mobile to show more products */}
        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} t={t} compact={false} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">{t("shop.noResults")}</p>
            {(activeFilter || turnaroundFilter) && (
              <button
                onClick={() => { setActiveFilter(null); setTurnaroundFilter(null); }}
                className="mt-3 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 hover:border-gray-900"
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
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("shop.backToCategories")}
          </Link>
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.qualityTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
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

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.turnaroundTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("mp.landing.turnaroundText")}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("mp.landing.customText")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-black"
            >
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
