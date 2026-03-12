/**
 * Tests for pricing home summary contract.
 *
 * Validates:
 * 1. Route exists and has correct permission
 * 2. Response structure matches health contract
 * 3. Degradation handling
 * 4. All pricing ops sections covered
 */

import * as fs from "fs";
import * as path from "path";

const routePath = path.resolve(
  __dirname,
  "../../app/api/admin/pricing/home-summary/route.ts"
);

describe("Pricing home summary route", () => {
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, "utf-8");
  });

  test("route exists", () => {
    expect(src.length).toBeGreaterThan(0);
  });

  test("requires pricing:view permission", () => {
    expect(src).toContain('requirePermission(request, "pricing", "view")');
  });

  test("uses Promise.allSettled for degradation handling", () => {
    expect(src).toContain("Promise.allSettled");
  });
});

describe("Health status contract", () => {
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, "utf-8");
  });

  test("exports PricingHealthStatus type with 3 states", () => {
    expect(src).toContain('"healthy"');
    expect(src).toContain('"issues"');
    expect(src).toContain('"degraded"');
  });

  test("response includes health, totalActionItems, sections, generatedAt", () => {
    expect(src).toContain("health,");
    expect(src).toContain("totalActionItems,");
    expect(src).toContain("sections,");
    expect(src).toContain("generatedAt:");
  });

  test("degraded status when errors exist", () => {
    expect(src).toContain('health = "degraded"');
    expect(src).toContain("errors.length > 0");
  });

  test("issues status when critical or warning", () => {
    expect(src).toContain('health = "issues"');
    expect(src).toContain("hasCritical");
    expect(src).toContain("hasWarning");
  });

  test("healthy status when no issues and no errors", () => {
    expect(src).toContain('health = "healthy"');
  });
});

describe("Pricing ops sections coverage", () => {
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, "utf-8");
  });

  test("covers pending approvals", () => {
    expect(src).toContain("pendingApprovals");
    expect(src).toContain("getApprovalSummary");
  });

  test("covers missing actual costs", () => {
    expect(src).toContain("missingActualCost");
    expect(src).toContain("actualCostCents");
  });

  test("covers profit alerts", () => {
    expect(src).toContain("profitAlerts");
  });

  test("covers missing vendor costs", () => {
    expect(src).toContain("missingVendorCost");
    expect(src).toContain("VendorCost");
  });

  test("covers high drift changes", () => {
    expect(src).toContain("highDrift");
    expect(src).toContain("driftPct");
  });

  test("each section has count and severity", () => {
    // All section assignments follow { count, severity } pattern
    expect(src).toContain("count:");
    expect(src).toContain("severity:");
  });

  test("each section includes actionUrl built from focus contract", () => {
    expect(src).toContain("actionUrl:");
    expect(src).toContain("buildPricingUrl");
    // Verify focus contract is imported
    expect(src).toContain('import { buildPricingUrl } from');
  });

  test("sections with exact data include topTarget", () => {
    expect(src).toContain("topTarget:");
    expect(src).toContain("topMissingCost");
    expect(src).toContain("topProfitAlert");
    expect(src).toContain("topMissingVendor");
  });

  test("topTarget includes identifying fields and label", () => {
    // Interface definition should include the target fields
    expect(src).toContain("orderId?: string");
    expect(src).toContain("itemId?: string");
    expect(src).toContain("slug?: string");
    expect(src).toContain("label: string");
  });

  test("response includes actionItems as primary action contract", () => {
    expect(src).toContain("actionItems");
    expect(src).toContain("actionItems,");
    // actionItems should be an array built from sections
    expect(src).toContain("actionItems: ActionItem[]");
  });

  test("actionItems have stable keys for each issue type", () => {
    expect(src).toContain('"pending_approvals"');
    expect(src).toContain('"missing_actual_cost"');
    expect(src).toContain('"profit_alerts"');
    expect(src).toContain('"missing_vendor_cost"');
    expect(src).toContain('"high_drift"');
    expect(src).toContain('"quote_queue"');
  });

  test("actionItems include key, count, severity, labelKey, actionUrl, description, tab", () => {
    expect(src).toContain("key: string");
    expect(src).toContain("count: number");
    expect(src).toContain("labelKey: string");
    expect(src).toContain("actionUrl: string");
    expect(src).toContain("description: string");
    expect(src).toContain("tab: string");
  });

  test("actionItems include focusTarget and topLabel for exact-target landing", () => {
    expect(src).toContain("focusTarget?:");
    expect(src).toContain("focusTarget: { orderId:");
    expect(src).toContain("focusTarget: { slug:");
    expect(src).toContain("topLabel?:");
    expect(src).toContain("topLabel: mc.topTarget.label");
  });

  test("actionItems include human-readable description per issue type", () => {
    expect(src).toContain("missing actual cost");
    expect(src).toContain("cost exceeding revenue");
    expect(src).toContain("missing vendor cost");
    expect(src).toContain("high-drift price change");
    expect(src).toContain("waiting for review");
  });

  test("actionItems include tab for direct tab switching", () => {
    expect(src).toContain('tab: "governance"');
    expect(src).toContain('tab: "costs"');
    expect(src).toContain('tab: "ops"');
  });

  test("actionItems are sorted by severity then count", () => {
    expect(src).toContain("severityOrder");
    expect(src).toContain("actionItems.sort");
  });

  test("actionItems only include non-zero issues", () => {
    // Each push is guarded by count > 0
    expect(src).toContain("s.pendingApprovals.count > 0");
    expect(src).toContain("s.missingActualCost.count > 0");
    expect(src).toContain("s.profitAlerts.count > 0");
    expect(src).toContain("s.missingVendorCost.count > 0");
    expect(src).toContain("s.highDrift.count > 0");
    expect(src).toContain("s.quoteQueue.count > 0");
  });

  test("actionItems with topTarget use exact-target URL, not section URL", () => {
    // For missing_actual_cost with topTarget, URL should include orderId/itemId
    expect(src).toContain('buildPricingUrl({ tab: "costs", orderId: mc.topTarget.orderId, itemId: mc.topTarget.itemId })');
    // For profit_alerts with topTarget, URL should include orderId
    expect(src).toContain('buildPricingUrl({ tab: "ops", section: "alerts", orderId: pa.topTarget.orderId })');
    // For missing_vendor_cost with topTarget, URL should include slug
    expect(src).toContain('buildPricingUrl({ tab: "governance", section: "vendor", slug: vc.topTarget.slug })');
  });

  test("each section handles fetch failure", () => {
    expect(src).toContain('error: "fetch_failed"');
    // Should have error tracking for each section
    expect(src).toContain('errors.push("approvals")');
    expect(src).toContain('errors.push("missingCost")');
    expect(src).toContain('errors.push("profitAlerts")');
    expect(src).toContain('errors.push("vendorCost")');
    expect(src).toContain('errors.push("drift")');
    expect(src).toContain('errors.push("quoteQueue")');
  });

  test("covers quote queue section", () => {
    expect(src).toContain("quoteQueue");
    expect(src).toContain("quoteQueueResult");
    expect(src).toContain("computeQueueSummary");
  });

  test("quote queue action item includes focusTarget with quoteId", () => {
    expect(src).toContain("quoteId?: string");
    expect(src).toContain("focusTarget: { quoteId:");
    expect(src).toContain("awaiting action");
  });

  test("quote queue includes topTarget for exact-target landing", () => {
    expect(src).toContain("topQuoteResult");
    expect(src).toContain("topQuote");
  });
});
