"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STORAGE_KEY = "vibe-promo-dismissed";

export default function PromoBar() {
  const { t } = useTranslation();

  // Hydration-safe: always start false (matching SSR), then check localStorage in useEffect
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setHidden(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-gray-900 text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 text-xs sm:text-sm">
        <p className="font-medium">{t("promo.text")}</p>
        <button
          type="button"
          onClick={handleClose}
          className="ml-4 rounded-full border border-white/30 px-2 py-0.5 text-xs transition-colors duration-200 hover:border-white/70"
          aria-label="Dismiss promo"
        >
          x
        </button>
      </div>
    </div>
  );
}
