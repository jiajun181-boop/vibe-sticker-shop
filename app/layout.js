import './globals.css'
import "@uploadthing/react/styles.css";
import { Inter } from 'next/font/google'
import Link from 'next/link' // 引入 Link 组件实现无刷新跳转

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Vibe Sticker Shop',
  description: 'Premium Custom Stickers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        {/* === 商城顶栏 (Header) === */}
        <nav className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo - 点击回首页 */}
            <Link href="/" className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 cursor-pointer hover:opacity-80 transition-opacity">
              VIBE.
            </Link>

            {/* 菜单链接 */}
            <div className="hidden md:flex gap-8 text-sm font-bold text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">ORDER</Link>
              <Link href="/about" className="hover:text-white transition-colors">ABOUT US</Link>
            </div>

            {/* 购物车图标 */}
            <button className="relative group">
              <span className="text-gray-300 hover:text-white font-bold transition-colors border border-white/20 px-4 py-2 rounded-full text-xs">
                CART (0)
              </span>
            </button>
          </div>
        </nav>

        {/* === 这里是页面内容变换的地方 === */}
        {children}

        {/* === 商城页脚 (Footer) === */}
        <footer className="border-t border-white/10 py-12 mt-20 bg-neutral-900/30">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
            <h3 className="text-white font-bold mb-4 text-lg">VIBE STICKERS</h3>
            <p className="mb-8">Premium quality, waterproof, custom die-cut stickers.</p>
            <div className="text-xs text-gray-700">
              © 2026 Vibe Sticker Shop. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
