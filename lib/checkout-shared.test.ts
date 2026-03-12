/**
 * Tests for lib/checkout-shared.ts — shared pre-settlement helpers.
 *
 * These tests verify that coupon validation, B2B discount resolution,
 * and product lookup behave identically regardless of which checkout
 * path (Stripe/Invoice/Interac) calls them.
 */

// Mock prisma before importing the module under test
const mockPrisma = {
  coupon: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock B2B rules
const mockResolveB2BPrice = jest.fn();
jest.mock("@/lib/pricing/b2b-rules", () => ({
  resolveB2BPrice: (...args: unknown[]) => mockResolveB2BPrice(...args),
}));

import { validateCoupon, resolveB2BDiscount, findActiveProduct } from "./checkout-shared";

beforeEach(() => {
  jest.clearAllMocks();
});

// ── validateCoupon ──────────────────────────────────────────────

describe("validateCoupon", () => {
  test("returns null coupon when no promoCode provided", async () => {
    const result = await validateCoupon(null, 10000);
    expect(result.couponData).toBeNull();
    expect(result.rejectionReason).toBeNull();
    expect(mockPrisma.coupon.findUnique).not.toHaveBeenCalled();
  });

  test("rejects non-existent coupon", async () => {
    mockPrisma.coupon.findUnique.mockResolvedValue(null);
    const result = await validateCoupon("BADCODE", 10000);
    expect(result.couponData).toBeNull();
    expect(result.rejectionReason).toBe("Invalid or inactive promo code");
  });

  test("rejects inactive coupon", async () => {
    mockPrisma.coupon.findUnique.mockResolvedValue({
      id: "c1", code: "INACTIVE", isActive: false,
      validFrom: null, validTo: null, maxUses: null, usedCount: 0,
      minAmount: null, type: "percentage", value: 1000,
    });
    const result = await validateCoupon("INACTIVE", 10000);
    expect(result.rejectionReason).toBe("Invalid or inactive promo code");
  });

  test("rejects expired coupon", async () => {
    const pastDate = new Date("2020-01-01");
    mockPrisma.coupon.findUnique.mockResolvedValue({
      id: "c1", code: "EXPIRED", isActive: true,
      validFrom: null, validTo: pastDate, maxUses: null, usedCount: 0,
      minAmount: null, type: "percentage", value: 1000,
    });
    const result = await validateCoupon("EXPIRED", 10000);
    expect(result.rejectionReason).toBe("Promo code has expired");
  });

  test("rejects coupon at usage limit", async () => {
    mockPrisma.coupon.findUnique.mockResolvedValue({
      id: "c1", code: "MAXED", isActive: true,
      validFrom: null, validTo: null, maxUses: 5, usedCount: 5,
      minAmount: null, type: "percentage", value: 1000,
    });
    const result = await validateCoupon("MAXED", 10000);
    expect(result.rejectionReason).toBe("Promo code usage limit reached");
  });

  test("rejects coupon below minimum order amount", async () => {
    mockPrisma.coupon.findUnique.mockResolvedValue({
      id: "c1", code: "MINORDER", isActive: true,
      validFrom: null, validTo: null, maxUses: null, usedCount: 0,
      minAmount: 20000, type: "percentage", value: 1000,
    });
    const result = await validateCoupon("MINORDER", 10000);
    expect(result.rejectionReason).toContain("Minimum order of $200.00");
  });

  test("computes percentage discount correctly", async () => {
    mockPrisma.coupon.findUnique.mockResolvedValue({
      id: "c1", code: "PCT10", isActive: true,
      validFrom: null, validTo: null, maxUses: null, usedCount: 0,
      minAmount: null, type: "percentage", value: 1000, // 10.00%
    });
    const result = await validateCoupon("PCT10", 10000);
    expect(result.rejectionReason).toBeNull();
    expect(result.couponData).toEqual({
      id: "c1",
      code: "PCT10",
      discountAmount: 1000, // 10% of 10000
    });
  });

  test("computes fixed discount capped at subtotal", async () => {
    mockPrisma.coupon.findUnique.mockResolvedValue({
      id: "c1", code: "FLAT", isActive: true,
      validFrom: null, validTo: null, maxUses: null, usedCount: 0,
      minAmount: null, type: "fixed", value: 50000, // $500
    });
    const result = await validateCoupon("FLAT", 10000);
    expect(result.couponData!.discountAmount).toBe(10000); // capped at subtotal
  });

  test("uppercases promo code for lookup", async () => {
    mockPrisma.coupon.findUnique.mockResolvedValue(null);
    await validateCoupon("lowercase", 10000);
    expect(mockPrisma.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: "LOWERCASE" },
    });
  });

  test("PARITY: same subtotal produces same discount regardless of caller", async () => {
    // This test ensures all 3 checkout paths get the same coupon discount
    // when they pass the same subtotal (items + design help)
    const couponRecord = {
      id: "c1", code: "SAVE20", isActive: true,
      validFrom: null, validTo: null, maxUses: null, usedCount: 0,
      minAmount: null, type: "percentage", value: 2000, // 20%
    };
    mockPrisma.coupon.findUnique.mockResolvedValue(couponRecord);

    const subtotalWithDesignHelp = 14500; // $100 items + $45 design help

    const stripe = await validateCoupon("SAVE20", subtotalWithDesignHelp);
    const invoice = await validateCoupon("SAVE20", subtotalWithDesignHelp);
    const interac = await validateCoupon("SAVE20", subtotalWithDesignHelp);

    expect(stripe.couponData!.discountAmount).toBe(invoice.couponData!.discountAmount);
    expect(stripe.couponData!.discountAmount).toBe(interac.couponData!.discountAmount);
    expect(stripe.couponData!.discountAmount).toBe(2900); // 20% of 14500
  });
});

