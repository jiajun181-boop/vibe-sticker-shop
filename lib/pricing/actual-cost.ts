// lib/pricing/actual-cost.ts
// ═══════════════════════════════════════════════════════════════════
// Actual cost management — post-production cost entry, variance
// tracking, and orders needing actual cost input.
//
// Workstream 4: Actual Margin Closure
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  computeVarianceDetail,
  computeOrderProfit,
  type VarianceDetail,
} from "@/lib/pricing/profit-tracking";

// ── Types ───────────────────────────────────────────────────────

export type VarianceReason =
  | "material_price_change"
  | "labor_overtime"
  | "shipping_increase"
  | "vendor_price_change"
  | "waste"
  | "rework"
  | "other";

const VALID_VARIANCE_REASONS: VarianceReason[] = [
  "material_price_change",
  "labor_overtime",
  "shipping_increase",
  "vendor_price_change",
  "waste",
  "rework",
  "other",
];

export interface ActualCostUpdate {
  orderItemId: string;
  actualCostCents: number;
  varianceReason?: VarianceReason;
  varianceNote?: string;
}

export interface ItemCostResult {
  itemId: string;
  productName: string;
  previousActualCost: number;
  newActualCost: number;
  estimatedCostCents: number;
  totalPrice: number;
  variance: VarianceDetail;
  varianceReason?: string;
  varianceNote?: string;
}

export interface OrderCostResult {
  orderId: string;
  totalAmount: number;
  estimatedMarginPct: number;
  actualMarginPct: number | null;
  estimatedCostCents: number;
  actualCostCents: number;
  itemsUpdated: number;
  items: ItemCostResult[];
  orderVariance: VarianceDetail;
}

export interface OrderWithMissingCost {
  orderId: string;
  customerEmail: string;
  customerName: string | null;
  status: string;
  productionStatus: string;
  totalAmount: number;
  createdAt: Date;
  shippedAt: Date | null; // from timeline
  daysSinceShipment: number | null;
  urgency: "low" | "medium" | "high";
  itemCount: number;
  itemsMissingActual: number;
  category: "shipped_missing_actual" | "outsourced_missing_vendor_actual";
  items: Array<{
    id: string;
    productName: string;
    totalPrice: number;
    estimatedCostCents: number;
    actualCostCents: number;
    vendorCostCents: number;
  }>;
}

// ── Validation ──────────────────────────────────────────────────

export function isValidVarianceReason(reason: string): reason is VarianceReason {
  return VALID_VARIANCE_REASONS.includes(reason as VarianceReason);
}

// ── Single item actual cost update ──────────────────────────────

export async function updateItemActualCost(params: {
  orderItemId: string;
  actualCostCents: number;
  varianceReason?: string;
  varianceNote?: string;
  operatorId: string;
  operatorName: string;
}): Promise<ItemCostResult> {
  const { orderItemId, actualCostCents, varianceReason, varianceNote, operatorId, operatorName } = params;

  // Fetch current item
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: {
      id: true,
      orderId: true,
      productName: true,
      totalPrice: true,
      estimatedCostCents: true,
      actualCostCents: true,
    },
  });

  if (!item) {
    throw new Error(`OrderItem ${orderItemId} not found`);
  }

  const previousActualCost = item.actualCostCents;

  // Update the item
  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { actualCostCents },
  });

  // Compute variance vs estimated
  const variance = computeVarianceDetail(item.estimatedCostCents, actualCostCents);

  // Activity log (fire-and-forget)
  logActivity({
    action: "actual_cost_updated",
    entity: "order_item",
    entityId: orderItemId,
    actor: operatorName || operatorId,
    details: {
      orderId: item.orderId,
      productName: item.productName,
      previousCost: previousActualCost,
      newCost: actualCostCents,
      estimatedCost: item.estimatedCostCents,
      varianceCents: variance.varianceCents,
      variancePct: variance.variancePct,
      varianceDirection: variance.direction,
      varianceReason: varianceReason || null,
      varianceNote: varianceNote || null,
    },
  });

  return {
    itemId: item.id,
    productName: item.productName,
    previousActualCost,
    newActualCost: actualCostCents,
    estimatedCostCents: item.estimatedCostCents,
    totalPrice: item.totalPrice,
    variance,
    varianceReason,
    varianceNote,
  };
}

