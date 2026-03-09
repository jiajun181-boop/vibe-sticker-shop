"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * "Which product is right for you?" comparison table.
 *
 * Props:
 * - title     — section title (i18n key)
 * - subtitle  — section subtitle (i18n key)
 * - columns   — array of { key, nameKey, href, features: { [featureKey]: string | boolean } }
 * - features  — array of { key, labelKey } — rows of the table
 */
export default function ComparisonTable({ title, subtitle, columns, features }) {
  const { t } = useTranslation();

  if (!columns?.length || !features?.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
        {t(title)}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(subtitle)}</p>
      )}

      {/* Desktop table */}
      <div className="mt-4 hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[var(--color-gray-200)]">
              <th className="py-3 pr-4 text-left text-xs font-semibold text-[var(--color-gray-500)] uppercase tracking-wider">
                {t("storefront.comparison.feature")}
              </th>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-3 text-center text-sm font-semibold text-[var(--color-gray-900)]">
                  <Link href={col.href} className="hover:text-[var(--color-brand)] transition-colors">
                    {t(col.nameKey)}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feat, i) => (
              <tr key={feat.key} className={i % 2 === 0 ? "bg-[var(--color-gray-50)]" : "bg-white"}>
                <td className="py-3 pr-4 text-sm font-medium text-[var(--color-gray-700)]">
                  {t(feat.labelKey)}
                </td>
                {columns.map((col) => {
                  const val = col.features?.[feat.key];
                  return (
                    <td key={col.key} className="px-3 py-3 text-center text-sm text-[var(--color-gray-600)]">
                      {typeof val === "boolean" ? (
                        val ? (
                          <span className="inline-flex items-center justify-center text-emerald-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </span>
                        ) : (
                          <span className="text-[var(--color-gray-300)]">{"\u2014"}</span>
                        )
                      ) : (
                        <span>{val ? t(val) : "\u2014"}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--color-gray-200)]">
              <td className="py-3" />
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-3 text-center">
                  <Link
                    href={col.href}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[var(--color-brand-dark)] transition-colors"
                  >
                    {t("shop.configure")}
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="mt-4 grid gap-3 sm:hidden">
        {columns.map((col) => (
          <Link
            key={col.key}
            href={col.href}
            className="group rounded-xl border border-[var(--color-gray-200)] bg-white p-4 transition-all hover:border-[var(--color-brand)] hover:shadow-sm"
          >
            <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
              {t(col.nameKey)}
            </h3>
            <ul className="mt-2 space-y-1">
              {features.slice(0, 4).map((feat) => {
                const val = col.features?.[feat.key];
                if (val === false || !val) return null;
                return (
                  <li key={feat.key} className="flex items-center gap-1.5 text-xs text-[var(--color-gray-600)]">
                    <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {t(feat.labelKey)}{typeof val === "string" ? `: ${t(val)}` : ""}
                  </li>
                );
              })}
            </ul>
          </Link>
        ))}
      </div>
    </section>
  );
}
