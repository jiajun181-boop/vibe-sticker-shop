// lib/pricing/profit-tracking.test.ts
// Tests for profit computation, alert detection, variance, and margin comparison — pure functions, no DB.

import {
  computeItemProfit,
  computeOrderProfit,
  computeVarianceDetail,
  computeMarginComparison,
  detectProfitAlerts,
  detectMissingCostAlerts,
} from "./profit-tracking";

describe("computeItemProfit", () => {
  it("computes estimated profit correctly", () => {
    const result = computeItemProfit({
      totalPrice: 10000,
      materialCostCents: 2000,
      estimatedCostCents: 3000,
      actualCostCents: 0,
      vendorCostCents: 0,
    });
    expect(result.estimatedCostCents).toBe(3000);
    expect(result.estimatedProfitCents).toBe(7000);
    expect(result.estimatedMarginPct).toBe(70);
    expect(result.actualMarginPct).toBeNull();
  });

  it("computes actual profit when actualCostCents set", () => {
    const result = computeItemProfit({
      totalPrice: 10000,
      materialCostCents: 0,
      estimatedCostCents: 3000,
      actualCostCents: 4500,
      vendorCostCents: 0,
    });
    expect(result.actualProfitCents).toBe(5500);
    expect(result.actualMarginPct).toBe(55);
  });

  it("falls back to materialCostCents when estimatedCost is 0", () => {
    const result = computeItemProfit({
      totalPrice: 5000,
      materialCostCents: 1000,
      estimatedCostCents: 0,
      actualCostCents: 0,
      vendorCostCents: 0,
    });
    expect(result.estimatedCostCents).toBe(1000);
    expect(result.estimatedProfitCents).toBe(4000);
  });

  it("falls back to vendorCostCents", () => {
    const result = computeItemProfit({
      totalPrice: 5000,
      materialCostCents: 0,
      estimatedCostCents: 0,
      actualCostCents: 0,
      vendorCostCents: 2500,
    });
    expect(result.estimatedCostCents).toBe(2500);
  });

  it("handles zero totalPrice", () => {
    const result = computeItemProfit({
      totalPrice: 0,
      materialCostCents: 100,
      estimatedCostCents: 100,
      actualCostCents: 0,
      vendorCostCents: 0,
    });
    expect(result.estimatedMarginPct).toBe(0);
  });
});

describe("computeOrderProfit", () => {
  it("sums item-level costs", () => {
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
    // 2000 + 3000 + 500 shipping = 5500
    expect(result.estimatedCostCents).toBe(5500);
    expect(result.estimatedProfitCents).toBe(14500);
    expect(result.hasActualCosts).toBe(false);
  });

  it("uses order-level costs as fallback when items have no cost data", () => {
    // When all items have zero cost, the function first sums items (0) + shipping (500) = 500,
    // then sees estCost=500 which is > 0 so the order-level fallback doesn't kick in.
    // Let's test with shipping=0 so the fallback triggers.
    const result = computeOrderProfit({
      totalAmount: 15000,
      materialCost: 3000,
      laborCost: 1000,
      shippingCost: 0,
      items: [
        { totalPrice: 15000, materialCostCents: 0, estimatedCostCents: 0, actualCostCents: 0, vendorCostCents: 0 },
      ],
    });
    expect(result.estimatedCostCents).toBe(4000); // 3000 + 1000 + 0 shipping
  });

  it("detects actual costs when present", () => {
    const result = computeOrderProfit({
      totalAmount: 20000,
      materialCost: 0,
      laborCost: 0,
      shippingCost: 0,
      items: [
        { totalPrice: 20000, materialCostCents: 0, estimatedCostCents: 5000, actualCostCents: 7000, vendorCostCents: 0 },
      ],
    });
    expect(result.hasActualCosts).toBe(true);
    expect(result.actualCostCents).toBe(7000);
    expect(result.actualMarginPct).toBe(65);
  });
});

