import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import { syncOrderProductionStatus } from "@/lib/production-sync";
import { VALID_JOB_TRANSITIONS } from "@/lib/order-config";

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

    // Fetch existing jobs with current status for transition validation
    const existingJobs = await prisma.productionJob.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, status: true, startedAt: true, completedAt: true },
    });

    type JobRow = { id: string; status: string; startedAt: Date | null; completedAt: Date | null };
    const existingMap = new Map<string, JobRow>(existingJobs.map((j) => [j.id, j as JobRow]));
    const missingIds = jobIds.filter((id: string) => !existingMap.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Some job IDs not found", missingIds },
        { status: 404 }
      );
    }

    // Validate status transitions for each job
    if (updates.status) {
      const blocked: Array<{ jobId: string; from: string; to: string }> = [];
      for (const jobId of jobIds) {
        const job = existingMap.get(jobId)!;
        if (job.status === updates.status) continue; // no-op is fine
        const allowed = (VALID_JOB_TRANSITIONS as Record<string, string[]>)[job.status];
        if (allowed && !allowed.includes(updates.status)) {
          blocked.push({ jobId, from: job.status, to: updates.status });
        }
      }
      if (blocked.length > 0) {
        return NextResponse.json(
          {
            error: `${blocked.length} job(s) cannot transition to "${updates.status}"`,
            blocked: blocked.slice(0, 10),
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    // Execute transaction: update each job individually for auto-timestamp logic
    const result = await prisma.$transaction(async (tx) => {
      let updatedCount = 0;
      for (const jobId of jobIds as string[]) {
        const existing = existingMap.get(jobId)!;
        const data: Record<string, unknown> = {};
        if (updates.status !== undefined) data.status = updates.status;
        if (updates.factoryId !== undefined) data.factoryId = updates.factoryId;
        if (updates.priority !== undefined) data.priority = updates.priority;

        // Auto-set startedAt when moving to "printing"
        if (updates.status === "printing" && !existing.startedAt) {
          data.startedAt = now;
        }
        // Auto-set completedAt when moving to "finished" or "shipped"
        if (
          (updates.status === "finished" || updates.status === "shipped") &&
          !existing.completedAt
        ) {
          data.completedAt = now;
        }

        await tx.productionJob.update({ where: { id: jobId }, data });
        updatedCount++;
      }

      // Create a JobEvent for each job
      await tx.jobEvent.createMany({
        data: (jobIds as string[]).map((jobId) => ({
          jobId,
          type: "bulk_update",
          payload: updates,
        })),
      });

      return updatedCount;
    });

    // Sync parent order statuses for affected jobs (fire-and-forget)
    if (updates.status) {
      const affectedJobs = await prisma.productionJob.findMany({
        where: { id: { in: jobIds } },
        select: { orderItem: { select: { orderId: true } } },
      });
      const orderIds = [...new Set(affectedJobs.map((j) => j.orderItem.orderId))] as string[];
      for (const oid of orderIds) {
        syncOrderProductionStatus(oid).catch(() => {});
      }
    }

    // Fire-and-forget activity log
    logActivity({
      action: "bulk_update",
      entity: "ProductionJob",
      details: {
        jobIds,
        updates,
        count: result,
      },
    });

    return NextResponse.json({ success: true, updated: result });
  } catch (error) {
    console.error("[Production Bulk Update POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to bulk update production jobs" },
      { status: 500 }
    );
  }
}
