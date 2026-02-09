"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ─── Date helpers ─── */

function toDateStr(date) {
  return date.toISOString().split("T")[0];
}

function getPresetRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { from: toDateStr(today), to: toDateStr(today) };
    case "this_week": {
      const day = today.getDay();
      const mon = new Date(today);
      mon.setDate(today.getDate() - ((day + 6) % 7));
      return { from: toDateStr(mon), to: toDateStr(today) };
    }
    case "this_month":
      return {
        from: toDateStr(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: toDateStr(today),
      };
    case "last_month": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toDateStr(first), to: toDateStr(last) };
    }
    case "this_year":
      return {
        from: toDateStr(new Date(today.getFullYear(), 0, 1)),
        to: toDateStr(today),
      };
    default:
      return { from: toDateStr(today), to: toDateStr(today) };
  }
}

const presets = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year", label: "This Year" },
];

/* ─── Status badge colors (same as production queue) ─── */

const statusColors = {
  queued: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  printing: "bg-yellow-100 text-yellow-700",
  quality_check: "bg-purple-100 text-purple-700",
  finished: "bg-green-100 text-green-700",
  shipped: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-red-100 text-red-700",
};

/* ─── Donut Chart ─── */

function DonutChart({ data }) {
  const colors = {
    queued: "#9ca3af",
    assigned: "#3b82f6",
    printing: "#eab308",
    quality_check: "#a855f7",
    finished: "#22c55e",
    shipped: "#10b981",
    on_hold: "#ef4444",
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        No status data available
      </div>
    );
  }

  let cumulative = 0;
  const segments = data.map((d) => {
    const start = cumulative;
    cumulative += d.percentage;
    return `${colors[d.status] || "#9ca3af"} ${start}% ${cumulative}%`;
  });

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row">
      <div className="relative h-48 w-48 flex-shrink-0">
        <div
          className="h-48 w-48 rounded-full"
          style={{
            background: `conic-gradient(${segments.join(", ")})`,
          }}
        />
        <div className="absolute inset-6 rounded-full bg-white flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-900">
            {data.reduce((s, d) => s + d.count, 0)}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colors[d.status] }}
            />
            <span className="text-sm text-gray-700 capitalize">
              {d.status.replace("_", " ")}
            </span>
            <span className="text-sm font-medium">
              {d.count} ({d.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SVG Line Chart ─── */

function LineChart({ data, label }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        No trend data available
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 700;
  const height = 300;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.avgHours), 1);
  const minVal = Math.min(...data.map((d) => d.avgHours), 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padding.top + innerH - ((d.avgHours - minVal) / range) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  // Y-axis ticks
  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const val = minVal + (range / yTickCount) * i;
    return {
      val,
      y: padding.top + innerH - ((val - minVal) / range) * innerH,
    };
  });

  // X-axis labels (show a subset to avoid crowding)
  const showEveryN = data.length > 12 ? Math.ceil(data.length / 8) : 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={tick.y}
            x2={width - padding.right}
            y2={tick.y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <text
            x={padding.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            className="fill-gray-400"
            fontSize="11"
          >
            {tick.val.toFixed(1)}h
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#lineGradient)" opacity="0.15" />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Line */}
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
          {/* Hover target */}
          <title>
            {new Date(p.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
            {": "}
            {p.avgHours.toFixed(1)} hours
          </title>
        </g>
      ))}

      {/* X-axis labels */}
      {points.map((p, i) =>
        i % showEveryN === 0 ? (
          <text
            key={`x-${i}`}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize="10"
          >
            {new Date(p.date).toLocaleDateString("en-CA", {
              month: "short",
              day: "numeric",
            })}
          </text>
        ) : null
      )}

      {/* Y-axis label */}
      <text
        x={14}
        y={padding.top + innerH / 2}
        textAnchor="middle"
        className="fill-gray-400"
        fontSize="11"
        transform={`rotate(-90, 14, ${padding.top + innerH / 2})`}
      >
        {label || "Hours"}
      </text>
    </svg>
  );
}

/* ─── Main Page Component ─── */

