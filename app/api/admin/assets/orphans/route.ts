import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/assets/orphans — Find assets with zero links (orphan images).
 * These are uploaded but not used anywhere — candidates for cleanup.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "media", "view");
  if (!auth.authenticated) return auth.response!;

  try {
    const orphans = await prisma.asset.findMany({
      where: {
        status: "published",
        links: { none: {} },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totalOrphans = await prisma.asset.count({
      where: {
        status: "published",
        links: { none: {} },
      },
    });

    const totalSizeBytes = orphans.reduce((sum, a) => sum + a.sizeBytes, 0);

    return NextResponse.json({
      orphans,
      count: totalOrphans,
      totalSizeBytes,
      totalSizeMB: +(totalSizeBytes / 1024 / 1024).toFixed(2),
    });
  } catch (err) {
    console.error("[Orphans GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orphans" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/assets/orphans — Bulk archive all orphan assets.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "media", "admin");
  if (!auth.authenticated) return auth.response!;

  try {
    const result = await prisma.asset.updateMany({
      where: {
        status: "published",
        links: { none: {} },
      },
      data: {
        status: "archived",
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      archivedCount: result.count,
    });
  } catch (err) {
    console.error("[Orphans DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to archive orphans" },
      { status: 500 }
    );
  }
}
