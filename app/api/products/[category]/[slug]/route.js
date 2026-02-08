import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { category, slug } = await params;

  const product = await prisma.product.findFirst({
    where: {
      slug: decodeURIComponent(slug),
      category: decodeURIComponent(category),
      isActive: true,
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
