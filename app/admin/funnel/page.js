"use client";

import { useCallback, useEffect, useState } from "react";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const PROD_STATUS_LABELS = {
  not_started: "Not Started",
  preflight: "Preflight",
  in_production: "In Production",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  completed: "Completed",
  on_hold: "On Hold",
  canceled: "Canceled",
};

const PROD_STATUS_COLORS = {
  not_started: "#94a3b8",
  preflight: "#60a5fa",
  in_production: "#fbbf24",
  ready_to_ship: "#34d399",
  shipped: "#10b981",
  completed: "#059669",
  on_hold: "#f87171",
  canceled: "#ef4444",
};

export default function FunnelPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/funnel?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load funnel:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        Loading conversion data...
      </div>
    );
  }

  const { funnel, productionBreakdown, dailyConversions } = data;

  // Compute chart max for scaling
  const chartMax = Math.max(...dailyConversions.map((d) => d.created), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Conversion Funnel</h1>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === d ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Funnel Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Checkouts Started"
          value={funnel.checkoutsStarted}
          sublabel="Orders created"
        />
        <MetricCard
          label="Payments Completed"
          value={funnel.paymentCompleted}
          sublabel={`${funnel.paymentRate}% conversion`}
          change={funnel.paymentRateChange}
          changeLabel="vs prev"
        />
        <MetricCard
          label="Revenue"
          value={formatCad(funnel.revenue)}
          change={funnel.revenueChange}
          changeLabel="vs prev"
        />
        <MetricCard
          label="Avg Order Value"
          value={formatCad(funnel.avgOrderValue)}
        />
      </div>

      {/* Second Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Repeat Customers"
          value={funnel.repeatCustomers}
          sublabel={`${funnel.repeatRate}% of paid orders`}
          change={funnel.repeatRateChange}
          changeLabel="vs prev"
        />
        <MetricCard
          label="Avg Fulfillment Time"
          value={funnel.avgFulfillmentHours ? `${funnel.avgFulfillmentHours}h` : "N/A"}
          sublabel="Created → Shipped"
        />
        <MetricCard
          label="Payment Success Rate"
          value={`${funnel.paymentRate}%`}
          sublabel={`${funnel.paymentCompleted} of ${funnel.checkoutsStarted}`}
        />
      </div>

      {/* Funnel Visualization */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Conversion Flow</h2>
        <div className="flex flex-col items-center gap-2">
          <FunnelBar label="Checkout Started" count={funnel.checkoutsStarted} maxCount={funnel.checkoutsStarted} color="#60a5fa" />
          <svg className="h-4 w-4 text-gray-300" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12l-4-4h8z" /></svg>
          <FunnelBar label="Payment Completed" count={funnel.paymentCompleted} maxCount={funnel.checkoutsStarted} color="#34d399" />
          <svg className="h-4 w-4 text-gray-300" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12l-4-4h8z" /></svg>
          <FunnelBar label="Repeat Purchase" count={funnel.repeatCustomers} maxCount={funnel.checkoutsStarted} color="#a78bfa" />
        </div>
      </div>

      {/* Daily Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Daily Orders (Created vs Paid)</h2>
        {dailyConversions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data for this period</p>
        ) : (
          <div className="flex items-end gap-px" style={{ height: 160 }}>
            {dailyConversions.map((d, i) => {
              const createdH = Math.max((d.created / chartMax) * 140, 2);
              const paidH = Math.max((d.paid / chartMax) * 140, d.paid > 0 ? 2 : 0);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full max-w-[20px] rounded-t bg-gray-200" style={{ height: createdH }} />
                    <div className="w-full max-w-[20px] rounded-t bg-emerald-400 -mt-px" style={{ height: paidH, position: "relative", top: -(createdH) }} />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                    {new Date(d.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}:
                    {" "}{d.created} created, {d.paid} paid
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-gray-200" /> Created</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-emerald-400" /> Paid</span>
        </div>
      </div>

      {/* Production Status */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Production Pipeline</h2>
        {productionBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No production data</p>
        ) : (
          <div className="space-y-2">
            {productionBreakdown.map((item) => {
              const total = productionBreakdown.reduce((s, i) => s + i.count, 0);
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-gray-600 truncate">
                    {PROD_STATUS_LABELS[item.status] || item.status}
                  </span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(pct, 1)}%`,
                        backgroundColor: PROD_STATUS_COLORS[item.status] || "#94a3b8",
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-semibold text-gray-900">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sublabel, change, changeLabel }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
        {change !== undefined && change !== null && (
          <span className={`text-[10px] font-semibold ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-500" : "text-gray-400"}`}>
            {change > 0 ? "+" : ""}{change}% {changeLabel || ""}
          </span>
        )}
      </div>
    </div>
  );
}

function FunnelBar({ label, count, maxCount, color }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-900">{count} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-8 w-full bg-gray-100 rounded-lg overflow-hidden">
        <div
          className="h-full rounded-lg transition-all"
          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
