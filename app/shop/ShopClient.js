"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export default function ShopClient({
  products,
  initialCategory,
  initialQuery = "",
  initialTag = "",
  initialUseCase = "",
  hiddenCategories = [],
  categoryMeta = {},
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(initialCategory || "all");
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

  // Sync view default after hydration for SSR safety
  useEffect(() => {
    if (window.innerWidth < 1024 && view === "grid") setView("list");
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenCategories), [hiddenCategories]);

  const categoryLabels = useMemo(() => {
    const labels = { all: "All Products" };
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

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    const visible = Array.from(set)
      .filter((cat) => !hiddenSet.has(cat))
      .sort((a, b) => {
        const ai = categoryOrder.has(a) ? categoryOrder.get(a) : 9999;
        const bi = categoryOrder.has(b) ? categoryOrder.get(b) : 9999;
        if (ai !== bi) return ai - bi;
        return a.localeCompare(b);
      });
    return ["all", ...visible];
  }, [products, hiddenSet, categoryOrder]);

  const availableIndustryTags = useMemo(() => {
    const present = new Set();
    for (const p of products) {
      if (!Array.isArray(p.tags)) continue;
      for (const t of p.tags) present.add(t);
    }
    return INDUSTRY_TAGS.filter((t) => present.has(t));
  }, [products]);

  function syncUrl(next) {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    const nextCategory = next?.category ?? category;
    const nextQuery = next?.query ?? query;
    const nextTag = next?.tag ?? tag;
    const nextUseCase = next?.useCase ?? useCase;

    if (nextCategory && nextCategory !== "all") sp.set("category", nextCategory);
    else sp.delete("category");

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
    let base = category === "all" ? products : products.filter((p) => p.category === category);
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
        const tags = Array.isArray(p.tags) ? p.tags : [];
        return name.includes(q) || slug.includes(q) || tags.some((t) => (t || "").toLowerCase().includes(q));
      });
    }
    return sortProducts(base, sortBy, categoryOrder);
  }, [products, category, tag, useCase, useCaseSlugs, query, sortBy, categoryOrder]);

  const visible = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page, pageSize]);
  const hasMore = visible.length < filtered.length;

  const featured = useMemo(() => sortProducts(products, "popular", categoryOrder).slice(0, 6), [products, categoryOrder]);

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

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-10 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs items={
          category && category !== "all"
            ? [{ label: t("shop.header"), href: "/shop" }, { label: categoryLabels[category] || category }]
            : [{ label: t("shop.header") }]
        } />

        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{t("shop.header")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("shop.title")}</h1>
        </header>

        {/* Mobile filters: compact search + category chips + toggle */}
        <div className="lg:hidden space-y-3 mb-4">
          <input
            value={query}
            onChange={(e) => {
              const nextQ = e.target.value;
              setQuery(nextQ);
              setPage(1);
              syncUrl({ query: nextQ });
            }}
            placeholder={t("shop.searchPlaceholder")}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                  syncUrl({ category: cat });
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  category === cat ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              {t("shop.filters")}
              {(useCase || tag) && <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[9px] text-white">!</span>}
            </button>
            {(useCase || tag) && (
              <button
                onClick={() => { setUseCase(""); setTag(""); setPage(1); syncUrl({ useCase: "", tag: "" }); }}
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-700"
              >
                {t("shop.clear")}
              </button>
            )}
          </div>
          {mobileFiltersOpen && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("shop.useCase")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {USE_CASES.map((uc) => {
                    const active = useCase === uc.slug;
                    return (
                      <button
                        key={uc.slug}
                        onClick={() => {
                          const next = active ? "" : uc.slug;
                          setUseCase(next);
                          setPage(1);
                          syncUrl({ useCase: next });
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {uc.icon} {t(`useCase.${uc.slug}.title`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              {availableIndustryTags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("shop.industry")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableIndustryTags.map((tg) => {
                      const meta = INDUSTRY_LABELS[tg];
                      const label = meta?.label || tg;
                      const icon = meta?.icon || "";
                      const active = tag === tg;
                      return (
                        <button
                          key={tg}
                          onClick={() => {
                            const nextTag = active ? "" : tg;
                            setTag(nextTag);
                            setPage(1);
                            syncUrl({ tag: nextTag });
                          }}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {icon} {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop sidebar — hidden on mobile */}
          <aside className="hidden lg:block space-y-4 rounded-3xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24 lg:h-fit">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("shop.search")}</p>
              <input
                value={query}
                onChange={(e) => {
                  const nextQ = e.target.value;
                  setQuery(nextQ);
                  setPage(1);
                  syncUrl({ query: nextQ });
                }}
                placeholder={t("shop.searchPlaceholder")}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("shop.useCase")}</p>
                {useCase && (
                  <button
                    onClick={() => { setUseCase(""); setPage(1); syncUrl({ useCase: "" }); }}
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-700"
                  >
                    {t("shop.clear")}
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {USE_CASES.map((uc) => {
                  const active = useCase === uc.slug;
                  return (
                    <button
                      key={uc.slug}
                      onClick={() => {
                        const next = active ? "" : uc.slug;
                        setUseCase(next);
                        setPage(1);
                        syncUrl({ useCase: next });
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {uc.icon} {t(`useCase.${uc.slug}.title`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("shop.categories")}</p>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setPage(1);
                    syncUrl({ category: cat });
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    category === cat ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("shop.industry")}</p>
                {tag && (
                  <button
                    onClick={() => {
                      setTag("");
                      setPage(1);
                      syncUrl({ tag: "" });
                    }}
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-700"
                  >
                    {t("shop.clear")}
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableIndustryTags.length === 0 ? (
                  <span className="text-xs text-gray-400">{t("shop.noIndustryTags")}</span>
                ) : (
                  availableIndustryTags.map((tg) => {
                    const meta = INDUSTRY_LABELS[tg];
                    const label = meta?.label || tg;
                    const icon = meta?.icon || "";
                    const active = tag === tg;
                    return (
                      <button
                        key={tg}
                        onClick={() => {
                          const nextTag = active ? "" : tg;
                          setTag(nextTag);
                          setPage(1);
                          syncUrl({ tag: nextTag });
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {icon} {label}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            {category === "all" && !tag && !(query || "").trim() && featured.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("shop.featuredPicks")}</p>
                  <Link href="/shop" className="text-xs font-semibold text-gray-600 hover:text-gray-900">
                    {t("shop.viewAll")}
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {featured.map((p) => (
                    <Link
                      key={p.id}
                      href={p.optionsConfig?.ui?.href || `/shop/${p.category}/${p.slug}`}
                      className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white border border-gray-200">
                        {p.images?.[0]?.url ? (
                          <Image src={p.images[0].url} alt={p.name} fill className="object-cover" sizes="56px" unoptimized={p.images[0].url.endsWith(".svg")} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">{t("shop.noImage")}</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">{categoryLabels[p.category] || p.category}</p>
                      </div>
                      <div className="text-xs font-semibold text-gray-700">{p.basePrice > 0 ? formatCad(p.basePrice) : "Quote"}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                {t("shop.showing", { visible: visible.length, total: filtered.length })}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">{t("shop.sort")}</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
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
                  onClick={() => { setCategory("all"); setTag(""); setUseCase(""); setQuery(""); setPage(1); router.replace("/shop", { scroll: false }); }}
                  className="mt-3 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 hover:border-gray-900"
                >
                  {t("shop.clearFilters")}
                </button>
              </div>
            )}

            <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
              {visible.map((product) => {
                const href = product.optionsConfig?.ui?.href || `/shop/${product.category}/${product.slug}`;
                const isOutOfStock = !product.isActive;
                const showFromPrice = product.optionsConfig?.ui?.showFromPrice === true;
                const isLandingPage = product.optionsConfig?.ui?.isLandingPage === true;
                const rangeText = showFromPrice
                  ? t("product.from", { price: formatCad(product.basePrice) })
                  : product.pricingUnit === "per_sqft" ? `${formatCad(product.basePrice)} - ${formatCad(Math.round(product.basePrice * 3.5))}` : `${formatCad(product.basePrice)} - ${formatCad(Math.round(product.basePrice * 2.2))}`;

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
                      {isLandingPage && product.description && (
                        <p className="mt-1 text-xs text-gray-500">{product.description}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-600">{rangeText}</p>
                      {!showFromPrice && (
                        <p className="mt-1 text-xs text-gray-500">{product.pricingUnit === "per_sqft" ? t("shop.perSqft") : t("shop.perPiece")}</p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Link href={href} className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900">
                          {isLandingPage ? t("bc.landing.viewAll") : t("shop.view")}
                        </Link>
                        {!isLandingPage && (
                          <button onClick={() => quickAdd(product)} className="rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black">
                            {t("shop.quickAdd")}
                          </button>
                        )}
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
        </div>
      </div>
    </main>
  );
}
