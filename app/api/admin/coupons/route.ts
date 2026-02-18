import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "coupons", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const active = searchParams.get("active");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (active === "true") where.isActive = true;
    else if (active === "false") where.isActive = false;

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[Coupons GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "coupons", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    // Validate code
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Validate type
    if (body.type !== "percentage" && body.type !== "fixed") {
      return NextResponse.json(
        { error: "Type must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    // Validate value
    const value = parseInt(body.value);
    if (!value || value <= 0) {
      return NextResponse.json(
        { error: "Value must be a positive number" },
        { status: 400 }
      );
    }
    if (body.type === "percentage" && value > 10000) {
      return NextResponse.json(
        { error: "Percentage value cannot exceed 10000 (100%)" },
        { status: 400 }
      );
    }

    // Validate dates
    const validFrom = new Date(body.validFrom);
    const validTo = new Date(body.validTo);

    if (isNaN(validFrom.getTime()) || isNaN(validTo.getTime())) {
      return NextResponse.json(
        { error: "Valid from and valid to dates are required" },
        { status: 400 }
      );
    }

    if (validFrom >= validTo) {
      return NextResponse.json(
        { error: "Valid from must be before valid to" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: body.type,
        value,
        minAmount: body.minAmount ? parseInt(body.minAmount) : null,
        maxUses: body.maxUses ? parseInt(body.maxUses) : null,
        validFrom,
        validTo,
        description: body.description || null,
      },
      include: {
        _count: { select: { orders: true } },
      },
    });

    await logActivity({
      action: "created",
      entity: "coupon",
      entityId: coupon.id,
      details: { code: coupon.code, type: coupon.type, value: coupon.value },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (err: unknown) {
    // Handle unique constraint violation on code
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

    console.error("[Coupons POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
