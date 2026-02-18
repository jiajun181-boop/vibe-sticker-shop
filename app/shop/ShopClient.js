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
import QuickViewModal from "@/components/product/QuickViewModal";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import { useFavoritesStore } from "@/lib/favorites";

const PAGE_SIZE_OPTIONS = [12, 24, 36];
const HOT_PICK_SLUGS = [
  "business-cards-classic",
  "window-graphics",
  "vehicle-wraps",
  "brochures",
  "die-cut-stickers",
  "yard-signs",
];

const MATERIAL_OPTIONS = [
  { key: "paper", label: "Paper" },
  { key: "adhesive", label: "Adhesive" },
  { key: "non-adhesive", label: "Non-Adhesive" },
  { key: "rigid", label: "Rigid" },
  { key: "hardware", label: "Hardware" },
];

const CATEGORY_MATERIAL_MAP = {
  "marketing-business-print": "paper",
  "stickers-labels-decals": "adhesive",
  "signs-rigid-boards": "rigid",
  "banners-displays": "non-adhesive",
  "windows-walls-floors": "adhesive",
  "vehicle-graphics-fleet": "adhesive",
};

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

/* ── Small category card (no sub-groups) ──────────────────────── */
function SmallCard({ catSlug, meta, count, previews, t }) {
  return (
    <Link
      href={meta?.href || `/shop/${catSlug}`}
      className="group flex flex-col rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 hover-lift-subtle"
    >
      <span className="text-2xl">{meta?.icon || ""}</span>
      <h3 className="mt-2 text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-moon-gold)] transition-colors">
        {t(`catalog.cat.${catSlug}`) !== `catalog.cat.${catSlug}` ? t(`catalog.cat.${catSlug}`) : (meta?.title || catSlug)}
      </h3>
      {count > 0 && (
        <p className="mt-1 text-[11px] text-[var(--color-gray-400)]">
          {count} {t("mp.landing.products")}
        </p>
      )}
      {previews.length > 0 && (
        <div className="mt-2 flex -space-x-1.5">
          {previews.map((url, i) => (
            <div key={i} className="relative h-7 w-7 rounded-full border-2 border-white overflow-hidden bg-[var(--color-gray-100)]">
              <Image src={url} alt="" fill className="object-cover" sizes="28px" unoptimized={url.endsWith(".svg")} />
            </div>
          ))}
          {count > previews.length && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[var(--color-gray-100)] label-xs font-bold text-[var(--color-gray-500)]">
              +{count - previews.length}
            </div>
          )}
        </div>
      )}
      <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)] group-hover:text-[var(--color-gray-900)] transition-colors">
        {t("mp.landing.browse")}
        <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </span>
    </Link>
  );
}

