import { prisma } from "@/lib/prisma";
import { getProductAssets } from "@/lib/assets";

/**
 * Shared helper for /order/* pages.
 * Fetches product images for a configurator page given possible product slugs.
 *
 * @param {string[]} slugs — possible product slugs to look up (tries in order)
 * @returns {Promise<Array>} — client-safe image array for ConfigProductGallery
 */
export async function getOrderPageImages(slugs) {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: { in: slugs }, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) return [];

    const assetImages = await getProductAssets(product.id);
    if (assetImages.length > 0) return assetImages;

    // Fallback to legacy ProductImage — strip non-serializable fields
    return JSON.parse(
      JSON.stringify(product.images || [], (_key, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    );
  } catch {
    return [];
  }
}
