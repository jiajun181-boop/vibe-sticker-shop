import Link from "next/link";
// 👇 修复点：把 @ 改成了 .. (物理路径)
import { PRODUCTS } from "../config/products";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tighter">VIBE.</div>
          <div className="text-sm font-medium text-gray-500">Professional Printing Service</div>
        </div>
      </header>

      {/* Hero 区域 */}
      <div className="bg-black text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Print Anything, <br/> Anywhere.
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            High quality stickers, banners, and signs directly from the factory.
          </p>
        </div>
      </div>

      {/* 产品列表区 */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">Featured Products</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => (
            <Link 
              key={product.product} 
              href={`/shop/${product.category}/${product.product}`}
              className="group block bg-white rounded-2xl border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-500">
                {/* 根据不同品类显示不同 emoji 图标 */}
                {product.category === 'stickers' ? '🏷️' : 
                 product.category === 'banners' ? '🚩' : 
                 product.category === 'signs' ? '🪧' : '📦'}
              </div>
              <div className="p-6">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                  {product.category}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  Start from ${product.config.minimumPrice}. Professional grade quality.
                </p>
                <div className="mt-4 font-medium text-sm flex items-center text-gray-900 group-hover:underline">
                  Configure Now &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-center text-sm">
        <p>&copy; 2026 Vibe Sticker Shop. All rights reserved.</p>
      </footer>
    </div>
  );
}