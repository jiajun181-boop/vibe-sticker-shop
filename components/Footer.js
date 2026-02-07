import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-20 pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* 品牌列 */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <div className="text-3xl font-black tracking-tighter">
            VIBE<span className="text-blue-500">.</span>
          </div>
          <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
            Proudly printed in Toronto, Canada. <br/>
            Premium quality stickers & signs for brands that care about details.
          </p>
        </div>

        {/* 链接列 1 */}
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-gray-500">Shop</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/shop/stickers/die-cut-singles" className="hover:text-white">Die-Cut Stickers</Link></li>
            <li><Link href="/shop/signs/coroplast-yard-signs" className="hover:text-white">Yard Signs</Link></li>
            <li><Link href="/shop/signs/vinyl-banner-13oz" className="hover:text-white">Vinyl Banners</Link></li>
          </ul>
        </div>

        {/* 链接列 2 */}
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-gray-500">Support</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><span className="text-gray-500 cursor-not-allowed">Contact Us</span></li>
            <li><span className="text-gray-500 cursor-not-allowed">FAQ</span></li>
          </ul>
        </div>
      </div>

      {/* 底部版权 */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vibe Printing Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}