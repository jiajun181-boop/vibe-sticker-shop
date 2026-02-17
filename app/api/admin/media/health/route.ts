import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "media", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const [
      totalAssets,
      orphanAssets,
      placeholderAssets,
      lowResAssets,
      totalActiveProducts,
      activeProductsWithoutImage,
      duplicateUrlGroups,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { links: { none: {} } } }),
      prisma.asset.count({
        where: {
          OR: [{ originalUrl: { startsWith: "/api/placeholder/" } }, { originalUrl: { equals: "" } }],
        },
      }),
      prisma.asset.count({
        where: {
          OR: [{ widthPx: { lt: 800 } }, { heightPx: { lt: 800 } }],
        },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true, images: { none: {} } } }),
      prisma.productImage.groupBy({
        by: ["url"],
        _count: { _all: true },
        where: { url: { not: "" } },
        having: {
          url: { _count: { gt: 1 } },
        },
      }),
    ]);

    const orphanExamples = await prisma.asset.findMany({
      where: { links: { none: {} } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, originalName: true, originalUrl: true, createdAt: true },
    });

    const missingImageProducts = await prisma.product.findMany({
      where: { isActive: true, images: { none: {} } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, slug: true, category: true },
    });

    return NextResponse.json({
      summary: {
        totalAssets,
        orphanAssets,
        placeholderAssets,
        lowResAssets,
        totalActiveProducts,
        activeProductsWithoutImage,
        duplicateImageUrlGroups: duplicateUrlGroups.length,
      },
      orphanExamples,
      missingImageProducts,
    });
  } catch (err) {
    console.error("[Media health] GET failed:", err);
    return NextResponse.json({ error: "Failed to generate media health report" }, { status: 500 });
  }
}

