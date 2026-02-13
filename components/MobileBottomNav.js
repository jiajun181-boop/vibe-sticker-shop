"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { CATALOG_DEFAULTS } from "@/lib/catalogConfig";

const { departments, departmentMeta, categoryMeta } = CATALOG_DEFAULTS;

/* ── Icons (inline SVG for zero deps) ─────────────────────────── */

function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ShopIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function BagIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}


/* ── Category Drawer ──────────────────────────────────────────── */

function CategoryDrawer({ open, onClose }) {
  const { t } = useTranslation();

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-[61] w-72 bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900">
            {t("nav.categories")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category list */}
        <nav className="overflow-y-auto h-[calc(100%-60px)] pb-24">
          {departments.map((dept) => {
            const dMeta = departmentMeta[dept.key];
            return (
              <div key={dept.key} className="border-b border-gray-50">
                <p className="px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {dMeta?.title || dept.key}
                </p>
                {dept.categories.map((catSlug) => {
                  const cMeta = categoryMeta[catSlug];
                  return (
                    <Link
                      key={catSlug}
                      href={cMeta?.href || `/shop/${catSlug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
                    >
                      <span className="text-base">{cMeta?.icon || ""}</span>
                      <span>{cMeta?.title || catSlug}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* Bottom links */}
          <div className="px-5 pt-4 pb-2 space-y-1">
            <Link href="/shop" onClick={onClose} className="block rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t("shop.backToCategories")}
            </Link>
            <Link href="/contact" onClick={onClose} className="block rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t("nav.contact")}
            </Link>
            <Link href="/faq" onClick={onClose} className="block rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t("nav.faq")}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

/* ── Bottom Nav ───────────────────────────────────────────────── */

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const storeCount = useCartStore((s) => s.getCartCount());
  const openCart = useCartStore((s) => s.openCart);
  const authUser = useAuthStore((s) => s.user);

  const [cartCount, setCartCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setCartCount(storeCount);
  }, [storeCount]);

  // Close drawers on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const tabs = [
    {
      key: "home",
      label: t("mobileNav.home"),
      icon: HomeIcon,
      href: "/",
    },
    {
      key: "categories",
      label: t("mobileNav.categories"),
      icon: GridIcon,
      action: () => setDrawerOpen(true),
    },
    {
      key: "shop",
      label: t("mobileNav.shop"),
      icon: ShopIcon,
      href: "/shop",
    },
    {
      key: "account",
      label: authUser ? t("mobileNav.account") : t("mobileNav.login"),
      icon: UserIcon,
      href: authUser ? "/account" : "/login",
    },
    {
      key: "cart",
      label: t("mobileNav.cart"),
      icon: BagIcon,
      action: () => openCart(),
      badge: cartCount,
    },
  ];

  return (
    <>
      <CategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Spacer so content isn't hidden behind the fixed nav */}
      <div className="h-16 md:hidden" />

      <nav className="fixed bottom-0 left-0 right-0 z-[50] border-t border-gray-200 bg-white/95 backdrop-blur md:hidden pb-safe">
        <div className="flex items-center justify-around px-1 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.href ? isActive(tab.href) : false;

            const content = (
              <div className="flex flex-col items-center gap-0.5 relative">
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? "text-gray-900" : "text-gray-400"}`} />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] leading-tight ${active ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                  {tab.label}
                </span>
              </div>
            );

            if (tab.action) {
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={tab.action}
                  className="flex-1 flex items-center justify-center py-1 transition-colors"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className="flex-1 flex items-center justify-center py-1 transition-colors"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
