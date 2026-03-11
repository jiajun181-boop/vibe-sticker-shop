import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * POST /api/admin/production/[id]/duplicate
 *
 * Creates a copy of an existing production job with the same specs.
 * The new job starts in "queued" status with no order item link.
 *
 * Body (optional):
 *   { quantity?: number, notes?: string }
 *
 * Use cases:
 * - Reprint after defect
 * - Extra copies requested by customer
 * - Test print before full run
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const original = await prisma.productionJob.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const quantity = body.quantity || original.quantity;
    const userNotes = body.notes || "";

    const newJob = await prisma.productionJob.create({
      data: {
        status: "queued",
        priority: original.priority,
        factoryId: original.factoryId,
        assignedTo: original.assignedTo,
        dueAt: original.dueAt,
        productName: original.productName,
        family: original.family,
        quantity,
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
        notes: userNotes || `Duplicated from job ${id.slice(0, 8)}`,
      },
    });

    // Log event on both jobs
    await prisma.jobEvent.create({
      data: {
        jobId: id,
        type: "custom",
        payload: {
          action: "duplicated",
          newJobId: newJob.id,
          newQuantity: quantity,
        },
      },
    });

    await prisma.jobEvent.create({
      data: {
        jobId: newJob.id,
        type: "custom",
        payload: {
          action: "duplicate_created",
          originalJobId: id,
        },
      },
    });

    logActivity({
      action: "job_duplicated",
      entity: "ProductionJob",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: { newJobId: newJob.id, quantity },
    });

    return NextResponse.json({ newJob }, { status: 201 });
  } catch (error) {
    console.error("[ProductionJob Duplicate] Error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate job" },
      { status: 500 }
    );
  }
}
