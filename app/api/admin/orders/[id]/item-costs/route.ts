import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";
import { computeOrderProfit } from "@/lib/pricing/profit-tracking";
import { computeOrderCostSignals } from "@/lib/pricing/production-cost-signal";

/**
 * PATCH /api/admin/orders/[id]/item-costs
 * Update actualCostCents on individual order items.
 *
 * Body: { items: [{ itemId: string, actualCostCents: number }] }
 * Returns: { updated: number, items: [...], orderProfit: { ... } }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id: orderId } = await params;
    const body = await request.json();

    // ── Validate request body ──────────────────────────────────────
    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      );
    }

    for (const entry of items) {
      if (!entry.itemId || typeof entry.itemId !== "string") {
        return NextResponse.json(
          { error: "Each item must have a string itemId" },
          { status: 400 }
        );
      }
      const cost = parseInt(entry.actualCostCents);
      if (isNaN(cost) || cost < 0) {
        return NextResponse.json(
          { error: `actualCostCents must be a non-negative integer (got ${entry.actualCostCents} for item ${entry.itemId})` },
          { status: 400 }
        );
      }
    }

    // ── Verify order exists ────────────────────────────────────────
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
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── Build a map of order item IDs for ownership check ──────────
    const orderItemIds = new Set(order.items.map((i) => i.id));

    // ── Update each item ───────────────────────────────────────────
    const updatedItems: Array<{
      itemId: string;
      productName: string;
      previousCost: number;
      actualCostCents: number;
    }> = [];

    for (const entry of items) {
      if (!orderItemIds.has(entry.itemId)) {
        return NextResponse.json(
          { error: `Item ${entry.itemId} does not belong to order ${orderId}` },
          { status: 404 }
        );
      }

      const costVal = parseInt(entry.actualCostCents);
      const existingItem = order.items.find((i) => i.id === entry.itemId)!;

      await prisma.orderItem.update({
        where: { id: entry.itemId },
        data: { actualCostCents: costVal },
      });

      updatedItems.push({
        itemId: entry.itemId,
        productName: existingItem.productName,
        previousCost: existingItem.actualCostCents,
        actualCostCents: costVal,
      });
    }

    // ── Recompute order profit with updated items ──────────────────
    // Re-read items after updates for accurate profit calc
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

    const orderProfit = computeOrderProfit({
      totalAmount: order.totalAmount,
      materialCost: order.materialCost,
      laborCost: order.laborCost,
      shippingCost: order.shippingCost,
      items: freshItems,
    });

    // ── Update order-level actual margin ───────────────────────────
    if (orderProfit.actualMarginPct != null) {
      await prisma.order.update({
        where: { id: orderId },
        data: { actualMarginPct: orderProfit.actualMarginPct },
      });
    }

    // ── Activity log (fire-and-forget) ─────────────────────────────
    logActivity({
      action: "item_costs_updated",
      entity: "order",
      entityId: orderId,
      actor: auth.user?.name || auth.user?.email || "admin",
      details: {
        updatedCount: updatedItems.length,
        items: updatedItems.map((i) => ({
          itemId: i.itemId,
          product: i.productName,
          from: i.previousCost,
          to: i.actualCostCents,
        })),
      },
    });

    // Recompute cost signal so the originating surface knows the issue is resolved.
    let costSignal = undefined;
    try {
      const freshOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          productionStatus: true,
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
      if (freshOrder) {
        const signals = computeOrderCostSignals(
          freshOrder.items.map((i) => ({
            id: i.id,
            productName: i.productName || "",
            totalPrice: i.totalPrice || 0,
            materialCostCents: i.materialCostCents || 0,
            estimatedCostCents: i.estimatedCostCents || 0,
            actualCostCents: i.actualCostCents || 0,
            vendorCostCents: i.vendorCostCents || 0,
          })),
          orderId,
          freshOrder.status,
          freshOrder.productionStatus,
          { returnTo: `/admin/orders/${orderId}`, source: "item-costs" }
        );
        costSignal = {
          aggregate: signals.aggregate,
          perItem: signals.perItem,
        };
      }
    } catch (_e) {
      // Non-critical
    }

    return NextResponse.json({
      updated: updatedItems.length,
      items: updatedItems,
      orderProfit,
      costSignal,
      refreshHint: { invalidates: ["missingActualCost", "profitAlerts"] },
    });
  } catch (err) {
    console.error("[admin/orders/item-costs] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update item costs" },
      { status: 500 }
    );
  }
}
