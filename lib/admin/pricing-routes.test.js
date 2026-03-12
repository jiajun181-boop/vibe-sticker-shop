import {
  pricingCenterPath,
  pricingQuotePath,
  pricingGovernancePath,
  pricingOpsPath,
  pricingProductsPath,
  pricingDashboardPath,
  pricingPresetsPath,
  pricingCostsPath,
  LEGACY_REDIRECT_MAP,
  legacySlugToQuotePath,
} from "./pricing-routes";

describe("pricing route helpers", () => {
  test("pricingCenterPath with no tab returns base path", () => {
    expect(pricingCenterPath()).toBe("/admin/pricing");
    expect(pricingCenterPath("products")).toBe("/admin/pricing");
  });

  test("pricingCenterPath with tab returns tab param", () => {
    expect(pricingCenterPath("dashboard")).toBe("/admin/pricing?tab=dashboard");
    expect(pricingCenterPath("quote")).toBe("/admin/pricing?tab=quote");
  });

  test("pricingQuotePath without slug", () => {
    expect(pricingQuotePath()).toBe("/admin/pricing?tab=quote");
  });

  test("pricingQuotePath with slug", () => {
    expect(pricingQuotePath("die-cut-stickers")).toBe(
      "/admin/pricing?tab=quote&slug=die-cut-stickers"
    );
  });

  test("pricingQuotePath encodes special characters", () => {
    expect(pricingQuotePath("a product/slug")).toContain("a%20product%2Fslug");
  });

  test("pricingGovernancePath without section", () => {
    expect(pricingGovernancePath()).toBe("/admin/pricing?tab=governance");
  });

  test("pricingGovernancePath with section", () => {
    expect(pricingGovernancePath("approvals")).toBe(
      "/admin/pricing?tab=governance&section=approvals"
    );
    expect(pricingGovernancePath("changelog")).toBe(
      "/admin/pricing?tab=governance&section=changelog"
    );
  });

  test("pricingOpsPath without section", () => {
    expect(pricingOpsPath()).toBe("/admin/pricing?tab=ops");
  });

  test("pricingOpsPath with section", () => {
    expect(pricingOpsPath("alerts")).toBe(
      "/admin/pricing?tab=ops&section=alerts"
    );
    expect(pricingOpsPath("reminders")).toBe(
      "/admin/pricing?tab=ops&section=reminders"
    );
  });

  test("convenience helpers return expected paths", () => {
    expect(pricingProductsPath()).toBe("/admin/pricing");
    expect(pricingDashboardPath()).toBe("/admin/pricing?tab=dashboard");
    expect(pricingPresetsPath()).toBe("/admin/pricing?tab=presets");
    expect(pricingCostsPath()).toBe("/admin/pricing?tab=costs");
  });
});

describe("legacy redirect map", () => {
  test("maps all known legacy routes to canonical pricing paths", () => {
    // Every value should start with /admin/pricing
    for (const [legacyPath, canonicalPath] of Object.entries(LEGACY_REDIRECT_MAP)) {
      expect(canonicalPath).toMatch(/^\/admin\/pricing/);
      expect(legacyPath).toMatch(/^\/admin\/pricing-dashboard/);
    }
  });

  test("maps base pricing-dashboard to pricing center", () => {
    expect(LEGACY_REDIRECT_MAP["/admin/pricing-dashboard"]).toBe("/admin/pricing");
  });

  test("maps governance to governance tab", () => {
    expect(LEGACY_REDIRECT_MAP["/admin/pricing-dashboard/governance"]).toBe(
      "/admin/pricing?tab=governance"
    );
  });

  test("maps approvals to governance approvals section", () => {
    expect(LEGACY_REDIRECT_MAP["/admin/pricing-dashboard/approvals"]).toBe(
      "/admin/pricing?tab=governance&section=approvals"
    );
  });

  test("maps remediation to ops reminders (closest canonical equivalent)", () => {
    expect(LEGACY_REDIRECT_MAP["/admin/pricing-dashboard/remediation"]).toBe(
      "/admin/pricing?tab=ops&section=reminders"
    );
  });

  test("no legacy route maps to another legacy route", () => {
    for (const target of Object.values(LEGACY_REDIRECT_MAP)) {
      expect(target).not.toContain("pricing-dashboard");
    }
  });
});

describe("legacySlugToQuotePath", () => {
  test("converts slug to canonical quote path", () => {
    expect(legacySlugToQuotePath("die-cut-stickers")).toBe(
      "/admin/pricing?tab=quote&slug=die-cut-stickers"
    );
  });
});
