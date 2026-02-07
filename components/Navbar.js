import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* 左侧 Logo */}
        <Link href="/" className="text-2xl font-black tracking-tighter hover:opacity-70 transition-opacity">
          VIBE<span className="text-blue-600">.</span>
        </Link>

        {/* 中间导航 (桌面端显示) */}
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <Link href="/shop/stickers/die-cut-singles" className="hover:text-black transition-colors">Stickers</Link>
          <Link href="/shop/signs/coroplast-yard-signs" className="hover:text-black transition-colors">Signs</Link>
          <Link href="/shop/signs/vinyl-banner-13oz" className="hover:text-black transition-colors">Banners</Link>
        </div>

        {/* 右侧购物车 */}
        <div className="flex items-center gap-4">
          <button className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-all flex items-center gap-2">
            <span>Cart</span>
            <span className="bg-white text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px]">0</span>
          </button>
        </div>
      </div>
    </nav>
  );
}