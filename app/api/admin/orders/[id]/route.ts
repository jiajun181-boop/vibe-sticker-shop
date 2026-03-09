import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { sendOrderNotification } from "@/lib/notifications/order-notifications";
import { VALID_STATUS_TRANSITIONS } from "@/lib/order-config";

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
        items: {
          include: {
            productionJob: {
              select: { id: true, status: true, priority: true, factoryId: true, assignedTo: true, dueAt: true, startedAt: true, completedAt: true },
            },
          },
        },
        notes: { orderBy: { createdAt: "desc" } },
        files: true,
        timeline: { orderBy: { createdAt: "desc" } },
        coupon: true,
        proofData: true,
        toolJobs: { orderBy: { createdAt: "desc" } },
        user: {
          select: {
            id: true,
            addresses: {
              where: { isDefaultShipping: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Flatten default shipping address onto order for admin display
    const shippingAddress = order.user?.addresses?.[0] || null;
    return NextResponse.json({ ...order, shippingAddress });
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
      include: {
        items: true,
        notes: { orderBy: { createdAt: "desc" } },
        files: true,
        timeline: { orderBy: { createdAt: "desc" } },
        coupon: true,
        proofData: true,
        toolJobs: { orderBy: { createdAt: "desc" } },
      },
    });

    // Create timeline event for the update
    const actorEmail = auth.user?.email || "admin";
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: data.status ? "status_updated" : data.productionStatus ? "production_status_updated" : "order_updated",
        details: JSON.stringify(data),
        actor: actorEmail,
      },
    });

    // Log the activity
    await logActivity({
      action: "order_updated",
      entity: "order",
      entityId: id,
      actor: actorEmail,
      details: data as Record<string, unknown>,
    });

    // When order is canceled, cancel all production jobs + notify customer
    if (data.status === "canceled") {
      prisma.productionJob.updateMany({
        where: {
          orderItem: { orderId: id },
          status: { notIn: ["shipped"] },
        },
        data: { status: "on_hold" },
      }).catch((err) => console.error("[Order PATCH] Failed to hold production jobs:", err));

      sendOrderNotification(id, "order_canceled", {
        reason: (data.cancelReason as string) || undefined,
      }).catch(() => {});
    }

    // Trigger order status notification emails (non-blocking)
    if (data.productionStatus) {
      const statusMap = {
        in_production: "production_started" as const,
        ready_to_ship: "ready_to_ship" as const,
      };
      const notifType = statusMap[data.productionStatus as keyof typeof statusMap];
      if (notifType) {
        sendOrderNotification(id, notifType).catch(() => {});
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
