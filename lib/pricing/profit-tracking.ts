// lib/pricing/profit-tracking.ts
// ═══════════════════════════════════════════════════════════════════
// Profit tracking — estimated vs actual margin, alerts, variance.
// Reads from Order/OrderItem cost fields to compute real margins.
//
// Sub-task 4: Real Profit Tracking + Actual Margin Closure
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";

// ── Variance types ──────────────────────────────────────────────

export interface VarianceDetail {
  estimatedCents: number;
  actualCents: number;
  varianceCents: number; // actual - estimated (positive = over budget)
  variancePct: number;   // ((actual - estimated) / estimated) * 100
  direction: "over" | "under" | "match";
}

/**
 * Compute variance between estimated and actual cost.
 * Positive varianceCents means actual exceeded estimate (over budget).
 */
export function computeVarianceDetail(estimated: number, actual: number): VarianceDetail {
  const varianceCents = actual - estimated;
  const variancePct = estimated > 0
    ? Math.round(((actual - estimated) / estimated) * 10000) / 100
    : actual > 0 ? 100 : 0;

  let direction: "over" | "under" | "match";
  if (varianceCents > 0) direction = "over";
  else if (varianceCents < 0) direction = "under";
  else direction = "match";

  return {
    estimatedCents: estimated,
    actualCents: actual,
    varianceCents,
    variancePct,
    direction,
  };
}

export interface OrderMarginComparison {
  estimatedMarginPct: number;
  actualMarginPct: number | null;
  marginDriftPct: number | null; // actual - estimated (negative = margin eroded)
  hasActualData: boolean;
  itemCount: number;
  itemsWithActual: number;
  estimatedCostCents: number;
  actualCostCents: number;
  revenueCents: number;
}

/**
 * Compute a side-by-side margin comparison for an order.
 * Shows estimated vs actual margin, drift, and coverage.
 */
export function computeMarginComparison(order: {
  totalAmount: number;
  items: Array<{
    totalPrice: number;
    estimatedCostCents: number;
    actualCostCents: number;
  }>;
}): OrderMarginComparison {
  const revenue = order.totalAmount;
  let estCost = 0;
  let actCost = 0;
  let itemsWithActual = 0;

  for (const item of order.items) {
    estCost += item.estimatedCostCents || 0;
    if (item.actualCostCents > 0) {
      actCost += item.actualCostCents;
      itemsWithActual++;
    }
  }

  const hasActualData = itemsWithActual > 0;
  const estMargin = revenue > 0
    ? Math.round(((revenue - estCost) / revenue) * 10000) / 100
    : 0;

  const actMargin = hasActualData && revenue > 0
    ? Math.round(((revenue - actCost) / revenue) * 10000) / 100
    : null;

  const marginDrift = actMargin != null ? Math.round((actMargin - estMargin) * 100) / 100 : null;

  return {
    estimatedMarginPct: estMargin,
    actualMarginPct: actMargin,
    marginDriftPct: marginDrift,
    hasActualData,
    itemCount: order.items.length,
    itemsWithActual,
    estimatedCostCents: estCost,
    actualCostCents: actCost,
    revenueCents: revenue,
  };
}

export interface ProfitAlert {
  orderId: string;
  orderItemId?: string;
  productName: string;
  alertType: "below_floor" | "below_target" | "negative_margin" | "cost_exceeds_revenue" | "missing_actual_cost" | "missing_vendor_cost";
  estimatedMarginPct: number;
  actualMarginPct: number | null;
  sellPriceCents: number;
  costCents: number;
  message: string;
}

// ── Constants ────────────────────────────────────────────────────
const TARGET_MARGIN_PCT = 40; // Default target margin %
const FLOOR_MARGIN_PCT = 15;  // Minimum acceptable margin %

/**
 * Compute profit metrics for a single order item.
 */
export function computeItemProfit(item: {
  totalPrice: number;
  materialCostCents: number;
  estimatedCostCents: number;
  actualCostCents: number;
  vendorCostCents: number;
}): {
  estimatedCostCents: number;
  actualCostCents: number;
  estimatedProfitCents: number;
  actualProfitCents: number | null;
  estimatedMarginPct: number;
  actualMarginPct: number | null;
} {
  const cost = item.estimatedCostCents || item.materialCostCents || item.vendorCostCents || 0;
  const actualCost = item.actualCostCents || null;

  const estimatedProfit = item.totalPrice - cost;
  const estimatedMargin = item.totalPrice > 0
    ? (estimatedProfit / item.totalPrice) * 100
    : 0;

  const actualProfit = actualCost != null ? item.totalPrice - actualCost : null;
  const actualMargin = actualCost != null && item.totalPrice > 0
    ? ((item.totalPrice - actualCost) / item.totalPrice) * 100
    : null;

  return {
    estimatedCostCents: cost,
    actualCostCents: actualCost || 0,
    estimatedProfitCents: estimatedProfit,
    actualProfitCents: actualProfit,
    estimatedMarginPct: Math.round(estimatedMargin * 100) / 100,
    actualMarginPct: actualMargin != null ? Math.round(actualMargin * 100) / 100 : null,
  };
}

