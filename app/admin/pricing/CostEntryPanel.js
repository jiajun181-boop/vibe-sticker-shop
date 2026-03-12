"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { pricingOpsPath } from "@/lib/admin/pricing-routes";

/**
 * CostEntryPanel — shows cost completeness stats and lets ops enter
 * actual costs for order items that are missing them.
 *
 * Fetches from GET /api/admin/pricing/cost-completeness
 * Saves via PATCH /api/admin/orders/{orderId}/item-costs
 */
export default function CostEntryPanel({ returnTo }) {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const targetOrderId = searchParams.get("orderId");
  const targetItemId = searchParams.get("itemId");
  const targetRef = useRef(null);
  const [highlightedItemId, setHighlightedItemId] = useState(targetItemId);
  const [highlightedOrderId, setHighlightedOrderId] = useState(targetItemId ? null : targetOrderId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  // Per-row editable state: { [itemId]: { value: string, saving: boolean, saved: boolean, error: string|null } }
  const [rowState, setRowState] = useState({});

  // Focused mode: when orderId/itemId exist, scope the API query
  const isFocused = !!(targetOrderId || targetItemId);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (targetOrderId) params.set("orderId", targetOrderId);
      if (targetItemId) params.set("itemId", targetItemId);
      const res = await fetch(`/api/admin/pricing/cost-completeness?${params}`);
      if (!res.ok) throw new Error("Failed to load cost completeness data");
      const json = await res.json();

      // Sort targeted item to top when in focused mode
      if (isFocused && json.recentMissing) {
        json.recentMissing.sort((a, b) => {
          const aMatch = (targetItemId && a.itemId === targetItemId) || (!targetItemId && a.orderId === targetOrderId);
          const bMatch = (targetItemId && b.itemId === targetItemId) || (!targetItemId && b.orderId === targetOrderId);
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      }

      setData(json);
      // Initialize row state for missing items
      const rs = {};
      for (const item of json.recentMissing || []) {
        rs[item.itemId] = { value: "", saving: false, saved: false, error: null };
      }
      setRowState(rs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days, targetOrderId, targetItemId, isFocused]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-scroll to target row after data loads
  useEffect(() => {
    if ((targetItemId || targetOrderId) && targetRef.current && !loading) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetItemId, targetOrderId, loading]);

  // Clear highlight after 5 seconds
  useEffect(() => {
    if (highlightedItemId || highlightedOrderId) {
      const timer = setTimeout(() => { setHighlightedItemId(null); setHighlightedOrderId(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedItemId, highlightedOrderId]);

  function updateRowValue(itemId, value) {
    setRowState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], value, saved: false, error: null },
    }));
  }

  async function saveRow(item) {
    const row = rowState[item.itemId];
    if (!row || !row.value) return;

    const cents = parseInt(row.value);
    if (isNaN(cents) || cents < 0) {
      setRowState((prev) => ({
        ...prev,
        [item.itemId]: { ...prev[item.itemId], error: t("admin.pc.validAmountCents") },
      }));
      return;
    }

    setRowState((prev) => ({
      ...prev,
      [item.itemId]: { ...prev[item.itemId], saving: true, error: null },
    }));

    try {
      const res = await fetch(`/api/admin/orders/${item.orderId}/item-costs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ itemId: item.itemId, actualCostCents: cents }],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Save failed");
      }

      const resData = await res.json();

      // Extract profit feedback from response
      const profitFeedback = resData.orderProfit || null;
      const marginAlert = profitFeedback?.actualMarginPct != null && profitFeedback.actualMarginPct < 15
        ? profitFeedback.actualMarginPct < 0
          ? "negative"   // losing money
          : "below_floor" // below 15% floor
        : null;

      setRowState((prev) => ({
        ...prev,
        [item.itemId]: {
          ...prev[item.itemId],
          saving: false,
          saved: true,
          value: String(cents),
          marginAlert,
          actualMarginPct: profitFeedback?.actualMarginPct ?? null,
        },
      }));

      // Update stats and remove the saved item from the missing list
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recentMissing: (prev.recentMissing || []).filter(i => i.itemId !== item.itemId),
          withActualCost: prev.withActualCost + 1,
          withoutActualCost: Math.max(0, prev.withoutActualCost - 1),
          completionRate:
            prev.totalItems > 0
              ? Math.round(((prev.withActualCost + 1) / prev.totalItems) * 10000) / 100
              : 0,
        };
      });
    } catch (err) {
      setRowState((prev) => ({
        ...prev,
        [item.itemId]: { ...prev[item.itemId], saving: false, error: err.message },
      }));
    }
  }

  function formatCents(cents) {
    if (cents == null || cents === 0) return "$0.00";
    return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  }

  // ── Loading / error states ─────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3 py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[3px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
        <button onClick={fetchData} className="ml-3 underline hover:no-underline">
          {t("admin.pc.retry")}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { totalItems, withActualCost, withoutActualCost, completionRate, recentMissing } = data;

  // ── Stat cards ─────────────────────────────────────────────────
  const stats = [
    { label: t("admin.pc.totalItems"), value: totalItems, color: "text-[#111]" },
    { label: t("admin.pc.withActualCost"), value: withActualCost, color: "text-green-700" },
    { label: t("admin.pc.missingCost"), value: withoutActualCost, color: withoutActualCost > 0 ? "text-amber-700" : "text-[#111]" },
    { label: t("admin.pc.completionRate"), value: `${completionRate}%`, color: completionRate >= 80 ? "text-green-700" : completionRate >= 50 ? "text-amber-700" : "text-red-700" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#111]">{t("admin.pc.costEntry")}</h2>
          <p className="mt-0.5 text-xs text-[#999]">
            {isFocused
              ? t("admin.pc.costEntryFocused")
              : t("admin.pc.costEntryDesc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFocused && (
            <button
              onClick={() => {
                // Clear focus — reload broad view
                const url = new URL(window.location.href);
                url.searchParams.delete("orderId");
                url.searchParams.delete("itemId");
                window.history.replaceState(null, "", url.toString());
                window.location.reload();
              }}
              className="rounded-[3px] border border-[#e0e0e0] bg-white px-2.5 py-1.5 text-xs text-[#666] hover:border-black hover:text-[#111]"
            >
              {t("admin.pc.showAll")}
            </button>
          )}
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-xs text-[#111]"
          >
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>{t("admin.pc.lastNDays", { n: d })}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[3px] border border-[#e0e0e0] bg-white p-4"
          >
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#999]">
              {s.label}
            </div>
            <div className={`mt-1 text-xl font-bold font-mono ${s.color}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Margin alert banner — shows when saved items have margin issues */}
      {(() => {
        const alertRows = Object.values(rowState).filter((r) => r.saved && r.marginAlert);
        if (alertRows.length === 0) return null;
        const negCount = alertRows.filter((r) => r.marginAlert === "negative").length;
        const floorCount = alertRows.filter((r) => r.marginAlert === "below_floor").length;
        return (
          <div className="flex items-center justify-between rounded-[3px] border border-red-200 bg-red-50 px-4 py-3">
            <div className="text-sm text-red-800">
              {negCount > 0 && <span className="font-semibold">{t("admin.pc.negMarginCount", { n: negCount })}</span>}
              {negCount > 0 && floorCount > 0 && ", "}
              {floorCount > 0 && <span className="font-medium">{t("admin.pc.belowFloorCount", { n: floorCount })}</span>}
              {" "}{t("admin.pc.detectedAfterCost")}
            </div>
            <Link
              href={pricingOpsPath("alerts", undefined, returnTo || undefined)}
              className="whitespace-nowrap rounded-[3px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              {t("admin.pc.viewProfitAlerts")}
            </Link>
          </div>
        );
      })()}

      {/* Focused-mode completion banner — all targeted items saved */}
      {isFocused && returnTo && recentMissing.length === 0 && (
        <div className="flex items-center justify-between rounded-[3px] border border-green-200 bg-green-50 px-4 py-3">
          <span className="text-sm font-medium text-green-800">{t("admin.pc.targetFixed")}</span>
          <Link
            href={returnTo}
            className="rounded-[3px] bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
          >
            {t("admin.pc.returnAfterFix")} &rarr;
          </Link>
        </div>
      )}

      {/* Missing items table */}
      {recentMissing.length === 0 ? (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center text-sm text-[#999]">
          {t("admin.pc.allCostsEntered")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-left text-[11px] font-medium uppercase tracking-[0.12em] text-[#999]">
                <th className="px-4 py-3">{t("admin.pc.colOrder")}</th>
                <th className="px-4 py-3">{t("admin.pc.colProduct")}</th>
                <th className="px-4 py-3 text-right">{t("admin.pc.colSellPrice")}</th>
                <th className="px-4 py-3 text-right">{t("admin.pc.colEstCost")}</th>
                <th className="px-4 py-3 text-right">{t("admin.pc.colActualCost")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentMissing.map((item) => {
                const row = rowState[item.itemId] || { value: "", saving: false, saved: false, error: null };
                const isTarget = highlightedItemId
                  ? item.itemId === highlightedItemId
                  : (highlightedOrderId && item.orderId === highlightedOrderId);
                return (
                  <tr
                    key={item.itemId}
                    ref={isTarget && !targetRef.current ? (el) => { targetRef.current = el; } : undefined}
                    className={`border-b border-[#f0f0f0] last:border-b-0 ${
                      row.saved ? "bg-green-50" : ""
                    } ${isTarget ? "border-l-[3px] border-l-amber-400 bg-amber-50/30" : ""}`}
                    onClick={() => { setHighlightedItemId(null); setHighlightedOrderId(null); }}
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/admin/orders/${item.orderId}`} className="text-[#666] hover:text-[#111] hover:underline">
                        {item.orderId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#111]">
                      <div className="max-w-[200px] truncate">{item.productName}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#111]">
                      {formatCents(item.totalPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#999]">
                      {formatCents(item.estimatedCostCents)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.saved ? (
                        <span className="font-mono text-green-700">
                          {formatCents(parseInt(row.value))}
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[11px] text-[#999]">$</span>
                          <input
                            ref={isTarget ? (el) => { if (el && isFocused) el.focus(); } : undefined}
                            type="number"
                            min="0"
                            step="1"
                            placeholder={t("admin.pc.centsPlaceholder")}
                            value={row.value}
                            onChange={(e) => updateRowValue(item.itemId, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRow(item);
                            }}
                            className="w-24 rounded-[3px] border border-[#e0e0e0] px-2 py-1 text-right font-mono text-xs text-[#111] focus:border-black focus:outline-none"
                          />
                        </div>
                      )}
                      {row.error && (
                        <div className="mt-1 text-[11px] text-red-600">{row.error}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.saved ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-xs text-green-700">{t("admin.pc.saved")}</span>
                          {row.actualMarginPct != null && (
                            <span className={`text-[10px] font-medium ${
                              row.marginAlert === "negative"
                                ? "text-red-700"
                                : row.marginAlert === "below_floor"
                                  ? "text-amber-700"
                                  : "text-green-700"
                            }`}>
                              {row.marginAlert === "negative"
                                ? `${t("admin.pc.margin")} ${row.actualMarginPct.toFixed(1)}%`
                                : row.marginAlert === "below_floor"
                                  ? `${t("admin.pc.margin")} ${row.actualMarginPct.toFixed(1)}%`
                                  : `${row.actualMarginPct.toFixed(1)}%`}
                            </span>
                          )}
                          {returnTo && (item.itemId === targetItemId || item.orderId === targetOrderId) && (
                            <Link
                              href={returnTo}
                              className="mt-0.5 inline-flex items-center gap-1 rounded-[3px] bg-green-700 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-green-800"
                            >
                              {t("admin.pc.returnAfterFix")} &rarr;
                            </Link>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => saveRow(item)}
                          disabled={row.saving || !row.value}
                          className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1 text-xs font-medium text-[#111] transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {row.saving ? "..." : t("admin.pc.save")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
