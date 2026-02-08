"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useCartStore } from "@/lib/store";

const MEGA_CATEGORIES = [
  {
    slug: "display-stands",
    label: "Display Stands",
    desc: "Banner stands, X-frames & tabletop displays",
    products: ["Retractable Stand", "X-Banner", "Tabletop A3"],
  },
  {
    slug: "vehicle-branding-advertising",
    label: "Vehicle Branding",
    desc: "Wraps, door lettering & promotional graphics",
    products: ["Truck Lettering", "Logo Decals", "Magnetic Signs"],
  },
  {
    slug: "fleet-compliance-id",
    label: "Fleet Compliance",
    desc: "TSSA, CVOR, DOT numbers & fleet ID",
    products: ["TSSA Numbers", "CVOR Decals", "Asset Tags"],
  },
  {
    slug: "safety-warning-decals",
    label: "Safety & Warning",
    desc: "Reflective markings, hazard & compliance decals",
    products: ["Chevron Kits", "Safety Stripes", "GHS Labels"],
  },
  {
    slug: "facility-asset-labels",
    label: "Facility & Assets",
    desc: "Floor graphics, wayfinding & asset labels",
    products: ["Floor Graphics", "Privacy Film", "Zone Labels"],
  },
];

export default function Navbar() {
  const openCart = useCartStore((s) => s.openCart);
  const getCartCount = useCartStore((s) => s.getCartCount);

  const [mounted, setMounted] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const megaRef = useRef(null);
  const megaTimeout = useRef(null);

  useEffect(() => setMounted(true), []);

  const cartCount = mounted ? getCartCount() : 0;

  const openMega = () => {
    clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 200);
  };

  // Close mega on outside click
  useEffect(() => {
    const handler = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="text-2xl font-black tracking-tighter hover:opacity-70 transition-opacity">
          VIBE<span className="text-blue-600">.</span>
        </Link>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-7 font-medium text-sm text-gray-600">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>

          {/* Shop with mega menu */}
          <div
            ref={megaRef}
            className="relative"
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
          >
            <Link
              href="/shop"
              className="hover:text-black transition-colors flex items-center gap-1"
            >
              Shop
              <svg className={`w-3.5 h-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </Link>

            {/* Mega menu dropdown */}
            {megaOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[680px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 grid grid-cols-3 gap-4"
                onMouseEnter={openMega}
                onMouseLeave={closeMega}
              >
                {MEGA_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/shop?category=${cat.slug}`}
                    className="group p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    onClick={() => setMegaOpen(false)}
                  >
                    <h4 className="font-bold text-sm group-hover:text-blue-600 transition-colors">
                      {cat.label}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{cat.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cat.products.map((p) => (
                        <span key={p} className="bg-gray-100 text-[9px] font-bold text-gray-500 px-2 py-0.5 rounded-full">
                          {p}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
                <Link
                  href="/shop"
                  className="col-span-3 text-center py-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                  onClick={() => setMegaOpen(false)}
                >
                  Browse All Products &rarr;
                </Link>
              </div>
            )}
          </div>

          <Link href="/about" className="hover:text-black transition-colors">About</Link>
        </div>

        {/* Right: Phone + Rush + Cart */}
        <div className="flex items-center gap-3">
          {/* Phone (desktop only) */}
          <a href="tel:+14165550199" className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 hover:text-black transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            (416) 555-0199
          </a>

          {/* Rush badge */}
          <Link
            href="#quote"
            className="hidden sm:flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-orange-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Rush Orders
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-all flex items-center gap-2 group"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className={`bg-white text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${cartCount > 0 ? "scale-100" : "scale-0 w-0 opacity-0"}`}>
              {cartCount}
            </span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-6 py-4 space-y-1">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-bold hover:text-blue-600 transition-colors">Home</Link>
            <Link href="/shop" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-bold hover:text-blue-600 transition-colors">All Products</Link>
            {MEGA_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm text-gray-500 hover:text-black pl-4 border-l-2 border-gray-100 transition-colors"
              >
                {cat.label}
              </Link>
            ))}
            <Link href="/about" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-bold hover:text-blue-600 transition-colors">About</Link>
            <div className="pt-3 border-t border-gray-100">
              <a href="tel:+14165550199" className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                (416) 555-0199
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
