import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/customer-ltv?limit=20&sort=revenue
 *
 * Customer Lifetime Value analytics.
 * Aggregates across all paid orders by customer email.
 * Amounts are in cents (CAD).
 */

interface CustomerLtvRow {
  customer_email: string;
  customer_name: string | null;
  total_revenue: bigint;
  order_count: bigint;
  first_order: Date;
  last_order: Date;
  avg_order_value: bigint;
  lifetime_days: number;
}

interface SummaryRow {
  total_customers: bigint;
  avg_ltv: bigint;
  avg_orders_per_customer: number;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 100);
    const sort = searchParams.get("sort") || "revenue";

    // Validate sort param
    const validSorts = ["revenue", "orders", "lifetime", "avg_order"];
    if (!validSorts.includes(sort)) {
      return NextResponse.json(
        { error: `Invalid sort. Use one of: ${validSorts.join(", ")}` },
        { status: 400 }
      );
    }

    // Map sort param to SQL ORDER BY expression
    const sortColumn =
      sort === "orders" ? "order_count" :
      sort === "lifetime" ? "lifetime_days" :
      sort === "avg_order" ? "avg_order_value" :
      "total_revenue";

    // Top customers by LTV
    // Using raw SQL with parameterized limit; sort column is validated above so safe to interpolate
    const customers = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          "customerEmail" AS customer_email,
          MAX("customerName") AS customer_name,
          COALESCE(SUM("totalAmount"), 0)::bigint AS total_revenue,
          COUNT(*)::bigint AS order_count,
          MIN("createdAt") AS first_order,
          MAX("createdAt") AS last_order,
          CASE WHEN COUNT(*) > 0
            THEN (SUM("totalAmount") / COUNT(*))::bigint
            ELSE 0::bigint END AS avg_order_value,
          EXTRACT(DAY FROM (MAX("createdAt") - MIN("createdAt")))::int AS lifetime_days
        FROM "Order"
        WHERE "paymentStatus" = 'paid'
        GROUP BY "customerEmail"
        ORDER BY ${Prisma.raw(`"${sortColumn}" DESC`)}
        LIMIT ${limit}
      `
    ) as CustomerLtvRow[];

    // Summary across all customers
    const summaryRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          COUNT(*)::bigint AS total_customers,
          COALESCE(AVG(customer_total), 0)::bigint AS avg_ltv,
          COALESCE(AVG(customer_orders), 0)::float AS avg_orders_per_customer
        FROM (
          SELECT
            "customerEmail",
            SUM("totalAmount") AS customer_total,
            COUNT(*) AS customer_orders
          FROM "Order"
          WHERE "paymentStatus" = 'paid'
          GROUP BY "customerEmail"
        ) AS customer_stats
      `
    ) as SummaryRow[];

    const summary = summaryRows[0] || {
      total_customers: BigInt(0),
      avg_ltv: BigInt(0),
      avg_orders_per_customer: 0,
    };

    return NextResponse.json({
      sort,
      limit,
      summary: {
        totalCustomers: Number(summary.total_customers),
        avgLtv: Number(summary.avg_ltv),
        avgOrdersPerCustomer: Math.round(Number(summary.avg_orders_per_customer) * 10) / 10,
      },
      customers: customers.map((row) => ({
        email: row.customer_email,
        name: row.customer_name,
        totalRevenue: Number(row.total_revenue),
        orderCount: Number(row.order_count),
        firstOrder: row.first_order,
        lastOrder: row.last_order,
        avgOrderValue: Number(row.avg_order_value),
        lifetimeDays: row.lifetime_days,
      })),
    });
  } catch (error) {
    console.error("[Customer LTV API] Error:", error);
    return NextResponse.json(
      { error: "Failed to load customer LTV data" },
      { status: 500 }
    );
  }
}
