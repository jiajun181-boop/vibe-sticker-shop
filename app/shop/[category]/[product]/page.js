import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductClient from "./ProductClient";
import { ProductSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata({ params }) {
  const { category, product: slug } = await params;
  const p = await prisma.product.findFirst({
    where: { slug: decodeURIComponent(slug), isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  if (!p) return {};
  const title = `${p.name} - Vibe Sticker Shop`;
  const description = p.description || `Order custom ${p.name} online. Fast turnaround, professional quality.`;
  const image = p.images[0]?.url || `${SITE_URL}/og-image.png`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shop/${category}/${slug}`,
      images: [{ url: image, width: 1200, height: 630, alt: p.name }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

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
      pricingPreset: true,
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

  // Ensure only plain JSON reaches client components (strip Prisma metadata/Date objects)
  const safeProduct = JSON.parse(JSON.stringify(product));
  const safeRelated = JSON.parse(JSON.stringify(relatedProducts));

  return (
    <>
      <ProductSchema product={safeProduct} />
      <BreadcrumbSchema category={safeProduct.category} productName={safeProduct.name} />
      <Suspense>
        <ProductClient product={safeProduct} relatedProducts={safeRelated} />
      </Suspense>
    </>
  );
}
