"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * "Browse by Need" — scenario-based guidance cards near the top of a family page.
 * Each card links to a specific product, helping customers find what they need by use-case.
 *
 * Props:
 * - titleKey    — i18n key for section title
 * - subtitleKey — i18n key for section subtitle (optional)
 * - cases       — array of { key, icon, titleKey, descKey, href }
 */
export default function BrowseByNeed({ titleKey, subtitleKey, cases }) {
  const { t } = useTranslation();

  if (!cases?.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--color-gray-900)]">
        {t(titleKey)}
      </h2>
      {subtitleKey && (
        <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(subtitleKey)}</p>
      )}

      <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3">
        {cases.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="group flex items-start gap-3 rounded-xl border-l-4 border-[var(--color-brand)] bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)] transition-colors">
                {t(c.titleKey)}
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--color-gray-500)] line-clamp-2">
                {t(c.descKey)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
