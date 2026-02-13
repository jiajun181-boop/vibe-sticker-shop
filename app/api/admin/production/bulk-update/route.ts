import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { jobIds, updates } = body;

    // Validate jobIds is a non-empty array
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "jobIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate at least one update field is provided
    if (
      !updates ||
      typeof updates !== "object" ||
      (!updates.status && !updates.factoryId && !updates.priority)
    ) {
      return NextResponse.json(
        { error: "At least one update field (status, factoryId, priority) is required" },
        { status: 400 }
      );
    }

    // Verify all jobIds exist
    const existingJobs = await prisma.productionJob.findMany({
      where: { id: { in: jobIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingJobs.map((j) => j.id));
    const missingIds = jobIds.filter((id: string) => !existingIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Some job IDs not found", missingIds },
        { status: 404 }
      );
    }

    // Build the update data
    const data: Record<string, unknown> = {};
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.factoryId !== undefined) data.factoryId = updates.factoryId;
    if (updates.priority !== undefined) data.priority = updates.priority;

    // Execute transaction: update all jobs and create events
    const result = await prisma.$transaction(async (tx) => {
      // Update all jobs
      const updateResult = await tx.productionJob.updateMany({
        where: { id: { in: jobIds } },
        data,
      });

      // Create a JobEvent for each job
      await tx.jobEvent.createMany({
        data: jobIds.map((jobId: string) => ({
          jobId,
          type: "bulk_update",
          payload: updates,
        })),
      });

      return updateResult;
    });

    // Fire-and-forget activity log
    logActivity({
      action: "bulk_update",
      entity: "ProductionJob",
      details: {
        jobIds,
        updates,
        count: result.count,
      },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error("[Production Bulk Update POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to bulk update production jobs" },
      { status: 500 }
    );
  }
}
