import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import Toast from "@/components/Toast";
import PromoBar from "@/components/home/PromoBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vibe Printing | Custom Stickers, Signs & Display Stands in Toronto",
  description: "Toronto's #1 custom printing shop. Banner stands, vehicle graphics, fleet compliance decals, safety labels. Same-day production. Factory direct pricing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#fafafa]`}>
        <CartDrawer />
        <Toast />
        <PromoBar />
        <Navbar />

        <main className="flex-grow">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
