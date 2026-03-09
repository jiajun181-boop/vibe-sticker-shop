"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Back-to-shop link — shared across all family landing pages.
 * Props:
 * - labelKey — i18n key (default: "shop.backToCategories")
 */
export default function BackToShop({ labelKey = "shop.backToCategories" }) {
  const { t } = useTranslation();

  return (
    <div className="mt-12 text-center">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t(labelKey)}
      </Link>
    </div>
  );
}
