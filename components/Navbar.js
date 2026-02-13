"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { USE_CASES } from "@/lib/useCases";

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
  const authUser = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

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
          La Lunar Printing Inc.
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          <Link href="/" className="transition-colors duration-200 hover:text-gray-900">{t("nav.home")}</Link>

          {/* Shop mega-menu dropdown */}
          <div className="relative group">
            <Link href="/shop" className="transition-colors duration-200 hover:text-gray-900">
              {t("nav.shop")}
            </Link>
            <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="w-[640px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
                <div className="grid grid-cols-4 gap-5">
                  {/* Column 1: Print & Marketing */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Print & Marketing</p>
                    <div className="mt-2 space-y-1">
                      <Link href="/shop/marketing-prints" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Marketing Prints</Link>
                      <Link href="/shop/business-cards" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Business Cards</Link>
                      <Link href="/shop/stamps" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Self-Inking Stamps</Link>
                      <Link href="/shop/business-forms" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Business Forms</Link>
                    </div>
                  </div>
                  {/* Column 2: Signs & Displays */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Signs & Displays</p>
                    <div className="mt-2 space-y-1">
                      <Link href="/shop/banners-displays" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Banners & Displays</Link>
                      <Link href="/shop/display-stands" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Display Stands</Link>
                      <Link href="/shop/rigid-signs" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Signs & Boards</Link>
                      <Link href="/shop/large-format-graphics" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Large Format</Link>
                    </div>
                  </div>
                  {/* Column 3: Vehicle & Fleet */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Vehicle & Fleet</p>
                    <div className="mt-2 space-y-1">
                      <Link href="/shop/vehicle-branding-advertising" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Vehicle Branding</Link>
                      <Link href="/shop/fleet-compliance-id" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Fleet Compliance</Link>
                      <Link href="/shop/retail-promo" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Retail & Promo</Link>
                      <Link href="/shop/packaging" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Packaging Inserts</Link>
                    </div>
                  </div>
                  {/* Column 4: Labels & Safety */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Labels & Safety</p>
                    <div className="mt-2 space-y-1">
                      <Link href="/shop/stickers-labels" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Stickers & Labels</Link>
                      <Link href="/shop/safety-warning-decals" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Safety & Warning</Link>
                      <Link href="/shop/facility-asset-labels" className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Facility & Asset Labels</Link>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-between">
                  <Link href="/shop" className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                    {t("nav.shopAll")}
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Ideas dropdown */}
          <div className="relative group">
            <button type="button" className="transition-colors duration-200 hover:text-gray-900">
              {t("nav.ideas")}
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="min-w-[180px] rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                {USE_CASES.map((uc) => (
                  <Link
                    key={uc.slug}
                    href={`/shop?useCase=${uc.slug}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span>{uc.icon}</span>
                    <span>{t(`useCase.${uc.slug}.title`)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/about" className="transition-colors duration-200 hover:text-gray-900">{t("nav.about")}</Link>
          <Link href="/contact" className="transition-colors duration-200 hover:text-gray-900">{t("nav.contact")}</Link>
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

          {!authLoading && (
            authUser ? (
              <Link
                href="/account"
                className="hidden md:inline-flex rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900"
              >
                {t("nav.account")}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900"
              >
                {t("nav.login")}
              </Link>
            )
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
      <div className="flex items-center gap-3 px-6 pb-2 md:hidden">
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
      {/* Mobile category chips */}
      <div className="flex gap-2 overflow-x-auto px-6 pb-3 md:hidden scrollbar-hide">
        {[
          { label: "Marketing Prints", href: "/shop/marketing-prints" },
          { label: "Business Cards", href: "/shop/business-cards" },
          { label: "Stickers", href: "/shop/stickers-labels" },
          { label: "Banners", href: "/shop/banners-displays" },
          { label: "Signs", href: "/shop/rigid-signs" },
          { label: "Vehicle", href: "/shop/vehicle-branding-advertising" },
          { label: "Stamps", href: "/shop/stamps" },
          { label: "Safety", href: "/shop/safety-warning-decals" },
        ].map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className="shrink-0 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-600 hover:border-gray-400 whitespace-nowrap"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
