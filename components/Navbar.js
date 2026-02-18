"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const navRef = useRef(null);
  const mobileSearchWrapperRef = useRef(null);
  const shopMenuWrapperRef = useRef(null);
  const shopTriggerRef = useRef(null);
  const shopOpenTimerRef = useRef(null);
  const shopCloseTimerRef = useRef(null);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const safeDepartments = useMemo(() => departments || [], [departments]);
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

  const clearShopMenuTimers = useCallback(() => {
    if (shopOpenTimerRef.current) {
      clearTimeout(shopOpenTimerRef.current);
      shopOpenTimerRef.current = null;
    }
    if (shopCloseTimerRef.current) {
      clearTimeout(shopCloseTimerRef.current);
      shopCloseTimerRef.current = null;
    }
  }, []);

  const openShopMenu = useCallback((delay = 80) => {
    clearShopMenuTimers();
    shopOpenTimerRef.current = setTimeout(() => {
      setShopMenuOpen(true);
      if (!activeShopDept && safeDepartments[0]?.key) {
        setActiveShopDept(safeDepartments[0].key);
      }
    }, delay);
  }, [activeShopDept, safeDepartments, clearShopMenuTimers]);

  const closeShopMenu = useCallback((delay = 120) => {
    clearShopMenuTimers();
    shopCloseTimerRef.current = setTimeout(() => {
      setShopMenuOpen(false);
    }, delay);
  }, [clearShopMenuTimers]);

  useEffect(() => {
    return () => clearShopMenuTimers();
  }, [clearShopMenuTimers]);

  useEffect(() => {
    const root = document.documentElement;
    const updateNavOffset = () => {
      const h = Math.ceil(navRef.current?.offsetHeight || 0);
      root.style.setProperty("--nav-offset", `${h}px`);
    };

    updateNavOffset();
    window.addEventListener("resize", updateNavOffset);

    let ro = null;
    if (typeof ResizeObserver !== "undefined" && navRef.current) {
      ro = new ResizeObserver(updateNavOffset);
      ro.observe(navRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateNavOffset);
      if (ro) ro.disconnect();
      root.style.setProperty("--nav-offset", "0px");
    };
  }, []);

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
  const activePrimaryHref = (() => {
    const firstCategory = activeCategories[0];
    if (!firstCategory) return "/shop";
    const firstSub = categoryMeta?.[firstCategory]?.subGroups?.[0];
    return firstSub?.href || `/shop/${firstCategory}`;
  })();
  // Reusable search dropdown renderer
  const renderSearchDropdown = (refProp) => {
    if (searchQuery.trim().length < 2) return null;
    if (!searchResults.length && !searchLoading) return null;
    return (
      <div
        ref={refProp}
        className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-[var(--color-gray-200)] bg-white shadow-lg overflow-hidden"
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
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-gray-50)]"
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
              className="block border-t border-[var(--color-gray-100)] px-4 py-2.5 text-center text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:bg-[var(--color-gray-50)] hover:text-[var(--color-gray-800)]"
            >
              {t("search.viewAll")}
            </Link>
          </>
        )}
      </div>
    );
  };

  return (
    <header
      ref={navRef}
      className="sticky top-[var(--promo-offset,0px)] z-[50] w-full border-b border-[var(--color-gray-200)] bg-[var(--color-paper-white)] backdrop-blur-none md:bg-[var(--color-paper-white)]/90 md:backdrop-blur-lg md:backdrop-saturate-150"
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-lunarprint.png" alt="La Lunar Printing" width={32} height={32} className="h-8 w-8" priority />
          <div className="hidden sm:block">
            <span className="block text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-gray-800)] leading-tight">La Lunar</span>
            <span className="block label-xs font-medium text-[var(--color-gray-400)] leading-tight tracking-[0.25em]">Printing Inc.</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--color-gray-600)] md:flex">
          <Link href="/" className="transition-colors duration-200 hover:text-[var(--color-gray-800)] border-b-2 border-transparent hover:border-[var(--color-moon-gold)] pb-0.5">{t("nav.home")}</Link>

          {/* Shop mega-menu dropdown */}
          <div
            ref={shopMenuWrapperRef}
            className="relative"
            onMouseEnter={() => openShopMenu(60)}
            onMouseLeave={() => closeShopMenu(150)}
            onFocusCapture={() => openShopMenu(0)}
            onBlurCapture={(e) => {
              const next = e.relatedTarget;
              if (!shopMenuWrapperRef.current?.contains(next)) {
                closeShopMenu(120);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                clearShopMenuTimers();
                setShopMenuOpen(false);
                shopTriggerRef.current?.focus();
                return;
              }
              if (e.key === "Enter" && shopMenuOpen) {
                e.preventDefault();
                router.push(activePrimaryHref);
                setShopMenuOpen(false);
                return;
              }
              if (!safeDepartments.length) return;
              if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
              e.preventDefault();
              setShopMenuOpen(true);
              const currentIndex = safeDepartments.findIndex((d) => d.key === activeShopDept);
              const fallbackIndex = currentIndex < 0 ? 0 : currentIndex;
              const nextIndex =
                e.key === "ArrowDown"
                  ? (fallbackIndex + 1) % safeDepartments.length
                  : (fallbackIndex - 1 + safeDepartments.length) % safeDepartments.length;
              setActiveShopDept(safeDepartments[nextIndex].key);
            }}
          >
            <Link
              ref={shopTriggerRef}
              href="/shop"
              className="transition-colors duration-200 hover:text-[var(--color-gray-800)]"
              aria-expanded={shopMenuOpen}
            >
              {t("nav.shop")}
            </Link>
            <div className={`absolute left-1/2 top-full z-40 w-[940px] -translate-x-1/2 pt-2 transition-all duration-200 ${shopMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
              <div className="overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-2xl">
                <div className="grid grid-cols-[220px_1fr]">
                  <div className="border-r border-[var(--color-gray-100)] bg-[var(--color-gray-50)]/70 p-3">
                    <p className="px-2 pb-2 label-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
                      {t("nav.departments")}
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
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href="/quote" className="btn-primary-pill px-3 py-1.5 label-xs">
                          {t("nav.getQuote")}
                        </Link>
                        <Link href="/shop" className="btn-secondary-pill px-3 py-1.5 label-xs">
                          {t("nav.shopAll")}
                        </Link>
                      </div>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-gray-300)] px-3 py-1 label-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] hover:border-[var(--color-gray-800)] hover:text-[var(--color-gray-800)]"
                      >
                        {t("nav.exploreAll")}
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {activeCategories.slice(0, 6).map((catSlug) => {
                        const cMeta = categoryMeta?.[catSlug];
                        return (
                          <div key={catSlug} className="rounded-xl border border-[var(--color-gray-100)] bg-white p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <Link href={`/shop/${catSlug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-gray-800)] hover:text-black">
                                <span>{cMeta?.icon || ""}</span>
                                <span>{cMeta?.title || catSlug}</span>
                              </Link>
                              <Link href={`/shop/${catSlug}`} className="text-[11px] font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]">
                                {t("nav.allIn", { category: cMeta?.title || catSlug })} &rarr;
                              </Link>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(cMeta?.subGroups || []).slice(0, 12).map((sg, idx) => (
                                <Link
                                  key={sg.slug}
                                  href={sg.href}
                                  className={`truncate rounded-md px-2 py-1 text-xs hover:bg-[var(--color-gray-50)] hover:text-[var(--color-gray-800)] ${
                                    idx === 0
                                      ? "bg-[var(--color-paper-cream)] text-[var(--color-gray-800)]"
                                      : "text-[var(--color-gray-600)]"
                                  }`}
                                >
                                  {sg.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
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
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)]"
                  >
                    <span>{uc.icon}</span>
                    <span>{t(`useCase.${uc.slug}.title`)}</span>
                  </Link>
                ))}
                <div className="mt-1 border-t border-[var(--color-gray-100)] pt-1">
                  <Link
                    href="/ideas"
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-gray-600)] hover:text-[var(--color-gray-800)] hover:bg-[var(--color-gray-50)] transition-colors"
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
                    className="w-48 rounded-xl border border-[var(--color-gray-300)] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-moon-blue)]"
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
              className="rounded-xl border border-[var(--color-gray-300)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-moon-blue)] hover:text-[var(--color-moon-blue)]"
              aria-label="Switch language"
            >
              {locale === "en" ? "中文" : "EN"}
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
                className="hidden md:inline-flex rounded-xl border border-[var(--color-gray-300)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-moon-blue)] hover:text-[var(--color-moon-blue)]"
              >
                {t("nav.account")}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex rounded-xl border border-[var(--color-gray-300)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-moon-blue)] hover:text-[var(--color-moon-blue)]"
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
            className="relative flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-800)] transition-colors duration-200 hover:border-[var(--color-moon-blue)]"
          >
            <span>{t("nav.cart")}</span>
            <span
              key={cartCount}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-moon-blue)] label-xs font-semibold text-white cart-badge-bounce"
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
    </header>
  );
}
