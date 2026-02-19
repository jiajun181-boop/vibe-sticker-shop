import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "products", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(images);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "products", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const body = await request.json();

  const { url, alt } = body;
  if (!url) {
    return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
  }

  const existing = await prisma.productImage.findFirst({
    where: { productId: id, url },
    orderBy: { sortOrder: "asc" },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  // Get next sort order
  const lastImage = await prisma.productImage.findFirst({
    where: { productId: id },
    orderBy: { sortOrder: "desc" },
  });
  const sortOrder = (lastImage?.sortOrder ?? -1) + 1;

  const image = await prisma.productImage.create({
    data: {
      productId: id,
      url,
      alt: alt || null,
      sortOrder,
    },
  });

  return NextResponse.json(image, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "products", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const body = await request.json();

  // Set image as primary cover: expects { primaryImageId: "..." }
  if (body.primaryImageId) {
    const targetId = String(body.primaryImageId);
    const currentImages = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
    const target = currentImages.find((img) => img.id === targetId);
    if (!target) {
      return NextResponse.json({ error: "Image not found on this product" }, { status: 404 });
    }

    const reordered = [
      targetId,
      ...currentImages.filter((img) => img.id !== targetId).map((img) => img.id),
    ];

    await prisma.$transaction(
      reordered.map((imgId, idx) =>
        prisma.productImage.update({
          where: { id: imgId },
          data: { sortOrder: idx },
        })
      )
    );

    await logActivity({
      action: "set_primary",
      entity: "ProductImage",
      entityId: targetId,
      details: { productId: id, primaryImageId: targetId },
    });

    const images = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(images);
  }

  // Bulk reorder: expects { order: [{ id: "...", sortOrder: 0 }, ...] }
  if (body.order && Array.isArray(body.order)) {
    await prisma.$transaction(
      body.order.map((item: { id: string; sortOrder: number }) =>
        prisma.productImage.update({
          where: { id: item.id, productId: id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    const images = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(images);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "products", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json({ error: "imageId is required" }, { status: 400 });
  }

  // Ensure this image belongs to the current product.
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId: id },
    select: { id: true, url: true },
  });
  if (!image) {
    return NextResponse.json({ error: "Image not found for this product" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.productImage.delete({
      where: { id: image.id },
    });

    // Keep sortOrder dense after deletion so "first image = cover" remains stable.
    const remaining = await tx.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    if (remaining.length > 0) {
      await Promise.all(
        remaining.map((img, idx) =>
          tx.productImage.update({
            where: { id: img.id },
            data: { sortOrder: idx },
          })
        )
      );
    }
  });

  // Also remove matching asset-system links for this product.
  // The storefront prefers AssetLink images when present, so deleting only
  // legacy ProductImage can appear as "not deleted" on the frontend.
  if (image.url) {
    const links = await prisma.assetLink.findMany({
      where: {
        entityType: "product",
        entityId: id,
        asset: { originalUrl: image.url },
      },
      select: { id: true },
    });
    if (links.length > 0) {
      await prisma.assetLink.deleteMany({
        where: { id: { in: links.map((l) => l.id) } },
      });
    }
  }

  // Permanently delete from UploadThing CDN
  if (image?.url) {
    try {
      const keyMatch = image.url.match(/\/f\/([a-zA-Z0-9_-]+)/);
      if (keyMatch) {
        const { UTApi } = await import("uploadthing/server");
        const utapi = new UTApi();
        await utapi.deleteFiles([keyMatch[1]]);
      }
    } catch (utErr) {
      console.warn("[Product Image DELETE] UploadThing cleanup failed:", utErr);
    }
  }

  return NextResponse.json({ success: true });
}
