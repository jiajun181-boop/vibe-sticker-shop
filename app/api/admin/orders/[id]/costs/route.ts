import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "analytics", "admin");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        materialCost: true,
        laborCost: true,
        shippingCost: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    const changes: Record<string, { from: number; to: number }> = {};

    if (body.materialCost !== undefined) {
      const val = parseInt(body.materialCost);
      if (isNaN(val) || val < 0) {
        return NextResponse.json(
          { error: "materialCost must be a non-negative number (in cents)" },
          { status: 400 }
        );
      }
      data.materialCost = val;
      changes.materialCost = { from: existing.materialCost, to: val };
    }

    if (body.laborCost !== undefined) {
      const val = parseInt(body.laborCost);
      if (isNaN(val) || val < 0) {
        return NextResponse.json(
          { error: "laborCost must be a non-negative number (in cents)" },
          { status: 400 }
        );
      }
      data.laborCost = val;
      changes.laborCost = { from: existing.laborCost, to: val };
    }

    if (body.shippingCost !== undefined) {
      const val = parseInt(body.shippingCost);
      if (isNaN(val) || val < 0) {
        return NextResponse.json(
          { error: "shippingCost must be a non-negative number (in cents)" },
          { status: 400 }
        );
      }
      data.shippingCost = val;
      changes.shippingCost = { from: existing.shippingCost, to: val };
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid cost fields provided" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      select: {
        id: true,
        totalAmount: true,
        materialCost: true,
        laborCost: true,
        shippingCost: true,
      },
    });

    // Calculate profit info for response
    const totalCost = order.materialCost + order.laborCost + order.shippingCost;
    const profit = order.totalAmount - totalCost;
    const marginPercent = order.totalAmount > 0
      ? Math.round((profit / order.totalAmount) * 10000) / 100
      : 0;

    await logActivity({
      action: "costs_updated",
      entity: "order",
      entityId: id,
      details: changes,
    });

    return NextResponse.json({
      data: {
        ...order,
        totalCost,
        profit,
        marginPercent,
      },
      refreshHint: { invalidates: ["missingActualCost", "profitAlerts"] },
    });
  } catch (err) {
    console.error("[Order Costs PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update order costs" },
      { status: 500 }
    );
  }
}
