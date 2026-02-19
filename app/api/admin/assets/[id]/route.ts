import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/assets/[id] — Single asset with all links.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "media", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        links: {
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { links: true } },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...asset,
      linkCount: asset._count.links,
      _count: undefined,
    });
  } catch (err) {
    console.error("[Asset GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/assets/[id] — Update asset metadata.
 * Updatable: focalX, focalY, altText, altTextZh, caption, tags, status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "media", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();

    const allowedFields = [
      "focalX",
      "focalY",
      "altText",
      "altTextZh",
      "caption",
      "tags",
      "status",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Handle status transitions
    if (data.status === "published" && !body.publishedAt) {
      data.publishedAt = new Date();
    }
    if (data.status === "archived") {
      data.archivedAt = new Date();
    }

    const asset = await prisma.asset.update({
      where: { id },
      data,
      include: {
        _count: { select: { links: true } },
      },
    });

    await logActivity({
      action: "update",
      entity: "Asset",
      entityId: id,
      details: { updatedFields: Object.keys(data) },
    });

    return NextResponse.json({
      ...asset,
      linkCount: asset._count.links,
      _count: undefined,
    });
  } catch (err) {
    console.error("[Asset PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/assets/[id] — Soft-delete (archive) or permanent delete.
 * Pass ?permanent=true to hard-delete from DB and UploadThing.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "media", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const permanent = request.nextUrl.searchParams.get("permanent") === "true";

  try {
    if (permanent) {
      const asset = await prisma.asset.findUnique({ where: { id } });
      if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      // Delete from UploadThing CDN
      try {
        const keyMatch = asset.originalUrl.match(/\/f\/([a-zA-Z0-9_-]+)/);
        if (keyMatch) {
          const { UTApi } = await import("uploadthing/server");
          const utapi = new UTApi();
          await utapi.deleteFiles([keyMatch[1]]);
        }
      } catch (utErr) {
        console.warn("[Asset DELETE] UploadThing cleanup failed:", utErr);
      }

      // Delete from DB (cascade removes AssetLinks)
      await prisma.asset.delete({ where: { id } });

      await logActivity({
        action: "delete",
        entity: "Asset",
        entityId: id,
        details: { originalName: asset.originalName, permanent: true },
      });

      return NextResponse.json({ success: true, permanent: true });
    }

    // Soft-delete (archive)
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        status: "archived",
        archivedAt: new Date(),
      },
    });

    await logActivity({
      action: "archive",
      entity: "Asset",
      entityId: id,
      details: { originalName: asset.originalName },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Asset DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
