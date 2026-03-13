import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/production-efficiency
 *
 * Production efficiency metrics: turnaround times, on-time rate,
 * bottleneck detection, and operator performance.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30")));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Turnaround time distribution (queue to completion)
    const turnaround = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN EXTRACT(EPOCH FROM (pj."completedAt" - pj."createdAt")) / 3600 < 24 THEN 'same_day'
          WHEN EXTRACT(EPOCH FROM (pj."completedAt" - pj."createdAt")) / 3600 < 48 THEN '1_day'
          WHEN EXTRACT(EPOCH FROM (pj."completedAt" - pj."createdAt")) / 3600 < 72 THEN '2_days'
          WHEN EXTRACT(EPOCH FROM (pj."completedAt" - pj."createdAt")) / 3600 < 120 THEN '3_5_days'
          ELSE 'over_5_days'
        END AS "bucket",
        COUNT(*)::int AS "count"
      FROM "ProductionJob" pj
      WHERE pj."completedAt" IS NOT NULL
        AND pj."createdAt" >= ${since}
      GROUP BY "bucket"
    ` as Array<{ bucket: string; count: number }>;

    // On-time rate (completed before dueAt)
    const onTimeStats = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "total",
        COUNT(*) FILTER (WHERE pj."completedAt" <= pj."dueAt")::int AS "onTime",
        COUNT(*) FILTER (WHERE pj."completedAt" > pj."dueAt")::int AS "late",
        COUNT(*) FILTER (WHERE pj."dueAt" IS NULL)::int AS "noDueDate"
      FROM "ProductionJob" pj
      WHERE pj."completedAt" IS NOT NULL
        AND pj."createdAt" >= ${since}
    ` as Array<{ total: number; onTime: number; late: number; noDueDate: number }>;

    // Operator performance (by assignedTo)
    const operatorStats = await prisma.$queryRaw`
      SELECT
        COALESCE(pj."assignedTo", 'Unassigned') AS "operator",
        COUNT(*)::int AS "totalJobs",
        COUNT(*) FILTER (WHERE pj.status IN ('shipped', 'finished'))::int AS "completed",
        AVG(
          CASE WHEN pj."completedAt" IS NOT NULL AND pj."startedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (pj."completedAt" - pj."startedAt")) / 3600.0
          ELSE NULL END
        ) AS "avgHours",
        COUNT(*) FILTER (WHERE pj."completedAt" IS NOT NULL AND pj."dueAt" IS NOT NULL AND pj."completedAt" <= pj."dueAt")::int AS "onTime"
      FROM "ProductionJob" pj
      WHERE pj."createdAt" >= ${since}
      GROUP BY pj."assignedTo"
      ORDER BY COUNT(*) DESC
    ` as Array<{
      operator: string;
      totalJobs: number;
      completed: number;
      avgHours: number | null;
      onTime: number;
    }>;

    // Bottleneck: avg time in each status
    const statusDuration = await prisma.$queryRaw`
      SELECT
        pj.status,
        COUNT(*)::int AS "count",
        AVG(EXTRACT(EPOCH FROM (NOW() - pj."createdAt")) / 3600.0) AS "avgHoursInStatus"
      FROM "ProductionJob" pj
      WHERE pj."createdAt" >= ${since}
        AND pj.status NOT IN ('shipped', 'finished', 'canceled')
      GROUP BY pj.status
      ORDER BY "avgHoursInStatus" DESC
    ` as Array<{ status: string; count: number; avgHoursInStatus: number }>;

    // Daily throughput
    const dailyThroughput = await prisma.$queryRaw`
      SELECT
        date_trunc('day', pj."completedAt")::date AS "date",
        COUNT(*)::int AS "completed",
        SUM(COALESCE(pj."quantity", 1))::int AS "unitsProduced"
      FROM "ProductionJob" pj
      WHERE pj."completedAt" IS NOT NULL
        AND pj."completedAt" >= ${since}
      GROUP BY date_trunc('day', pj."completedAt")
      ORDER BY "date"
    ` as Array<{ date: Date; completed: number; unitsProduced: number }>;

    const stats = onTimeStats[0] || { total: 0, onTime: 0, late: 0, noDueDate: 0 };
    const onTimeRate = stats.total > 0
      ? Math.round((stats.onTime / (stats.total - stats.noDueDate || 1)) * 100)
      : 0;

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      turnaround,
      onTime: {
        ...stats,
        rate: onTimeRate,
      },
      operators: operatorStats.map((o) => ({
        ...o,
        avgHours: o.avgHours ? Math.round(Number(o.avgHours) * 10) / 10 : null,
        onTimeRate: o.completed > 0 ? Math.round((o.onTime / o.completed) * 100) : 0,
      })),
      bottlenecks: statusDuration.map((s) => ({
        status: s.status,
        count: s.count,
        avgHours: Math.round(Number(s.avgHoursInStatus) * 10) / 10,
      })),
      dailyThroughput,
      summary: {
        onTimeRate,
        avgTurnaroundHours: (() => {
          const totalCount = turnaround.reduce((s, t) => s + t.count, 0);
          if (totalCount === 0) return 0;
          const hourMap: Record<string, number> = { same_day: 12, "1_day": 36, "2_days": 60, "3_5_days": 96, over_5_days: 168 };
          const weightedSum = turnaround.reduce((s, t) => s + (hourMap[t.bucket] || 0) * t.count, 0);
          return Math.round((weightedSum / totalCount) * 10) / 10;
        })(),
        totalCompleted: stats.total,
        operatorCount: operatorStats.filter((o) => o.operator !== "Unassigned").length,
      },
    });
  } catch (error) {
    console.error("[Production Efficiency] Error:", error);
    return NextResponse.json({ error: "Failed to fetch production efficiency" }, { status: 500 });
  }
}