describe("detectProfitAlerts", () => {
  const makeItem = (overrides = {}) => ({
    id: "item_1",
    productName: "Test Product",
    totalPrice: 10000,
    materialCostCents: 0,
    estimatedCostCents: 3000,
    actualCostCents: 0,
    vendorCostCents: 0,
    ...overrides,
  });

  it("returns no alerts for healthy margins", () => {
    const alerts = detectProfitAlerts("order_1", [makeItem()]);
    expect(alerts).toHaveLength(0);
  });

  it("detects negative margin", () => {
    const alerts = detectProfitAlerts("order_1", [
      makeItem({ estimatedCostCents: 12000 }),
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("negative_margin");
  });

  it("detects below floor margin", () => {
    const alerts = detectProfitAlerts("order_1", [
      makeItem({ estimatedCostCents: 9000 }), // 10% margin < 15% floor
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("below_floor");
  });

  it("detects below target margin", () => {
    const alerts = detectProfitAlerts("order_1", [
      makeItem({ estimatedCostCents: 7000 }), // 30% margin < 40% target
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("below_target");
  });

  it("detects actual cost exceeds revenue", () => {
    const alerts = detectProfitAlerts("order_1", [
      makeItem({ estimatedCostCents: 3000, actualCostCents: 11000 }),
    ]);
    // Should get below_target (estimated 70% is fine) but also cost_exceeds_revenue
    const costAlert = alerts.find((a) => a.alertType === "cost_exceeds_revenue");
    expect(costAlert).toBeDefined();
  });

  it("uses custom thresholds", () => {
    // 50% margin with 60% target → below target
    const alerts = detectProfitAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 5000 })],
      60, // target
      30  // floor
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("below_target");
  });
});

describe("detectMissingCostAlerts", () => {
  const makeItem = (overrides: Record<string, unknown> = {}) => ({
    id: "item_1",
    productName: "Test Product",
    totalPrice: 10000,
    estimatedCostCents: 3000,
    actualCostCents: 0,
    vendorCostCents: 0,
    ...overrides,
  });

  it("detects missing actual cost after fulfillment", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 3000, actualCostCents: 0 })],
      "completed",
      "shipped"
    );
    const found = alerts.find((a) => a.alertType === "missing_actual_cost");
    expect(found).toBeDefined();
    expect(found!.message).toContain("Fulfilled but no actual cost entered");
  });

  it("detects missing actual cost for ready_to_ship status", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 5000, actualCostCents: 0 })],
      "processing",
      "ready_to_ship"
    );
    const found = alerts.find((a) => a.alertType === "missing_actual_cost");
    expect(found).toBeDefined();
  });

  it("detects missing actual cost for completed status", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 5000, actualCostCents: 0 })],
      "completed",
      "completed"
    );
    const found = alerts.find((a) => a.alertType === "missing_actual_cost");
    expect(found).toBeDefined();
  });

  it("does not flag missing actual cost when actual cost is present", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 3000, actualCostCents: 3200 })],
      "completed",
      "shipped"
    );
    const found = alerts.find((a) => a.alertType === "missing_actual_cost");
    expect(found).toBeUndefined();
  });

  it("does not flag missing actual cost for orders not yet fulfilled", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 3000, actualCostCents: 0 })],
      "processing",
      "in_progress"
    );
    const found = alerts.find((a) => a.alertType === "missing_actual_cost");
    expect(found).toBeUndefined();
  });

  it("detects missing vendor cost for outsourced products", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 0, actualCostCents: 0, vendorCostCents: 0, totalPrice: 8000 })],
      "pending",
      "not_started"
    );
    const found = alerts.find((a) => a.alertType === "missing_vendor_cost");
    expect(found).toBeDefined();
    expect(found!.message).toContain("No cost data");
  });

  it("does not flag missing vendor cost when estimated cost exists", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 3000, vendorCostCents: 0 })],
      "pending",
      "not_started"
    );
    const found = alerts.find((a) => a.alertType === "missing_vendor_cost");
    expect(found).toBeUndefined();
  });

  it("does not flag missing vendor cost when vendor cost exists", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 0, vendorCostCents: 2000 })],
      "pending",
      "not_started"
    );
    const found = alerts.find((a) => a.alertType === "missing_vendor_cost");
    expect(found).toBeUndefined();
  });

  it("does not flag items with zero totalPrice", () => {
    const alerts = detectMissingCostAlerts(
      "order_1",
      [makeItem({ estimatedCostCents: 0, vendorCostCents: 0, totalPrice: 0 })],
      "pending",
      "not_started"
    );
    const found = alerts.find((a) => a.alertType === "missing_vendor_cost");
    expect(found).toBeUndefined();
  });

  it("returns both alert types when applicable", () => {
    // Fulfilled order with an item that has estimated cost but no actual cost,
    // plus another item with no cost data at all
    const alerts = detectMissingCostAlerts(
      "order_1",
      [
        makeItem({ id: "item_a", estimatedCostCents: 3000, actualCostCents: 0, vendorCostCents: 0 }),
        makeItem({ id: "item_b", estimatedCostCents: 0, actualCostCents: 0, vendorCostCents: 0, totalPrice: 5000 }),
      ],
      "completed",
      "shipped"
    );
    const missingActual = alerts.filter((a) => a.alertType === "missing_actual_cost");
    const missingVendor = alerts.filter((a) => a.alertType === "missing_vendor_cost");
    expect(missingActual.length).toBeGreaterThanOrEqual(1);
    expect(missingVendor.length).toBeGreaterThanOrEqual(1);
  });
});

