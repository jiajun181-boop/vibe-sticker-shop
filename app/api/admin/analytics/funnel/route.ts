import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/funnel?days=30
 *
 * Returns conversion funnel metrics:
 * - Checkouts started (orders created)
 * - Payments completed
 * - Repeat customers
 * - Production pipeline breakdown
 * - Average fulfillment time
 * - Daily conversion chart data
 */

interface MetricsRow { total_orders: bigint; paid_orders: bigint; total_revenue: bigint; avg_order: bigint }
interface CountRow { count: bigint }
interface StatusRow { status: string; count: bigint }
interface AvgRow { avg_hours: number | null }
interface DailyRow { day: Date; created: bigint; paid: bigint; revenue: bigint }

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const since = new Date();
    since.setDate(since.getDate() - days);

    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);

    const [
      currentMetrics,
      prevMetrics,
      repeatCustomers,
      prevRepeatCustomers,
      productionBreakdown,
      avgFulfillmentTime,
      recentConversions,
    ] = await Promise.all([
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            COUNT(*)::bigint AS total_orders,
            COUNT(*) FILTER (WHERE "paymentStatus" = 'paid')::bigint AS paid_orders,
            COALESCE(SUM("totalAmount") FILTER (WHERE "paymentStatus" = 'paid'), 0)::bigint AS total_revenue,
            CASE WHEN COUNT(*) FILTER (WHERE "paymentStatus" = 'paid') > 0
              THEN (SUM("totalAmount") FILTER (WHERE "paymentStatus" = 'paid') / COUNT(*) FILTER (WHERE "paymentStatus" = 'paid'))::bigint
              ELSE 0::bigint END AS avg_order
          FROM "Order"
          WHERE "createdAt" >= ${since}
        `
      ) as Promise<MetricsRow[]>,

      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            COUNT(*)::bigint AS total_orders,
            COUNT(*) FILTER (WHERE "paymentStatus" = 'paid')::bigint AS paid_orders,
            COALESCE(SUM("totalAmount") FILTER (WHERE "paymentStatus" = 'paid'), 0)::bigint AS total_revenue
          FROM "Order"
          WHERE "createdAt" >= ${prevSince} AND "createdAt" < ${since}
        `
      ) as Promise<MetricsRow[]>,

      prisma.$queryRaw(
        Prisma.sql`
          SELECT COUNT(DISTINCT "customerEmail")::bigint AS count
          FROM "Order"
          WHERE "paymentStatus" = 'paid' AND "createdAt" >= ${since}
            AND "customerEmail" IN (
              SELECT "customerEmail" FROM "Order"
              WHERE "paymentStatus" = 'paid'
              GROUP BY "customerEmail" HAVING COUNT(*) >= 2
            )
        `
      ) as Promise<CountRow[]>,

      prisma.$queryRaw(
        Prisma.sql`
          SELECT COUNT(DISTINCT "customerEmail")::bigint AS count
          FROM "Order"
          WHERE "paymentStatus" = 'paid' AND "createdAt" >= ${prevSince} AND "createdAt" < ${since}
            AND "customerEmail" IN (
              SELECT "customerEmail" FROM "Order"
              WHERE "paymentStatus" = 'paid'
              GROUP BY "customerEmail" HAVING COUNT(*) >= 2
            )
        `
      ) as Promise<CountRow[]>,

      prisma.$queryRaw(
        Prisma.sql`
          SELECT "productionStatus" AS status, COUNT(*)::bigint AS count
          FROM "Order"
          WHERE "paymentStatus" = 'paid' AND "createdAt" >= ${since}
          GROUP BY "productionStatus"
          ORDER BY count DESC
        `
      ) as Promise<StatusRow[]>,

      prisma.$queryRaw(
        Prisma.sql`
          SELECT AVG(EXTRACT(EPOCH FROM (t."createdAt" - o."createdAt")) / 3600)::float AS avg_hours
          FROM "OrderTimeline" t
          JOIN "Order" o ON o.id = t."orderId"
          WHERE t."action" = 'shipped'
            AND o."createdAt" >= ${since}
        `
      ) as Promise<AvgRow[]>,

      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            DATE_TRUNC('day', "createdAt") AS day,
            COUNT(*)::bigint AS created,
            COUNT(*) FILTER (WHERE "paymentStatus" = 'paid')::bigint AS paid,
            COALESCE(SUM("totalAmount") FILTER (WHERE "paymentStatus" = 'paid'), 0)::bigint AS revenue
          FROM "Order"
          WHERE "createdAt" >= ${since}
          GROUP BY day
          ORDER BY day ASC
        `
      ) as Promise<DailyRow[]>,
    ]);

    const zero = BigInt(0);
    const cur = currentMetrics[0] || { total_orders: zero, paid_orders: zero, total_revenue: zero, avg_order: zero };
    const prev = prevMetrics[0] || { total_orders: zero, paid_orders: zero, total_revenue: zero };

    const totalOrders = Number(cur.total_orders);
    const paidOrders = Number(cur.paid_orders);
    const totalRevenue = Number(cur.total_revenue);
    const avgOrder = Number(cur.avg_order);
    const prevTotal = Number(prev.total_orders);
    const prevPaid = Number(prev.paid_orders);
    const prevRevenue = Number(prev.total_revenue);

    const paymentRate = totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 1000) / 10 : 0;
    const prevPaymentRate = prevTotal > 0 ? Math.round((prevPaid / prevTotal) * 1000) / 10 : 0;

    const repeatCount = Number(repeatCustomers[0]?.count || zero);
    const prevRepeatCount = Number(prevRepeatCustomers[0]?.count || zero);
    const repeatRate = paidOrders > 0 ? Math.round((repeatCount / paidOrders) * 1000) / 10 : 0;

    const avgHours = avgFulfillmentTime[0]?.avg_hours;

    return NextResponse.json({
      period: `${days}d`,
      funnel: {
        checkoutsStarted: totalOrders,
        paymentCompleted: paidOrders,
        paymentRate,
        paymentRateChange: Math.round((paymentRate - prevPaymentRate) * 10) / 10,
        revenue: totalRevenue,
        revenueChange: prevRevenue > 0
          ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10
          : totalRevenue > 0 ? 100 : 0,
        avgOrderValue: avgOrder,
        repeatCustomers: repeatCount,
        repeatRate,
        repeatRateChange: prevRepeatCount > 0
          ? Math.round(((repeatCount - prevRepeatCount) / prevRepeatCount) * 1000) / 10
          : repeatCount > 0 ? 100 : 0,
        avgFulfillmentHours: avgHours ? Math.round(avgHours * 10) / 10 : null,
      },
      productionBreakdown: productionBreakdown.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      dailyConversions: recentConversions.map((r) => ({
        date: r.day,
        created: Number(r.created),
        paid: Number(r.paid),
        revenue: Number(r.revenue),
      })),
    });
  } catch (err) {
    console.error("[Funnel API] Error:", err);
    return NextResponse.json(
      { error: "Failed to load funnel data" },
      { status: 500 }
    );
  }
}
