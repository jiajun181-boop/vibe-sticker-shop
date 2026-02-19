import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

/**
 * POST /api/admin/assets/[id]/links — Link an asset to an entity.
 * Body: { entityType, entityId, purpose?, sortOrder?, altOverride? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "media", "edit");
  if (!auth.authenticated) return auth.response;

  const { id: assetId } = await params;

  try {
    const body = await request.json();
    const { entityType, entityId, purpose, sortOrder, altOverride } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    // Verify asset exists
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Check for existing duplicate link
    const existing = await prisma.assetLink.findFirst({
      where: { assetId, entityType, entityId, purpose: purpose || "gallery" },
      include: { asset: true },
    });
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    // Auto-increment sortOrder if not provided
    let finalSortOrder = sortOrder ?? 0;
    if (sortOrder === undefined || sortOrder === null) {
      const lastLink = await prisma.assetLink.findFirst({
        where: { entityType, entityId },
        orderBy: { sortOrder: "desc" },
      });
      finalSortOrder = (lastLink?.sortOrder ?? -1) + 1;
    }

    const link = await prisma.assetLink.create({
      data: {
        assetId,
        entityType,
        entityId,
        purpose: purpose || "gallery",
        sortOrder: finalSortOrder,
        altOverride: altOverride || null,
      },
      include: {
        asset: true,
      },
    });

    await logActivity({
      action: "link",
      entity: "AssetLink",
      entityId: link.id,
      details: { assetId, entityType, entityId, purpose: purpose || "gallery" },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    console.error("[AssetLink POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create asset link" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/assets/[id]/links?linkId=xxx — Remove a link.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "media", "edit");
  if (!auth.authenticated) return auth.response;

  await params; // consume params

  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json(
        { error: "linkId query parameter is required" },
        { status: 400 }
      );
    }

    const link = await prisma.assetLink.delete({
      where: { id: linkId },
    });

    await logActivity({
      action: "unlink",
      entity: "AssetLink",
      entityId: linkId,
      details: {
        assetId: link.assetId,
        entityType: link.entityType,
        entityId: link.entityId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AssetLink DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete asset link" },
      { status: 500 }
    );
  }
}
