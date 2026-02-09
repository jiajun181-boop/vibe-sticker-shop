import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/Toast";
import PromoBar from "@/components/home/PromoBar";

export const metadata = {
  title: "Vibe Sticker Shop - Custom Printing & Vehicle Graphics",
  description:
    "Professional custom printing for fleet compliance, vehicle graphics, and business signage in Ontario, Canada.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PromoBar />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CartDrawer />
        <Toaster />
      </body>
    </html>
  );
}
