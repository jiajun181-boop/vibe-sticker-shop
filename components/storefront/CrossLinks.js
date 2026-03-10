"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Shared cross-link cards for related categories.
 *
 * Supports two layouts:
 * - "grid" (default): simple 3-column grid with title + desc + arrow
 * - "list": stacked list with optional icon + reason label above each card
 *
 * Props:
 * - titleKey — i18n key for section heading (e.g. "wwf.related")
 * - links   — array of { titleKey, descKey, href, icon?, reasonKey? }
 * - layout  — "grid" | "list" (default: "grid")
 */
export default function CrossLinks({ titleKey, links, layout = "grid" }) {
  const { t } = useTranslation();

  if (!links?.length) return null;

  const cardClass =
    "group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md";

  const arrow = (
    <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );

  return (
    <section className="mt-12">
      {titleKey && (
        <h2 className="text-xl font-semibold tracking-tight">{t(titleKey)}</h2>
      )}

      {layout === "list" ? (
        <div className="mt-4 space-y-3">
          {links.map((link) => (
            <div key={link.href}>
              {link.reasonKey && (
                <p className="text-xs font-medium text-[var(--color-brand)] mb-1.5">
                  {t(link.reasonKey)}
                </p>
              )}
              <Link href={link.href} className={cardClass}>
                {link.icon && <span className="text-2xl shrink-0">{link.icon}</span>}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
                    {t(link.titleKey)}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                    {t(link.descKey)}
                  </p>
                </div>
                {arrow}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={cardClass}>
              {link.icon && <span className="text-2xl shrink-0">{link.icon}</span>}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
                  {t(link.titleKey)}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-gray-500)] truncate">
                  {t(link.descKey)}
                </p>
              </div>
              {arrow}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
