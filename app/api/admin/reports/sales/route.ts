import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdminAuth } from "@/lib/admin-auth";

interface TotalRow {
  total_revenue: bigint;
  order_count: bigint;
}

interface DailyRevenueRow {
  date: Date;
  amount: bigint;
  orders: bigint;
}

interface NewCustomerRow {
  new_customers: bigint;
}

interface TopProductRow {
  product_id: string | null;
  name: string;
  quantity: bigint;
  revenue: bigint;
}

interface CategorySalesRow {
  category: string;
  amount: bigint;
}

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const compare = searchParams.get("compare") === "true";

    // Default to last 30 days if dates are missing
    const now = new Date();
    const to = toParam ? new Date(toParam) : now;
    const from = fromParam
      ? new Date(fromParam)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate previous period (same duration before `from`)
    const periodMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodMs);
    const prevTo = new Date(from.getTime());

    // Build parallel queries
    const queries: Promise<unknown>[] = [
      // (a) Current period totals - paid orders only
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            COALESCE(SUM("totalAmount"), 0) AS total_revenue,
            COUNT(*)::bigint AS order_count
          FROM "Order"
          WHERE "createdAt" >= ${from}
            AND "createdAt" <= ${to}
            AND "paymentStatus" = 'paid'
        `
      ),

      // (b) Daily revenue breakdown
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            DATE_TRUNC('day', "createdAt") AS date,
            COALESCE(SUM("totalAmount"), 0) AS amount,
            COUNT(*)::bigint AS orders
          FROM "Order"
          WHERE "createdAt" >= ${from}
            AND "createdAt" <= ${to}
            AND "paymentStatus" = 'paid'
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY date ASC
        `
      ),

      // (c) New customers (first order falls within current period)
      prisma.$queryRaw(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS new_customers
          FROM (
            SELECT "customerEmail"
            FROM "Order"
            GROUP BY "customerEmail"
            HAVING MIN("createdAt") >= ${from}
              AND MIN("createdAt") < ${to}
          ) sub
        `
      ),

      // (d) Top 10 products by revenue
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            oi."productId" AS product_id,
            oi."productName" AS name,
            SUM(oi."quantity")::bigint AS quantity,
            SUM(oi."totalPrice")::bigint AS revenue
          FROM "OrderItem" oi
          JOIN "Order" o ON o.id = oi."orderId"
          WHERE o."createdAt" >= ${from}
            AND o."createdAt" <= ${to}
            AND o."paymentStatus" = 'paid'
          GROUP BY oi."productName", oi."productId"
          ORDER BY revenue DESC
          LIMIT 10
        `
      ),

      // (e) Category sales breakdown
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            oi."productType" AS category,
            COALESCE(SUM(oi."totalPrice"), 0) AS amount
          FROM "OrderItem" oi
          JOIN "Order" o ON o.id = oi."orderId"
          WHERE o."createdAt" >= ${from}
            AND o."createdAt" <= ${to}
            AND o."paymentStatus" = 'paid'
          GROUP BY oi."productType"
          ORDER BY amount DESC
        `
      ),
    ];

    // (f) If compare=true, also run totals for previous period
    if (compare) {
      queries.push(
        prisma.$queryRaw(
          Prisma.sql`
            SELECT
              COALESCE(SUM("totalAmount"), 0) AS total_revenue,
              COUNT(*)::bigint AS order_count
            FROM "Order"
            WHERE "createdAt" >= ${prevFrom}
              AND "createdAt" <= ${prevTo}
              AND "paymentStatus" = 'paid'
          `
        )
      );

      queries.push(
        prisma.$queryRaw(
          Prisma.sql`
            SELECT COUNT(*)::bigint AS new_customers
            FROM (
              SELECT "customerEmail"
              FROM "Order"
              GROUP BY "customerEmail"
              HAVING MIN("createdAt") >= ${prevFrom}
                AND MIN("createdAt") < ${prevTo}
            ) sub
          `
        )
      );
    }

    const results = await Promise.all(queries);

    const currentTotals = (results[0] as TotalRow[])[0] || {
      total_revenue: BigInt(0),
      order_count: BigInt(0),
    };
    const dailyRevenue = results[1] as DailyRevenueRow[];
    const newCustomersRow = (results[2] as NewCustomerRow[])[0] || {
      new_customers: BigInt(0),
    };
    const topProducts = results[3] as TopProductRow[];
    const categorySalesRaw = results[4] as CategorySalesRow[];

    const totalRevenue = Number(currentTotals.total_revenue);
    const orderCount = Number(currentTotals.order_count);
    const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
    const newCustomers = Number(newCustomersRow.new_customers);

    // Calculate category percentages
    const categoryTotal = categorySalesRaw.reduce(
      (sum, row) => sum + Number(row.amount),
      0
    );
    const categorySales = categorySalesRaw.map((row) => {
      const amount = Number(row.amount);
      return {
        category: row.category,
        amount,
        percentage:
          categoryTotal > 0
            ? Math.round((amount / categoryTotal) * 1000) / 10
            : 0,
      };
    });

    const current = {
      totalRevenue,
      orderCount,
      avgOrderValue,
      newCustomers,
      dailyRevenue: dailyRevenue.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        amount: Number(row.amount),
        orders: Number(row.orders),
      })),
      topProducts: topProducts.map((row) => ({
        productId: row.product_id,
        name: row.name,
        quantity: Number(row.quantity),
        revenue: Number(row.revenue),
      })),
      categorySales,
    };

    // Build response
    const response: Record<string, unknown> = { current };

    if (compare) {
      const previousTotals = (results[5] as TotalRow[])[0] || {
        total_revenue: BigInt(0),
        order_count: BigInt(0),
      };
      const prevNewCustomersRow = (results[6] as NewCustomerRow[])[0] || {
        new_customers: BigInt(0),
      };

      const prevRevenue = Number(previousTotals.total_revenue);
      const prevOrders = Number(previousTotals.order_count);
      const prevAvg = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;
      const prevCustomers = Number(prevNewCustomersRow.new_customers);

      response.previous = {
        totalRevenue: prevRevenue,
        orderCount: prevOrders,
        avgOrderValue: prevAvg,
        newCustomers: prevCustomers,
      };

      const pctChange = (curr: number, prev: number): number => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 1000) / 10;
      };

      response.comparison = {
        revenueChange: pctChange(totalRevenue, prevRevenue),
        orderChange: pctChange(orderCount, prevOrders),
        avgOrderChange: pctChange(avgOrderValue, prevAvg),
        customerChange: pctChange(newCustomers, prevCustomers),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Sales Report] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate sales report" },
      { status: 500 }
    );
  }
}
