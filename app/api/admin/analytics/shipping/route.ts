import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/shipping
 *
 * Shipping and logistics analytics: carrier distribution, delivery times,
 * shipping costs, and regional distribution.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30")));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Shipments by carrier
    const carrierStats = await prisma.$queryRaw`
      SELECT
        COALESCE(s."carrier", 'Unknown') AS "carrier",
        COUNT(*)::int AS "shipmentCount",
        COUNT(DISTINCT s."orderId")::int AS "orderCount",
        COUNT(*) FILTER (WHERE s.status = 'delivered')::int AS "delivered",
        COUNT(*) FILTER (WHERE s.status = 'exception' OR s.status = 'returned')::int AS "exceptions"
      FROM "Shipment" s
      WHERE s."createdAt" >= ${since}
      GROUP BY s."carrier"
      ORDER BY COUNT(*) DESC
    ` as Array<{
      carrier: string;
      shipmentCount: number;
      orderCount: number;
      delivered: number;
      exceptions: number;
    }>;

    // Delivery method distribution
    const deliveryMethods = await prisma.$queryRaw`
      SELECT
        COALESCE(o."deliveryMethod", 'shipping') AS "method",
        COUNT(*)::int AS "orderCount",
        SUM(o."shippingAmount")::int AS "totalShipping",
        SUM(o."totalAmount")::int AS "totalRevenue"
      FROM "Order" o
      WHERE o."paymentStatus" = 'paid'
        AND o."createdAt" >= ${since}
      GROUP BY o."deliveryMethod"
      ORDER BY COUNT(*) DESC
    ` as Array<{
      method: string;
      orderCount: number;
      totalShipping: number;
      totalRevenue: number;
    }>;

    // Daily shipments
    const dailyShipments = await prisma.$queryRaw`
      SELECT
        date_trunc('day', s."createdAt")::date AS "date",
        COUNT(*)::int AS "shipped"
      FROM "Shipment" s
      WHERE s."createdAt" >= ${since}
      GROUP BY date_trunc('day', s."createdAt")
      ORDER BY "date"
    ` as Array<{ date: Date; shipped: number }>;

    // Summary
    const totalShipments = carrierStats.reduce((s, c) => s + c.shipmentCount, 0);
    const totalDelivered = carrierStats.reduce((s, c) => s + c.delivered, 0);
    const totalExceptions = carrierStats.reduce((s, c) => s + c.exceptions, 0);
    const totalShippingRevenue = deliveryMethods.reduce((s, d) => s + d.totalShipping, 0);

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      carriers: carrierStats,
      deliveryMethods,
      dailyShipments,
      summary: {
        totalShipments,
        totalDelivered,
        deliveryRate: totalShipments > 0 ? Math.round((totalDelivered / totalShipments) * 100) : 0,
        totalExceptions,
        totalShippingRevenue,
        avgShippingPerOrder: deliveryMethods.length > 0
          ? Math.round(totalShippingRevenue / deliveryMethods.reduce((s, d) => s + d.orderCount, 0))
          : 0,
      },
    });
  } catch (error) {
    console.error("[Shipping Analytics] Error:", error);
    return NextResponse.json({ error: "Failed to fetch shipping analytics" }, { status: 500 });
  }
}
