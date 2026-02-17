"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const formatCompact = (cents) => {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return formatCad(cents);
};

const periods = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "12m", label: "12 Months" },
];

const statusColors = {
  draft: { bg: "bg-gray-400", label: "Draft" },
  pending: { bg: "bg-yellow-400", label: "Pending" },
  paid: { bg: "bg-green-500", label: "Paid" },
  canceled: { bg: "bg-red-400", label: "Canceled" },
  refunded: { bg: "bg-purple-400", label: "Refunded" },
};

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          Loading...
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePeriod = searchParams.get("period") || "30d";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?period=${activePeriod}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activePeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  function setPeriod(period) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`/admin/analytics?${params}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-black">Analytics</h1>

        {/* Period selector */}
        <div className="flex flex-wrap gap-1">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                activePeriod === p.key
                  ? "bg-black text-white"
                  : "bg-white text-[#666] hover:bg-[#fafafa]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-[#999]">Loading analytics...</div>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <SummaryCards summary={data.summary} />

          {/* Revenue chart */}
          <RevenueChart
            timeline={data.revenueTimeline}
            period={activePeriod}
          />

          {/* Tables grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TopProductsTable products={data.topProducts} />
            <TopCustomersTable customers={data.topCustomers} />
          </div>

          {/* Status breakdown */}
          <StatusBreakdown breakdown={data.statusBreakdown} />
        </>
      ) : null}
    </div>
  );
}

/* ─── Summary Cards ─── */

function SummaryCards({ summary }) {
  const cards = [
    {
      label: "Total Revenue",
      value: formatCad(summary.totalRevenue),
      change: summary.revenueChange,
    },
    {
      label: "Orders",
      value: summary.totalOrders.toLocaleString(),
      change: summary.ordersChange,
    },
    {
      label: "Avg Order Value",
      value: formatCad(summary.avgOrderValue),
      change: summary.avgOrderChange,
    },
    {
      label: "vs Previous Period",
      value: formatCad(summary.previousRevenue),
      subtitle: `${summary.previousOrders} orders`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[3px] border border-[#e0e0e0] bg-white p-5"
        >
          <p className="text-xs text-[#999]">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-black">
            {card.value}
          </p>
          {card.change !== undefined && (
            <p
              className={`mt-1 text-xs font-medium ${
                card.change > 0
                  ? "text-green-600"
                  : card.change < 0
                    ? "text-red-600"
                    : "text-[#999]"
              }`}
            >
              {card.change > 0 ? "+" : ""}
              {card.change}% vs previous period
            </p>
          )}
          {card.subtitle && (
            <p className="mt-1 text-xs text-[#999]">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Revenue Bar Chart ─── */

function RevenueChart({ timeline, period }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <h2 className="text-sm font-semibold text-black">Revenue</h2>
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          No revenue data for this period
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...timeline.map((d) => d.revenue), 1);

  function formatDateLabel(dateStr) {
    const date = new Date(dateStr);
    if (period === "12m") {
      return date.toLocaleDateString("en-CA", { month: "short" });
    }
    return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  }

  // For large timelines, show fewer labels to avoid crowding
  const showEveryN = timeline.length > 15 ? Math.ceil(timeline.length / 10) : 1;

  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black">Revenue</h2>
        <p className="text-xs text-[#999]">
          {timeline.length} {period === "12m" ? "months" : "days"}
        </p>
      </div>

      <div className="flex items-end gap-[2px]" style={{ height: "240px" }}>
        {timeline.map((d, i) => {
          const heightPercent = (d.revenue / maxRevenue) * 100;
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-2 shadow-lg group-hover:block"
                style={{ zIndex: 10, whiteSpace: "nowrap" }}
              >
                <p className="text-xs font-semibold text-black">
                  {formatCad(d.revenue)}
                </p>
                <p className="text-xs text-[#999]">
                  {d.orders} order{d.orders !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-[#999]">
                  {formatDateLabel(d.date)}
                </p>
              </div>

              {/* Bar */}
              <div
                className="w-full cursor-pointer rounded-t bg-blue-500 transition-colors hover:bg-blue-600"
                style={{
                  height: `${Math.max(heightPercent, 1)}%`,
                  minHeight: "2px",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Date labels */}
      <div className="mt-2 flex gap-[2px]">
        {timeline.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % showEveryN === 0 ? (
              <span className="text-[10px] text-[#999]">
                {formatDateLabel(d.date)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Top Products Table ─── */

function TopProductsTable({ products }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
      <div className="border-b border-[#e0e0e0] px-5 py-4">
        <h2 className="text-sm font-semibold text-black">
          Top Products by Revenue
        </h2>
      </div>

      {products.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[#999]">
          No product data for this period
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                  Product
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {products.map((product, i) => (
                <tr key={`${product.name}-${i}`} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black truncate max-w-[200px]">
                      {product.name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-black">
                    {formatCad(product.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#666]">
                    {product.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-[#666]">
                    {product.orders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Top Customers Table ─── */

function TopCustomersTable({ customers }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
      <div className="border-b border-[#e0e0e0] px-5 py-4">
        <h2 className="text-sm font-semibold text-black">
          Top Customers by Spend
        </h2>
      </div>

      {customers.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[#999]">
          No customer data for this period
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                  Customer
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                  Spent
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {customers.map((customer, i) => (
                <tr key={`${customer.email}-${i}`} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black truncate max-w-[200px]">
                      {customer.email}
                    </p>
                    {customer.name && (
                      <p className="text-xs text-[#999]">{customer.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-black">
                    {formatCad(customer.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#666]">
                    {customer.orders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Status Breakdown ─── */

function StatusBreakdown({ breakdown }) {
  const total = breakdown.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return (
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <h2 className="text-sm font-semibold text-black">
          Order Status Breakdown
        </h2>
        <div className="flex h-16 items-center justify-center text-sm text-[#999]">
          No orders in this period
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-black">
        Order Status Breakdown
      </h2>

      {/* Horizontal stacked bar */}
      <div className="flex h-8 overflow-hidden rounded-[3px]">
        {breakdown.map((s) => {
          const percent = (s.count / total) * 100;
          const colors = statusColors[s.status] || {
            bg: "bg-gray-300",
            label: s.status,
          };
          return (
            <div
              key={s.status}
              className={`${colors.bg} relative transition-all`}
              style={{ width: `${percent}%` }}
              title={`${colors.label}: ${s.count} (${Math.round(percent)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4">
        {breakdown.map((s) => {
          const colors = statusColors[s.status] || {
            bg: "bg-gray-300",
            label: s.status,
          };
          const percent = ((s.count / total) * 100).toFixed(1);
          return (
            <div key={s.status} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-sm ${colors.bg}`} />
              <span className="text-xs text-[#666]">
                {colors.label}{" "}
                <span className="font-medium text-black">
                  {s.count}
                </span>{" "}
                <span className="text-[#999]">({percent}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