/**
 * Compute order-level profit summary.
 */
export function computeOrderProfit(order: {
  totalAmount: number;
  materialCost: number;
  laborCost: number;
  shippingCost: number;
  items: Array<{
    totalPrice: number;
    materialCostCents: number;
    estimatedCostCents: number;
    actualCostCents: number;
    vendorCostCents: number;
  }>;
}): {
  revenueCents: number;
  estimatedCostCents: number;
  actualCostCents: number;
  estimatedProfitCents: number;
  actualProfitCents: number | null;
  estimatedMarginPct: number;
  actualMarginPct: number | null;
  hasActualCosts: boolean;
} {
  const revenue = order.totalAmount;

  // Sum item-level costs
  let estCost = 0;
  let actCost = 0;
  let hasActual = false;

  for (const item of order.items) {
    const ip = computeItemProfit(item);
    estCost += ip.estimatedCostCents;
    if (ip.actualCostCents > 0) {
      actCost += ip.actualCostCents;
      hasActual = true;
    }
  }

  // Add order-level overhead costs
  estCost += order.shippingCost || 0;
  if (hasActual) {
    actCost += order.shippingCost || 0;
  }

  // Use order-level materialCost + laborCost as fallback
  if (estCost === 0 && (order.materialCost > 0 || order.laborCost > 0)) {
    estCost = order.materialCost + order.laborCost + (order.shippingCost || 0);
  }

  const estProfit = revenue - estCost;
  const estMargin = revenue > 0 ? (estProfit / revenue) * 100 : 0;

  const actProfit = hasActual ? revenue - actCost : null;
  const actMargin = hasActual && revenue > 0 ? ((revenue - actCost) / revenue) * 100 : null;

  return {
    revenueCents: revenue,
    estimatedCostCents: estCost,
    actualCostCents: actCost,
    estimatedProfitCents: estProfit,
    actualProfitCents: actProfit,
    estimatedMarginPct: Math.round(estMargin * 100) / 100,
    actualMarginPct: actMargin != null ? Math.round(actMargin * 100) / 100 : null,
    hasActualCosts: hasActual,
  };
}

/**
 * Detect profit alerts for an order's items.
 */
export function detectProfitAlerts(
  orderId: string,
  items: Array<{
    id: string;
    productName: string;
    totalPrice: number;
    materialCostCents: number;
    estimatedCostCents: number;
    actualCostCents: number;
    vendorCostCents: number;
  }>,
  targetMarginPct: number = TARGET_MARGIN_PCT,
  floorMarginPct: number = FLOOR_MARGIN_PCT
): ProfitAlert[] {
  const alerts: ProfitAlert[] = [];

  for (const item of items) {
    const profit = computeItemProfit(item);

    // Negative margin
    if (profit.estimatedMarginPct < 0) {
      alerts.push({
        orderId,
        orderItemId: item.id,
        productName: item.productName,
        alertType: "negative_margin",
        estimatedMarginPct: profit.estimatedMarginPct,
        actualMarginPct: profit.actualMarginPct,
        sellPriceCents: item.totalPrice,
        costCents: profit.estimatedCostCents,
        message: `Losing money: margin ${profit.estimatedMarginPct.toFixed(1)}%`,
      });
      continue;
    }

    // Below floor
    if (profit.estimatedMarginPct < floorMarginPct) {
      alerts.push({
        orderId,
        orderItemId: item.id,
        productName: item.productName,
        alertType: "below_floor",
        estimatedMarginPct: profit.estimatedMarginPct,
        actualMarginPct: profit.actualMarginPct,
        sellPriceCents: item.totalPrice,
        costCents: profit.estimatedCostCents,
        message: `Below floor: ${profit.estimatedMarginPct.toFixed(1)}% < ${floorMarginPct}% floor`,
      });
      continue;
    }

    // Below target
    if (profit.estimatedMarginPct < targetMarginPct) {
      alerts.push({
        orderId,
        orderItemId: item.id,
        productName: item.productName,
        alertType: "below_target",
        estimatedMarginPct: profit.estimatedMarginPct,
        actualMarginPct: profit.actualMarginPct,
        sellPriceCents: item.totalPrice,
        costCents: profit.estimatedCostCents,
        message: `Below target: ${profit.estimatedMarginPct.toFixed(1)}% < ${targetMarginPct}% target`,
      });
    }

    // Actual cost exceeds sell price (post-production discovery)
    if (profit.actualMarginPct != null && profit.actualMarginPct < 0) {
      alerts.push({
        orderId,
        orderItemId: item.id,
        productName: item.productName,
        alertType: "cost_exceeds_revenue",
        estimatedMarginPct: profit.estimatedMarginPct,
        actualMarginPct: profit.actualMarginPct,
        sellPriceCents: item.totalPrice,
        costCents: profit.actualCostCents,
        message: `Actual loss: actual margin ${profit.actualMarginPct.toFixed(1)}%`,
      });
    }
  }

  return alerts;
}

