"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getProductMaterials } from "@/lib/pricing/product-materials";
import { ProductCenterBreadcrumb, ProductCenterViewStrip } from "@/components/admin/ProductCenterHeader";

const CATEGORIES = [
  { value: "all", labelKey: "admin.priceDash.catAll" },
  { value: "stickers-labels-decals", labelKey: "admin.priceDash.catStickers" },
  { value: "signs-rigid-boards", labelKey: "admin.priceDash.catSigns" },
  { value: "banners-displays", labelKey: "admin.priceDash.catBanners" },
  { value: "marketing-business-print", labelKey: "admin.priceDash.catMarketing" },
  { value: "windows-walls-floors", labelKey: "admin.priceDash.catWindows" },
  { value: "vehicle-graphics-fleet", labelKey: "admin.priceDash.catVehicle" },
  { value: "canvas-prints", labelKey: "admin.priceDash.catCanvas" },
];

export default function PricingDashboardPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, withPreset: 0, outsourced: 0, templateBased: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState("all"); // all | covered | uncovered
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products?page=1&limit=500");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data.products || []);
      if (data.stats) {
        setStats({
          total: data.stats.totalActive || 0,
          withPreset: data.stats.withPreset || 0,
          outsourced: data.stats.outsourced || 0,
          templateBased: data.stats.templateBased || 0,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = products.filter(p => p.isActive);
    if (category !== "all") {
      list = list.filter(p => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.slug || "").toLowerCase().includes(q)
      );
    }
    if (coverageFilter !== "all") {
      list = list.filter(p => {
        const pm = getProductMaterials(p.slug);
        return coverageFilter === "covered" ? !!pm : !pm;
      });
    }
    return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [products, category, search, coverageFilter]);

  // Coverage stats for active products
  const coverageStats = useMemo(() => {
    const active = products.filter(p => p.isActive);
    let covered = 0;
    for (const p of active) {
      if (getProductMaterials(p.slug)) covered++;
    }
    return { covered, uncovered: active.length - covered };
  }, [products]);

  // Determine pricing model label
  function getPricingLabel(product) {
    if (product.pricingPresetId) return { label: t("admin.priceDash.modelPreset"), color: "bg-blue-100 text-blue-800" };
    try {
      const cfg = typeof product.pricingConfig === "string" ? JSON.parse(product.pricingConfig) : product.pricingConfig;
      if (cfg?.fixedPrices && Object.keys(cfg.fixedPrices).length > 0) {
        return { label: t("admin.priceDash.modelFixed"), color: "bg-green-100 text-green-800" };
      }
    } catch { /* ignore */ }
    return { label: t("admin.priceDash.modelTemplate"), color: "bg-gray-100 text-gray-700" };
  }

  // Material coverage status per product
  function getCoverageLabel(slug) {
    const pm = getProductMaterials(slug);
    if (!pm) return { label: t("admin.priceDash.covFallback"), color: "bg-amber-50 text-amber-700 border border-amber-200", covered: false };
    if (pm.type === "fixed") return { label: t("admin.priceDash.covFixed"), color: "bg-sky-50 text-sky-700 border border-sky-200", covered: true };
    return { label: t("admin.priceDash.covMapped"), color: "bg-emerald-50 text-emerald-700 border border-emerald-200", covered: true };
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb + view strip */}
      <div>
        <ProductCenterBreadcrumb />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black">{t("admin.priceDash.title")}</h1>
            <p className="mt-0.5 text-sm text-[#999]">{t("admin.priceDash.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/pricing-dashboard/log"
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-[11px] font-medium text-[#666] hover:border-black hover:text-black"
            >
              {t("admin.priceDash.changeLog")}
            </Link>
          </div>
        </div>
      </div>
      <ProductCenterViewStrip activeView="pricing" />

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("admin.priceDash.statTotal")} value={stats.total} color="text-gray-900" />
        <StatCard label={t("admin.priceDash.statPreset")} value={stats.withPreset} color="text-blue-600" />
        <StatCard label={t("admin.priceDash.statFixed")} value={stats.outsourced} color="text-green-600" />
        <StatCard label={t("admin.priceDash.statTemplate")} value={stats.templateBased} color="text-gray-600" />
      </div>

      {/* Material coverage summary */}
      {!loading && coverageStats.covered > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
          <span className="font-medium text-gray-700">{t("admin.priceDash.materialCoverage")}</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {coverageStats.covered} {t("admin.priceDash.covCovered")}
          </span>
          {coverageStats.uncovered > 0 && (
            <button
              onClick={() => setCoverageFilter(coverageFilter === "uncovered" ? "all" : "uncovered")}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                coverageFilter === "uncovered"
                  ? "bg-amber-200 text-amber-900"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              {coverageStats.uncovered} {t("admin.priceDash.covUncovered")}
            </button>
          )}
          {coverageFilter !== "all" && (
            <button
              onClick={() => setCoverageFilter("all")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {t("admin.priceDash.covShowAll")}
            </button>
          )}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder={t("admin.priceDash.searchPlaceholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-base text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            style={{ minHeight: 44 }}
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          style={{ minHeight: 44 }}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
          ))}
        </select>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="py-12 text-center text-base text-gray-400">{t("admin.common.loading")}</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-base text-red-700">{error}</p>
          <button onClick={fetchProducts} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            {t("admin.common.retry")}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-base text-gray-400">{t("admin.priceDash.noProducts")}</div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {t("admin.priceDash.showingCount").replace("{count}", filtered.length)}
          </p>

          {/* Mobile: card list */}
          <div className="space-y-2 sm:hidden">
            {filtered.map(product => {
              const pricing = getPricingLabel(product);
              const coverage = getCoverageLabel(product.slug);
              return (
                <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400 truncate">{product.slug}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pricing.color}`}>
                        {pricing.label}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${coverage.color}`}>
                        {coverage.label}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/pricing-dashboard/${product.slug}`}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                  >
                    {t("admin.priceDash.viewPricing")}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.priceDash.colProduct")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.priceDash.colCategory")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.priceDash.colPricing")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.priceDash.colMaterial")}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">{t("admin.priceDash.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => {
                  const pricing = getPricingLabel(product);
                  const coverage = getCoverageLabel(product.slug);
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-base font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-400">{product.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{product.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${pricing.color}`}>
                          {pricing.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${coverage.color}`}>
                          {coverage.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/pricing-dashboard/${product.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                          style={{ minHeight: 40 }}
                        >
                          {t("admin.priceDash.viewPricing")}
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
