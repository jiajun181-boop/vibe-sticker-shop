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
import { buildPricingUrl, parsePricingFocus } from "../pricing/focus";

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
    const url = pricingQuotePath("a product/slug");
    // URLSearchParams uses + for spaces (equally valid as %20)
    expect(url).toContain("product%2Fslug");
    expect(url).toMatch(/a[+%20]product/);
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

// ── Wrapper → focus contract alignment ─────────────────────────────

describe("wrapper-to-focus alignment", () => {
  test("pricingCenterPath(tab) matches buildPricingUrl({ tab })", () => {
    for (const tab of ["dashboard", "costs", "ops", "governance", "presets"]) {
      expect(pricingCenterPath(tab)).toBe(buildPricingUrl({ tab }));
    }
  });

  test("pricingCostsPath produces parseable focus with tab=costs", () => {
    const url = pricingCostsPath("ord-123", "/admin/production/job-1");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("costs");
    expect(focus.orderId).toBe("ord-123");
    expect(focus.returnTo).toBe("/admin/production/job-1");
  });

  test("pricingOpsPath produces parseable focus with tab=ops", () => {
    const url = pricingOpsPath("alerts", "ord-456", "/admin/workstation");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("ops");
    expect(focus.section).toBe("alerts");
    expect(focus.orderId).toBe("ord-456");
    expect(focus.returnTo).toBe("/admin/workstation");
  });

  test("pricingGovernancePath with approvalId produces parseable focus", () => {
    const url = pricingGovernancePath("approvals", "appr-789", "/admin/pricing");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("governance");
    expect(focus.section).toBe("approvals");
    expect(focus.approvalId).toBe("appr-789");
    expect(focus.returnTo).toBe("/admin/pricing");
  });

  test("pricingGovernancePath with vendor targetId uses slug field", () => {
    const url = pricingGovernancePath("vendor", "die-cut-stickers");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("governance");
    expect(focus.section).toBe("vendor");
    expect(focus.slug).toBe("die-cut-stickers");
  });

  test("pricingCostsPath with itemId produces parseable focus", () => {
    const url = pricingCostsPath("ord-123", "/admin/orders/ord-123", "item-456");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("costs");
    expect(focus.orderId).toBe("ord-123");
    expect(focus.itemId).toBe("item-456");
    expect(focus.returnTo).toBe("/admin/orders/ord-123");
  });

  test("pricingOpsPath with alertType produces parseable focus", () => {
    const url = pricingOpsPath("alerts", "ord-789", "/admin/production/job-1", "negative_margin");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("ops");
    expect(focus.section).toBe("alerts");
    expect(focus.orderId).toBe("ord-789");
    expect(focus.alertType).toBe("negative_margin");
    expect(focus.returnTo).toBe("/admin/production/job-1");
  });

  test("pricingOpsPath with returnTo only (no orderId/alertType)", () => {
    const url = pricingOpsPath("alerts", undefined, "/admin/orders/xyz");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("ops");
    expect(focus.section).toBe("alerts");
    expect(focus.returnTo).toBe("/admin/orders/xyz");
    expect(focus.orderId).toBeUndefined();
    expect(focus.alertType).toBeUndefined();
  });

  test("pricingCostsPath with returnTo only (no orderId/itemId)", () => {
    const url = pricingCostsPath(undefined, "/admin/orders/abc");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("costs");
    expect(focus.returnTo).toBe("/admin/orders/abc");
    expect(focus.orderId).toBeUndefined();
    expect(focus.itemId).toBeUndefined();
  });

  test("pricingQuotePath produces parseable focus with slug", () => {
    const url = pricingQuotePath("kiss-cut-stickers");
    const qs = url.split("?")[1];
    const focus = parsePricingFocus(qs);
    expect(focus.tab).toBe("quote");
    expect(focus.slug).toBe("kiss-cut-stickers");
  });

  test("all wrapper URLs start with /admin/pricing", () => {
    const urls = [
      pricingCenterPath(),
      pricingCenterPath("costs"),
      pricingQuotePath(),
      pricingQuotePath("test"),
      pricingGovernancePath(),
      pricingGovernancePath("approvals"),
      pricingOpsPath(),
      pricingOpsPath("alerts"),
      pricingProductsPath(),
      pricingDashboardPath(),
      pricingPresetsPath(),
      pricingCostsPath(),
    ];
    for (const url of urls) {
      expect(url).toMatch(/^\/admin\/pricing/);
    }
  });

  test("wrappers delegate to buildPricingUrl (source file check)", () => {
    const fs = require("fs");
    const src = fs.readFileSync(require.resolve("./pricing-routes"), "utf-8");
    expect(src).toContain('import { buildPricingUrl } from');
    // Should NOT contain manual string concatenation for URL building
    expect(src).not.toContain("encodeURIComponent");
  });
});
