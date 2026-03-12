import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";
import {
  ALLOWED_TRANSITIONS,
  deriveWorkflowHint,
  buildQuoteRefreshHint,
  type QuoteStatus,
} from "@/lib/quotes/workflow";

/**
 * GET /api/admin/quotes/[id] — get quote detail with workflow context
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const quote = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Enrich with provenance: if converted, include downstream order + production state
    let convertedOrder = null;
    if (quote.status === "converted" && quote.convertedOrderId) {
      const order = await prisma.order.findUnique({
        where: { id: quote.convertedOrderId },
        select: {
          id: true,
          status: true,
          productionStatus: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              productName: true,
              productionJob: {
                select: { id: true, status: true },
              },
            },
          },
        },
      });
      if (order) {
        convertedOrder = {
          id: order.id,
          status: order.status,
          productionStatus: order.productionStatus,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          itemCount: order.items.length,
          productionJobs: order.items
            .filter((i) => i.productionJob)
            .map((i) => ({
              jobId: i.productionJob!.id,
              itemId: i.id,
              productName: i.productName,
              jobStatus: i.productionJob!.status,
            })),
        };
      }
    }

    // Workflow semantics — so UI doesn't reimplement state machine
    const status = quote.status as QuoteStatus;
    const allowedTransitions = ALLOWED_TRANSITIONS[status] || [];
    const workflow = deriveWorkflowHint(status);

    // Conversion readiness — tells UI whether convert action is available
    const canConvert = status === "accepted";
    const needsQuoteAmount = status === "reviewing" && !quote.quotedAmountCents;

    return NextResponse.json({
      quote,
      allowedTransitions,
      workflow,
      canConvert,
      needsQuoteAmount,
      convertedOrder,
    });
  } catch (error) {
    console.error("[Admin Quote GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/quotes/[id] — update quote status, add pricing, notes
 *
 * State transition validation:
 * - Status changes must follow ALLOWED_TRANSITIONS map
 * - Moving to "quoted" requires quotedAmountCents > 0
 * - "converted" cannot be set here — use POST /api/admin/quotes/[id]/convert
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, quotedAmountCents, adminNotes } = body;

    const existing = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // ── State transition validation ──────────────────────────────────
    if (status && status !== existing.status) {
      if (status === "converted") {
        return NextResponse.json(
          { error: "Use the convert endpoint to transition to converted" },
          { status: 400 }
        );
      }

      const allowed = ALLOWED_TRANSITIONS[existing.status as QuoteStatus] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from "${existing.status}" to "${status}"` },
          { status: 400 }
        );
      }

      // "quoted" requires a price — either already set or being set now
      if (status === "quoted") {
        const effectiveAmount = quotedAmountCents ?? existing.quotedAmountCents;
        if (!effectiveAmount || effectiveAmount <= 0) {
          return NextResponse.json(
            { error: "Cannot mark as quoted without a quoted amount" },
            { status: 400 }
          );
        }
      }
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

    // Return workflow hints + refresh contract so UI updates queue state
    const workflow = deriveWorkflowHint(quote.status as QuoteStatus);
    const allowedTransitions = ALLOWED_TRANSITIONS[quote.status as QuoteStatus] || [];

    return NextResponse.json({
      quote,
      workflow,
      allowedTransitions,
      refreshHint: buildQuoteRefreshHint(quote),
    });
  } catch (error) {
    console.error("[Admin Quote PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
