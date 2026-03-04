import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * POST /api/admin/image-dashboard/sync
 *
 * Syncs Asset system images → legacy ProductImage table.
 * For every product that has AssetLinks (UploadThing uploads) but no
 * ProductImage record pointing to those URLs, this creates ProductImage
 * entries so that ALL frontend pages can find the images.
 *
 * Also removes stale ProductImage records that point to old local
 * /products/*.png paths (files no longer exist on disk).
 */
export async function POST(request: Request) {
  const auth = await requirePermission(request, "products", "edit");
  if (!auth.authenticated) return auth.response;

  // 1. Get ALL products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
  });

  // 2. Batch-fetch all AssetLinks for products (published assets only)
  const allAssetLinks = await prisma.assetLink.findMany({
    where: {
      entityType: "product",
      entityId: { in: products.map((p) => p.id) },
      asset: { status: "published" },
    },
    include: { asset: { select: { id: true, originalUrl: true, altText: true } } },
    orderBy: { sortOrder: "asc" },
  });

  // Group by productId
  const assetsByProduct: Record<string, typeof allAssetLinks> = {};
  for (const link of allAssetLinks) {
    if (!assetsByProduct[link.entityId]) {
      assetsByProduct[link.entityId] = [];
    }
    assetsByProduct[link.entityId].push(link);
  }

  // 3. Batch-fetch all existing ProductImage records
  const allProductImages = await prisma.productImage.findMany({
    where: { productId: { in: products.map((p) => p.id) } },
    select: { id: true, productId: true, url: true, sortOrder: true },
  });

  const imagesByProduct: Record<string, typeof allProductImages> = {};
  for (const img of allProductImages) {
    if (!imagesByProduct[img.productId]) {
      imagesByProduct[img.productId] = [];
    }
    imagesByProduct[img.productId].push(img);
  }

  let synced = 0;
  let staleRemoved = 0;
  const details: Array<{ slug: string; action: string }> = [];

  for (const product of products) {
    const assetLinks = assetsByProduct[product.id] || [];
    const productImages = imagesByProduct[product.id] || [];

    // Collect existing external URLs in ProductImage (non-local)
    const existingExternalUrls = new Set(
      productImages
        .filter((img) => !img.url.startsWith("/products/"))
        .map((img) => img.url)
    );

    // Remove stale local /products/*.png records
    const staleImages = productImages.filter((img) => img.url.startsWith("/products/"));
    if (staleImages.length > 0) {
      await prisma.productImage.deleteMany({
        where: { id: { in: staleImages.map((img) => img.id) } },
      });
      staleRemoved += staleImages.length;
      details.push({ slug: product.slug, action: `removed ${staleImages.length} stale local image(s)` });
    }

    // For each Asset, ensure a ProductImage record exists
    let nextSortOrder = Math.max(0, ...productImages.map((img) => img.sortOrder + 1), 0);
    for (const link of assetLinks) {
      const url = link.asset.originalUrl;
      if (!url || existingExternalUrls.has(url)) continue;

      await prisma.productImage.create({
        data: {
          productId: product.id,
          url,
          alt: link.altOverride || link.asset.altText || product.name,
          sortOrder: nextSortOrder++,
        },
      });
      existingExternalUrls.add(url);
      synced++;
    }

    if (assetLinks.length > 0 && !existingExternalUrls.size) {
      details.push({ slug: product.slug, action: `synced ${assetLinks.length} asset image(s)` });
    }
  }

  return NextResponse.json({
    success: true,
    synced,
    staleRemoved,
    message: `Synced ${synced} asset images to ProductImage. Removed ${staleRemoved} stale local paths.`,
    details: details.slice(0, 50), // limit output size
  });
}
