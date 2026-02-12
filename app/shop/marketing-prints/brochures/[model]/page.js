import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductLandingClient from "../../[product]/ProductLandingClient";
import { ProductSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";
const ALLOWED_MODELS = new Set(["bi-fold", "tri-fold", "z-fold"]);

export async function generateMetadata({ params }) {
  const { model } = await params;
  if (!ALLOWED_MODELS.has(model)) return {};

  const titleMap = {
    "bi-fold": "Bi-Fold Brochures",
    "tri-fold": "Tri-Fold Brochures",
    "z-fold": "Z-Fold Brochures",
  };
  const title = `${titleMap[model]} - Vibe Sticker Shop`;
  const url = `${SITE_URL}/shop/marketing-prints/brochures/${model}`;

  return {
    title,
    description: `Customize and order ${titleMap[model].toLowerCase()} with dedicated mobile-friendly flow.`,
    alternates: { canonical: url },
    openGraph: { title, url, type: "website" },
  };
}

export default async function BrochureModelPage({ params }) {
  const { model } = await params;
  if (!ALLOWED_MODELS.has(model)) notFound();

  const product = await prisma.product.findFirst({
    where: {
      slug: "brochures",
      category: "marketing-prints",
      isActive: true,
    },
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

  const safeProduct = JSON.parse(JSON.stringify(product));
  const safeRelated = JSON.parse(JSON.stringify(relatedProducts));

  return (
    <>
      <ProductSchema product={safeProduct} />
      <BreadcrumbSchema category={safeProduct.category} productName={safeProduct.name} />
      <ProductLandingClient
        product={safeProduct}
        relatedProducts={safeRelated}
        brochureModel={model}
      />
    </>
  );
}
