import "./globals.css";
import { Poppins, EB_Garamond } from "next/font/google";
import CartDrawer from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/Toast";
import { getServerLocale } from "@/lib/i18n/server";
import { getCatalogConfig } from "@/lib/catalogConfig";
import Analytics from "@/components/Analytics";
import SkipLink from "@/components/SkipLink";
import AppChrome from "@/components/AppChrome";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-brand",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

import AuthInit from "@/components/AuthInit";
import ScrollToTop from "@/components/ScrollToTop";
import TawkToWidget from "@/components/TawkToWidget";
import HreflangTags from "@/components/HreflangTags";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const title = locale === "zh"
    ? "La Lunar Printing Inc. - 定制印刷与车辆图形"
    : "La Lunar Printing Inc. - Custom Printing & Vehicle Graphics";
  const description = locale === "zh"
    ? "安大略省专业定制印刷服务，涵盖车队合规、车辆图形和商业标牌。"
    : "Professional custom printing for fleet compliance, vehicle graphics, and business signage in Ontario, Canada.";

  return {
    title: {
      default: title,
      template: "%s | La Lunar Printing Inc.",
    },
    description,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: "La Lunar Printing Inc.",
      locale: locale === "zh" ? "zh_CN" : "en_CA",
      type: "website",
      images: [{ url: "/logo-social.png", width: 1200, height: 630, alt: "La Lunar Printing Inc." }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo-social.png"],
    },
    manifest: "/manifest.json",
  };
}

export default async function RootLayout({ children }) {
  const [locale, catalogConfig] = await Promise.all([
    getServerLocale(),
    getCatalogConfig(),
  ]);
  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <HreflangTags />
      </head>
      <body className={`${poppins.variable} ${ebGaramond.variable} antialiased`}>
        <SkipLink />
        <AppChrome catalogConfig={catalogConfig} locale={locale}>
          {children}
        </AppChrome>
        <CartDrawer />
        <Toaster />
        <ScrollToTop />

        <AuthInit />
        <Analytics />
        <TawkToWidget />
        <PushNotificationPrompt />
      </body>
    </html>
  );
}