// ── Batch update: all items in an order ─────────────────────────

export async function updateOrderActualCosts(params: {
  orderId: string;
  items: ActualCostUpdate[];
  operatorId: string;
  operatorName: string;
}): Promise<OrderCostResult> {
  const { orderId, items: updates, operatorId, operatorName } = params;

  // Verify order exists and load its items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      totalAmount: true,
      materialCost: true,
      laborCost: true,
      shippingCost: true,
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
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Validate all item IDs belong to this order
  const orderItemIds = new Set(order.items.map((i) => i.id));
  for (const update of updates) {
    if (!orderItemIds.has(update.orderItemId)) {
      throw new Error(`Item ${update.orderItemId} does not belong to order ${orderId}`);
    }
  }

  // Update each item
  const itemResults: ItemCostResult[] = [];
  for (const update of updates) {
    const existingItem = order.items.find((i) => i.id === update.orderItemId)!;
    const previousActualCost = existingItem.actualCostCents;

    await prisma.orderItem.update({
      where: { id: update.orderItemId },
      data: { actualCostCents: update.actualCostCents },
    });

    const variance = computeVarianceDetail(existingItem.estimatedCostCents, update.actualCostCents);

    itemResults.push({
      itemId: update.orderItemId,
      productName: existingItem.productName,
      previousActualCost,
      newActualCost: update.actualCostCents,
      estimatedCostCents: existingItem.estimatedCostCents,
      totalPrice: existingItem.totalPrice,
      variance,
      varianceReason: update.varianceReason,
      varianceNote: update.varianceNote,
    });
  }

  // Re-read all items to get fresh costs for order-level calc
  const freshItems = await prisma.orderItem.findMany({
    where: { orderId },
    select: {
      totalPrice: true,
      materialCostCents: true,
      estimatedCostCents: true,
      actualCostCents: true,
      vendorCostCents: true,
    },
  });

  // Compute order profit with fresh data
  const orderProfit = computeOrderProfit({
    totalAmount: order.totalAmount,
    materialCost: order.materialCost,
    laborCost: order.laborCost,
    shippingCost: order.shippingCost,
    items: freshItems,
  });

  // Update order-level actual margin only when ALL items have actual costs
  const allItemsHaveActual = freshItems.every((i) => i.actualCostCents > 0);
  if (orderProfit.actualMarginPct != null && allItemsHaveActual) {
    await prisma.order.update({
      where: { id: orderId },
      data: { actualMarginPct: orderProfit.actualMarginPct },
    });
  }

  // Compute order-level variance (sum of estimated vs sum of actual)
  const totalEstimated = freshItems.reduce((s, i) => s + (i.estimatedCostCents || 0), 0);
  const totalActual = freshItems.reduce((s, i) => s + i.actualCostCents, 0);
  const orderVariance = computeVarianceDetail(totalEstimated, totalActual);

  // Activity log (fire-and-forget)
  logActivity({
    action: "order_actual_costs_updated",
    entity: "order",
    entityId: orderId,
    actor: operatorName || operatorId,
    details: {
      itemsUpdated: itemResults.length,
      estimatedMarginPct: orderProfit.estimatedMarginPct,
      actualMarginPct: orderProfit.actualMarginPct,
      orderVarianceCents: orderVariance.varianceCents,
      orderVariancePct: orderVariance.variancePct,
      items: itemResults.map((r) => ({
        itemId: r.itemId,
        product: r.productName,
        from: r.previousActualCost,
        to: r.newActualCost,
        varianceCents: r.variance.varianceCents,
        reason: r.varianceReason || null,
      })),
    },
  });

  return {
    orderId,
    totalAmount: order.totalAmount,
    estimatedMarginPct: orderProfit.estimatedMarginPct,
    actualMarginPct: orderProfit.actualMarginPct,
    estimatedCostCents: orderProfit.estimatedCostCents,
    actualCostCents: orderProfit.actualCostCents,
    itemsUpdated: itemResults.length,
    items: itemResults,
    orderVariance,
  };
}

