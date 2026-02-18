import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "media", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "40")));
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { alt: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [images, total] = await Promise.all([
      prisma.productImage.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productImage.count({ where }),
    ]);

    return NextResponse.json({
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[Media GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "media", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { url, alt, productId } = body;

    if (!url) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Auto-increment sortOrder
    const lastImage = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { sortOrder: "desc" },
    });
    const sortOrder = (lastImage?.sortOrder ?? -1) + 1;

    const image = await prisma.productImage.create({
      data: {
        productId,
        url,
        alt: alt || null,
        sortOrder,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    await logActivity({
      action: "create",
      entity: "ProductImage",
      entityId: image.id,
      details: { url, alt, productId, sortOrder },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (err) {
    console.error("[Media POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create image" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "media", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    // Check if this is the last image for its product
    const image = await prisma.productImage.findUnique({
      where: { id },
      select: { productId: true },
    });
    if (image) {
      const siblingCount = await prisma.productImage.count({
        where: { productId: image.productId },
      });
      if (siblingCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last image of a product. Upload a replacement first." },
          { status: 409 }
        );
      }
    }

    await prisma.productImage.delete({
      where: { id },
    });

    await logActivity({
      action: "delete",
      entity: "ProductImage",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Media DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
