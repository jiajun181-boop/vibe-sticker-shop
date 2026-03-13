"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { trackPurchase } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/product-helpers";
import { useAuthStatus } from "@/lib/useAuthStatus";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

function addBusinessDays(base, days) {
  const n = new Date(base);
  let count = 0;
  while (count < days) {
    n.setDate(n.getDate() + 1);
    if (n.getDay() !== 0 && n.getDay() !== 6) count += 1;
  }
  return n;
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function buildStatusCopy(t, status, reason) {
  if (status === "canceled") {
    return {
      title: t("success.canceledTitle"),
      subtitle: reason || t("success.canceledSubtitle"),
    };
  }

  if (status === "failed") {
    return {
      title: t("success.failedTitle"),
      subtitle: reason || t("success.failedSubtitle"),
    };
  }

  if (status === "timeout") {
    return {
      title: t("success.timeoutTitle"),
      subtitle: t("success.timeoutSubtitle"),
    };
  }

  return {
    title: t("success.verifyingTitle"),
    subtitle: t("success.verifyingSubtitle"),
  };
}

export default function SuccessClient({ sessionId, statusToken }) {
  const { t } = useTranslation();
  const cleared = useRef(false);
  const [status, setStatus] = useState("pending");
  const [reason, setReason] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [amountTotal, setAmountTotal] = useState(0);
  const [lineItems, setLineItems] = useState([]);
  const [retryToken, setRetryToken] = useState(0);
  const [orderId, setOrderId] = useState("");
  const { isLoggedIn } = useAuthStatus();
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const statusCopy = useMemo(() => buildStatusCopy(t, status, reason), [t, status, reason]);
  const timelinePlan = useMemo(() => {
    const now = new Date();
    const reviewDate = addBusinessDays(now, 1);
    const prodStart = addBusinessDays(now, 2);
    const shipWindowStart = addBusinessDays(now, 3);
    const shipWindowEnd = addBusinessDays(now, 5);
    return [
      { title: t("success.timelineFileCheck"), date: formatShortDate(reviewDate), desc: t("success.timelineFileCheckDesc") },
      { title: t("success.timelineProduction"), date: formatShortDate(prodStart), desc: t("success.timelineProductionDesc") },
      { title: t("success.timelineShipping"), date: `${formatShortDate(shipWindowStart)} - ${formatShortDate(shipWindowEnd)}`, desc: t("success.timelineShippingDesc") },
    ];
  }, [t]);

  useEffect(() => {
    let stopped = false;
    let attempts = 0;
    let timer;

    async function pollStatus() {
      if (stopped) return;
      attempts += 1;

      try {
        const query = new URLSearchParams({ session_id: sessionId });
        if (statusToken) query.set("st", statusToken);

        const res = await fetch(`/api/order-status?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok && data.status !== "failed" && data.status !== "canceled") {
          throw new Error(data.error || "Unable to verify payment status.");
        }

        if (data.status === "paid") {
          setStatus("paid");
          setCustomerEmail(data.customerEmail || "");
          setAmountTotal(data.amountTotal || 0);
          setLineItems(Array.isArray(data.lineItems) ? data.lineItems : []);
          if (data.orderId) setOrderId(String(data.orderId));
          return;
        }

        if (data.status === "failed" || data.status === "canceled") {
          setStatus(data.status);
          setReason(data.reason || "");
          return;
        }

        if (attempts >= MAX_POLL_ATTEMPTS) {
          setStatus("timeout");
          return;
        }

        timer = window.setTimeout(pollStatus, POLL_INTERVAL_MS);
      } catch {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setStatus("timeout");
          return;
        }
        timer = window.setTimeout(pollStatus, POLL_INTERVAL_MS);
      }
    }

    setStatus("pending");
    setReason("");
    pollStatus();

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [sessionId, statusToken, retryToken]);

  useEffect(() => {
    if (status !== "paid") return;
    if (cleared.current) return;

    cleared.current = true;
    useCartStore.getState().clearCart();
    trackPurchase({
      value: amountTotal || 0,
      currency: "CAD",
      transactionId: sessionId,
      items: lineItems || [],
    });

    // Fetch featured products for cross-sell
    fetch("/api/products/suggestions?featured=true&limit=4")
      .then((res) => res.ok ? res.json() : [])
      .then((products) => setFeaturedProducts(products))
      .catch(() => {}); // Non-critical — fail silently
  }, [status, sessionId, lineItems, amountTotal]);

  if (status !== "paid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-gray-50)] p-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
              <svg className="h-8 w-8 animate-spin text-sky-600" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" className="opacity-25" stroke="currentColor" strokeWidth="3" />
                <path
                  d="M21 12a9 9 0 00-9-9"
                  className="opacity-90"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">{statusCopy.title}</h1>
            <p className="mt-2 text-sm text-[var(--color-gray-600)]">{statusCopy.subtitle}</p>
          </div>

          <div className="mb-6 rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("success.orderRef")}</p>
            <p className="break-all font-mono text-xs font-medium text-[var(--color-gray-800)]">{sessionId}</p>
          </div>

          <div className="space-y-3">
            {(status === "pending" || status === "timeout") && (
              <button
                type="button"
                onClick={() => setRetryToken((v) => v + 1)}
                className="block w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)]"
              >
                {t("success.retryStatus")}
              </button>
            )}
            <Link
              href="/shop"
              className="block w-full rounded-xl bg-[var(--color-gray-900)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] transition-colors hover:bg-black"
            >
              {t("success.backToCart")}
            </Link>
            <Link
              href="/shop"
              className="block w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)]"
            >
              {t("success.continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--color-gray-50)]">
      <div className="max-w-lg w-full bg-white shadow-lg rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-gray-900)]">{t("success.title")}</h1>
          <p className="mt-2 text-sm text-[var(--color-gray-600)]">{t("success.subtitle")}</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4 mb-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-1">{t("success.orderRef")}</p>
          <p className="font-mono text-xs font-medium text-[var(--color-gray-800)] break-all">{sessionId}</p>
          {customerEmail && (
            <p className="mt-2 text-xs text-[var(--color-gray-500)]">
              {t("success.emailSent", { email: customerEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, "*") + c) })}
            </p>
          )}
        </div>

        {lineItems && lineItems.length > 0 && (
          <div className="mb-6 space-y-2">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--color-gray-100)] bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-gray-900)]">{item.description}</p>
                  <p className="text-xs text-[var(--color-gray-500)]">{t("success.qty", { qty: item.quantity })}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-gray-900)]">{formatCad(item.amount_total)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-[var(--color-gray-200)] pt-3 mt-3 px-1">
              <span className="text-sm font-semibold text-[var(--color-gray-900)]">{t("success.total")}</span>
              <span className="text-base font-bold text-[var(--color-gray-900)]">{formatCad(amountTotal)} CAD</span>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 mb-3">{t("success.whatNext")}</h3>
          <div className="space-y-3">
            {[
              { step: "1", text: t("success.step1") },
              { step: "2", text: t("success.step2") },
              { step: "3", text: t("success.step3") },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-[#fff]">
                  {s.step}
                </span>
                <p className="text-sm text-emerald-800">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("success.orderTimeline")}</h3>
          <div className="space-y-3">
            {timelinePlan.map((step, idx) => (
              <div key={step.title} className="flex items-start gap-3 border-b border-[var(--color-gray-100)] pb-2 last:border-b-0 last:pb-0">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-200)] text-[10px] font-bold text-[var(--color-gray-600)]">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-gray-900)]">{step.title}</p>
                    <p className="shrink-0 text-[11px] font-medium text-[var(--color-gray-500)]">{step.date}</p>
                  </div>
                  <p className="text-xs text-[var(--color-gray-500)]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload artwork CTA — shown when order likely has pending artwork */}
        {orderId && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-sky-800">{t("success.uploadArtworkTitle")}</p>
                <p className="mt-0.5 text-xs text-sky-700">{t("success.uploadArtworkDesc")}</p>
                <Link
                  href={`/account/orders/${orderId}`}
                  className="mt-2 inline-block rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-700"
                >
                  {t("success.uploadArtworkCta")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quality guarantee */}
        <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 mb-6">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="font-semibold">{t("success.qualityGuarantee")}</span>
        </div>

        {/* Need help? Contact section */}
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">{t("success.needHelpTitle")}</h3>
          <p className="text-xs text-[var(--color-gray-600)] mb-2">{t("success.needHelpDesc")}</p>
          <div className="space-y-1 text-xs text-[var(--color-gray-700)]">
            <p className="font-medium">{t("success.needHelpPhone")}</p>
            <p>{t("success.needHelpEmail")}</p>
            <p className="text-[var(--color-gray-500)]">{t("success.needHelpHours")}</p>
          </div>
        </div>

        {/* Guest → Account conversion CTA */}
        {!isLoggedIn && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">{t("success.createAccountTitle")}</p>
                <p className="mt-0.5 text-xs text-amber-700">{t("success.createAccountDesc")}</p>
                <Link
                  href="/signup"
                  className="mt-2 inline-block rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-700"
                >
                  {t("success.createAccountCta")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Referral CTA — only for logged-in users who can access /account */}
        {isLoggedIn && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-indigo-800">{t("success.referralTitle")}</p>
                <p className="mt-0.5 text-xs text-indigo-700">{t("success.referralDesc")}</p>
                <Link
                  href="/account"
                  className="mt-2 inline-block rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700"
                >
                  {t("success.referralCta")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Reorder CTA — logged-in only (copy references "your account") */}
        {isLoggedIn && orderId && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-sky-800">{t("success.reorderTitle")}</p>
                <p className="mt-0.5 text-xs text-sky-700">{t("success.reorderDesc")}</p>
                <Link
                  href={`/account/orders/${orderId}`}
                  className="mt-2 inline-block rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-700"
                >
                  {t("success.reorderCta")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Cross-sell: featured products */}
        {featuredProducts.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">
              {t("success.youMayAlsoLike")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {featuredProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/shop/${p.category}/${p.slug}`}
                  className="overflow-hidden rounded-xl border border-[var(--color-gray-200)] bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {p.image && (
                    <div className="relative aspect-[4/3] bg-[var(--color-gray-100)]">
                      <Image src={p.image} alt={p.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-[var(--color-gray-900)] line-clamp-1">{p.name}</p>
                    {p.basePrice > 0 && (
                      <p className="mt-0.5 text-[11px] text-[var(--color-gray-600)]">
                        {t("success.fromPrice", { price: formatCad(p.basePrice) })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href={orderId ? `/track-order?order=${orderId}` : "/track-order"}
            className="block w-full rounded-xl bg-[var(--color-gray-900)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] transition-colors hover:bg-black"
          >
            {t("success.trackOrder")}
          </Link>
          <Link
            href="/shop"
            className="block w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            {t("success.continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
