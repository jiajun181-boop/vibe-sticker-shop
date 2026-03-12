// app/api/admin/orders/[id]/actual-cost/route.ts
// ═══════════════════════════════════════════════════════════════════
// Actual cost entry API — view estimated vs actual side-by-side,
// and update actual costs for order items with variance tracking.
//
// GET  — Returns order with items showing estimated vs actual costs
// PATCH — Update actual costs for one or more items
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  computeItemProfit,
  computeOrderProfit,
  computeVarianceDetail,
  computeMarginComparison,
} from "@/lib/pricing/profit-tracking";
import {
  updateOrderActualCosts,
  isValidVarianceReason,
} from "@/lib/pricing/actual-cost";
import { computeOrderCostSignals } from "@/lib/pricing/production-cost-signal";

// ── GET: estimated vs actual side-by-side ───────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        customerEmail: true,
        customerName: true,
        status: true,
        productionStatus: true,
        totalAmount: true,
        subtotalAmount: true,
        shippingAmount: true,
        materialCost: true,
        laborCost: true,
        shippingCost: true,
        estimatedMarginPct: true,
        actualMarginPct: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            productType: true,
            quantity: true,
            unitPrice: true,
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

    // Per-item profit and variance
    const itemDetails = order.items.map((item) => {
      const profit = computeItemProfit(item);
      const hasActual = item.actualCostCents > 0;
      const variance = hasActual
        ? computeVarianceDetail(item.estimatedCostCents, item.actualCostCents)
        : null;

      return {
        id: item.id,
        productName: item.productName,
        productType: item.productType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        estimatedCostCents: item.estimatedCostCents,
        actualCostCents: item.actualCostCents,
        materialCostCents: item.materialCostCents,
        vendorCostCents: item.vendorCostCents,
        profit,
        variance,
        hasActualCost: hasActual,
      };
    });

    // Order-level profit
    const orderProfit = computeOrderProfit({
      totalAmount: order.totalAmount,
      materialCost: order.materialCost,
      laborCost: order.laborCost,
      shippingCost: order.shippingCost,
      items: order.items,
    });

    // Margin comparison
    const marginComparison = computeMarginComparison({
      totalAmount: order.totalAmount,
      items: order.items,
    });

    return NextResponse.json({
      order: {
        id: order.id,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        status: order.status,
        productionStatus: order.productionStatus,
        totalAmount: order.totalAmount,
        subtotalAmount: order.subtotalAmount,
        shippingAmount: order.shippingAmount,
        estimatedMarginPct: order.estimatedMarginPct,
        actualMarginPct: order.actualMarginPct,
        createdAt: order.createdAt,
      },
      profit: orderProfit,
      marginComparison,
      items: itemDetails,
    });
  } catch (err) {
    console.error("[actual-cost] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to load order cost data" },
      { status: 500 }
    );
  }
}

// ── PATCH: update actual costs ──────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id: orderId } = await params;
    const body = await request.json();

    // Validate request body
    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each item entry
    for (const entry of items) {
      if (!entry.orderItemId || typeof entry.orderItemId !== "string") {
        return NextResponse.json(
          { error: "Each item must have a string orderItemId" },
          { status: 400 }
        );
      }

      const cost = parseInt(entry.actualCostCents);
      if (isNaN(cost) || cost < 0) {
        return NextResponse.json(
          { error: `actualCostCents must be a non-negative integer (got ${entry.actualCostCents} for item ${entry.orderItemId})` },
          { status: 400 }
        );
      }

      if (entry.varianceReason && !isValidVarianceReason(entry.varianceReason)) {
        return NextResponse.json(
          { error: `Invalid varianceReason "${entry.varianceReason}". Valid values: material_price_change, labor_overtime, shipping_increase, vendor_price_change, waste, rework, other` },
          { status: 400 }
        );
      }
    }

    // Verify order exists
    const orderCheck = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!orderCheck) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Perform the update
    const result = await updateOrderActualCosts({
      orderId,
      items: items.map((entry: { orderItemId: string; actualCostCents: number; varianceReason?: string; varianceNote?: string }) => ({
        orderItemId: entry.orderItemId,
        actualCostCents: parseInt(String(entry.actualCostCents)),
        varianceReason: entry.varianceReason as import("@/lib/pricing/actual-cost").VarianceReason | undefined,
        varianceNote: entry.varianceNote,
      })),
      operatorId: auth.user?.id || "unknown",
      operatorName: auth.user?.name || auth.user?.email || "admin",
    });

    // Recompute cost signal after the update so the UI can immediately
    // reflect the resolution (e.g., "missing-cost" → "normal").
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
          { returnTo: `/admin/orders/${orderId}`, source: "actual-cost" }
        );
        costSignal = {
          aggregate: signals.aggregate,
          perItem: signals.perItem,
        };
      }
    } catch (_e) {
      // Non-critical: cost signal recomputation failure shouldn't block the response
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      itemsUpdated: result.itemsUpdated,
      estimatedMarginPct: result.estimatedMarginPct,
      actualMarginPct: result.actualMarginPct,
      estimatedCostCents: result.estimatedCostCents,
      actualCostCents: result.actualCostCents,
      orderVariance: result.orderVariance,
      costSignal,
      // Tell the UI which home-summary sections this mutation affects
      refreshHint: { invalidates: ["missingActualCost", "profitAlerts"] },
      items: result.items.map((item) => ({
        itemId: item.itemId,
        productName: item.productName,
        previousActualCost: item.previousActualCost,
        newActualCost: item.newActualCost,
        estimatedCostCents: item.estimatedCostCents,
        variance: item.variance,
        varianceReason: item.varianceReason || null,
        varianceNote: item.varianceNote || null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Item-not-found or order-not-found from the service layer
    if (message.includes("not found") || message.includes("does not belong")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    console.error("[actual-cost] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update actual costs" },
      { status: 500 }
    );
  }
}
