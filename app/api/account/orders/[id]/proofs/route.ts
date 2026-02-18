import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * GET /api/account/orders/[id]/proofs
 * List all proofs for the customer's order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify order belongs to the user (match userId or email)
    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true, customerEmail: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });

    if (!order || (order.userId !== session.userId && order.customerEmail !== user?.email)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const proofs = await prisma.orderProof.findMany({
      where: { orderId: id },
      orderBy: { version: "asc" },
    });

    return NextResponse.json({ proofs });
  } catch (err) {
    console.error("[Account Proofs GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch proofs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/orders/[id]/proofs
 * Approve or reject a proof
 *
 * Body: { proofId: string, action: "approved" | "rejected", comment?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { proofId, action, comment } = body;

    if (!proofId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { error: "proofId and action (approved/rejected) are required" },
        { status: 400 }
      );
    }

    // Verify order belongs to user (match userId or email)
    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true, customerEmail: true, productionStatus: true },
    });
    const ownerUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });

    if (!order || (order.userId !== session.userId && order.customerEmail !== ownerUser?.email)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify proof belongs to this order
    const proof = await prisma.orderProof.findFirst({
      where: { id: proofId, orderId: id },
    });

    if (!proof) {
      return NextResponse.json(
        { error: "Proof not found for this order" },
        { status: 404 }
      );
    }

    // Update proof status
    const updatedProof = await prisma.orderProof.update({
      where: { id: proofId },
      data: {
        status: action,
        customerComment: comment ?? null,
        reviewedAt: new Date(),
      },
    });

    // Add timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: action === "approved" ? "proof_approved" : "proof_rejected",
        details:
          action === "approved"
            ? `Proof v${proof.version} approved by customer${comment ? `: ${comment.slice(0, 100)}` : ""}`
            : `Proof v${proof.version} rejected by customer${comment ? `: ${comment.slice(0, 100)}` : ""}`,
        actor: "customer",
      },
    });

    // Update order productionStatus based on action
    if (action === "rejected") {
      await prisma.order.update({
        where: { id },
        data: { productionStatus: "preflight" },
      });
    } else if (action === "approved") {
      await prisma.order.update({
        where: { id },
        data: { productionStatus: "in_production" },
      });
    }

    return NextResponse.json({ proof: updatedProof });
  } catch (err) {
    console.error("[Account Proofs POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to update proof" },
      { status: 500 }
    );
  }
}
