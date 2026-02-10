import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductClient from "./ProductClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { category, product: slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const decodedCategory = decodeURIComponent(category);

  const product = await prisma.product.findFirst({
    where: {
      slug: decodedSlug,
      category: decodedCategory,
      isActive: true,
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    const fallback = await prisma.product.findUnique({
      where: { slug: decodedSlug },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (fallback?.isActive) {
      const from = encodeURIComponent(decodedCategory);
      redirect(`/shop/${fallback.category}/${fallback.slug}?moved=1&from=${from}`);
    }
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
