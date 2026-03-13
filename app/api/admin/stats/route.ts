import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "dashboard", "view");
    if (!auth.authenticated) return auth.response;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Day boundaries for last 7 days (sparkline data)
    const dayBounds = [];
    for (let i = 6; i >= 0; i--) {
      dayBounds.push({
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - i),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1),
      });
    }

    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      todayOrders,
      yesterdayOrders,
      todayRevenueAgg,
      yesterdayRevenueAgg,
      pendingOrders,
      monthRevenue,
      prevMonthRevenue,
      totalOrders,
      recentOrders,
      // Pipeline counts
      pipelinePreflight,
      pipelineProduction,
      pipelineReady,
      pipelineShippedToday,
      // Needs-attention count
      needsAttention,
      // Rush + overdue jobs
      rushJobCount,
      overdueJobCount,
      ...dailyCounts
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfYesterday, lt: startOfToday } } }),
      // Today's revenue (paid orders created today)
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfToday }, paymentStatus: "paid" },
        _sum: { totalAmount: true },
      }),
      // Yesterday's revenue
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfYesterday, lt: startOfToday }, paymentStatus: "paid" },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { status: "paid", productionStatus: "not_started" } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth }, paymentStatus: "paid" },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: prevMonthStart, lt: startOfMonth }, paymentStatus: "paid" },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          productionStatus: true,
          totalAmount: true,
          createdAt: true,
          customerName: true,
          customerEmail: true,
          tags: true,
          _count: { select: { items: true } },
        },
      }),
      // Pipeline
      prisma.order.count({ where: { productionStatus: "preflight" } }),
      prisma.order.count({ where: { productionStatus: "in_production" } }),
      prisma.order.count({ where: { productionStatus: "ready_to_ship" } }),
      prisma.order.count({ where: { productionStatus: "shipped", updatedAt: { gte: startOfToday, lt: endOfToday } } }),
      // Needs attention (on_hold + missing artwork + rush)
      prisma.order.count({
        where: {
          OR: [
            { productionStatus: "on_hold" },
            { tags: { hasSome: ["missing-artwork", "rush", "exception"] } },
          ],
          status: { notIn: ["canceled", "refunded"] },
          isArchived: false,
        },
      }),
      // Rush + overdue production jobs
      prisma.productionJob.count({
        where: { priority: "urgent", status: { notIn: ["finished", "shipped"] } },
      }),
      prisma.productionJob.count({
        where: { dueAt: { lt: now }, status: { notIn: ["finished", "shipped"] } },
      }),
      ...dayBounds.map(({ start, end }) =>
        prisma.order.count({ where: { createdAt: { gte: start, lt: end } } })
      ),
    ]);

    return NextResponse.json({
      todayOrders,
      yesterdayOrders,
      todayRevenue: todayRevenueAgg._sum.totalAmount || 0,
      yesterdayRevenue: yesterdayRevenueAgg._sum.totalAmount || 0,
      pendingOrders,
      monthRevenue: monthRevenue._sum.totalAmount || 0,
      prevMonthRevenue: prevMonthRevenue._sum.totalAmount || 0,
      totalOrders,
      recentOrders,
      dailyOrders: dailyCounts,
      pipeline: {
        preflight: pipelinePreflight,
        in_production: pipelineProduction,
        ready_to_ship: pipelineReady,
        shipped_today: pipelineShippedToday,
      },
      needsAttention,
      rushJobs: rushJobCount,
      overdueJobs: overdueJobCount,
    });

  } catch (err) {
    console.error("[admin/stats] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
