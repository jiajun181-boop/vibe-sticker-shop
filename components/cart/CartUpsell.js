"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getProductImage } from "@/lib/product-image";
import { formatCad } from "@/lib/product-helpers";
import { getUpsellSuggestions } from "@/lib/storefront/upsell-rules";

export default function CartUpsell({ isFirstAdd = false }) {
  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const { t, locale } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [reasonMap, setReasonMap] = useState({});

  useEffect(() => {
    if (cart.length === 0) {
      setSuggestions([]);
      setReasonMap({});
      return;
    }

    const cartSlugs = cart.map((item) => item.slug);
    const lastItem = cart[cart.length - 1];
    const lastSlug = lastItem?.slug || "";
    const lastCategory = lastItem?.meta?.category || lastItem?.options?.category || "";

    const rules = getUpsellSuggestions(lastSlug, lastCategory, cartSlugs, 3);
    if (rules.length === 0) {
      setSuggestions([]);
      setReasonMap({});
      return;
    }

    // Build reason map keyed by slug
    const reasons = {};
    for (const r of rules) {
      reasons[r.slug] = locale === "zh" ? r.reason_zh : r.reason_en;
    }
    setReasonMap(reasons);

    const params = new URLSearchParams();
    params.set("slugs", rules.map((r) => r.slug).join(","));
    params.set("limit", "3");

    fetch(`/api/products/suggestions?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSuggestions(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setSuggestions([]));
  }, [cart, locale]);

  if (suggestions.length === 0) return null;

  return (
    <div className="border-t border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">
        {isFirstAdd ? t("cart.upsell.firstAddTitle") : t("cart.upsell.title")}
      </p>
      <div className="mt-3 space-y-2">
        {suggestions.map((item) => {
          const imageSrc = getProductImage(item);
          const reason = reasonMap[item.slug];
          return (
          <div
            key={item.slug}
            className="flex items-center gap-3 rounded-sm border border-[var(--color-gray-200)] bg-white p-2"
          >
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-gray-100)]">
              <img src={imageSrc} alt={item.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[var(--color-gray-900)]">{item.name}</p>
              {reason && (
                <p className="truncate text-[10px] text-[var(--color-gray-500)]">{reason}</p>
              )}
              <p className="text-[11px] text-[var(--color-gray-500)]">{formatCad(item.basePrice)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                addItem({
                  productId: item.id,
                  slug: item.slug,
                  name: item.name,
                  unitAmount: item.basePrice,
                  quantity: 1,
                  image: imageSrc,
                  meta: { pricingUnit: item.pricingUnit, category: item.category },
                  id: item.id,
                  price: item.basePrice,
                  options: { pricingUnit: item.pricingUnit, category: item.category },
                });
                showSuccessToast(`${item.name} — ${t("cart.itemAdded")}`);
              }}
              className="rounded-sm bg-[var(--color-moon-blue-deep)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fff] hover:bg-[var(--color-ink-black)]"
            >
              {t("cart.quickAdd")}
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}
