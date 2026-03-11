"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

function getStatusInfo(t, order) {
  const STATUS_MAP = {
    pending: { label: t("track.statusPending"), color: "bg-yellow-100 text-yellow-800", step: 1 },
    paid: { label: t("track.statusPaid"), color: "bg-blue-100 text-blue-800", step: 2 },
    canceled: { label: t("track.statusCancelled"), color: "bg-red-100 text-red-800", step: 0 },
    refunded: { label: t("track.statusRefunded"), color: "bg-[var(--color-gray-100)] text-[var(--color-gray-800)]", step: 0 },
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

  const base = STATUS_MAP[order.status] || STATUS_MAP.pending;
  if (order.status !== "paid") return base;

  const productionStep = PROD_STEP_MAP[order.productionStatus] ?? base.step;
  const label =
    order.productionStatus === "in_production"
      ? t("track.statusInProduction")
      : order.productionStatus === "ready_to_ship"
        ? t("track.statusReadyToShip")
        : order.productionStatus === "shipped"
          ? t("track.statusShipped")
          : order.productionStatus === "completed"
            ? t("track.statusDelivered")
            : base.label;
  return { ...base, step: Math.max(base.step, productionStep), label };
}

function formatCad(cents) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

const CARRIER_URLS = {
  "Canada Post": (n) => `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${n}`,
  "UPS": (n) => `https://www.ups.com/track?tracknum=${n}`,
  "Purolator": (n) => `https://www.purolator.com/en/shipping/tracker?pin=${n}`,
  "FedEx": (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
};

function getTrackingUrl(carrier, trackingNumber) {
  if (!trackingNumber) return null;
  const builder = CARRIER_URLS[carrier];
  return builder ? builder(trackingNumber) : null;
}

import { getCustomerTimelineLabel } from "@/lib/customer-labels";
import OrderArtworkUpload from "@/components/order/OrderArtworkUpload";

export default function TrackOrderClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [orderRef, setOrderRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  // Auto-fill order ID from URL param (e.g., /track-order?order=abc123)
  useEffect(() => {
    const urlOrder = searchParams.get("order");
    if (urlOrder && !orderRef) {
      setOrderRef(urlOrder);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const STEPS = [
    t("track.stepPlaced"),
    t("track.stepPayment"),
    t("track.stepProduction"),
    t("track.stepShipped"),
    t("track.stepDelivered"),
  ];

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
        setError(data.error || t("track.errorNotFound"));
      } else {
        setOrder(data);
      }
    } catch {
      setError(t("track.errorGeneric"));
    }
    setLoading(false);
  }

  const statusInfo = order ? getStatusInfo(t, order) : null;

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)] mb-1">
            {t("track.orderRef")}
          </label>
          <input
            type="text"
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            placeholder={t("track.orderRefPlaceholder")}
            className="w-full rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-3 text-sm focus:border-[var(--color-gray-400)] focus:bg-white focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)] mb-1">
            {t("track.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("track.emailPlaceholder")}
            className="w-full rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-3 text-sm focus:border-[var(--color-gray-400)] focus:bg-white focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--color-gray-900)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] hover:bg-black transition-colors disabled:opacity-50"
        >
          {loading ? t("track.searching") : t("track.submit")}
        </button>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </form>

      {/* Order Result */}
      {order && statusInfo && (
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-gray-500)]">{t("track.orderLabel")}</p>
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
                  <div className={`h-1.5 w-full rounded-full ${i < statusInfo.step ? "bg-[var(--color-gray-900)]" : "bg-[var(--color-gray-200)]"}`} />
                  <span className={`label-xs font-medium ${i < statusInfo.step ? "text-[var(--color-gray-900)]" : "text-[var(--color-gray-400)]"}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tracking Info */}
          {order.tracking?.trackingNumber && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-600 mb-2">{t("track.shipmentInfo")}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--color-gray-600)]">{order.tracking.carrier || t("track.carrier")}:</span>
                {(() => {
                  const url = getTrackingUrl(order.tracking.carrier, order.tracking.trackingNumber);
                  return url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-purple-700 underline hover:text-purple-900">
                      {order.tracking.trackingNumber}
                    </a>
                  ) : (
                    <span className="font-mono font-semibold text-purple-700">{order.tracking.trackingNumber}</span>
                  );
                })()}
              </div>
              {order.tracking.estimatedDelivery && (
                <p className="mt-1 text-xs text-purple-600">
                  {t("track.estimatedDelivery")}: {new Date(order.tracking.estimatedDelivery).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          )}

          {/* Estimated Completion */}
          {order.estimatedCompletion && order.productionStatus !== "shipped" && order.productionStatus !== "completed" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-600">
                {t("track.estimatedCompletion")}: <span className="font-semibold">{new Date(order.estimatedCompletion).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}</span>
              </p>
            </div>
          )}

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="border-t border-[var(--color-gray-100)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-400)] mb-2">{t("track.items")}</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[var(--color-gray-700)]">{item.name} <span className="text-[var(--color-gray-400)]">x{item.quantity}</span></span>
                    <span className="text-[var(--color-gray-900)] font-medium">{formatCad(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {/* Breakdown */}
              <div className="mt-3 pt-3 border-t border-[var(--color-gray-100)] space-y-1 text-sm">
                {(order.subtotalAmount != null) && (
                  <>
                    <div className="flex justify-between text-[var(--color-gray-500)]">
                      <span>{t("track.subtotal")}</span>
                      <span>{formatCad(order.subtotalAmount)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>{t("track.discount")}</span>
                        <span>-{formatCad(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[var(--color-gray-500)]">
                      <span>{t("track.shipping")}</span>
                      <span>{order.shippingAmount === 0 ? t("track.free") : formatCad(order.shippingAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-gray-500)]">
                      <span>{t("track.tax")}</span>
                      <span>{formatCad(order.taxAmount || 0)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-[var(--color-gray-100)] font-bold">
                  <span>{t("track.total")}</span>
                  <span>{formatCad(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Artwork Upload (guest) */}
          {order.status !== "canceled" && order.status !== "refunded" && (
            <OrderArtworkUpload
              orderId={order.id}
              email={email}
              isGuest={true}
              itemsNeeding={order.itemsNeedingArtwork || []}
              existingFiles={order.files || []}
              onUploadComplete={() => {
                // Re-fetch order to update file list
                handleSubmit({ preventDefault: () => {} });
              }}
            />
          )}

          {/* Date */}
          <p className="text-xs text-[var(--color-gray-400)]">
            {t("track.orderedOn")} {new Date(order.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          {Array.isArray(order.timeline) && order.timeline.length > 0 && (
            <div className="border-t border-[var(--color-gray-100)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-400)] mb-2">{t("track.timeline")}</p>
              <div className="space-y-2">
                {order.timeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-gray-400)]" />
                    <div>
                      <p className="text-sm text-[var(--color-gray-800)]">{getCustomerTimelineLabel(t, event.action)}</p>
                      <p className="text-[11px] text-[var(--color-gray-500)]">
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

      {/* Quality guarantee */}
      <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span className="font-semibold">{t("track.qualityGuarantee")}</span>
      </div>

      {/* Help + Shop again */}
      <div className="space-y-3 text-center text-xs text-[var(--color-gray-500)]">
        <p>
          {t("track.helpText")}{" "}
          <Link href="/contact" className="underline hover:text-[var(--color-gray-900)]">{t("track.contactUs")}</Link>
        </p>
        <Link
          href="/shop"
          className="inline-block rounded-xl border border-[var(--color-gray-300)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
        >
          {t("track.browseShop")}
        </Link>
      </div>
    </div>
  );
}
