import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(request);
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
  const auth = requireAdminAuth(request);
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

    // If marking as paid, set paidAt
    if (data.paymentStatus === "paid") {
      const existing = await prisma.order.findUnique({ where: { id } });
      if (existing && !existing.paidAt) {
        data.paidAt = new Date();
      }
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

    return NextResponse.json(order);
  } catch (error) {
    console.error("[Order PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
