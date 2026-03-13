import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/marketing
 *
 * Marketing effectiveness analytics: coupon usage, referral performance,
 * abandoned cart recovery, and email engagement.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30")));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Coupon performance
    const couponStats = await prisma.$queryRaw`
      SELECT
        c.code,
        c."discountType",
        c."discountValue",
        c."usedCount",
        c."maxUses",
        COUNT(o.id)::int AS "ordersUsed",
        SUM(o."discountAmount")::int AS "totalDiscountGiven",
        SUM(o."totalAmount")::int AS "totalRevenueGenerated"
      FROM "Coupon" c
      LEFT JOIN "Order" o ON o."couponId" = c.id
        AND o."paymentStatus" = 'paid'
        AND o."createdAt" >= ${since}
      WHERE c."createdAt" >= ${since}
        OR c."usedCount" > 0
      GROUP BY c.id, c.code, c."discountType", c."discountValue", c."usedCount", c."maxUses"
      ORDER BY COUNT(o.id) DESC
      LIMIT 20
    ` as Array<{
      code: string;
      discountType: string;
      discountValue: number;
      usedCount: number;
      maxUses: number | null;
      ordersUsed: number;
      totalDiscountGiven: number;
      totalRevenueGenerated: number;
    }>;

    // Abandoned cart recovery stats
    const cartStats = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "totalAbandoned",
        COUNT(*) FILTER (WHERE ac."recoveredAt" IS NOT NULL)::int AS "recovered",
        COUNT(*) FILTER (WHERE ac."emailsSent" > 0)::int AS "emailsSent"
      FROM "AbandonedCart" ac
      WHERE ac."createdAt" >= ${since}
    ` as Array<{
      totalAbandoned: number;
      recovered: number;
      emailsSent: number;
    }>;

    // Referral stats (if referral system exists)
    const referralStats = await prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE u."referredByUserId" IS NOT NULL)::int AS "referredUsers",
        COUNT(DISTINCT u."referredByUserId")::int AS "activeReferrers"
      FROM "User" u
      WHERE u."createdAt" >= ${since}
    ` as Array<{
      referredUsers: number;
      activeReferrers: number;
    }>;

    // Email send stats
    const emailStats = await prisma.$queryRaw`
      SELECT
        COALESCE(e.template, 'other') AS "template",
        COUNT(*)::int AS "sent"
      FROM "EmailLog" e
      WHERE e."sentAt" >= ${since}
      GROUP BY e.template
      ORDER BY COUNT(*) DESC
    ` as Array<{
      template: string;
      sent: number;
    }>;

    // New vs returning customer split
    const customerSplit = await prisma.$queryRaw`
      SELECT
        CASE WHEN sub."prevOrders" = 0 THEN 'new' ELSE 'returning' END AS "type",
        COUNT(*)::int AS "orderCount",
        SUM(o."totalAmount")::int AS "revenue"
      FROM "Order" o
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "prevOrders"
        FROM "Order" o2
        WHERE o2."customerEmail" = o."customerEmail"
          AND o2."createdAt" < o."createdAt"
          AND o2."paymentStatus" = 'paid'
      ) sub ON true
      WHERE o."paymentStatus" = 'paid'
        AND o."createdAt" >= ${since}
      GROUP BY CASE WHEN sub."prevOrders" = 0 THEN 'new' ELSE 'returning' END
    ` as Array<{
      type: string;
      orderCount: number;
      revenue: number;
    }>;

    const cart = cartStats[0] || { totalAbandoned: 0, recovered: 0, emailsSent: 0 };
    const ref = referralStats[0] || { referredUsers: 0, activeReferrers: 0 };

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      coupons: couponStats.map((c) => ({
        ...c,
        roi: c.totalDiscountGiven > 0
          ? Math.round((c.totalRevenueGenerated / c.totalDiscountGiven) * 100) / 100
          : 0,
      })),
      abandonedCarts: {
        ...cart,
        recoveryRate: cart.totalAbandoned > 0
          ? Math.round((cart.recovered / cart.totalAbandoned) * 100)
          : 0,
      },
      referrals: ref,
      emailsSent: emailStats,
      customerSplit,
      summary: {
        totalCouponsUsed: couponStats.reduce((s, c) => s + c.ordersUsed, 0),
        totalDiscountGiven: couponStats.reduce((s, c) => s + c.totalDiscountGiven, 0),
        cartRecoveryRate: cart.totalAbandoned > 0
          ? Math.round((cart.recovered / cart.totalAbandoned) * 100)
          : 0,
        totalEmailsSent: emailStats.reduce((s, e) => s + e.sent, 0),
        referredUsers: ref.referredUsers,
      },
    });
  } catch (error) {
    console.error("[Marketing Analytics] Error:", error);
    return NextResponse.json({ error: "Failed to fetch marketing analytics" }, { status: 500 });
  }
}
