import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductImage } from "@/lib/product-image";

const TARGET_COUNT = 6;

interface RecommendedProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number | null;
  image: string | null;
  reason: "frequently_bought_together" | "same_category" | "popular";
}

function formatProduct(
  p: any,
  reason: RecommendedProduct["reason"]
): RecommendedProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.displayFromPrice ?? p.basePrice ?? null,
    image: getProductImage(p, p.category) || null,
    reason,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category: slug } = await params;

    // 1. Look up the current product
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      select: { id: true, category: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const results: RecommendedProduct[] = [];
    const seenIds = new Set<string>([product.id]);

    // ---------------------------------------------------------------
    // A) Frequently bought together
    //    Find other products that appear in orders alongside this one,
    //    ranked by co-occurrence count. Only consider paid orders.
    // ---------------------------------------------------------------
    if (results.length < TARGET_COUNT) {
      const coProducts: any[] = await prisma.$queryRaw`
        SELECT
          p."id",
          p."slug",
          p."name",
          p."category",
          p."basePrice",
          p."displayFromPrice",
          COUNT(DISTINCT oi2."orderId") AS "coCount"
        FROM "OrderItem" oi1
        JOIN "OrderItem" oi2 ON oi1."orderId" = oi2."orderId"
          AND oi2."productId" IS NOT NULL
          AND oi2."productId" != oi1."productId"
        JOIN "Product" p ON p."id" = oi2."productId"
        JOIN "Order" o ON o."id" = oi1."orderId"
        WHERE oi1."productId" = ${product.id}
          AND o."status" = 'paid'
          AND p."isActive" = true
        GROUP BY p."id", p."slug", p."name", p."category", p."basePrice", p."displayFromPrice"
        ORDER BY "coCount" DESC
        LIMIT ${TARGET_COUNT}
      `;

      // Fetch images for co-purchased products in one query
      if (coProducts.length > 0) {
        const coIds = coProducts.map((cp) => cp.id);
        const images = await prisma.productImage.findMany({
          where: { productId: { in: coIds } },
          orderBy: { sortOrder: "asc" },
        });
        const imageMap = new Map<string, any[]>();
        for (const img of images) {
          if (!imageMap.has(img.productId)) {
            imageMap.set(img.productId, []);
          }
          imageMap.get(img.productId)!.push(img);
        }

        for (const cp of coProducts) {
          if (seenIds.has(cp.id) || results.length >= TARGET_COUNT) continue;
          seenIds.add(cp.id);
          cp.images = imageMap.get(cp.id) || [];
          results.push(formatProduct(cp, "frequently_bought_together"));
        }
      }
    }

    // ---------------------------------------------------------------
    // B) Same category
    // ---------------------------------------------------------------
    if (results.length < TARGET_COUNT) {
      const needed = TARGET_COUNT - results.length;
      const sameCat = await prisma.product.findMany({
        where: {
          category: product.category,
          isActive: true,
          id: { notIn: Array.from(seenIds) },
        },
        orderBy: { sortOrder: "asc" },
        take: needed,
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      });

      for (const p of sameCat) {
        if (seenIds.has(p.id) || results.length >= TARGET_COUNT) continue;
        seenIds.add(p.id);
        results.push(formatProduct(p, "same_category"));
      }
    }

    // ---------------------------------------------------------------
    // C) Popular fallback — highest-selling active products
    // ---------------------------------------------------------------
    if (results.length < TARGET_COUNT) {
      const needed = TARGET_COUNT - results.length;
      const excludeIds = Array.from(seenIds);

      const popular: any[] = await prisma.$queryRaw`
        SELECT
          p."id",
          p."slug",
          p."name",
          p."category",
          p."basePrice",
          p."displayFromPrice",
          COUNT(oi."id") AS "salesCount"
        FROM "Product" p
        LEFT JOIN "OrderItem" oi ON oi."productId" = p."id"
        LEFT JOIN "Order" o ON o."id" = oi."orderId" AND o."status" = 'paid'
        WHERE p."isActive" = true
          AND p."id" != ALL(${excludeIds}::text[])
        GROUP BY p."id", p."slug", p."name", p."category", p."basePrice", p."displayFromPrice"
        ORDER BY "salesCount" DESC, p."sortOrder" ASC
        LIMIT ${needed}
      `;

      if (popular.length > 0) {
        const popIds = popular.map((pp) => pp.id);
        const images = await prisma.productImage.findMany({
          where: { productId: { in: popIds } },
          orderBy: { sortOrder: "asc" },
        });
        const imageMap = new Map<string, any[]>();
        for (const img of images) {
          if (!imageMap.has(img.productId)) {
            imageMap.set(img.productId, []);
          }
          imageMap.get(img.productId)!.push(img);
        }

        for (const pp of popular) {
          if (seenIds.has(pp.id) || results.length >= TARGET_COUNT) continue;
          seenIds.add(pp.id);
          pp.images = imageMap.get(pp.id) || [];
          results.push(formatProduct(pp, "popular"));
        }
      }
    }

    // Ensure at least 4 results if possible (trim to 6 max)
    const recommendations = results.slice(0, TARGET_COUNT);

    const response = NextResponse.json({
      productId: product.id,
      recommendations,
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=600"
    );

    return response;
  } catch (err) {
    console.error("[products/recommendations] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