// ── Query: orders needing actual cost entry ─────────────────────

function computeUrgency(daysSinceShipment: number | null): "low" | "medium" | "high" {
  if (daysSinceShipment == null) return "low";
  if (daysSinceShipment > 30) return "high";
  if (daysSinceShipment >= 7) return "medium";
  return "low";
}

export async function getOrdersNeedingActualCost(params: {
  days?: number;
  limit?: number;
  category?: "shipped_missing_actual" | "outsourced_missing_vendor_actual";
}): Promise<OrderWithMissingCost[]> {
  const since = new Date();
  since.setDate(since.getDate() - (params.days || 60));
  const limit = params.limit || 50;

  // Find shipped/completed orders with items missing actual cost
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      status: { notIn: ["canceled", "refunded", "draft"] },
      productionStatus: { in: ["shipped", "completed", "ready_to_ship"] },
      totalAmount: { gt: 0 },
    },
    include: {
      items: {
        select: {
          id: true,
          productName: true,
          totalPrice: true,
          estimatedCostCents: true,
          actualCostCents: true,
          vendorCostCents: true,
        },
      },
      timeline: {
        where: { action: "shipped" },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" }, // oldest first (most urgent)
    take: limit * 3, // fetch extra, filter below
  });

  const now = new Date();
  const results: OrderWithMissingCost[] = [];

  for (const order of orders) {
    if (results.length >= limit) break;

    const shippedEvent = order.timeline[0] ?? null;
    const shippedAt = shippedEvent?.createdAt ?? null;
    const daysSinceShipment = shippedAt
      ? Math.floor((now.getTime() - shippedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Category 1: shipped but missing actual cost on items with estimated cost
    const itemsMissingActual = order.items.filter(
      (i) => i.actualCostCents === 0 && i.estimatedCostCents > 0
    );
    if (itemsMissingActual.length > 0) {
      if (!params.category || params.category === "shipped_missing_actual") {
        results.push({
          orderId: order.id,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          status: order.status,
          productionStatus: order.productionStatus,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          shippedAt,
          daysSinceShipment,
          urgency: computeUrgency(daysSinceShipment),
          itemCount: order.items.length,
          itemsMissingActual: itemsMissingActual.length,
          category: "shipped_missing_actual",
          items: order.items,
        });
      }
    }

    // Category 2: outsourced items missing vendor actual cost (no cost data at all)
    const itemsMissingVendor = order.items.filter(
      (i) => i.actualCostCents === 0 && i.vendorCostCents === 0 && i.estimatedCostCents === 0 && i.totalPrice > 0
    );
    if (itemsMissingVendor.length > 0) {
      if (!params.category || params.category === "outsourced_missing_vendor_actual") {
        // Avoid duplicate entries for same order
        const alreadyAdded = results.some(
          (r) => r.orderId === order.id && r.category === "outsourced_missing_vendor_actual"
        );
        if (!alreadyAdded) {
          results.push({
            orderId: order.id,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            status: order.status,
            productionStatus: order.productionStatus,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            shippedAt,
            daysSinceShipment,
            urgency: computeUrgency(daysSinceShipment),
            itemCount: order.items.length,
            itemsMissingActual: itemsMissingVendor.length,
            category: "outsourced_missing_vendor_actual",
            items: order.items,
          });
        }
      }
    }
  }

  return results;
}
