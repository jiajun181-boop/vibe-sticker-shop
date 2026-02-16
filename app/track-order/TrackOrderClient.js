"use client";

import { useState } from "react";
import Link from "next/link";

const STATUS_MAP = {
  pending: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800", step: 1 },
  paid: { label: "Paid", color: "bg-blue-100 text-blue-800", step: 2 },
  canceled: { label: "Cancelled", color: "bg-red-100 text-red-800", step: 0 },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800", step: 0 },
};

const PROD_STEP_MAP = {
  not_started: 2,
  preflight: 2,
  in_production: 3,
  ready_to_ship: 4,
  shipped: 4,
  completed: 5,
  on_hold: 2,
  canceled: 0,
};

const STEPS = ["Order Placed", "Payment Confirmed", "In Production", "Shipped", "Delivered"];

function formatCad(cents) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default function TrackOrderClient() {
  const [orderRef, setOrderRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOrder(null);
    if (!orderRef.trim() || !email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef: orderRef.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order not found.");
      } else {
        setOrder(data);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  const statusInfo = (() => {
    if (!order) return null;
    const base = STATUS_MAP[order.status] || STATUS_MAP.pending;
    if (order.status !== "paid") return base;
    const productionStep = PROD_STEP_MAP[order.productionStatus] ?? base.step;
    const label =
      order.productionStatus === "in_production"
        ? "In Production"
        : order.productionStatus === "ready_to_ship"
          ? "Ready to Ship"
          : order.productionStatus === "shipped"
            ? "Shipped"
            : order.productionStatus === "completed"
              ? "Delivered"
              : base.label;
    return { ...base, step: Math.max(base.step, productionStep), label };
  })();

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-1">
            Order Reference
          </label>
          <input
            type="text"
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            placeholder="e.g. cm1abc2def3ghi"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-gray-400 focus:bg-white focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="The email used at checkout"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-gray-400 focus:bg-white focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gray-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-black transition-colors disabled:opacity-50"
        >
          {loading ? "Searching..." : "Track Order"}
        </button>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </form>

      {/* Order Result */}
      {order && statusInfo && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Order</p>
              <p className="text-sm font-bold font-mono">{order.id}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Progress Steps */}
          {statusInfo.step > 0 && (
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1.5 w-full rounded-full ${i < statusInfo.step ? "bg-gray-900" : "bg-gray-200"}`} />
                  <span className={`label-xs font-medium ${i < statusInfo.step ? "text-gray-900" : "text-gray-400"}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2">Items</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                    <span className="text-gray-900 font-medium">{formatCad(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 text-sm font-bold">
                <span>Total</span>
                <span>{formatCad(order.totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-gray-400">
            Ordered {new Date(order.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          {Array.isArray(order.timeline) && order.timeline.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2">Timeline</p>
              <div className="space-y-2">
                {order.timeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-gray-400" />
                    <div>
                      <p className="text-sm text-gray-800">{event.action}</p>
                      <p className="text-[11px] text-gray-500">
                        {new Date(event.createdAt).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help */}
      <div className="text-center text-xs text-gray-500">
        <p>
          Can&apos;t find your order?{" "}
          <Link href="/contact" className="underline hover:text-gray-900">Contact us</Link>
          {" "}with your details and we&apos;ll help you out.
        </p>
      </div>
    </div>
  );
}
