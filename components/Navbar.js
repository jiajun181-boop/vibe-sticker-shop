"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const mobileSearchWrapperRef = useRef(null);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Debounced instant search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=6`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.results || []);
          setSearchLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setSearchLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktop = desktopDropdownRef.current?.contains(e.target);
      const inMobile = mobileDropdownRef.current?.contains(e.target);
      const inInput = searchRef.current?.contains(e.target);
      const inMobileWrapper = mobileSearchWrapperRef.current?.contains(e.target);
      if (!inDesktop && !inMobile && !inInput && !inMobileWrapper) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleResultClick = useCallback((category, slug) => {
    router.push(`/shop/${category}/${slug}`);
    clearSearch();
  }, [router, clearSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}`;
      clearSearch();
    }
  };

  // Reusable search dropdown renderer
  const renderSearchDropdown = (refProp) => {
    if (searchQuery.trim().length < 2) return null;
    if (!searchResults.length && !searchLoading) return null;
    return (
      <div
        ref={refProp}
        className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
      >
        {searchLoading ? (
          <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
        ) : (
          <>
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleResultClick(item.category, item.slug)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
              >
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.imageAlt || item.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 truncate">{item.category}</p>
                </div>
                {item.price != null && (
                  <span className="shrink-0 text-sm font-medium text-gray-700">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                )}
              </button>
            ))}
            <Link
              href={`/shop?q=${encodeURIComponent(searchQuery.trim())}`}
              onClick={clearSearch}
              className="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              View all results
            </Link>
          </>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-[50] w-full border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="La Lunar Printing" width={32} height={32} className="h-8 w-8" priority />
          <div className="hidden sm:block">
            <span className="block text-sm font-semibold uppercase tracking-[0.3em] text-gray-900 leading-tight">La Lunar</span>
            <span className="block text-[8px] font-medium uppercase tracking-[0.25em] text-gray-400 leading-tight">Printing Inc.</span>
          </div>
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

          {/* Solutions dropdown */}
          <div className="relative group">
            <Link href="/ideas" className="transition-colors duration-200 hover:text-gray-900">
              {t("nav.solutions")}
            </Link>
            <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="min-w-[200px] rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                {USE_CASES.map((uc) => (
                  <Link
                    key={uc.slug}
                    href={`/ideas/${uc.slug}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span>{uc.icon}</span>
                    <span>{t(`useCase.${uc.slug}.title`)}</span>
                  </Link>
                ))}
                <div className="mt-1 border-t border-gray-100 pt-1">
                  <Link
                    href="/ideas"
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    {t("ideas.viewAll")}
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link href="/about" className="transition-colors duration-200 hover:text-gray-900">{t("nav.about")}</Link>
          <Link href="/contact" className="transition-colors duration-200 hover:text-gray-900">{t("nav.contact")}</Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Desktop search */}
          <div className="relative hidden md:flex items-center">
            {searchOpen ? (
              <>
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("nav.searchPlaceholder")}
                    className="w-48 rounded-full border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                    onBlur={() => { if (!searchQuery && !searchResults.length) setSearchOpen(false); }}
                  />
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-700 text-sm"
                  >
                    &times;
                  </button>
                </form>
                {renderSearchDropdown(desktopDropdownRef)}
              </>
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

          {/* Get a Quote CTA */}
          <Link
            href="/quote"
            className="hidden md:inline-flex rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-black"
          >
            {t("nav.getQuote")}
          </Link>

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

          {/* Mobile account icon */}
          {!authLoading && (
            <Link
              href={authUser ? "/account" : "/login"}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors"
              aria-label={authUser ? t("nav.account") : t("nav.login")}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </Link>
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

      {/* Mobile search bar — full width (nav links already in MobileBottomNav) */}
      <div className="px-4 pb-2 md:hidden">
        <div ref={mobileSearchWrapperRef} className="relative">
          <form onSubmit={handleSearch}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-sm outline-none focus:border-gray-400 focus:bg-white"
            />
          </form>
          {renderSearchDropdown(mobileDropdownRef)}
        </div>
      </div>
      {/* Mobile category chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden scrollbar-hide">
        <Link
          href="/quote"
          className="shrink-0 rounded-full bg-gray-900 px-3 py-1 text-[11px] font-semibold text-white whitespace-nowrap"
        >
          {t("nav.getQuote")}
        </Link>
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
