import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { expenses: true } },
        expenses: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ data: supplier });
  } catch (err) {
    console.error("[Finance Supplier GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "analytics", "admin");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.supplier.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const allowedFields = [
      "name", "contactName", "email", "phone",
      "website", "address", "notes", "isActive",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    if (data.name !== undefined) {
      const name = typeof data.name === "string" ? (data.name as string).trim() : "";
      if (!name) {
        return NextResponse.json(
          { error: "Supplier name cannot be empty" },
          { status: 400 }
        );
      }
      data.name = name;
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
      include: {
        _count: { select: { expenses: true } },
      },
    });

    await logActivity({
      action: "updated",
      entity: "supplier",
      entityId: id,
      details: data as Record<string, unknown>,
    });

    return NextResponse.json({ data: supplier });
  } catch (err) {
    console.error("[Finance Supplier PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "analytics", "admin");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const existing = await prisma.supplier.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { expenses: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Prevent deletion if supplier has expenses linked
    if (existing._count.expenses > 0) {
      return NextResponse.json(
        { error: `Cannot delete supplier with ${existing._count.expenses} linked expense(s). Remove or reassign them first.` },
        { status: 409 }
      );
    }

    await prisma.supplier.delete({ where: { id } });

    await logActivity({
      action: "deleted",
      entity: "supplier",
      entityId: id,
      details: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Finance Supplier DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
