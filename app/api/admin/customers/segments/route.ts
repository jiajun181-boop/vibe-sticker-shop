import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/customers/segments
 * Returns customer segments with counts:
 * - By account type (B2C, B2B)
 * - By partner tier
 * - By order count buckets
 * - By total spend buckets
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "customers", "view");
  if (!auth.authenticated) return auth.response;

  try {
    // Account type distribution
    const accountTypes = await prisma.$queryRaw`
      SELECT
        "accountType"::text AS "segment",
        COUNT(*)::int AS "count"
      FROM "User"
      GROUP BY "accountType"
    ` as Array<{ segment: string; count: number }>;

    // Partner tier distribution
    const partnerTiers = await prisma.$queryRaw`
      SELECT
        COALESCE("partnerTier"::text, 'none') AS "segment",
        COUNT(*)::int AS "count"
      FROM "User"
      GROUP BY "partnerTier"
    ` as Array<{ segment: string; count: number }>;

    // Order count buckets
    const orderBuckets = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN order_count = 0 THEN 'no_orders'
          WHEN order_count = 1 THEN '1_order'
          WHEN order_count BETWEEN 2 AND 5 THEN '2_to_5'
          WHEN order_count BETWEEN 6 AND 20 THEN '6_to_20'
          ELSE '20_plus'
        END AS "segment",
        COUNT(*)::int AS "count"
      FROM (
        SELECT u.id, COUNT(o.id)::int AS order_count
        FROM "User" u
        LEFT JOIN "Order" o ON o."userId" = u.id AND o."paymentStatus" = 'paid'
        GROUP BY u.id
      ) sub
      GROUP BY CASE
        WHEN order_count = 0 THEN 'no_orders'
        WHEN order_count = 1 THEN '1_order'
        WHEN order_count BETWEEN 2 AND 5 THEN '2_to_5'
        WHEN order_count BETWEEN 6 AND 20 THEN '6_to_20'
        ELSE '20_plus'
      END
      ORDER BY MIN(order_count)
    ` as Array<{ segment: string; count: number }>;

    // Spend buckets (in CAD)
    const spendBuckets = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN total_spend = 0 THEN '$0'
          WHEN total_spend < 10000 THEN 'Under $100'
          WHEN total_spend < 50000 THEN '$100-$500'
          WHEN total_spend < 100000 THEN '$500-$1000'
          ELSE '$1000+'
        END AS "segment",
        COUNT(*)::int AS "count"
      FROM (
        SELECT u.id, COALESCE(SUM(o."totalAmount"), 0)::int AS total_spend
        FROM "User" u
        LEFT JOIN "Order" o ON o."userId" = u.id AND o."paymentStatus" = 'paid'
        GROUP BY u.id
      ) sub
      GROUP BY CASE
        WHEN total_spend = 0 THEN '$0'
        WHEN total_spend < 10000 THEN 'Under $100'
        WHEN total_spend < 50000 THEN '$100-$500'
        WHEN total_spend < 100000 THEN '$500-$1000'
        ELSE '$1000+'
      END
    ` as Array<{ segment: string; count: number }>;

    // Registration date buckets
    const registrationBuckets = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN 'last_7_days'
          WHEN "createdAt" >= NOW() - INTERVAL '30 days' THEN 'last_30_days'
          WHEN "createdAt" >= NOW() - INTERVAL '90 days' THEN 'last_90_days'
          ELSE 'older'
        END AS "segment",
        COUNT(*)::int AS "count"
      FROM "User"
      GROUP BY CASE
        WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN 'last_7_days'
        WHEN "createdAt" >= NOW() - INTERVAL '30 days' THEN 'last_30_days'
        WHEN "createdAt" >= NOW() - INTERVAL '90 days' THEN 'last_90_days'
        ELSE 'older'
      END
    ` as Array<{ segment: string; count: number }>;

    const totalCustomers = await prisma.user.count();

    return NextResponse.json({
      totalCustomers,
      segments: {
        accountType: accountTypes,
        partnerTier: partnerTiers,
        orderFrequency: orderBuckets,
        spendLevel: spendBuckets,
        registrationDate: registrationBuckets,
      },
    });
  } catch (error) {
    console.error("[Customer Segments] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer segments" },
      { status: 500 }
    );
  }
}
