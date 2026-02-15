"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const CARD_WIDTH = 188; // w-44 (176px) + gap (12px)
const SCROLL_SPEED = 0.5; // px per frame

export default function QuickOrderStrip({ products }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef(null);

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !products?.length) return;

    let running = true;
    function tick() {
      if (!running) return;
      if (!paused && el) {
        el.scrollLeft += SCROLL_SPEED;
        // Loop back when reaching the end
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, products]);

  const scrollBy = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * CARD_WIDTH * 2, behavior: "smooth" });
  }, []);

  if (!products || products.length === 0) return null;

  function handleQuickAdd(product) {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: product.basePrice,
      quantity: 1,
      image: product.images?.[0]?.url || null,
    });
    openCart();
    showSuccessToast(t("shop.addedToCart"));
  }

  return (
    <div className="relative group">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 text-center mb-4">
        {t("home.popularProducts")}
      </h3>

      {/* Left arrow — desktop only */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="hidden md:flex absolute left-0 top-1/2 translate-y-2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 border border-gray-200 shadow-md text-gray-600 hover:bg-white hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Scroll left"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Right arrow — desktop only */}
      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="hidden md:flex absolute right-0 top-1/2 translate-y-2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 border border-gray-200 shadow-md text-gray-600 hover:bg-white hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Scroll right"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-fade"
      >
        {products.map((p) => {
          const img = p.images?.[0]?.url;
          return (
            <div
              key={p.id}
              className="flex-none w-44 rounded-2xl border border-gray-200 bg-white overflow-hidden"
            >
              <Link href={`/shop/${p.category}/${p.slug}`} className="block">
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {img ? (
                    <Image
                      src={img}
                      alt={p.name}
                      width={176}
                      height={176}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <span className="text-3xl opacity-30">🧩</span>
                  )}
                </div>
              </Link>
              <div className="p-3">
                <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t("home.from")} {formatCad(p.basePrice)}
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(p)}
                  className="mt-2 w-full rounded-full bg-gray-900 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-black"
                >
                  {t("shop.quickAdd")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
