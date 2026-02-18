import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { sendOrderNotification } from "@/lib/notifications/order-notifications";

// Must match Prisma OrderStatus enum: draft, pending, paid, canceled, refunded
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending", "paid", "canceled"],
  pending: ["paid", "canceled"],
  paid: ["canceled", "refunded"],
  canceled: [],
  refunded: [],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        notes: { orderBy: { createdAt: "desc" } },
        files: true,
        timeline: { orderBy: { createdAt: "desc" } },
        coupon: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[Order GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "status",
      "paymentStatus",
      "productionStatus",
      "customerName",
      "customerPhone",
      "tags",
      "priority",
      "isArchived",
      "estimatedCompletion",
      "cancelReason",
      "refundAmount",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Fetch current order for validation
    const current = await prisma.order.findUnique({ where: { id }, select: { status: true, paidAt: true } });
    if (!current) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate order status transitions
    if (data.status && typeof data.status === "string") {
      const allowed = VALID_STATUS_TRANSITIONS[current.status];
      if (allowed && !allowed.includes(data.status as string)) {
        return NextResponse.json(
          { error: `Cannot transition from "${current.status}" to "${data.status}"` },
          { status: 400 }
        );
      }
    }

    // Set paidAt whenever paymentStatus becomes "paid"
    if (data.paymentStatus === "paid" && !current.paidAt) {
      data.paidAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { items: true, notes: { orderBy: { createdAt: "desc" } } },
    });

    // Create timeline event for the update
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: "status_updated",
        details: JSON.stringify(data),
        actor: "admin",
      },
    });

    // Log the activity
    await logActivity({
      action: "order_updated",
      entity: "order",
      entityId: id,
      actor: "admin",
      details: data as Record<string, unknown>,
    });

    // Trigger order status notification emails (non-blocking)
    if (data.productionStatus) {
      const statusMap: Record<string, string> = {
        in_production: "production_started",
        ready_to_ship: "ready_to_ship",
      };
      const notifType = statusMap[data.productionStatus as string];
      if (notifType) {
        sendOrderNotification(id, notifType as any).catch(() => {});
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[Order PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
