"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Value proposition cards — "Why choose us" section.
 *
 * Props:
 * - props — array of { icon, titleKey, descKey, ctaKey?, ctaHref? }
 */
export default function ValueProps({ props: items }) {
  const { t } = useTranslation();

  if (!items?.length) return null;

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
          {item.icon && (
            <span className="text-2xl">{item.icon}</span>
          )}
          <h3 className="mt-2 text-sm font-semibold text-[var(--color-gray-600)]">
            {t(item.titleKey)}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-gray-700)]">
            {t(item.descKey)}
          </p>
          {item.ctaKey && item.ctaHref && (
            <Link
              href={item.ctaHref}
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-brand-dark)]"
            >
              {t(item.ctaKey)}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
