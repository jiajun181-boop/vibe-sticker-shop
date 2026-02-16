"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function ProductCard({ p, t, onQuickAdd }) {
  const img = p.images?.[0]?.url;

  return (
    <div className="w-44 shrink-0 overflow-hidden rounded-2xl border border-[#e5ddd0] bg-white shadow-sm">
      <Link href={`/shop/${p.category}/${p.slug}`} className="block">
        <div className="aspect-square overflow-hidden bg-[#f8f4ec]">
          {img ? (
            <Image
              src={img}
              alt={p.name}
              width={176}
              height={176}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl text-slate-400">No image</div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <p className="truncate text-xs font-semibold text-gray-900">{p.name}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {t("home.from")} {formatCad(p.basePrice)}
        </p>
        <button
          type="button"
          onClick={() => onQuickAdd(p)}
          className="btn-primary-pill mt-2 w-full py-1.5 text-[11px]"
        >
          {t("shop.quickAdd")}
        </button>
      </div>
    </div>
  );
}

function ScrollRow({ items, t, onQuickAdd, rowRef, onPointerDown, onPointerMove, onPointerUp }) {
  return (
    <div
      ref={rowRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide touch-pan-x select-none cursor-grab active:cursor-grabbing"
    >
      {items.map((p) => (
        <ProductCard key={p.id} p={p} t={t} onQuickAdd={onQuickAdd} />
      ))}
    </div>
  );
}

export default function QuickOrderStrip({ products }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, target: null });
  const [dragging, setDragging] = useState(false);

  if (!products || products.length === 0) return null;

  const topRow = products.filter((_, idx) => idx % 2 === 0);
  const bottomRow = products.filter((_, idx) => idx % 2 === 1);

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

  function scrollByAmount(rowRef, delta) {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  function handlePointerDown(e) {
    const target = e.currentTarget;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: target.scrollLeft,
      target,
    };
    setDragging(true);
    target.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    const state = dragRef.current;
    if (!state.active || !state.target) return;
    const dx = e.clientX - state.startX;
    state.target.scrollLeft = state.startScrollLeft - dx;
  }

  function handlePointerUp() {
    dragRef.current = { active: false, startX: 0, startScrollLeft: 0, target: null };
    setDragging(false);
  }

  return (
    <div className="rounded-2xl border border-[#e5ddd0] bg-[#fffefb] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#7c7062]">
          {t("home.popularProducts")}
        </h3>
        <div className="hidden md:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              scrollByAmount(topRowRef, -360);
              scrollByAmount(bottomRowRef, -360);
            }}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-500"
            aria-label="Scroll popular products left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => {
              scrollByAmount(topRowRef, 360);
              scrollByAmount(bottomRowRef, 360);
            }}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-500"
            aria-label="Scroll popular products right"
          >
            →
          </button>
        </div>
      </div>

      <div className={`space-y-3 ${dragging ? "" : "scroll-fade"}`}>
        <ScrollRow
          items={topRow}
          t={t}
          onQuickAdd={handleQuickAdd}
          rowRef={topRowRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <ScrollRow
          items={bottomRow.length ? bottomRow : topRow}
          t={t}
          onQuickAdd={handleQuickAdd}
          rowRef={bottomRowRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}
