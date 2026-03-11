import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { stepAndRepeat, findBestSheet, STANDARD_SHEETS } from "@/lib/contour/registration-marks";
import { getProductionFileRequirements } from "@/lib/contour/assemble-production-file";

/**
 * GET /api/admin/production/[id]/layout
 *
 * Calculate step-and-repeat layout for a production job.
 * Returns nesting positions, sheet recommendation, utilization.
 *
 * Query params:
 *   sheetId — override sheet (e.g. "13x19", "12x18")
 *   quantity — override quantity (defaults to job quantity)
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
        productName: true,
        family: true,
        quantity: true,
        widthIn: true,
        heightIn: true,
        material: true,
        artworkUrl: true,
        isTwoSided: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Production job not found" }, { status: 404 });
    }

    if (!job.widthIn || !job.heightIn) {
      return NextResponse.json(
        { error: "Job missing dimensions — cannot calculate layout" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sheetIdParam = searchParams.get("sheetId");
    const quantityParam = searchParams.get("quantity");
    const quantity = quantityParam ? parseInt(quantityParam, 10) : (job.quantity || 1);

    // Get production requirements
    const requirements = getProductionFileRequirements(job);

    // Find sheet
    let selectedSheet = null;
    if (sheetIdParam) {
      selectedSheet = STANDARD_SHEETS.find((s: { id: string }) => s.id === sheetIdParam) || null;
    }

    // Calculate layout for all standard sheets
    const sheetLayouts = STANDARD_SHEETS.map((sheet: { id: string; label: string; widthIn: number; heightIn: number }) => {
      const layout = stepAndRepeat(
        { width: job.widthIn!, height: job.heightIn! },
        { width: sheet.widthIn, height: sheet.heightIn },
        { gapMm: 3, dpi: 1, maxCopies: quantity },
      );
      const sheetsNeeded = layout.count > 0 ? Math.ceil(quantity / layout.count) : 0;
      return {
        sheetId: sheet.id,
        sheetLabel: sheet.label,
        sheetWidthIn: sheet.widthIn,
        sheetHeightIn: sheet.heightIn,
        copiesPerSheet: layout.count,
        sheetsNeeded,
        utilization: layout.utilization,
        wastePercent: layout.wastePercent,
        cols: layout.cols,
        rows: layout.rows,
        rotated: layout.rotated,
      };
    }).filter((l: { copiesPerSheet: number }) => l.copiesPerSheet > 0);

    // Best sheet recommendation
    const best = findBestSheet({ widthIn: job.widthIn, heightIn: job.heightIn }, quantity, { gapMm: 3 });

    // Detailed layout for selected or best sheet
    const targetSheet = selectedSheet || best?.sheet || STANDARD_SHEETS[1];
    const detailedLayout = stepAndRepeat(
      { width: job.widthIn, height: job.heightIn },
      { width: targetSheet.widthIn, height: targetSheet.heightIn },
      { gapMm: 3, dpi: 1, maxCopies: quantity },
    );

    return NextResponse.json({
      jobId: job.id,
      productName: job.productName,
      family: job.family,
      itemWidthIn: job.widthIn,
      itemHeightIn: job.heightIn,
      quantity,
      requirements,
      recommendation: best ? {
        sheetId: best.sheet.id,
        sheetLabel: best.sheet.label,
        sheetsNeeded: best.sheetsNeeded,
        totalWastePercent: best.totalWastePercent,
      } : null,
      selectedLayout: {
        sheet: targetSheet,
        ...detailedLayout,
        sheetsNeeded: detailedLayout.count > 0 ? Math.ceil(quantity / detailedLayout.count) : 0,
      },
      allSheets: sheetLayouts,
    });
  } catch (error) {
    console.error("[ProductionJob Layout] Error:", error);
    return NextResponse.json(
      { error: "Failed to calculate layout" },
      { status: 500 }
    );
  }
}
