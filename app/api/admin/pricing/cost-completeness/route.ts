import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/pricing/cost-completeness?days=30
 * Returns cost completeness stats across recent orders.
 *
 * Response: {
 *   totalItems, withActualCost, withoutActualCost, completionRate,
 *   recentMissing: [{ orderId, itemId, productName, estimatedCostCents, totalPrice, createdAt }]
 * }
 */
export async function GET(request: NextRequest) {
  // Cost completeness is pricing-center-owned: it tracks vendor cost data quality
  // for pricing operations, not general analytics.
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30") || 30, 1), 365);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // ── Query recent orders with items ─────────────────────────────
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { notIn: ["draft", "canceled", "refunded"] },
      },
      select: {
        id: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            totalPrice: true,
            estimatedCostCents: true,
            actualCostCents: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Compute stats ──────────────────────────────────────────────
    // Only count items that have estimatedCostCents > 0 (items with cost tracking)
    let totalItems = 0;
    let withActualCost = 0;
    let withoutActualCost = 0;

    const missingItems: Array<{
      orderId: string;
      itemId: string;
      productName: string;
      estimatedCostCents: number;
      totalPrice: number;
      createdAt: Date;
    }> = [];

    for (const order of orders) {
      for (const item of order.items) {
        // Only count items that have cost tracking set up
        if (item.estimatedCostCents > 0) {
          totalItems++;
          if (item.actualCostCents > 0) {
            withActualCost++;
          } else {
            withoutActualCost++;
            missingItems.push({
              orderId: order.id,
              itemId: item.id,
              productName: item.productName,
              estimatedCostCents: item.estimatedCostCents,
              totalPrice: item.totalPrice,
              createdAt: item.createdAt,
            });
          }
        }
      }
    }

    const completionRate = totalItems > 0
      ? Math.round((withActualCost / totalItems) * 10000) / 100
      : 0;

    // ── Return top 20 recent missing items ─────────────────────────
    // Already sorted by order.createdAt desc, so take first 20
    const recentMissing = missingItems.slice(0, 20);

    return NextResponse.json({
      days,
      totalOrders: orders.length,
      totalItems,
      withActualCost,
      withoutActualCost,
      completionRate,
      recentMissing,
    });
  } catch (err) {
    console.error("[admin/pricing/cost-completeness] GET error:", err);
    return NextResponse.json(
      { error: "Failed to compute cost completeness" },
      { status: 500 }
    );
  }
}
