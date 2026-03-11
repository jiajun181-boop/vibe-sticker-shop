import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/admin-auth";

interface OperatorRow {
  assigned_to: string;
  active_jobs: bigint;
  queued_jobs: bigint;
  printing_jobs: bigint;
  qc_jobs: bigint;
  completed_today: bigint;
  avg_hours: number | null;
}

/**
 * GET /api/admin/production/operators
 *
 * Returns operator workload summary — active job counts, completion rates,
 * and average turnaround per operator (assignedTo field).
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const rows = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          "assignedTo" AS assigned_to,
          COUNT(*) FILTER (WHERE status NOT IN ('finished', 'shipped'))::bigint AS active_jobs,
          COUNT(*) FILTER (WHERE status = 'queued')::bigint AS queued_jobs,
          COUNT(*) FILTER (WHERE status = 'printing')::bigint AS printing_jobs,
          COUNT(*) FILTER (WHERE status = 'quality_check')::bigint AS qc_jobs,
          COUNT(*) FILTER (WHERE status IN ('finished', 'shipped') AND "completedAt" >= ${todayStart})::bigint AS completed_today,
          AVG(EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) / 3600) FILTER (WHERE "completedAt" IS NOT NULL AND "startedAt" IS NOT NULL) AS avg_hours
        FROM "ProductionJob"
        WHERE "assignedTo" IS NOT NULL AND "assignedTo" != ''
        GROUP BY "assignedTo"
        ORDER BY active_jobs DESC
      `
    )) as OperatorRow[];

    const operators = rows.map((r) => ({
      name: r.assigned_to,
      activeJobs: Number(r.active_jobs),
      queuedJobs: Number(r.queued_jobs),
      printingJobs: Number(r.printing_jobs),
      qcJobs: Number(r.qc_jobs),
      completedToday: Number(r.completed_today),
      avgProductionHours: r.avg_hours != null
        ? Math.round(Number(r.avg_hours) * 10) / 10
        : null,
    }));

    // Also get unassigned count
    const unassigned = await prisma.productionJob.count({
      where: {
        OR: [{ assignedTo: null }, { assignedTo: "" }],
        status: { notIn: ["finished", "shipped"] },
      },
    });

    return NextResponse.json({
      operators,
      unassignedCount: unassigned,
      totalOperators: operators.length,
    });
  } catch (error) {
    console.error("[Production Operators] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch operator workload" },
      { status: 500 }
    );
  }
}
