/**
 * lib/pricing/production-cost-signal.ts
 *
 * Compact pricing/cost health signal for production surfaces.
 * Tells operators whether a job is financially safe, needs pricing review,
 * or is missing cost data — without exposing raw dollar amounts to
 * the production floor.
 *
 * Used by: production job detail, production ticket
 */

import { computeItemProfit, detectProfitAlerts, detectMissingCostAlerts } from "./profit-tracking";
import { alertTypeToAction, type OpsActionHint } from "./ops-action";

// ── Types ───────────────────────────────────────────────────────

export type CostSignalLevel = "normal" | "needs-review" | "missing-cost";

export interface ProductionCostSignal {
  /** Overall health: normal, needs-review, or missing-cost */
  level: CostSignalLevel;
  /** Short human-readable reason for the signal level */
  reason: string;
  /** Whether vendor/actual cost data is missing */
  hasMissingCost: boolean;
  /** Whether estimated margin is below floor (15%) */
  isBelowFloor: boolean;
  /** Whether margin is negative (losing money) */
  isNegativeMargin: boolean;
  /** Number of pricing alerts (for badge count in UI) */
  alertCount: number;
  /** Exact next action to resolve this issue — null when level is "normal" */
  nextAction: OpsActionHint | null;
}

// ── Compute ─────────────────────────────────────────────────────

/**
 * Compute a pricing health signal for a single order item
 * that corresponds to a production job.
 *
 * This is designed for production-facing surfaces. It does NOT
 * expose dollar amounts — only the health level and a reason string.
 *
 * @param item - The order item with cost fields
 * @param orderId - The parent order ID (for alert detection)
 * @param orderStatus - e.g. "processing", "completed"
 * @param productionStatus - e.g. "printing", "shipped"
 */
export function computeCostSignal(
  item: {
    id: string;
    productName: string;
    totalPrice: number;
    materialCostCents: number;
    estimatedCostCents: number;
    actualCostCents: number;
    vendorCostCents: number;
  },
  orderId: string,
  orderStatus: string,
  productionStatus: string,
  routingContext?: { returnTo?: string; source?: string }
): ProductionCostSignal {
  // Detect margin alerts
  const marginAlerts = detectProfitAlerts(orderId, [item]);
  const missingAlerts = detectMissingCostAlerts(orderId, [item], orderStatus, productionStatus);
  const allAlerts = [...marginAlerts, ...missingAlerts];

  const isNegativeMargin = marginAlerts.some(a => a.alertType === "negative_margin" || a.alertType === "cost_exceeds_revenue");
  const isBelowFloor = marginAlerts.some(a => a.alertType === "below_floor");
  const hasMissingCost = missingAlerts.length > 0;

  // Determine level and next action
  let level: CostSignalLevel;
  let reason: string;
  let nextAction: OpsActionHint | null = null;

  // Build structured context for precise action routing with resolve-and-return
  const actionCtx = {
    orderId,
    orderItemId: item.id,
    returnTo: routingContext?.returnTo,
    source: routingContext?.source,
  };

  if (isNegativeMargin) {
    level = "needs-review";
    reason = "Margin alert: this job may be losing money";
    const primary = marginAlerts.find(a => a.alertType === "negative_margin" || a.alertType === "cost_exceeds_revenue");
    nextAction = alertTypeToAction(primary?.alertType || "negative_margin", actionCtx);
  } else if (isBelowFloor) {
    level = "needs-review";
    reason = "Margin below floor — pricing review recommended";
    nextAction = alertTypeToAction("below_floor", actionCtx);
  } else if (hasMissingCost) {
    level = "missing-cost";
    reason = missingAlerts[0]?.message || "Cost data incomplete";
    const primary = missingAlerts[0];
    nextAction = alertTypeToAction(primary?.alertType || "missing_actual_cost", actionCtx);
  } else {
    level = "normal";
    reason = "Pricing OK";
  }

  return {
    level,
    reason,
    hasMissingCost,
    isBelowFloor,
    isNegativeMargin,
    alertCount: allAlerts.length,
    nextAction,
  };
}

/**
 * Compute cost signals for multiple order items (e.g., all items in an order).
 * Returns the worst signal level as the aggregate.
 */
export function computeOrderCostSignals(
  items: Array<{
    id: string;
    productName: string;
    totalPrice: number;
    materialCostCents: number;
    estimatedCostCents: number;
    actualCostCents: number;
    vendorCostCents: number;
  }>,
  orderId: string,
  orderStatus: string,
  productionStatus: string,
  routingContext?: { returnTo?: string; source?: string }
): {
  aggregate: ProductionCostSignal;
  perItem: Array<ProductionCostSignal & { itemId: string }>;
} {
  const perItem = items.map(item => ({
    ...computeCostSignal(item, orderId, orderStatus, productionStatus, routingContext),
    itemId: item.id,
  }));

  // Aggregate: worst level wins
  const hasNeedsReview = perItem.some(s => s.level === "needs-review");
  const hasMissing = perItem.some(s => s.level === "missing-cost");
  const totalAlerts = perItem.reduce((sum, s) => sum + s.alertCount, 0);

  let level: CostSignalLevel;
  let reason: string;

  if (hasNeedsReview) {
    level = "needs-review";
    const count = perItem.filter(s => s.level === "needs-review").length;
    reason = `${count} item${count > 1 ? "s" : ""} need pricing review`;
  } else if (hasMissing) {
    level = "missing-cost";
    const count = perItem.filter(s => s.level === "missing-cost").length;
    reason = `${count} item${count > 1 ? "s" : ""} missing cost data`;
  } else {
    level = "normal";
    reason = "All items priced normally";
  }

  // Aggregate nextAction: pick the most urgent item's action
  const worstItem = perItem.find(s => s.level === "needs-review")
    || perItem.find(s => s.level === "missing-cost");

  return {
    aggregate: {
      level,
      reason,
      hasMissingCost: hasMissing,
      isBelowFloor: perItem.some(s => s.isBelowFloor),
      isNegativeMargin: perItem.some(s => s.isNegativeMargin),
      alertCount: totalAlerts,
      nextAction: worstItem?.nextAction || null,
    },
    perItem,
  };
}
