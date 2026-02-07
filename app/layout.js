import { Inter } from "next/font/google";
import "./globals.css";
// 👇 改回了相对路径 "../"
import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer"; 
import CartDrawer from "../components/cart/CartDrawer"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vibe Printing | Custom Stickers & Signs in Toronto",
  description: "High quality custom printing. Fast turnaround. Made in GTA.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#fafafa]`}>
        <CartDrawer />
        
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}