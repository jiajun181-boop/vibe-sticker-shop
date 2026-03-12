import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import {
  getOrderProductionStatusForShipmentStatus,
  normalizeCarrierCode,
  shipmentStatusMarksOrderShipped,
} from "@/lib/admin/order-shipping";

function formatShipmentForAdmin(shipment: any) {
  return {
    ...shipment,
    orderSummary: shipment.order
      ? {
          id: shipment.order.id,
          customerEmail: shipment.order.customerEmail,
          customerName: shipment.order.customerName,
          customerPhone: shipment.order.customerPhone,
          status: shipment.order.status,
          paymentStatus: shipment.order.paymentStatus,
          productionStatus: shipment.order.productionStatus,
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const carrier = searchParams.get("carrier");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (carrier) {
      where.carrier = carrier;
    }

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }

    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { orderId: { contains: search } },
        { order: { is: { customerEmail: { contains: search, mode: "insensitive" } } } },
        { order: { is: { customerName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              customerEmail: true,
              customerName: true,
              customerPhone: true,
              status: true,
              paymentStatus: true,
              productionStatus: true,
            },
          },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    return NextResponse.json({
      data: shipments.map(formatShipmentForAdmin),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[/api/admin/shipping] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const {
      orderId,
      carrier,
      trackingNumber,
      labelUrl,
      status,
      weight,
      dimensions,
      shippingCost,
      notes,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Verify the order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, productionStatus: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const normalizedCarrier = normalizeCarrierCode(carrier);
    const shipmentStatus = status || "pending";
    const nextOrderProductionStatus = getOrderProductionStatusForShipmentStatus(
      shipmentStatus
    );

    const shipment = await prisma.$transaction(async (tx) => {
      const createdShipment = await tx.shipment.create({
        data: {
          orderId,
          carrier: normalizedCarrier,
          trackingNumber: trackingNumber || null,
          labelUrl: labelUrl || null,
          status: shipmentStatus,
          weight: weight ? parseFloat(weight) : null,
          dimensions: dimensions || null,
          shippingCost: shippingCost ? parseInt(shippingCost) : null,
          notes: notes || null,
          createdBy: auth.user?.id || null,
          ...(shipmentStatusMarksOrderShipped(shipmentStatus)
            ? { shippedAt: new Date() }
            : {}),
        },
        include: {
          order: {
            select: {
              id: true,
              customerEmail: true,
              customerName: true,
              customerPhone: true,
              status: true,
              paymentStatus: true,
              productionStatus: true,
            },
          },
        },
      });

      if (
        nextOrderProductionStatus &&
        order.productionStatus !== nextOrderProductionStatus
      ) {
        await tx.order.update({
          where: { id: orderId },
          data: { productionStatus: nextOrderProductionStatus },
        });

        await tx.productionJob.updateMany({
          where: {
            orderItem: { orderId },
            status: { notIn: ["shipped"] },
          },
          data: { status: "shipped", completedAt: new Date() },
        });

        await tx.orderTimeline.create({
          data: {
            orderId,
            action: "shipped",
            details: JSON.stringify({
              source: "shipping_workspace",
              shipmentId: createdShipment.id,
              carrier: normalizedCarrier,
              trackingNumber: trackingNumber || null,
            }),
            actor: auth.user?.email || auth.user?.name || "admin",
          },
        });

        if (createdShipment.order) {
          createdShipment.order.productionStatus = nextOrderProductionStatus;
        }
      } else if (trackingNumber) {
        await tx.orderTimeline.create({
          data: {
            orderId,
            action: "tracking_added",
            details: JSON.stringify({
              source: "shipping_workspace",
              shipmentId: createdShipment.id,
              carrier: normalizedCarrier,
              trackingNumber,
            }),
            actor: auth.user?.email || auth.user?.name || "admin",
          },
        });
      }

      return createdShipment;
    });

    logActivity({
      action: "created",
      entity: "shipment",
      entityId: shipment.id,
      actor: auth.user?.name || "admin",
      details: {
        orderId,
        carrier: shipment.carrier,
        status: shipment.status,
        orderProductionStatus: nextOrderProductionStatus || order.productionStatus,
      },
    });

    return NextResponse.json({ data: formatShipmentForAdmin(shipment) }, { status: 201 });
  } catch (err) {
    console.error("[/api/admin/shipping] POST Error:", err);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
