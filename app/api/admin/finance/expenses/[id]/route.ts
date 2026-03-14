import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

const VALID_CATEGORIES = [
  "material", "labor", "shipping", "equipment",
  "rent", "utilities", "software", "marketing", "other",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "finance", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { supplier: { select: { id: true, name: true } } },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ data: expense });
  } catch (err) {
    console.error("[Finance Expense GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "finance", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Build update data from allowed fields
    const data: Record<string, unknown> = {};

    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
      data.category = body.category;
    }

    if (body.description !== undefined) {
      const desc = typeof body.description === "string" ? body.description.trim() : "";
      if (!desc) {
        return NextResponse.json(
          { error: "Description cannot be empty" },
          { status: 400 }
        );
      }
      data.description = desc;
    }

    if (body.amountCents !== undefined) {
      const amt = parseInt(body.amountCents);
      if (!amt || amt <= 0) {
        return NextResponse.json(
          { error: "Amount must be a positive number (in cents)" },
          { status: 400 }
        );
      }
      data.amountCents = amt;
    }

    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.orderId !== undefined) data.orderId = body.orderId || null;
    if (body.supplierId !== undefined) data.supplierId = body.supplierId || null;
    if (body.receiptUrl !== undefined) data.receiptUrl = body.receiptUrl || null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring;
    if (body.recurringDay !== undefined) data.recurringDay = body.recurringDay ? parseInt(body.recurringDay) : null;

    const expense = await prisma.expense.update({
      where: { id },
      data,
      include: { supplier: { select: { id: true, name: true } } },
    });

    await logActivity({
      action: "updated",
      entity: "expense",
      entityId: id,
      details: data as Record<string, unknown>,
    });

    return NextResponse.json({ data: expense });
  } catch (err) {
    console.error("[Finance Expense PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "finance", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { id: true, description: true, amountCents: true, category: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id } });

    await logActivity({
      action: "deleted",
      entity: "expense",
      entityId: id,
      details: {
        description: existing.description,
        amountCents: existing.amountCents,
        category: existing.category,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Finance Expense DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
