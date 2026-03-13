"use client";

import { useEffect, useState, Suspense } from "react";
import { formatCad } from "@/lib/admin/format-cad";

export default function MarketingAnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>}>
      <MarketingAnalyticsContent />
    </Suspense>
  );
}

function MarketingAnalyticsContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/marketing?days=${days}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading marketing data...</div>;
  if (!data) return <div className="text-sm text-red-500 p-4">Failed to load marketing analytics</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Marketing Analytics</h1>
          <p className="text-xs text-[#999]">Coupons, referrals, cart recovery, and email performance</p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                days === d ? "bg-black text-white" : "bg-[#f5f5f5] text-[#666] hover:bg-[#e5e5e5]"
              }`}
            >
              {d === 365 ? "1Y" : `${d}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {data.summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Coupons Used" value={data.summary.totalCouponsUsed} />
          <StatCard label="Discounts Given" value={formatCad(data.summary.totalDiscountGiven)} />
          <StatCard label="Cart Recovery" value={`${data.summary.cartRecoveryRate}%`} />
          <StatCard label="Emails Sent" value={data.summary.totalEmailsSent} />
          <StatCard label="Referred Users" value={data.summary.referredUsers} />
        </div>
      )}

      {/* New vs Returning */}
      {data.customerSplit && data.customerSplit.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">New vs Returning Customers</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.customerSplit.map((s) => (
              <div key={s.type} className="rounded-lg border border-[#f0f0f0] p-4 text-center">
                <p className="text-xs font-medium uppercase text-[#999]">{s.type === "new" ? "New Customers" : "Returning Customers"}</p>
                <p className="mt-1 text-2xl font-bold text-black">{s.orderCount}</p>
                <p className="text-xs text-[#666]">Revenue: {formatCad(s.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abandoned Cart Recovery */}
      {data.abandonedCarts && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Abandoned Cart Recovery</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{data.abandonedCarts.totalAbandoned}</p>
              <p className="text-xs text-[#999]">Total Abandoned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.abandonedCarts.recovered}</p>
              <p className="text-xs text-[#999]">Recovered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.abandonedCarts.recoveryRate}%</p>
              <p className="text-xs text-[#999]">Recovery Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Performance */}
      {data.coupons && data.coupons.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Coupon Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f0f0] text-left text-[#999]">
                  <th className="pb-2 pr-4">Code</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4 text-right">Used</th>
                  <th className="pb-2 pr-4 text-right">Revenue</th>
                  <th className="pb-2 pr-4 text-right">Discount</th>
                  <th className="pb-2 text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.coupons.map((c) => (
                  <tr key={c.code} className="border-b border-[#f8f8f8]">
                    <td className="py-2 pr-4 font-mono font-medium">{c.code}</td>
                    <td className="py-2 pr-4 capitalize">{c.discountType}</td>
                    <td className="py-2 pr-4 text-right">{c.ordersUsed}{c.maxUses ? `/${c.maxUses}` : ""}</td>
                    <td className="py-2 pr-4 text-right text-green-700">{formatCad(c.totalRevenueGenerated)}</td>
                    <td className="py-2 pr-4 text-right text-red-600">{formatCad(c.totalDiscountGiven)}</td>
                    <td className="py-2 text-right font-medium">{c.roi}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Stats */}
      {data.emailsSent && data.emailsSent.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Email Activity</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {data.emailsSent.map((e) => (
              <div key={e.template} className="rounded-md border border-[#f0f0f0] p-2.5">
                <p className="text-xs text-[#999] capitalize">{(e.template || "other").replace(/-/g, " ")}</p>
                <p className="text-lg font-bold text-black">{e.sent}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">{label}</p>
      <p className="mt-1 text-lg font-bold text-black">{value}</p>
    </div>
  );
}
