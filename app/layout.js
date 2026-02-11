import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/Toast";
import PromoBar from "@/components/home/PromoBar";
import { getServerLocale } from "@/lib/i18n/server";
import Analytics from "@/components/Analytics";
import SkipLink from "@/components/SkipLink";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import AuthInit from "@/components/AuthInit";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const title = locale === "zh"
    ? "Vibe Sticker Shop - 定制印刷与车辆图形"
    : "Vibe Sticker Shop - Custom Printing & Vehicle Graphics";
  const description = locale === "zh"
    ? "安大略省专业定制印刷服务，涵盖车队合规、车辆图形和商业标牌。"
    : "Professional custom printing for fleet compliance, vehicle graphics, and business signage in Ontario, Canada.";

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: "Vibe Sticker Shop",
      locale: locale === "zh" ? "zh_CN" : "en_CA",
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Vibe Sticker Shop" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    manifest: "/manifest.json",
  };
}

export default async function RootLayout({ children }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body className="antialiased">
        <SkipLink />
        <PromoBar />
        <Navbar />
        <div id="main-content" className="min-h-screen">{children}</div>
        <Footer locale={locale} />
        <CartDrawer />
        <Toaster />
        <ExitIntentPopup />
        <AuthInit />
        <Analytics />
      </body>
    </html>
  );
}
