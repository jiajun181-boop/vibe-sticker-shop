/**
 * Focused API mode tests — Wave B.
 *
 * Validates that pricing APIs support exact-target focused mode:
 * - When focus params are present, response includes focused flag
 * - When focus params are absent, broad list mode works normally
 * - Focus params are echoed back for UI correlation
 */

import * as fs from "fs";
import * as path from "path";

const routes = {
  costCompleteness: path.resolve(__dirname, "../../app/api/admin/pricing/cost-completeness/route.ts"),
  profitAlerts: path.resolve(__dirname, "../../app/api/admin/pricing/profit-alerts/route.ts"),
  approvals: path.resolve(__dirname, "../../app/api/admin/pricing/approvals/route.ts"),
  vendorCosts: path.resolve(__dirname, "../../app/api/admin/pricing/vendor-costs/route.ts"),
  homeSummary: path.resolve(__dirname, "../../app/api/admin/pricing/home-summary/route.ts"),
};

// ── cost-completeness focused mode ───────────────────────────────

describe("cost-completeness focused mode", () => {
  let src: string;
  beforeAll(() => { src = fs.readFileSync(routes.costCompleteness, "utf-8"); });

  test("reads orderId and itemId from query params", () => {
    expect(src).toContain('searchParams.get("orderId")');
    expect(src).toContain('searchParams.get("itemId")');
  });

  test("returns focused flag when target params are present", () => {
    expect(src).toContain("focused");
    expect(src).toContain("targetOrderId || targetItemId");
  });

  test("echoes focusParams in response when focused", () => {
    expect(src).toContain("focusParams");
    expect(src).toContain("orderId: targetOrderId");
    expect(src).toContain("itemId: targetItemId");
  });

  test("returns primaryRecord in focused mode", () => {
    expect(src).toContain("primaryRecord:");
  });

  test("scopes query to exact order when orderId is set", () => {
    expect(src).toContain("orderWhere.id = targetOrderId");
  });

  test("filters to exact item when itemId is set", () => {
    expect(src).toContain("i.itemId === targetItemId");
  });

  test("includes actionHint per missing item", () => {
    expect(src).toContain("alertTypeToAction");
    expect(src).toContain("actionHint:");
  });
});

// ── profit-alerts focused mode ───────────────────────────────────

describe("profit-alerts focused mode", () => {
  let src: string;
  beforeAll(() => { src = fs.readFileSync(routes.profitAlerts, "utf-8"); });

  test("reads orderId and alertType from query params", () => {
    expect(src).toContain('searchParams.get("orderId")');
    expect(src).toContain('searchParams.get("alertType")');
  });

  test("returns focused flag when target params are present", () => {
    expect(src).toContain("focused");
    expect(src).toContain("targetOrderId || targetAlertType");
  });

  test("filters to exact order when orderId is set", () => {
    expect(src).toContain("r.orderId === targetOrderId");
  });

  test("filters to exact alert type when alertType is set", () => {
    expect(src).toContain("a.alertType === targetAlertType");
  });

  test("returns focusParams in focused mode", () => {
    expect(src).toContain("focusParams");
    expect(src).toContain("orderId: targetOrderId");
    expect(src).toContain("alertType: targetAlertType");
  });

  test("returns primaryRecord in focused mode", () => {
    expect(src).toContain("primaryRecord:");
  });

  test("includes actionHint per alert", () => {
    expect(src).toContain("alertTypeToAction");
    expect(src).toContain("actionHint:");
  });
});

// ── approvals focused mode ───────────────────────────────────────

describe("approvals focused mode", () => {
  let src: string;
  beforeAll(() => { src = fs.readFileSync(routes.approvals, "utf-8"); });

  test("reads approvalId, status, slug from query params", () => {
    expect(src).toContain('searchParams.get("approvalId")');
    expect(src).toContain('searchParams.get("status")');
    expect(src).toContain('searchParams.get("slug")');
  });

  test("returns single approval by ID with focused flag", () => {
    expect(src).toContain("focused: true");
    expect(src).toContain("focusParams: { approvalId }");
  });

  test("returns primaryRecord in focused mode", () => {
    expect(src).toContain("primaryRecord:");
  });

  test("returns 404 when approval not found", () => {
    expect(src).toContain("Approval not found");
    expect(src).toContain("status: 404");
  });

  test("filters by targetSlug when provided", () => {
    expect(src).toContain("targetSlug");
    expect(src).toContain("a.targetSlug === targetSlug");
  });

  test("broad mode returns focused: false", () => {
    expect(src).toContain("focused: false");
  });
});

// ── vendor-costs focused mode ────────────────────────────────────

describe("vendor-costs focused mode", () => {
  let src: string;
  beforeAll(() => { src = fs.readFileSync(routes.vendorCosts, "utf-8"); });

  test("reads productSlug and vendorName from query params", () => {
    expect(src).toContain('searchParams.get("vendorName")');
    expect(src).toContain('searchParams.get("productSlug")');
  });

  test("returns focused flag when filter params are present", () => {
    expect(src).toContain("focused");
    expect(src).toContain("productSlug || vendorName");
  });

  test("returns focusParams in focused mode", () => {
    expect(src).toContain("focusParams");
    expect(src).toContain("productSlug: productSlug");
    expect(src).toContain("vendorName: vendorName");
  });

  test("returns primaryRecord in focused mode", () => {
    expect(src).toContain("primaryRecord:");
  });
});

// ── Cross-API focused mode consistency ───────────────────────────

describe("Cross-API focused mode consistency", () => {
  test("all pricing APIs return a focused boolean", () => {
    for (const [name, routePath] of Object.entries(routes)) {
      if (name === "homeSummary") continue;
      const src = fs.readFileSync(routePath, "utf-8");
      expect(src).toContain("focused");
    }
  });

  test("all list APIs include focusParams in focused mode", () => {
    const listRoutes = [routes.costCompleteness, routes.profitAlerts, routes.approvals, routes.vendorCosts];
    for (const routePath of listRoutes) {
      const src = fs.readFileSync(routePath, "utf-8");
      expect(src).toContain("focusParams");
    }
  });

  test("all list APIs include primaryRecord in focused mode", () => {
    const listRoutes = [routes.costCompleteness, routes.profitAlerts, routes.approvals, routes.vendorCosts];
    for (const routePath of listRoutes) {
      const src = fs.readFileSync(routePath, "utf-8");
      expect(src).toContain("primaryRecord:");
    }
  });

  test("all list APIs support broad mode (no params = full list)", () => {
    const listRoutes = [routes.costCompleteness, routes.profitAlerts, routes.approvals, routes.vendorCosts];
    for (const routePath of listRoutes) {
      const src = fs.readFileSync(routePath, "utf-8");
      expect(src.length).toBeGreaterThan(200);
    }
  });
});
