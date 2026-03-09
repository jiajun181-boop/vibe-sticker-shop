import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const active = searchParams.get("active");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (active === "true") where.isActive = true;
    else if (active === "false") where.isActive = false;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: { select: { expenses: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[Finance Suppliers GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "admin");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName: body.contactName || null,
        email: body.email || null,
        phone: body.phone || null,
        website: body.website || null,
        address: body.address || null,
        notes: body.notes || null,
        isActive: body.isActive !== false,
      },
      include: {
        _count: { select: { expenses: true } },
      },
    });

    await logActivity({
      action: "created",
      entity: "supplier",
      entityId: supplier.id,
      details: { name: supplier.name },
    });

    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (err) {
    console.error("[Finance Suppliers POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
