/**
 * lib/admin/mutation-refresh.ts
 *
 * Canonical mutation refresh contract.
 * Shared type for all admin mutation responses that affect dashboard/queue state.
 *
 * Used by:
 * - Pricing mutation endpoints (actual-cost, item-costs, vendor-costs, approvals, bulk-adjust)
 * - Quote mutation endpoints (PATCH, convert)
 * - UI consumers (to know what to re-fetch after a mutation)
 *
 * Section keys align with home-summary sections:
 *   pendingApprovals, missingActualCost, profitAlerts, missingVendorCost, highDrift, quoteQueue
 */

// ── Invalidation keys ───────────────────────────────────────────

/** All possible invalidation targets that home-summary / queue surfaces track. */
export type InvalidationKey =
  | "pendingApprovals"
  | "missingActualCost"
  | "profitAlerts"
  | "missingVendorCost"
  | "highDrift"
  | "quoteQueue";

// ── Refresh hint ────────────────────────────────────────────────

export interface RefreshHint {
  /** Which dashboard/queue sections to re-fetch */
  invalidates: InvalidationKey[];
}

// ── Pre-built refresh hints for common mutation patterns ────────

/** Cost entry mutations (actual-cost, item-costs, order costs) */
export const REFRESH_COST_ENTRY: RefreshHint = {
  invalidates: ["missingActualCost", "profitAlerts"],
};

/** Vendor cost mutations (create, update, delete) */
export const REFRESH_VENDOR_COST: RefreshHint = {
  invalidates: ["missingVendorCost"],
};

/** Approval review (approve/reject) */
export const REFRESH_APPROVAL_REVIEW: RefreshHint = {
  invalidates: ["pendingApprovals"],
};

/** Bulk pricing adjustment (apply or rollback) */
export const REFRESH_BULK_ADJUST: RefreshHint = {
  invalidates: ["profitAlerts", "highDrift"],
};

/** Quote state change */
export const REFRESH_QUOTE: RefreshHint = {
  invalidates: ["quoteQueue"],
};

/**
 * Build approval-apply refresh hint.
 * Maps changeType to additional invalidation targets beyond pendingApprovals.
 */
export function buildApprovalApplyRefresh(changeType?: string): RefreshHint {
  const invalidates: InvalidationKey[] = ["pendingApprovals"];
  if (changeType?.startsWith("vendor_cost")) invalidates.push("missingVendorCost");
  if (changeType?.startsWith("material")) invalidates.push("missingVendorCost");
  if (changeType?.startsWith("preset")) invalidates.push("profitAlerts");
  if (changeType?.startsWith("bulk")) invalidates.push("profitAlerts", "highDrift");
  return { invalidates };
}
