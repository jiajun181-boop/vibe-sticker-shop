import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubProducts } from "@/lib/subProductConfig";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { getProductAssets } from "@/lib/assets";
import ProductClient from "./ProductClient";
import SubProductLandingClient from "./SubProductLandingClient";
import { ProductSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

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
    const title = `${subLabel} | La Lunar Printing Inc.`;
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
  const title = `${p.name} | La Lunar Printing Inc.`;
  const description =
    p.metaDescription || p.description ||
    `Order custom ${p.name} online. Professional quality, fast turnaround in Toronto & the GTA.`;
  const image = p.images[0]?.url || `${SITE_URL}/og-image.png`;
  const canonical = `${SITE_URL}/shop/${category}/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "La Lunar Printing Inc.",
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

    // De-duplicate by name: keep the product with the highest basePrice
    const seen = new Map();
    for (const p of subProducts) {
      const existing = seen.get(p.name);
      if (!existing || (p.basePrice || 0) > (existing.basePrice || 0)) {
        seen.set(p.name, p);
      }
    }
    const dedupedProducts = [...seen.values()];

    const config = await getCatalogConfig();
    const categoryMeta = config.categoryMeta[decodedCategory];

    return (
      <SubProductLandingClient
        parentSlug={decodedSlug}
        category={decodedCategory}
        categoryTitle={categoryMeta?.title || decodedCategory}
        products={toClientSafe(dedupedProducts)}
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
  const catalogCfg = await getCatalogConfig();

  return (
    <>
      <ProductSchema product={safeProduct} />
      <BreadcrumbSchema
        category={safeProduct.category}
        productName={safeProduct.name}
      />
      <Suspense>
        <ProductClient product={safeProduct} relatedProducts={safeRelated} catalogConfig={catalogCfg} />
      </Suspense>
    </>
  );
}
