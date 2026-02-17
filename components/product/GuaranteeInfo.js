"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function GuaranteeInfo() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">
        {t("guarantee.title")}
      </h3>
      <ul className="space-y-1.5 text-xs text-[var(--color-gray-600)]">
        <li className="flex items-start gap-2">
          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {t("guarantee.reprint")}
        </li>
        <li className="flex items-start gap-2">
          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {t("guarantee.review")}
        </li>
        <li className="flex items-start gap-2">
          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {t("guarantee.contact")}
        </li>
      </ul>
      <Link href="/faq#returns" className="inline-block text-xs font-semibold text-[var(--color-gray-700)] underline hover:text-[var(--color-gray-900)]">
        {t("guarantee.learnMore")}
      </Link>
    </div>
  );
}
