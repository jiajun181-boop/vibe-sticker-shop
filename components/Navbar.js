"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { USE_CASES } from "@/lib/useCases";

export default function Navbar({ catalogConfig }) {
  const { departments, departmentMeta, categoryMeta } = catalogConfig || {};
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
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const safeDepartments = departments || [];
  const [activeShopDept, setActiveShopDept] = useState(safeDepartments[0]?.key || "");

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!safeDepartments.length) {
      setActiveShopDept("");
      return;
    }
    if (!safeDepartments.some((d) => d.key === activeShopDept)) {
      setActiveShopDept(safeDepartments[0].key);
    }
  }, [safeDepartments, activeShopDept]);

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
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      clearSearch();
    }
  };

  const activeDept =
    safeDepartments.find((dept) => dept.key === activeShopDept) || safeDepartments[0] || null;
  const activeCategories = activeDept?.categories || [];
  const featuredCategorySlug = activeCategories[0];
  const featuredCategoryMeta = featuredCategorySlug ? categoryMeta?.[featuredCategorySlug] : null;
  const getCategoryImage = useCallback(
    (catSlug) => {
      const cMeta = categoryMeta?.[catSlug];
      const label = cMeta?.title || catSlug;
      return `/api/product-image/${encodeURIComponent(catSlug)}?name=${encodeURIComponent(label)}&category=${encodeURIComponent(catSlug)}`;
    },
    [categoryMeta],
  );

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
          <div className="px-4 py-3 text-sm text-[var(--color-gray-400)]">{t("search.loading")}</div>
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
                  <p className="text-sm font-semibold text-[var(--color-gray-800)] truncate">{item.name}</p>
                  <p className="text-xs text-[var(--color-gray-400)] truncate">{item.category}</p>
                </div>
                {item.price != null && (
                  <span className="shrink-0 text-sm font-medium text-[var(--color-gray-700)]">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                )}
              </button>
            ))}
            <Link
              href={`/shop?q=${encodeURIComponent(searchQuery.trim())}`}
              onClick={clearSearch}
              className="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:bg-gray-50 hover:text-[var(--color-gray-800)]"
            >
              {t("search.viewAll")}
            </Link>
          </>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-[50] w-full border-b border-[var(--color-gray-200)] bg-[var(--color-paper-white)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-lunarprint.png" alt="La Lunar Printing" width={32} height={32} className="h-8 w-8" priority />
          <div className="hidden sm:block">
            <span className="block text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-gray-800)] leading-tight">La Lunar</span>
            <span className="block text-[8px] font-medium uppercase tracking-[0.25em] text-[var(--color-gray-400)] leading-tight">Printing Inc.</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--color-gray-600)] md:flex">
          <Link href="/" className="transition-colors duration-200 hover:text-[var(--color-gray-800)]">{t("nav.home")}</Link>

          {/* Shop mega-menu dropdown */}
          <div
            className="relative"
            onMouseEnter={() => {
              setShopMenuOpen(true);
              if (!activeShopDept && safeDepartments[0]?.key) {
                setActiveShopDept(safeDepartments[0].key);
              }
            }}
            onMouseLeave={() => setShopMenuOpen(false)}
          >
            <Link href="/shop" className="transition-colors duration-200 hover:text-[var(--color-gray-800)]" aria-expanded={shopMenuOpen}>
              {t("nav.shop")}
            </Link>
            <div className={`absolute left-1/2 top-full z-40 w-[940px] -translate-x-1/2 pt-2 transition-all duration-200 ${shopMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="grid grid-cols-[220px_1fr]">
                  <div className="border-r border-gray-100 bg-gray-50/70 p-3">
                    <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-400)]">
                      Departments
                    </p>
                    <div className="space-y-1">
                      {safeDepartments.map((dept) => {
                        const selected = dept.key === activeDept?.key;
                        return (
                          <button
                            key={dept.key}
                            type="button"
                            onMouseEnter={() => setActiveShopDept(dept.key)}
                            onFocus={() => setActiveShopDept(dept.key)}
                            className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${selected ? "bg-white font-semibold text-[var(--color-gray-800)] shadow-sm ring-1 ring-gray-200" : "text-[var(--color-gray-600)] hover:bg-white hover:text-[var(--color-gray-800)]"}`}
                          >
                            {departmentMeta?.[dept.key]?.title || dept.key}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-3 grid grid-cols-[1fr_auto] gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href="/quote" className="btn-primary-pill px-3 py-1.5 text-[10px]">
                          {t("nav.getQuote")}
                        </Link>
                        <Link href="/shop" className="btn-secondary-pill px-3 py-1.5 text-[10px]">
                          {t("nav.shopAll")}
                        </Link>
                        <Link href="/contact" className="btn-secondary-pill px-3 py-1.5 text-[10px]">
                          {t("nav.contact")}
                        </Link>
                      </div>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1 self-start rounded-full border border-[var(--color-gray-300)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] hover:border-[var(--color-moon-blue)] hover:text-[var(--color-moon-blue)]"
                      >
                        Explore All
                      </Link>
                    </div>
                    <div className="grid grid-cols-[1fr_220px] gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        {activeCategories.slice(0, 8).map((catSlug) => {
                          const cMeta = categoryMeta?.[catSlug];
                          return (
                            <div key={catSlug} className="rounded-xl border border-gray-100 p-3">
                              <Link href={`/shop/${catSlug}`} className="mb-2 block overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                <Image
                                  src={getCategoryImage(catSlug)}
                                  alt={cMeta?.title || catSlug}
                                  width={360}
                                  height={140}
                                  className="h-20 w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                                />
                              </Link>
                              <Link href={`/shop/${catSlug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-gray-800)] hover:text-black">
                                <span>{cMeta?.icon || ""}</span>
                                <span>{cMeta?.title || catSlug}</span>
                              </Link>
                              <div className="mt-2 space-y-1">
                                {(cMeta?.subGroups || []).slice(0, 4).map((sg) => (
                                  <Link key={sg.slug} href={sg.href} className="block rounded-md px-1 py-0.5 text-xs text-[var(--color-gray-600)] hover:bg-gray-50 hover:text-[var(--color-gray-800)]">
                                    {sg.title}
                                  </Link>
                                ))}
                              </div>
                              <Link href={`/shop/${catSlug}`} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]">
                                {t("nav.allIn", { category: cMeta?.title || catSlug })} &rarr;
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                      <div className="rounded-xl border border-[var(--color-gray-200)] bg-gradient-to-b from-[var(--color-paper-cream)] to-white p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gray-400)]">
                          Featured
                        </p>
                        <Link href={featuredCategorySlug ? `/shop/${featuredCategorySlug}` : "/shop"} className="mt-2 block overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                          <Image
                            src={getCategoryImage(featuredCategorySlug || "shop")}
                            alt={featuredCategoryMeta?.title || "Featured category"}
                            width={260}
                            height={160}
                            className="h-24 w-full object-cover"
                          />
                        </Link>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-gray-800)]">
                          {featuredCategoryMeta?.title || "Shop by category"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                          {featuredCategoryMeta?.subGroups?.[0]?.title || "Fast turnaround and business-ready print quality."}
                        </p>
                        <Link
                          href={featuredCategorySlug ? `/shop/${featuredCategorySlug}` : "/shop"}
                          className="mt-3 inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold text-[var(--color-gray-700)] hover:border-gray-900 hover:text-[var(--color-gray-800)]"
                        >
                          View Category
                        </Link>
                        <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
                          <Link href="/faq" className="block text-xs text-[var(--color-gray-600)] hover:text-[var(--color-gray-800)]">
                            {t("nav.faq")}
                          </Link>
                          <Link href="/about" className="block text-xs text-[var(--color-gray-600)] hover:text-[var(--color-gray-800)]">
                            {t("nav.about")}
                          </Link>
                          <Link href="/ideas" className="block text-xs text-[var(--color-gray-600)] hover:text-[var(--color-gray-800)]">
                            {t("nav.solutions")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Solutions dropdown */}
          <div className="relative group">
            <Link href="/ideas" className="transition-colors duration-200 hover:text-[var(--color-gray-800)]">
              {t("nav.solutions")}
            </Link>
            <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="min-w-[200px] rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-paper-white)] p-2 shadow-xl">
                {USE_CASES.map((uc) => (
                  <Link
                    key={uc.slug}
                    href={`/ideas/${uc.slug}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-gray-700)] transition-colors hover:bg-gray-50"
                  >
                    <span>{uc.icon}</span>
                    <span>{t(`useCase.${uc.slug}.title`)}</span>
                  </Link>
                ))}
                <div className="mt-1 border-t border-gray-100 pt-1">
                  <Link
                    href="/ideas"
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-gray-600)] hover:text-[var(--color-gray-800)] hover:bg-gray-50 transition-colors"
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

          <Link href="/about" className="transition-colors duration-200 hover:text-[var(--color-gray-800)]">{t("nav.about")}</Link>
          <Link href="/contact" className="transition-colors duration-200 hover:text-[var(--color-gray-800)]">{t("nav.contact")}</Link>
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
                    className="w-48 rounded-full border border-[var(--color-gray-300)] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-moon-blue)]"
                    onBlur={() => { if (!searchQuery && !searchResults.length) setSearchOpen(false); }}
                  />
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)] text-sm"
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
                className="p-2 text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)] transition-colors"
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
              className="rounded-full border border-[var(--color-gray-300)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-moon-blue)] hover:text-[var(--color-moon-blue)]"
              aria-label="Switch language"
            >
              {locale === "en" ? "ä¸­æ–‡" : "EN"}
            </button>
          )}

          {/* Get a Quote CTA */}
          <Link
            href="/quote"
            className="btn-primary-pill hidden md:inline-flex px-4 py-1.5 text-xs"
          >
            {t("nav.getQuote")}
          </Link>

          {!authLoading && (
            authUser ? (
              <Link
                href="/account"
                className="hidden md:inline-flex rounded-full border border-[var(--color-gray-300)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-moon-blue)] hover:text-[var(--color-moon-blue)]"
              >
                {t("nav.account")}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex rounded-full border border-[var(--color-gray-300)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-moon-blue)] hover:text-[var(--color-moon-blue)]"
              >
                {t("nav.login")}
              </Link>
            )
          )}

          {/* Mobile account icon */}
          {!authLoading && (
            <Link
              href={authUser ? "/account" : "/login"}
              className="md:hidden p-2 text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)] transition-colors"
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
            className="relative flex items-center gap-2 rounded-full border border-[var(--color-gray-300)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-800)] transition-colors duration-200 hover:border-[var(--color-moon-blue)]"
          >
            <span>{t("nav.cart")}</span>
            <span
              key={cartCount}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-moon-blue)] text-[10px] font-semibold text-white cart-badge-bounce"
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile search bar â€” full width (nav links already in MobileBottomNav) */}
      <div className="px-4 pb-2 md:hidden">
        <div ref={mobileSearchWrapperRef} className="relative">
          <form onSubmit={handleSearch}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-gray-400)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full rounded-full border border-[var(--color-gray-300)] bg-[var(--color-paper-cream)] pl-9 pr-4 py-2 text-sm outline-none focus:border-[var(--color-moon-blue)] focus:bg-white"
            />
          </form>
          {renderSearchDropdown(mobileDropdownRef)}
        </div>
      </div>
      {/* Mobile quick actions â€” single CTA, categories via bottom nav drawer */}
      <div className="flex gap-2 px-4 pb-3 md:hidden">
        <Link
          href="/quote"
          className="btn-primary-pill shrink-0 px-3 py-1 text-[11px] whitespace-nowrap"
        >
          {t("nav.getQuote")}
        </Link>
      </div>
    </header>
  );
}


