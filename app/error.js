"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ErrorPage({ error, reset }) {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-gray-50)] px-6 text-center text-[var(--color-gray-900)]">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold">{t("error.generic.title")}</h1>
        <p className="mt-3 text-sm text-[var(--color-gray-600)]">{t("error.generic.message")}</p>
        {error?.message && (
          <p className="mt-3 rounded-lg bg-[var(--color-gray-100)] px-3 py-2 text-left text-xs text-[var(--color-gray-500)] break-words">
            {error.message}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-full bg-[var(--color-gray-900)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black"
          >
            {t("error.generic.tryAgain")}
          </button>
          <Link
            href="/"
            className="rounded-full border border-[var(--color-gray-300)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)]"
          >
            {t("error.generic.goHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
