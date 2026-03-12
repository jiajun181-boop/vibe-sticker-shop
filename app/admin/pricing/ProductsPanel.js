"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { pricingQuotePath } from "@/lib/admin/pricing-routes";

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

const SOURCE_COLORS = {
  template: "bg-purple-100 text-purple-800",
  cost_plus: "bg-blue-100 text-blue-800",
  sticker_ref: "bg-cyan-100 text-cyan-800",
  qty_tiered: "bg-indigo-100 text-indigo-800",
  area_tiered: "bg-indigo-100 text-indigo-800",
  qty_options: "bg-indigo-100 text-indigo-800",
  fixed_prices: "bg-green-100 text-green-800",
  quote_only: "bg-gray-100 text-gray-600",
  legacy: "bg-yellow-100 text-yellow-800",
  preset: "bg-blue-100 text-blue-800",
  unknown: "bg-gray-100 text-gray-600",
};

export default function ProductsPanel() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const fetchBatch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      params.set("limit", "300");
      const res = await fetch(`/api/admin/pricing-batch?${params}`);
      if (!res.ok) throw new Error("Failed to load pricing data");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { fetchBatch(); }, [fetchBatch]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  // Stats
  const stats = useMemo(() => {
    const all = products.filter(p => !p.error);
    return {
      total: all.length,
      withCost: all.filter(p => p.totalCostCents > 0).length,
      belowFloor: all.filter(p => p.floorPriceCents > 0 && p.sellPriceCents < p.floorPriceCents).length,
      avgCompleteness: all.length > 0
        ? Math.round(all.reduce((sum, p) => sum + (p.completenessScore || 0), 0) / all.length)
        : 0,
    };
  }, [products]);

  const fmt = (cents) => "$" + ((cents || 0) / 100).toFixed(2);
  const pct = (rate) => ((rate || 0) * 100).toFixed(1) + "%";

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("admin.pc.activeProducts")} value={stats.total} color="text-gray-900" />
        <StatCard label={t("admin.pc.withCostData")} value={stats.withCost} color="text-blue-600" />
        <StatCard label={t("admin.pc.belowFloor")} value={stats.belowFloor} color={stats.belowFloor > 0 ? "text-red-600" : "text-green-600"} />
        <StatCard label={t("admin.pc.avgCompleteness")} value={`${stats.avgCompleteness}%`} color="text-gray-600" />
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
            className="w-full rounded-[3px] border border-[#d0d0d0] bg-white py-3 pl-10 pr-4 text-sm text-[#111] outline-none focus:border-black"
            style={{ minHeight: 44 }}
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="rounded-[3px] border border-[#d0d0d0] bg-white px-4 py-3 text-sm text-[#666] outline-none focus:border-black"
          style={{ minHeight: 44 }}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
          ))}
        </select>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[3px] border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchBatch} className="mt-3 rounded-[3px] bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            {t("admin.pc.retry")}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#999]">{t("admin.priceDash.noProducts")}</div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs text-[#999]">{t("admin.pc.productsCount", { count: filtered.length })}</p>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colProduct")}</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colSource")}</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colSellPrice")}</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colTotalCost")}</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colProfit")}</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colMargin")}</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colFloor")}</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-[#666]">{t("admin.pc.colScore")}</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {filtered.map(product => {
                    if (product.error) return null;
                    const belowFloor = product.floorPriceCents > 0 && product.sellPriceCents < product.floorPriceCents;
                    const profitColor = product.profitRate >= 0.25 ? "text-green-700"
                      : product.profitRate >= 0.10 ? "text-amber-700" : "text-red-600";
                    const scoreColor = product.completenessScore >= 90 ? "bg-green-100 text-green-800"
                      : product.completenessScore >= 70 ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800";
                    const srcColor = SOURCE_COLORS[product.sourceKind] || SOURCE_COLORS.unknown;

                    return (
                      <tr key={product.id} className="text-sm hover:bg-[#fafafa]">
                        <td className="px-3 py-2.5 max-w-[200px]">
                          <p className="truncate font-medium text-[#111]">{product.name}</p>
                          <p className="truncate text-[10px] text-[#999]">{product.slug}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${srcColor}`}>
                            {product.sourceKind?.replace(/_/g, " ") || "?"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm">{fmt(product.sellPriceCents)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm text-[#666]">
                          {product.totalCostCents > 0 ? fmt(product.totalCostCents) : <span className="text-[#ccc]">--</span>}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-sm ${profitColor}`}>
                          {product.totalCostCents > 0 ? fmt(product.profitCents) : <span className="text-[#ccc]">--</span>}
                        </td>
                        <td className={`px-3 py-2.5 text-right text-sm font-medium ${profitColor}`}>
                          {product.totalCostCents > 0 ? pct(product.profitRate) : <span className="text-[#ccc]">--</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {product.floorPriceCents > 0 ? (
                            <span className={`font-mono text-sm ${belowFloor ? "text-red-600 font-bold" : "text-[#666]"}`}>
                              {fmt(product.floorPriceCents)}
                            </span>
                          ) : <span className="text-[10px] text-[#ccc]">n/a</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreColor}`}>
                            {product.completenessScore}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Link
                            href={pricingQuotePath(product.slug)}
                            className="inline-flex items-center gap-1 rounded-[3px] bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222]"
                          >
                            {t("admin.pc.quote")}
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {filtered.map(product => {
              if (product.error) return null;
              const profitColor = product.profitRate >= 0.25 ? "text-green-700"
                : product.profitRate >= 0.10 ? "text-amber-700" : "text-red-600";
              return (
                <div key={product.id} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111] truncate">{product.name}</p>
                      <p className="text-[10px] text-[#999]">{product.sourceKind?.replace(/_/g, " ")}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      product.completenessScore >= 90 ? "bg-green-100 text-green-800"
                        : product.completenessScore >= 70 ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}>{product.completenessScore}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-[#999]">{t("admin.pc.sell")}</span><br/><span className="font-mono font-medium">{fmt(product.sellPriceCents)}</span></div>
                    <div><span className="text-[#999]">{t("admin.pc.cost")}</span><br/><span className="font-mono">{product.totalCostCents > 0 ? fmt(product.totalCostCents) : "--"}</span></div>
                    <div><span className="text-[#999]">{t("admin.pc.margin")}</span><br/><span className={`font-medium ${profitColor}`}>{product.totalCostCents > 0 ? pct(product.profitRate) : "--"}</span></div>
                  </div>
                  <Link
                    href={pricingQuotePath(product.slug)}
                    className="block w-full rounded-[3px] bg-black py-2.5 text-center text-xs font-medium text-white hover:bg-[#222]"
                  >
                    {t("admin.pc.openQuote")}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
      <p className="text-xs text-[#999]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
