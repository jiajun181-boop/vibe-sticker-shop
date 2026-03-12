/**
 * lib/settlement.ts — Shared settlement computation for ALL checkout paths.
 *
 * Single source of truth for:
 *   - Design help fee aggregation
 *   - Subtotal computation (items + design help)
 *   - Coupon + partner discount application (capped at subtotal)
 *   - Shipping determination (pickup / free threshold / flat rate)
 *   - Tax computation (HST on taxable amount)
 *   - Total computation
 *
 * Used by: Stripe checkout, Invoice checkout, Interac checkout.
 * Does NOT handle: item repricing (see checkout-reprice.ts), Stripe API calls.
 */

import {
  HST_RATE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
  DESIGN_HELP_CENTS,
  B2B_FREE_SHIPPING_THRESHOLD,
} from "@/lib/order-config";

// ── Types ───────────────────────────────────────────────────────

export interface SettlementItem {
  lineTotal: number;
  meta?: Record<string, string | number | boolean> | null;
}

export interface SettlementInput {
  items: SettlementItem[];
  /** Normalized: "shipping" or "pickup". Use normalizeDeliveryMethod() to convert. */
  deliveryMethod: "shipping" | "pickup";
  /** Already-computed coupon discount in cents (0 if none). */
  couponDiscount?: number;
  /** Already-computed partner/B2B discount in cents (0 if none). */
  partnerDiscount?: number;
  /** Whether the buyer is a B2B account (uses higher free-shipping threshold). */
  isB2B?: boolean;
}

export interface SettlementResult {
  itemsSubtotal: number;
  designHelpCount: number;
  designHelpTotal: number;
  /** items subtotal + design help total */
  subtotal: number;
  couponDiscount: number;
  partnerDiscount: number;
  /** coupon + partner, capped at subtotal */
  totalDiscount: number;
  afterDiscount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
}

// ── Core ────────────────────────────────────────────────────────

/**
 * Compute the full settlement breakdown for a set of repriced items.
 *
 * Semantics are identical across Stripe/Invoice/Interac paths.
 */
export function settleOrder(input: SettlementInput): SettlementResult {
  const { items, deliveryMethod, isB2B } = input;

  // 1. Design help: flat $45 per line item that opted in
  const designHelpCount = items.filter((item) => {
    const m = item.meta || {};
    return m.designHelp === true || m.designHelp === "true";
  }).length;
  const designHelpTotal = designHelpCount * DESIGN_HELP_CENTS;

  // 2. Subtotals
  const itemsSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = itemsSubtotal + designHelpTotal;

  // 3. Discounts (capped so we never go negative)
  const couponDiscount = Math.max(0, input.couponDiscount || 0);
  const partnerDiscount = Math.max(0, input.partnerDiscount || 0);
  const totalDiscount = Math.min(couponDiscount + partnerDiscount, subtotal);
  const afterDiscount = subtotal - totalDiscount;

  // 4. Shipping
  const isPickup = deliveryMethod === "pickup";
  const threshold = isB2B ? B2B_FREE_SHIPPING_THRESHOLD : FREE_SHIPPING_THRESHOLD;
  const isFreeShipping = isPickup || afterDiscount >= threshold;
  const shippingAmount = isFreeShipping ? 0 : SHIPPING_COST;

  // 5. Tax (HST on after-discount + shipping)
  const taxableAmount = afterDiscount + shippingAmount;
  const taxAmount = Math.round(taxableAmount * HST_RATE);

  // 6. Total
  const totalAmount = afterDiscount + shippingAmount + taxAmount;

  return {
    itemsSubtotal,
    designHelpCount,
    designHelpTotal,
    subtotal,
    couponDiscount,
    partnerDiscount,
    totalDiscount,
    afterDiscount,
    shippingAmount,
    taxAmount,
    totalAmount,
  };
}

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Normalize delivery method from various input formats.
 *
 * Stripe checkout calls it "shippingMethod" with values "delivery"|"pickup".
 * Invoice/Interac call it "deliveryMethod" with values "shipping"|"pickup".
 * This normalizes to "shipping"|"pickup".
 */
export function normalizeDeliveryMethod(
  input: string | undefined | null
): "shipping" | "pickup" {
  if (!input) return "shipping";
  const val = input.trim().toLowerCase();
  if (val === "pickup") return "pickup";
  // Stripe checkout uses "delivery" to mean "shipping"
  if (val === "delivery") return "shipping";
  return "shipping";
}
