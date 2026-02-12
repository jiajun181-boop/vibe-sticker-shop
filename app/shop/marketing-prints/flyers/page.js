import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import FlyersClient from "./FlyersClient";
import { ProductSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

function toClientSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === "bigint") return v.toString();
      return v;
    })
  );
}

export async function generateMetadata() {
  const p = await prisma.product.findFirst({
    where: { slug: "flyers", category: "marketing-prints", isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  if (!p) return {};
  const title = `${p.name} - Vibe Sticker Shop`;
  const description =
    p.description ||
    "Custom flyer printing in Toronto & the GTA. Half letter, letter, and tabloid sizes with fast turnaround.";
  const image = p.images[0]?.url || `${SITE_URL}/og-image.png`;
  const url = `${SITE_URL}/shop/marketing-prints/flyers`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: p.name }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function FlyersPage() {
  const product = await prisma.product.findFirst({
    where: { slug: "flyers", category: "marketing-prints", isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      pricingPreset: true,
    },
  });

  if (!product) notFound();

  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      category: "marketing-prints",
      id: { not: product.id },
      AND: [
        { slug: { not: { startsWith: "business-cards-" } } },
        { slug: { not: { startsWith: "stamps-" } } },
      ],
    },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    take: 4,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const safeProduct = toClientSafe(product);
  const safeRelated = toClientSafe(relatedProducts);

  return (
    <>
      <ProductSchema product={safeProduct} />
      <BreadcrumbSchema category={safeProduct.category} productName={safeProduct.name} />
      <Suspense>
        <FlyersClient product={safeProduct} relatedProducts={safeRelated} />
      </Suspense>
    </>
  );
}
