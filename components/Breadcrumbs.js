"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Breadcrumbs({ items, dark = false }) {
  const { t } = useTranslation();
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`mb-4 text-xs ${dark ? "text-gray-400" : "text-[var(--color-gray-400)]"}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link href="/" className={`transition-colors ${dark ? "hover:text-white" : "hover:text-[var(--color-gray-700)]"}`}>{t("nav.home")}</Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className={dark ? "text-gray-600" : "text-[var(--color-gray-300)]"}>/</span>
            {item.href ? (
              <Link href={item.href} className={`transition-colors ${dark ? "hover:text-white" : "hover:text-[var(--color-gray-700)]"}`}>{item.label}</Link>
            ) : (
              <span className={`font-medium ${dark ? "text-gray-200" : "text-[var(--color-gray-600)]"}`}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
