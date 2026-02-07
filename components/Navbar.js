"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "../app/store/useCartStore";

export default function Navbar() {
  const openCart = useCartStore((state) => state.openCart);
  const items = useCartStore((state) => state.items);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted 
    ? items.reduce((total, item) => total + (item.cartQuantity || 1), 0) 
    : 0;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tighter hover:opacity-70 transition-opacity">
          VIBE<span className="text-blue-600">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <Link href="/shop/stickers/die-cut-singles" className="hover:text-black transition-colors">Stickers</Link>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={openCart} 
            className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-all flex items-center gap-2 group"
          >
            <span>Cart</span>
            <span className={`bg-white text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] transition-transform ${cartCount > 0 ? "scale-100" : "scale-0 opacity-0"} group-hover:scale-110`}>
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
} // 👈 检查这个大括号