"use client";

import { useCallback, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { trackAddToCart } from "@/lib/analytics";
import { normalizeCheckoutMeta } from "@/lib/product-helpers";
import { DESIGN_HELP_CENTS, RUSH_MULTIPLIER } from "@/lib/order-config";

/**
 * Hook providing addToCart and buyNow handlers for configurator components.
 *
 * @param {object} params
 * @param {Function} params.buildCartItem — () => cartItem | null
 * @param {string} [params.successMessage] — toast message on add
 *
 * handleAddToCart / handleBuyNow accept an optional `extraOptions` param:
 *   { rushProduction?: boolean }
 * When rushProduction is true, the item price is multiplied by 1.3.
 *
 * @returns {{ handleAddToCart, handleBuyNow, buyNowLoading }}
 */
export default function useConfiguratorCart({ buildCartItem, successMessage = "Added to cart!" }) {
  const { addItem, openCart } = useCartStore();
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const handleAddToCart = useCallback(async (extraOptions) => {
    // buildCartItem may be sync or async — always await
    const item = await Promise.resolve(buildCartItem());
    if (!item) return;

    // Merge rush production, intake mode, and other extra options
    if (extraOptions && typeof extraOptions === "object") {
      item.options = { ...item.options, ...extraOptions };
      if (extraOptions.rushProduction) {
        item.price = Math.round(item.price * RUSH_MULTIPLIER);
      }
      if (extraOptions.artworkIntent === "design-help") {
        item.price += DESIGN_HELP_CENTS;
        item.options.designHelp = true;
        item.options.designHelpFee = DESIGN_HELP_CENTS;
      }
    }

    addItem(item);
    openCart();
    showSuccessToast(successMessage);
    trackAddToCart({
      name: item.name,
      value: item.price * item.quantity,
      slug: item.slug,
      quantity: item.quantity,
      pricingModel: "configurator",
    });
  }, [buildCartItem, addItem, openCart, successMessage]);

  const handleBuyNow = useCallback(async (extraOptions) => {
    if (buyNowLoading) return;
    setBuyNowLoading(true);
    try {
      // buildCartItem may be sync or async — always await
      const item = await Promise.resolve(buildCartItem());
      if (!item) { setBuyNowLoading(false); return; }

      // Merge rush production, intake mode, and other extra options
      if (extraOptions && typeof extraOptions === "object") {
        item.options = { ...item.options, ...extraOptions };
        if (extraOptions.rushProduction) {
          item.price = Math.round(item.price * RUSH_MULTIPLIER);
        }
        if (extraOptions.artworkIntent === "design-help") {
          item.price += DESIGN_HELP_CENTS;
          item.options.designHelp = true;
          item.options.designHelpFee = DESIGN_HELP_CENTS;
        }
      }

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
