"use client";

import Link from "next/link";
import Image from "next/image";
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

function MarqueeRow({ items, t, onQuickAdd, reverse = false, duration = 42 }) {
  const loop = [...items, ...items];

  return (
    <div
      className="popular-marquee-wrap overflow-hidden"
      style={{
        "--marquee-duration": `${duration}s`,
        "--marquee-duration-slow": `${Math.round(duration * 1.75)}s`,
      }}
    >
      <div
        className={`flex w-max gap-3 py-1 ${reverse ? "popular-marquee-reverse" : "popular-marquee"}`}
      >
        {loop.map((p, idx) => (
          <ProductCard key={`${p.id}-${idx}-${reverse ? "r" : "f"}`} p={p} t={t} onQuickAdd={onQuickAdd} />
        ))}
      </div>
    </div>
  );
}

export default function QuickOrderStrip({ products, speed = "normal" }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  if (!products || products.length === 0) return null;

  const speedFactor = speed === "fast" ? 0.8 : speed === "slow" ? 1.25 : 1;
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

  return (
    <div className="rounded-2xl border border-[#e5ddd0] bg-[#fffefb] p-4 md:p-5">
      <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#7c7062]">
        {t("home.popularProducts")}
      </h3>

      <div className="space-y-3 scroll-fade">
        <MarqueeRow items={topRow} t={t} onQuickAdd={handleQuickAdd} duration={Math.round(44 * speedFactor)} />
        <MarqueeRow
          items={bottomRow.length ? bottomRow : topRow}
          t={t}
          onQuickAdd={handleQuickAdd}
          reverse
          duration={Math.round(50 * speedFactor)}
        />
      </div>
    </div>
  );
}
