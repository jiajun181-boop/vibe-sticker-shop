import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { VALID_INVOICE_STATUSES } from "@/lib/order-config";

/**
 * Generate next invoice number: INV-YYYY-NNNN
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `INV-${year}-`;

  const latest = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextNum = 1;
  if (latest) {
    const lastNum = parseInt(latest.invoiceNumber.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "finance", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");
    const overdue = searchParams.get("overdue");

    const where: Record<string, unknown> = {};

    if (status && VALID_INVOICE_STATUSES.includes(status)) {
      where.status = status;
    }

    // Filter for overdue invoices (due date passed, not paid/void)
    if (overdue === "true") {
      where.status = { in: ["sent", "overdue"] };
      where.dueAt = { lt: new Date() };
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.createdAt = dateFilter;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Auto-detect overdue: "sent" invoices past due date get displayStatus "overdue"
    const now = new Date();
    const enriched = invoices.map((inv: any) => ({
      ...inv,
      displayStatus: inv.status === "sent" && inv.dueAt && new Date(inv.dueAt) < now
        ? "overdue"
        : inv.status,
    }));

    return NextResponse.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[Finance Invoices GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
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
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    const subtotalCents = parseInt(body.subtotalCents);
    const taxCents = parseInt(body.taxCents || "0");
    if (isNaN(subtotalCents) || subtotalCents < 0) {
      return NextResponse.json(
        { error: "Subtotal must be a non-negative number (in cents)" },
        { status: 400 }
      );
    }

    const totalCents = body.totalCents ? parseInt(body.totalCents) : subtotalCents + taxCents;

    // Auto-generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Parse dates
    const issuedAt = body.issuedAt ? new Date(body.issuedAt) : new Date();
    const dueAt = body.dueAt ? new Date(body.dueAt) : null;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: body.orderId || null,
        userId: body.userId || null,
        customerEmail,
        customerName: body.customerName || null,
        companyName: body.companyName || null,
        subtotalCents,
        taxCents,
        totalCents,
        currency: body.currency || "cad",
        status: body.status && VALID_INVOICE_STATUSES.includes(body.status) ? body.status : "draft",
        terms: body.terms || "net_30",
        issuedAt,
        dueAt,
        notes: body.notes || null,
        lineItems: body.lineItems || null,
        createdBy: body.createdBy || null,
      },
    });

    await logActivity({
      action: "created",
      entity: "invoice",
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        customerEmail: invoice.customerEmail,
        totalCents: invoice.totalCents,
      },
    });

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Invoice number conflict. Please retry." },
        { status: 409 }
      );
    }

    console.error("[Finance Invoices POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
