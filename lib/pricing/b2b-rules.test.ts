// lib/pricing/b2b-rules.test.ts
// Tests for B2B rule system: applyBestRule priority, resolveB2BPrice, and rule-type calculations.

import { applyBestRule, resolveB2BPrice } from "./b2b-rules";

// ── Mock Prisma ──
jest.mock("@/lib/prisma", () => ({
  prisma: {
    b2BPriceRule: {
      findMany: jest.fn(),
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { prisma } = jest.requireMock("@/lib/prisma") as any;

// ── Helper: build a mock rule ──
function mockRule(overrides: Record<string, unknown> = {}) {
  return {
    id: "rule-1",
    ruleType: "pct_discount",
    value: 10,
    isActive: true,
    userId: null,
    companyName: null,
    partnerTier: null,
    productId: null,
    productSlug: null,
    category: null,
    templateKey: null,
    minQty: null,
    maxQty: null,
    note: null,
    validFrom: null,
    validUntil: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// applyBestRule — priority tests
// ═══════════════════════════════════════════════════════════════════

describe("applyBestRule", () => {
  it("returns null when no rules provided", () => {
    expect(applyBestRule([], 10000)).toBeNull();
  });

  it("product-specific rule wins over category rule", () => {
    const productRule = mockRule({
      id: "prod-rule",
      productId: "prod-1",
      category: null,
      ruleType: "pct_discount",
      value: 5,
    });
    const categoryRule = mockRule({
      id: "cat-rule",
      productId: null,
      category: "stickers",
      ruleType: "pct_discount",
      value: 20,
    });

    const result = applyBestRule([categoryRule, productRule], 10000);
    expect(result).not.toBeNull();
    expect(result!.appliedRule.id).toBe("prod-rule");
  });

  it("product+category rule wins over product-only rule", () => {
    const productOnly = mockRule({
      id: "prod-only",
      productId: "prod-1",
      category: null,
      ruleType: "pct_discount",
      value: 5,
    });
    const productAndCategory = mockRule({
      id: "prod-cat",
      productId: "prod-1",
      category: "stickers",
      ruleType: "pct_discount",
      value: 10,
    });

    const result = applyBestRule([productOnly, productAndCategory], 10000);
    expect(result).not.toBeNull();
    // productId(+4) + category(+2) = 6 vs productId(+4) = 4
    expect(result!.appliedRule.id).toBe("prod-cat");
  });

  it("category rule wins over global rule (no product, no category)", () => {
    const globalRule = mockRule({
      id: "global",
      productId: null,
      category: null,
      ruleType: "pct_discount",
      value: 3,
    });
    const categoryRule = mockRule({
      id: "cat-rule",
      productId: null,
      category: "banners",
      ruleType: "pct_discount",
      value: 15,
    });

    const result = applyBestRule([globalRule, categoryRule], 10000);
    expect(result).not.toBeNull();
    expect(result!.appliedRule.id).toBe("cat-rule");
  });

  // ── pct_discount calculation ──
  it("pct_discount: applies percentage off retail", () => {
    const rule = mockRule({ ruleType: "pct_discount", value: 20 });
    const result = applyBestRule([rule], 10000);
    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(8000); // 10000 * 0.80
    expect(result!.discountCents).toBe(2000);
  });

  it("pct_discount: 0% leaves price unchanged", () => {
    const rule = mockRule({ ruleType: "pct_discount", value: 0 });
    const result = applyBestRule([rule], 5000);
    expect(result!.adjustedPriceCents).toBe(5000);
    expect(result!.discountCents).toBe(0);
  });

  it("pct_discount: 100% gives zero price", () => {
    const rule = mockRule({ ruleType: "pct_discount", value: 100 });
    const result = applyBestRule([rule], 5000);
    expect(result!.adjustedPriceCents).toBe(0);
    expect(result!.discountCents).toBe(5000);
  });

  // ── fixed_price calculation ──
  it("fixed_price: sets exact price in cents", () => {
    const rule = mockRule({ ruleType: "fixed_price", value: 7500 });
    const result = applyBestRule([rule], 10000);
    expect(result!.adjustedPriceCents).toBe(7500);
    expect(result!.discountCents).toBe(2500);
  });

  it("fixed_price: can be higher than retail (negative discount)", () => {
    const rule = mockRule({ ruleType: "fixed_price", value: 12000 });
    const result = applyBestRule([rule], 10000);
    expect(result!.adjustedPriceCents).toBe(12000);
    expect(result!.discountCents).toBe(-2000);
  });

  // ── cost_plus_override calculation ──
  it("cost_plus_override: computes price from cost and margin %", () => {
    // margin 25%: price = cost / (1 - 0.25) = 4000 / 0.75 = 5333.33 → 5333
    const rule = mockRule({ ruleType: "cost_plus_override", value: 25 });
    const result = applyBestRule([rule], 10000, 4000);
    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(5333);
  });

  it("cost_plus_override: falls back to retail when no costCents", () => {
    const rule = mockRule({ ruleType: "cost_plus_override", value: 25 });
    const result = applyBestRule([rule], 10000);
    // No cost provided, adjustedPrice stays at retail
    expect(result!.adjustedPriceCents).toBe(10000);
    expect(result!.discountCents).toBe(0);
  });

  it("cost_plus_override: falls back to retail when costCents is 0", () => {
    const rule = mockRule({ ruleType: "cost_plus_override", value: 25 });
    const result = applyBestRule([rule], 10000, 0);
    expect(result!.adjustedPriceCents).toBe(10000);
  });

  // ── margin_override calculation ──
  it("margin_override: computes price from cost and exact margin %", () => {
    // margin 40%: price = cost / (1 - 0.40) = 3000 / 0.60 = 5000
    const rule = mockRule({ ruleType: "margin_override", value: 40 });
    const result = applyBestRule([rule], 10000, 3000);
    expect(result!.adjustedPriceCents).toBe(5000);
    expect(result!.discountCents).toBe(5000);
  });

  it("margin_override: falls back to retail when no costCents", () => {
    const rule = mockRule({ ruleType: "margin_override", value: 40 });
    const result = applyBestRule([rule], 8000);
    expect(result!.adjustedPriceCents).toBe(8000);
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolveB2BPrice
// ═══════════════════════════════════════════════════════════════════

describe("resolveB2BPrice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when no B2B params provided (no userId, companyName, partnerTier)", async () => {
    const result = await resolveB2BPrice({
      retailPriceCents: 10000,
    });
    expect(result).toBeNull();
    // Should NOT even call the DB
    expect(prisma.b2BPriceRule.findMany).not.toHaveBeenCalled();
  });

  it("returns null when no rules match", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([]);

    const result = await resolveB2BPrice({
      userId: "user-123",
      retailPriceCents: 10000,
    });
    expect(result).toBeNull();
  });

  it("returns adjusted price when a rule matches", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "rule-abc",
        userId: "user-123",
        ruleType: "pct_discount",
        value: 15,
        note: "VIP discount",
      }),
    ]);

    const result = await resolveB2BPrice({
      userId: "user-123",
      retailPriceCents: 10000,
    });

    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(8500); // 15% off 10000
    expect(result!.discountCents).toBe(1500);
    expect(result!.appliedRule.ruleType).toBe("pct_discount");
    expect(result!.appliedRule.value).toBe(15);
    expect(result!.appliedRule.id).toBe("rule-abc");
    expect(result!.appliedRule.note).toBe("VIP discount");
  });

  it("filters rules by product match", async () => {
    // Return a rule that targets a different product — should be filtered out
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "wrong-product",
        userId: "user-123",
        productId: "other-product",
        ruleType: "pct_discount",
        value: 50,
      }),
    ]);

    const result = await resolveB2BPrice({
      userId: "user-123",
      productId: "my-product",
      retailPriceCents: 10000,
    });

    expect(result).toBeNull();
  });

  it("filters rules by category match", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "wrong-cat",
        userId: "user-123",
        category: "banners",
        ruleType: "pct_discount",
        value: 30,
      }),
    ]);

    const result = await resolveB2BPrice({
      userId: "user-123",
      category: "stickers",
      retailPriceCents: 10000,
    });

    expect(result).toBeNull();
  });

  it("quantity range filtering: excludes rule below minQty", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "min-qty-rule",
        userId: "user-123",
        ruleType: "pct_discount",
        value: 10,
        minQty: 500,
        maxQty: null,
      }),
    ]);

    const result = await resolveB2BPrice({
      userId: "user-123",
      quantity: 100, // below minQty of 500
      retailPriceCents: 10000,
    });

    expect(result).toBeNull();
  });

  it("quantity range filtering: excludes rule above maxQty", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "max-qty-rule",
        userId: "user-123",
        ruleType: "pct_discount",
        value: 10,
        minQty: null,
        maxQty: 200,
      }),
    ]);

    const result = await resolveB2BPrice({
      userId: "user-123",
      quantity: 500, // above maxQty of 200
      retailPriceCents: 10000,
    });

    expect(result).toBeNull();
  });

  it("quantity range filtering: includes rule within range", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "in-range-rule",
        userId: "user-123",
        ruleType: "pct_discount",
        value: 10,
        minQty: 50,
        maxQty: 500,
      }),
    ]);

    const result = await resolveB2BPrice({
      userId: "user-123",
      quantity: 250, // within 50-500
      retailPriceCents: 10000,
    });

    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(9000);
  });

  it("passes costCents for cost-based rule types", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "margin-rule",
        userId: "user-123",
        ruleType: "margin_override",
        value: 30, // 30% margin
      }),
    ]);

    const result = await resolveB2BPrice({
      userId: "user-123",
      retailPriceCents: 10000,
      costCents: 5000,
    });

    expect(result).not.toBeNull();
    // price = 5000 / (1 - 0.30) = 5000 / 0.70 = 7142.857 → 7143
    expect(result!.adjustedPriceCents).toBe(7143);
  });

  it("resolves by companyName", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "company-rule",
        companyName: "Acme Corp",
        ruleType: "pct_discount",
        value: 12,
      }),
    ]);

    const result = await resolveB2BPrice({
      companyName: "Acme Corp",
      retailPriceCents: 10000,
    });

    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(8800);
    expect(result!.appliedRule.id).toBe("company-rule");
  });

  it("resolves by partnerTier", async () => {
    prisma.b2BPriceRule.findMany.mockResolvedValue([
      mockRule({
        id: "tier-rule",
        partnerTier: "gold",
        ruleType: "pct_discount",
        value: 20,
      }),
    ]);

    const result = await resolveB2BPrice({
      partnerTier: "gold",
      retailPriceCents: 10000,
    });

    expect(result).not.toBeNull();
    expect(result!.adjustedPriceCents).toBe(8000);
    expect(result!.appliedRule.id).toBe("tier-rule");
  });
});
