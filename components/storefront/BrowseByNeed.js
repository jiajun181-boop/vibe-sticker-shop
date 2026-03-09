"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * "Browse by Need" \u2014 scenario-based guidance cards near the top of a family page.
 * Each card links to a specific product or scrolls to a section on the same page.
 *
 * Props:
 * - titleKey    \u2014 i18n key for section title
 * - subtitleKey \u2014 i18n key for section subtitle (optional)
 * - cases       \u2014 array of { key, icon, titleKey, descKey, href }
 *                 href can be a URL (navigates) or "#sectionId" (smooth-scrolls in page)
 */
export default function BrowseByNeed({ titleKey, subtitleKey, cases, onAction }) {
  const { t } = useTranslation();

  if (!cases?.length) return null;

  const handleAnchorClick = (e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--color-gray-900)]">
        {t(titleKey)}
      </h2>
      {subtitleKey && (
        <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(subtitleKey)}</p>
      )}

      <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3">
        {cases.map((c) => {
          const isAnchor = c.href?.startsWith("#");
          const isAction = !!c.action;
          const showDownArrow = isAnchor || isAction;
          const cardContent = (
            <>
              <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)] transition-colors">
                  {t(c.titleKey)}
                </h3>
                <p className="mt-0.5 text-[11px] text-[var(--color-gray-500)] line-clamp-2">
                  {t(c.descKey)}
                </p>
              </div>
              <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)] transition-colors mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {showDownArrow ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                )}
              </svg>
            </>
          );

          const className = "group flex items-start gap-3 rounded-xl border-l-4 border-[var(--color-brand)] bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5";

          if (isAction) {
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onAction?.(c.action)}
                className={`${className} text-left`}
              >
                {cardContent}
              </button>
            );
          }

          if (isAnchor) {
            return (
              <button
                key={c.key}
                type="button"
                onClick={(e) => handleAnchorClick(e, c.href.slice(1))}
                className={`${className} text-left`}
              >
                {cardContent}
              </button>
            );
          }

          return (
            <Link key={c.key} href={c.href} className={className}>
              {cardContent}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
