import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case "7d":
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "12m":
        periodStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
      default:
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Date boundaries for today/week/month
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekStart = new Date(todayStart.getTime() - todayStart.getUTCDay() * 24 * 60 * 60 * 1000);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // Revenue queries (paid orders)
    const [todayRevenue, weekRevenue, monthRevenue, periodRevenue] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: "paid", paidAt: { gte: todayStart } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: "paid", paidAt: { gte: weekStart } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: "paid", paidAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: "paid", paidAt: { gte: periodStart } },
        _sum: { totalAmount: true },
      }),
    ]);

    // Expense queries
    const [todayExpenses, weekExpenses, monthExpenses, periodExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: todayStart } },
        _sum: { amountCents: true },
      }),
      prisma.expense.aggregate({
        where: { date: { gte: weekStart } },
        _sum: { amountCents: true },
      }),
      prisma.expense.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { amountCents: true },
      }),
      prisma.expense.aggregate({
        where: { date: { gte: periodStart } },
        _sum: { amountCents: true },
      }),
    ]);

    // Profit margins
    const periodRev = periodRevenue._sum.totalAmount || 0;
    const periodExp = periodExpenses._sum.amountCents || 0;
    const periodProfit = periodRev - periodExp;
    const periodMargin = periodRev > 0 ? Math.round((periodProfit / periodRev) * 10000) / 100 : 0;

    // Top 5 products by revenue (in the period)
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productName"],
      where: {
        order: { paymentStatus: "paid", paidAt: { gte: periodStart } },
      },
      _sum: { totalPrice: true },
      _count: { id: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    });

    // Revenue trend (daily for last 30 days, or adjusted for period)
    const trendDays = period === "12m" ? 365 : period === "90d" ? 90 : period === "7d" ? 7 : 30;
    const trendStart = new Date(now.getTime() - trendDays * 24 * 60 * 60 * 1000);

    const trendOrders = await prisma.order.findMany({
      where: { paymentStatus: "paid", paidAt: { gte: trendStart } },
      select: { paidAt: true, totalAmount: true },
      orderBy: { paidAt: "asc" },
    });

    // Group by date
    const revenueTrend: Record<string, number> = {};
    for (let d = 0; d < trendDays; d++) {
      const date = new Date(trendStart.getTime() + d * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split("T")[0];
      revenueTrend[key] = 0;
    }
    for (const order of trendOrders) {
      if (order.paidAt) {
        const key = order.paidAt.toISOString().split("T")[0];
        if (revenueTrend[key] !== undefined) {
          revenueTrend[key] += order.totalAmount;
        }
      }
    }

    const revenueTrendArray = Object.entries(revenueTrend).map(([date, amount]) => ({
      date,
      amount,
    }));

    // Expense breakdown by category
    const expenseBreakdown = await prisma.expense.groupBy({
      by: ["category"],
      where: { date: { gte: periodStart } },
      _sum: { amountCents: true },
      _count: { id: true },
    });

    return NextResponse.json({
      data: {
        revenue: {
          today: todayRevenue._sum.totalAmount || 0,
          week: weekRevenue._sum.totalAmount || 0,
          month: monthRevenue._sum.totalAmount || 0,
          period: periodRev,
        },
        expenses: {
          today: todayExpenses._sum.amountCents || 0,
          week: weekExpenses._sum.amountCents || 0,
          month: monthExpenses._sum.amountCents || 0,
          period: periodExp,
        },
        profit: {
          period: periodProfit,
          marginPercent: periodMargin,
        },
        topProducts: topProducts.map((p) => ({
          productName: p.productName,
          revenue: p._sum.totalPrice || 0,
          orderCount: p._count.id,
        })),
        revenueTrend: revenueTrendArray,
        expenseBreakdown: expenseBreakdown.map((e) => ({
          category: e.category,
          total: e._sum.amountCents || 0,
          count: e._count.id,
        })),
      },
    });
  } catch (err) {
    console.error("[Finance Overview GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch financial overview" },
      { status: 500 }
    );
  }
}
