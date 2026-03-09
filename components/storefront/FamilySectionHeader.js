"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Consistent section heading for family landing pages.
 * Props:
 * - titleKey   — i18n key for section title
 * - subtitleKey — i18n key for section subtitle (optional)
 */
export default function FamilySectionHeader({ titleKey, subtitleKey }) {
  const { t } = useTranslation();

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--color-gray-900)]">
        {t(titleKey)}
      </h2>
      {subtitleKey && (
        <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(subtitleKey)}</p>
      )}
    </div>
  );
}
