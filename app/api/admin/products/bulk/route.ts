import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * PATCH /api/admin/products/bulk
 * Bulk update products (toggle active, update tags, change category, etc.)
 *
 * Body: {
 *   productIds: string[],
 *   action: "activate" | "deactivate" | "addTags" | "removeTags" | "setCategory" | "setFeatured",
 *   payload?: { tags?: string[], category?: string, featured?: boolean }
 * }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, "products", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { productIds, action, payload } = body;

    if (
      !Array.isArray(productIds) ||
      productIds.length === 0 ||
      productIds.length > 100
    ) {
      return NextResponse.json(
        { error: "Provide 1-100 product IDs" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    let updateCount = 0;

    switch (action) {
      case "activate": {
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isActive: true },
        });
        updateCount = result.count;
        break;
      }

      case "deactivate": {
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isActive: false },
        });
        updateCount = result.count;
        break;
      }

      case "setFeatured": {
        const featured = payload?.featured ?? true;
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isFeatured: featured },
        });
        updateCount = result.count;
        break;
      }

      case "setCategory": {
        if (!payload?.category) {
          return NextResponse.json(
            { error: "Category is required" },
            { status: 400 }
          );
        }
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { category: payload.category },
        });
        updateCount = result.count;
        break;
      }

      case "addTags": {
        if (!Array.isArray(payload?.tags) || payload.tags.length === 0) {
          return NextResponse.json(
            { error: "Tags array is required" },
            { status: 400 }
          );
        }
        // Prisma doesn't support array concatenation in updateMany,
        // so we update each product individually
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, tags: true },
        });
        for (const product of products) {
          const existingTags = new Set(product.tags || []);
          for (const tag of payload.tags) {
            existingTags.add(tag);
          }
          await prisma.product.update({
            where: { id: product.id },
            data: { tags: Array.from(existingTags) },
          });
          updateCount++;
        }
        break;
      }

      case "removeTags": {
        if (!Array.isArray(payload?.tags) || payload.tags.length === 0) {
          return NextResponse.json(
            { error: "Tags array is required" },
            { status: 400 }
          );
        }
        const productsToUpdate = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, tags: true },
        });
        const tagsToRemove = new Set(payload.tags);
        for (const product of productsToUpdate) {
          const filteredTags = (product.tags || []).filter(
            (t) => !tagsToRemove.has(t)
          );
          await prisma.product.update({
            where: { id: product.id },
            data: { tags: filteredTags },
          });
          updateCount++;
        }
        break;
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: "${action}". Allowed: activate, deactivate, setFeatured, setCategory, addTags, removeTags`,
          },
          { status: 400 }
        );
    }

    logActivity({
      action: "products_bulk_updated",
      entity: "Product",
      details: {
        action,
        productIds,
        payload,
        updatedCount: updateCount,
      },
    });

    return NextResponse.json({
      action,
      updatedCount: updateCount,
      productIds,
    });
  } catch (error) {
    console.error("[Products Bulk] Error:", error);
    return NextResponse.json(
      { error: "Failed to bulk update products" },
      { status: 500 }
    );
  }
}
