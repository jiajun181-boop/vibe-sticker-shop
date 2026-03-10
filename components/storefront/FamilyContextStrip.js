"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { parseFamilyEntry, getFamilyEntryDisplay } from "@/lib/storefront/family-entry";

/**
 * Lightweight context strip shown at the top of a product page
 * when the user arrived from a family landing page.
 *
 * Displays: "[Back arrow] Back to Stickers \u00B7 Best for: Brand & Logo Stickers"
 *
 * Renders nothing if no family context is present in the URL.
 */
export default function FamilyContextStrip() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const ctx = parseFamilyEntry(searchParams);
  const display = getFamilyEntryDisplay(ctx);

  if (!display) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/15 px-4 py-2 text-sm">
      <Link
        href={display.familyHref}
        className="inline-flex items-center gap-1 shrink-0 font-medium text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t(display.familyLabelKey)}
      </Link>
      {display.needLabelKey && (
        <>
          <span className="text-[var(--color-gray-300)]">{"\u00B7"}</span>
          <span className="text-[var(--color-gray-600)] truncate">
            {t("storefront.familyEntry.bestFor")}{" "}
            <span className="font-medium text-[var(--color-gray-800)]">{t(display.needLabelKey)}</span>
          </span>
        </>
      )}
    </div>
  );
}
