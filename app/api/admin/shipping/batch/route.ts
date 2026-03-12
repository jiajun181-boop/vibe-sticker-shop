import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { normalizeCarrierCode } from "@/lib/admin/order-shipping";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { shipments } = body;

    if (!Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json(
        { error: "shipments must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each entry has orderId
    for (let i = 0; i < shipments.length; i++) {
      if (!shipments[i].orderId) {
        return NextResponse.json(
          { error: `shipments[${i}] is missing orderId` },
          { status: 400 }
        );
      }
    }

    // Verify all orderIds exist
    const orderIds = shipments.map((s: { orderId: string }) => s.orderId);
    const existingOrders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, productionStatus: true },
    });

    const existingIds = new Set(existingOrders.map((o) => o.id));
    const missingIds = orderIds.filter((id: string) => !existingIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Some order IDs not found", missingIds },
        { status: 404 }
      );
    }

    // Create all shipments in a transaction
    const createdBy = auth.user?.id || null;

    const result = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const s of shipments) {
        const normalizedCarrier = normalizeCarrierCode(s.carrier);
        const shipment = await tx.shipment.create({
          data: {
            orderId: s.orderId,
            carrier: normalizedCarrier,
            trackingNumber: s.trackingNumber || null,
            status: "picked_up",
            shippedAt: new Date(),
            weight: s.weight ? parseFloat(s.weight) : null,
            dimensions: s.dimensions || null,
            shippingCost: s.shippingCost ? parseInt(s.shippingCost) : null,
            notes: s.notes || null,
            createdBy,
          },
        });
        await tx.order.update({
          where: { id: s.orderId },
          data: { productionStatus: "shipped" },
        });
        await tx.productionJob.updateMany({
          where: {
            orderItem: { orderId: s.orderId },
            status: { notIn: ["shipped"] },
          },
          data: { status: "shipped", completedAt: new Date() },
        });
        await tx.orderTimeline.create({
          data: {
            orderId: s.orderId,
            action: "shipped",
            details: JSON.stringify({
              source: "shipping_workspace_batch",
              shipmentId: shipment.id,
              carrier: normalizedCarrier,
              trackingNumber: s.trackingNumber || null,
            }),
            actor: auth.user?.email || auth.user?.name || "admin",
          },
        });
        created.push(shipment);
      }
      return created;
    });

    logActivity({
      action: "batch_created",
      entity: "shipment",
      actor: auth.user?.name || "admin",
      details: {
        count: result.length,
        orderIds,
      },
    });

    return NextResponse.json(
      { data: result, created: result.length },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Shipping Batch POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create batch shipments" },
      { status: 500 }
    );
  }
}
