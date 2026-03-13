import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { syncOrderProductionStatus } from "@/lib/production-sync";
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

function normalizeCarrier(carrier?: string | null): string {
  if (!carrier) return "canada_post";
  return CARRIER_CODES[String(carrier).trim().toLowerCase()] || "other";
}

/**
 * POST /api/admin/orders/bulk-ship
 * Body: { orderIds: string[], carrier?: string, trackingNumber?: string }
 *
 * Marks multiple orders as shipped in a single operation.
 * For each order: creates Shipment record, updates order + jobs to shipped,
 * creates timeline entry, sends shipping notification (non-blocking).
 *
 * Returns: { shipped: number, failed: number, errors: string[] }
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response!;

  try {
    const body = await request.json();
    const { orderIds, carrier, trackingNumber } = body;

    // Validate orderIds
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (orderIds.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 orders per bulk ship request" },
        { status: 400 }
      );
    }

    const normalizedCarrier = normalizeCarrier(carrier);
    const carrierLabel = CARRIER_LABELS[normalizedCarrier] || carrier || "Other";
    const shippedAt = new Date();
    const actorEmail = auth.user?.email || "admin";
    const actorId = auth.user?.id || null;

    let shipped = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each order individually so one failure doesn't block the rest
    for (const orderId of orderIds) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, status: true, productionStatus: true },
        });

        if (!order) {
          errors.push(`Order ${orderId.slice(0, 8)}: not found`);
          failed++;
          continue;
        }

        // Skip already-shipped orders
        if (order.productionStatus === "shipped") {
          errors.push(`Order ${orderId.slice(0, 8)}: already shipped`);
          failed++;
          continue;
        }

        // Use a transaction per order for atomicity
        await prisma.$transaction(async (tx) => {
          // 1. Create Shipment record (or update existing pending one)
          const existingShipment = await tx.shipment.findFirst({
            where: {
              orderId,
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
                  orderId,
                  createdBy: actorId,
                  ...shipmentData,
                },
              });

          // 2. Update order productionStatus to shipped
          await tx.order.update({
            where: { id: orderId },
            data: { productionStatus: "shipped" },
          });

          // 3. Update all production jobs to shipped
          await tx.productionJob.updateMany({
            where: {
              orderItem: { orderId },
              status: { notIn: ["shipped"] },
            },
            data: { status: "shipped", completedAt: shippedAt },
          });

          // 4. Create timeline entry
          await tx.orderTimeline.create({
            data: {
              orderId,
              action: "shipped",
              details: JSON.stringify({
                trackingNumber: trackingNumber || null,
                carrier: normalizedCarrier,
                shipmentId: shipment.id,
                bulkShip: true,
              }),
              actor: actorEmail,
            },
          });
        });

        // 5. Sync order production status (runs outside transaction, non-critical)
        syncOrderProductionStatus(orderId).catch((err) =>
          console.error(`[BulkShip] Sync failed for ${orderId.slice(0, 8)}:`, err)
        );

        // 6. Send shipping notification (non-blocking)
        sendOrderNotification(orderId, "order_shipped", {
          trackingNumber,
          carrier: carrierLabel,
        }).catch((err) =>
          console.error(`[BulkShip] Notification failed for ${orderId.slice(0, 8)}:`, err)
        );

        shipped++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Order ${orderId.slice(0, 8)}: ${msg}`);
        failed++;
      }
    }

    // Fire-and-forget activity log for the bulk operation
    logActivity({
      action: "bulk_ship",
      entity: "order",
      actor: actorEmail,
      details: {
        orderIds,
        carrier: normalizedCarrier,
        trackingNumber: trackingNumber || null,
        shipped,
        failed,
        total: orderIds.length,
      },
    });

    return NextResponse.json({ shipped, failed, errors });
  } catch (error) {
    console.error("[BulkShip] Error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk ship request" },
      { status: 500 }
    );
  }
}
