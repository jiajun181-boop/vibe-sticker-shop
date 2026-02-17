"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { trackPurchase } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n/useTranslation";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

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
            <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-[var(--color-gray-500)]">{t("success.orderRef")}</p>
            <p className="break-all font-mono text-xs font-medium text-[var(--color-gray-800)]">{sessionId}</p>
          </div>

          <div className="space-y-3">
            {(status === "pending" || status === "timeout") && (
              <button
                type="button"
                onClick={() => setRetryToken((v) => v + 1)}
                className="block w-full rounded-full border border-[var(--color-gray-300)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-700)]"
              >
                {t("success.retryStatus")}
              </button>
            )}
            <Link
              href="/shop"
              className="block w-full rounded-full bg-[var(--color-gray-900)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black"
            >
              {t("success.backToCart")}
            </Link>
            <Link
              href="/shop"
              className="block w-full rounded-full border border-[var(--color-gray-300)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-700)]"
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-gray-500)] mb-1">{t("success.orderRef")}</p>
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 mb-3">{t("success.whatNext")}</h3>
          <div className="space-y-3">
            {[
              { step: "1", text: t("success.step1") },
              { step: "2", text: t("success.step2") },
              { step: "3", text: t("success.step3") },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {s.step}
                </span>
                <p className="text-sm text-emerald-800">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">{t("success.orderTimeline")}</h3>
          <div className="space-y-3">
            {timelinePlan.map((step) => (
              <div key={step.title} className="flex items-start justify-between gap-3 border-b border-[var(--color-gray-100)] pb-2 last:border-b-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-gray-900)]">{step.title}</p>
                  <p className="text-xs text-[var(--color-gray-500)]">{step.desc}</p>
                </div>
                <p className="text-xs font-semibold text-[var(--color-gray-700)]">{step.date}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/shop"
          className="block w-full rounded-full bg-[var(--color-gray-900)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black"
        >
          {t("success.continueShopping")}
        </Link>
      </div>
    </div>
  );
}