// ── resolveB2BDiscount ──────────────────────────────────────────

describe("resolveB2BDiscount", () => {
  test("returns zero discount for guest (no userId)", async () => {
    const result = await resolveB2BDiscount(null, 10000, []);
    expect(result.isB2B).toBe(false);
    expect(result.partnerDiscount).toBe(0);
    expect(result.partnerUserId).toBeNull();
  });

  test("returns zero for non-B2B user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1", accountType: "CONSUMER", b2bApproved: false,
      partnerDiscount: 0, companyName: null, partnerTier: null,
    });
    const result = await resolveB2BDiscount("u1", 10000, []);
    expect(result.isB2B).toBe(false);
    expect(result.partnerDiscount).toBe(0);
  });

  test("returns zero for unapproved B2B user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1", accountType: "B2B", b2bApproved: false,
      partnerDiscount: 10, companyName: "Corp", partnerTier: null,
    });
    const result = await resolveB2BDiscount("u1", 10000, []);
    expect(result.isB2B).toBe(false);
    expect(result.partnerDiscount).toBe(0);
  });

  test("computes flat partner discount", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1", accountType: "B2B", b2bApproved: true,
      partnerDiscount: 15, companyName: "Corp", partnerTier: "gold",
    });
    mockResolveB2BPrice.mockResolvedValue(null); // no rules

    const result = await resolveB2BDiscount("u1", 10000, [
      { productId: "p1", slug: "sticker", quantity: 100, lineTotal: 10000 },
    ]);
    expect(result.isB2B).toBe(true);
    expect(result.partnerDiscount).toBe(1500); // 15% of 10000
    expect(result.b2bSource).toBe("flat");
    expect(result.partnerUserId).toBe("u1");
  });

  test("picks rules discount when larger than flat", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1", accountType: "B2B", b2bApproved: true,
      partnerDiscount: 5, companyName: "Corp", partnerTier: "gold",
    });
    mockResolveB2BPrice.mockResolvedValue({ discountCents: 3000 }); // $30 per item

    const result = await resolveB2BDiscount("u1", 10000, [
      { productId: "p1", slug: "sticker", quantity: 100, lineTotal: 10000 },
    ]);
    // Flat: 5% of 10000 = 500. Rules: 3000. Rules wins.
    expect(result.partnerDiscount).toBe(3000);
    expect(result.b2bSource).toBe("rules");
  });

  test("picks flat discount when larger than rules", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1", accountType: "B2B", b2bApproved: true,
      partnerDiscount: 20, companyName: "Corp", partnerTier: null,
    });
    mockResolveB2BPrice.mockResolvedValue({ discountCents: 100 });

    const result = await resolveB2BDiscount("u1", 10000, [
      { productId: "p1", slug: "sticker", quantity: 100, lineTotal: 10000 },
    ]);
    // Flat: 20% of 10000 = 2000. Rules: 100. Flat wins.
    expect(result.partnerDiscount).toBe(2000);
    expect(result.b2bSource).toBe("flat");
  });

  test("falls back to flat when rules lookup throws", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1", accountType: "B2B", b2bApproved: true,
      partnerDiscount: 10, companyName: "Corp", partnerTier: null,
    });
    mockResolveB2BPrice.mockRejectedValue(new Error("DB error"));

    const result = await resolveB2BDiscount("u1", 10000, [
      { productId: "p1", slug: "sticker", quantity: 100, lineTotal: 10000 },
    ]);
    expect(result.partnerDiscount).toBe(1000); // 10% flat fallback
    expect(result.b2bSource).toBe("flat");
  });

  test("PARITY: same subtotal produces same discount regardless of caller", async () => {
    // Ensures all 3 checkout paths compute the same B2B discount
    // when design help is included in the subtotal base
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1", accountType: "B2B", b2bApproved: true,
      partnerDiscount: 10, companyName: "Corp", partnerTier: null,
    });
    mockResolveB2BPrice.mockResolvedValue(null);

    const subtotalWithDesignHelp = 14500; // items + design help
    const items = [{ productId: "p1", slug: "s", quantity: 10, lineTotal: 10000 }];

    const r1 = await resolveB2BDiscount("u1", subtotalWithDesignHelp, items);
    const r2 = await resolveB2BDiscount("u1", subtotalWithDesignHelp, items);
    const r3 = await resolveB2BDiscount("u1", subtotalWithDesignHelp, items);

    expect(r1.partnerDiscount).toBe(r2.partnerDiscount);
    expect(r1.partnerDiscount).toBe(r3.partnerDiscount);
    expect(r1.partnerDiscount).toBe(1450); // 10% of 14500
  });
});

