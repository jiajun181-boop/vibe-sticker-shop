import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { sendOrderNotification } from "@/lib/notifications/order-notifications";
import { VALID_STATUS_TRANSITIONS, VALID_PAYMENT_TRANSITIONS, VALID_PRODUCTION_TRANSITIONS } from "@/lib/order-config";
import { isProductionItem } from "@/lib/order-item-utils";
import { detectProductFamily } from "@/lib/preflight";
import { applyAssignmentRules } from "@/lib/assignment-rules";
import { syncOrderProductionStatus } from "@/lib/production-sync";
import { releaseReserve } from "@/lib/inventory";
import { computeOrderCostSignals } from "@/lib/pricing/production-cost-signal";
import { populateItemCosts } from "@/lib/pricing/compute-item-cost";

async function loadShipmentState(orderId: string) {
  const shipments = await prisma.shipment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const latestShipment = shipments[0] || null;

  return {
    shipments,
    latestShipment,
    shipmentSummary: {
      count: shipments.length,
      latestStatus: latestShipment?.status || null,
      hasTracking: Boolean(latestShipment?.trackingNumber),
      hasException: shipments.some(
        (shipment) => shipment.status === "exception" || shipment.status === "returned"
      ),
    },
  };
}

async function formatOrderForAdmin(order: Record<string, unknown> & {
  id: string;
  status: string;
  productionStatus: string;
  items: Array<{
    id: string;
    productName: string;
    totalPrice: number;
    materialCostCents: number;
    estimatedCostCents: number;
    actualCostCents: number;
    vendorCostCents: number;
    [key: string]: unknown;
  }>;
  user?: { addresses?: unknown[] } | null;
}) {
  const shippingAddress = order.user?.addresses?.[0] || null;
  const [shipmentState, sourceQuote] = await Promise.all([
    loadShipmentState(order.id),
    // Reverse-lookup: was this order created from a quote?
    prisma.quoteRequest.findFirst({
      where: { convertedOrderId: order.id },
      select: { id: true, reference: true, quotedAmountCents: true, quotedAt: true, quotedBy: true },
    }),
  ]);

  // Compute cost signal per item + aggregate for the order
  const costSignals = computeOrderCostSignals(
    order.items.map((item) => ({
      id: item.id,
      productName: item.productName || "",
      totalPrice: item.totalPrice || 0,
      materialCostCents: item.materialCostCents || 0,
      estimatedCostCents: item.estimatedCostCents || 0,
      actualCostCents: item.actualCostCents || 0,
      vendorCostCents: item.vendorCostCents || 0,
    })),
    order.id,
    order.status,
    order.productionStatus,
    { returnTo: `/admin/orders/${order.id}`, source: "order-detail" }
  );

  // Attach per-item signal to each item (keyed by item id)
  const perItemMap = new Map(costSignals.perItem.map((s) => [s.itemId, s]));
  const itemsWithSignals = order.items.map((item) => ({
    ...item,
    costSignal: perItemMap.get(item.id) || null,
  }));

  return {
    ...order,
    items: itemsWithSignals,
    costSignal: costSignals.aggregate,
    sourceQuote: sourceQuote || null,
    shippingAddress,
    ...shipmentState,
  };
}

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
          // Cost fields needed for cost signal computation
          // (schema includes these by default; explicit note for clarity)
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

    // Shipments for this order (soft link via orderId — no FK relation)
    return NextResponse.json(await formatOrderForAdmin(order));
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
    const current = await prisma.order.findUnique({
      where: { id },
      select: { status: true, paymentStatus: true, productionStatus: true, paidAt: true },
    });
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

    // Validate payment status transitions
    if (data.paymentStatus && typeof data.paymentStatus === "string") {
      const allowed = VALID_PAYMENT_TRANSITIONS[current.paymentStatus as keyof typeof VALID_PAYMENT_TRANSITIONS];
      if (allowed && !allowed.includes(data.paymentStatus as string)) {
        return NextResponse.json(
          { error: `Cannot transition payment from "${current.paymentStatus}" to "${data.paymentStatus}"` },
          { status: 400 }
        );
      }
    }

    // Validate production status transitions
    if (data.productionStatus && typeof data.productionStatus === "string") {
      const allowed = VALID_PRODUCTION_TRANSITIONS[current.productionStatus as keyof typeof VALID_PRODUCTION_TRANSITIONS];
      if (allowed && !allowed.includes(data.productionStatus as string)) {
        return NextResponse.json(
          { error: `Cannot transition production from "${current.productionStatus}" to "${data.productionStatus}"` },
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

    // When payment is first confirmed (invoice/interac orders):
    // 1. Increment coupon usage (was deferred from invoice creation)
    // 2. Auto-create production jobs
    if (data.paymentStatus === "paid" && !current.paidAt) {
      // Consume coupon usage now that payment is confirmed
      if (order.couponId) {
        try {
          await prisma.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { increment: 1 } },
          });
        } catch (err) {
          console.error("[Order PATCH] Failed to increment coupon usage:", err);
        }
      }
      try {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: id },
          include: { productionJob: { select: { id: true } } },
        });
        for (const item of orderItems) {
          if (item.productionJob) continue; // already has a job
          if (!isProductionItem(item)) continue;

          const itemMeta = item.meta && typeof item.meta === "object"
            ? item.meta as Record<string, unknown> : {};
          const isRush = itemMeta.rushProduction === true || itemMeta.rushProduction === "true";
          const isTwoSided = itemMeta.sides === "double" || itemMeta.doubleSided === true;
          const family = detectProductFamily(item);
          const artworkUrl = item.fileUrl
            || (typeof itemMeta.artworkUrl === "string" ? itemMeta.artworkUrl : null);
          const dueAt = new Date();
          dueAt.setDate(dueAt.getDate() + (isRush ? 1 : 3));

          const newJob = await prisma.productionJob.create({
            data: {
              orderItemId: item.id,
              status: "queued",
              priority: isRush ? "urgent" : "normal",
              dueAt,
              productName: item.productName || null,
              family,
              quantity: item.quantity,
              widthIn: item.widthIn || null,
              heightIn: item.heightIn || null,
              material: item.material || null,
              finishing: item.finishing || null,
              artworkUrl,
              isTwoSided: !!isTwoSided,
              isRush,
            },
          });
          await applyAssignmentRules(newJob.id);
        }
        await syncOrderProductionStatus(id);
      } catch (jobErr) {
        console.error("[Order PATCH] Failed to auto-create production jobs:", jobErr);
      }

      // Populate cost breakdown for items (non-blocking)
      populateItemCosts(id).catch((err) => {
        console.error("[Order PATCH] Failed to populate item costs:", err);
      });
    }

    // When order is canceled, cancel all production jobs + release stock + notify customer
    if (data.status === "canceled") {
      prisma.productionJob.updateMany({
        where: {
          orderItem: { orderId: id },
          status: { notIn: ["shipped"] },
        },
        data: { status: "on_hold" },
      }).catch((err) => console.error("[Order PATCH] Failed to hold production jobs:", err));

      // Release reserved stock for all items in this order
      try {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true, quantity: true },
        });
        if (orderItems.length > 0) {
          await releaseReserve(
            orderItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
          );
        }
      } catch (stockErr) {
        console.error("[Order PATCH] Failed to release reserved stock on cancel:", stockErr);
      }

      // Refund coupon usage if the order had been paid (coupon was consumed on payment)
      if (order.couponId && current.paidAt) {
        try {
          await prisma.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { decrement: 1 } },
          });
        } catch (err) {
          console.error("[Order PATCH] Failed to refund coupon usage on cancel:", err);
        }
      }

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

    return NextResponse.json(await formatOrderForAdmin(order));
  } catch (error) {
    console.error("[Order PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
