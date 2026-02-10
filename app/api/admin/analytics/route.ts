import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdminAuth } from "@/lib/admin-auth";

type Period = "7d" | "30d" | "90d" | "12m";

function getDateRange(period: Period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // start of tomorrow (exclusive upper bound)

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
      truncUnit = "day";
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

interface RevenueBucket {
  bucket: Date;
  revenue: bigint;
  order_count: bigint;
}

interface AggregateRow {
  total_revenue: bigint;
  total_orders: bigint;
}

interface TopProduct {
  product_name: string;
  product_id: string | null;
  total_revenue: bigint;
  total_quantity: bigint;
  order_count: bigint;
}

interface TopCustomer {
  customer_email: string;
  customer_name: string | null;
  total_spent: bigint;
  order_count: bigint;
}

interface StatusBreakdown {
  status: string;
  count: bigint;
}

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
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

    const { start, end, prevStart, truncUnit } = getDateRange(period);

    const [
      revenueTimeline,
      currentAggregate,
      previousAggregate,
      topProducts,
      topCustomers,
      statusBreakdown,
    ] = await Promise.all([
      // Daily/monthly revenue buckets
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            DATE_TRUNC(${truncUnit}, "createdAt") AS bucket,
            COALESCE(SUM("totalAmount"), 0) AS revenue,
            COUNT(*)::bigint AS order_count
          FROM "Order"
          WHERE "createdAt" >= ${start}
            AND "createdAt" < ${end}
            AND "paymentStatus" = 'paid'
          GROUP BY bucket
          ORDER BY bucket ASC
        `
      ) as Promise<RevenueBucket[]>,

      // Current period totals
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            COALESCE(SUM("totalAmount"), 0) AS total_revenue,
            COUNT(*)::bigint AS total_orders
          FROM "Order"
          WHERE "createdAt" >= ${start}
            AND "createdAt" < ${end}
            AND "paymentStatus" = 'paid'
        `
      ) as Promise<AggregateRow[]>,

      // Previous period totals (for comparison)
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            COALESCE(SUM("totalAmount"), 0) AS total_revenue,
            COUNT(*)::bigint AS total_orders
          FROM "Order"
          WHERE "createdAt" >= ${prevStart}
            AND "createdAt" < ${start}
            AND "paymentStatus" = 'paid'
        `
      ) as Promise<AggregateRow[]>,

      // Top 10 products by revenue
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            oi."productName" AS product_name,
            oi."productId" AS product_id,
            SUM(oi."totalPrice")::bigint AS total_revenue,
            SUM(oi."quantity")::bigint AS total_quantity,
            COUNT(DISTINCT oi."orderId")::bigint AS order_count
          FROM "OrderItem" oi
          JOIN "Order" o ON o.id = oi."orderId"
          WHERE o."createdAt" >= ${start}
            AND o."createdAt" < ${end}
            AND o."paymentStatus" = 'paid'
          GROUP BY oi."productName", oi."productId"
          ORDER BY total_revenue DESC
          LIMIT 10
        `
      ) as Promise<TopProduct[]>,

      // Top 10 customers by spend
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            "customerEmail" AS customer_email,
            "customerName" AS customer_name,
            SUM("totalAmount")::bigint AS total_spent,
            COUNT(*)::bigint AS order_count
          FROM "Order"
          WHERE "createdAt" >= ${start}
            AND "createdAt" < ${end}
            AND "paymentStatus" = 'paid'
          GROUP BY "customerEmail", "customerName"
          ORDER BY total_spent DESC
          LIMIT 10
        `
      ) as Promise<TopCustomer[]>,

      // Order status breakdown (all orders in period, not just paid)
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            "status",
            COUNT(*)::bigint AS count
          FROM "Order"
          WHERE "createdAt" >= ${start}
            AND "createdAt" < ${end}
          GROUP BY "status"
          ORDER BY count DESC
        `
      ) as Promise<StatusBreakdown[]>,
    ]);

    // Convert BigInt values to numbers for JSON serialization
    const current = currentAggregate[0] || { total_revenue: BigInt(0), total_orders: BigInt(0) };
    const previous = previousAggregate[0] || { total_revenue: BigInt(0), total_orders: BigInt(0) };

    const currentRevenue = Number(current.total_revenue);
    const currentOrders = Number(current.total_orders);
    const previousRevenue = Number(previous.total_revenue);
    const previousOrders = Number(previous.total_orders);

    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    const ordersChange =
      previousOrders > 0
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : currentOrders > 0
          ? 100
          : 0;

    const avgOrderValue = currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0;
    const prevAvgOrderValue = previousOrders > 0 ? Math.round(previousRevenue / previousOrders) : 0;
    const avgOrderChange =
      prevAvgOrderValue > 0
        ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
        : avgOrderValue > 0
          ? 100
          : 0;

    return NextResponse.json({
      period,
      summary: {
        totalRevenue: currentRevenue,
        totalOrders: currentOrders,
        avgOrderValue,
        revenueChange: Math.round(revenueChange * 10) / 10,
        ordersChange: Math.round(ordersChange * 10) / 10,
        avgOrderChange: Math.round(avgOrderChange * 10) / 10,
        previousRevenue,
        previousOrders,
      },
      revenueTimeline: revenueTimeline.map((row) => ({
        date: row.bucket,
        revenue: Number(row.revenue),
        orders: Number(row.order_count),
      })),
      topProducts: topProducts.map((row) => ({
        name: row.product_name,
        productId: row.product_id,
        revenue: Number(row.total_revenue),
        quantity: Number(row.total_quantity),
        orders: Number(row.order_count),
      })),
      topCustomers: topCustomers.map((row) => ({
        email: row.customer_email,
        name: row.customer_name,
        totalSpent: Number(row.total_spent),
        orders: Number(row.order_count),
      })),
      statusBreakdown: statusBreakdown.map((row) => ({
        status: row.status,
        count: Number(row.count),
      })),
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics data" },
      { status: 500 }
    );
  }
}
