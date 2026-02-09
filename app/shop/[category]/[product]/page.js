import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductClient from "./ProductClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { category, product: slug } = await params;

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
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      category: product.category,
      id: { not: product.id },
    },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    take: 4,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return <ProductClient product={product} relatedProducts={relatedProducts} />;
}
