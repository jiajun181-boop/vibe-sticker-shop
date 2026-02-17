import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubProducts } from "@/lib/subProductConfig";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { getProductAssets } from "@/lib/assets";
import { computeFromPrice } from "@/lib/pricing/from-price";
import { getSmartDefaults } from "@/lib/pricing/get-smart-defaults";
import { getConfiguratorForSlug } from "@/lib/configurator-router";
import ProductClient from "./ProductClient";
import SubProductLandingClient from "./SubProductLandingClient";
import StickerOrderClient from "@/app/order/stickers/StickerOrderClient";
import BookletOrderClient from "@/app/order/booklets/BookletOrderClient";
import NcrOrderClient from "@/app/order/ncr/NcrOrderClient";
import BannerOrderClient from "@/app/order/banners/BannerOrderClient";
import SignOrderClient from "@/app/order/signs/SignOrderClient";
import VehicleOrderClient from "@/app/order/vehicle/VehicleOrderClient";
import SurfaceOrderClient from "@/app/order/surfaces/SurfaceOrderClient";
import { ProductSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const revalidate = 60;

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

function getSpecFamilyKey(slug) {
  const alias = {
    "notepads-custom": "notepads",
    "bookmarks-custom": "bookmarks",
    calendars: "calendar-wall",
    "calendars-wall": "calendar-wall",
    "calendars-wall-desk": "calendar-table",
  };
  return alias[slug] || slug;
}

function choosePreferredSpec(existing, candidate, familyKey) {
  const canonicalByFamily = {
    notepads: "notepads",
    bookmarks: "bookmarks",
    "calendar-wall": "calendars-wall",
    "calendar-table": "calendars-wall-desk",
  };
  const canonicalSlug = canonicalByFamily[familyKey] || familyKey;

  // Prefer canonical slug card (e.g. notepads over notepads-custom)
  if (candidate.slug === canonicalSlug && existing.slug !== canonicalSlug) return candidate;
  if (existing.slug === canonicalSlug && candidate.slug !== canonicalSlug) return existing;
  // Otherwise prefer lower entry price for a better "from" card
  if ((candidate.basePrice || 0) < (existing.basePrice || 0)) return candidate;
  return existing;
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
  const hasMetaTitle = typeof p.metaTitle === "string" && p.metaTitle.trim().length > 0;
  const hasMetaDescription = typeof p.metaDescription === "string" && p.metaDescription.trim().length > 0;
  const hasKeywords = Array.isArray(p.keywords) && p.keywords.length > 0;
  const categoryLabel = String(p.category || "").replace(/-/g, " ");

  const title = hasMetaTitle
    ? p.metaTitle.trim()
    : `${p.name} Printing | ${categoryLabel} | La Lunar Printing Inc.`;
  const description = hasMetaDescription
    ? p.metaDescription.trim()
    : p.description ||
      `Order ${p.name} online in Canada. Fast turnaround, production-ready file checks, and reliable delivery from La Lunar Printing Inc.`;
  const keywords = hasKeywords
    ? p.keywords
    : [p.name, categoryLabel, "custom printing", "Toronto printing", "Canada print shop"];
  const image = p.images[0]?.url || `${SITE_URL}/og-image.png`;
  const canonical = `${SITE_URL}/shop/${category}/${slug}`;
  return {
    title,
    description,
    keywords,
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
        pricingPreset: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    // Merge same-spec-family products into one card (e.g. notepads + custom-notepads)
    const seen = new Map();
    for (const p of subProducts) {
      const familyKey = getSpecFamilyKey(p.slug);
      const existing = seen.get(familyKey)?.product;
      if (!existing) {
        seen.set(familyKey, { familyKey, product: p });
      } else {
        seen.set(familyKey, {
          familyKey,
          product: choosePreferredSpec(existing, p, familyKey),
        });
      }
    }
    const dedupedProducts = [...seen.values()].map(({ familyKey, product }) => {
      if (familyKey === "calendar-wall") {
        return { ...product, name: "Wall Calendars" };
      }
      if (familyKey === "calendar-table") {
        return { ...product, name: "Table Calendars" };
      }
      return product;
    });

    // Use pre-computed minPrice for sub-product cards (write-time calculation).
    for (const p of dedupedProducts) {
      p.fromPrice = p.displayFromPrice || p.minPrice || computeFromPrice(p);
      p.quickAddQty = getSmartDefaults(p).minQuantity;
    }

    const config = await getCatalogConfig();
    const categoryMeta = config.categoryMeta[decodedCategory];

    // Sibling sub-groups for "Also browse..." section
    const siblingSubGroups = (categoryMeta?.subGroups || [])
      .filter((sg) => sg.slug !== decodedSlug)
      .slice(0, 6)
      .map((sg) => ({ slug: sg.slug, title: sg.title, href: sg.href }));

    return (
      <SubProductLandingClient
        parentSlug={decodedSlug}
        category={decodedCategory}
        categoryTitle={categoryMeta?.title || decodedCategory}
        products={toClientSafe(dedupedProducts)}
        siblingSubGroups={siblingSubGroups}
      />
    );
  }

  // ── Category configurator: check all configurator types via unified router ──
  const configurator = getConfiguratorForSlug(decodedSlug);
  if (configurator) {
    const CONFIGURATOR_COMPONENTS = {
      stickers: <StickerOrderClient defaultType={configurator.defaultValue} />,
      booklets: <BookletOrderClient defaultBinding={configurator.defaultValue} />,
      ncr: <NcrOrderClient defaultType={configurator.defaultValue} />,
      banners: <BannerOrderClient defaultType={configurator.defaultValue} />,
      signs: <SignOrderClient defaultType={configurator.defaultValue} />,
      vehicle: <VehicleOrderClient defaultType={configurator.defaultValue} />,
      surfaces: <SurfaceOrderClient defaultType={configurator.defaultValue} />,
    };
    return (
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        }
      >
        {CONFIGURATOR_COMPONENTS[configurator.component]}
      </Suspense>
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
