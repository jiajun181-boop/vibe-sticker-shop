"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";

export default function CustomerAnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>}>
      <CustomerAnalyticsContent />
    </Suspense>
  );
}

function CustomerAnalyticsContent() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/analytics/customer-ltv?limit=20").then((r) => r.ok ? r.json() : null),
      fetch(`/api/admin/analytics/growth?period=${period}`).then((r) => r.ok ? r.json() : null),
    ]).then(([ltv, gr]) => {
      setData(ltv);
      setGrowth(gr);
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading customer analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Customer Analytics</h1>
          <p className="text-xs text-[#999]">Lifetime value, retention, and growth trends</p>
        </div>
        <div className="flex gap-1">
          {["7d", "30d", "90d", "12m"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                period === p ? "bg-black text-white" : "bg-[#f5f5f5] text-[#666] hover:bg-[#e5e5e5]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <SummaryCard label="Total Customers" value={data.summary.totalCustomers} />
          <SummaryCard label="Avg LTV" value={formatCad(data.summary.avgLtv)} />
          <SummaryCard label="Repeat Rate" value={`${data.summary.repeatRate}%`} />
          <SummaryCard label="Avg Orders/Customer" value={data.summary.avgOrdersPerCustomer} />
          <SummaryCard label="Avg Order Value" value={formatCad(data.summary.avgOrderValue)} />
          <SummaryCard label="Repeat Customers" value={data.summary.repeatCustomers} />
        </div>
      )}

      {/* Cohort breakdown */}
      {data?.cohorts && data.cohorts.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Customer Segments</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.cohorts.map((c) => {
              const colors = { one_time: "#94a3b8", returning: "#60a5fa", loyal: "#34d399", vip: "#f59e0b" };
              const labels = { one_time: "One-Time", returning: "Returning (2-3)", loyal: "Loyal (4-10)", vip: "VIP (10+)" };
              return (
                <div key={c.segment} className="rounded-lg border border-[#f0f0f0] p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: colors[c.segment] || "#999" }} />
                    <span className="text-xs font-medium text-[#666]">{labels[c.segment] || c.segment}</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-black">{c.customerCount}</p>
                  <p className="text-[10px] text-[#999]">Avg LTV: {formatCad(c.avgLtv)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Growth trend */}
      {growth?.dataPoints && growth.dataPoints.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Growth Trend</h2>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1" style={{ minWidth: growth.dataPoints.length * 28, height: 120 }}>
              {(() => {
                const maxRev = Math.max(...growth.dataPoints.map((d) => d.revenue || 0), 1);
                return growth.dataPoints.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-0.5" title={`${d.date}: ${formatCad(d.revenue)}, ${d.newCustomers} new`}>
                    <div
                      className="w-full rounded-t bg-blue-400"
                      style={{ height: `${Math.max(2, (d.revenue / maxRev) * 100)}px` }}
                    />
                    <span className="text-[8px] text-[#999] rotate-[-45deg] origin-top-left whitespace-nowrap">
                      {i % Math.ceil(growth.dataPoints.length / 10) === 0 ? new Date(d.date).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA", { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
          {growth.comparison && (
            <div className="mt-3 flex gap-4 text-xs text-[#666]">
              <span>Revenue: {growth.comparison.revenueChange >= 0 ? "+" : ""}{growth.comparison.revenueChange}%</span>
              <span>New customers: {growth.comparison.customerChange >= 0 ? "+" : ""}{growth.comparison.customerChange}%</span>
            </div>
          )}
        </div>
      )}

      {/* Top customers table */}
      {data?.topCustomers && data.topCustomers.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Top Customers by Revenue</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f0f0] text-left text-[#999]">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4 text-right">Orders</th>
                  <th className="pb-2 pr-4 text-right">Revenue</th>
                  <th className="pb-2 pr-4 text-right">Avg Order</th>
                  <th className="pb-2 pr-4">First Order</th>
                  <th className="pb-2 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((c, i) => (
                  <tr key={c.email} className="border-b border-[#f8f8f8] hover:bg-[#fafafa]">
                    <td className="py-2 pr-4 text-[#999]">{i + 1}</td>
                    <td className="py-2 pr-4">
                      <div className="font-medium text-black">{c.name || "—"}</div>
                      <div className="text-[10px] text-[#999]">{c.email}</div>
                    </td>
                    <td className="py-2 pr-4 text-right font-medium">{c.orderCount}</td>
                    <td className="py-2 pr-4 text-right font-medium text-green-700">{formatCad(c.totalRevenue)}</td>
                    <td className="py-2 pr-4 text-right">{formatCad(c.avgOrderValue)}</td>
                    <td className="py-2 pr-4 text-[#666]">{new Date(c.firstOrder).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA")}</td>
                    <td className="py-2 text-right text-[#666]">{new Date(c.lastOrder).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">{label}</p>
      <p className="mt-1 text-lg font-bold text-black">{value}</p>
    </div>
  );
}
