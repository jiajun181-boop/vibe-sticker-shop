"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg"
    >
      {t("a11y.skipToContent")}
    </a>
  );
}
