import { prisma } from "@/lib/prisma";
import { getProductAssets } from "@/lib/assets";

/**
 * Shared helper for /order/* pages.
 * Fetches product images for a configurator page given possible product slugs.
 *
 * @param {string[]} slugs - possible product slugs to look up (tries in order)
 * @returns {Promise<Array>} - client-safe image array for ConfigProductGallery
 */
export async function getOrderPageImages(slugs) {
  try {
    const products = await prisma.product.findMany({
      where: { slug: { in: slugs }, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    if (!products.length) return [];

    const productsBySlug = new Map(products.map((product) => [product.slug, product]));

    // Respect caller priority order (e.g. ["flyers", "flyers-standard"]).
    for (const slug of slugs) {
      const product = productsBySlug.get(slug);
      if (!product) continue;

      const assetImages = await getProductAssets(product.id);
      if (assetImages.length > 0) return assetImages;

      if ((product.images?.length || 0) > 0) {
        // Fallback to legacy ProductImage - strip non-serializable fields
        return JSON.parse(
          JSON.stringify(product.images, (_key, v) =>
            typeof v === "bigint" ? v.toString() : v
          )
        );
      }
    }

    return [];
  } catch {
    return [];
  }
}
