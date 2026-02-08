"use client";

import { useState, useEffect } from "react";

export default function PromoBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("vibe-promo-dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("vibe-promo-dismissed", "1");
  };

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white text-center py-2.5 px-10 text-xs md:text-sm font-bold tracking-wide z-[60]">
      <span className="opacity-80">&#127881;</span>
      {" "}New Customer Special: <span className="underline decoration-white/40">15% OFF</span> Your First Order
      {" "}&middot; Code: <span className="bg-white/20 px-2 py-0.5 rounded font-black tracking-widest ml-1">FIRST15</span>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/60 hover:text-white"
        aria-label="Dismiss"
      >
        &#10005;
      </button>
    </div>
  );
}
