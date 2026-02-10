"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";
import { INDUSTRY_LABELS, INDUSTRY_TAGS } from "@/lib/industryTags";
import { useTranslation } from "@/lib/i18n/useTranslation";

const PAGE_SIZE_OPTIONS = [12, 24, 36];

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function sortProducts(list, sortBy) {
  const arr = [...list];
  if (sortBy === "price-asc") arr.sort((a, b) => a.basePrice - b.basePrice);
  if (sortBy === "price-desc") arr.sort((a, b) => b.basePrice - a.basePrice);
  if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === "popular") arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return arr;
}

export default function ShopClient({
  products,
  initialCategory,
  initialQuery = "",
  initialTag = "",
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
  const [sortBy, setSortBy] = useState("popular");
  const [view, setView] = useState("grid");
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);

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

    if (nextCategory && nextCategory !== "all") sp.set("category", nextCategory);
    else sp.delete("category");

    if (nextQuery && nextQuery.trim()) sp.set("q", nextQuery.trim());
    else sp.delete("q");

    if (nextTag && nextTag.trim()) sp.set("tag", nextTag.trim());
    else sp.delete("tag");

    const qs = sp.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }

  const filtered = useMemo(() => {
    let base = category === "all" ? products : products.filter((p) => p.category === category);
    if (tag) {
      base = base.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag));
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
    return sortProducts(base, sortBy);
  }, [products, category, tag, query, sortBy]);

  const visible = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page, pageSize]);
  const hasMore = visible.length < filtered.length;

  const featured = useMemo(() => sortProducts(products, "popular").slice(0, 6), [products]);

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
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{t("shop.header")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("shop.title")}</h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24 lg:h-fit">
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
                  availableIndustryTags.map((t) => {
                    const meta = INDUSTRY_LABELS[t];
                    const label = meta?.label || t;
                    const icon = meta?.icon || "🏷️";
                    const active = tag === t;
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          const nextTag = active ? "" : t;
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
                      href={`/shop/${p.category}/${p.slug}`}
                      className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white border border-gray-200">
                        {p.images?.[0]?.url ? (
                          <Image src={p.images[0].url} alt={p.name} fill className="object-cover" sizes="56px" />
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

            <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
              {visible.map((product) => {
                const href = `/shop/${product.category}/${product.slug}`;
                const isOutOfStock = !product.isActive;
                const rangeText = product.pricingUnit === "per_sqft" ? `${formatCad(product.basePrice)} - ${formatCad(Math.round(product.basePrice * 3.5))}` : `${formatCad(product.basePrice)} - ${formatCad(Math.round(product.basePrice * 2.2))}`;

                return (
                  <article key={product.id} className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg ${view === "list" ? "flex" : ""}`}>
                    <Link href={href} className={`relative block bg-gray-100 ${view === "list" ? "h-44 w-52 flex-shrink-0" : "aspect-[4/3]"}`}>
                      {product.images[0]?.url ? (
                        <Image src={product.images[0].url} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 1280px) 50vw, 25vw" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">{t("shop.noImage")}</div>
                      )}
                      {isOutOfStock && <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-semibold text-white">{t("shop.outOfStock")}</span>}
                    </Link>

                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{categoryLabels[product.category] || product.category}</p>
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
        </div>
      </div>
    </main>
  );
}
