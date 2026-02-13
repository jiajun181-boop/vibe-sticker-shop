import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

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

    // Build the data object with only provided fields
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (productionStatus !== undefined) data.productionStatus = productionStatus;

    // Build a human-readable description of what changed
    const changeParts: string[] = [];
    if (status !== undefined) changeParts.push(`status → ${status}`);
    if (productionStatus !== undefined) changeParts.push(`productionStatus → ${productionStatus}`);
    const changeDescription = changeParts.join(", ");

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
            actor: "admin",
          },
        }),
      ])
    );

    // Fire-and-forget activity log
    logActivity({
      action: "bulk_update",
      entity: "order",
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
