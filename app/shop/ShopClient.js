"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";
import { INDUSTRY_LABELS, INDUSTRY_TAGS } from "@/lib/industryTags";
import { USE_CASES, USE_CASE_PRODUCTS } from "@/lib/useCases";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";

const PAGE_SIZE_OPTIONS = [12, 24, 36];

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function sortProducts(list, sortBy, catOrder) {
  const arr = [...list];
  if (sortBy === "price-asc") arr.sort((a, b) => a.basePrice - b.basePrice);
  if (sortBy === "price-desc") arr.sort((a, b) => b.basePrice - a.basePrice);
  if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === "popular") arr.sort((a, b) => {
    const catA = catOrder?.get(a.category) ?? 9999;
    const catB = catOrder?.get(b.category) ?? 9999;
    if (catA !== catB) return catA - catB;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
  return arr;
}

/* ── Category Card Grid ─────────────────────────────────────────── */

function CategoryGrid({ departments, departmentMeta, categoryMeta, categoryCounts, t }) {
  return (
    <div className="space-y-10">
      {departments.map((dept) => {
        const deptMeta = departmentMeta?.[dept.key];
        return (
          <section key={dept.key}>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              {deptMeta?.title || dept.key}
            </h2>
            <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {dept.categories.map((catSlug) => {
                const meta = categoryMeta?.[catSlug];
                const count = categoryCounts?.[catSlug] || 0;
                return (
                  <Link
                    key={catSlug}
                    href={`/shop/${catSlug}`}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400"
                  >
                    <span className="text-2xl">{meta?.icon || ""}</span>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {meta?.title || catSlug}
                    </h3>
                    {count > 0 && (
                      <p className="mt-1 text-[11px] text-gray-400">
                        {count} {t("mp.landing.products")}
                      </p>
                    )}
                    <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 group-hover:text-gray-900 transition-colors">
                      {t("mp.landing.browse")}
                      <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ── Main ShopClient ────────────────────────────────────────────── */

export default function ShopClient({
  products,
  initialQuery = "",
  initialTag = "",
  initialUseCase = "",
  categoryMeta = {},
  departments = [],
  departmentMeta = {},
  categoryCounts = {},
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery || "");
  const [tag, setTag] = useState(initialTag || "");
  const [useCase, setUseCase] = useState(initialUseCase || "");
  const [sortBy, setSortBy] = useState("popular");
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : "grid"
  );
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isInternalUrlUpdate = useRef(false);

  useEffect(() => {
    if (window.innerWidth < 1024 && view === "grid") setView("list");
  }, []);

  // Sync state from URL on external navigation (browser back, link click)
  useEffect(() => {
    if (isInternalUrlUpdate.current) {
      isInternalUrlUpdate.current = false;
      return;
    }
    setQuery(searchParams?.get("q") || "");
    setTag(searchParams?.get("tag") || "");
    setUseCase(searchParams?.get("useCase") || "");
    setPage(1);
  }, [searchParams]);

  // Show product grid when any filter is active
  const isFiltering = !!(query.trim() || tag || useCase);

  const categoryLabels = useMemo(() => {
    const labels = {};
    for (const [slug, meta] of Object.entries(categoryMeta)) {
      labels[slug] = meta.title || slug;
    }
    return labels;
  }, [categoryMeta]);

  const categoryOrder = useMemo(() => {
    const m = new Map();
    Object.keys(categoryMeta).forEach((k, i) => m.set(k, i));
    return m;
  }, [categoryMeta]);

  const availableIndustryTags = useMemo(() => {
    const present = new Set();
    for (const p of products) {
      if (!Array.isArray(p.tags)) continue;
      for (const t of p.tags) present.add(t);
    }
    return INDUSTRY_TAGS.filter((t) => present.has(t));
  }, [products]);

  function syncUrl(next) {
    isInternalUrlUpdate.current = true;
    const sp = new URLSearchParams(searchParams?.toString() || "");
    const nextQuery = next?.query ?? query;
    const nextTag = next?.tag ?? tag;
    const nextUseCase = next?.useCase ?? useCase;

    if (nextQuery && nextQuery.trim()) sp.set("q", nextQuery.trim());
    else sp.delete("q");

    if (nextTag && nextTag.trim()) sp.set("tag", nextTag.trim());
    else sp.delete("tag");

    if (nextUseCase && nextUseCase.trim()) sp.set("useCase", nextUseCase.trim());
    else sp.delete("useCase");

    const qs = sp.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }

  const useCaseSlugs = useMemo(() => {
    if (!useCase || !USE_CASE_PRODUCTS[useCase]) return null;
    return new Set(USE_CASE_PRODUCTS[useCase]);
  }, [useCase]);

  const filtered = useMemo(() => {
    let base = [...products];
    if (tag) {
      base = base.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag));
    }
    if (useCaseSlugs) {
      base = base.filter((p) => useCaseSlugs.has(p.slug));
    }
    const q = (query || "").trim().toLowerCase();
    if (q) {
      base = base.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const slug = (p.slug || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags : [];
        return name.includes(q) || slug.includes(q) || desc.includes(q) || tags.some((t) => (t || "").toLowerCase().includes(q));
      });
    }
    return sortProducts(base, sortBy, categoryOrder);
  }, [products, tag, useCase, useCaseSlugs, query, sortBy, categoryOrder]);

  const visible = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page, pageSize]);
  const hasMore = visible.length < filtered.length;

  function quickAdd(product) {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitAmount: product.basePrice,
      quantity: 1,
      image: product.images[0]?.url || null,
      meta: { pricingUnit: product.pricingUnit },
      id: product.id,
      price: product.basePrice,
      options: { pricingUnit: product.pricingUnit },
    });
    openCart();
    showSuccessToast(t("shop.addedToCart"));
  }

  function clearAllFilters() {
    setQuery("");
    setTag("");
    setUseCase("");
    setPage(1);
    router.replace("/shop", { scroll: false });
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-10 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs items={[{ label: t("shop.header") }]} />

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{t("shop.header")}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("shop.title")}</h1>
          </div>
          {/* Compact search */}
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={query}
              onChange={(e) => {
                const nextQ = e.target.value;
                setQuery(nextQ);
                setPage(1);
                syncUrl({ query: nextQ });
              }}
              placeholder={t("shop.searchPlaceholder")}
              className="w-full rounded-full border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
        </header>

        {/* Filter chips */}
        {!isFiltering && (
          <div className="mb-6 flex flex-wrap gap-2">
            {USE_CASES.map((uc) => (
              <button
                key={uc.slug}
                onClick={() => {
                  setUseCase(uc.slug);
                  setPage(1);
                  syncUrl({ useCase: uc.slug });
                }}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400 transition-colors"
              >
                {uc.icon} {t(`useCase.${uc.slug}.title`)}
              </button>
            ))}
            {availableIndustryTags.slice(0, 6).map((tg) => {
              const meta = INDUSTRY_LABELS[tg];
              return (
                <button
                  key={tg}
                  onClick={() => {
                    setTag(tg);
                    setPage(1);
                    syncUrl({ tag: tg });
                  }}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400 transition-colors"
                >
                  {meta?.icon || ""} {meta?.label || tg}
                </button>
              );
            })}
          </div>
        )}

        {/* Active filter indicator */}
        {isFiltering && (
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              {t("shop.backToCategories")}
            </button>
            <p className="text-sm text-gray-500">
              {t("shop.showing", { visible: visible.length, total: filtered.length })}
            </p>
          </div>
        )}

        {/* Default: Category Grid grouped by department */}
        {!isFiltering && (
          <CategoryGrid
            departments={departments}
            departmentMeta={departmentMeta}
            categoryMeta={categoryMeta}
            categoryCounts={categoryCounts}
            t={t}
          />
        )}

        {/* Filtering: Product Grid */}
        {isFiltering && (
          <section className="space-y-4">
            {/* Sort + View controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">{t("shop.sort")}</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="popular">{t("shop.sortPopular")}</option>
                  <option value="price-asc">{t("shop.sortPriceAsc")}</option>
                  <option value="price-desc">{t("shop.sortPriceDesc")}</option>
                  <option value="name">{t("shop.sortName")}</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">{t("shop.perPage")}</label>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>

                <div className="rounded-full border border-gray-300 p-1 text-xs">
                  <button onClick={() => setView("grid")} className={`rounded-full px-3 py-1 ${view === "grid" ? "bg-gray-900 text-white" : "text-gray-600"}`}>{t("shop.grid")}</button>
                  <button onClick={() => setView("list")} className={`rounded-full px-3 py-1 ${view === "list" ? "bg-gray-900 text-white" : "text-gray-600"}`}>{t("shop.list")}</button>
                </div>
              </div>
            </div>

            {visible.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                <p className="text-sm font-medium text-gray-500">{t("shop.noResults")}</p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-3 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 hover:border-gray-900"
                >
                  {t("shop.clearFilters")}
                </button>
              </div>
            )}

            <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
              {visible.map((product) => {
                const href = `/shop/${product.category}/${product.slug}`;
                const isOutOfStock = !product.isActive;
                const rangeText = product.pricingUnit === "per_sqft"
                  ? `${formatCad(product.basePrice)} - ${formatCad(Math.round(product.basePrice * 3.5))}`
                  : `${formatCad(product.basePrice)} - ${formatCad(Math.round(product.basePrice * 2.2))}`;

                return (
                  <article key={product.id} className={`relative group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg ${view === "list" ? "flex" : ""}`}>
                    <Link href={href} className={`relative block bg-gray-100 ${view === "list" ? "h-44 w-52 flex-shrink-0" : "aspect-[4/3]"}`}>
                      {product.images[0]?.url ? (
                        <Image src={product.images[0].url} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 1280px) 50vw, 25vw" unoptimized={product.images[0].url.endsWith(".svg")} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">{t("shop.noImage")}</div>
                      )}
                      {product.sortOrder != null && product.sortOrder <= 2 && (
                        <span className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full z-10">
                          {t("shop.popular")}
                        </span>
                      )}
                      {isOutOfStock && <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-semibold text-white">{t("shop.outOfStock")}</span>}
                    </Link>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center gap-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{categoryLabels[product.category] || product.category}</p>
                        {(() => {
                          const tk = getTurnaround(product);
                          return (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${turnaroundColor(tk)}`}>
                              {t(turnaroundI18nKey(tk))}
                            </span>
                          );
                        })()}
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-gray-900">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{rangeText}</p>
                      <p className="mt-1 text-xs text-gray-500">{product.pricingUnit === "per_sqft" ? t("shop.perSqft") : t("shop.perPiece")}</p>

                      <div className="mt-4 flex gap-2">
                        <Link href={href} className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900">
                          {t("shop.view")}
                        </Link>
                        <button onClick={() => quickAdd(product)} className="rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black">
                          {t("shop.quickAdd")}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <div className="pt-2">
                <button onClick={() => setPage((p) => p + 1)} className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 hover:border-gray-900 hover:text-gray-900">
                  {t("shop.loadMore")}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
