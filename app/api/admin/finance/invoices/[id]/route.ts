import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { VALID_INVOICE_STATUSES, VALID_INVOICE_TRANSITIONS } from "@/lib/order-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ data: invoice });
  } catch (err) {
    console.error("[Finance Invoice GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
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

    const existing = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Prevent editing void invoices
    if (existing.status === "void") {
      return NextResponse.json(
        { error: "Cannot edit a voided invoice" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};

    // Status change with transition validation
    if (body.status !== undefined) {
      if (!VALID_INVOICE_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid invoice status" },
          { status: 400 }
        );
      }
      const allowed = VALID_INVOICE_TRANSITIONS[existing.status as keyof typeof VALID_INVOICE_TRANSITIONS];
      if (allowed && !allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition invoice from "${existing.status}" to "${body.status}"` },
          { status: 400 }
        );
      }
      data.status = body.status;

      // Auto-set paidAt when marking as paid
      if (body.status === "paid" && existing.status !== "paid") {
        data.paidAt = new Date();
      }
    }

    // Allow updating these fields
    if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail;
    if (body.customerName !== undefined) data.customerName = body.customerName || null;
    if (body.companyName !== undefined) data.companyName = body.companyName || null;
    if (body.subtotalCents !== undefined) data.subtotalCents = parseInt(body.subtotalCents);
    if (body.taxCents !== undefined) data.taxCents = parseInt(body.taxCents);
    if (body.totalCents !== undefined) data.totalCents = parseInt(body.totalCents);
    if (body.terms !== undefined) data.terms = body.terms;
    if (body.issuedAt !== undefined) data.issuedAt = body.issuedAt ? new Date(body.issuedAt) : null;
    if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.paidAt !== undefined) data.paidAt = body.paidAt ? new Date(body.paidAt) : null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.lineItems !== undefined) data.lineItems = body.lineItems;
    if (body.orderId !== undefined) data.orderId = body.orderId || null;

    const invoice = await prisma.invoice.update({
      where: { id },
      data,
    });

    await logActivity({
      action: "updated",
      entity: "invoice",
      entityId: id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        changes: Object.keys(data),
      },
    });

    return NextResponse.json({ data: invoice });
  } catch (err) {
    console.error("[Finance Invoice PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update invoice" },
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

    const existing = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true, invoiceNumber: true, status: true, totalCents: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Prevent deleting paid invoices — void them instead
    if (existing.status === "paid") {
      return NextResponse.json(
        { error: "Cannot delete a paid invoice. Void it instead." },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({ where: { id } });

    await logActivity({
      action: "deleted",
      entity: "invoice",
      entityId: id,
      details: {
        invoiceNumber: existing.invoiceNumber,
        totalCents: existing.totalCents,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Finance Invoice DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
