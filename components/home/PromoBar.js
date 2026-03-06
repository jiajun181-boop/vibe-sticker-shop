"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STORAGE_KEY = "vibe-promo-dismissed";

export default function PromoBar() {
  const { t } = useTranslation();
  const barRef = useRef(null);
  const pathname = usePathname() || "";
  // Hide on mobile for product/configurator pages
  const isProductPage = pathname.startsWith("/order") || /^\/shop\/[^/]+\/[^/]+$/.test(pathname);

  // Hydration-safe: always start false (matching SSR), then check localStorage in useEffect
  const [hidden, setHidden] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setHidden(true);
    }
  }, []);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    if (hidden) return;
    let prevY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolledDown(y > 50 && y > prevY);
      prevY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden]);

  useEffect(() => {
    const root = document.documentElement;
    const updateOffset = () => {
      const h = (hidden || scrolledDown) ? 0 : Math.ceil(barRef.current?.offsetHeight || 0);
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
  }, [hidden, scrolledDown]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div ref={barRef} className={`sticky top-0 z-[60] w-full bg-[var(--color-lime)] text-[var(--color-ink-black)] transition-transform duration-200 ${scrolledDown ? "-translate-y-full" : "translate-y-0"} ${isProductPage ? "hidden md:block" : ""}`}>
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-2.5 text-xs sm:px-6 lg:px-8 sm:text-sm">
        <p className="font-semibold tracking-wide">{t("promo.text")}</p>
        <button
          type="button"
          onClick={handleClose}
          className="ml-4 px-2 py-0.5 text-xs font-bold opacity-60 transition-opacity duration-200 hover:opacity-100"
          aria-label="Dismiss promo"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
