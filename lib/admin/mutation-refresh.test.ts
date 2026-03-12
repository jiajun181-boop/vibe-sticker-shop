/**
 * Canonical mutation refresh contract tests.
 *
 * Validates:
 * 1. Pre-built refresh constants cover all mutation patterns
 * 2. buildApprovalApplyRefresh maps changeType correctly
 * 3. All mutation endpoints use consistent invalidation keys
 * 4. Keys align with home-summary section names
 */

import {
  REFRESH_COST_ENTRY,
  REFRESH_VENDOR_COST,
  REFRESH_APPROVAL_REVIEW,
  REFRESH_BULK_ADJUST,
  REFRESH_QUOTE,
  buildApprovalApplyRefresh,
} from "./mutation-refresh";
import * as fs from "fs";
import * as path from "path";

// ── Pre-built constants ─────────────────────────────────────────

describe("Pre-built refresh constants", () => {
  test("REFRESH_COST_ENTRY targets missingActualCost + profitAlerts", () => {
    expect(REFRESH_COST_ENTRY.invalidates).toContain("missingActualCost");
    expect(REFRESH_COST_ENTRY.invalidates).toContain("profitAlerts");
  });

  test("REFRESH_VENDOR_COST targets missingVendorCost", () => {
    expect(REFRESH_VENDOR_COST.invalidates).toContain("missingVendorCost");
  });

  test("REFRESH_APPROVAL_REVIEW targets pendingApprovals", () => {
    expect(REFRESH_APPROVAL_REVIEW.invalidates).toContain("pendingApprovals");
  });

  test("REFRESH_BULK_ADJUST targets profitAlerts + highDrift", () => {
    expect(REFRESH_BULK_ADJUST.invalidates).toContain("profitAlerts");
    expect(REFRESH_BULK_ADJUST.invalidates).toContain("highDrift");
  });

  test("REFRESH_QUOTE targets quoteQueue", () => {
    expect(REFRESH_QUOTE.invalidates).toContain("quoteQueue");
  });
});

// ── Approval apply refresh ──────────────────────────────────────

describe("buildApprovalApplyRefresh", () => {
  test("always includes pendingApprovals", () => {
    expect(buildApprovalApplyRefresh().invalidates).toContain("pendingApprovals");
  });

  test("vendor_cost changes add missingVendorCost", () => {
    const hint = buildApprovalApplyRefresh("vendor_cost_create");
    expect(hint.invalidates).toContain("missingVendorCost");
  });

  test("material changes add missingVendorCost", () => {
    const hint = buildApprovalApplyRefresh("material_update");
    expect(hint.invalidates).toContain("missingVendorCost");
  });

  test("preset changes add profitAlerts", () => {
    const hint = buildApprovalApplyRefresh("preset_update");
    expect(hint.invalidates).toContain("profitAlerts");
  });

  test("bulk changes add profitAlerts + highDrift", () => {
    const hint = buildApprovalApplyRefresh("bulk_adjust");
    expect(hint.invalidates).toContain("profitAlerts");
    expect(hint.invalidates).toContain("highDrift");
  });
});

// ── Key alignment with home-summary ─────────────────────────────

describe("Invalidation keys align with home-summary sections", () => {
  test("all possible invalidation keys exist in home-summary", () => {
    const homeSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/home-summary/route.ts"),
      "utf-8"
    );
    const allKeys = [
      "pendingApprovals",
      "missingActualCost",
      "profitAlerts",
      "missingVendorCost",
      "highDrift",
      "quoteQueue",
    ];
    for (const key of allKeys) {
      expect(homeSrc).toContain(`sections.${key}`);
    }
  });
});
