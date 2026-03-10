import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { isValidProofTransition, transitionError } from "@/lib/proof-transitions";

/**
 * PATCH /api/admin/proofs/[proofId]
 *
 * Update an OrderProof's status (approve/reject/reopen/revised) from the Proof Manager.
 *
 * Transition guardrails:
 *   pending/revised  → approved | rejected
 *   approved/rejected → pending (reopen)
 *   pending/rejected  → revised (superseded by revision)
 *
 * Order lifecycle side effects (order-linked proofs only):
 *   → approved  → order.productionStatus = "in_production"
 *   → rejected  → order.productionStatus = "preflight"
 *   → pending   → order.productionStatus = "preflight" (reopened)
 *   → revised   → no order change
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ proofId: string }> }
) {
  try {
    const auth = await requirePermission(request, "tools", "edit");
    if (!auth.authenticated) return auth.response;

    const { proofId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status || !["approved", "rejected", "revised", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: approved, rejected, revised, or pending" },
        { status: 400 }
      );
    }

    const existing = await prisma.orderProof.findUnique({
      where: { id: proofId },
      select: {
        id: true,
        status: true,
        version: true,
        orderId: true,
        order: { select: { id: true, productionStatus: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    // Transition guardrail
    if (!isValidProofTransition(existing.status, status)) {
      return NextResponse.json(
        { error: transitionError(existing.status, status) },
        { status: 409 }
      );
    }

    // Build update payload
    const updateData: Record<string, unknown> = { status };
    if (status === "approved" || status === "rejected") {
      updateData.reviewedAt = new Date();
    }
    if (status === "pending") {
      // Reopen — clear review timestamp
      updateData.reviewedAt = null;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.orderProof.update({
      where: { id: proofId },
      data: updateData,
    });

    // Order lifecycle sync (order-linked proofs only)
    if (existing.orderId) {
      const actorName = auth.user?.name || auth.user?.email || "admin";

      if (status === "approved") {
        await prisma.order.update({
          where: { id: existing.orderId },
          data: { productionStatus: "in_production" },
        });
      } else if (status === "rejected" || status === "pending") {
        await prisma.order.update({
          where: { id: existing.orderId },
          data: { productionStatus: "preflight" },
        });
      }
      // revised → no order change (already preflight or pending never reached production)

      // Timeline entry
      const ACTION_MAP: Record<string, string> = {
        approved: "proof_approved",
        rejected: "proof_rejected",
        pending: "proof_reopened",
        revised: "proof_revised",
      };

      await prisma.orderTimeline.create({
        data: {
          orderId: existing.orderId,
          action: ACTION_MAP[status],
          details: `Proof v${existing.version} ${status} by admin${notes ? `: ${String(notes).slice(0, 100)}` : ""}`,
          actor: actorName,
        },
      });
    }

    return NextResponse.json({ proof: updated });
  } catch (err) {
    console.error("[admin/proofs/[proofId]] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
