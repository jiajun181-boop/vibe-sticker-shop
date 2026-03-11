import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * GET /api/admin/quotes/[id] — get quote detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const quote = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    return NextResponse.json({ quote });
  } catch (error) {
    console.error("[Admin Quote GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/quotes/[id] — update quote status, add pricing, notes
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, quotedAmountCents, adminNotes } = body;

    const existing = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (quotedAmountCents !== undefined) data.quotedAmountCents = quotedAmountCents;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;

    // If quoting, set quotedBy and quotedAt
    if (status === "quoted" || quotedAmountCents != null) {
      data.quotedBy = auth.user?.email || "admin";
      data.quotedAt = new Date();
    }

    const quote = await prisma.quoteRequest.update({
      where: { id },
      data,
    });

    logActivity({
      action: "quote_updated",
      entity: "QuoteRequest",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: { status: quote.status, reference: quote.reference },
    });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("[Admin Quote PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
