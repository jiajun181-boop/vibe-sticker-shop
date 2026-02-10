"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { trackPurchase } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n/useTranslation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function SuccessClient({ sessionId, lineItems, customerEmail, amountTotal }) {
  const { t } = useTranslation();
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    useCartStore.getState().clearCart();
    trackPurchase({
      value: amountTotal || 0,
      currency: "CAD",
      transactionId: sessionId,
      items: lineItems || [],
    });
  }, [sessionId, lineItems, amountTotal]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="max-w-lg w-full bg-white shadow-lg rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t("success.title")}</h1>
          <p className="mt-2 text-sm text-gray-600">{t("success.subtitle")}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-1">{t("success.orderRef")}</p>
          <p className="font-mono text-xs font-medium text-gray-800 break-all">{sessionId}</p>
          {customerEmail && (
            <p className="mt-2 text-xs text-gray-500">
              {t("success.emailSent", { email: customerEmail })}
            </p>
          )}
        </div>

        {lineItems && lineItems.length > 0 && (
          <div className="mb-6 space-y-2">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                  <p className="text-xs text-gray-500">{t("success.qty", { qty: item.quantity })}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCad(item.amount_total)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3 px-1">
              <span className="text-sm font-semibold text-gray-900">{t("success.total")}</span>
              <span className="text-base font-bold text-gray-900">{formatCad(amountTotal)} CAD</span>
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

        <Link
          href="/shop"
          className="block w-full rounded-full bg-gray-900 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black"
        >
          {t("success.continueShopping")}
        </Link>
      </div>
    </div>
  );
}
