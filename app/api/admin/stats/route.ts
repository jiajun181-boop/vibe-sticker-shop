import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
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

  const [
    todayOrders,
    yesterdayOrders,
    pendingOrders,
    monthRevenue,
    prevMonthRevenue,
    totalOrders,
    recentOrders,
    ...dailyCounts
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfYesterday, lt: startOfToday } } }),
    prisma.order.count({ where: { status: "pending" } }),
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
        totalAmount: true,
        createdAt: true,
        customerName: true,
        _count: { select: { items: true } },
      },
    }),
    ...dayBounds.map(({ start, end }) =>
      prisma.order.count({ where: { createdAt: { gte: start, lt: end } } })
    ),
  ]);

  return NextResponse.json({
    todayOrders,
    yesterdayOrders,
    pendingOrders,
    monthRevenue: monthRevenue._sum.totalAmount || 0,
    prevMonthRevenue: prevMonthRevenue._sum.totalAmount || 0,
    totalOrders,
    recentOrders,
    dailyOrders: dailyCounts,
  });
}
