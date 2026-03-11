import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/production/schedule
 *
 * Returns production jobs grouped by due date for a date range.
 * Shows overdue, today, upcoming, and unscheduled jobs.
 *
 * Query params:
 *   from?: ISO date (default: today)
 *   to?:   ISO date (default: from + 14 days)
 *   factoryId?: filter by factory
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const factoryId = searchParams.get("factoryId") || undefined;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : todayStart;
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : new Date(from.getTime() + 14 * 86400000);

    // Active jobs (not finished/shipped) — these are the ones we schedule
    const where: Record<string, unknown> = {
      status: { notIn: ["finished", "shipped"] },
    };
    if (factoryId) where.factoryId = factoryId;

    const jobs = await prisma.productionJob.findMany({
      where,
      select: {
        id: true,
        status: true,
        priority: true,
        dueAt: true,
        productName: true,
        family: true,
        quantity: true,
        assignedTo: true,
        factoryId: true,
        artworkUrl: true,
        isRush: true,
        isTwoSided: true,
        material: true,
        materialLabel: true,
        widthIn: true,
        heightIn: true,
        createdAt: true,
        orderItem: {
          select: {
            order: {
              select: { id: true, customerName: true, customerEmail: true },
            },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "asc" }],
    });

    // Group by date bucket
    const overdue: typeof jobs = [];
    const today: typeof jobs = [];
    const scheduled: Record<string, typeof jobs> = {};
    const unscheduled: typeof jobs = [];

    const todayEnd = new Date(todayStart.getTime() + 86400000);

    for (const job of jobs) {
      if (!job.dueAt) {
        unscheduled.push(job);
      } else if (job.dueAt < todayStart) {
        overdue.push(job);
      } else if (job.dueAt >= todayStart && job.dueAt < todayEnd) {
        today.push(job);
      } else if (job.dueAt >= from && job.dueAt <= to) {
        const dateKey = job.dueAt.toISOString().split("T")[0];
        if (!scheduled[dateKey]) scheduled[dateKey] = [];
        scheduled[dateKey].push(job);
      }
    }

    // Summary stats
    const totalActive = jobs.length;
    const rushCount = jobs.filter((j) => j.isRush || j.priority === "urgent").length;
    const missingArtwork = jobs.filter((j) => !j.artworkUrl).length;

    // Daily load: count per date for the range
    const dailyLoad: { date: string; count: number; rush: number }[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const dateStr = cursor.toISOString().split("T")[0];
      const dayJobs = scheduled[dateStr] || [];
      dailyLoad.push({
        date: dateStr,
        count: dayJobs.length + (dateStr === todayStart.toISOString().split("T")[0] ? today.length : 0),
        rush: dayJobs.filter((j) => j.isRush || j.priority === "urgent").length,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const formatJob = (j: (typeof jobs)[0]) => ({
      id: j.id,
      status: j.status,
      priority: j.priority,
      dueAt: j.dueAt,
      productName: j.productName,
      family: j.family,
      quantity: j.quantity,
      assignedTo: j.assignedTo,
      factoryId: j.factoryId,
      artworkUrl: j.artworkUrl,
      isRush: j.isRush,
      material: j.materialLabel || j.material,
      size: j.widthIn && j.heightIn ? `${j.widthIn}" x ${j.heightIn}"` : null,
      orderId: j.orderItem?.order?.id,
      customerName: j.orderItem?.order?.customerName,
    });

    return NextResponse.json({
      summary: { totalActive, rushCount, missingArtwork, overdueCount: overdue.length, unscheduledCount: unscheduled.length },
      overdue: overdue.map(formatJob),
      today: today.map(formatJob),
      scheduled: Object.fromEntries(
        Object.entries(scheduled).map(([date, dayJobs]) => [date, dayJobs.map(formatJob)])
      ),
      unscheduled: unscheduled.map(formatJob),
      dailyLoad,
    });
  } catch (error) {
    console.error("[Production Schedule] Error:", error);
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}
