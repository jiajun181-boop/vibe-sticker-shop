// lib/calculate-order-totals.js
const FREE_SHIPPING_THRESHOLD = 15000; // $150.00 CAD in cents
const SHIPPING_COST = 1500; // $15.00 CAD in cents
const HST_RATE = 0.13; // Ontario 13%

export function calculateOrderTotals(items) {
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
