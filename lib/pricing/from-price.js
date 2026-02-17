// lib/pricing/from-price.js
// Computes the minimum "From $X" price for listing pages using the real quote engine.
// Falls back to product.basePrice if the quote engine throws.
//
// Priority chain:
//   1. product.displayFromPrice  (admin override — e.g. area-tiered products)
//   2. product.minPrice          (auto-computed cache from seed/save scripts)
//   3. Live computation via quoteProduct()
//   4. product.basePrice         (last-resort fallback)

import { quoteProduct } from "@/lib/pricing/quote-server.js";

/**
 * Compute the "From" price (in cents) for a product using its pricing preset.
 * Uses minimum defaults (smallest qty, smallest size) so the price shown on
 * listing cards closely matches what the customer sees on the product page.
 *
 * @param {object} product  Prisma product with pricingPreset included
 * @returns {number}        Price in cents (totalCents), or product.basePrice as fallback
 */
export function computeFromPrice(product) {
  if (!product) return 0;

  // 1) Admin override — always takes priority
  if (typeof product.displayFromPrice === "number" && product.displayFromPrice > 0) {
    return product.displayFromPrice;
  }

  // 2) Cached computed value from seed/save scripts
  if (typeof product.minPrice === "number" && product.minPrice > 0) {
    return product.minPrice;
  }

  // 3) Live computation
  try {
    const preset = product.pricingPreset;
    const config = preset?.config;
    const model = preset?.model;

    if (!config || !model) {
      return product.basePrice || 0;
    }

    let body = {};

    if (model === "QTY_TIERED") {
      const tiers = Array.isArray(config.tiers) ? config.tiers : [];
      const sorted = [...tiers].sort((a, b) => Number(a.minQty) - Number(b.minQty));
      const minQty = sorted.length > 0 ? Number(sorted[0].minQty) : 1;
      body = { slug: product.slug, quantity: minQty };
    } else if (model === "AREA_TIERED") {
      // Use product-level displayMinSize if configured (e.g. { widthIn: 24, heightIn: 36 }),
      // otherwise fall back to a sensible 2x3 ft (24x36") minimum for large-format products.
      const minSize = product.optionsConfig?.displayMinSize;
      const w = Number(minSize?.widthIn) || product.minWidthIn || 24;
      const h = Number(minSize?.heightIn) || product.minHeightIn || 36;
      body = { slug: product.slug, quantity: 1, widthIn: w, heightIn: h };
    } else if (model === "QTY_OPTIONS") {
      // Prefer product-level size pricing when present (split products like
      // business card variants can share one preset but have different
      // optionsConfig.priceByQty).
      const optionSizes = Array.isArray(product.optionsConfig?.sizes)
        ? product.optionsConfig.sizes
        : [];
      if (optionSizes.length > 0) {
        const firstOption = optionSizes[0];
        const qtyChoices = Array.isArray(firstOption?.quantityChoices)
          ? firstOption.quantityChoices
              .map((q) => Number(q))
              .filter((q) => Number.isFinite(q) && q > 0)
              .sort((a, b) => a - b)
          : [];
        const minQtyFromChoices = qtyChoices.length > 0 ? qtyChoices[0] : null;
        const minQtyFromPriceByQty =
          firstOption?.priceByQty && typeof firstOption.priceByQty === "object"
            ? Object.keys(firstOption.priceByQty)
                .map((q) => Number(q))
                .filter((q) => Number.isFinite(q) && q > 0)
                .sort((a, b) => a - b)[0] || null
            : null;
        const minQty = minQtyFromChoices || minQtyFromPriceByQty || 1;
        const sizeLabel = firstOption?.label || firstOption?.id || null;
        if (sizeLabel) {
          body = { slug: product.slug, quantity: minQty, sizeLabel };
        }
      }

      // Fallback to preset tiers when product-level options are unavailable.
      if (!body.sizeLabel) {
        const sizes = Array.isArray(config.sizes) ? config.sizes : [];
        if (sizes.length === 0) return product.basePrice || 0;
        const firstSize = sizes[0];
        const tiers = Array.isArray(firstSize.tiers) ? firstSize.tiers : [];
        const sorted = [...tiers].sort((a, b) => Number(a.qty) - Number(b.qty));
        const minQty = sorted.length > 0 ? Number(sorted[0].qty) : 1;
        body = { slug: product.slug, quantity: minQty, sizeLabel: firstSize.label };
      }
    } else {
      return product.basePrice || 0;
    }

    const result = quoteProduct(product, body);
    return Number(result.totalCents) || product.basePrice || 0;
  } catch {
    return product.basePrice || 0;
  }
}
