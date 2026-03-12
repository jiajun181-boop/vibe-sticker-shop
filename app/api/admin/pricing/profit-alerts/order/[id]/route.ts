// app/api/admin/pricing/profit-alerts/order/[id]/route.ts
// Single-order profit detail — items, margins, alerts, variance.
// Read-only. Does not modify any data.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  computeItemProfit,
  computeOrderProfit,
  computeVarianceDetail,
  computeMarginComparison,
  detectProfitAlerts,
  detectMissingCostAlerts,
} from "@/lib/pricing/profit-tracking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "view");
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
            meta: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Compute order-level profit
    const profit = computeOrderProfit({
      totalAmount: order.totalAmount,
      materialCost: order.materialCost,
      laborCost: order.laborCost,
      shippingCost: order.shippingCost,
      items: order.items,
    });

    // Compute margin comparison (estimated vs actual side-by-side)
    const marginComparison = computeMarginComparison({
      totalAmount: order.totalAmount,
      items: order.items,
    });

    // Compute per-item profit and variance
    const itemDetails = order.items.map((item) => {
      const itemProfit = computeItemProfit(item);
      const hasActual = item.actualCostCents > 0;
      const variance = hasActual
        ? computeVarianceDetail(item.estimatedCostCents, item.actualCostCents)
        : null;

      return {
        ...item,
        profit: itemProfit,
        variance,
        hasActualCost: hasActual,
      };
    });

    // Detect margin alerts
    const marginAlerts = detectProfitAlerts(order.id, order.items);

    // Detect missing-cost alerts
    const missingCostAlerts = detectMissingCostAlerts(
      order.id,
      order.items,
      order.status,
      order.productionStatus
    );

    const allAlerts = [...marginAlerts, ...missingCostAlerts];

    // Build variance reasons summary (items that have actual costs and a variance)
    const varianceReasons: Array<{
      itemId: string;
      productName: string;
      varianceCents: number;
      variancePct: number;
      direction: "over" | "under" | "match";
    }> = [];

    for (const item of itemDetails) {
      if (item.variance && item.variance.direction !== "match") {
        varianceReasons.push({
          itemId: item.id,
          productName: item.productName,
          varianceCents: item.variance.varianceCents,
          variancePct: item.variance.variancePct,
          direction: item.variance.direction,
        });
      }
    }

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
      profit,
      marginComparison,
      items: itemDetails,
      alerts: allAlerts,
      alertCount: allAlerts.length,
      varianceReasons,
    });
  } catch (err) {
    console.error("[profit-alerts/order] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to compute order profit" },
      { status: 500 }
    );
  }
}
