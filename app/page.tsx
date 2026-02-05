"use client";
import { useState } from 'react';

export default function Home() {
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(3);
  const [quantity, setQuantity] = useState(50);
  const [loading, setLoading] = useState(false);

  // 简单的报价公式：面积 * 单价 (这里假设 $0.15/sq inch)
  const calculatePrice = () => {
    const area = width * height;
    let price = area * 0.15 * quantity; 
    if (price < 30) price = 30; // 最低起做 $30
    return price.toFixed(2);
  };

  const handleCheckout = async () => {
    setLoading(true);
    // 这里先模拟一下，后面我们会接真的 Stripe
    alert("正在跳转支付... (Stripe API 即将接入)");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans selection:bg-purple-500 selection:text-white">
      {/* 背景光晕 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/30 blur-[120px]"></div>
      </div>

      <main className="w-full max-w-lg p-6">
        <h1 className="text-5xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-tighter">
          VIBE STICKERS
        </h1>
        <p className="text-gray-400 text-center mb-10 text-sm tracking-widest uppercase">Premium Custom Prints</p>

        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl shadow-purple-900/20">
          {/* 尺寸输入 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Width (in)</label>
              <input 
                type="number" value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xl font-bold focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Height (in)</label>
              <input 
                type="number" value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xl font-bold focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* 数量滑块 */}
          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Quantity: {quantity}</label>
            <input 
              type="range" min="10" max="1000" step="10"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
            />
          </div>

          {/* 价格与按钮 */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex justify-between items-end mb-6">
              <span className="text-gray-400">Estimated Total</span>
              <span className="text-4xl font-black text-white tracking-tight">${calculatePrice()}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-purple-400 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {loading ? "Processing..." : "Pay Now →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
