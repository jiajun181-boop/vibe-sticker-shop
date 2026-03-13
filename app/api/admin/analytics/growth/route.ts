import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/growth?period=30d
 *
 * Customer and revenue growth trends.
 * Returns time-bucketed data points with new customers, revenue, and order counts.
 * Also returns period-over-period comparison.
 * Amounts are in cents (CAD).
 */

type Period = "7d" | "30d" | "90d" | "12m";

interface GrowthDataPoint {
  bucket: Date;
  new_customers: bigint;
  revenue: bigint;
  order_count: bigint;
}

interface PeriodAggregate {
  new_customers: bigint;
  total_revenue: bigint;
  total_orders: bigint;
}

function getPeriodConfig(period: Period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // start of tomorrow

  let start: Date;
  let prevStart: Date;
  let truncUnit: string;

  switch (period) {
    case "7d":
      start = new Date(end);
      start.setDate(start.getDate() - 7);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      truncUnit = "day";
      break;
    case "30d":
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 30);
      truncUnit = "day";
      break;
    case "90d":
      start = new Date(end);
      start.setDate(start.getDate() - 90);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 90);
      truncUnit = "week";
      break;
    case "12m":
      start = new Date(end);
      start.setMonth(start.getMonth() - 12);
      prevStart = new Date(start);
      prevStart.setMonth(prevStart.getMonth() - 12);
      truncUnit = "month";
      break;
    default:
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 30);
      truncUnit = "day";
  }

  return { start, end, prevStart, truncUnit };
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "30d") as Period;

    if (!["7d", "30d", "90d", "12m"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Use 7d, 30d, 90d, or 12m." },
        { status: 400 }
      );
    }

    const { start, end, prevStart, truncUnit } = getPeriodConfig(period);

    const [
      currentDataPoints,
      currentAggregate,
      previousAggregate,
    ] = await Promise.all([
      // Time-bucketed growth data
      // New customers = first-time orderers whose first paid order falls in this bucket
      prisma.$queryRaw(
        Prisma.sql`
          WITH first_orders AS (
            SELECT
              "customerEmail",
              MIN("createdAt") AS first_order_date
            FROM "Order"
            WHERE "paymentStatus" = 'paid'
            GROUP BY "customerEmail"
          )
          SELECT
            DATE_TRUNC(${truncUnit}, g.bucket) AS bucket,
            COALESCE(nc.new_customers, 0)::bigint AS new_customers,
            COALESCE(orders.revenue, 0)::bigint AS revenue,
            COALESCE(orders.order_count, 0)::bigint AS order_count
          FROM (
            SELECT DATE_TRUNC(${truncUnit}, d) AS bucket
            FROM generate_series(${start}::timestamp, ${end}::timestamp - interval '1 day', ${"1 " + truncUnit}) AS d
            GROUP BY 1
          ) g
          LEFT JOIN (
            SELECT
              DATE_TRUNC(${truncUnit}, first_order_date) AS bucket,
              COUNT(*)::bigint AS new_customers
            FROM first_orders
            WHERE first_order_date >= ${start} AND first_order_date < ${end}
            GROUP BY 1
          ) nc ON nc.bucket = g.bucket
          LEFT JOIN (
            SELECT
              DATE_TRUNC(${truncUnit}, "createdAt") AS bucket,
              COALESCE(SUM("totalAmount"), 0)::bigint AS revenue,
              COUNT(*)::bigint AS order_count
            FROM "Order"
            WHERE "paymentStatus" = 'paid'
              AND "createdAt" >= ${start}
              AND "createdAt" < ${end}
            GROUP BY 1
          ) orders ON orders.bucket = g.bucket
          ORDER BY g.bucket ASC
        `
      ) as GrowthDataPoint[],

      // Current period aggregate
      prisma.$queryRaw(
        Prisma.sql`
          WITH first_orders AS (
            SELECT
              "customerEmail",
              MIN("createdAt") AS first_order_date
            FROM "Order"
            WHERE "paymentStatus" = 'paid'
            GROUP BY "customerEmail"
          )
          SELECT
            (SELECT COUNT(*)::bigint FROM first_orders
             WHERE first_order_date >= ${start} AND first_order_date < ${end}
            ) AS new_customers,
            COALESCE(SUM("totalAmount"), 0)::bigint AS total_revenue,
            COUNT(*)::bigint AS total_orders
          FROM "Order"
          WHERE "paymentStatus" = 'paid'
            AND "createdAt" >= ${start}
            AND "createdAt" < ${end}
        `
      ) as PeriodAggregate[],

      // Previous period aggregate (for comparison)
      prisma.$queryRaw(
        Prisma.sql`
          WITH first_orders AS (
            SELECT
              "customerEmail",
              MIN("createdAt") AS first_order_date
            FROM "Order"
            WHERE "paymentStatus" = 'paid'
            GROUP BY "customerEmail"
          )
          SELECT
            (SELECT COUNT(*)::bigint FROM first_orders
             WHERE first_order_date >= ${prevStart} AND first_order_date < ${start}
            ) AS new_customers,
            COALESCE(SUM("totalAmount"), 0)::bigint AS total_revenue,
            COUNT(*)::bigint AS total_orders
          FROM "Order"
          WHERE "paymentStatus" = 'paid'
            AND "createdAt" >= ${prevStart}
            AND "createdAt" < ${start}
        `
      ) as PeriodAggregate[],
    ]);

    const zero = BigInt(0);
    const current = currentAggregate[0] || { new_customers: zero, total_revenue: zero, total_orders: zero };
    const previous = previousAggregate[0] || { new_customers: zero, total_revenue: zero, total_orders: zero };

    const curCustomers = Number(current.new_customers);
    const curRevenue = Number(current.total_revenue);
    const curOrders = Number(current.total_orders);
    const prevCustomers = Number(previous.new_customers);
    const prevRevenue = Number(previous.total_revenue);
    const prevOrders = Number(previous.total_orders);

    const pctChange = (cur: number, prev: number): number => {
      if (prev > 0) return Math.round(((cur - prev) / prev) * 1000) / 10;
      return cur > 0 ? 100 : 0;
    };

    return NextResponse.json({
      period,
      granularity: truncUnit,
      summary: {
        newCustomers: curCustomers,
        newCustomersChange: pctChange(curCustomers, prevCustomers),
        revenue: curRevenue,
        revenueChange: pctChange(curRevenue, prevRevenue),
        orderCount: curOrders,
        orderCountChange: pctChange(curOrders, prevOrders),
      },
      previousPeriod: {
        newCustomers: prevCustomers,
        revenue: prevRevenue,
        orderCount: prevOrders,
      },
      dataPoints: currentDataPoints.map((row) => ({
        date: row.bucket,
        newCustomers: Number(row.new_customers),
        revenue: Number(row.revenue),
        orderCount: Number(row.order_count),
      })),
    });
  } catch (error) {
    console.error("[Growth API] Error:", error);
    return NextResponse.json(
      { error: "Failed to load growth data" },
      { status: 500 }
    );
  }
}