export default function ProductionReportPage() {
  const defaultRange = getPresetRange("this_month");
  const [activePreset, setActivePreset] = useState("this_month");
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/reports/production?from=${fromDate}&to=${toDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch production report");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load production report:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function handlePreset(key) {
    setActivePreset(key);
    const range = getPresetRange(key);
    setFromDate(range.from);
    setToDate(range.to);
  }

  function handleCustomDateChange(field, value) {
    setActivePreset(null);
    if (field === "from") setFromDate(value);
    else setToDate(value);
  }

  // Derived metrics
  const totalActiveJobs =
    data?.metrics?.factoryUtilization?.reduce(
      (sum, f) => sum + f.activeJobs,
      0
    ) || 0;
  const delayedCount = data?.delayedOrders?.length || 0;

  // Sort factory performance by completedJobs desc
  const sortedFactoryPerformance = data?.factoryPerformance
    ? [...data.factoryPerformance].sort(
        (a, b) => b.completedJobs - a.completedJobs
      )
    : [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Production Report
        </h1>
      </div>

      {/* ── Date Range Controls ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreset === p.key
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="from-date" className="text-xs font-medium text-gray-500">
            From
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => handleCustomDateChange("from", e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-900"
          />
          <label htmlFor="to-date" className="text-xs font-medium text-gray-500">
            To
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => handleCustomDateChange("to", e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-900"
          />
        </div>
      </div>

      {/* ── Loading / Error states ── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-gray-500">Loading production report...</div>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      ) : data ? (
        <>
          {/* ── Key Metrics (4 cards) ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* On-Time Rate */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500">On-Time Rate</p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  data.metrics.onTimeRate > 80
                    ? "text-green-600"
                    : data.metrics.onTimeRate > 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {data.metrics.onTimeRate.toFixed(1)}%
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    data.metrics.onTimeRate > 80
                      ? "bg-green-500"
                      : data.metrics.onTimeRate > 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(data.metrics.onTimeRate, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Avg Production Time */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Avg Production Time
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {data.metrics.avgProductionTime.toFixed(1)}
                <span className="ml-1 text-sm font-medium text-gray-500">
                  hours
                </span>
              </p>
            </div>

            {/* Active Jobs */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Active Jobs</p>
              <p className="mt-1 text-2xl font-semibold text-blue-600">
                {totalActiveJobs}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                across {data.metrics.factoryUtilization?.length || 0} factories
              </p>
            </div>

            {/* Delayed Orders */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Delayed Orders
              </p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  delayedCount > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {delayedCount}
              </p>
              {delayedCount > 0 && (
                <p className="mt-1 text-xs text-red-500">
                  Requires attention
                </p>
              )}
            </div>
          </div>

          {/* ── Factory Utilization ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Factory Utilization
            </h2>
            {data.metrics.factoryUtilization &&
            data.metrics.factoryUtilization.length > 0 ? (
              data.metrics.factoryUtilization.map((factory) => (
                <div
                  key={factory.factoryId}
                  className="flex items-center gap-3 mb-3"
                >
                  <span className="w-32 text-sm text-gray-700 truncate">
                    {factory.name}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-blue-500 h-6 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (factory.activeJobs / 20) * 100,
                          100
                        )}%`,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {factory.activeJobs} active jobs
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-16 items-center justify-center text-sm text-gray-500">
                No factory utilization data
              </div>
            )}
          </div>

          {/* ── Status Distribution (Donut Chart) ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Status Distribution
            </h2>
            <DonutChart data={data.statusDistribution || []} />
          </div>

          {/* ── Delayed Orders Table ── */}
          {data.delayedOrders && data.delayedOrders.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
              <div className="border-b border-red-200 bg-red-50 px-5 py-4">
                <h2 className="text-sm font-semibold text-red-800">
                  Delayed Orders ({data.delayedOrders.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Job ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Factory
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Days Delayed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.delayedOrders.map((order) => (
                      <tr key={order.jobId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-600">
                            {order.jobId.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-[200px] truncate font-medium text-gray-900">
                            {order.productName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-[180px] truncate text-gray-600">
                            {order.customerEmail}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                              statusColors[order.status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {order.factoryName || "\u2014"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-red-600">
                            {order.daysDelayed}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/production/${order.jobId}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Avg Turnaround Trend (Line Chart) ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Avg Turnaround Trend
            </h2>
            <LineChart
              data={data.avgTurnaroundTrend || []}
              label="Hours"
            />
          </div>

          {/* ── Factory Performance Table ── */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Factory Performance
              </h2>
            </div>
            {sortedFactoryPerformance.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">
                No factory performance data
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Factory Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Completed Jobs
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Avg Time (hours)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        On-Time Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedFactoryPerformance.map((factory) => (
                      <tr key={factory.factoryId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {factory.name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {factory.completedJobs}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {factory.avgTime.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              factory.onTimeRate > 80
                                ? "bg-green-100 text-green-700"
                                : factory.onTimeRate > 60
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {factory.onTimeRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
