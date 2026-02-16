import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * GET /api/admin/qc?page=1&limit=20&resolution=pending&severity=&orderId=
 * List QC reports with filters
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const resolution = searchParams.get("resolution");
    const severity = searchParams.get("severity");
    const orderId = searchParams.get("orderId");

    const where: Record<string, unknown> = {};

    if (resolution) where.resolution = resolution;
    if (severity) where.severity = severity;
    if (orderId) where.orderId = orderId;

    const [reports, total] = await Promise.all([
      prisma.qCReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qCReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[QC] List error:", err);
    return NextResponse.json({ error: "Failed to load QC reports" }, { status: 500 });
  }
}

/**
 * POST /api/admin/qc
 * Create a new QC defect report
 *
 * Body: {
 *   orderId: string,
 *   orderItemId?: string,
 *   jobId?: string,
 *   defectType: string,   // color_mismatch, cut_error, print_defect, material_defect, damage, other
 *   severity: "minor" | "major" | "critical",
 *   description: string,
 *   photoUrls?: string[],
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { orderId, orderItemId, jobId, defectType, severity, description, photoUrls } = body;

    if (!orderId || !defectType || !severity || !description) {
      return NextResponse.json(
        { error: "orderId, defectType, severity, and description are required" },
        { status: 400 }
      );
    }

    const validSeverities = ["minor", "major", "critical"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${validSeverities.join(", ")}` },
        { status: 400 }
      );
    }

    const validTypes = ["color_mismatch", "cut_error", "print_defect", "material_defect", "damage", "other"];
    if (!validTypes.includes(defectType)) {
      return NextResponse.json(
        { error: `defectType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const report = await prisma.$transaction(async (tx) => {
      const newReport = await tx.qCReport.create({
        data: {
          orderId,
          orderItemId: orderItemId || null,
          jobId: jobId || null,
          defectType,
          severity,
          description,
          photoUrls: photoUrls || [],
          reportedBy: auth.user?.name || auth.user?.email || "admin",
        },
      });

      // Add timeline event
      await tx.orderTimeline.create({
        data: {
          orderId,
          action: "qc_defect_reported",
          details: `${severity} defect: ${defectType} — ${description.slice(0, 100)}`,
          actor: auth.user?.name || "QA",
        },
      });

      // If critical, auto-hold the order
      if (severity === "critical") {
        await tx.order.update({
          where: { id: orderId },
          data: { productionStatus: "on_hold" },
        });
        await tx.orderTimeline.create({
          data: {
            orderId,
            action: "production_hold",
            details: "Auto-held due to critical QC defect",
            actor: "system",
          },
        });
      }

      return newReport;
    });

    await logActivity({
      action: "qc_report_created",
      entity: "qc_report",
      entityId: report.id,
      actor: auth.user?.email || "admin",
      details: { orderId, defectType, severity },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("[QC] Create error:", err);
    return NextResponse.json({ error: "Failed to create QC report" }, { status: 500 });
  }
}
