import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { sendOrderNotification } from "@/lib/notifications/order-notifications";

const CARRIER_CODES: Record<string, string> = {
  "canada post": "canada_post",
  "canada_post": "canada_post",
  "canada-post": "canada_post",
  ups: "ups",
  purolator: "purolator",
  fedex: "fedex",
  pickup: "pickup",
  other: "other",
};

const CARRIER_LABELS: Record<string, string> = {
  canada_post: "Canada Post",
  ups: "UPS",
  purolator: "Purolator",
  fedex: "FedEx",
  pickup: "Pickup",
  other: "Other",
};

function normalizeCarrier(carrier?: string | null) {
  if (!carrier) return "canada_post";
  return CARRIER_CODES[String(carrier).trim().toLowerCase()] || "other";
}

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
    const normalizedCarrier = normalizeCarrier(carrier);
    const shippedAt = new Date();

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const [shipmentRecord, updated] = await prisma.$transaction(async (tx) => {
      const existingShipment = await tx.shipment.findFirst({
        where: {
          orderId: id,
          status: { in: ["pending", "label_created", "picked_up", "in_transit", "exception"] },
        },
        orderBy: { createdAt: "desc" },
      });

      const shipmentData = {
        carrier: normalizedCarrier,
        trackingNumber: trackingNumber || null,
        status: "picked_up" as const,
        shippedAt,
        notes: existingShipment?.notes || null,
      };

      const shipment = existingShipment
        ? await tx.shipment.update({
            where: { id: existingShipment.id },
            data: shipmentData,
          })
        : await tx.shipment.create({
            data: {
              orderId: id,
              createdBy: auth.user?.id || null,
              ...shipmentData,
            },
          });

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { productionStatus: "shipped" },
      });

      await tx.productionJob.updateMany({
        where: {
          orderItem: { orderId: id },
          status: { notIn: ["shipped"] },
        },
        data: { status: "shipped", completedAt: shippedAt },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: id,
          action: "shipped",
          details: JSON.stringify({
            trackingNumber: trackingNumber || null,
            carrier: normalizedCarrier,
            estimatedDelivery: estimatedDelivery || null,
            shipmentId: shipment.id,
          }),
          actor: auth.user?.email || "admin",
        },
      });

      return [shipment, updatedOrder] as const;
    });

    await logActivity({
      action: "order_shipped",
      entity: "order",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: { trackingNumber, carrier: normalizedCarrier, shipmentId: shipmentRecord.id },
    });

    // Send shipped email + push notification via unified notification system
    sendOrderNotification(id, "order_shipped", {
      trackingNumber,
      carrier: CARRIER_LABELS[normalizedCarrier] || carrier,
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
