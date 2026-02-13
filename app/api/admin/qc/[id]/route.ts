import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * GET /api/admin/qc/[id]
 * Get a single QC report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const report = await prisma.qCReport.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "QC report not found" }, { status: 404 });
    }
    return NextResponse.json(report);
  } catch (err) {
    console.error("[QC] Get error:", err);
    return NextResponse.json({ error: "Failed to load QC report" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/qc/[id]
 * Resolve a QC report
 *
 * Body: {
 *   resolution: "accepted" | "reprint" | "refund" | "discounted",
 *   resolutionNote?: string,
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { resolution, resolutionNote } = body;

    const validResolutions = ["accepted", "reprint", "refund", "discounted"];
    if (!resolution || !validResolutions.includes(resolution)) {
      return NextResponse.json(
        { error: `resolution must be one of: ${validResolutions.join(", ")}` },
        { status: 400 }
      );
    }

    const report = await prisma.qCReport.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "QC report not found" }, { status: 404 });
    }

    const updated = await prisma.qCReport.update({
      where: { id },
      data: {
        resolution,
        resolutionNote: resolutionNote || null,
        resolvedBy: auth.user?.name || auth.user?.email || "admin",
        resolvedAt: new Date(),
      },
    });

    // Add timeline event
    await prisma.orderTimeline.create({
      data: {
        orderId: report.orderId,
        action: "qc_resolved",
        details: `QC defect resolved: ${resolution}${resolutionNote ? ` — ${resolutionNote.slice(0, 100)}` : ""}`,
        actor: auth.user?.name || "QA",
      },
    });

    // If reprint, create a new production job (if orderItemId exists)
    if (resolution === "reprint" && report.orderItemId) {
      const newJob = await prisma.productionJob.create({
        data: {
          orderItemId: report.orderItemId,
          status: "queued",
          priority: report.severity === "critical" ? "rush" : "normal",
          notes: `Reprint: ${report.defectType} — ${report.description.slice(0, 200)}`,
        },
      }).catch(() => null); // May fail if orderItem already has a job (unique constraint)

      if (newJob) {
        await prisma.qCReport.update({
          where: { id },
          data: { reprintJobId: newJob.id },
        });
      }
    }

    await logActivity({
      action: "qc_report_resolved",
      entity: "qc_report",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: { resolution, orderId: report.orderId },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[QC] Resolve error:", err);
    return NextResponse.json({ error: "Failed to resolve QC report" }, { status: 500 });
  }
}
