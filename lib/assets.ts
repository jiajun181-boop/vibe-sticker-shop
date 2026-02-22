/**
 * Server-side asset helpers.
 * Provides asset fetching with automatic fallback to legacy ProductImage table.
 */

import { prisma } from "@/lib/prisma";

interface AssetResult {
  url: string;
  alt: string | null;
  focalX: number;
  focalY: number;
  mimeType: string;
  widthPx: number;
  heightPx: number;
  assetId: string | null;
}

/**
 * Fetch all assets linked to an entity.
 */
export async function getEntityAssets(
  entityType: string,
  entityId: string,
  purpose?: string
) {
  const links = await prisma.assetLink.findMany({
    where: {
      entityType,
      entityId,
      ...(purpose ? { purpose: purpose as never } : {}),
    },
    include: {
      asset: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  return links.map((link) => ({
    url: link.asset.originalUrl,
    alt: link.altOverride || link.asset.altText,
    focalX: link.asset.focalX,
    focalY: link.asset.focalY,
    mimeType: link.asset.mimeType,
    widthPx: link.asset.widthPx,
    heightPx: link.asset.heightPx,
    assetId: link.asset.id,
    linkId: link.id,
    purpose: link.purpose,
    sortOrder: link.sortOrder,
  }));
}

/**
 * Fetch all images for a product, with fallback to legacy ProductImage table.
 * Returns a normalized array compatible with ImageGallery / ImageAsset.
 */
export async function getProductAssets(
  productId: string
): Promise<AssetResult[]> {
  // Try new Asset system first
  const links = await prisma.assetLink.findMany({
    where: { entityType: "product", entityId: productId },
    include: { asset: true },
    orderBy: { sortOrder: "asc" },
  });

  if (links.length > 0) {
    return links.map((link) => ({
      url: link.asset.originalUrl,
      alt: link.altOverride || link.asset.altText,
      focalX: link.asset.focalX,
      focalY: link.asset.focalY,
      mimeType: link.asset.mimeType,
      widthPx: link.asset.widthPx,
      heightPx: link.asset.heightPx,
      assetId: link.asset.id,
    }));
  }

  // Fallback to legacy ProductImage
  const legacyImages = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });

  return legacyImages.map((img) => ({
    url: img.url,
    alt: img.alt,
    focalX: 0.5,
    focalY: 0.5,
    mimeType: img.url.endsWith(".svg") ? "image/svg+xml" : "image/jpeg",
    widthPx: 600,
    heightPx: 600,
    assetId: null,
  }));
}

/**
 * Fetch the primary (first) image for a product.
 * Used in product cards, listings, and OG images.
 */
export async function getProductPrimaryImage(
  productId: string
): Promise<AssetResult | null> {
  // Try new Asset system first (prefer explicit gallery purpose)
  let link = await prisma.assetLink.findFirst({
    where: { entityType: "product", entityId: productId, purpose: "gallery" },
    include: { asset: true },
    orderBy: { sortOrder: "asc" },
  });

  // Some legacy migrations may have asset links without a purpose set.
  // Fall back to any linked product asset before using legacy ProductImage.
  if (!link) {
    link = await prisma.assetLink.findFirst({
      where: { entityType: "product", entityId: productId },
      include: { asset: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  if (link) {
    return {
      url: link.asset.originalUrl,
      alt: link.altOverride || link.asset.altText,
      focalX: link.asset.focalX,
      focalY: link.asset.focalY,
      mimeType: link.asset.mimeType,
      widthPx: link.asset.widthPx,
      heightPx: link.asset.heightPx,
      assetId: link.asset.id,
    };
  }

  // Fallback to legacy ProductImage
  const legacy = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });

  if (!legacy) return null;

  return {
    url: legacy.url,
    alt: legacy.alt,
    focalX: 0.5,
    focalY: 0.5,
    mimeType: legacy.url.endsWith(".svg") ? "image/svg+xml" : "image/jpeg",
    widthPx: 600,
    heightPx: 600,
    assetId: null,
  };
}
