import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * PATCH /api/admin/proofs/[proofId]
 *
 * Update an OrderProof's status (approve/reject/revise) from the Proof Manager.
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

    const existing = await prisma.orderProof.findUnique({ where: { id: proofId } });
    if (!existing) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "approved" || status === "rejected") {
      updateData.reviewedAt = new Date();
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.orderProof.update({
      where: { id: proofId },
      data: updateData,
    });

    return NextResponse.json({ proof: updated });
  } catch (err) {
    console.error("[admin/proofs/[proofId]] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
