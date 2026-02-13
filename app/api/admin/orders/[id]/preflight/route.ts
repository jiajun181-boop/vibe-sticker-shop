import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/orders/[id]/preflight
 * List all files for an order with their preflight status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const files = await prisma.orderFile.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ files });
  } catch (err) {
    console.error("[Preflight] List error:", err);
    return NextResponse.json({ error: "Failed to load files" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/orders/[id]/preflight
 * Review an order file (approve or reject)
 *
 * Body: {
 *   fileId: string,
 *   status: "approved" | "rejected",
 *   notes?: string,
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { fileId, status, notes } = body;

    if (!fileId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "fileId and status (approved/rejected) are required" },
        { status: 400 }
      );
    }

    // Verify file belongs to this order
    const file = await prisma.orderFile.findFirst({
      where: { id: fileId, orderId: id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found for this order" }, { status: 404 });
    }

    const updated = await prisma.orderFile.update({
      where: { id: fileId },
      data: {
        preflightStatus: status,
        reviewedBy: auth.user?.name || auth.user?.email || "admin",
        reviewedAt: new Date(),
        preflightResult: notes ? { notes } : file.preflightResult,
      },
    });

    // Add timeline event
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        action: `preflight_${status}`,
        details: `File "${file.fileName || fileId}" ${status}${notes ? `: ${notes.slice(0, 100)}` : ""}`,
        actor: auth.user?.name || "staff",
      },
    });

    // If all files are approved, auto-advance to production
    if (status === "approved") {
      const allFiles = await prisma.orderFile.findMany({
        where: { orderId: id },
      });
      const allApproved = allFiles.every((f) => f.preflightStatus === "approved");

      if (allApproved) {
        const order = await prisma.order.findUnique({ where: { id } });
        if (order && order.productionStatus === "preflight") {
          await prisma.order.update({
            where: { id },
            data: { productionStatus: "in_production" },
          });
          await prisma.orderTimeline.create({
            data: {
              orderId: id,
              action: "production_started",
              details: "All files approved — moved to production",
              actor: "system",
            },
          });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Preflight] Review error:", err);
    return NextResponse.json({ error: "Failed to update preflight status" }, { status: 500 });
  }
}
