import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: shipment });
  } catch (err) {
    console.error("[Shipping GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch shipment" },
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

    const existing = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "carrier",
      "trackingNumber",
      "labelUrl",
      "status",
      "weight",
      "dimensions",
      "shippingCost",
      "notes",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Parse numeric fields
    if (typeof data.weight === "string") {
      data.weight = parseFloat(data.weight);
    }
    if (typeof data.shippingCost === "string") {
      data.shippingCost = parseInt(data.shippingCost as string);
    }

    // Auto-set shippedAt when status changes to picked_up or in_transit
    if (
      data.status &&
      data.status !== existing.status &&
      (data.status === "picked_up" || data.status === "in_transit") &&
      !existing.shippedAt
    ) {
      data.shippedAt = new Date();
    }

    // Auto-set deliveredAt when status changes to delivered
    if (
      data.status &&
      data.status !== existing.status &&
      data.status === "delivered" &&
      !existing.deliveredAt
    ) {
      data.deliveredAt = new Date();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipment.update({
      where: { id },
      data,
    });

    logActivity({
      action: "updated",
      entity: "shipment",
      entityId: id,
      actor: auth.user?.name || "admin",
      details: {
        updatedFields: Object.keys(data),
        ...(data.status ? { statusFrom: existing.status, statusTo: data.status } : {}),
      },
    });

    return NextResponse.json({ data: shipment });
  } catch (err) {
    console.error("[Shipping PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const existing = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    await prisma.shipment.delete({ where: { id } });

    logActivity({
      action: "deleted",
      entity: "shipment",
      entityId: id,
      actor: auth.user?.name || "admin",
      details: { orderId: existing.orderId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Shipping DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}
