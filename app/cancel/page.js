"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CancelPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gray-100)]">
          <svg className="h-8 w-8 text-[var(--color-gray-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--color-gray-900)]">
          {t("cancel.title")}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-gray-600)]">
          {t("cancel.message")}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-gray-900)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black"
          >
            {t("cancel.continueShopping")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-gray-300)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-900)]"
          >
            {t("cancel.needHelp")}
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-[var(--color-gray-400)]">
          {t("cancel.contactInfo")}
        </p>
      </div>
    </main>
  );
}
