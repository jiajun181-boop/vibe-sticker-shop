import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { VALID_STATUS_TRANSITIONS, VALID_PRODUCTION_STATUSES } from "@/lib/order-config";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { orderIds, updates } = body;

    // Validate orderIds is a non-empty array
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate at least one update field is provided
    const { status, productionStatus } = updates ?? {};
    if (!status && !productionStatus) {
      return NextResponse.json(
        { error: "At least one update field (status, productionStatus) is required" },
        { status: 400 }
      );
    }

    // Validate enum values
    const validStatuses = Object.keys(VALID_STATUS_TRANSITIONS);

    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status value: ${status}` },
        { status: 400 }
      );
    }
    if (productionStatus !== undefined && !VALID_PRODUCTION_STATUSES.includes(productionStatus)) {
      return NextResponse.json(
        { error: `Invalid productionStatus value: ${productionStatus}` },
        { status: 400 }
      );
    }

    // If changing order status, validate transitions for each order
    if (status !== undefined) {
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, status: true },
      });

      const blocked: string[] = [];
      for (const order of orders) {
        const allowed = VALID_STATUS_TRANSITIONS[order.status];
        if (allowed && !allowed.includes(status)) {
          blocked.push(`${order.id.slice(0, 8)} (${order.status} → ${status})`);
        }
      }

      if (blocked.length > 0) {
        return NextResponse.json(
          { error: `Invalid status transitions: ${blocked.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Build the data object with only provided fields
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (productionStatus !== undefined) data.productionStatus = productionStatus;

    // Build a human-readable description of what changed
    const changeParts: string[] = [];
    if (status !== undefined) changeParts.push(`status → ${status}`);
    if (productionStatus !== undefined) changeParts.push(`productionStatus → ${productionStatus}`);
    const changeDescription = changeParts.join(", ");

    const actorEmail = auth.user?.email || "admin";

    // Use a transaction to update all orders and create timeline entries
    await prisma.$transaction(
      orderIds.flatMap((orderId: string) => [
        prisma.order.update({
          where: { id: orderId },
          data,
        }),
        prisma.orderTimeline.create({
          data: {
            orderId,
            action: "bulk_update",
            details: JSON.stringify({ updated: data, description: changeDescription }),
            actor: actorEmail,
          },
        }),
      ])
    );

    // Fire-and-forget activity log
    logActivity({
      action: "bulk_update",
      entity: "order",
      actor: actorEmail,
      details: {
        orderIds,
        updates: data,
        count: orderIds.length,
      },
    });

    return NextResponse.json({ success: true, updated: orderIds.length });
  } catch (error) {
    console.error("[Orders Bulk Update] Error:", error);
    return NextResponse.json(
      { error: "Failed to bulk update orders" },
      { status: 500 }
    );
  }
}
