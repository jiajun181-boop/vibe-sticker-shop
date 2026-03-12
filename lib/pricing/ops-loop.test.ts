/**
 * Tests for pricing ops action routing — precise action contracts.
 *
 * Validates:
 * 1. Structured entity fields (orderId, orderItemId, productSlug, approvalId)
 * 2. Pre-computed URLs that deep-link to the exact target
 * 3. Entity type classification
 * 4. Backward compatibility with string entityId
 * 5. API endpoints pass structured context
 * 6. Cross-link contracts (UI panels)
 */

import * as fs from "fs";
import * as path from "path";
import {
  alertTypeToAction,
  reminderToAction,
  opsActionUrl,
} from "./ops-action";

// ── Precise action routing: alertTypeToAction ────────────────────

describe("alertTypeToAction: precise routing", () => {
  test("missing_actual_cost with orderId+itemId → deep-links to cost entry", () => {
    const hint = alertTypeToAction("missing_actual_cost", {
      orderId: "ord-1",
      orderItemId: "item-1",
    });
    expect(hint.action).toBe("enter_actual_cost");
    expect(hint.target).toBe("costs");
    expect(hint.orderId).toBe("ord-1");
    expect(hint.orderItemId).toBe("item-1");
    expect(hint.entityType).toBe("orderItem");
    expect(hint.url).toContain("tab=costs");
    expect(hint.url).toContain("orderId=ord-1");
    expect(hint.url).toContain("itemId=item-1");
  });

  test("missing_actual_cost with only orderId → targets order-level cost entry", () => {
    const hint = alertTypeToAction("missing_actual_cost", { orderId: "ord-2" });
    expect(hint.orderId).toBe("ord-2");
    expect(hint.orderItemId).toBeUndefined();
    expect(hint.entityType).toBe("order");
    expect(hint.url).toContain("orderId=ord-2");
    expect(hint.url).not.toContain("itemId=");
  });

  test("missing_vendor_cost with productSlug → deep-links to vendor section", () => {
    const hint = alertTypeToAction("missing_vendor_cost", {
      productSlug: "die-cut-stickers",
    });
    expect(hint.action).toBe("enter_vendor_cost");
    expect(hint.target).toBe("governance");
    expect(hint.productSlug).toBe("die-cut-stickers");
    expect(hint.entityType).toBe("product");
    expect(hint.url).toContain("tab=governance");
    expect(hint.url).toContain("section=vendor");
    expect(hint.url).toContain("slug=die-cut-stickers");
  });

  test("negative_margin with productSlug → targets products tab", () => {
    const hint = alertTypeToAction("negative_margin", {
      orderId: "ord-3",
      orderItemId: "item-3",
      productSlug: "yard-signs",
    });
    expect(hint.action).toBe("review_pricing");
    expect(hint.target).toBe("products");
    expect(hint.productSlug).toBe("yard-signs");
    expect(hint.orderId).toBe("ord-3");
    expect(hint.url).toContain("slug=yard-signs");
  });

  test("negative_margin without productSlug → falls back to order target", () => {
    const hint = alertTypeToAction("negative_margin", { orderId: "ord-4" });
    expect(hint.target).toBe("order");
    expect(hint.url).toContain("/admin/orders/ord-4");
  });

  test("below_floor → review_pricing with structured fields", () => {
    const hint = alertTypeToAction("below_floor", { productSlug: "foam-board" });
    expect(hint.action).toBe("review_pricing");
    expect(hint.productSlug).toBe("foam-board");
    expect(hint.url).toContain("slug=foam-board");
  });

  test("cost_exceeds_revenue → review_pricing", () => {
    const hint = alertTypeToAction("cost_exceeds_revenue", { orderId: "ord-5" });
    expect(hint.action).toBe("review_pricing");
    expect(hint.orderId).toBe("ord-5");
  });

  test("unknown type → review_order fallback with orderId", () => {
    const hint = alertTypeToAction("some_unknown_type", { orderId: "ord-x" });
    expect(hint.action).toBe("review_order");
    expect(hint.target).toBe("order");
    expect(hint.orderId).toBe("ord-x");
    expect(hint.url).toBe("/admin/orders/ord-x");
  });

  test("backward compat: string entityId still works", () => {
    const hint = alertTypeToAction("missing_actual_cost", "item-legacy");
    expect(hint.action).toBe("enter_actual_cost");
    expect(hint.entityId).toBeDefined();
    expect(hint.url).toBeDefined();
  });
});

// ── Precise action routing: reminderToAction ─────────────────────

