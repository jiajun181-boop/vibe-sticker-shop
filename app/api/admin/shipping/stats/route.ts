import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const now = new Date();

    // Start of this week (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    // Start of this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      byStatus,
      shipmentsThisWeek,
      shipmentsThisMonth,
      byCarrier,
      deliveredShipments,
    ] = await Promise.all([
      // Shipments by status count
      prisma.shipment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Shipments this week
      prisma.shipment.count({
        where: { createdAt: { gte: weekStart } },
      }),

      // Shipments this month
      prisma.shipment.count({
        where: { createdAt: { gte: monthStart } },
      }),

      // By carrier breakdown
      prisma.shipment.groupBy({
        by: ["carrier"],
        _count: { id: true },
      }),

      // Delivered shipments with both shippedAt and deliveredAt for avg delivery time
      prisma.shipment.findMany({
        where: {
          status: "delivered",
          shippedAt: { not: null },
          deliveredAt: { not: null },
        },
        select: {
          shippedAt: true,
          deliveredAt: true,
        },
      }),
    ]);

    // Calculate average delivery time in hours
    let avgDeliveryHours = null;
    if (deliveredShipments.length > 0) {
      const totalMs = deliveredShipments.reduce((sum, s) => {
        const shipped = new Date(s.shippedAt!).getTime();
        const delivered = new Date(s.deliveredAt!).getTime();
        return sum + (delivered - shipped);
      }, 0);
      avgDeliveryHours = Math.round(totalMs / deliveredShipments.length / (1000 * 60 * 60) * 10) / 10;
    }

    // Format status counts as object
    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) {
      statusCounts[row.status] = row._count.id;
    }

    // Format carrier counts as object
    const carrierCounts: Record<string, number> = {};
    for (const row of byCarrier) {
      carrierCounts[row.carrier] = row._count.id;
    }

    return NextResponse.json({
      data: {
        byStatus: statusCounts,
        byCarrier: carrierCounts,
        shipmentsThisWeek,
        shipmentsThisMonth,
        avgDeliveryHours,
        totalDelivered: deliveredShipments.length,
      },
    });
  } catch (err) {
    console.error("[/api/admin/shipping/stats] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch shipping stats" },
      { status: 500 }
    );
  }
}
