"use client";

import { useEffect, useState, useCallback } from "react";

/* ─── Currency formatter (CAD cents) ─── */

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

/* ─── Date helpers ─── */

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPresetRange(key) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (key) {
    case "today":
      return { from: toDateString(today), to: toDateString(today) };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: toDateString(yesterday), to: toDateString(yesterday) };
    }
    case "this_week": {
      const weekStart = startOfWeek(today);
      return { from: toDateString(weekStart), to: toDateString(today) };
    }
    case "last_week": {
      const thisWeekStart = startOfWeek(today);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      const lastWeekStart = startOfWeek(lastWeekEnd);
      return { from: toDateString(lastWeekStart), to: toDateString(lastWeekEnd) };
    }
    case "this_month": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toDateString(monthStart), to: toDateString(today) };
    }
    case "last_month": {
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toDateString(lastMonthStart), to: toDateString(lastMonthEnd) };
    }
    case "this_year": {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { from: toDateString(yearStart), to: toDateString(today) };
    }
    default:
      return { from: toDateString(today), to: toDateString(today) };
  }
}

const presets = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year", label: "This Year" },
];

/* ─── SVG Line Chart ─── */

function LineChart({ data, width = 800, height = 300 }) {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data.map((d) => d.amount), 1);
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - (d.amount / maxValue) * chartHeight,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  const areaD =
    pathD +
    ` L${points[points.length - 1].x},${padding.top + chartHeight} L${points[0].x},${padding.top + chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padding.top + chartHeight - pct * chartHeight;
        return (
          <line
            key={pct}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill="url(#revenueGradient)" opacity="0.3" />

      {/* Line */}
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
      ))}

      {/* Y-axis labels */}
      {[0, 0.5, 1].map((pct) => {
        const y = padding.top + chartHeight - pct * chartHeight;
        return (
          <text
            key={pct}
            x={padding.left - 8}
            y={y + 4}
            textAnchor="end"
            className="text-[10px] fill-[#999]"
          >
            ${((maxValue * pct) / 100).toFixed(0)}
          </text>
        );
      })}

      {/* X-axis labels (show a subset to avoid crowding) */}
      {data.map((d, i) => {
        const showEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1;
        if (i % showEvery !== 0 && i !== data.length - 1) return null;
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
        const label = new Date(d.date + "T00:00:00").toLocaleDateString("en-CA", {
          month: "short",
          day: "numeric",
        });
        return (
          <text
            key={i}
            x={x}
            y={height - 8}
            textAnchor="middle"
            className="text-[10px] fill-[#999]"
          >
            {label}
          </text>
        );
      })}

      <defs>
        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Conic-gradient Pie Chart ─── */

function PieChart({ data }) {
  if (!data || data.length === 0) return null;
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#6366f1",
  ];
  let cumulative = 0;
  const segments = data.map((d, i) => {
    const start = cumulative;
    cumulative += d.percentage;
    return `${colors[i % colors.length]} ${start}% ${cumulative}%`;
  });

  return (
    <div className="flex items-center gap-8">
      <div
        className="h-48 w-48 rounded-full flex-shrink-0"
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
      />
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.category} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-sm text-black">{d.category}</span>
            <span className="text-sm font-medium text-black">
              {d.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Change Indicator ─── */

function ChangeIndicator({ value }) {
  if (value === undefined || value === null) return null;
  const isPositive = value > 0;
  const isNeutral = value === 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isNeutral
          ? "text-[#999]"
          : isPositive
            ? "text-green-600"
            : "text-red-600"
      }`}
    >
      {!isNeutral && (
        <svg
          className="h-3 w-3"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          {isPositive ? (
            <path d="M6 2l4 5H2l4-5z" />
          ) : (
            <path d="M6 10l-4-5h8l-4 5z" />
          )}
        </svg>
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

/* ─── CSV Export ─── */

function buildCsvContent(data) {
  if (!data) return "";

  const lines = [];

  // Summary section
  lines.push("Sales Report Summary");
  lines.push("Metric,Value");
  lines.push(`Total Revenue,${formatCad(data.current.totalRevenue)}`);
  lines.push(`Order Count,${data.current.orderCount}`);
  lines.push(`Average Order Value,${formatCad(data.current.avgOrderValue)}`);
  lines.push(`New Customers,${data.current.newCustomers}`);
  lines.push("");

  // Daily revenue
  lines.push("Daily Revenue");
  lines.push("Date,Revenue,Orders");
  if (data.current.dailyRevenue) {
    for (const day of data.current.dailyRevenue) {
      lines.push(`${day.date},${formatCad(day.amount)},${day.orders}`);
    }
  }
  lines.push("");

  // Top products
  lines.push("Top Products");
  lines.push("Product,Quantity,Revenue");
  if (data.current.topProducts) {
    for (const product of data.current.topProducts) {
      const name = product.name.includes(",")
        ? `"${product.name}"`
        : product.name;
      lines.push(`${name},${product.quantity},${formatCad(product.revenue)}`);
    }
  }
  lines.push("");

  // Category sales
  lines.push("Category Sales");
  lines.push("Category,Amount,Percentage");
  if (data.current.categorySales) {
    for (const cat of data.current.categorySales) {
      const catName = cat.category.includes(",")
        ? `"${cat.category}"`
        : cat.category;
      lines.push(
        `${catName},${formatCad(cat.amount)},${cat.percentage.toFixed(1)}%`
      );
    }
  }

  return lines.join("\n");
}

function downloadCsv(data) {
  const csv = buildCsvContent(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sales-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Main Page Component ─── */

export default function SalesReportPage() {
  const defaultRange = getPresetRange("this_month");
  const [activePreset, setActivePreset] = useState("this_month");
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [compare, setCompare] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("from", fromDate);
      params.set("to", toDate);
      if (compare) params.set("compare", "true");

      const res = await fetch(`/api/admin/reports/sales?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sales report");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load sales report:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, compare]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function handlePreset(key) {
    setActivePreset(key);
    const range = getPresetRange(key);
    setFromDate(range.from);
    setToDate(range.to);
  }

  function handleFromChange(e) {
    setActivePreset(null);
    setFromDate(e.target.value);
  }

  function handleToChange(e) {
    setActivePreset(null);
    setToDate(e.target.value);
  }

  const current = data?.current;
  const comparison = data?.comparison;
  const totalProductRevenue = current?.topProducts
    ? current.topProducts.reduce((sum, p) => sum + p.revenue, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-black">Sales Report</h1>

        {data && (
          <button
            type="button"
            onClick={() => downloadCsv(data)}
            className="inline-flex items-center gap-2 rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#222]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Time range controls */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
        <div className="flex flex-col gap-4">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-1">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePreset(p.key)}
                className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  activePreset === p.key
                    ? "bg-black text-white"
                    : "bg-[#f5f5f5] text-[#666] hover:bg-[#fafafa]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range + compare toggle */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#999]">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={handleFromChange}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#999]">To</label>
              <input
                type="date"
                value={toDate}
                onChange={handleToChange}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className="h-4 w-4 rounded border-[#d0d0d0] text-black focus:ring-gray-900"
              />
              <span className="text-xs font-medium text-[#666]">
                Compare with previous period
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-[#999]">Loading report...</div>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      ) : current ? (
        <>
          {/* Key metric cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <p className="text-xs text-[#999]">Total Revenue</p>
              <p className="mt-1 text-2xl font-semibold text-black">
                {formatCad(current.totalRevenue)}
              </p>
              {compare && comparison && (
                <div className="mt-1">
                  <ChangeIndicator value={comparison.revenueChange} />
                </div>
              )}
            </div>

            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <p className="text-xs text-[#999]">Order Count</p>
              <p className="mt-1 text-2xl font-semibold text-black">
                {current.orderCount.toLocaleString()}
              </p>
              {compare && comparison && (
                <div className="mt-1">
                  <ChangeIndicator value={comparison.orderChange} />
                </div>
              )}
            </div>

            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <p className="text-xs text-[#999]">Average Order Value</p>
              <p className="mt-1 text-2xl font-semibold text-black">
                {formatCad(current.avgOrderValue)}
              </p>
              {compare && comparison && (
                <div className="mt-1">
                  <ChangeIndicator value={comparison.avgOrderChange} />
                </div>
              )}
            </div>

            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <p className="text-xs text-[#999]">New Customers</p>
              <p className="mt-1 text-2xl font-semibold text-black">
                {current.newCustomers.toLocaleString()}
              </p>
              {compare && comparison && (
                <div className="mt-1">
                  <ChangeIndicator value={comparison.customerChange} />
                </div>
              )}
            </div>
          </div>

          {/* Revenue trend chart */}
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-black">
              Revenue Trend
            </h2>
            {current.dailyRevenue && current.dailyRevenue.length > 0 ? (
              <LineChart data={current.dailyRevenue} />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-[#999]">
                No revenue data for this period
              </div>
            )}
          </div>

          {/* Top products table & category pie chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Products */}
            <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
              <div className="border-b border-[#e0e0e0] px-5 py-4">
                <h2 className="text-sm font-semibold text-black">
                  Top Products
                </h2>
              </div>

              {current.topProducts && current.topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                          Product Name
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Qty Sold
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Revenue
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e0e0e0]">
                      {current.topProducts.slice(0, 10).map((product, i) => {
                        const pctOfTotal =
                          totalProductRevenue > 0
                            ? (product.revenue / totalProductRevenue) * 100
                            : 0;
                        return (
                          <tr
                            key={product.productId || i}
                            className="hover:bg-[#fafafa]"
                          >
                            <td className="px-4 py-3 text-[#999]">
                              {i + 1}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-black truncate max-w-[200px]">
                                {product.name}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right text-[#666]">
                              {product.quantity}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-semibold text-black">
                                  {formatCad(product.revenue)}
                                </span>
                                <div className="h-1.5 w-full max-w-[80px] rounded-full bg-[#f5f5f5]">
                                  <div
                                    className="h-1.5 rounded-full bg-blue-500"
                                    style={{
                                      width: `${Math.min(pctOfTotal, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-[#666]">
                              {pctOfTotal.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-sm text-[#999]">
                  No product data for this period
                </div>
              )}
            </div>

            {/* Category Sales */}
            <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
              <div className="border-b border-[#e0e0e0] px-5 py-4">
                <h2 className="text-sm font-semibold text-black">
                  Sales by Category
                </h2>
              </div>

              {current.categorySales && current.categorySales.length > 0 ? (
                <div className="p-5">
                  <PieChart data={current.categorySales} />

                  {/* Category breakdown table */}
                  <div className="mt-6 space-y-2">
                    {current.categorySales.map((cat) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-black">{cat.category}</span>
                        <span className="font-medium text-black">
                          {formatCad(cat.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-sm text-[#999]">
                  No category data for this period
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
