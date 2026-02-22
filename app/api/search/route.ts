import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductImage } from "@/lib/product-image";

/**
 * GET /api/search?q=sticker&limit=8
 *
 * Lightweight product search for instant suggestions.
 * Searches name, slug, description, and tags using case-insensitive LIKE.
 * Returns minimal product data for quick rendering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "8"), 20);

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const pattern = `%${q}%`;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        basePrice: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true, alt: true },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    const results = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      price: p.basePrice,
      image: getProductImage(p, p.category) || null,
      imageAlt: p.images[0]?.alt || p.name,
    }));

    return NextResponse.json({ results, query: q });
  } catch (err) {
    console.error("[Search] Error:", err);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
