/**
 * lib/pricing/integration.test.ts
 * ═══════════════════════════════════════════════════════════════════
 * Comprehensive integration/regression tests across the pricing stack.
 *
 * Tests ONLY pure functions (no DB, no network).
 * Modules that import prisma are mocked at the module boundary.
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Mocks (must be before imports) ──────────────────────────────

jest.mock("@/lib/prisma", () => ({ prisma: {} }));

// ── Imports ─────────────────────────────────────────────────────

import { settleOrder, normalizeDeliveryMethod } from "@/lib/settlement";
import {
  emptyCost,
  sumCostBuckets,
  detectSourceKind,
  extractCostBuckets,
  computeProfit,
  computeCompleteness,
  buildExplanation,
  getDefaultInput,
} from "@/lib/pricing/pricing-contract";
import {
  PricingTier,
  getPricingTier,
  hasPricingTier,
  canViewPricing,
  canEditPricing,
  canApprovePricing,
  canOverridePricing,
  checkApprovalRequired,
} from "@/lib/pricing/pricing-permissions";
import { applyBestRule } from "@/lib/pricing/b2b-rules";
import {
  computeItemProfit,
  computeOrderProfit,
  detectProfitAlerts,
  detectMissingCostAlerts,
} from "@/lib/pricing/profit-tracking";
import {
  toNumberOrNull,
  parseSizeRows,
  parseMetadataItems,
  shapeOrderItem,
  shapeProductionJob,
  buildOrderCreatedTimeline,
  buildSystemNote,
  shouldAutoCreateProof,
  getProofImageUrl,
} from "@/lib/webhook-helpers";

// Constants (copied for self-documenting assertions)
const HST_RATE = 0.13;
const FREE_SHIPPING_THRESHOLD = 9900;
const SHIPPING_COST = 1500;
const DESIGN_HELP_CENTS = 4500;
const B2B_FREE_SHIPPING_THRESHOLD = 15000;

// ═══════════════════════════════════════════════════════════════════
// 1. Settlement Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe("settlement edge cases", () => {
  test("zero-item cart produces zero total", () => {
    const r = settleOrder({ items: [], deliveryMethod: "shipping" });
    expect(r.itemsSubtotal).toBe(0);
    expect(r.designHelpCount).toBe(0);
    expect(r.designHelpTotal).toBe(0);
    expect(r.subtotal).toBe(0);
    expect(r.totalDiscount).toBe(0);
    expect(r.afterDiscount).toBe(0);
    // afterDiscount=0 < threshold → shipping charged
    expect(r.shippingAmount).toBe(SHIPPING_COST);
    // tax on shipping only
    expect(r.taxAmount).toBe(Math.round(SHIPPING_COST * HST_RATE));
    expect(r.totalAmount).toBe(SHIPPING_COST + Math.round(SHIPPING_COST * HST_RATE));
  });

  test("negative coupon discount is clamped to 0", () => {
    const items = [{ lineTotal: 5000, meta: {} }];
    const r = settleOrder({
      items,
      deliveryMethod: "shipping",
      couponDiscount: -500,
    });
    // Math.max(0, -500) = 0 → no discount
    expect(r.couponDiscount).toBe(0);
    expect(r.totalDiscount).toBe(0);
    expect(r.afterDiscount).toBe(5000);
  });

  test("discount cannot exceed subtotal", () => {
    const items = [{ lineTotal: 2000, meta: {} }];
    const r = settleOrder({
      items,
      deliveryMethod: "shipping",
      couponDiscount: 3000,
      partnerDiscount: 3000,
    });
    // coupon(3000) + partner(3000) = 6000, but subtotal is 2000
    expect(r.totalDiscount).toBe(2000);
    expect(r.afterDiscount).toBe(0);
    // No negative amounts
    expect(r.totalAmount).toBeGreaterThanOrEqual(0);
  });

  test("B2B threshold used when isB2B true", () => {
    // 12000 is above consumer threshold (9900) but below B2B (15000)
    const items = [{ lineTotal: 12000, meta: {} }];
    const r = settleOrder({ items, deliveryMethod: "shipping", isB2B: true });
    expect(r.shippingAmount).toBe(SHIPPING_COST); // below 15000 → not free
  });

  test("consumer threshold used when isB2B false", () => {
    const items = [{ lineTotal: 12000, meta: {} }];
    const r = settleOrder({ items, deliveryMethod: "shipping", isB2B: false });
    expect(r.shippingAmount).toBe(0); // above 9900 → free
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Pricing Contract Pure Function Tests
// ═══════════════════════════════════════════════════════════════════

describe("pricing contract pure functions", () => {
  test("emptyCost returns all zeros", () => {
    const c = emptyCost();
    expect(c.material).toBe(0);
    expect(c.print).toBe(0);
    expect(c.finishing).toBe(0);
    expect(c.labor).toBe(0);
    expect(c.packaging).toBe(0);
    expect(c.outsourcing).toBe(0);
    expect(c.setup).toBe(0);
    expect(c.waste).toBe(0);
    expect(c.transfer).toBe(0);
    expect(sumCostBuckets(c)).toBe(0);
  });

  test("sumCostBuckets sums all fields", () => {
    const c = {
      material: 100, print: 200, finishing: 300, labor: 400,
      packaging: 50, outsourcing: 60, setup: 70, waste: 80, transfer: 40,
    };
    expect(sumCostBuckets(c)).toBe(1300);
  });

  test("detectSourceKind - template", () => {
    expect(detectSourceKind({ template: "vinyl_print" }, {})).toBe("template");
    expect(detectSourceKind({ template: "board_sign" }, {})).toBe("template");
    expect(detectSourceKind({ template: "banner" }, {})).toBe("template");
    expect(detectSourceKind({ template: "paper_print" }, {})).toBe("template");
    expect(detectSourceKind({ template: "canvas" }, {})).toBe("template");
    expect(detectSourceKind({ template: "vinyl_cut" }, {})).toBe("template");
  });

  test("detectSourceKind - cost_plus preset", () => {
    const product = { pricingPreset: { model: "COST_PLUS", key: "cp_1" } };
    expect(detectSourceKind({ template: "preset" }, product)).toBe("cost_plus");
  });

  test("detectSourceKind - fixed_prices", () => {
    expect(detectSourceKind({ template: "outsourced" }, {})).toBe("fixed_prices");
    expect(detectSourceKind({ template: "poster_fixed" }, {})).toBe("fixed_prices");
  });

  test("detectSourceKind - sticker_ref", () => {
    expect(detectSourceKind({ template: "sticker_ref" }, {})).toBe("sticker_ref");
  });

  test("detectSourceKind - qty_tiered", () => {
    const product = { pricingPreset: { model: "QTY_TIERED", key: "qt_1" } };
    expect(detectSourceKind({ template: "preset" }, product)).toBe("qty_tiered");
  });

  test("detectSourceKind - quote_only", () => {
    expect(detectSourceKind({ template: "quote_only" }, {})).toBe("quote_only");
  });

  test("detectSourceKind - legacy fallback", () => {
    expect(detectSourceKind({}, {})).toBe("legacy");
    expect(detectSourceKind(null, {})).toBe("legacy");
    expect(detectSourceKind({ template: undefined }, {})).toBe("legacy");
  });

  test("computeProfit positive margin", () => {
    const p = computeProfit(10000, 4000);
    expect(p.amountCents).toBe(6000);
    expect(p.rate).toBe(0.6);
  });

  test("computeProfit negative margin", () => {
    const p = computeProfit(800, 1000);
    expect(p.amountCents).toBe(-200);
    expect(p.rate).toBe(-0.25);
  });

  test("computeProfit zero cost returns zero", () => {
    const p = computeProfit(5000, 0);
    expect(p.amountCents).toBe(0);
    expect(p.rate).toBe(0);
  });

  test("computeCompleteness - template with all data", () => {
    const cost = {
      material: 500, print: 200, finishing: 80, labor: 100,
      packaging: 50, outsourcing: 0, setup: 0, waste: 50, transfer: 0,
    };
    const product = { minPrice: 1000 };
    const c = computeCompleteness("template", cost, product);
    expect(c.score).toBe(100);
    expect(c.missing).toEqual([]);
    expect(c.warnings).toEqual([]);
  });

  test("computeCompleteness - fixed_prices missing outsourcing cost", () => {
    const c = computeCompleteness("fixed_prices", emptyCost(), { minPrice: 100 });
    expect(c.missing).toContain("cost_data");
    expect(c.missing).toContain("outsourcing_cost");
  });

  test("computeCompleteness - quote_only gets free pass on cost", () => {
    const c = computeCompleteness("quote_only", emptyCost(), { minPrice: 100 });
    expect(c.missing).not.toContain("cost_data");
    // quote_only also skips "no_packaging_cost" warning
    expect(c.warnings).not.toContain("no_packaging_cost");
    expect(c.score).toBe(100);
  });

  test("buildExplanation includes Path section", () => {
    const exp = buildExplanation("template", { template: "vinyl_print", meta: { marginCategory: "stickers" } }, {});
    expect(exp).toContain("[Path]");
    expect(exp).toContain("template-resolver");
    expect(exp).toContain("vinyl_print");
  });

  test("buildExplanation with contractCtx includes Costs", () => {
    const ctx = {
      cost: { material: 500, print: 200, finishing: 0, labor: 0, packaging: 0, outsourcing: 0, setup: 0, waste: 0, transfer: 0 },
    };
    const exp = buildExplanation("template", { template: "vinyl_print", meta: {} }, {}, ctx);
    expect(exp).toContain("[Costs]");
    expect(exp).toContain("material=");
    expect(exp).toContain("print=");
  });

  test("getDefaultInput for stickers category", () => {
    const input = getDefaultInput({ category: "stickers-labels-decals" });
    expect(input.quantity).toBe(100);
    expect(input.widthIn).toBe(3);
    expect(input.heightIn).toBe(3);
  });

  test("getDefaultInput for banners category", () => {
    const input = getDefaultInput({ category: "banners-displays" });
    expect(input.quantity).toBe(1);
    expect(input.widthIn).toBe(24);
    expect(input.heightIn).toBe(36);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Approval Requirement Logic Tests
// ═══════════════════════════════════════════════════════════════════

describe("approval requirement logic", () => {
  test("owner bypasses all approval", () => {
    const result = checkApprovalRequired({
      operatorRole: "admin",
      changeType: "bulk_price_update",
      driftPct: 50,
      affectedCount: 100,
      isBulk: true,
    });
    expect(result.requiresApproval).toBe(false);
    expect(result.requiredTier).toBe(PricingTier.OWNER);
  });

  test("operator within guardrails needs no approval", () => {
    const result = checkApprovalRequired({
      operatorRole: "merch_ops",
      changeType: "material_cost",
      driftPct: 5,
      affectedCount: 1,
    });
    expect(result.requiresApproval).toBe(false);
    expect(result.requiredTier).toBe(PricingTier.OPERATOR);
  });

  test("high drift >20% requires manager", () => {
    const result = checkApprovalRequired({
      operatorRole: "merch_ops",
      changeType: "material_cost",
      driftPct: 25,
    });
    expect(result.requiresApproval).toBe(true);
    expect(result.requiredTier).toBe(PricingTier.MANAGER);
    expect(result.reason).toContain("20%");
  });

  test("bulk >10 items requires manager", () => {
    const result = checkApprovalRequired({
      operatorRole: "merch_ops",
      changeType: "preset_edit",
      affectedCount: 15,
    });
    expect(result.requiresApproval).toBe(true);
    expect(result.requiredTier).toBe(PricingTier.MANAGER);
    expect(result.reason).toContain("15");
  });

  test("b2b_discount always requires manager for non-owner", () => {
    const result = checkApprovalRequired({
      operatorRole: "merch_ops",
      changeType: "b2b_discount",
    });
    expect(result.requiresApproval).toBe(true);
    expect(result.requiredTier).toBe(PricingTier.MANAGER);
    expect(result.reason).toContain("b2b_discount");
  });

  test("viewer always requires approval", () => {
    const result = checkApprovalRequired({
      operatorRole: "finance",
      changeType: "material_cost",
      driftPct: 2,
      affectedCount: 1,
    });
    expect(result.requiresApproval).toBe(true);
    expect(result.requiredTier).toBe(PricingTier.OPERATOR);
    expect(result.reason).toContain("Insufficient");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. B2B applyBestRule Pure Logic Tests
// ═══════════════════════════════════════════════════════════════════

describe("B2B applyBestRule", () => {
  test("pct_discount applies percentage off", () => {
    const rules = [
      { ruleType: "pct_discount", value: 20, productId: null, category: null },
    ];
    const result = applyBestRule(rules, 10000);
    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(8000); // 10000 * (1 - 0.20)
    expect(result!.discountCents).toBe(2000);
  });

  test("fixed_price overrides retail", () => {
    const rules = [
      { ruleType: "fixed_price", value: 7500, productId: null, category: null },
    ];
    const result = applyBestRule(rules, 10000);
    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(7500);
    expect(result!.discountCents).toBe(2500);
  });

  test("cost_plus_override computes from cost", () => {
    const rules = [
      { ruleType: "cost_plus_override", value: 30, productId: null, category: null },
    ];
    // cost=5000, margin=30% → price = 5000 / (1 - 0.30) = 7143
    const result = applyBestRule(rules, 10000, 5000);
    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(Math.round(5000 / 0.7)); // 7143
    expect(result!.discountCents).toBe(10000 - result!.adjustedPriceCents);
  });

  test("product-specific rule wins over category", () => {
    const rules = [
      { ruleType: "pct_discount", value: 10, productId: null, category: "stickers", },
      { ruleType: "pct_discount", value: 25, productId: "prod_123", category: null, },
    ];
    const result = applyBestRule(rules, 10000);
    expect(result).not.toBeNull();
    // product-specific (spec=4) beats category (spec=2) → 25% discount
    expect(result!.adjustedPriceCents).toBe(7500);
    expect(result!.appliedRule.value).toBe(25);
  });

  test("no rules returns null", () => {
    const result = applyBestRule([], 10000);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Profit Tracking Tests
// ═══════════════════════════════════════════════════════════════════

describe("profit tracking", () => {
  test("computeItemProfit with estimated cost", () => {
    const result = computeItemProfit({
      totalPrice: 10000,
      materialCostCents: 0,
      estimatedCostCents: 4000,
      actualCostCents: 0,
      vendorCostCents: 0,
    });
    expect(result.estimatedCostCents).toBe(4000);
    expect(result.estimatedProfitCents).toBe(6000);
    expect(result.estimatedMarginPct).toBe(60);
    expect(result.actualMarginPct).toBeNull();
  });

  test("computeItemProfit with actual cost", () => {
    const result = computeItemProfit({
      totalPrice: 10000,
      materialCostCents: 0,
      estimatedCostCents: 3000,
      actualCostCents: 5000,
      vendorCostCents: 0,
    });
    expect(result.actualCostCents).toBe(5000);
    expect(result.actualProfitCents).toBe(5000);
    expect(result.actualMarginPct).toBe(50);
  });

  test("computeOrderProfit aggregates items", () => {
    const result = computeOrderProfit({
      totalAmount: 20000,
      materialCost: 0,
      laborCost: 0,
      shippingCost: 500,
      items: [
        { totalPrice: 10000, materialCostCents: 0, estimatedCostCents: 2000, actualCostCents: 0, vendorCostCents: 0 },
        { totalPrice: 10000, materialCostCents: 0, estimatedCostCents: 3000, actualCostCents: 0, vendorCostCents: 0 },
      ],
    });
    // 2000 + 3000 + 500 (shipping) = 5500
    expect(result.estimatedCostCents).toBe(5500);
    expect(result.estimatedProfitCents).toBe(14500);
    expect(result.revenueCents).toBe(20000);
    expect(result.hasActualCosts).toBe(false);
  });

  test("detectProfitAlerts flags negative margin", () => {
    const alerts = detectProfitAlerts("order_1", [
      {
        id: "item_1",
        productName: "Loss Leader",
        totalPrice: 5000,
        materialCostCents: 0,
        estimatedCostCents: 8000,
        actualCostCents: 0,
        vendorCostCents: 0,
      },
    ]);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts[0].alertType).toBe("negative_margin");
    expect(alerts[0].message).toContain("Losing money");
  });

  test("detectProfitAlerts flags below floor", () => {
    // 10% margin < 15% floor
    const alerts = detectProfitAlerts("order_1", [
      {
        id: "item_1",
        productName: "Thin Margin",
        totalPrice: 10000,
        materialCostCents: 0,
        estimatedCostCents: 9000,
        actualCostCents: 0,
        vendorCostCents: 0,
      },
    ]);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts[0].alertType).toBe("below_floor");
  });

  test("detectProfitAlerts flags below target", () => {
    // 30% margin < 40% target, but above 15% floor
    const alerts = detectProfitAlerts("order_1", [
      {
        id: "item_1",
        productName: "OK Margin",
        totalPrice: 10000,
        materialCostCents: 0,
        estimatedCostCents: 7000,
        actualCostCents: 0,
        vendorCostCents: 0,
      },
    ]);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts[0].alertType).toBe("below_target");
  });

  test("detectMissingCostAlerts flags fulfilled without actual cost", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [
        {
          id: "item_1",
          productName: "Shipped Item",
          totalPrice: 10000,
          estimatedCostCents: 3000,
          actualCostCents: 0,
          vendorCostCents: 0,
        },
      ],
      "completed",
      "shipped"
    );
    const found = alerts.find((a) => a.alertType === "missing_actual_cost");
    expect(found).toBeDefined();
    expect(found!.message).toContain("Fulfilled but no actual cost entered");
  });

  test("detectMissingCostAlerts flags zero-cost items", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [
        {
          id: "item_1",
          productName: "No Cost Data",
          totalPrice: 8000,
          estimatedCostCents: 0,
          actualCostCents: 0,
          vendorCostCents: 0,
        },
      ],
      "pending",
      "not_started"
    );
    const found = alerts.find((a) => a.alertType === "missing_vendor_cost");
    expect(found).toBeDefined();
    expect(found!.message).toContain("No cost data");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Webhook Helpers Module Integrity
// ═══════════════════════════════════════════════════════════════════

describe("webhook helpers module integrity", () => {
  test("all expected exports exist", () => {
    expect(typeof toNumberOrNull).toBe("function");
    expect(typeof parseSizeRows).toBe("function");
    expect(typeof parseMetadataItems).toBe("function");
    expect(typeof shapeOrderItem).toBe("function");
    expect(typeof shapeProductionJob).toBe("function");
    expect(typeof buildOrderCreatedTimeline).toBe("function");
    expect(typeof buildSystemNote).toBe("function");
    expect(typeof shouldAutoCreateProof).toBe("function");
    expect(typeof getProofImageUrl).toBe("function");
  });
});
