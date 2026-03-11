"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const URGENCY_COLORS = {
  fresh: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600", badge: "bg-gray-100 text-gray-600" },
  pending: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  urgent: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
};

function getUrgency(days) {
  if (days >= 7) return "urgent";
  if (days >= 3) return "pending";
  return "fresh";
}

export default function MissingArtworkPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [sendResult, setSendResult] = useState({});

  useEffect(() => {
    fetch("/api/admin/orders/missing-artwork?limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch((err) => console.error("[Missing Artwork] Load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#999]">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-red-600">
        Failed to load data
      </div>
    );
  }

  const { orders, total, urgentCount, staleCount } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-black">Missing Artwork</h1>
        <span className="inline-flex items-center rounded-[2px] bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          {total} orders
        </span>
        <Link
          href="/admin/orders"
          className="ml-auto text-xs font-medium text-[#999] hover:text-black"
        >
          All Orders
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[3px] border border-gray-200 bg-gray-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-gray-700">{total}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Total Waiting</p>
        </div>
        <div className={`rounded-[3px] border px-3 py-2 text-center ${urgentCount > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
          <p className={`text-lg font-bold ${urgentCount > 0 ? "text-amber-700" : "text-gray-500"}`}>{urgentCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600">3+ Days</p>
        </div>
        <div className={`rounded-[3px] border px-3 py-2 text-center ${staleCount > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
          <p className={`text-lg font-bold ${staleCount > 0 ? "text-red-700" : "text-gray-500"}`}>{staleCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-red-600">7+ Days (stale)</p>
        </div>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="rounded-[3px] border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-sm font-medium text-emerald-700">All orders have artwork!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const urgency = getUrgency(order.daysSinceOrder);
            const colors = URGENCY_COLORS[urgency];

            return (
              <div
                key={order.orderId}
                className={`rounded-[3px] border ${colors.border} ${colors.bg} p-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/orders/${order.orderId}`}
                        className="font-mono text-sm font-semibold text-black hover:underline"
                      >
                        #{order.orderId.slice(0, 8)}
                      </Link>
                      <span className={`rounded-[2px] px-1.5 py-0.5 text-[10px] font-semibold ${colors.badge}`}>
                        {order.daysSinceOrder}d ago
                      </span>
                      {order.hasAnyUploadActivity && (
                        <span className="rounded-[2px] bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          Has upload activity
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#666]">
                      {order.customerName || order.customerEmail}
                      {order.customerName && ` (${order.customerEmail})`}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {order.itemsMissing.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${item.reason === "design-help" ? "bg-blue-400" : "bg-amber-400"}`} />
                          <span className="text-[#666]">{item.productName}</span>
                          <span className="text-[10px] text-[#999]">
                            ({item.reason === "upload-later" ? "upload later" : item.reason === "design-help" ? "design help" : "no artwork"})
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-[#999]">
                      {order.itemsMissing.length} of {order.totalItems} items missing
                      {order.totalFilesUploaded > 0 && ` · ${order.totalFilesUploaded} files uploaded`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={sending === order.orderId}
                      onClick={async () => {
                        setSending(order.orderId);
                        setSendResult((prev) => ({ ...prev, [order.orderId]: null }));
                        try {
                          const res = await fetch(`/api/admin/orders/${order.orderId}/remind-artwork`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({}),
                          });
                          const data = await res.json();
                          setSendResult((prev) => ({
                            ...prev,
                            [order.orderId]: res.ok ? "sent" : data.error || "Failed",
                          }));
                        } catch {
                          setSendResult((prev) => ({ ...prev, [order.orderId]: "Failed" }));
                        } finally {
                          setSending(null);
                        }
                      }}
                      className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-medium text-[#fff] hover:bg-[#222] disabled:opacity-50"
                    >
                      {sending === order.orderId ? "Sending..." : sendResult[order.orderId] === "sent" ? "Sent!" : "Send Reminder"}
                    </button>
                    {sendResult[order.orderId] && sendResult[order.orderId] !== "sent" && (
                      <span className="text-[10px] text-red-600">{sendResult[order.orderId]}</span>
                    )}
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className="text-[10px] font-medium text-black hover:underline"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
