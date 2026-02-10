import { cookies } from "next/headers";
import { createT, DEFAULT_LOCALE, LOCALES } from "./index";

/**
 * Read locale from the "locale" cookie. Server Components only.
 */
export async function getServerLocale() {
  const c = await cookies();
  const raw = c.get("locale")?.value;
  return LOCALES.includes(raw) ? raw : DEFAULT_LOCALE;
}

/**
 * Get a translation function bound to the server locale.
 */
export async function getServerT() {
  const locale = await getServerLocale();
  return createT(locale);
}
