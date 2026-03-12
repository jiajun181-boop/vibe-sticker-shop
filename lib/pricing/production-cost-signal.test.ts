/**
 * Tests for production-cost-signal — the pricing→production truth bridge.
 *
 * Validates that operators get accurate health signals without
 * being exposed to raw pricing data.
 */

import { computeCostSignal, computeOrderCostSignals } from "./production-cost-signal";

function makeItem(overrides: Partial<{
  id: string;
  productName: string;
  totalPrice: number;
  materialCostCents: number;
  estimatedCostCents: number;
  actualCostCents: number;
  vendorCostCents: number;
}> = {}) {
  return {
    id: "item-1",
    productName: "Test Sticker",
    totalPrice: 10000,
    materialCostCents: 2000,
    estimatedCostCents: 3000,
    actualCostCents: 0,
    vendorCostCents: 0,
    ...overrides,
  };
}

describe("computeCostSignal", () => {
  test("returns normal for a healthy-margin item", () => {
    const item = makeItem({
      totalPrice: 10000,
      estimatedCostCents: 3000, // 70% margin — well above 40% target
    });
    const signal = computeCostSignal(item, "order-1", "processing", "printing");
    expect(signal.level).toBe("normal");
    expect(signal.reason).toBe("Pricing OK");
    expect(signal.isNegativeMargin).toBe(false);
    expect(signal.isBelowFloor).toBe(false);
    expect(signal.hasMissingCost).toBe(false);
    expect(signal.alertCount).toBe(0);
  });

  test("returns needs-review for negative margin", () => {
    const item = makeItem({
      totalPrice: 1000,
      estimatedCostCents: 5000, // Losing money
    });
    const signal = computeCostSignal(item, "order-1", "processing", "printing");
    expect(signal.level).toBe("needs-review");
    expect(signal.isNegativeMargin).toBe(true);
    expect(signal.alertCount).toBeGreaterThan(0);
  });

  test("returns needs-review for below-floor margin", () => {
    const item = makeItem({
      totalPrice: 10000,
      estimatedCostCents: 9000, // 10% margin, below 15% floor
    });
    const signal = computeCostSignal(item, "order-1", "processing", "printing");
    expect(signal.level).toBe("needs-review");
    expect(signal.isBelowFloor).toBe(true);
  });

  test("returns missing-cost for fulfilled item without actual cost", () => {
    const item = makeItem({
      estimatedCostCents: 3000,
      actualCostCents: 0,
    });
    // Production status "shipped" means fulfilled → should flag missing actual cost
    const signal = computeCostSignal(item, "order-1", "processing", "shipped");
    expect(signal.level).toBe("missing-cost");
    expect(signal.hasMissingCost).toBe(true);
  });

  test("returns missing-cost for item with no cost data at all", () => {
    const item = makeItem({
      totalPrice: 5000,
      materialCostCents: 0,
      estimatedCostCents: 0,
      actualCostCents: 0,
      vendorCostCents: 0,
    });
    const signal = computeCostSignal(item, "order-1", "processing", "printing");
    expect(signal.hasMissingCost).toBe(true);
  });

  test("needs-review takes priority over missing-cost", () => {
    // Item that is both losing money AND missing actual cost
    const item = makeItem({
      totalPrice: 1000,
      estimatedCostCents: 5000, // negative margin
      actualCostCents: 0,
    });
    const signal = computeCostSignal(item, "order-1", "processing", "shipped");
    expect(signal.level).toBe("needs-review"); // negative margin is worse
  });

  test("does not expose dollar amounts in signal", () => {
    const item = makeItem({ totalPrice: 99999, estimatedCostCents: 88888 });
    const signal = computeCostSignal(item, "order-1", "processing", "printing");
    // The signal object should NOT contain any dollar amounts
    const json = JSON.stringify(signal);
    expect(json).not.toContain("99999");
    expect(json).not.toContain("88888");
  });
});

describe("computeOrderCostSignals", () => {
  test("aggregate is normal when all items are normal", () => {
    const items = [
      makeItem({ id: "i1", estimatedCostCents: 2000 }),
      makeItem({ id: "i2", estimatedCostCents: 3000 }),
    ];
    const result = computeOrderCostSignals(items, "order-1", "processing", "printing");
    expect(result.aggregate.level).toBe("normal");
    expect(result.perItem).toHaveLength(2);
    expect(result.perItem.every(s => s.level === "normal")).toBe(true);
  });

  test("aggregate escalates to needs-review if any item is needs-review", () => {
    const items = [
      makeItem({ id: "i1", estimatedCostCents: 2000 }), // normal
      makeItem({ id: "i2", totalPrice: 1000, estimatedCostCents: 5000 }), // negative margin
    ];
    const result = computeOrderCostSignals(items, "order-1", "processing", "printing");
    expect(result.aggregate.level).toBe("needs-review");
    expect(result.aggregate.isNegativeMargin).toBe(true);
  });

  test("aggregate escalates to missing-cost if any item is missing", () => {
    const items = [
      makeItem({ id: "i1", estimatedCostCents: 2000 }), // normal
      makeItem({ id: "i2", estimatedCostCents: 3000, actualCostCents: 0 }), // missing actual
    ];
    const result = computeOrderCostSignals(items, "order-1", "processing", "shipped");
    expect(result.aggregate.level).toBe("missing-cost");
  });

  test("aggregate alert count is sum of all items", () => {
    const items = [
      makeItem({ id: "i1", totalPrice: 1000, estimatedCostCents: 5000 }), // alerts
      makeItem({ id: "i2", totalPrice: 1000, estimatedCostCents: 5000 }), // alerts
    ];
    const result = computeOrderCostSignals(items, "order-1", "processing", "printing");
    expect(result.aggregate.alertCount).toBeGreaterThanOrEqual(2);
  });
});
