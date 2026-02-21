import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubProducts } from "@/lib/subProductConfig";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { getProductAssets } from "@/lib/assets";
import { computeFromPrice } from "@/lib/pricing/from-price";
import { getSmartDefaults } from "@/lib/pricing/get-smart-defaults";
import { getConfiguratorForSlug } from "@/lib/configurator-router";
import { getVariantConfig, getVariantParent, getVariantChildSlugs } from "@/lib/variantProductConfig";
import { getSceneConfig } from "@/lib/sceneConfig";
import { getStickerRichPageSlug } from "@/lib/sticker-page-content";
import { getSignRichPageSlug } from "@/lib/sign-page-content";
import ProductClient from "./ProductClient";
import SubProductLandingClient from "./SubProductLandingClient";
import VariantProductPage from "./VariantProductPage";
import SceneLandingPage from "./SceneLandingPage";
import StickerProductPageClient from "@/components/sticker-product/StickerProductPageClient";
import SignProductPageClient from "@/components/sign-product/SignProductPageClient";
import WwfProductPageClient from "@/components/wwf-product/WwfProductPageClient";
import { getWwfPageContent } from "@/lib/wwf-page-content";
import ComingSoonPage from "@/components/sign-product/ComingSoonPage";
import BookletOrderClient from "@/app/order/booklets/BookletOrderClient";
import NcrOrderClient from "@/app/order/ncr/NcrOrderClient";
import BannerOrderClient from "@/app/order/banners/BannerOrderClient";
import SignOrderClient from "@/app/order/signs/SignOrderClient";
import VehicleOrderClient from "@/app/order/vehicle/VehicleOrderClient";
import SurfaceOrderClient from "@/app/order/surfaces/SurfaceOrderClient";
import CanvasOrderClient from "@/app/order/canvas/CanvasOrderClient";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";
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

  // Scene page metadata
  const sceneCfg = getSceneConfig(decodedSlug);
  if (sceneCfg) {
    const url = `${SITE_URL}/shop/${category}/${slug}`;
    return {
      title: sceneCfg.metaTitle,
      description: sceneCfg.metaDescription,
      alternates: { canonical: url },
      openGraph: { title: sceneCfg.metaTitle, description: sceneCfg.metaDescription, url, type: "website" },
      twitter: { card: "summary_large_image", title: sceneCfg.metaTitle, description: sceneCfg.metaDescription },
    };
  }

  // Variant page metadata
  const variantCfg = getVariantConfig(decodedSlug);
  if (variantCfg) {
    const url = `${SITE_URL}/shop/${category}/${slug}`;
    return {
      title: variantCfg.metaTitle,
      description: variantCfg.metaDescription,
      alternates: { canonical: url },
      openGraph: { title: variantCfg.metaTitle, description: variantCfg.metaDescription, url, type: "website" },
      twitter: { card: "summary_large_image", title: variantCfg.metaTitle, description: variantCfg.metaDescription },
    };
  }

  // Sticker rich page metadata
  const stickerRich = getStickerRichPageSlug(decodedSlug);
  if (stickerRich) {
    const { content } = stickerRich;
    const url = `${SITE_URL}/shop/${category}/${slug}`;
    return {
      title: content.seo.title,
      description: content.seo.description,
      keywords: content.seo.keywords,
      alternates: { canonical: url },
      openGraph: { title: content.seo.title, description: content.seo.description, url, type: "website" },
      twitter: { card: "summary_large_image", title: content.seo.title, description: content.seo.description },
    };
  }

  // Coming Soon signs metadata
  const COMING_SOON_SIGNS = {
    "selfie-frame-board": { name: "Event & Photo Boards", description: "Custom foam board selfie frames, photo backdrops, and event props. Coming soon to La Lunar Printing." },
    "welcome-sign-board": { name: "Event Signs", description: "Custom welcome signs, seating charts, and event signage on foam board. Coming soon." },
    "tri-fold-presentation-board": { name: "Presentation Boards", description: "Tri-fold presentation boards for science fairs, exhibitions, and conferences. Coming soon." },
  };
  const comingSoonMeta = COMING_SOON_SIGNS[decodedSlug];
  if (comingSoonMeta && safeDecode(category) === "signs-rigid-boards") {
    const title = `${comingSoonMeta.name} | Coming Soon | La Lunar Printing`;
    const csDescription = comingSoonMeta.description;
    const url = `${SITE_URL}/shop/${category}/${slug}`;
    return {
      title,
      description: csDescription,
      alternates: { canonical: url },
      openGraph: { title, description: csDescription, url, type: "website" },
      twitter: { card: "summary_large_image", title, description: csDescription },
    };
  }

  // Sign rich page metadata
  const signRich = getSignRichPageSlug(decodedSlug);
  if (signRich) {
    const { content } = signRich;
    const url = `${SITE_URL}/shop/${category}/${slug}`;
    return {
      title: content.seo.title,
      description: content.seo.description,
      keywords: content.seo.keywords,
      alternates: { canonical: url },
      openGraph: { title: content.seo.title, description: content.seo.description, url, type: "website" },
      twitter: { card: "summary_large_image", title: content.seo.title, description: content.seo.description },
    };
  }

  // WWF rich page metadata
  const wwfRich = getWwfPageContent(decodedSlug);
  if (wwfRich) {
    const { content } = wwfRich;
    const url = `${SITE_URL}/shop/${category}/${slug}`;
    return {
      title: content.seo.title,
      description: content.seo.description,
      keywords: content.seo.keywords,
      alternates: { canonical: url },
      openGraph: { title: content.seo.title, description: content.seo.description, url, type: "website" },
      twitter: { card: "summary_large_image", title: content.seo.title, description: content.seo.description },
    };
  }

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

  // ── Scene landing page: SEO content page with embedded product ──
  const sceneCfg = getSceneConfig(decodedSlug);
  if (sceneCfg) {
    const product = await prisma.product.findFirst({
      where: { slug: sceneCfg.defaultVariantSlug, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, pricingPreset: true },
    });
    if (product) {
      const assetImages = await getProductAssets(product.id);
      const safeProduct = toClientSafe(product);
      if (assetImages.length > 0) safeProduct.images = assetImages;
      return (
        <SceneLandingPage
          sceneConfig={sceneCfg}
          product={safeProduct}
          category={decodedCategory}
        />
      );
    }
  }

  // ── Variant page: style selector with embedded ProductClient ──
  const variantCfg = getVariantConfig(decodedSlug);
  if (variantCfg) {
    const childSlugs = getVariantChildSlugs(decodedSlug);
    const childProducts = await prisma.product.findMany({
      where: { slug: { in: childSlugs }, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, pricingPreset: true },
    });

    const productMap = {};
    for (const p of childProducts) {
      const assetImages = await getProductAssets(p.id);
      const safe = toClientSafe(p);
      if (assetImages.length > 0) safe.images = assetImages;
      productMap[p.slug] = safe;
    }

    return (
      <Suspense>
        <VariantProductPage
          variantConfig={variantCfg}
          productMap={productMap}
          category={decodedCategory}
        />
      </Suspense>
    );
  }

  // ── Old slug redirect: child product slug → variant page with ?style= ──
  // Must come BEFORE sub-product and regular product lookups, because
  // these slugs (e.g. "die-cut-singles") exist in the DB and would
  // otherwise render as standalone product pages.
  const variantParent = getVariantParent(decodedSlug);
  if (variantParent) {
    const parentConfig = getVariantConfig(variantParent);
    if (parentConfig && parentConfig.category === decodedCategory) {
      redirect(`/shop/${decodedCategory}/${variantParent}?style=${decodedSlug}`);
    }
  }

  // ── Coming Soon signs ──
  const COMING_SOON_SIGNS_PAGE = {
    "selfie-frame-board": { name: "Event & Photo Boards", description: "Custom foam board selfie frames, photo backdrops, and event props. Full configurator and online ordering coming soon." },
    "welcome-sign-board": { name: "Event Signs", description: "Custom welcome signs, seating charts, and event signage on premium foam board. Full configurator and online ordering coming soon." },
    "tri-fold-presentation-board": { name: "Presentation Boards", description: "Tri-fold presentation boards for science fairs, exhibitions, and conferences. Full configurator and online ordering coming soon." },
  };
  const comingSoon = COMING_SOON_SIGNS_PAGE[decodedSlug];
  if (comingSoon && decodedCategory === "signs-rigid-boards") {
    return <ComingSoonPage {...comingSoon} slug={decodedSlug} category={decodedCategory} />;
  }

  // ── Sign rich product page: SEO-optimized page with embedded configurator ──
  // Must come BEFORE sub-product landing because sign slugs (e.g. "real-estate-signs")
  // also exist in SUB_PRODUCT_CONFIG, and the rich page should take priority.
  const signRichPage = getSignRichPageSlug(decodedSlug);
  if (signRichPage) {
    const { signTypeId, content } = signRichPage;
    const signProduct = await prisma.product.findFirst({
      where: { slug: decodedSlug, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    const signAssets = signProduct ? await getProductAssets(signProduct.id) : [];
    const signImages = signAssets.length > 0
      ? signAssets
      : toClientSafe(signProduct?.images || []);

    const signRelated = await prisma.product.findMany({
      where: {
        isActive: true,
        category: decodedCategory,
        ...(signProduct ? { id: { not: signProduct.id } } : {}),
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 4,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return (
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        }
      >
        <SignProductPageClient
          content={content}
          signTypeId={signTypeId}
          product={signProduct ? toClientSafe(signProduct) : { slug: decodedSlug, category: decodedCategory }}
          images={signImages}
          relatedProducts={toClientSafe(signRelated)}
        />
      </Suspense>
    );
  }

  // ── WWF rich product page: SEO-optimized page with embedded configurator ──
  if (decodedCategory === "windows-walls-floors") {
    const wwfContent = getWwfPageContent(decodedSlug);
    if (wwfContent) {
      const wwfProduct = await prisma.product.findFirst({
        where: { slug: decodedSlug, isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      });
      const wwfAssets = wwfProduct ? await getProductAssets(wwfProduct.id) : [];
      const wwfImages = wwfAssets.length > 0
        ? wwfAssets
        : toClientSafe(wwfProduct?.images || []);

      const wwfRelated = await prisma.product.findMany({
        where: {
          isActive: true,
          category: decodedCategory,
          ...(wwfProduct ? { id: { not: wwfProduct.id } } : {}),
        },
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
        take: 4,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });

      return (
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
          }
        >
          <WwfProductPageClient
            content={wwfContent.content}
            wwfProductId={wwfContent.wwfProductId}
            product={wwfProduct ? toClientSafe(wwfProduct) : { slug: decodedSlug, category: decodedCategory }}
            images={wwfImages}
            relatedProducts={toClientSafe(wwfRelated)}
          />
        </Suspense>
      );
    }
  }

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
    })
      // Exclude the parent landing slug itself from spec cards.
      // Example: /shop/.../flyers should list only concrete flyer specs.
      .filter((p) => p.slug !== decodedSlug);

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

  // ── Sticker rich product page: SEO-optimized page with embedded configurator ──
  const stickerRichPage = getStickerRichPageSlug(decodedSlug);
  if (stickerRichPage) {
    const { cuttingTypeId, content } = stickerRichPage;
    const stickerProduct = await prisma.product.findFirst({
      where: { slug: decodedSlug, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    const stickerAssets = stickerProduct ? await getProductAssets(stickerProduct.id) : [];
    const stickerImages = stickerAssets.length > 0
      ? stickerAssets
      : toClientSafe(stickerProduct?.images || []);

    const stickerRelated = await prisma.product.findMany({
      where: {
        isActive: true,
        category: decodedCategory,
        ...(stickerProduct ? { id: { not: stickerProduct.id } } : {}),
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 4,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return (
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        }
      >
        <StickerProductPageClient
          content={content}
          cuttingTypeId={cuttingTypeId}
          product={stickerProduct ? toClientSafe(stickerProduct) : { slug: decodedSlug, category: decodedCategory }}
          images={stickerImages}
          relatedProducts={toClientSafe(stickerRelated)}
        />
      </Suspense>
    );
  }

  // ── Category configurator: check all configurator types via unified router ──
  const configurator = getConfiguratorForSlug(decodedSlug);
  if (configurator) {
    // Sticker products redirect to the stickers category page
    if (configurator.component === "stickers") {
      redirect(`/shop/stickers-labels-decals`);
    }
    // Fetch product images for configurator display
    const cfgProduct = await prisma.product.findFirst({
      where: { slug: decodedSlug, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    const cfgAssetImages = cfgProduct ? await getProductAssets(cfgProduct.id) : [];
    const cfgImages = cfgAssetImages.length > 0
      ? cfgAssetImages
      : toClientSafe(cfgProduct?.images || []);

    const CONFIGURATOR_COMPONENTS = {
      // Stickers use dedicated pages (die-cut, kiss-cut, etc.) — redirect via configurator-router
      stickers: null,
      booklets: <BookletOrderClient defaultBinding={configurator.defaultValue} productImages={cfgImages} />,
      ncr: <NcrOrderClient defaultType={configurator.defaultValue} productImages={cfgImages} />,
      banners: <BannerOrderClient defaultType={configurator.defaultValue} productImages={cfgImages} />,
      signs: <SignOrderClient defaultType={configurator.defaultValue} productImages={cfgImages} />,
      vehicle: <VehicleOrderClient defaultType={configurator.defaultValue} productImages={cfgImages} />,
      canvas: <CanvasOrderClient defaultType={configurator.defaultValue} productImages={cfgImages} />,
      surfaces: <SurfaceOrderClient defaultType={configurator.defaultValue} productImages={cfgImages} />,
      "marketing-print": <MarketingPrintOrderClient defaultType={configurator.defaultValue} hideTypeSelector={true} productImages={cfgImages} />,
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
