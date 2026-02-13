import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "coupons", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (err) {
    console.error("[Coupon GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "coupons", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "code",
      "type",
      "value",
      "minAmount",
      "maxUses",
      "validFrom",
      "validTo",
      "isActive",
      "description",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "code") {
          data.code =
            typeof body.code === "string"
              ? body.code.trim().toUpperCase()
              : body.code;
        } else if (field === "validFrom" || field === "validTo") {
          data[field] = new Date(body[field]);
        } else {
          data[field] = body[field];
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (data.type && data.type !== "percentage" && data.type !== "fixed") {
      return NextResponse.json(
        { error: "Type must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    // Validate value if provided
    if (data.value !== undefined) {
      const value = parseInt(data.value as string);
      if (!value || value <= 0) {
        return NextResponse.json(
          { error: "Value must be a positive number" },
          { status: 400 }
        );
      }
      data.value = value;

      // Check percentage cap - need to know the type
      const type = data.type || (await prisma.coupon.findUnique({ where: { id }, select: { type: true } }))?.type;
      if (type === "percentage" && value > 10000) {
        return NextResponse.json(
          { error: "Percentage value cannot exceed 10000 (100%)" },
          { status: 400 }
        );
      }
    }

    // Validate date order if both are provided
    if (data.validFrom && data.validTo) {
      if ((data.validFrom as Date) >= (data.validTo as Date)) {
        return NextResponse.json(
          { error: "Valid from must be before valid to" },
          { status: 400 }
        );
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data,
      include: {
        _count: { select: { orders: true } },
      },
    });

    await logActivity({
      action: "updated",
      entity: "coupon",
      entityId: coupon.id,
      details: { updatedFields: Object.keys(data) },
    });

    return NextResponse.json(coupon);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    console.error("[Coupon PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "coupons", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const orderCount = await prisma.order.count({ where: { couponId: id } });

    if (orderCount > 0) {
      // Deactivate instead of hard delete
      const coupon = await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });

      await logActivity({
        action: "deactivated",
        entity: "coupon",
        entityId: id,
        details: {
          reason: "Has linked orders, deactivated instead of deleted",
          orderCount,
        },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `Coupon has ${orderCount} linked order(s) and was deactivated instead of deleted.`,
        coupon,
      });
    }

    await prisma.coupon.delete({ where: { id } });

    await logActivity({
      action: "deleted",
      entity: "coupon",
      entityId: id,
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (err) {
    console.error("[Coupon DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
