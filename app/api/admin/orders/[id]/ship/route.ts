import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

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

    // Update order production status
    const updated = await prisma.order.update({
      where: { id },
      data: { productionStatus: "shipped" },
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

    // Send shipped email
    try {
      const { sendEmail } = await import("@/lib/email/resend");
      const { buildOrderShippedHtml } = await import("@/lib/email/templates/order-shipped");
      await sendEmail({
        to: order.customerEmail,
        subject: `Your Order Has Shipped! — #${id.slice(0, 8)}`,
        html: buildOrderShippedHtml(order, { trackingNumber, carrier, estimatedDelivery }),
        template: "order-shipped",
        orderId: id,
      });
    } catch (emailErr) {
      console.error("[Ship] Email send failed:", emailErr);
    }

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
