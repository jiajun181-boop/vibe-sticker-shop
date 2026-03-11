import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { sendOrderNotification } from "@/lib/notifications/order-notifications";

/**
 * POST /api/admin/orders/[id]/ship
 * Body: { trackingNumber?, carrier?, estimatedDelivery? }
 * Marks an order as shipped, sends notification email.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response!;

  const { id } = await params;

  try {
    const body = await request.json();
    const { trackingNumber, carrier, estimatedDelivery } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order production status + advance all production jobs to "shipped"
    const updated = await prisma.order.update({
      where: { id },
      data: { productionStatus: "shipped" },
    });

    // Advance all non-shipped jobs for this order to "shipped"
    try {
      await prisma.productionJob.updateMany({
        where: {
          orderItem: { orderId: id },
          status: { notIn: ["shipped"] },
        },
        data: { status: "shipped", completedAt: new Date() },
      });
    } catch (jobErr) {
      console.error("[Ship] Failed to update production jobs:", jobErr);
    }

    // Create Shipment record (structured tracking data)
    await prisma.shipment.create({
      data: {
        orderId: id,
        carrier: carrier || "canada_post",
        trackingNumber: trackingNumber || null,
        status: "in_transit",
        shippedAt: new Date(),
        notes: estimatedDelivery ? `Est. delivery: ${estimatedDelivery}` : null,
        createdBy: auth.user?.email || "admin",
      },
    });

    // Timeline event
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: "shipped",
        details: JSON.stringify({
          trackingNumber: trackingNumber || null,
          carrier: carrier || null,
          estimatedDelivery: estimatedDelivery || null,
        }),
        actor: auth.user?.email || "admin",
      },
    });

    await logActivity({
      action: "order_shipped",
      entity: "order",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: { trackingNumber, carrier },
    });

    // Send shipped email + push notification via unified notification system
    sendOrderNotification(id, "order_shipped", {
      trackingNumber,
      carrier,
      estimatedDelivery,
    }).catch((emailErr) => console.error("[Ship] Notification failed:", emailErr));

    // Send SMS notification (non-blocking)
    try {
      const { sendOrderSms } = await import("@/lib/notifications/sms-notifications");
      sendOrderSms(id, "order_shipped", { trackingNumber }).catch(() => {});
    } catch {}

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("[Ship] Error:", err);
    return NextResponse.json(
      { error: "Failed to mark as shipped" },
      { status: 500 }
    );
  }
}
