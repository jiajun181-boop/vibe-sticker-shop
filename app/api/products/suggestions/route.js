import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categories = (searchParams.get("categories") || "").split(",").filter(Boolean);
  const exclude = (searchParams.get("exclude") || "").split(",").filter(Boolean);
  const limit = Math.min(Number(searchParams.get("limit")) || 3, 6);

  if (categories.length === 0) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { in: categories },
      ...(exclude.length > 0 ? { slug: { notIn: exclude } } : {}),
    },
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
    image: p.images[0]?.url || null,
  }));

  return NextResponse.json(result);
}
