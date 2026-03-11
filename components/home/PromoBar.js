"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STORAGE_KEY = "vibe-promo-dismissed";

export default function PromoBar() {
  const { t, locale } = useTranslation();
  const barRef = useRef(null);
  const pathname = usePathname() || "";
  // Hide on mobile for product/configurator pages
  const isProductPage = pathname.startsWith("/order") || /^\/shop\/[^/]+\/[^/]+$/.test(pathname);

  // Hydration-safe: always start false (matching SSR), then check localStorage in useEffect
  const [hidden, setHidden] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);

  // CMS promo config (fetched once, falls back to i18n)
  const [cms, setCms] = useState(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setHidden(true);
      return; // No need to fetch CMS if dismissed
    }
    // Fetch CMS promo config (lightweight, cached on server)
    fetch("/api/cms/promo")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setCms(data);
      })
      .catch(() => {}); // Fall back to i18n on error
  }, []);

  // Determine display text — CMS takes priority, then i18n fallback
  const cmsText = cms
    ? (locale === "zh" ? cms.textZh : cms.textEn) || ""
    : "";
  const displayText = cmsText || t("promo.text");
  const bgColor = cms?.bgColor || "var(--color-lime)";
  const link = cms?.link || "";
  const isActive = cms ? cms.active !== false : true; // Active by default when no CMS

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
      const h = (hidden || scrolledDown || !isActive) ? 0 : Math.ceil(barRef.current?.offsetHeight || 0);
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
  }, [hidden, scrolledDown, isActive]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHidden(true);
  };

  if (hidden || !isActive) return null;

  // Determine text color: light bg → dark text, dark bg → light text
  const isLightBg = bgColor === "var(--color-lime)" || bgColor.startsWith("#f") || bgColor.startsWith("#e") || bgColor.startsWith("#d") || bgColor.startsWith("#c");
  const textColor = isLightBg ? "var(--color-ink-black)" : "#fff";

  const content = (
    <p className="font-semibold tracking-wide">{displayText}</p>
  );

  return (
    <div
      ref={barRef}
      className={`sticky top-0 z-[60] w-full transition-transform duration-200 ${scrolledDown ? "-translate-y-full" : "translate-y-0"} ${isProductPage ? "hidden md:block" : ""}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-2.5 text-xs sm:px-6 lg:px-8 sm:text-sm">
        {link ? (
          <a href={link} className="hover:underline">
            {content}
          </a>
        ) : (
          content
        )}
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