/**
 * Query recent orders with profit alerts.
 * Returns orders where estimated margin is below threshold.
 */
export async function getOrdersWithProfitAlerts(params: {
  days?: number;
  floorMarginPct?: number;
  limit?: number;
}) {
  const since = new Date();
  since.setDate(since.getDate() - (params.days || 30));
  const limit = params.limit || 50;

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      status: { notIn: ["canceled", "refunded"] },
      totalAmount: { gt: 0 },
    },
    include: {
      items: {
        select: {
          id: true,
          productName: true,
          totalPrice: true,
          materialCostCents: true,
          estimatedCostCents: true,
          actualCostCents: true,
          vendorCostCents: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit * 3, // fetch more, then filter
  });

  const results: Array<{
    orderId: string;
    customerEmail: string;
    totalAmount: number;
    profit: ReturnType<typeof computeOrderProfit>;
    alerts: ProfitAlert[];
  }> = [];

  for (const order of orders) {
    const profit = computeOrderProfit({
      totalAmount: order.totalAmount,
      materialCost: order.materialCost,
      laborCost: order.laborCost,
      shippingCost: order.shippingCost,
      items: order.items,
    });

    const marginAlerts = detectProfitAlerts(
      order.id,
      order.items,
      TARGET_MARGIN_PCT,
      params.floorMarginPct || FLOOR_MARGIN_PCT
    );

    const missingAlerts = detectMissingCostAlerts(
      order.id,
      order.items,
      order.status,
      order.productionStatus
    );

    const alerts = [...marginAlerts, ...missingAlerts];

    if (alerts.length > 0) {
      results.push({
        orderId: order.id,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        profit,
        alerts,
      });
    }

    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Detect items/orders missing cost data that should have it.
 * These are ops reminders, not margin alerts.
 */
export function detectMissingCostAlerts(
  orderId: string,
  items: Array<{
    id: string;
    productName: string;
    totalPrice: number;
    estimatedCostCents: number;
    actualCostCents: number;
    vendorCostCents: number;
    meta?: unknown;
  }>,
  orderStatus: string,
  productionStatus: string
): ProfitAlert[] {
  const alerts: ProfitAlert[] = [];

  for (const item of items) {
    // Missing actual cost after fulfillment
    const isFulfilled = ["shipped", "completed", "ready_to_ship"].includes(productionStatus);
    if (isFulfilled && item.actualCostCents === 0 && item.estimatedCostCents > 0) {
      alerts.push({
        orderId,
        orderItemId: item.id,
        productName: item.productName,
        alertType: "missing_actual_cost",
        estimatedMarginPct: 0,
        actualMarginPct: null,
        sellPriceCents: item.totalPrice,
        costCents: item.estimatedCostCents,
        message: `Fulfilled but no actual cost entered`,
      });
    }

    // Outsourced product missing vendor cost — no cost data at all
    const isOutsourced = item.vendorCostCents === 0 && item.estimatedCostCents === 0 && item.totalPrice > 0;
    if (isOutsourced) {
      alerts.push({
        orderId,
        orderItemId: item.id,
        productName: item.productName,
        alertType: "missing_vendor_cost",
        estimatedMarginPct: 0,
        actualMarginPct: null,
        sellPriceCents: item.totalPrice,
        costCents: 0,
        message: `No cost data — cannot compute margin`,
      });
    }
  }

  return alerts;
}
