import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission(request, "products", "view");
    if (!auth.authenticated) return auth.response;

    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        images: { select: { id: true, url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { images: true } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Also check Asset system (UploadThing uploads via AssetLink)
    const productIds = products.map((p) => p.id);
    const assetLinks = productIds.length > 0
      ? await prisma.assetLink.findMany({
          where: {
            entityType: "product",
            entityId: { in: productIds },
            asset: { status: "published" },
          },
          select: { entityId: true, asset: { select: { originalUrl: true } } },
          orderBy: { sortOrder: "asc" },
        })
      : [];

    const assetUrlByProduct: Record<string, string> = {};
    for (const link of assetLinks) {
      if (!assetUrlByProduct[link.entityId] && link.asset?.originalUrl) {
        assetUrlByProduct[link.entityId] = link.asset.originalUrl;
      }
    }

    const mapped = products.map((p) => {
      // Count real images: non-local ProductImage OR Asset system
      const hasRealLegacy = p.images.some((img) => !img.url.startsWith("/products/"));
      const hasAsset = !!assetUrlByProduct[p.id];
      const hasImage = hasRealLegacy || hasAsset;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category || "other",
        imageCount: hasImage ? Math.max(p._count.images, 1) : 0,
        thumbnailUrl: assetUrlByProduct[p.id] || p.images[0]?.url || null,
      };
    });

    const total = mapped.length;
    const withImages = mapped.filter((p) => p.imageCount > 0).length;

    return NextResponse.json({
      products: mapped,
      stats: { total, withImages, missingImages: total - withImages },
    });

  } catch (err) {
    console.error("[admin/image-dashboard] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
