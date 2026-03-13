import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/revenue-trend
 * Revenue comparison: current period vs previous period.
 * Shows daily revenue and computes growth rate.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30")));
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

    // Current period daily revenue
    const currentDaily = await prisma.$queryRaw`
      SELECT
        date_trunc('day', "paidAt")::date AS "date",
        COUNT(*)::int AS "orders",
        SUM("totalAmount")::int AS "revenue"
      FROM "Order"
      WHERE "paymentStatus" = 'paid'
        AND "paidAt" >= ${currentStart}
        AND "paidAt" < ${now}
      GROUP BY date_trunc('day', "paidAt")
      ORDER BY "date"
    ` as Array<{ date: Date; orders: number; revenue: number }>;

    // Previous period totals for comparison
    const previousTotals = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "orders",
        COALESCE(SUM("totalAmount"), 0)::int AS "revenue"
      FROM "Order"
      WHERE "paymentStatus" = 'paid'
        AND "paidAt" >= ${previousStart}
        AND "paidAt" < ${currentStart}
    ` as Array<{ orders: number; revenue: number }>;

    // Current period totals
    const currentTotalRevenue = currentDaily.reduce((s, d) => s + d.revenue, 0);
    const currentTotalOrders = currentDaily.reduce((s, d) => s + d.orders, 0);
    const prevTotals = previousTotals[0] || { orders: 0, revenue: 0 };

    // Growth calculations
    const revenueGrowth = prevTotals.revenue > 0
      ? Math.round(((currentTotalRevenue - prevTotals.revenue) / prevTotals.revenue) * 10000) / 100
      : null;
    const orderGrowth = prevTotals.orders > 0
      ? Math.round(((currentTotalOrders - prevTotals.orders) / prevTotals.orders) * 10000) / 100
      : null;

    // Average order value
    const currentAOV = currentTotalOrders > 0
      ? Math.round(currentTotalRevenue / currentTotalOrders)
      : 0;
    const previousAOV = prevTotals.orders > 0
      ? Math.round(prevTotals.revenue / prevTotals.orders)
      : 0;

    return NextResponse.json({
      period: { days, from: currentStart.toISOString(), to: now.toISOString() },
      daily: currentDaily,
      current: {
        revenue: currentTotalRevenue,
        orders: currentTotalOrders,
        aov: currentAOV,
      },
      previous: {
        revenue: prevTotals.revenue,
        orders: prevTotals.orders,
        aov: previousAOV,
      },
      growth: {
        revenuePct: revenueGrowth,
        ordersPct: orderGrowth,
        aovChange: currentAOV - previousAOV,
      },
    });
  } catch (error) {
    console.error("[Revenue Trend] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue trend" },
      { status: 500 }
    );
  }
}