describe("reminderToAction: precise routing", () => {
  test("missingDisplayPrice with productSlug → products tab deep-link", () => {
    const hint = reminderToAction("missingDisplayPrice", { productSlug: "kiss-cut" });
    expect(hint.action).toBe("update_display_price");
    expect(hint.productSlug).toBe("kiss-cut");
    expect(hint.entityType).toBe("product");
    expect(hint.url).toContain("tab=products");
    expect(hint.url).toContain("slug=kiss-cut");
  });

  test("missingFloorPolicy with productSlug → products tab deep-link", () => {
    const hint = reminderToAction("missingFloorPolicy", { productSlug: "vinyl-banner" });
    expect(hint.productSlug).toBe("vinyl-banner");
    expect(hint.url).toContain("slug=vinyl-banner");
  });

  test("missingVendorCost with productSlug → governance vendor section", () => {
    const hint = reminderToAction("missingVendorCost", { productSlug: "roll-labels" });
    expect(hint.action).toBe("enter_vendor_cost");
    expect(hint.productSlug).toBe("roll-labels");
    expect(hint.url).toContain("section=vendor");
    expect(hint.url).toContain("slug=roll-labels");
  });

  test("staleVendorCosts → governance vendor section", () => {
    const hint = reminderToAction("staleVendorCosts", { productSlug: "sticker-sheets" });
    expect(hint.action).toBe("verify_vendor_cost");
    expect(hint.url).toContain("section=vendor");
  });

  test("highDriftChanges → governance changelog section", () => {
    const hint = reminderToAction("highDriftChanges");
    expect(hint.action).toBe("review_changelog");
    expect(hint.url).toContain("section=changelog");
  });

  test("pendingApprovals → governance approvals section", () => {
    const hint = reminderToAction("pendingApprovals");
    expect(hint.action).toBe("review_approval");
    expect(hint.url).toContain("section=approvals");
  });

  test("pendingApprovals with approvalId → deep-links to approval", () => {
    const hint = reminderToAction("pendingApprovals", { approvalId: "apr-1" });
    expect(hint.approvalId).toBe("apr-1");
    expect(hint.entityType).toBe("approval");
    expect(hint.url).toContain("approvalId=apr-1");
  });
});

// ── Pre-computed URL contract ────────────────────────────────────

describe("pre-computed url field", () => {
  test("every alertTypeToAction hint includes a url", () => {
    const types = [
      "missing_actual_cost", "missing_vendor_cost",
      "negative_margin", "cost_exceeds_revenue",
      "below_floor", "below_target",
    ];
    for (const t of types) {
      const hint = alertTypeToAction(t, { orderId: "o1" });
      expect(hint.url).toBeTruthy();
      expect(hint.url.startsWith("/admin")).toBe(true);
    }
  });

  test("every reminderToAction hint includes a url", () => {
    const keys = [
      "missingDisplayPrice", "missingFloorPolicy", "missingVendorCost",
      "staleVendorCosts", "highDriftChanges", "pendingApprovals",
    ];
    for (const k of keys) {
      const hint = reminderToAction(k);
      expect(hint.url).toBeTruthy();
      expect(hint.url.startsWith("/admin")).toBe(true);
    }
  });

  test("opsActionUrl returns same value as pre-computed url", () => {
    const hint = alertTypeToAction("missing_actual_cost", {
      orderId: "ord-u",
      orderItemId: "itm-u",
    });
    expect(opsActionUrl(hint)).toBe(hint.url);
  });
});

// ── API contracts: structured context in responses ────────────────

describe("API endpoints pass structured context", () => {
  test("profit-alerts passes orderId + orderItemId + productSlug", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/profit-alerts/route.ts"),
      "utf-8"
    );
    expect(src).toContain("orderId: r.orderId");
    expect(src).toContain("orderItemId: a.orderItemId");
    expect(src).toContain("productSlug: a.productName");
  });

  test("cost-completeness passes orderId + orderItemId", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/cost-completeness/route.ts"),
      "utf-8"
    );
    expect(src).toContain("orderId: item.orderId");
    expect(src).toContain("orderItemId: item.itemId");
  });

  test("ops-reminders passes productSlug for product-scoped reminders", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/ops-reminders/route.ts"),
      "utf-8"
    );
    expect(src).toContain("productSlug: firstDisplaySlug");
    expect(src).toContain("productSlug: firstVendorSlug");
    expect(src).toContain("productSlug: firstStaleSlug");
  });
});

// ── Cross-link contracts (UI panels) ─────────────────────────────

describe("Cost entry → profit feedback loop", () => {
  const costEntryPath = path.resolve(
    __dirname,
    "../../app/admin/pricing/CostEntryPanel.js"
  );
  const opsPanelPath = path.resolve(
    __dirname,
    "../../app/admin/pricing/OpsPanel.js"
  );

  test("CostEntryPanel reads orderProfit from save response", () => {
    const src = fs.readFileSync(costEntryPath, "utf-8");
    expect(src).toContain("orderProfit");
    expect(src).toContain("marginAlert");
  });

  test("CostEntryPanel cross-links to profit alerts", () => {
    const src = fs.readFileSync(costEntryPath, "utf-8");
    expect(src).toContain("pricingOpsPath");
  });

  test("OpsPanel cross-links to cost entry", () => {
    const src = fs.readFileSync(opsPanelPath, "utf-8");
    expect(src).toContain("pricingCostsPath");
  });
});

