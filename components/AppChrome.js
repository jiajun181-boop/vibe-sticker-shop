"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PromoBar from "@/components/home/PromoBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import FloatingContactButton from "@/components/FloatingContactButton";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function AppChrome({ children, catalogConfig, locale }) {
  const { t } = useTranslation();
  const pathname = usePathname() || "";
  const isAdminRoute = pathname.startsWith("/admin");
  const isDesignRoute = pathname.startsWith("/design");
  const isQuoteRoute = pathname.startsWith("/quote");
  const isShopRoute = pathname.startsWith("/shop");
  const isProductDetailRoute = /^\/shop\/[^/]+\/[^/]+$/.test(pathname);
  const isOrderRoute = pathname.startsWith("/order");
  // Keep desktop floating quote CTA only on high-intent product detail pages.
  // It looked like an unexplained "black box" on content/home pages.
  const showFloatingQuote = !isQuoteRoute && isProductDetailRoute;
  // Hide FloatingContactButton on product/configurator pages — ChatWidget is the single entry
  const showFloatingContact = !isOrderRoute && !isProductDetailRoute;

  // Design studio is a full-screen editor — no header/footer/nav
  if (isAdminRoute || isDesignRoute) {
    return <div id="main-content" className="min-h-screen">{children}</div>;
  }

  return (
    <>
      <PromoBar />
      <Navbar catalogConfig={catalogConfig} />
      <div id="main-content" className="min-h-screen">
        {children}
      </div>
      {showFloatingQuote && (
        <Link
          href="/quote"
          className="fixed bottom-36 right-4 z-40 hidden items-center rounded-xl bg-[var(--color-ink-black)] px-4 py-2 text-xs font-semibold text-[#fff] shadow-lg transition-colors hover:bg-black md:inline-flex md:right-6 whitespace-nowrap"
        >
          {t("nav.getQuote")}
        </Link>
      )}
      {showFloatingContact && <FloatingContactButton />}
      <ExitIntentPopup />
      <MobileBottomNav catalogConfig={catalogConfig} />
      <Footer locale={locale} />
    </>
  );
}
