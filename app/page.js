import Link from "next/link";
// 👇 改成相对路径 "../"
import { PRODUCTS } from "../config/products"; 
import TestCartButton from "../components/cart/TestCartButton"; 

export default function HomePage() {
  // 1. 自动把产品按类别分组
  const stickers = PRODUCTS.filter((p) => p.category === "stickers");
  const signs = PRODUCTS.filter((p) => p.category === "signs");

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 relative">
      {/* ⚠️ 测试按钮 (悬浮在右下角) */}
      <TestCartButton />

      {/* 顶部 Hero 区域 */}
      <div className="bg-black text-white pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
            Toronto Printing Shop
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            PRINT. <span className="text-gray-500">SHIP.</span> DONE.
          </h1>
          <p className="text-gray-400 max-w-xl text-lg">
            The easiest way to order custom stickers & signs in the GTA. 
            Industrial quality, factory direct pricing.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        
        {/* --- 分区 1: Stickers --- */}
        <section className="mb-16">
          <div className="flex items-end gap-4 mb-8">
            <h2 className="text-3xl font-black tracking-tight">Stickers & Labels</h2>
            <div className="h-px bg-gray-200 flex-1 mb-2"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stickers.map((product) => (
              <ProductCard key={product.product} item={product} />
            ))}
          </div>
        </section>

        {/* --- 分区 2: Signs --- */}
        <section>
          <div className="flex items-end gap-4 mb-8">
            <h2 className="text-3xl font-black tracking-tight">Rigid Signs & Banners</h2>
            <div className="h-px bg-gray-200 flex-1 mb-2"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {signs.map((product) => (
              <ProductCard key={product.product} item={product} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

// 📦 小组件：产品卡片
function ProductCard({ item }) {
  const startPrice = item.config?.minimumPrice || 0;
  
  return (
    <Link 
      href={`/shop/${item.category}/${item.product}`}
      className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
    >
      <div className="space-y-4">
        <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-500">
          {item.category === 'stickers' ? '✨' : '🪧'}
        </div>
        
        <div>
          <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-blue-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          From
        </div>
        <div className="text-sm font-black">
          ${startPrice}
        </div>
      </div>
    </Link>
  );
}