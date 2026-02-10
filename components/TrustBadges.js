"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export function PaymentBadges() {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 text-center">
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        {t("trust.secureCheckout")}
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-wider text-gray-300">
        <span>VISA</span>
        <span>MC</span>
        <span>AMEX</span>
        <span>PAYPAL</span>
      </div>
    </div>
  );
}

export function GuaranteeBadge() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
      <span className="font-semibold">{t("trust.guarantee")}</span>
    </div>
  );
}

export function TrustedBadge() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {t("trust.trustedBy")}
    </div>
  );
}
