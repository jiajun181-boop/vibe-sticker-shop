import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { assessItem, assessPackage, getExecutableAction } from "@/lib/admin/production-readiness";

/**
 * GET /api/admin/production/[id]/readiness
 *
 * Returns production readiness assessment for a specific job's order item.
 * Includes blockers, warnings, package completeness, and next action.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const job = await prisma.productionJob.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        orderItem: {
          select: {
            id: true,
            productName: true,
            productType: true,
            quantity: true,
            widthIn: true,
            heightIn: true,
            material: true,
            finishing: true,
            fileUrl: true,
            fileName: true,
            meta: true,
            specsJson: true,
            orderId: true,
            productionJob: { select: { id: true, status: true } },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Production job not found" }, { status: 404 });
    }

    const item = job.orderItem;
    if (!item) {
      return NextResponse.json({ error: "No order item linked to this job" }, { status: 404 });
    }

    // Run assessments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assessment: any = assessItem(item, item.orderId);
    const packageStatus = assessPackage(item);
    const execAction = getExecutableAction(assessment, item.orderId, item.id);

    return NextResponse.json({
      jobId: job.id,
      jobStatus: job.status,
      itemId: item.id,
      orderId: item.orderId,
      readiness: {
        level: assessment.level,
        family: assessment.family,
        reasons: assessment.reasons,
        nextAction: assessment.nextAction,
        toolLink: assessment.toolLink,
        isPrintAndCut: assessment.isPrintAndCut,
        contourReady: assessment.contourReady,
        registrationMarkReady: assessment.registrationMarkReady,
        manualReviewRequired: assessment.manualReviewRequired,
      },
      package: {
        status: packageStatus.status,
        files: packageStatus.files,
        missingCount: packageStatus.missingCount,
        totalCount: packageStatus.totalCount,
      },
      executableAction: execAction,
    });
  } catch (error) {
    console.error("[ProductionJob Readiness] Error:", error);
    return NextResponse.json(
      { error: "Failed to assess readiness" },
      { status: 500 }
    );
  }
}
