"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    setCartCount(storeCount);
  }, [storeCount]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

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
          {/* Desktop search */}
          <div className="hidden md:flex items-center">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("nav.searchPlaceholder")}
                  className="w-48 rounded-full border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                  onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="text-gray-400 hover:text-gray-700 text-sm"
                >
                  &times;
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                aria-label={t("nav.search")}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            )}
          </div>

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

      {/* Mobile nav row with search */}
      <div className="flex items-center gap-3 px-6 pb-3 md:hidden">
        <form onSubmit={handleSearch} className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("nav.searchPlaceholder")}
            className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-gray-400"
          />
        </form>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-600 shrink-0">
          {linkKeys.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors duration-200 hover:text-gray-900 whitespace-nowrap">
              {t(link.key)}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