/* ── Wide parent card with sub-group pills ────────────────────── */
function ParentCard({ catSlug, meta, count, t }) {
  const subGroups = meta?.subGroups || [];
  return (
    <div className="col-span-2 md:col-span-3 lg:col-span-4 rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-[var(--color-gray-300)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta?.icon || ""}</span>
          <div>
            <h3 className="text-base font-semibold text-[var(--color-gray-900)]">{t(`catalog.cat.${catSlug}`) !== `catalog.cat.${catSlug}` ? t(`catalog.cat.${catSlug}`) : (meta?.title || catSlug)}</h3>
            {count > 0 && (
              <p className="text-[11px] text-[var(--color-gray-400)]">{count} {t("mp.landing.products")}</p>
            )}
          </div>
        </div>
        <Link
          href={`/shop/${catSlug}`}
          className="flex-none rounded-xl border border-[var(--color-gray-300)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)] transition-colors"
        >
          {t("mp.landing.browse")}
        </Link>
      </div>
      {subGroups.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {subGroups.map((sg) => (
            <Link
              key={sg.slug}
              href={sg.href}
              className="rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-1.5 text-xs font-medium text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)] hover:bg-white hover:text-[var(--color-gray-900)]"
            >
              {t(`catalog.sub.${sg.slug}`) !== `catalog.sub.${sg.slug}` ? t(`catalog.sub.${sg.slug}`) : sg.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function renderCategoryCards(categorySlugs, categoryMeta, categoryCounts, categoryPreviews, t) {
  return categorySlugs.map((catSlug) => {
    const meta = categoryMeta?.[catSlug];
    const count = categoryCounts?.[catSlug] || 0;
    const previews = categoryPreviews?.[catSlug] || [];

    if (meta?.subGroups) {
      return <ParentCard key={catSlug} catSlug={catSlug} meta={meta} count={count} t={t} />;
    }

    return <SmallCard key={catSlug} catSlug={catSlug} meta={meta} count={count} previews={previews} t={t} />;
  });
}

function CategoryGrid({ departments, departmentMeta, categoryMeta, categoryCounts, categoryPreviews, expandedDepts, toggleDept, t }) {
  return (
    <div className="space-y-6">
      {departments.map((dept) => {
        const deptMeta = departmentMeta?.[dept.key];
        const subSections = deptMeta?.subSections;
        const isOpen = expandedDepts.has(dept.key);

        return (
          <section key={dept.key} className="rounded-2xl border border-[var(--color-gray-200)] bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => toggleDept(dept.key)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--color-gray-50)]"
            >
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-gray-900)]">
                {t(`catalog.dept.${dept.key}`) !== `catalog.dept.${dept.key}` ? t(`catalog.dept.${dept.key}`) : (deptMeta?.title || dept.key)}
              </h2>
              <svg
                className={`h-5 w-5 flex-shrink-0 text-[var(--color-gray-400)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-[var(--color-gray-100)] px-5 pb-5">
                {subSections ? (
                  <div className="mt-4 space-y-6">
                    {subSections.map((ss) => (
                      <div key={ss.label}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-3">
                          {ss.i18nKey ? t(ss.i18nKey) : ss.label}
                        </p>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          {renderCategoryCards(ss.categories, categoryMeta, categoryCounts, categoryPreviews, t)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {renderCategoryCards(dept.categories, categoryMeta, categoryCounts, categoryPreviews, t)}
                  </div>
                )}
              </div>
            )}
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
  initialView = "",
  categoryMeta = {},
  departments = [],
  departmentMeta = {},
  categoryCounts = {},
  categoryPreviews = {},
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery || "");
  const [tag, setTag] = useState(initialTag || "");
  const [useCase, setUseCase] = useState(initialUseCase || "");
  const [material, setMaterial] = useState(searchParams?.get("material") || "");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : "grid"
  );
  const [pageSize, setPageSize] = useState(24);
  const [page, setPage] = useState(1);
  const [browseAll, setBrowseAll] = useState(initialView === "all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const isInternalUrlUpdate = useRef(false);
  const searchInputRef = useRef(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [expandedDepts, setExpandedDepts] = useState(() => new Set(departments.map((d) => d.key)));

  useEffect(() => {
    if (window.innerWidth < 1024 && viewMode === "grid") setViewMode("list");
  }, []);

  // Auto-focus search input when ?focus=search is present (e.g. mobile Search tab)
  useEffect(() => {
    if (searchParams?.get("focus") === "search" && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchParams]);

  // Sync state from URL on external navigation
  useEffect(() => {
    if (isInternalUrlUpdate.current) {
      isInternalUrlUpdate.current = false;
      return;
    }
    setQuery(searchParams?.get("q") || "");
    setTag(searchParams?.get("tag") || "");
    setUseCase(searchParams?.get("useCase") || "");
    setMaterial(searchParams?.get("material") || "");
    const v = searchParams?.get("view");
    setBrowseAll(v === "all");
    if (searchParams?.get("material")) setCatalogTab("material");
    else if (v === "all") setCatalogTab("products");
    else setCatalogTab("category");
    setPage(1);
  }, [searchParams]);

  // Save scroll position to sessionStorage on scroll (debounced 200ms)
  const scrollTimerRef = useRef(null);
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        sessionStorage.setItem("shop-scroll-y", window.scrollY);
      }, 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // Restore scroll position from sessionStorage on mount
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")?.[0];
    const isBackForwardNav = nav?.type === "back_forward";
    if (!isBackForwardNav) {
      sessionStorage.removeItem("shop-scroll-y");
      return;
    }

    const saved = sessionStorage.getItem("shop-scroll-y");
    if (!saved) return;
    const y = parseInt(saved, 10);
    if (isNaN(y) || y <= 0) return;

    requestAnimationFrame(() => {
      window.scrollTo(0, y);
    });
  }, []);

  const isFiltering = !!(query.trim() || tag || useCase);
  const [catalogTab, setCatalogTab] = useState(() => {
    if (initialView === "all") return "products";
    if (searchParams?.get("material")) return "material";
    return "category";
  });
  const showProducts = catalogTab === "products" || isFiltering;
  const isMaterialCatalog = catalogTab === "material";

  const categoryLabels = useMemo(() => {
    const labels = {};
    for (const [slug, meta] of Object.entries(categoryMeta)) {
      const key = `catalog.cat.${slug}`;
      const translated = t(key);
      labels[slug] = translated !== key ? translated : (meta.title || slug);
    }
    return labels;
  }, [categoryMeta, t]);

  const categoryOrder = useMemo(() => {
    const m = new Map();
    Object.keys(categoryMeta).forEach((k, i) => m.set(k, i));
    return m;
  }, [categoryMeta]);

  const availableIndustryTags = useMemo(() => {
    const present = new Set();
    for (const p of products) {
      if (!Array.isArray(p.tags)) continue;
      for (const tg of p.tags) present.add(tg);
    }
    return INDUSTRY_TAGS.filter((tg) => present.has(tg));
  }, [products]);

  // Categories that actually have products (for filter chips)
  const availableCategories = useMemo(() => {
    const catSet = new Set(products.map((p) => p.category));
    return Object.keys(categoryMeta).filter((slug) => catSet.has(slug));
  }, [products, categoryMeta]);

  const hotPicks = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const picked = HOT_PICK_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean);
    if (picked.length >= 6) return picked.slice(0, 6);
    const fallback = sortProducts(products, "popular", categoryOrder).filter(
      (p) => !picked.some((x) => x.id === p.id)
    );
    return [...picked, ...fallback.slice(0, 6 - picked.length)];
  }, [products, categoryOrder]);

  function syncUrl(next) {
    isInternalUrlUpdate.current = true;
    const sp = new URLSearchParams(searchParams?.toString() || "");
    const nextQuery = next?.query ?? query;
    const nextTag = next?.tag ?? tag;
    const nextUseCase = next?.useCase ?? useCase;
    const nextMaterial = next?.material ?? material;
    const nextBrowseAll = next?.browseAll ?? browseAll;

    if (nextQuery && nextQuery.trim()) sp.set("q", nextQuery.trim());
    else sp.delete("q");

    if (nextTag && nextTag.trim()) sp.set("tag", nextTag.trim());
    else sp.delete("tag");

    if (nextUseCase && nextUseCase.trim()) sp.set("useCase", nextUseCase.trim());
    else sp.delete("useCase");

    if (nextMaterial && nextMaterial.trim()) sp.set("material", nextMaterial.trim());
    else sp.delete("material");

    if (!nextBrowseAll && !nextQuery && !nextTag && !nextUseCase && !nextMaterial) sp.set("view", "category");
    else sp.delete("view");

    const qs = sp.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }

  const useCaseSlugs = useMemo(() => {
    if (!useCase || !USE_CASE_PRODUCTS[useCase]) return null;
    return new Set(USE_CASE_PRODUCTS[useCase]);
  }, [useCase]);

  const filtered = useMemo(() => {
    let base = [...products];
    if (material) {
      base = base.filter((p) => CATEGORY_MATERIAL_MAP[p.category] === material);
    }
    if (categoryFilter) {
      base = base.filter((p) => p.category === categoryFilter);
    }
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
        return name.includes(q) || slug.includes(q) || desc.includes(q) || tags.some((tg) => (tg || "").toLowerCase().includes(q));
      });
    }
    return sortProducts(base, sortBy, categoryOrder);
  }, [products, categoryFilter, tag, useCase, useCaseSlugs, query, sortBy, categoryOrder, material]);

  const visible = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page, pageSize]);
  const hasMore = visible.length < filtered.length;

  function quickAdd(product) {
    const image = getProductImage(product);
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitAmount: product.basePrice,
      quantity: 1,
      image,
      meta: { pricingUnit: product.pricingUnit },
      id: product.id,
      price: product.basePrice,
      options: { pricingUnit: product.pricingUnit },
    });
    openCart();
    showSuccessToast(t("shop.addedToCart"));
  }

  function toggleDept(key) {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllDepts() {
    if (allExpanded) {
      setExpandedDepts(new Set());
    } else {
      setExpandedDepts(new Set(currentDepartments.map((d) => d.key)));
    }
  }

  const materialFilteredDepartments = useMemo(() => {
    if (!material) return departments;

    return departments
      .map((dept) => {
        const filteredCats = (dept.categories || []).filter((cat) => CATEGORY_MATERIAL_MAP[cat] === material);
        const deptMeta = departmentMeta?.[dept.key];
        const subSections = deptMeta?.subSections
          ?.map((ss) => ({
            ...ss,
            categories: (ss.categories || []).filter((cat) => CATEGORY_MATERIAL_MAP[cat] === material),
          }))
          .filter((ss) => ss.categories.length > 0);

        return {
          ...dept,
          categories: filteredCats,
          __subSections: subSections,
        };
      })
      .filter((dept) => dept.categories.length > 0);
  }, [departments, departmentMeta, material]);

  const materialFilteredDepartmentMeta = useMemo(() => {
    if (!material) return departmentMeta;
    const next = { ...departmentMeta };
    for (const dept of materialFilteredDepartments) {
      if (dept.__subSections) {
        next[dept.key] = { ...(next[dept.key] || {}), subSections: dept.__subSections };
      }
    }
    return next;
  }, [departmentMeta, material, materialFilteredDepartments]);

  const currentDepartments = isMaterialCatalog && material ? materialFilteredDepartments : departments;
  const allExpanded = currentDepartments.length > 0 && currentDepartments.every((d) => expandedDepts.has(d.key));

  function clearAllFilters() {
    setQuery("");
    setTag("");
    setUseCase("");
    setMaterial("");
    setCategoryFilter("");
    setPage(1);
    isInternalUrlUpdate.current = true;
    if (browseAll) {
      router.push("/shop", { scroll: false });
    } else {
      router.push("/shop?view=category", { scroll: false });
    }
  }

  function switchToCategories() {
    sessionStorage.removeItem("shop-scroll-y");
    setBrowseAll(false);
    setCategoryFilter("");
    setQuery("");
    setTag("");
    setUseCase("");
    setMaterial("");
    setCatalogTab("category");
    setPage(1);
    isInternalUrlUpdate.current = true;
    router.push("/shop?view=category", { scroll: false });
  }

  function switchToAllProducts() {
    sessionStorage.removeItem("shop-scroll-y");
    setBrowseAll(true);
    setMaterial("");
    setCatalogTab("products");
    setPage(1);
    isInternalUrlUpdate.current = true;
    router.push("/shop", { scroll: false });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--color-gray-50)] via-gray-50 to-white px-3 pb-16 pt-8 text-[var(--color-gray-900)] sm:px-4 sm:pt-10">
      <div className="mx-auto max-w-[1600px]">
        <Breadcrumbs items={[{ label: t("shop.header") }]} />

        <header className="mb-5 overflow-hidden rounded-3xl border border-[var(--color-gray-200)] bg-white shadow-sm sm:mb-6">
          <div className="grid gap-4 bg-[var(--color-ink-black)] p-4 text-white sm:grid-cols-2 sm:gap-8 sm:p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-300)]">{t("shop.header")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("shop.title")}</h1>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-gray-300)]">
                {t("shop.tagline")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge-soft bg-emerald-200 text-emerald-900">{t("shop.badge.fastTurnaround")}</span>
                <span className="badge-soft bg-white/20 text-white">{t("shop.badge.livePricing")}</span>
                <span className="badge-soft bg-blue-200 text-blue-900">{t("shop.badge.madeInCanada")}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-200)]">{t("shop.searchPlaceholder")}</p>
              <div className="relative mt-2">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-gray-300)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => {
                    const nextQ = e.target.value;
                    setQuery(nextQ);
                    setPage(1);
                    syncUrl({ query: nextQ });
                  }}
                  placeholder={t("shop.searchPlaceholder")}
                  className="w-full rounded-full border border-white/20 bg-white/95 pl-9 pr-4 py-3 text-sm text-[var(--color-gray-900)] focus:border-white focus:outline-none"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCatalogTab("material");
                    setPage(1);
                    requestAnimationFrame(() => {
                      const el = document.getElementById("material-filter");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  }}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-900)] hover:bg-[var(--color-gray-100)]"
                >
                  打印物料
                </button>
                <Link
                  href="/quote"
                  className="rounded-xl border border-white/30 bg-transparent px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10 hover:border-white/50 transition-colors"
                >
                  {t("shop.getQuote")}
                </Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-[var(--color-gray-100)] bg-white px-4 py-3 text-center sm:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-gray-400)]">{t("shop.statsProducts")}</p>
              <p className="text-sm font-semibold text-[var(--color-gray-900)]">{products.length}</p>
            </div>
            <div className="border-x border-[var(--color-gray-100)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-gray-400)]">{t("shop.statsCategories")}</p>
              <p className="text-sm font-semibold text-[var(--color-gray-900)]">{availableCategories.length}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-gray-400)]">{t("shop.statsMadeFor")}</p>
              <p className="text-sm font-semibold text-[var(--color-gray-900)]">{USE_CASES.length} {t("shop.statsIndustries")}</p>
            </div>
          </div>
        </header>

        <section className="mb-5 rounded-2xl border border-[var(--color-gray-200)] bg-white p-3 sm:mb-6 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gray-500)]">
              Hot Picks
            </p>
            <button
              type="button"
              onClick={switchToAllProducts}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)]"
            >
              Browse All
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {hotPicks.map((p) => (
              <Link
                key={p.id}
                href={`/shop/${p.category}/${p.slug}`}
                className="flex-none rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-2 text-xs font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)] hover:bg-white hover:text-[var(--color-gray-900)]"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </section>

        <div className="mb-5 flex items-center gap-4 sm:mb-6">
          <div className="inline-flex rounded-full border border-[var(--color-gray-300)] p-0.5 text-xs font-semibold">
            <button
              onClick={() => {
                setCatalogTab("products");
                setBrowseAll(true);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 transition-colors ${catalogTab === "products" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]"}`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => {
                setCatalogTab("category");
                setBrowseAll(false);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 transition-colors ${catalogTab === "category" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]"}`}
            >
              Catalog
            </button>
            <button
              onClick={() => {
                setCatalogTab("material");
                setBrowseAll(false);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 transition-colors ${catalogTab === "material" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]"}`}
            >
              打印物料
            </button>
          </div>
        </div>

        {isMaterialCatalog && (
          <div id="material-filter" className="mb-5 flex flex-wrap items-center gap-2 sm:mb-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gray-500)]">打印物料</span>
            <button
              type="button"
              onClick={() => {
                setMaterial("");
                setPage(1);
                syncUrl({ material: "" });
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !material ? "bg-[var(--color-ink-black)] text-white" : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
              }`}
            >
              All
            </button>
            {MATERIAL_OPTIONS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setMaterial(m.key);
                  setPage(1);
                  syncUrl({ material: m.key });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  material === m.key
                    ? "bg-[var(--color-ink-black)] text-white"
                    : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Category Grid (default view) */}
        {!showProducts && (
          <>
            {currentDepartments.length > 0 ? (
              <>
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={toggleAllDepts}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-gray-300)] px-4 py-2 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-ink-black)] hover:text-[var(--color-ink-black)]"
                  >
                    {allExpanded ? (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                        {t("shop.collapseAll")}
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                        {t("shop.expandAll")}
                      </>
                    )}
                  </button>
                </div>
                <CategoryGrid
                  departments={isMaterialCatalog && material ? materialFilteredDepartments : departments}
                  departmentMeta={isMaterialCatalog && material ? materialFilteredDepartmentMeta : departmentMeta}
                  categoryMeta={categoryMeta}
                  categoryCounts={categoryCounts}
                  categoryPreviews={categoryPreviews}
                  expandedDepts={expandedDepts}
                  toggleDept={toggleDept}
                  t={t}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-10 text-center text-sm text-[var(--color-gray-500)]">
                No categories found for this material. Try another material filter.
              </div>
            )}
          </>
        )}

        {/* All Products View */}
        {showProducts && (
          <section className="space-y-4">
            {/* Category filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => { setCategoryFilter(""); setPage(1); }}
                className={`flex-none rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  !categoryFilter
                    ? "bg-[var(--color-ink-black)] text-white"
                    : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
                }`}
              >
                {t("shop.all")} ({products.length})
              </button>
              {availableCategories.map((catSlug) => {
                const meta = categoryMeta[catSlug];
                return (
                  <button
                    key={catSlug}
                    onClick={() => { setCategoryFilter(categoryFilter === catSlug ? "" : catSlug); setPage(1); }}
                    className={`flex-none rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      categoryFilter === catSlug
                        ? "bg-[var(--color-ink-black)] text-white"
                        : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
                    }`}
                  >
                    {meta?.icon} {t(`catalog.cat.${catSlug}`) !== `catalog.cat.${catSlug}` ? t(`catalog.cat.${catSlug}`) : (meta?.title || catSlug)} ({categoryCounts[catSlug] || 0})
                  </button>
                );
              })}
            </div>

            {/* Active filter indicator */}
            {isFiltering && (
              <div className="flex items-center gap-3">
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-ink-black)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-black transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t("shop.clearFilters")}
                </button>
                <p className="text-sm text-[var(--color-gray-500)]">
                  {t("shop.showing", { visible: visible.length, total: filtered.length })}
                </p>
              </div>
            )}

            {/* Sort + View controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-gray-200)] bg-white p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("shop.sort")}</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="rounded-lg border border-[var(--color-gray-300)] px-2 py-1 text-sm"
                >
                  <option value="popular">{t("shop.sortPopular")}</option>
                  <option value="price-asc">{t("shop.sortPriceAsc")}</option>
                  <option value="price-desc">{t("shop.sortPriceDesc")}</option>
                  <option value="name">{t("shop.sortName")}</option>
                </select>

                <p className="text-xs text-[var(--color-gray-400)]">
                  {filtered.length} {t("mp.landing.products")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full border border-[var(--color-gray-300)] p-0.5 text-xs">
                  <button onClick={() => setViewMode("grid")} className={`rounded-full px-3 py-1 ${viewMode === "grid" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)]"}`}>{t("shop.grid")}</button>
                  <button onClick={() => setViewMode("list")} className={`rounded-full px-3 py-1 ${viewMode === "list" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)]"}`}>{t("shop.list")}</button>
                </div>
              </div>
            </div>

            {visible.length === 0 && (
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-12 text-center">
                <p className="text-sm font-medium text-[var(--color-gray-500)]">{t("shop.noResults")}</p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-3 rounded-xl border border-[var(--color-gray-300)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)] hover:border-[var(--color-ink-black)]"
                >
                  {t("shop.clearFilters")}
                </button>
              </div>
            )}

            <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
              {visible.map((product) => {
                const href = `/shop/${product.category}/${product.slug}`;
                const isOutOfStock = !product.isActive;
                const imageSrc = getProductImage(product);
                const fromCents = product.fromPrice || product.basePrice;
                const rangeText = fromCents > 0 ? t("shop.priceFrom", { price: formatCad(fromCents) }) : "";

                return (
                  <article key={product.id} className={`relative group overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white hover-lift-subtle ${viewMode === "list" ? "flex" : ""}`}>
                    <Link href={href} className={`relative block bg-[var(--color-gray-100)] ${viewMode === "list" ? "h-36 w-32 sm:h-44 sm:w-52 flex-shrink-0" : "aspect-[4/3]"}`}>
                      <Image src={imageSrc} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 1280px) 50vw, 25vw" unoptimized={isSvgImage(imageSrc)} />
                      {product.sortOrder != null && product.sortOrder <= 2 && (
                        <span className="absolute top-2 right-2 bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-xl z-10">
                          {t("shop.popular")}
                        </span>
                      )}
                      {isOutOfStock && <span className="absolute left-2 top-2 rounded-xl bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white">{t("shop.outOfStock")}</span>}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const added = toggleFavorite({ slug: product.slug, category: product.category, name: product.name, image: imageSrc, basePrice: product.basePrice });
                        showSuccessToast(added ? t("favorites.added") : t("favorites.removed"));
                      }}
                      className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
                    >
                      <svg className={`h-4 w-4 transition-colors ${isFavorite(product.slug) ? "fill-red-500 text-red-500" : "fill-none text-[var(--color-gray-600)]"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>

                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <p className="label-xs text-[var(--color-gray-500)]">{categoryLabels[product.category] || product.category}</p>
                        {(() => {
                          const tk = getTurnaround(product);
                          return (
                            <span className={`rounded-full px-2 py-0.5 label-xs font-semibold ${turnaroundColor(tk)}`}>
                              {t(turnaroundI18nKey(tk))}
                            </span>
                          );
                        })()}
                      </div>
                      <h3 className="mt-1 min-h-[2.5rem] overflow-hidden body-sm font-semibold leading-5 text-[var(--color-gray-900)]">{product.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-gray-900)]">{rangeText}</p>

                      <div className="mt-3 flex gap-2">
                        <Link
                          href={href}
                          className="flex-1 rounded-xl bg-[var(--color-ink-black)] px-3 py-2 text-center label-sm text-white transition-colors hover:bg-black"
                        >
                          {t("shop.viewDetails")}
                        </Link>
                        <button
                          onClick={() => quickAdd(product)}
                          className="rounded-xl border border-[var(--color-gray-300)] px-3 py-2 label-sm text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-ink-black)] hover:text-[var(--color-ink-black)]"
                        >
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
                <button onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[var(--color-gray-300)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]">
                  {t("shop.loadMore")}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={(p) => { quickAdd(p); setQuickViewProduct(null); }}
          t={t}
        />
      )}
    </main>
  );
}
