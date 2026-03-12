import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";
import {
  deriveWorkflowHint,
  buildQuoteRefreshHint,
} from "@/lib/quotes/workflow";

/**
 * POST /api/admin/quotes/[id]/convert — link a quote to an order
 *
 * Accepts { orderId } and atomically:
 *  1. Sets quote status → "converted"
 *  2. Writes convertedOrderId on the quote
 *
 * Pre-conditions:
 *  - Quote must be in "accepted" state (customer agreed to the price)
 *  - orderId must reference an existing order
 *  - Quote must not already be converted
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const [quote, order] = await Promise.all([
      prisma.quoteRequest.findUnique({ where: { id } }),
      prisma.order.findUnique({ where: { id: orderId }, select: { id: true, status: true } }),
    ]);

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (quote.status === "converted") {
      return NextResponse.json(
        { error: "Quote is already converted", convertedOrderId: quote.convertedOrderId },
        { status: 409 }
      );
    }
    if (quote.status !== "accepted") {
      return NextResponse.json(
        { error: `Quote must be in "accepted" state to convert (current: "${quote.status}")` },
        { status: 400 }
      );
    }

    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: {
        status: "converted",
        convertedOrderId: orderId,
      },
    });

    logActivity({
      action: "quote_converted",
      entity: "QuoteRequest",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: {
        reference: updated.reference,
        orderId,
      },
    });

    const workflow = deriveWorkflowHint("converted");

    return NextResponse.json({
      quote: updated,
      workflow,
      convertedOrderId: orderId,
      refreshHint: buildQuoteRefreshHint(updated),
    });
  } catch (error) {
    console.error("[Admin Quote Convert] Error:", error);
    return NextResponse.json(
      { error: "Failed to convert quote" },
      { status: 500 }
    );
  }
}
