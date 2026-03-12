import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import {
  deriveWorkflowHint,
  computeQueueSummary,
  type QuoteStatus,
} from "@/lib/quotes/workflow";

/**
 * GET /api/admin/quotes — list quote requests with search, status filter, pagination
 *
 * Response includes per-quote workflow hints (isTerminal, isActionable,
 * queueState, primaryAction, secondaryAction) so the UI renders queue
 * state without reimplementing the state machine.
 */
export async function GET(request: NextRequest) {
  // Quotes are pricing-center-owned: quote requests require pricing knowledge
  // to set quotedAmountCents, and the pricing center has the quote simulator.
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { productType: { contains: search, mode: "insensitive" } },
      ];
    }

    const [quotes, total, statusCountsRaw, topActionableRow] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.quoteRequest.count({ where }),
      prisma.quoteRequest.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      // Top actionable quote — for dashboard exact-target landing
      prisma.quoteRequest.findFirst({
        where: { status: { in: ["new", "reviewing", "accepted"] } },
        orderBy: { createdAt: "asc" }, // oldest first = most urgent
        select: { id: true, reference: true, status: true, customerName: true, productType: true },
      }),
    ]);

    // Build { new: 5, reviewing: 2, ... } map
    const statusCounts: Record<string, number> = {};
    for (const row of statusCountsRaw) {
      statusCounts[row.status] = row._count.status;
    }

    // Enrich each quote with workflow hints
    const enrichedQuotes = quotes.map((q) => ({
      ...q,
      workflow: deriveWorkflowHint(q.status as QuoteStatus),
    }));

    // Queue summary for dashboard integration
    const topActionable = topActionableRow
      ? {
          id: topActionableRow.id,
          reference: topActionableRow.reference,
          status: topActionableRow.status,
          customerName: topActionableRow.customerName,
          label: `${topActionableRow.reference} \u2014 ${topActionableRow.customerName}`,
        }
      : null;
    const queueSummary = computeQueueSummary(statusCounts, topActionable);

    return NextResponse.json({
      quotes: enrichedQuotes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      statusCounts,
      queueSummary,
    });
  } catch (error) {
    console.error("[Admin Quotes GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
