"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";

const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const cartCount = useCartStore((state) => state.getCartCount());
  const openCart = useCartStore((state) => state.openCart);

  return (
    <header className="sticky top-0 z-[50] w-full border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-900">
          Vibe Sticker Shop
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors duration-200 hover:text-gray-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={openCart}
          className="relative flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 transition-colors duration-200 hover:border-gray-900"
        >
          <span>Cart</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
            {cartCount}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between px-6 pb-3 text-xs font-medium text-gray-600 md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors duration-200 hover:text-gray-900">
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