// ── API exact-target query contracts ──────────────────────────────

describe("API exact-target query support", () => {
  test("cost-completeness accepts orderId and itemId params", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/cost-completeness/route.ts"),
      "utf-8"
    );
    expect(src).toContain('searchParams.get("orderId")');
    expect(src).toContain('searchParams.get("itemId")');
    expect(src).toContain("targetOrderId");
    expect(src).toContain("targetItemId");
  });

  test("profit-alerts accepts orderId and alertType params", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/profit-alerts/route.ts"),
      "utf-8"
    );
    expect(src).toContain('searchParams.get("orderId")');
    expect(src).toContain('searchParams.get("alertType")');
    expect(src).toContain("targetOrderId");
    expect(src).toContain("targetAlertType");
  });

  test("approvals accepts approvalId, status, and slug params", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/approvals/route.ts"),
      "utf-8"
    );
    expect(src).toContain('searchParams.get("approvalId")');
    expect(src).toContain('searchParams.get("status")');
    expect(src).toContain('searchParams.get("slug")');
  });

  test("vendor-costs already supports productSlug param", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/vendor-costs/route.ts"),
      "utf-8"
    );
    expect(src).toContain("productSlug");
  });
});

// ── URL-to-API contract alignment ─────────────────────────────────

describe("action URLs align with API query contracts", () => {
  test("cost entry URL params match cost-completeness API params", () => {
    const hint = alertTypeToAction("missing_actual_cost", {
      orderId: "ord-1",
      orderItemId: "itm-1",
    });
    // URL should contain orderId and itemId that the API accepts
    expect(hint.url).toContain("orderId=ord-1");
    expect(hint.url).toContain("itemId=itm-1");
  });

  test("approval URL params match approvals API params", () => {
    const hint = reminderToAction("pendingApprovals", { approvalId: "apr-1" });
    expect(hint.url).toContain("approvalId=apr-1");
    expect(hint.url).toContain("section=approvals");
  });

  test("vendor cost URL params match vendor-costs API params", () => {
    const hint = alertTypeToAction("missing_vendor_cost", { productSlug: "roll-labels" });
    expect(hint.url).toContain("slug=roll-labels");
    expect(hint.url).toContain("section=vendor");
  });

  test("profit review URL includes product slug", () => {
    const hint = alertTypeToAction("negative_margin", {
      orderId: "ord-2",
      productSlug: "foam-board",
    });
    expect(hint.url).toContain("slug=foam-board");
  });
});

// ── Module completeness ──────────────────────────────────────────

describe("ops-action module completeness", () => {
  test("exports all required types and functions", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "./ops-action.ts"), "utf-8");
    expect(src).toContain("export function alertTypeToAction");
    expect(src).toContain("export function reminderToAction");
    expect(src).toContain("export function opsActionUrl");
    expect(src).toContain("export type OpsActionType");
    expect(src).toContain("export type OpsEntityType");
    expect(src).toContain("export interface OpsActionHint");
    expect(src).toContain("export interface OpsActionContext");
  });

  test("covers all 6 profit alert types", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "./ops-action.ts"), "utf-8");
    for (const t of ["missing_actual_cost", "missing_vendor_cost", "negative_margin",
      "cost_exceeds_revenue", "below_floor", "below_target"]) {
      expect(src).toContain(t);
    }
  });

  test("every hint includes url field in type definition", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "./ops-action.ts"), "utf-8");
    expect(src).toContain("url: string");
  });

  test("ops-action delegates URL building to focus contract", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "./ops-action.ts"), "utf-8");
    expect(src).toContain("buildPricingUrl");
    expect(src).toContain("buildOrderUrl");
    // Should import from focus.ts, not build URLs manually
    expect(src).toContain('from "./focus"');
  });
});

// ── ops-reminders uses focus contract for drilldownUrl ─────────────

describe("ops-reminders focus contract alignment", () => {
  test("ops-reminders imports buildPricingUrl from focus", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/ops-reminders/route.ts"),
      "utf-8"
    );
    expect(src).toContain("buildPricingUrl");
    expect(src).toContain('from "@/lib/pricing/focus"');
  });

  test("drilldownUrls use buildPricingUrl, not hardcoded strings", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/ops-reminders/route.ts"),
      "utf-8"
    );
    // Count occurrences of buildPricingUrl in drilldownUrl assignments
    const drilldownMatches = src.match(/drilldownUrl:\s*buildPricingUrl/g) || [];
    // Should have at least 6 pricing-related drilldownUrls using the contract
    expect(drilldownMatches.length).toBeGreaterThanOrEqual(6);
  });

  test("home-summary imports buildPricingUrl from focus", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/home-summary/route.ts"),
      "utf-8"
    );
    expect(src).toContain("buildPricingUrl");
    expect(src).toContain('from "@/lib/pricing/focus"');
  });
});
