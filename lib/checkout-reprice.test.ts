/**
 * Tests for lib/checkout-reprice.ts — server-side checkout repricing.
 *
 * Covers WORKPLAN B-3:
 *   - Single-size product repricing
 *   - Multi-size (area) product repricing
 *   - Flat addon surcharge
 *   - Per-unit addon surcharge
 *   - Business cards with names > 1
 *   - Rush surcharge application
 *   - Design help fee calculation
 *   - MIN_UNIT_AMOUNT enforcement
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockQuoteProduct = jest.fn();

jest.mock("@/lib/pricing/quote-server.js", () => ({
  quoteProduct: (...args: unknown[]) => mockQuoteProduct(...args),
}));

jest.mock("@/lib/sign-order-config", () => ({
  ACCESSORY_OPTIONS: {
    standMount: { surcharge: 500 },
    wallMount: { surcharge: 300 },
  },
}));

import { repriceItem, calculateDesignHelpFee } from "./checkout-reprice";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeProduct(overrides = {}) {
  return {
    id: "prod_1",
    slug: "test-product",
    name: "Test Product",
    pricingPreset: { config: {} },
    optionsConfig: {},
    ...overrides,
  } as any;
}

function makeItem(overrides = {}) {
  return {
    productId: "prod_1",
    name: "Test Product",
    unitAmount: 100,
    quantity: 50,
    meta: {},
    ...overrides,
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Single-size repricing ──────────────────────────────────────────────────

describe("Single-size repricing", () => {
  test("uses server-side quote, not client unitAmount", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 200, totalCents: 10000 });
    const result = repriceItem(makeProduct(), makeItem({ unitAmount: 999 }));
    expect(result.unitAmount).toBe(200); // server price, not client's 999
    expect(result.lineTotal).toBe(200 * 50);
    expect(result.quantity).toBe(50);
  });

  test("falls back to totalCents / quantity when unitCents missing", () => {
    mockQuoteProduct.mockReturnValue({ totalCents: 5000 });
    const result = repriceItem(makeProduct(), makeItem({ quantity: 50 }));
    expect(result.unitAmount).toBe(100); // 5000 / 50
  });

  test("forwards width/height/material to quoteProduct", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 300, totalCents: 15000 });
    repriceItem(makeProduct(), makeItem({
      meta: { width: "3", height: "4", material: "vinyl" },
    }));
    expect(mockQuoteProduct).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        quantity: 50,
        widthIn: 3,
        heightIn: 4,
        material: "vinyl",
      })
    );
  });

  test("throws for zero price", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 0, totalCents: 0 });
    expect(() => repriceItem(makeProduct(), makeItem())).toThrow("Unable to price");
  });

  test("throws when unit amount below MIN_UNIT_AMOUNT ($0.50)", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 10, totalCents: 500 });
    expect(() => repriceItem(makeProduct(), makeItem())).toThrow("Price too low");
  });
});

// ─── Multi-size repricing ───────────────────────────────────────────────────

describe("Multi-size repricing", () => {
  test("sums line totals across size rows", () => {
    mockQuoteProduct
      .mockReturnValueOnce({ totalCents: 5000 })  // row 1: 25 qty
      .mockReturnValueOnce({ totalCents: 8000 }); // row 2: 50 qty

    const sizeRows = JSON.stringify([
      { width: 2, height: 3, quantity: 25 },
      { width: 4, height: 6, quantity: 50 },
    ]);

    const result = repriceItem(makeProduct(), makeItem({
      meta: { sizeMode: "multi", sizeRows },
    }));

    expect(result.quantity).toBe(75); // 25 + 50
    // totalCents = 5000 + 8000 = 13000, unitAmount = round(13000/75) = 173
    expect(result.unitAmount).toBe(173);
    expect(result.lineTotal).toBe(173 * 75);
  });

  test("applies flat addons only to first row", () => {
    mockQuoteProduct
      .mockReturnValueOnce({ totalCents: 3000 })
      .mockReturnValueOnce({ totalCents: 6000 });

    const result = repriceItem(
      makeProduct({
        optionsConfig: {
          addons: [
            { id: "grommets", type: "flat" },
            { id: "lamination", type: "per_unit" },
          ],
        },
      }),
      makeItem({
        meta: {
          sizeMode: "multi",
          sizeRows: JSON.stringify([
            { width: 2, height: 2, quantity: 10 },
            { width: 3, height: 3, quantity: 20 },
          ]),
          addons: JSON.stringify(["grommets", "lamination"]),
        },
      })
    );

    // First call gets both addons, second only gets per_unit
    const firstCall = mockQuoteProduct.mock.calls[0][1];
    const secondCall = mockQuoteProduct.mock.calls[1][1];
    expect(firstCall.addons).toContain("grommets");
    expect(firstCall.addons).toContain("lamination");
    expect(secondCall.addons).toEqual(["lamination"]); // only per_unit
    expect(result.quantity).toBe(30);
  });
});

// ─── Addon surcharges ───────────────────────────────────────────────────────

describe("Addon surcharges", () => {
  test("per-unit addons forwarded to quoteProduct", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 200, totalCents: 10000 });
    repriceItem(makeProduct(), makeItem({
      meta: { addons: JSON.stringify(["lamination", "round-corners"]) },
    }));
    expect(mockQuoteProduct).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        addons: ["lamination", "round-corners"],
      })
    );
  });

  test("finishing options forwarded", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 200, totalCents: 10000 });
    repriceItem(
      makeProduct({ pricingPreset: { config: { finishings: [{ id: "matte" }] } } }),
      makeItem({
        meta: { finishings: JSON.stringify(["matte"]) },
      })
    );
    expect(mockQuoteProduct).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        finishings: ["matte"],
      })
    );
  });
});

// ─── Business cards multi-name ──────────────────────────────────────────────

describe("Business cards multi-name", () => {
  test("names > 1 forwarded to quoteProduct", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 300, totalCents: 15000 });
    repriceItem(makeProduct(), makeItem({
      meta: { names: "3" },
    }));
    expect(mockQuoteProduct).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ names: 3 })
    );
  });

  test("names = 1 not forwarded (no multiplier)", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 200, totalCents: 10000 });
    repriceItem(makeProduct(), makeItem({
      meta: { names: "1" },
    }));
    const callBody = mockQuoteProduct.mock.calls[0][1];
    expect(callBody.names).toBeUndefined();
  });
});

// ─── Rush surcharge ─────────────────────────────────────────────────────────

describe("Rush surcharge", () => {
  test("applies RUSH_MULTIPLIER (1.3) when rushProduction=true", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 100, totalCents: 5000 });
    const result = repriceItem(makeProduct(), makeItem({
      meta: { rushProduction: "true" },
    }));
    expect(result.rushApplied).toBe(true);
    expect(result.unitAmount).toBe(130); // 100 * 1.3
  });

  test("does NOT double-apply rush when turnaroundMultiplier present", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 150, totalCents: 7500 });
    const result = repriceItem(makeProduct(), makeItem({
      meta: { rushProduction: "true", turnaroundMultiplier: "1.5" },
    }));
    // turnaroundMultiplier is already in the pricing engine
    expect(result.rushApplied).toBe(true);
    expect(result.unitAmount).toBe(150); // no extra 1.3x
  });

  test("rushApplied=false when no rush", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 100, totalCents: 5000 });
    const result = repriceItem(makeProduct(), makeItem());
    expect(result.rushApplied).toBe(false);
    expect(result.unitAmount).toBe(100);
  });
});

// ─── Sign accessory surcharges ──────────────────────────────────────────────

describe("Sign accessory surcharges", () => {
  test("adds hardware surcharge per unit", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 1000, totalCents: 50000 });
    const result = repriceItem(makeProduct(), makeItem({
      quantity: 5,
      meta: { hardware: "standMount" },
    }));
    expect(result.unitAmount).toBe(1500); // 1000 + 500 surcharge
  });
});

// ─── Print-only discount ────────────────────────────────────────────────────

describe("Print-only discount", () => {
  test("applies 35% discount for print-only orders", () => {
    mockQuoteProduct.mockReturnValue({ unitCents: 1000, totalCents: 50000 });
    const result = repriceItem(makeProduct(), makeItem({
      quantity: 5,
      meta: { orderType: "print-only" },
    }));
    // 1000 * (1 - 0.35) = 650
    expect(result.unitAmount).toBe(650);
  });
});

// ─── Design help fee ────────────────────────────────────────────────────────

describe("calculateDesignHelpFee", () => {
  test("charges $45 per item with designHelp=true", () => {
    const result = calculateDesignHelpFee([
      { meta: { designHelp: true } },
      { meta: { designHelp: true } },
      { meta: {} },
    ]);
    expect(result.count).toBe(2);
    expect(result.totalCents).toBe(9000); // 2 × 4500
  });

  test("handles designHelp='true' string", () => {
    const result = calculateDesignHelpFee([
      { meta: { designHelp: "true" } },
    ]);
    expect(result.count).toBe(1);
    expect(result.totalCents).toBe(4500);
  });

  test("returns zero for no design help", () => {
    const result = calculateDesignHelpFee([
      { meta: {} },
      { meta: null },
    ]);
    expect(result.count).toBe(0);
    expect(result.totalCents).toBe(0);
  });
});
