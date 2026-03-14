import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

const VALID_CATEGORIES = [
  "material", "labor", "shipping", "equipment",
  "rent", "utilities", "software", "marketing", "other",
];

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "finance", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const category = searchParams.get("category");
    const supplierId = searchParams.get("supplierId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.date = dateFilter;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { supplier: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[Finance Expenses GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "finance", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: "Valid category is required" },
        { status: 400 }
      );
    }

    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const amountCents = parseInt(body.amountCents);
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number (in cents)" },
        { status: 400 }
      );
    }

    // Validate supplier exists if provided
    if (body.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: body.supplierId },
        select: { id: true },
      });
      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }
    }

    const expense = await prisma.expense.create({
      data: {
        category: body.category,
        description,
        amountCents,
        currency: body.currency || "cad",
        date: body.date ? new Date(body.date) : new Date(),
        orderId: body.orderId || null,
        supplierId: body.supplierId || null,
        receiptUrl: body.receiptUrl || null,
        notes: body.notes || null,
        isRecurring: body.isRecurring || false,
        recurringDay: body.isRecurring ? parseInt(body.recurringDay) || null : null,
        createdBy: body.createdBy || null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });

    await logActivity({
      action: "created",
      entity: "expense",
      entityId: expense.id,
      details: {
        category: expense.category,
        amountCents: expense.amountCents,
        description: expense.description,
      },
    });

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (err) {
    console.error("[Finance Expenses POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
