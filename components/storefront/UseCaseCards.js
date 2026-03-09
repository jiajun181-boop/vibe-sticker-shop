"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * "Popular Use Cases" section — shows how customers use these products.
 *
 * Props:
 * - title    — i18n key for section title
 * - cases    — array of { key, icon, titleKey, descKey, href?, products?: string[] }
 */
export default function UseCaseCards({ title, cases }) {
  const { t } = useTranslation();

  if (!cases?.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
        {t(title)}
      </h2>

      <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {cases.map((uc) => {
          const Wrapper = uc.href ? Link : "div";
          const wrapperProps = uc.href ? { href: uc.href } : {};
          return (
            <Wrapper
              key={uc.key}
              {...wrapperProps}
              className="group rounded-xl border border-[var(--color-gray-200)] bg-white p-4 transition-all hover:border-[var(--color-brand)] hover:shadow-sm"
            >
              <span className="text-2xl">{uc.icon}</span>
              <h3 className="mt-2 text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)] transition-colors">
                {t(uc.titleKey)}
              </h3>
              <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2">
                {t(uc.descKey)}
              </p>
              {uc.products && uc.products.length > 0 && (
                <p className="mt-2 text-[10px] font-medium text-[var(--color-brand)]">
                  {uc.products.map((p) => t(p)).join(" \u00B7 ")}
                </p>
              )}
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}
