import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// 加载一个好看的 Google 字体
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vibe Printing | Custom Stickers & Signs in Toronto",
  description: "High quality custom printing. Fast turnaround. Made in GTA.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#fafafa]`}>
        {/* 1. 顶部导航栏 */}
        <Navbar />
        
        {/* 2. 主体内容区 (会自动填充页面内容) */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* 3. 底部页脚 */}
        <Footer />
      </body>
    </html>
  );
}