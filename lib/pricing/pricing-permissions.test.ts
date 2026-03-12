// lib/pricing/pricing-permissions.test.ts
// Tests for pricing permission tiers and approval logic.

import {
  PricingTier,
  getPricingTier,
  hasPricingTier,
  canViewPricing,
  canSimulateQuotes,
  canEditPricing,
  canApprovePricing,
  canOverridePricing,
  checkApprovalRequired,
} from "./pricing-permissions";

describe("getPricingTier", () => {
  it("maps admin to OWNER", () => {
    expect(getPricingTier("admin")).toBe(PricingTier.OWNER);
  });
  it("maps merch_ops to OPERATOR", () => {
    expect(getPricingTier("merch_ops")).toBe(PricingTier.OPERATOR);
  });
  it("maps sales to SIMULATOR", () => {
    expect(getPricingTier("sales")).toBe(PricingTier.SIMULATOR);
  });
  it("maps finance to VIEWER", () => {
    expect(getPricingTier("finance")).toBe(PricingTier.VIEWER);
  });
  it("maps unknown role to VIEWER", () => {
    expect(getPricingTier("intern")).toBe(PricingTier.VIEWER);
  });
});

describe("hasPricingTier", () => {
  it("admin has all tiers", () => {
    expect(hasPricingTier("admin", PricingTier.VIEWER)).toBe(true);
    expect(hasPricingTier("admin", PricingTier.OWNER)).toBe(true);
  });
  it("sales can simulate but not edit", () => {
    expect(hasPricingTier("sales", PricingTier.SIMULATOR)).toBe(true);
    expect(hasPricingTier("sales", PricingTier.OPERATOR)).toBe(false);
  });
  it("finance can only view", () => {
    expect(hasPricingTier("finance", PricingTier.VIEWER)).toBe(true);
    expect(hasPricingTier("finance", PricingTier.SIMULATOR)).toBe(false);
  });
});

describe("action permission checks", () => {
  it("everyone can view", () => {
    expect(canViewPricing("cs")).toBe(true);
    expect(canViewPricing("design")).toBe(true);
    expect(canViewPricing("admin")).toBe(true);
  });
  it("only sales+ can simulate", () => {
    expect(canSimulateQuotes("finance")).toBe(false);
    expect(canSimulateQuotes("sales")).toBe(true);
    expect(canSimulateQuotes("merch_ops")).toBe(true);
  });
  it("only merch_ops+ can edit", () => {
    expect(canEditPricing("sales")).toBe(false);
    expect(canEditPricing("merch_ops")).toBe(true);
    expect(canEditPricing("admin")).toBe(true);
  });
  it("only admin can approve and override", () => {
    expect(canApprovePricing("merch_ops")).toBe(false);
    expect(canApprovePricing("admin")).toBe(true);
    expect(canOverridePricing("merch_ops")).toBe(false);
    expect(canOverridePricing("admin")).toBe(true);
  });
});

describe("checkApprovalRequired", () => {
  it("owner bypasses all approval", () => {
    const result = checkApprovalRequired({
      operatorRole: "admin",
      changeType: "bulk_price_update",
      driftPct: 50,
      affectedCount: 100,
      isBulk: true,
    });
    expect(result.requiresApproval).toBe(false);
  });

  it("bulk changes require approval for non-owners", () => {
    const result = checkApprovalRequired({
      operatorRole: "merch_ops",
      changeType: "preset_edit",
      affectedCount: 20,
      isBulk: true,
    });
    expect(result.requiresApproval).toBe(true);
    expect(result.requiredTier).toBe(PricingTier.MANAGER);
  });

  it("high drift requires approval", () => {
    const result = checkApprovalRequired({
      operatorRole: "merch_ops",
      changeType: "material_cost",
      driftPct: 25,
    });
    expect(result.requiresApproval).toBe(true);
    expect(result.reason).toContain("20%");
  });

  it("b2b_discount always requires manager", () => {
    const result = checkApprovalRequired({
      operatorRole: "merch_ops",
      changeType: "b2b_discount",
    });
    expect(result.requiresApproval).toBe(true);
  });

  it("normal operator change within guardrails needs no approval", () => {
    const result = checkApprovalRequired({
      operatorRole: "merch_ops",
      changeType: "material_cost",
      driftPct: 5,
      affectedCount: 1,
    });
    expect(result.requiresApproval).toBe(false);
  });

  it("viewer cannot make changes without approval", () => {
    const result = checkApprovalRequired({
      operatorRole: "finance",
      changeType: "material_cost",
      driftPct: 5,
    });
    expect(result.requiresApproval).toBe(true);
  });
});
