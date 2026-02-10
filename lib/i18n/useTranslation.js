"use client";

import { useEffect, useState } from "react";
import { createT, DEFAULT_LOCALE, LOCALES } from "./index";

function getLocaleCookie() {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/);
  const val = match ? decodeURIComponent(match[1]) : DEFAULT_LOCALE;
  return LOCALES.includes(val) ? val : DEFAULT_LOCALE;
}

function setLocaleCookie(locale) {
  document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

/**
 * Client-side translation hook.
 *
 * Hydration-safe: initializes to DEFAULT_LOCALE during SSR,
 * syncs to cookie value in useEffect (same pattern as cart count in Navbar).
 *
 * @param {string} [initialLocale] - Optional server-provided locale to eliminate flash
 */
export function useTranslation(initialLocale) {
  const [locale, setLocaleState] = useState(initialLocale || DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cookieLocale = getLocaleCookie();
    if (cookieLocale !== locale) {
      setLocaleState(cookieLocale);
    }
    setHydrated(true);
  }, []);

  // Listen for locale changes from other components
  useEffect(() => {
    function handleLocaleChange(e) {
      setLocaleState(e.detail);
    }
    window.addEventListener("locale-change", handleLocaleChange);
    return () => window.removeEventListener("locale-change", handleLocaleChange);
  }, []);

  function setLocale(newLocale) {
    if (!LOCALES.includes(newLocale)) return;
    setLocaleCookie(newLocale);
    setLocaleState(newLocale);
    window.dispatchEvent(new CustomEvent("locale-change", { detail: newLocale }));
    // Reload so server components re-read the cookie
    window.location.reload();
  }

  const t = createT(locale);

  return { t, locale, setLocale, hydrated };
}
