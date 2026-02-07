"use client";

import { useCartStore } from "../../app/store/useCartStore"; // 👈 确认路径指向 app/store
import Link from "next/link";

// ✅ 必须使用 export default
export default function CartDrawer() {
  const { isCartOpen, closeCart, items, removeItem, updateQuantity, getCartTotal } = useCartStore();

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert("Checkout failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCart} />
      
      {/* 侧边栏内容 */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-black italic">YOUR CART</h2>
          <button onClick={closeCart} className="text-2xl">✕</button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 mt-20">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden">
                  <img src={item.fileUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-sm">{item.name}</h3>
                  <p className="text-[10px] text-gray-400 uppercase">{item.width}x{item.height}in | {item.quantity}pcs</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-mono font-bold">${(item.price / 100).toFixed(2)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-[10px] text-red-500 underline">Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t bg-gray-50 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-gray-400 text-xs font-bold uppercase">Total</span>
              <span className="text-3xl font-black tracking-tighter">${(getCartTotal() / 100).toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-all"
            >
              Checkout Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}