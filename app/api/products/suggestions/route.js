import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductImage } from "@/lib/product-image";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slugs = (searchParams.get("slugs") || "").split(",").filter(Boolean);
  const categories = (searchParams.get("categories") || "").split(",").filter(Boolean);
  const exclude = (searchParams.get("exclude") || "").split(",").filter(Boolean);
  const limit = Math.min(Number(searchParams.get("limit")) || 3, 6);
  const featured = searchParams.get("featured") === "true";

  // Featured mode: return featured/popular products (for success page, homepage, etc.)
  if (featured) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        ...(exclude.length > 0 ? { slug: { notIn: exclude } } : {}),
      },
      orderBy: { sortOrder: "asc" },
      take: limit,
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    });

    const result = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      basePrice: p.basePrice,
      pricingUnit: p.pricingUnit,
      image: getProductImage(p, p.category) || null,
    }));

    return NextResponse.json(result);
  }

  if (slugs.length === 0 && categories.length === 0) {
    return NextResponse.json([]);
  }

  const where = {
    isActive: true,
    ...(exclude.length > 0 ? { slug: { notIn: exclude } } : {}),
  };

  if (slugs.length > 0) {
    where.slug = { in: slugs, ...(exclude.length > 0 ? { notIn: exclude } : {}) };
  } else {
    where.category = { in: categories };
  }

  // For slugs-based lookup, if both in and notIn are set, merge them
  if (slugs.length > 0 && exclude.length > 0) {
    const filtered = slugs.filter((s) => !exclude.includes(s));
    if (filtered.length === 0) return NextResponse.json([]);
    where.slug = { in: filtered };
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    take: limit,
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
  });

  const result = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    basePrice: p.basePrice,
    pricingUnit: p.pricingUnit,
    image: getProductImage(p, p.category) || null,
  }));

  return NextResponse.json(result);
}
