"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n/useTranslation";

const linkKeys = [
  { key: "nav.home", href: "/" },
  { key: "nav.shop", href: "/shop" },
  { key: "nav.about", href: "/about" },
  { key: "nav.contact", href: "/contact" },
];

export default function Navbar() {
  const storeCount = useCartStore((state) => state.getCartCount());
  const openCart = useCartStore((state) => state.openCart);
  const { t, locale, setLocale, hydrated } = useTranslation();

  // Defer cart count to avoid SSR hydration mismatch (Zustand persists to localStorage)
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    setCartCount(storeCount);
  }, [storeCount]);

  return (
    <header className="sticky top-0 z-[50] w-full border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-900">
          Vibe Sticker Shop
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          {linkKeys.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors duration-200 hover:text-gray-900">
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {hydrated && (
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "zh" : "en")}
              className="rounded-full border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-900"
              aria-label="Switch language"
            >
              {locale === "en" ? "中文" : "EN"}
            </button>
          )}

          <button
            type="button"
            onClick={openCart}
            className="relative flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 transition-colors duration-200 hover:border-gray-900"
          >
            <span>{t("nav.cart")}</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pb-3 text-xs font-medium text-gray-600 md:hidden">
        {linkKeys.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors duration-200 hover:text-gray-900">
            {t(link.key)}
          </Link>
        ))}
      </div>
    </header>
  );
}
