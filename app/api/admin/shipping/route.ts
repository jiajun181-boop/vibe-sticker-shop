import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

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
      ];
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ]);

    return NextResponse.json({
      data: shipments,
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
    const { orderId, carrier, trackingNumber, labelUrl, weight, dimensions, shippingCost, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Verify the order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        carrier: carrier || "canada_post",
        trackingNumber: trackingNumber || null,
        labelUrl: labelUrl || null,
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions || null,
        shippingCost: shippingCost ? parseInt(shippingCost) : null,
        notes: notes || null,
        createdBy: auth.user?.id || null,
      },
    });

    logActivity({
      action: "created",
      entity: "shipment",
      entityId: shipment.id,
      actor: auth.user?.name || "admin",
      details: { orderId, carrier: shipment.carrier },
    });

    return NextResponse.json({ data: shipment }, { status: 201 });
  } catch (err) {
    console.error("[/api/admin/shipping] POST Error:", err);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
