"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { pricingQuotePath } from "@/lib/admin/pricing-routes";

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

/**
 * Pricing Dashboard Panel — unified view of all products' pricing health.
 * Shows: product name, source kind, sell price, total cost, profit, margin,
 * floor price, completeness score, and missing flags.
 */
export default function DashboardPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing-batch?limit=500");
      if (!res.ok) throw new Error("Failed to load pricing data");
      const data = await res.json();
      setProducts((data.products || []).filter((p) => !p.error));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Summary stats
  const stats = useMemo(() => {
    const all = products;
    const withCost = all.filter((p) => p.totalCostCents > 0);
    const belowFloor = all.filter((p) => p.floorPriceCents > 0 && p.sellPriceCents < p.floorPriceCents);
    const avgScore = all.length > 0
      ? Math.round(all.reduce((s, p) => s + (p.completenessScore || 0), 0) / all.length)
      : 0;
    const avgMargin = withCost.length > 0
      ? (withCost.reduce((s, p) => s + (p.profitRate || 0), 0) / withCost.length * 100).toFixed(1)
      : "0.0";

    // Source breakdown
    const sources = {};
    for (const p of all) {
      const src = p.sourceKind || "unknown";
      sources[src] = (sources[src] || 0) + 1;
    }

    // Missing flags aggregation
    const missingCounts = {};
    for (const p of all) {
      for (const flag of p.missingFlags || []) {
        missingCounts[flag] = (missingCounts[flag] || 0) + 1;
      }
    }

    return {
      total: all.length,
      withCost: withCost.length,
      belowFloor: belowFloor.length,
      avgScore,
      avgMargin,
      sources,
      missingCounts,
    };
  }, [products]);

  // Sorting
  const sorted = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => {
      let va, vb;
      switch (sortField) {
        case "name": va = a.name || ""; vb = b.name || ""; return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
        case "source": va = a.sourceKind || ""; vb = b.sourceKind || ""; return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
        case "sell": va = a.sellPriceCents || 0; vb = b.sellPriceCents || 0; break;
        case "cost": va = a.totalCostCents || 0; vb = b.totalCostCents || 0; break;
        case "profit": va = a.profitCents || 0; vb = b.profitCents || 0; break;
        case "margin": va = a.profitRate || 0; vb = b.profitRate || 0; break;
        case "floor": va = a.floorPriceCents || 0; vb = b.floorPriceCents || 0; break;
        case "score": va = a.completenessScore || 0; vb = b.completenessScore || 0; break;
        default: return 0;
      }
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return 0;
    });
    return list;
  }, [products, sortField, sortDir]);

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const fmt = (cents) => "$" + ((cents || 0) / 100).toFixed(2);
  const pct = (rate) => ((rate || 0) * 100).toFixed(1) + "%";

  if (loading) {
    return (
      <div className="space-y-3 py-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[3px] border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={fetchData} className="mt-3 rounded-[3px] bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Active Products" value={stats.total} />
        <StatCard label="With Cost Data" value={stats.withCost} color={stats.withCost === stats.total ? "text-green-700" : "text-amber-700"} />
        <StatCard label="Below Floor" value={stats.belowFloor} color={stats.belowFloor > 0 ? "text-red-600" : "text-green-700"} />
        <StatCard label="Avg Score" value={`${stats.avgScore}%`} color={stats.avgScore >= 80 ? "text-green-700" : stats.avgScore >= 60 ? "text-amber-700" : "text-red-600"} />
        <StatCard label="Avg Margin" value={`${stats.avgMargin}%`} color={Number(stats.avgMargin) >= 25 ? "text-green-700" : "text-amber-700"} />
        <StatCard label="Missing Flags" value={Object.values(stats.missingCounts).reduce((a, b) => a + b, 0)} color="text-red-600" />
      </div>

      {/* Source breakdown + Missing flags */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Source breakdown */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          <h3 className="text-xs font-bold uppercase text-[#999]">Pricing Source Breakdown</h3>
          <div className="mt-3 space-y-1.5">
            {Object.entries(stats.sources).sort((a, b) => b[1] - a[1]).map(([src, count]) => (
              <div key={src} className="flex items-center justify-between text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${SOURCE_COLORS[src] || SOURCE_COLORS.unknown}`}>
                  {src.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-[#e0e0e0]" style={{ width: 80 }}>
                    <div
                      className="h-2 rounded-full bg-black"
                      style={{ width: `${Math.max((count / stats.total) * 100, 5)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[#666] w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing flags */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          <h3 className="text-xs font-bold uppercase text-[#999]">Missing Data Flags</h3>
          {Object.keys(stats.missingCounts).length === 0 ? (
            <p className="mt-3 text-xs text-green-600">All products have complete data.</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {Object.entries(stats.missingCounts).sort((a, b) => b[1] - a[1]).map(([flag, count]) => (
                <div key={flag} className="flex items-center justify-between text-xs">
                  <span className="rounded-[3px] bg-red-50 px-2 py-0.5 text-red-700 border border-red-200">
                    {flag.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-red-600">{count} products</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full product table */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <SortHeader field="name" label="Product" current={sortField} dir={sortDir} onClick={toggleSort} />
                <SortHeader field="source" label="Source" current={sortField} dir={sortDir} onClick={toggleSort} />
                <SortHeader field="sell" label="Sell Price" current={sortField} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader field="cost" label="Total Cost" current={sortField} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader field="profit" label="Profit" current={sortField} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader field="margin" label="Margin" current={sortField} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader field="floor" label="Floor" current={sortField} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader field="score" label="Score" current={sortField} dir={sortDir} onClick={toggleSort} align="center" />
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Missing</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {sorted.length === 0 && (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-sm text-[#999]">No products match the current filter.</td></tr>
              )}
              {sorted.map((p) => {
                const belowFloor = p.floorPriceCents > 0 && p.sellPriceCents < p.floorPriceCents;
                const profitColor = p.profitRate >= 0.25 ? "text-green-700"
                  : p.profitRate >= 0.10 ? "text-amber-700" : "text-red-600";
                const scoreColor = p.completenessScore >= 90 ? "bg-green-100 text-green-800"
                  : p.completenessScore >= 70 ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800";
                const srcColor = SOURCE_COLORS[p.sourceKind] || SOURCE_COLORS.unknown;

                return (
                  <tr key={p.id} className="text-sm hover:bg-[#fafafa]">
                    <td className="px-3 py-2 max-w-[180px]">
                      <p className="truncate font-medium text-[#111]">{p.name}</p>
                      <p className="truncate text-[10px] text-[#999]">{p.slug}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${srcColor}`}>
                        {p.sourceKind?.replace(/_/g, " ") || "?"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm">{fmt(p.sellPriceCents)}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm text-[#666]">
                      {p.totalCostCents > 0 ? fmt(p.totalCostCents) : <span className="text-[#ccc]">--</span>}
                    </td>
                    <td className={`px-3 py-2 text-right font-mono text-sm ${profitColor}`}>
                      {p.totalCostCents > 0 ? fmt(p.profitCents) : <span className="text-[#ccc]">--</span>}
                    </td>
                    <td className={`px-3 py-2 text-right text-sm font-medium ${profitColor}`}>
                      {p.totalCostCents > 0 ? pct(p.profitRate) : <span className="text-[#ccc]">--</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {p.floorPriceCents > 0 ? (
                        <span className={`font-mono text-sm ${belowFloor ? "text-red-600 font-bold" : "text-[#666]"}`}>
                          {fmt(p.floorPriceCents)}
                        </span>
                      ) : <span className="text-[10px] text-[#ccc]">n/a</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreColor}`}>
                        {p.completenessScore}%
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-0.5 max-w-[200px]">
                        {(p.missingFlags || []).map((flag, i) => (
                          <span key={i} className="rounded-[2px] bg-red-50 px-1 py-0 text-[9px] text-red-700 border border-red-200 whitespace-nowrap">
                            {flag.replace(/_/g, " ").replace("missing ", "")}
                          </span>
                        ))}
                        {(p.warnings || []).map((w, i) => (
                          <span key={`w-${i}`} className="rounded-[2px] bg-amber-50 px-1 py-0 text-[9px] text-amber-700 border border-amber-200 whitespace-nowrap">
                            {w.replace(/_/g, " ").replace("no ", "")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={pricingQuotePath(p.slug)}
                        className="inline-flex items-center gap-1 rounded-[3px] bg-black px-2.5 py-1 text-[10px] font-medium text-white hover:bg-[#222]"
                      >
                        Quote
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-[#111]" }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-3">
      <p className="text-[10px] font-medium uppercase text-[#999]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SortHeader({ field, label, current, dir, onClick, align = "left" }) {
  const isActive = current === field;
  const arrow = isActive ? (dir === "asc" ? " \u2191" : " \u2193") : "";
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      className={`px-3 py-2.5 text-xs font-semibold text-[#666] cursor-pointer hover:text-[#111] select-none ${alignClass}`}
      onClick={() => onClick(field)}
    >
      {label}{arrow}
    </th>
  );
}
