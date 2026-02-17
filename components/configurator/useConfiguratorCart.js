"use client";

import { useCallback, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";

/**
 * Normalise meta values for Stripe checkout (strings/numbers/booleans only).
 */
function normalizeCheckoutMeta(meta) {
  const input = meta && typeof meta === "object" ? meta : {};
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v == null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
      continue;
    }
    try { out[k] = JSON.stringify(v); } catch { /* skip */ }
  }
  return out;
}

/**
 * Hook providing addToCart and buyNow handlers for configurator components.
 *
 * @param {object} params
 * @param {Function} params.buildCartItem — () => cartItem | null
 * @param {string} [params.successMessage] — toast message on add
 *
 * @returns {{ handleAddToCart, handleBuyNow, buyNowLoading }}
 */
export default function useConfiguratorCart({ buildCartItem, successMessage = "Added to cart!" }) {
  const { addItem, openCart } = useCartStore();
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const handleAddToCart = useCallback(() => {
    const item = buildCartItem();
    if (!item) return;
    addItem(item);
    openCart();
    showSuccessToast(successMessage);
  }, [buildCartItem, addItem, openCart, successMessage]);

  const handleBuyNow = useCallback(async () => {
    const item = buildCartItem();
    if (!item || buyNowLoading) return;
    setBuyNowLoading(true);
    try {
      const checkoutItem = {
        productId: String(item.id),
        slug: String(item.slug),
        name: item.name,
        unitAmount: item.price,
        quantity: item.quantity,
        meta: normalizeCheckoutMeta(item.options),
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [checkoutItem] }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBuyNowLoading(false);
    }
  }, [buildCartItem, buyNowLoading]);

  return { handleAddToCart, handleBuyNow, buyNowLoading };
}
