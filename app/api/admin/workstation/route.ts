import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "dashboard", "view");
    if (!auth.authenticated) return auth.response;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Run all queries in parallel for maximum efficiency
    const [
      // Row 1: Urgent action counts
      pendingOrders,
      pendingProofs,
      openQC,
      openTickets,

      // Row 2: Production pipeline counts
      preflightOrders,
      inProductionOrders,
      readyToShipOrders,
      shippedTodayOrders,

      // Row 3: Today's recent paid orders
      recentOrders,

      // Row 4: Recent activity logs
      recentActivity,

      // Today's revenue
      todayRevenue,

      // Row 5: Exception orders (need attention)
      exceptionOrders,

      // Row 6: Aging orders count
      agingOrders,

      // Row 7: Week revenue
      weekRevenue,
    ] = await Promise.all([
      // 1. Orders with status=paid AND productionStatus=not_started
      prisma.order.count({
        where: {
          status: "paid",
          productionStatus: "not_started",
        },
      }),

      // 2. Proofs awaiting review
      prisma.orderProof.count({
        where: { status: "pending" },
      }),

      // 3. QC issues open
      prisma.qCReport.count({
        where: { resolution: "pending" },
      }),

      // 4. Support tickets open or in_progress
      prisma.supportTicket.count({
        where: {
          status: { in: ["open", "in_progress"] },
        },
      }),

      // Pipeline: preflight
      prisma.order.count({
        where: { productionStatus: "preflight" },
      }),

      // Pipeline: in_production
      prisma.order.count({
        where: { productionStatus: "in_production" },
      }),

      // Pipeline: ready_to_ship
      prisma.order.count({
        where: { productionStatus: "ready_to_ship" },
      }),

      // Pipeline: shipped today
      prisma.order.count({
        where: {
          productionStatus: "shipped",
          updatedAt: { gte: startOfToday, lt: endOfToday },
        },
      }),

      // Recent paid orders (latest 10 from today, falling back to most recent)
      prisma.order.findMany({
        where: { status: "paid" },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          customerEmail: true,
          customerName: true,
          totalAmount: true,
          status: true,
          productionStatus: true,
          tags: true,
          priority: true,
          createdAt: true,
          _count: { select: { items: true } },
          items: {
            take: 1,
            orderBy: { totalPrice: "desc" },
            select: {
              productName: true,
              fileUrl: true,
              widthIn: true,
              heightIn: true,
              material: true,
              meta: true,
            },
          },
        },
      }),

      // Recent activity logs
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          actor: true,
          details: true,
          createdAt: true,
        },
      }),

      // Today's revenue (paid orders created today)
      prisma.order.aggregate({
        where: {
          status: { in: ["paid", "completed"] },
          paidAt: { gte: startOfToday, lt: endOfToday },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Exception orders: on_hold, high priority, or needs attention
      prisma.order.findMany({
        where: {
          OR: [
            { productionStatus: "on_hold" },
            { priority: { gt: 0 } },
            { tags: { hasSome: ["white-ink", "transparent-material", "bulk", "exception", "missing-artwork", "two-sided", "rush", "compliance", "food-safe", "foil-press", "design-help", "floor-graphic", "vehicle", "large-format"] } },
          ],
          status: { notIn: ["canceled", "refunded"] },
          isArchived: false,
        },
        take: 10,
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          customerEmail: true,
          customerName: true,
          totalAmount: true,
          status: true,
          productionStatus: true,
          priority: true,
          tags: true,
          createdAt: true,
          _count: { select: { items: true } },
          items: {
            take: 1,
            orderBy: { totalPrice: "desc" },
            select: {
              productName: true,
              fileUrl: true,
              widthIn: true,
              heightIn: true,
              material: true,
              meta: true,
            },
          },
        },
      }),

      // Aging orders: paid orders stuck in early pipeline stages for 24+ hours
      prisma.order.count({
        where: {
          status: "paid",
          productionStatus: { in: ["not_started", "preflight"] },
          isArchived: false,
          updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      }),

      // Week revenue (last 7 days total)
      prisma.order.aggregate({
        where: {
          status: { in: ["paid", "completed"] },
          paidAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      data: {
        pendingOrders,
        pendingProofs,
        openQC,
        openTickets,
        pipeline: {
          preflight: preflightOrders,
          in_production: inProductionOrders,
          ready_to_ship: readyToShipOrders,
          shipped_today: shippedTodayOrders,
        },
        recentOrders,
        recentActivity,
        todayRevenue: {
          amount: todayRevenue._sum.totalAmount || 0,
          count: todayRevenue._count || 0,
        },
        weekRevenue: {
          amount: weekRevenue._sum.totalAmount || 0,
          count: weekRevenue._count || 0,
        },
        agingOrders,
        exceptionOrders,
      },
    });
  } catch (err) {
    console.error("[admin/workstation] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load workstation data" },
      { status: 500 }
    );
  }
}
