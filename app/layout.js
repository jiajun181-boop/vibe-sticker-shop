import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/Toast";
import PromoBar from "@/components/home/PromoBar";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const locale = await getServerLocale();
  return {
    title: locale === "zh"
      ? "Vibe Sticker Shop - 定制印刷与车辆图形"
      : "Vibe Sticker Shop - Custom Printing & Vehicle Graphics",
    description: locale === "zh"
      ? "安大略省专业定制印刷服务，涵盖车队合规、车辆图形和商业标牌。"
      : "Professional custom printing for fleet compliance, vehicle graphics, and business signage in Ontario, Canada.",
  };
}

export default async function RootLayout({ children }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body className="antialiased">
        <PromoBar />
        <Navbar />
        <div className="min-h-screen">{children}</div>
        <Footer locale={locale} />
        <CartDrawer />
        <Toaster />
      </body>
    </html>
  );
}
