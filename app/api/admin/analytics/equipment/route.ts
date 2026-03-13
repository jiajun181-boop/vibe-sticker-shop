import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/equipment
 *
 * Equipment/factory utilization analytics.
 * Shows job distribution, completion rates, and avg time per factory.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30")));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Factory utilization: jobs per factory, avg completion time, status distribution
    const factoryStats = await prisma.$queryRaw`
      SELECT
        COALESCE(f."name", 'Unassigned') AS "factoryName",
        pj."factoryId",
        COUNT(*)::int AS "totalJobs",
        COUNT(*) FILTER (WHERE pj.status = 'shipped' OR pj.status = 'finished')::int AS "completedJobs",
        COUNT(*) FILTER (WHERE pj.status = 'queued')::int AS "queuedJobs",
        COUNT(*) FILTER (WHERE pj.status = 'printing' OR pj.status = 'assigned')::int AS "activeJobs",
        COUNT(*) FILTER (WHERE pj.status = 'on_hold' OR pj.status = 'canceled')::int AS "heldJobs",
        COUNT(*) FILTER (WHERE pj."isRush" = true)::int AS "rushJobs",
        AVG(
          CASE WHEN pj."completedAt" IS NOT NULL AND pj."startedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (pj."completedAt" - pj."startedAt")) / 3600.0
          ELSE NULL END
        ) AS "avgHoursToComplete",
        AVG(
          CASE WHEN pj."startedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (pj."startedAt" - pj."createdAt")) / 3600.0
          ELSE NULL END
        ) AS "avgHoursToStart"
      FROM "ProductionJob" pj
      LEFT JOIN "Factory" f ON f.id = pj."factoryId"
      WHERE pj."createdAt" >= ${since}
      GROUP BY pj."factoryId", f."name"
      ORDER BY COUNT(*) DESC
    ` as Array<{
      factoryName: string;
      factoryId: string | null;
      totalJobs: number;
      completedJobs: number;
      queuedJobs: number;
      activeJobs: number;
      heldJobs: number;
      rushJobs: number;
      avgHoursToComplete: number | null;
      avgHoursToStart: number | null;
    }>;

    // Product family distribution
    const familyStats = await prisma.$queryRaw`
      SELECT
        COALESCE(pj."family", 'unknown') AS "family",
        COUNT(*)::int AS "jobCount",
        SUM(COALESCE(pj."quantity", 0))::int AS "totalQuantity",
        COUNT(*) FILTER (WHERE pj.status = 'shipped' OR pj.status = 'finished')::int AS "completed"
      FROM "ProductionJob" pj
      WHERE pj."createdAt" >= ${since}
      GROUP BY pj."family"
      ORDER BY COUNT(*) DESC
    ` as Array<{
      family: string;
      jobCount: number;
      totalQuantity: number;
      completed: number;
    }>;

    // Daily job volume for chart
    const dailyVolume = await prisma.$queryRaw`
      SELECT
        date_trunc('day', pj."createdAt")::date AS "date",
        COUNT(*)::int AS "created",
        COUNT(*) FILTER (WHERE pj."completedAt" IS NOT NULL AND date_trunc('day', pj."completedAt") = date_trunc('day', pj."createdAt"))::int AS "completedSameDay"
      FROM "ProductionJob" pj
      WHERE pj."createdAt" >= ${since}
      GROUP BY date_trunc('day', pj."createdAt")
      ORDER BY "date"
    ` as Array<{ date: Date; created: number; completedSameDay: number }>;

    // Summary
    const totalJobs = factoryStats.reduce((s, f) => s + f.totalJobs, 0);
    const completedJobs = factoryStats.reduce((s, f) => s + f.completedJobs, 0);
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      factories: factoryStats.map((f) => ({
        ...f,
        avgHoursToComplete: f.avgHoursToComplete ? Math.round(f.avgHoursToComplete * 10) / 10 : null,
        avgHoursToStart: f.avgHoursToStart ? Math.round(f.avgHoursToStart * 10) / 10 : null,
        completionRate: f.totalJobs > 0 ? Math.round((f.completedJobs / f.totalJobs) * 100) : 0,
      })),
      families: familyStats,
      dailyVolume: dailyVolume.map((d) => ({
        date: d.date,
        created: d.created,
        completedSameDay: d.completedSameDay,
      })),
      summary: {
        totalJobs,
        completedJobs,
        completionRate,
        factoryCount: factoryStats.filter((f) => f.factoryId).length,
      },
    });
  } catch (error) {
    console.error("[Equipment Analytics] Error:", error);
    return NextResponse.json({ error: "Failed to fetch equipment analytics" }, { status: 500 });
  }
}
