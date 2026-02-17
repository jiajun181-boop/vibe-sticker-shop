"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function ProductCard({ p, t, onQuickAdd }) {
  const img = p.images?.[0]?.url;

  return (
    <div className="w-52 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm hover-lift-subtle">
      <Link href={`/shop/${p.category}/${p.slug}`} className="block">
        <div className="aspect-square overflow-hidden bg-[var(--color-paper-cream)]">
          {img ? (
            <Image
              src={img}
              alt={p.name}
              width={208}
              height={208}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl text-[var(--color-gray-400)]">
              No image
            </div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <p className="truncate body-sm font-semibold text-[var(--color-gray-800)]">{p.name}</p>
        <p className="mt-0.5 body-sm text-[var(--color-gray-500)]">
          {t("home.from")} {formatCad(p.basePrice)}
        </p>
        <button
          type="button"
          onClick={() => onQuickAdd(p)}
          className="btn-primary-pill mt-2 w-full py-1.5 label-sm"
        >
          {t("shop.quickAdd")}
        </button>
      </div>
    </div>
  );
}

function MarqueeRow({
  items,
  t,
  onQuickAdd,
  speed = 0.42,
  direction = 1,
  pauseAll = false,
  registerScroller,
}) {
  const wrapRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, pointerId: null });
  const [isPointerDown, setIsPointerDown] = useState(false);
  const loopItems = useMemo(() => [...items, ...items], [items]);

  useEffect(() => {
    if (!wrapRef.current || !registerScroller) return undefined;
    return registerScroller(wrapRef.current);
  }, [registerScroller]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    let raf = null;
    if (direction < 0 && el.scrollLeft === 0) {
      el.scrollLeft = Math.max(0, el.scrollWidth / 2);
    }

    const tick = () => {
      const half = el.scrollWidth / 2;
      if (!pauseAll && !isPointerDown && half > 0) {
        if (direction > 0) {
          el.scrollLeft += speed;
          if (el.scrollLeft >= half) el.scrollLeft -= half;
        } else {
          el.scrollLeft -= speed;
          if (el.scrollLeft <= 0) el.scrollLeft += half;
        }
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [direction, isPointerDown, loopItems.length, pauseAll, speed]);

  return (
    <div
      ref={wrapRef}
      className={`overflow-x-auto scrollbar-hide ${isPointerDown ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={(e) => {
        setIsPointerDown(true);
        if (e.pointerType !== "mouse" || !wrapRef.current) return;
        dragRef.current = {
          active: true,
          startX: e.clientX,
          startScrollLeft: wrapRef.current.scrollLeft,
          pointerId: e.pointerId,
        };
        wrapRef.current.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const drag = dragRef.current;
        if (!drag.active || e.pointerType !== "mouse" || !wrapRef.current) return;
        const delta = e.clientX - drag.startX;
        wrapRef.current.scrollLeft = drag.startScrollLeft - delta;
      }}
      onPointerUp={() => {
        setIsPointerDown(false);
        if (dragRef.current.pointerId != null && wrapRef.current) {
          wrapRef.current.releasePointerCapture?.(dragRef.current.pointerId);
        }
        dragRef.current = { active: false, startX: 0, startScrollLeft: 0, pointerId: null };
      }}
      onPointerCancel={() => {
        setIsPointerDown(false);
        dragRef.current = { active: false, startX: 0, startScrollLeft: 0, pointerId: null };
      }}
    >
      <div className="flex w-max gap-3 py-0.5">
        {loopItems.map((p, i) => (
          <ProductCard key={`${p.id}-${i}`} p={p} t={t} onQuickAdd={onQuickAdd} />
        ))}
      </div>
    </div>
  );
}

export default function QuickOrderStrip({ products }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const [pauseAll, setPauseAll] = useState(false);
  const scrollersRef = useRef([]);

  if (!products || products.length === 0) return null;

  const topRow = products.filter((_, idx) => idx % 2 === 0);
  const bottomRow = products.filter((_, idx) => idx % 2 === 1);
  const rowA = topRow.length ? topRow : products;
  const rowB = bottomRow.length ? bottomRow : rowA;

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

  function registerScroller(node) {
    if (!node) return () => {};
    if (!scrollersRef.current.includes(node)) {
      scrollersRef.current.push(node);
    }
    return () => {
      scrollersRef.current = scrollersRef.current.filter((n) => n !== node);
    };
  }

  function nudgeAll(delta) {
    setPauseAll(true);
    for (const node of scrollersRef.current) {
      node.scrollBy({ left: delta, behavior: "smooth" });
    }
    window.setTimeout(() => setPauseAll(false), 700);
  }

  return (
    <div
      className="popular-marquee-wrap rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-paper-white)] p-4 md:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-center label-sm tracking-[0.2em] text-[var(--color-gray-500)]">
          {t("home.popularProducts")}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => nudgeAll(-220)}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-[var(--color-gray-300)] bg-white text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] md:inline-flex"
            aria-label="Scroll left"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <button
            type="button"
            onClick={() => nudgeAll(220)}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-[var(--color-gray-300)] bg-white text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] md:inline-flex"
            aria-label="Scroll right"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
          <Link href="/shop" className="btn-secondary-pill px-3 py-1.5 label-xs">
            {t("nav.shopAll")}
          </Link>
        </div>
      </div>

      <div className="space-y-3 scroll-fade">
        <MarqueeRow
          items={rowA}
          t={t}
          onQuickAdd={handleQuickAdd}
          speed={0.45}
          direction={1}
          pauseAll={pauseAll}
          registerScroller={registerScroller}
        />
        <MarqueeRow
          items={rowB}
          t={t}
          onQuickAdd={handleQuickAdd}
          speed={0.38}
          direction={-1}
          pauseAll={pauseAll}
          registerScroller={registerScroller}
        />
      </div>
    </div>
  );
}
