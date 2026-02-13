import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "dashboard", "view");
  if (!auth.authenticated) return auth.response;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayOrders,
    pendingOrders,
    monthRevenue,
    totalOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.order.count({
      where: { status: "pending" },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        paymentStatus: "paid",
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    }),
  ]);

  return NextResponse.json({
    todayOrders,
    pendingOrders,
    monthRevenue: monthRevenue._sum.totalAmount || 0,
    totalOrders,
    recentOrders,
  });
}
