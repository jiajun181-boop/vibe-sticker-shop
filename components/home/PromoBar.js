"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STORAGE_KEY = "vibe-promo-dismissed";

export default function PromoBar() {
  const { t } = useTranslation();
  const barRef = useRef(null);

  // Hydration-safe: always start false (matching SSR), then check localStorage in useEffect
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setHidden(true);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const updateOffset = () => {
      const h = hidden ? 0 : Math.ceil(barRef.current?.offsetHeight || 0);
      root.style.setProperty("--promo-offset", `${h}px`);
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);

    let ro = null;
    if (typeof ResizeObserver !== "undefined" && barRef.current) {
      ro = new ResizeObserver(updateOffset);
      ro.observe(barRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateOffset);
      if (ro) ro.disconnect();
      root.style.setProperty("--promo-offset", "0px");
    };
  }, [hidden]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div ref={barRef} className="sticky top-0 z-[60] w-full bg-[var(--color-ink-black)] text-white">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8 sm:text-sm">
        <p className="font-medium">{t("promo.text")}</p>
        <button
          type="button"
          onClick={handleClose}
          className="ml-4 rounded-xl border border-white/30 px-2 py-0.5 text-xs transition-colors duration-200 hover:border-white/70"
          aria-label="Dismiss promo"
        >
          x
        </button>
      </div>
    </div>
  );
}
