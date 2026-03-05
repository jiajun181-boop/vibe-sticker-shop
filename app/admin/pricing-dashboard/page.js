"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products?page=1&limit=500");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data.products || []);
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
    return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [products, category, search]);

  // Stats
  const stats = useMemo(() => {
    const active = products.filter(p => p.isActive);
    const withPreset = active.filter(p => p.pricingPresetId);
    const outsourced = active.filter(p => {
      try {
        const cfg = typeof p.pricingConfig === "string" ? JSON.parse(p.pricingConfig) : p.pricingConfig;
        return cfg?.fixedPrices && Object.keys(cfg.fixedPrices).length > 0;
      } catch { return false; }
    });
    const templateBased = active.length - withPreset.length - outsourced.length;
    return { total: active.length, withPreset: withPreset.length, outsourced: outsourced.length, templateBased };
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("admin.priceDash.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("admin.priceDash.subtitle")}</p>
        </div>
        <Link
          href="/admin/pricing-dashboard/log"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("admin.priceDash.changeLog")}
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("admin.priceDash.statTotal")} value={stats.total} color="text-gray-900" />
        <StatCard label={t("admin.priceDash.statPreset")} value={stats.withPreset} color="text-blue-600" />
        <StatCard label={t("admin.priceDash.statFixed")} value={stats.outsourced} color="text-green-600" />
        <StatCard label={t("admin.priceDash.statTemplate")} value={stats.templateBased} color="text-gray-600" />
      </div>

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
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.priceDash.colProduct")}</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-semibold text-gray-600 sm:table-cell">{t("admin.priceDash.colCategory")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.priceDash.colPricing")}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">{t("admin.priceDash.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => {
                  const pricing = getPricingLabel(product);
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-base font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-400">{product.slug}</p>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className="text-sm text-gray-500">{product.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${pricing.color}`}>
                          {pricing.label}
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
