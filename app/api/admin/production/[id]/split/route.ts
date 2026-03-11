import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * POST /api/admin/production/[id]/split
 *
 * Splits a production job into two jobs by dividing the quantity.
 * The original job keeps `keepQuantity`, a new job gets the remainder.
 * Both jobs inherit all specs from the original.
 *
 * Body: { keepQuantity: number }
 *
 * Use cases:
 * - Large orders split across machines
 * - Partial rework (reprint subset)
 * - Multi-sheet production where different sheets go to different factories
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { keepQuantity } = body;

    if (!keepQuantity || typeof keepQuantity !== "number" || keepQuantity < 1) {
      return NextResponse.json(
        { error: "keepQuantity must be a positive integer" },
        { status: 400 }
      );
    }

    const original = await prisma.productionJob.findUnique({
      where: { id },
      include: {
        orderItem: { select: { id: true } },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const originalQty = original.quantity || 0;
    if (keepQuantity >= originalQty) {
      return NextResponse.json(
        { error: `keepQuantity (${keepQuantity}) must be less than current quantity (${originalQty})` },
        { status: 400 }
      );
    }

    // Only allow splitting jobs that haven't been completed
    if (["finished", "shipped"].includes(original.status)) {
      return NextResponse.json(
        { error: "Cannot split a completed/shipped job" },
        { status: 400 }
      );
    }

    const splitQuantity = originalQty - keepQuantity;

    // Transaction: update original + create new job + log events
    const [updatedOriginal, newJob] = await prisma.$transaction(async (tx) => {
      // Update original quantity
      const updated = await tx.productionJob.update({
        where: { id },
        data: { quantity: keepQuantity },
      });

      // Create new job with remaining quantity.
      // orderItemId is unique, so the split job has no direct item link.
      // It inherits all production specs and references the original via events.
      const created = await tx.productionJob.create({
        data: {
          status: original.status === "on_hold" ? "on_hold" : "queued",
          priority: original.priority,
          factoryId: original.factoryId,
          assignedTo: original.assignedTo,
          dueAt: original.dueAt,
          productName: original.productName,
          family: original.family,
          quantity: splitQuantity,
          widthIn: original.widthIn,
          heightIn: original.heightIn,
          material: original.material,
          materialLabel: original.materialLabel,
          finishing: original.finishing,
          finishingLabel: original.finishingLabel,
          artworkUrl: original.artworkUrl,
          artworkKey: original.artworkKey,
          isTwoSided: original.isTwoSided,
          isRush: original.isRush,
          notes: `Split from job ${id.slice(0, 8)} (original qty: ${originalQty})`,
        },
      });

      // Log events on both
      await tx.jobEvent.create({
        data: {
          jobId: id,
          type: "custom",
          payload: {
            action: "split",
            originalQuantity: originalQty,
            keptQuantity: keepQuantity,
            splitQuantity,
            newJobId: created.id,
          },
        },
      });

      await tx.jobEvent.create({
        data: {
          jobId: created.id,
          type: "custom",
          payload: {
            action: "split_created",
            originalJobId: id,
            originalQuantity: originalQty,
            splitQuantity,
          },
        },
      });

      return [updated, created];
    });

    logActivity({
      action: "job_split",
      entity: "ProductionJob",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: {
        originalQuantity: originalQty,
        keptQuantity: keepQuantity,
        splitQuantity,
        newJobId: newJob.id,
      },
    });

    return NextResponse.json({
      original: { id: updatedOriginal.id, quantity: updatedOriginal.quantity },
      newJob: { id: newJob.id, quantity: newJob.quantity, status: newJob.status },
    }, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation on orderItemId
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Cannot split: order item already has a linked job. Use duplicate instead." },
        { status: 409 }
      );
    }
    console.error("[ProductionJob Split] Error:", error);
    return NextResponse.json(
      { error: "Failed to split job" },
      { status: 500 }
    );
  }
}
