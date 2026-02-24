import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: Request) {
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

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category || "other",
    imageCount: p._count.images,
    thumbnailUrl: p.images[0]?.url || null,
  }));

  const total = mapped.length;
  const withImages = mapped.filter((p) => p.imageCount > 0).length;

  return NextResponse.json({
    products: mapped,
    stats: { total, withImages, missingImages: total - withImages },
  });
}
