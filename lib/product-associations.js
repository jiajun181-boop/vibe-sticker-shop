/**
 * Backward-compatible re-exports from the unified upsell module.
 * Used by RelatedProducts.js on product detail pages.
 */
export {
  CATEGORY_UPSELLS as CATEGORY_ASSOCIATIONS,
  PRODUCT_UPSELLS as PRODUCT_ASSOCIATIONS,
  getUpsellSuggestions as getAssociationsFor,
} from "@/lib/storefront/upsell-rules";
