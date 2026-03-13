"use client";

import { useEffect, useState } from "react";
import { formatCad } from "@/lib/admin/format-cad";

export default function ShippingAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/shipping?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading)
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#999]">
        Loading shipping data...
      </div>
    );
  if (!data)
    return (
      <div className="text-sm text-red-500 p-4">
        Failed to load shipping analytics
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">
            Shipping Analytics
          </h1>
          <p className="text-xs text-[#999]">
            Carrier performance, delivery rates, and shipping costs
          </p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                days === d
                  ? "bg-black text-white"
                  : "bg-[#f5f5f5] text-[#666] hover:bg-[#e5e5e5]"
              }`}
            >
              {d === 365 ? "1Y" : `${d}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {data.summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Shipments" value={data.summary.totalShipments} />
          <StatCard
            label="Delivery Rate"
            value={`${data.summary.deliveryRate}%`}
          />
          <StatCard label="Exceptions" value={data.summary.totalExceptions} />
          <StatCard
            label="Avg Shipping/Order"
            value={formatCad(data.summary.avgShippingPerOrder)}
          />
        </div>
      )}

      {/* Carrier Breakdown */}
      {data.carriers && data.carriers.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">
            Carrier Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f0f0] text-left text-[#999]">
                  <th className="pb-2 pr-4">Carrier</th>
                  <th className="pb-2 pr-4 text-right">Shipments</th>
                  <th className="pb-2 pr-4 text-right">Delivered</th>
                  <th className="pb-2 pr-4 text-right">Exceptions</th>
                  <th className="pb-2 text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.carriers.map((c) => {
                  const rate =
                    c.shipmentCount > 0
                      ? Math.round((c.delivered / c.shipmentCount) * 100)
                      : 0;
                  return (
                    <tr key={c.carrier} className="border-b border-[#f8f8f8]">
                      <td className="py-2 pr-4 font-medium capitalize">
                        {c.carrier.replace(/_/g, " ")}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {c.shipmentCount}
                      </td>
                      <td className="py-2 pr-4 text-right text-green-700">
                        {c.delivered}
                      </td>
                      <td className="py-2 pr-4 text-right text-red-600">
                        {c.exceptions}
                      </td>
                      <td className="py-2 text-right font-medium">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Method Distribution */}
      {data.deliveryMethods && data.deliveryMethods.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">
            Delivery Methods
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {data.deliveryMethods.map((dm) => (
              <div
                key={dm.method}
                className="rounded-lg border border-[#f0f0f0] p-4 text-center"
              >
                <p className="text-xs font-medium uppercase text-[#999]">
                  {dm.method === "shipping"
                    ? "Standard Shipping"
                    : dm.method === "pickup"
                      ? "In-Store Pickup"
                      : dm.method === "local_delivery"
                        ? "Local Delivery"
                        : dm.method}
                </p>
                <p className="mt-1 text-2xl font-bold text-black">
                  {dm.orderCount}
                </p>
                <p className="text-xs text-[#666]">
                  Shipping: {formatCad(dm.totalShipping)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Shipments Chart (CSS bars) */}
      {data.dailyShipments && data.dailyShipments.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">
            Daily Shipments
          </h2>
          <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
            {(() => {
              const max = Math.max(
                ...data.dailyShipments.map((d) => d.shipped),
                1
              );
              return data.dailyShipments.slice(-30).map((d, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-black"
                  style={{
                    height: `${(d.shipped / max) * 100}%`,
                    minHeight: d.shipped > 0 ? 2 : 0,
                  }}
                  title={`${new Date(d.date).toLocaleDateString()}: ${d.shipped} shipped`}
                />
              ));
            })()}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-[#999]">
            <span>
              {data.dailyShipments.length > 0
                ? new Date(
                    data.dailyShipments[
                      Math.max(0, data.dailyShipments.length - 30)
                    ].date
                  ).toLocaleDateString()
                : ""}
            </span>
            <span>
              {data.dailyShipments.length > 0
                ? new Date(
                    data.dailyShipments[data.dailyShipments.length - 1].date
                  ).toLocaleDateString()
                : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-black">{value}</p>
    </div>
  );
}
