"use client";

import { useState, useCallback } from "react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Quick-add button for product cards.
 * Adds a minimal cart item with smart-default quantity.
 * Checkout API re-validates prices server-side.
 *
 * @param {{ product: { id: string, slug: string, name: string, category: string, basePrice?: number, fromPrice?: number, images?: Array, quickAddQty?: number } }} props
 */
export default function QuickAddButton({ product }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const qty = product.quickAddQty || 1;
  const unitPrice = product.fromPrice || product.basePrice || 0;
  const image = product.images?.[0]?.url || null;

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (added) return;

      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        unitAmount: unitPrice > 0 ? Math.round(unitPrice / qty) : 0,
        quantity: qty,
        image,
        meta: {
          quickAdd: true,
          category: product.category,
        },
        forceNewLine: true,
      });

      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    },
    [added, addItem, product, qty, unitPrice, image]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 ${
        added
          ? "bg-emerald-600 text-white"
          : "border border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900"
      }`}
    >
      {added ? (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {t("product.added")}
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          {t("shop.quickAdd")}
        </>
      )}
    </button>
  );
}
