// lib/calculate-order-totals.js
import { HST_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST, MIN_UNIT_AMOUNT, MAX_ITEM_QUANTITY } from "@/lib/order-config";

export function calculateOrderTotals(items) {
  // Guard: validate each item before summing
  for (const item of items) {
    if (!Number.isFinite(item.unitAmount) || item.unitAmount < 0) {
      throw new Error(`Invalid unitAmount: ${item.unitAmount}`);
    }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(`Invalid quantity: ${item.quantity}`);
    }
    if (item.quantity > MAX_ITEM_QUANTITY) {
      throw new Error(`Quantity ${item.quantity} exceeds maximum ${MAX_ITEM_QUANTITY}`);
    }
  }

  // 1. Subtotal
  const subtotalAmount = items.reduce((sum, item) => {
    return sum + item.unitAmount * item.quantity;
  }, 0);

  // 2. Shipping
  const shippingAmount =
    subtotalAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  // 3. Tax (on subtotal + shipping)
  const taxableBase = subtotalAmount + shippingAmount;
  const taxAmount = Math.round(taxableBase * HST_RATE);

  // 4. Total
  const totalAmount = subtotalAmount + shippingAmount + taxAmount;

  return {
    subtotalAmount,
    taxAmount,
    shippingAmount,
    totalAmount,
    currency: "cad",
  };
}

export function validateAmountReconciliation(metadata, stripeAmountTotal) {
  const metadataTotal = parseInt(metadata.totalAmount);
  const difference = Math.abs(metadataTotal - stripeAmountTotal);

  if (difference > 100) {
    throw new Error(
      `Amount mismatch > $1: metadata=${metadataTotal}, stripe=${stripeAmountTotal}`
    );
  }

  if (difference > 1) {
    console.warn(
      `[Amount Reconciliation] Warning: ${difference} cents difference`
    );
  }

  // Use Stripe's actual charged amount (source of truth)
  return stripeAmountTotal;
}
