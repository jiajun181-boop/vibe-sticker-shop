import en from "./en";
import zh from "./zh";

export const LOCALES = ["en", "zh"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_LABELS = { en: "EN", zh: "中文" };

const dicts = { en, zh };

/**
 * Create a translation function for the given locale.
 * Supports interpolation: t("key", { count: 5 })
 * Fallback chain: locale dict → en dict → raw key
 */
/**
 * Read the current locale from the "locale" cookie (client-side).
 * Falls back to DEFAULT_LOCALE.
 */
export function useLocale() {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|;\s*)locale=(\w+)/);
  return match && LOCALES.includes(match[1]) ? match[1] : DEFAULT_LOCALE;
}

export function createT(locale) {
  const dict = dicts[locale] || dicts[DEFAULT_LOCALE];
  const fallback = dicts[DEFAULT_LOCALE];

  return function t(key, params) {
    let str = dict[key] ?? fallback[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };
}