// ── computeVarianceDetail ───────────────────────────────────────

describe("computeVarianceDetail", () => {
  it("detects over-budget variance", () => {
    const v = computeVarianceDetail(3000, 4000);
    expect(v.estimatedCents).toBe(3000);
    expect(v.actualCents).toBe(4000);
    expect(v.varianceCents).toBe(1000);
    expect(v.variancePct).toBeCloseTo(33.33, 1);
    expect(v.direction).toBe("over");
  });

  it("detects under-budget variance", () => {
    const v = computeVarianceDetail(5000, 3000);
    expect(v.varianceCents).toBe(-2000);
    expect(v.variancePct).toBe(-40);
    expect(v.direction).toBe("under");
  });

  it("detects exact match", () => {
    const v = computeVarianceDetail(2000, 2000);
    expect(v.varianceCents).toBe(0);
    expect(v.variancePct).toBe(0);
    expect(v.direction).toBe("match");
  });

  it("handles zero estimated cost with non-zero actual", () => {
    const v = computeVarianceDetail(0, 1500);
    expect(v.varianceCents).toBe(1500);
    expect(v.variancePct).toBe(100);
    expect(v.direction).toBe("over");
  });

  it("handles both zero", () => {
    const v = computeVarianceDetail(0, 0);
    expect(v.varianceCents).toBe(0);
    expect(v.variancePct).toBe(0);
    expect(v.direction).toBe("match");
  });
});

// ── computeMarginComparison ─────────────────────────────────────

describe("computeMarginComparison", () => {
  it("computes comparison with actual data", () => {
    const result = computeMarginComparison({
      totalAmount: 10000,
      items: [
        { totalPrice: 10000, estimatedCostCents: 3000, actualCostCents: 4000 },
      ],
    });
    expect(result.estimatedMarginPct).toBe(70);
    expect(result.actualMarginPct).toBe(60);
    expect(result.marginDriftPct).toBe(-10);
    expect(result.hasActualData).toBe(true);
    expect(result.itemCount).toBe(1);
    expect(result.itemsWithActual).toBe(1);
    expect(result.estimatedCostCents).toBe(3000);
    expect(result.actualCostCents).toBe(4000);
    expect(result.revenueCents).toBe(10000);
  });

  it("returns null actual when no actual costs", () => {
    const result = computeMarginComparison({
      totalAmount: 10000,
      items: [
        { totalPrice: 10000, estimatedCostCents: 3000, actualCostCents: 0 },
      ],
    });
    expect(result.actualMarginPct).toBeNull();
    expect(result.marginDriftPct).toBeNull();
    expect(result.hasActualData).toBe(false);
    expect(result.itemsWithActual).toBe(0);
  });

  it("handles multiple items with partial actual data", () => {
    const result = computeMarginComparison({
      totalAmount: 20000,
      items: [
        { totalPrice: 10000, estimatedCostCents: 3000, actualCostCents: 3500 },
        { totalPrice: 10000, estimatedCostCents: 4000, actualCostCents: 0 },
      ],
    });
    expect(result.itemCount).toBe(2);
    expect(result.itemsWithActual).toBe(1);
    expect(result.hasActualData).toBe(true);
    // actual cost only from first item: 3500
    expect(result.actualCostCents).toBe(3500);
    expect(result.estimatedCostCents).toBe(7000);
  });

  it("handles zero revenue", () => {
    const result = computeMarginComparison({
      totalAmount: 0,
      items: [
        { totalPrice: 0, estimatedCostCents: 100, actualCostCents: 100 },
      ],
    });
    expect(result.estimatedMarginPct).toBe(0);
    // With zero revenue, actual margin can't be computed meaningfully
    expect(result.actualMarginPct).toBeNull();
    expect(result.revenueCents).toBe(0);
  });

  it("computes positive drift when actual is cheaper", () => {
    const result = computeMarginComparison({
      totalAmount: 10000,
      items: [
        { totalPrice: 10000, estimatedCostCents: 5000, actualCostCents: 2000 },
      ],
    });
    expect(result.estimatedMarginPct).toBe(50);
    expect(result.actualMarginPct).toBe(80);
    expect(result.marginDriftPct).toBe(30); // positive = margin improved
  });
});
