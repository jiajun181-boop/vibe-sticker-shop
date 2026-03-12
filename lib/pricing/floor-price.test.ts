// lib/pricing/floor-price.test.ts
// Tests for floor price policy — pure functions, no DB needed.

import { computeFloorPrice, FLOOR_DEFAULTS, resolveFloorPrice } from "./floor-price";

// Mock prisma so the module loads without DB
jest.mock("@/lib/prisma", () => ({ prisma: { setting: { findMany: jest.fn().mockResolvedValue([]) } } }));

// ── computeFloorPrice (pure) ─────────────────────────────────────

describe("computeFloorPrice", () => {
  it("returns 0 when cost is 0", () => {
    expect(computeFloorPrice(0, FLOOR_DEFAULTS)).toBe(0);
  });

  it("returns 0 when cost is negative", () => {
    expect(computeFloorPrice(-100, FLOOR_DEFAULTS)).toBe(0);
  });

  it("uses max(fixedProfit, marginRate) formula", () => {
    // cost=1000, fixedProfit=500, marginRate=0.15
    // floorFromFixed = 1000 + 500 = 1500
    // floorFromMargin = ceil(1000 / 0.85) = 1177
    // max(1500, 1177) = 1500
    expect(computeFloorPrice(1000, FLOOR_DEFAULTS)).toBe(1500);
  });

  it("margin-based floor wins for high-cost items", () => {
    // cost=10000, fixedProfit=500, marginRate=0.15
    // floorFromFixed = 10000 + 500 = 10500
    // floorFromMargin = ceil(10000 / 0.85) = 11765
    // max(10500, 11765) = 11765
    expect(computeFloorPrice(10000, FLOOR_DEFAULTS)).toBe(11765);
  });

  it("respects custom policy with higher margin", () => {
    const policy = { minFixedProfitCents: 200, minMarginRate: 0.30 };
    // cost=5000
    // floorFromFixed = 5000 + 200 = 5200
    // floorFromMargin = ceil(5000 / 0.70) = 7143
    // max(5200, 7143) = 7143
    expect(computeFloorPrice(5000, policy)).toBe(7143);
  });

  it("respects custom policy with higher fixed profit", () => {
    const policy = { minFixedProfitCents: 10000, minMarginRate: 0.05 };
    // cost=5000
    // floorFromFixed = 5000 + 10000 = 15000
    // floorFromMargin = ceil(5000 / 0.95) = 5264
    // max(15000, 5264) = 15000
    expect(computeFloorPrice(5000, policy)).toBe(15000);
  });

  it("falls back to FLOOR_DEFAULTS when policy fields are missing", () => {
    // Empty policy → uses defaults
    expect(computeFloorPrice(1000, {})).toBe(computeFloorPrice(1000, FLOOR_DEFAULTS));
  });

  it("handles marginRate=0 gracefully", () => {
    // marginRate=0 → division by 1 → floorFromMargin = cost
    const policy = { minFixedProfitCents: 100, minMarginRate: 0 };
    // floorFromFixed = 1000 + 100 = 1100
    // floorFromMargin = 1000 (marginRate=0 → totalCostCents returned)
    expect(computeFloorPrice(1000, policy)).toBe(1100);
  });

  it("handles marginRate close to 1 safely", () => {
    const policy = { minFixedProfitCents: 100, minMarginRate: 0.99 };
    // floorFromMargin = ceil(1000 / 0.01) = 100000
    expect(computeFloorPrice(1000, policy)).toBe(100000);
  });
});

// ── resolveFloorPrice (priority chain) ───────────────────────────

describe("resolveFloorPrice", () => {
  it("returns policySource='none' when cost is 0", async () => {
    const result = await resolveFloorPrice(0, {}, null, {});
    expect(result.policySource).toBe("none");
    expect(result.priceCents).toBe(0);
  });

  it("uses product override when present", async () => {
    const product = {
      pricingConfig: { floorPolicy: { minFixedProfitCents: 1000, minMarginRate: 0.20 } },
    };
    const result = await resolveFloorPrice(5000, product, "vinyl_print", {});
    expect(result.policySource).toBe("product");
    // floorFromFixed = 5000 + 1000 = 6000
    // floorFromMargin = ceil(5000 / 0.80) = 6250
    expect(result.priceCents).toBe(6250);
  });

  it("uses template override when no product policy", async () => {
    const settings = {
      floor_policy_template_vinyl_print: { minFixedProfitCents: 300, minMarginRate: 0.25 },
    };
    const result = await resolveFloorPrice(2000, {}, "vinyl_print", settings);
    expect(result.policySource).toBe("template");
    // floorFromFixed = 2000 + 300 = 2300
    // floorFromMargin = ceil(2000 / 0.75) = 2667
    expect(result.priceCents).toBe(2667);
  });

  it("uses global setting when no product or template policy", async () => {
    const settings = {
      floor_policy_global: { minFixedProfitCents: 800, minMarginRate: 0.10 },
    };
    const result = await resolveFloorPrice(3000, {}, "vinyl_print", settings);
    expect(result.policySource).toBe("global");
    // floorFromFixed = 3000 + 800 = 3800
    // floorFromMargin = ceil(3000 / 0.90) = 3334
    expect(result.priceCents).toBe(3800);
  });

  it("falls back to hardcoded defaults when no settings at all", async () => {
    const result = await resolveFloorPrice(1000, {}, null, {});
    expect(result.policySource).toBe("global");
    expect(result.priceCents).toBe(computeFloorPrice(1000, FLOOR_DEFAULTS));
  });

  it("product override takes priority over template and global", async () => {
    const product = {
      pricingConfig: { floorPolicy: { minFixedProfitCents: 9999, minMarginRate: 0.01 } },
    };
    const settings = {
      floor_policy_template_vinyl_print: { minFixedProfitCents: 100, minMarginRate: 0.50 },
      floor_policy_global: { minFixedProfitCents: 200, minMarginRate: 0.30 },
    };
    const result = await resolveFloorPrice(1000, product, "vinyl_print", settings);
    expect(result.policySource).toBe("product");
    // floorFromFixed = 1000 + 9999 = 10999
    expect(result.priceCents).toBe(10999);
  });

  it("handles stringified pricingConfig", async () => {
    const product = {
      pricingConfig: JSON.stringify({ floorPolicy: { minFixedProfitCents: 500, minMarginRate: 0.15 } }),
    };
    const result = await resolveFloorPrice(1000, product, null, {});
    expect(result.policySource).toBe("product");
    expect(result.priceCents).toBe(computeFloorPrice(1000, { minFixedProfitCents: 500, minMarginRate: 0.15 }));
  });
});
