import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/production/batch-suggest
 *
 * Suggests batches of production jobs that can be printed together:
 * - Same material
 * - Same or similar dimensions
 * - All have artwork
 *
 * Returns grouped suggestions sorted by batch size (largest first).
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    // Fetch printable jobs (queued or assigned, have artwork)
    const jobs = await prisma.productionJob.findMany({
      where: {
        status: { in: ["queued", "assigned"] },
        artworkUrl: { not: null },
      },
      select: {
        id: true,
        productName: true,
        family: true,
        quantity: true,
        widthIn: true,
        heightIn: true,
        material: true,
        materialLabel: true,
        finishing: true,
        isRush: true,
        isTwoSided: true,
        priority: true,
        dueAt: true,
        orderItem: {
          select: {
            order: {
              select: { id: true, customerEmail: true },
            },
          },
        },
      },
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
    });

    if (jobs.length === 0) {
      return NextResponse.json({ batches: [], totalJobs: 0 });
    }

    // Group by material + dimensions bucket
    const buckets = new Map<string, typeof jobs>();

    for (const job of jobs) {
      // Create a bucket key: material | dimension-bucket | 2-sided
      const mat = (job.material || "unknown").toLowerCase().trim();
      // Round dimensions to nearest 0.5" for grouping
      const w = job.widthIn ? Math.round(job.widthIn * 2) / 2 : 0;
      const h = job.heightIn ? Math.round(job.heightIn * 2) / 2 : 0;
      // Normalize so smaller dimension comes first
      const dimKey = w && h ? `${Math.min(w, h)}x${Math.max(w, h)}` : "no-size";
      const sideKey = job.isTwoSided ? "2s" : "1s";
      const key = `${mat}|${dimKey}|${sideKey}`;

      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(job);
    }

    // Convert to sorted batches
    const batches = Array.from(buckets.entries())
      .filter(([, bJobs]) => bJobs.length >= 2) // Only suggest batches with 2+ jobs
      .map(([key, bJobs]) => {
        const [material, dimKey, sideKey] = key.split("|");
        const totalQuantity = bJobs.reduce((sum, j) => sum + (j.quantity || 0), 0);
        const hasRush = bJobs.some((j) => j.isRush || j.priority === "urgent");
        const earliestDue = bJobs
          .filter((j) => j.dueAt)
          .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())[0]?.dueAt || null;

        return {
          batchKey: key,
          material: material === "unknown" ? null : material,
          materialLabel: bJobs[0].materialLabel || material,
          dimensions: dimKey === "no-size" ? null : dimKey + '"',
          doubleSided: sideKey === "2s",
          jobCount: bJobs.length,
          totalQuantity,
          hasRush,
          earliestDue,
          families: [...new Set(bJobs.map((j) => j.family).filter(Boolean))],
          jobs: bJobs.map((j) => ({
            id: j.id,
            productName: j.productName,
            quantity: j.quantity,
            isRush: j.isRush,
            priority: j.priority,
            orderId: j.orderItem?.order?.id || null,
            customerEmail: j.orderItem?.order?.customerEmail || null,
          })),
        };
      })
      .sort((a, b) => {
        // Rush batches first, then by job count desc
        if (a.hasRush !== b.hasRush) return a.hasRush ? -1 : 1;
        return b.jobCount - a.jobCount;
      });

    return NextResponse.json({
      batches,
      totalJobs: jobs.length,
      batchableJobs: batches.reduce((sum, b) => sum + b.jobCount, 0),
      singleJobs: jobs.length - batches.reduce((sum, b) => sum + b.jobCount, 0),
    });
  } catch (error) {
    console.error("[Production Batch Suggest] Error:", error);
    return NextResponse.json(
      { error: "Failed to suggest batches" },
      { status: 500 }
    );
  }
}
