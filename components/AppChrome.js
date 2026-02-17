"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PromoBar from "@/components/home/PromoBar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function AppChrome({ children, catalogConfig, locale }) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname.startsWith("/admin");

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
      <MobileBottomNav catalogConfig={catalogConfig} />
      <Footer locale={locale} />
    </>
  );
}
