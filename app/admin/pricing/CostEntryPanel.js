"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * CostEntryPanel — shows cost completeness stats and lets ops enter
 * actual costs for order items that are missing them.
 *
 * Fetches from GET /api/admin/pricing/cost-completeness
 * Saves via PATCH /api/admin/orders/{orderId}/item-costs
 */
export default function CostEntryPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  // Per-row editable state: { [itemId]: { value: string, saving: boolean, saved: boolean, error: string|null } }
  const [rowState, setRowState] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing/cost-completeness?days=${days}`);
      if (!res.ok) throw new Error("Failed to load cost completeness data");
      const json = await res.json();
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
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        [item.itemId]: { ...prev[item.itemId], error: "Enter a valid amount in cents" },
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

      setRowState((prev) => ({
        ...prev,
        [item.itemId]: { ...prev[item.itemId], saving: false, saved: true, value: String(cents) },
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
    return new Intl.NumberFormat("en-CA", {
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
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { totalItems, withActualCost, withoutActualCost, completionRate, recentMissing } = data;

  // ── Stat cards ─────────────────────────────────────────────────
  const stats = [
    { label: "Total Items", value: totalItems, color: "text-[#111]" },
    { label: "With Actual Cost", value: withActualCost, color: "text-green-700" },
    { label: "Missing Cost", value: withoutActualCost, color: withoutActualCost > 0 ? "text-amber-700" : "text-[#111]" },
    { label: "Completion Rate", value: `${completionRate}%`, color: completionRate >= 80 ? "text-green-700" : completionRate >= 50 ? "text-amber-700" : "text-red-700" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#111]">Cost Entry</h2>
          <p className="mt-0.5 text-xs text-[#999]">
            Enter actual production costs for completed order items
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-xs text-[#111]"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
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

      {/* Missing items table */}
      {recentMissing.length === 0 ? (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center text-sm text-[#999]">
          All tracked items have actual costs entered. Nice work!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-left text-[11px] font-medium uppercase tracking-[0.12em] text-[#999]">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Sell Price</th>
                <th className="px-4 py-3 text-right">Est. Cost</th>
                <th className="px-4 py-3 text-right">Actual Cost</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentMissing.map((item) => {
                const row = rowState[item.itemId] || { value: "", saving: false, saved: false, error: null };
                return (
                  <tr
                    key={item.itemId}
                    className={`border-b border-[#f0f0f0] last:border-b-0 ${
                      row.saved ? "bg-green-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#666]">
                      {item.orderId.slice(0, 8)}
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
                            type="number"
                            min="0"
                            step="1"
                            placeholder="cents"
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
                        <span className="text-xs text-green-700">Saved</span>
                      ) : (
                        <button
                          onClick={() => saveRow(item)}
                          disabled={row.saving || !row.value}
                          className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1 text-xs font-medium text-[#111] transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {row.saving ? "..." : "Save"}
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
