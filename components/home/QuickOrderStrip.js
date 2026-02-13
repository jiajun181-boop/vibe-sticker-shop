"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function QuickOrderStrip({ products }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

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
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 text-center mb-4">
        {t("home.popularProducts")}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {products.map((p) => {
          const img = p.images?.[0]?.url;
          return (
            <div
              key={p.id}
              className="flex-none w-44 snap-start rounded-2xl border border-gray-200 bg-white overflow-hidden"
            >
              <Link href={`/shop/${p.category}/${p.slug}`} className="block">
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {img ? (
                    <Image
                      src={img}
                      alt={p.name}
                      width={176}
                      height={176}
                      className="h-full w-full object-cover"
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
