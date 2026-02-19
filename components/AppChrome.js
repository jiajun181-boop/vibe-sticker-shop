"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PromoBar from "@/components/home/PromoBar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function AppChrome({ children, catalogConfig, locale }) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname.startsWith("/admin");
  const isQuoteRoute = pathname.startsWith("/quote");
  const isShopRoute = pathname.startsWith("/shop");
  const isProductDetailRoute = /^\/shop\/[^/]+\/[^/]+$/.test(pathname);
  const showFloatingQuote = !isQuoteRoute && (!isShopRoute || isProductDetailRoute);

  if (isAdminRoute) {
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
          className="fixed bottom-20 right-4 z-40 hidden rounded-xl bg-[var(--color-ink-black)] px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-black md:inline-flex"
        >
          Online Quote
        </Link>
      )}
      <MobileBottomNav catalogConfig={catalogConfig} />
      <Footer locale={locale} />
    </>
  );
}
