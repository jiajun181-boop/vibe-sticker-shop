/**
 * Settlement module tests — ensures Stripe/Invoice/Interac paths
 * produce identical amounts for the same cart configuration.
 */

import { settleOrder, normalizeDeliveryMethod } from "./settlement";

// Constants from order-config (copied here so test is self-documenting)
const HST_RATE = 0.13;
const FREE_SHIPPING_THRESHOLD = 9900;
const SHIPPING_COST = 1500;
const DESIGN_HELP_CENTS = 4500;
const B2B_FREE_SHIPPING_THRESHOLD = 15000;

describe("settleOrder", () => {
  const twoItems = [
    { lineTotal: 5000, meta: {} },
    { lineTotal: 3000, meta: {} },
  ];

  test("basic settlement with shipping, no discounts", () => {
    const r = settleOrder({ items: twoItems, deliveryMethod: "shipping" });
    expect(r.itemsSubtotal).toBe(8000);
    expect(r.designHelpCount).toBe(0);
    expect(r.designHelpTotal).toBe(0);
    expect(r.subtotal).toBe(8000);
    expect(r.totalDiscount).toBe(0);
    expect(r.afterDiscount).toBe(8000);
    // 8000 < 9900 → shipping = 1500
    expect(r.shippingAmount).toBe(SHIPPING_COST);
    // tax = (8000 + 1500) * 0.13 = 1235
    expect(r.taxAmount).toBe(Math.round(9500 * HST_RATE));
    expect(r.totalAmount).toBe(8000 + 1500 + r.taxAmount);
  });

  test("free shipping when above threshold", () => {
    const items = [{ lineTotal: 10000, meta: {} }];
    const r = settleOrder({ items, deliveryMethod: "shipping" });
    expect(r.shippingAmount).toBe(0);
    expect(r.totalAmount).toBe(10000 + Math.round(10000 * HST_RATE));
  });

  test("pickup is always free shipping regardless of subtotal", () => {
    const items = [{ lineTotal: 1000, meta: {} }];
    const r = settleOrder({ items, deliveryMethod: "pickup" });
    expect(r.shippingAmount).toBe(0);
    expect(r.totalAmount).toBe(1000 + Math.round(1000 * HST_RATE));
  });

  test("coupon discount reduces afterDiscount", () => {
    const r = settleOrder({
      items: twoItems,
      deliveryMethod: "shipping",
      couponDiscount: 2000,
    });
    expect(r.couponDiscount).toBe(2000);
    expect(r.afterDiscount).toBe(6000);
    // 6000 < 9900 → shipping = 1500
    expect(r.shippingAmount).toBe(SHIPPING_COST);
    expect(r.taxAmount).toBe(Math.round(7500 * HST_RATE));
  });

  test("partner discount stacks with coupon", () => {
    const r = settleOrder({
      items: twoItems,
      deliveryMethod: "shipping",
      couponDiscount: 1000,
      partnerDiscount: 500,
    });
    expect(r.totalDiscount).toBe(1500);
    expect(r.afterDiscount).toBe(6500);
  });

  test("total discount capped at subtotal (never negative)", () => {
    const items = [{ lineTotal: 1000, meta: {} }];
    const r = settleOrder({
      items,
      deliveryMethod: "shipping",
      couponDiscount: 5000,
      partnerDiscount: 5000,
    });
    expect(r.totalDiscount).toBe(1000); // capped
    expect(r.afterDiscount).toBe(0);
    // tax on (0 + shipping)
    expect(r.taxAmount).toBe(Math.round(SHIPPING_COST * HST_RATE));
  });

  test("design help fee counted per opted-in line item", () => {
    const items = [
      { lineTotal: 5000, meta: { designHelp: "true" } },
      { lineTotal: 3000, meta: {} },
      { lineTotal: 2000, meta: { designHelp: true } },
    ];
    const r = settleOrder({ items, deliveryMethod: "shipping" });
    expect(r.designHelpCount).toBe(2);
    expect(r.designHelpTotal).toBe(DESIGN_HELP_CENTS * 2);
    expect(r.subtotal).toBe(10000 + DESIGN_HELP_CENTS * 2);
  });

  test("B2B uses higher free shipping threshold", () => {
    // 12000 is above consumer threshold (9900) but below B2B (15000)
    const items = [{ lineTotal: 12000, meta: {} }];
    const consumerResult = settleOrder({ items, deliveryMethod: "shipping" });
    const b2bResult = settleOrder({ items, deliveryMethod: "shipping", isB2B: true });

    expect(consumerResult.shippingAmount).toBe(0); // above 9900
    expect(b2bResult.shippingAmount).toBe(SHIPPING_COST); // below 15000
  });

  test("CONSISTENCY: same cart → same amounts across all 3 checkout paths", () => {
    // Simulates the exact same cart going through Stripe, Invoice, and Interac
    const cart = [
      { lineTotal: 5000, meta: { designHelp: "true" } },
      { lineTotal: 3000, meta: { rushProduction: "true" } },
      { lineTotal: 2500, meta: {} },
    ];
    const couponDiscount = 1000;

    // Path 1: "Stripe checkout" (originally uses shippingMethod:"delivery")
    const stripe = settleOrder({
      items: cart,
      deliveryMethod: normalizeDeliveryMethod("delivery"),
      couponDiscount,
    });

    // Path 2: "Invoice checkout" (uses deliveryMethod:"shipping")
    const invoice = settleOrder({
      items: cart,
      deliveryMethod: normalizeDeliveryMethod("shipping"),
      couponDiscount,
    });

    // Path 3: "Interac checkout" (uses deliveryMethod:"shipping")
    const interac = settleOrder({
      items: cart,
      deliveryMethod: normalizeDeliveryMethod("shipping"),
      couponDiscount,
    });

    // All amounts must match exactly
    expect(stripe.subtotal).toBe(invoice.subtotal);
    expect(stripe.subtotal).toBe(interac.subtotal);
    expect(stripe.afterDiscount).toBe(invoice.afterDiscount);
    expect(stripe.afterDiscount).toBe(interac.afterDiscount);
    expect(stripe.shippingAmount).toBe(invoice.shippingAmount);
    expect(stripe.shippingAmount).toBe(interac.shippingAmount);
    expect(stripe.taxAmount).toBe(invoice.taxAmount);
    expect(stripe.taxAmount).toBe(interac.taxAmount);
    expect(stripe.totalAmount).toBe(invoice.totalAmount);
    expect(stripe.totalAmount).toBe(interac.totalAmount);
  });

  test("CONSISTENCY: pickup path same across all checkouts", () => {
    const cart = [{ lineTotal: 5000, meta: {} }];
    const stripe = settleOrder({ items: cart, deliveryMethod: normalizeDeliveryMethod("pickup") });
    const invoice = settleOrder({ items: cart, deliveryMethod: normalizeDeliveryMethod("pickup") });
    const interac = settleOrder({ items: cart, deliveryMethod: normalizeDeliveryMethod("pickup") });

    expect(stripe.totalAmount).toBe(invoice.totalAmount);
    expect(stripe.totalAmount).toBe(interac.totalAmount);
    expect(stripe.shippingAmount).toBe(0);
    expect(invoice.shippingAmount).toBe(0);
    expect(interac.shippingAmount).toBe(0);
  });
});

describe("normalizeDeliveryMethod", () => {
  test("delivery → shipping", () => {
    expect(normalizeDeliveryMethod("delivery")).toBe("shipping");
  });
  test("pickup → pickup", () => {
    expect(normalizeDeliveryMethod("pickup")).toBe("pickup");
  });
  test("shipping → shipping", () => {
    expect(normalizeDeliveryMethod("shipping")).toBe("shipping");
  });
  test("null/undefined → shipping", () => {
    expect(normalizeDeliveryMethod(null)).toBe("shipping");
    expect(normalizeDeliveryMethod(undefined)).toBe("shipping");
  });
  test("case insensitive", () => {
    expect(normalizeDeliveryMethod("PICKUP")).toBe("pickup");
    expect(normalizeDeliveryMethod("Delivery")).toBe("shipping");
  });
});