// ── findActiveProduct ───────────────────────────────────────────

describe("findActiveProduct", () => {
  test("finds by ID first", async () => {
    const product = { id: "p1", slug: "sticker", isActive: true };
    mockPrisma.product.findFirst.mockResolvedValueOnce(product);

    const result = await findActiveProduct({ productId: "p1", slug: "sticker" });
    expect(result).toBe(product);
    expect(mockPrisma.product.findFirst).toHaveBeenCalledTimes(1);
    expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
      where: { id: "p1", isActive: true },
      include: { pricingPreset: true },
    });
  });

  test("falls back to slug when ID not found", async () => {
    const product = { id: "p1", slug: "sticker", isActive: true };
    mockPrisma.product.findFirst
      .mockResolvedValueOnce(null)  // ID lookup fails
      .mockResolvedValueOnce(product); // slug lookup succeeds

    const result = await findActiveProduct({ productId: "wrong-id", slug: "sticker" });
    expect(result).toBe(product);
    expect(mockPrisma.product.findFirst).toHaveBeenCalledTimes(2);
  });

  test("returns null when neither ID nor slug found", async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null);

    const result = await findActiveProduct({ productId: "bad", slug: "bad" });
    expect(result).toBeNull();
  });

  test("returns null when no slug provided and ID not found", async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);

    const result = await findActiveProduct({ productId: "bad" });
    expect(result).toBeNull();
    expect(mockPrisma.product.findFirst).toHaveBeenCalledTimes(1);
  });
});
