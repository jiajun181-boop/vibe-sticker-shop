"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function ProductCard({ p, t, onQuickAdd }) {
  const img = p.images?.[0]?.url;

  return (
    <div className="w-44 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm">
      <Link href={`/shop/${p.category}/${p.slug}`} className="block">
        <div className="aspect-square overflow-hidden bg-[var(--color-paper-cream)]">
          {img ? (
            <Image
              src={img}
              alt={p.name}
              width={176}
              height={176}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl text-[var(--color-gray-400)]">No image</div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <p className="truncate text-xs font-semibold text-[var(--color-gray-800)]">{p.name}</p>
        <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
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

function MarqueeRow({ items, t, onQuickAdd, reverse = false, duration = "48s" }) {
  const loopItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="overflow-hidden">
      <div
        className={`flex w-max gap-3 ${reverse ? "popular-marquee-reverse" : "popular-marquee"}`}
        style={{ "--marquee-duration": duration }}
      >
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

  return (
    <div className="popular-marquee-wrap rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-paper-white)] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">
          {t("home.popularProducts")}
        </h3>
        <Link href="/shop" className="btn-secondary-pill px-3 py-1.5 text-[10px]">
          {t("nav.shopAll")}
        </Link>
      </div>

      <div className="space-y-3 scroll-fade">
        <MarqueeRow items={rowA} t={t} onQuickAdd={handleQuickAdd} duration="42s" />
        <MarqueeRow items={rowB} t={t} onQuickAdd={handleQuickAdd} reverse duration="48s" />
      </div>
    </div>
  );
}
