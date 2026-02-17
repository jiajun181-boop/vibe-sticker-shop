import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/orders/[id]/proofs
 * List all proofs for an order (admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const proofs = await prisma.orderProof.findMany({
      where: { orderId: id },
      orderBy: { version: "asc" },
    });

    return NextResponse.json({ proofs });
  } catch (err) {
    console.error("[Admin Proofs GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch proofs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders/[id]/proofs
 * Upload a new proof for an order
 *
 * Body: { imageUrl: string, fileName?: string, notes?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { imageUrl, fileName, notes } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Auto-calculate version: max existing version + 1
    const latestProof = await prisma.orderProof.findFirst({
      where: { orderId: id },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (latestProof?.version ?? 0) + 1;

    const proof = await prisma.orderProof.create({
      data: {
        orderId: id,
        version: nextVersion,
        imageUrl,
        fileName: fileName ?? null,
        notes: notes ?? null,
        uploadedBy: auth.user?.name || auth.user?.email || "admin",
      },
    });

    // Add timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: "proof_uploaded",
        details: `Proof v${nextVersion} uploaded${fileName ? ` (${fileName})` : ""}`,
        actor: auth.user?.name || auth.user?.email || "admin",
      },
    });

    return NextResponse.json({ proof }, { status: 201 });
  } catch (err) {
    console.error("[Admin Proofs POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create proof" },
      { status: 500 }
    );
  }
}
