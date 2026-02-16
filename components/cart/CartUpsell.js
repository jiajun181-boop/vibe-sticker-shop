"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getProductImage } from "@/lib/product-image";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// Complementary product rules: category → suggested categories/slugs
const COMPLEMENT_RULES = {
  "rigid-signs": ["display-stands"],
  "banners-displays": ["display-stands"],
  "stickers-labels": ["facility-asset-labels"],
  "vehicle-branding-advertising": ["facility-asset-labels"],
  "display-stands": ["banners-displays", "rigid-signs"],
};

export default function CartUpsell() {
  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (cart.length === 0) {
      setSuggestions([]);
      return;
    }

    const cartSlugs = new Set(cart.map((item) => item.slug));
    const cartCategories = new Set(
      cart.map((item) => item.meta?.category || item.options?.category || "").filter(Boolean)
    );

    // Build list of suggested categories
    const suggestCategories = new Set();
    for (const cat of cartCategories) {
      const complements = COMPLEMENT_RULES[cat];
      if (complements) {
        for (const c of complements) suggestCategories.add(c);
      }
    }

    // Fetch suggestions from API
    if (suggestCategories.size === 0) return;

    const params = new URLSearchParams();
    params.set("categories", [...suggestCategories].join(","));
    params.set("exclude", [...cartSlugs].join(","));
    params.set("limit", "3");

    fetch(`/api/products/suggestions?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSuggestions(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setSuggestions([]));
  }, [cart]);

  if (suggestions.length === 0) return null;

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        {t("cart.youMayAlsoNeed")}
      </p>
      <div className="mt-3 space-y-2">
        {suggestions.map((item) => {
          const imageSrc = getProductImage(item);
          return (
          <div
            key={item.slug}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2"
          >
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <img src={imageSrc} alt={item.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">{item.name}</p>
              <p className="text-[11px] text-gray-500">{formatCad(item.basePrice)}</p>
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
                showSuccessToast(`${item.name} added`);
              }}
              className="rounded-full bg-[var(--color-moon-blue-deep)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-[var(--color-ink-black)]"
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
