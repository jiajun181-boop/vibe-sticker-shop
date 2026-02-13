import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubProducts } from "@/lib/subProductConfig";
import { CATALOG_DEFAULTS } from "@/lib/catalogConfig";
import { getProductAssets } from "@/lib/assets";
import ProductClient from "./ProductClient";
import SubProductLandingClient from "./SubProductLandingClient";
import { ProductSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toClientSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === "bigint") return v.toString();
      return v;
    })
  );
}

export async function generateMetadata({ params }) {
  const { category, product: slug } = await params;
  const decodedSlug = safeDecode(slug);

  // Sub-product landing metadata
  const subCfg = getSubProducts(decodedSlug);
  if (subCfg) {
    const subLabel = decodedSlug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const title = `${subLabel} — Vibe Sticker Shop`;
    const description = `Custom ${subLabel.toLowerCase()} printing — ${subCfg.dbSlugs.length} options available. Professional quality, fast turnaround in Toronto & the GTA.`;
    const url = `${SITE_URL}/shop/${category}/${slug}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const p = await prisma.product.findFirst({
    where: { slug: decodedSlug, isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  if (!p) return {};
  const title = `${p.name} - Vibe Sticker Shop`;
  const description =
    p.description ||
    `Order custom ${p.name} online. Fast turnaround, professional quality.`;
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
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }) {
  const { category, product: slug } = await params;
  const decodedSlug = safeDecode(slug);
  const decodedCategory = safeDecode(category);

  // ── Sub-product landing: parent slug → show child products as card grid ──
  const subCfg = getSubProducts(decodedSlug);
  if (subCfg) {
    const subProducts = await prisma.product.findMany({
      where: {
        slug: { in: subCfg.dbSlugs },
        isActive: true,
      },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const categoryMeta = CATALOG_DEFAULTS.categoryMeta[decodedCategory];

    return (
      <SubProductLandingClient
        parentSlug={decodedSlug}
        category={decodedCategory}
        categoryTitle={categoryMeta?.title || decodedCategory}
        products={toClientSafe(subProducts)}
      />
    );
  }

  // ── Regular product page ──
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
    // Try finding in any category and redirect
    const fallback = await prisma.product.findUnique({
      where: { slug: decodedSlug },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (fallback?.isActive) {
      const from = encodeURIComponent(decodedCategory);
      redirect(
        `/shop/${fallback.category}/${fallback.slug}?moved=1&from=${from}`
      );
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

  // Fetch asset-system images (falls back to legacy ProductImage)
  const assetImages = await getProductAssets(product.id);

  const safeProduct = toClientSafe(product);
  // Override images with asset-enriched data (includes focalX, focalY, mimeType)
  if (assetImages.length > 0) {
    safeProduct.images = assetImages;
  }
  const safeRelated = toClientSafe(relatedProducts);

  return (
    <>
      <ProductSchema product={safeProduct} />
      <BreadcrumbSchema
        category={safeProduct.category}
        productName={safeProduct.name}
      />
      <Suspense>
        <ProductClient product={safeProduct} relatedProducts={safeRelated} />
      </Suspense>
    </>
  );
}
