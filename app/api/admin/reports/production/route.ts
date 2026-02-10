import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdminAuth } from "@/lib/admin-auth";

interface OnTimeRow {
  total_completed: bigint;
  on_time_completed: bigint;
}

interface AvgTimeRow {
  avg_hours: number | null;
}

interface StatusDistRow {
  status: string;
  count: bigint;
}

interface TurnaroundRow {
  date: Date;
  avg_hours: number | null;
}

interface FactoryPerfRow {
  factory_id: string;
  name: string;
  completed_jobs: bigint;
  avg_time: number | null;
  on_time_rate: number | null;
}

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    const to = toParam ? new Date(toParam) : now;
    const from = fromParam
      ? new Date(fromParam)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      onTimeResult,
      avgTimeResult,
      factoryUtilization,
      statusDistResult,
      delayedOrders,
      turnaroundResult,
      factoryPerfResult,
    ] = await Promise.all([
      // (a) On-time completion rate
      (async () => {
        const rows = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT
              COUNT(*)::bigint AS total_completed,
              COUNT(*) FILTER (WHERE "completedAt" <= "dueAt")::bigint AS on_time_completed
            FROM "ProductionJob"
            WHERE "completedAt" IS NOT NULL
              AND "dueAt" IS NOT NULL
              AND "createdAt" >= ${from}
              AND "createdAt" <= ${to}
          `
        )) as OnTimeRow[];
        return rows;
      })(),

      // (b) Average production time in hours
      (async () => {
        const rows = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT
              AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 3600) AS avg_hours
            FROM "ProductionJob"
            WHERE "completedAt" IS NOT NULL
              AND "createdAt" >= ${from}
              AND "createdAt" <= ${to}
          `
        )) as AvgTimeRow[];
        return rows;
      })(),

      // (c) Factory utilization - using Prisma typed query
      (async () => {
        const factories = await prisma.factory.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                jobs: {
                  where: {
                    status: {
                      notIn: ["finished", "shipped"],
                    },
                  },
                },
              },
            },
          },
        });
        return factories.map((f) => ({
          factoryId: f.id,
          name: f.name,
          activeJobs: f._count.jobs,
        }));
      })(),

      // (d) Status distribution
      (async () => {
        const rows = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT
              status::text AS status,
              COUNT(*)::bigint AS count
            FROM "ProductionJob"
            WHERE "createdAt" >= ${from}
              AND "createdAt" <= ${to}
            GROUP BY status
            ORDER BY count DESC
          `
        )) as StatusDistRow[];
        return rows;
      })(),

      // (e) Delayed orders
      (async () => {
        const jobs = await prisma.productionJob.findMany({
          where: {
            dueAt: { lt: new Date() },
            status: { notIn: ["finished", "shipped"] },
          },
          include: {
            orderItem: {
              include: {
                order: {
                  select: {
                    id: true,
                    customerEmail: true,
                  },
                },
              },
            },
            factory: {
              select: { name: true },
            },
          },
        });
        return jobs.map((job) => {
          const daysDelayed = job.dueAt
            ? Math.floor(
                (Date.now() - job.dueAt.getTime()) / (1000 * 60 * 60 * 24)
              )
            : 0;
          return {
            jobId: job.id,
            orderId: job.orderItem.order.id,
            productName: job.orderItem.productName,
            customerEmail: job.orderItem.order.customerEmail,
            daysDelayed,
            status: job.status,
            factoryName: job.factory?.name ?? null,
          };
        });
      })(),

      // (f) Average turnaround trend
      (async () => {
        const rows = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT
              DATE_TRUNC('day', "completedAt") AS date,
              AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 3600) AS avg_hours
            FROM "ProductionJob"
            WHERE "completedAt" IS NOT NULL
              AND "completedAt" >= ${from}
              AND "completedAt" <= ${to}
            GROUP BY DATE_TRUNC('day', "completedAt")
            ORDER BY date ASC
          `
        )) as TurnaroundRow[];
        return rows;
      })(),

      // (g) Factory performance
      (async () => {
        const rows = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT
              f.id AS factory_id,
              f.name,
              COUNT(j.id)::bigint AS completed_jobs,
              AVG(EXTRACT(EPOCH FROM (j."completedAt" - j."createdAt")) / 3600) AS avg_time,
              CASE
                WHEN COUNT(*) FILTER (WHERE j."dueAt" IS NOT NULL) = 0 THEN NULL
                ELSE (COUNT(*) FILTER (WHERE j."completedAt" <= j."dueAt")::float
                  / COUNT(*) FILTER (WHERE j."dueAt" IS NOT NULL)::float) * 100
              END AS on_time_rate
            FROM "Factory" f
            JOIN "ProductionJob" j ON j."factoryId" = f.id
            WHERE j."completedAt" IS NOT NULL
              AND j."createdAt" >= ${from}
              AND j."createdAt" <= ${to}
            GROUP BY f.id, f.name
            ORDER BY completed_jobs DESC
          `
        )) as FactoryPerfRow[];
        return rows;
      })(),
    ]);

    // Process on-time rate
    const onTimeData = onTimeResult[0] || {
      total_completed: BigInt(0),
      on_time_completed: BigInt(0),
    };
    const totalCompleted = Number(onTimeData.total_completed);
    const onTimeCompleted = Number(onTimeData.on_time_completed);
    const onTimeRate =
      totalCompleted > 0
        ? Math.round((onTimeCompleted / totalCompleted) * 1000) / 10
        : 0;

    // Process avg production time
    const avgProductionTime =
      avgTimeResult[0]?.avg_hours != null
        ? Math.round(Number(avgTimeResult[0].avg_hours) * 10) / 10
        : 0;

    // Process status distribution with percentages
    const totalJobs = statusDistResult.reduce(
      (sum, row) => sum + Number(row.count),
      0
    );
    const statusDistribution = statusDistResult.map((row) => {
      const count = Number(row.count);
      return {
        status: row.status,
        count,
        percentage:
          totalJobs > 0 ? Math.round((count / totalJobs) * 1000) / 10 : 0,
      };
    });

    // Process turnaround trend
    const avgTurnaroundTrend = turnaroundResult.map((row) => ({
      date: row.date.toISOString().split("T")[0],
      avgHours:
        row.avg_hours != null
          ? Math.round(Number(row.avg_hours) * 10) / 10
          : 0,
    }));

    // Process factory performance
    const factoryPerformance = factoryPerfResult.map((row) => ({
      factoryId: row.factory_id,
      name: row.name,
      completedJobs: Number(row.completed_jobs),
      avgTime:
        row.avg_time != null
          ? Math.round(Number(row.avg_time) * 10) / 10
          : 0,
      onTimeRate:
        row.on_time_rate != null
          ? Math.round(Number(row.on_time_rate) * 10) / 10
          : 0,
    }));

    return NextResponse.json({
      metrics: {
        onTimeRate,
        avgProductionTime,
        factoryUtilization,
      },
      statusDistribution,
      delayedOrders,
      avgTurnaroundTrend,
      factoryPerformance,
    });
  } catch (error) {
    console.error("[Production Report] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate production report" },
      { status: 500 }
    );
  }
}
