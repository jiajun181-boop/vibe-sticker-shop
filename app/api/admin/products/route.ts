import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "products", "view");
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};

  if (category && category !== "all") {
    where.category = category;
  }

  if (active === "true") where.isActive = true;
  else if (active === "false") where.isActive = false;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        _count: { select: { images: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const productIds = products.map((p) => p.id);
  const assetLinks = productIds.length
    ? await prisma.assetLink.findMany({
        where: {
          entityType: "product",
          entityId: { in: productIds },
        },
        select: {
          entityId: true,
          purpose: true,
        },
      })
    : [];

  const assetMetaByProductId = new Map<
    string,
    { assetLinkCount: number; galleryAssetLinkCount: number }
  >();
  for (const link of assetLinks) {
    const prev = assetMetaByProductId.get(link.entityId) || {
      assetLinkCount: 0,
      galleryAssetLinkCount: 0,
    };
    prev.assetLinkCount += 1;
    if (link.purpose === "gallery") prev.galleryAssetLinkCount += 1;
    assetMetaByProductId.set(link.entityId, prev);
  }

  const productsWithImageSource = products.map((p) => {
    const assetMeta = assetMetaByProductId.get(p.id) || {
      assetLinkCount: 0,
      galleryAssetLinkCount: 0,
    };
    const legacyImageCount = p._count?.images || 0;
    const resolvedSource =
      assetMeta.assetLinkCount > 0 ? "asset" : legacyImageCount > 0 ? "legacy" : "none";
    return {
      ...p,
      imageSourceMeta: {
        ...assetMeta,
        legacyImageCount,
        resolvedSource,
        hasMixedStorage: assetMeta.assetLinkCount > 0 && legacyImageCount > 0,
      },
    };
  });

  return NextResponse.json({
    products: productsWithImageSource,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
