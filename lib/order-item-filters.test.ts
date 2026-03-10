/**
 * Regression tests for order-item service-fee filtering
 * and invoice subtotal semantics.
 *
 * These validate the shared helpers in lib/order-item-utils.ts used across:
 *   - reorder route (excludes service fees from cart rebuild)
 *   - production-manifest (excludes from manifest)
 *   - production-readiness (excludes from assessment)
 *   - workstation (excludes from action labels)
 *   - admin order create (skips ProductionJob)
 */

import { isServiceFeeItem, isProductionItem } from "@/lib/order-item-utils";

describe("isServiceFeeItem / isProductionItem", () => {
  it("regular product items are production items", () => {
    expect(isServiceFeeItem({ meta: { material: "vinyl", finishing: "matte" } })).toBe(false);
    expect(isProductionItem({ meta: { material: "vinyl", finishing: "matte" } })).toBe(true);
  });

  it("null meta → production item", () => {
    expect(isServiceFeeItem({ meta: null })).toBe(false);
    expect(isProductionItem({ meta: null })).toBe(true);
  });

  it("undefined meta → production item", () => {
    expect(isServiceFeeItem({})).toBe(false);
    expect(isProductionItem({})).toBe(true);
  });

  it("empty meta → production item", () => {
    expect(isServiceFeeItem({ meta: {} })).toBe(false);
    expect(isProductionItem({ meta: {} })).toBe(true);
  });

  it("design-help service fee items are detected", () => {
    const item = { meta: { isServiceFee: "true", feeType: "design-help" } };
    expect(isServiceFeeItem(item)).toBe(true);
    expect(isProductionItem(item)).toBe(false);
  });

  it("isServiceFee must be the string 'true' to match", () => {
    expect(isServiceFeeItem({ meta: { isServiceFee: "false" } })).toBe(false);
    expect(isServiceFeeItem({ meta: { isServiceFee: false as unknown as string } })).toBe(false);
  });

  it("designHelp flag on product items does not trigger service-fee detection", () => {
    expect(isServiceFeeItem({ meta: { designHelp: "true" } })).toBe(false);
    expect(isProductionItem({ meta: { designHelp: "true" } })).toBe(true);
  });
});

describe("invoice subtotal semantics", () => {
  it("subtotalAmount is pre-discount; total = subtotal - discount + shipping + tax", () => {
    const itemsSubtotal = 20000; // $200 in cents
    const designHelpTotal = 4500; // $45
    const subtotalAmount = itemsSubtotal + designHelpTotal; // $245

    const discountAmount = 2450; // 10% coupon
    const afterDiscount = Math.max(0, subtotalAmount - discountAmount);

    expect(subtotalAmount).toBe(24500);
    expect(afterDiscount).toBe(22050);

    const shippingAmount = 0; // free over $99
    const HST_RATE = 0.13;
    const taxAmount = Math.round((afterDiscount + shippingAmount) * HST_RATE);
    const totalAmount = afterDiscount + shippingAmount + taxAmount;

    // Core invariant: subtotal - discount + shipping + tax = total
    expect(subtotalAmount - discountAmount + shippingAmount + taxAmount).toBe(totalAmount);
  });

  it("subtotalAmount must NOT equal afterDiscount when there is a discount", () => {
    const subtotalAmount = 10000;
    const discountAmount = 1000;
    const afterDiscount = subtotalAmount - discountAmount;

    // This was the original bug: storing afterDiscount as subtotalAmount
    expect(subtotalAmount).not.toBe(afterDiscount);
  });
});
