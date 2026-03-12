import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { itemHasArtwork, itemIsDesignHelp, itemIsArtworkProvided } from "@/lib/artwork-detection";
import { isServiceFeeItem } from "@/lib/order-item-utils";

/**
 * GET /api/admin/orders/missing-artwork
 *
 * Returns orders that have items missing artwork (customer chose upload-later
 * but hasn't uploaded yet). Sorted by age (oldest first = most urgent).
 *
 * Query params:
 *   limit?: number (default 50)
 *   includeDesignHelp?: "true" — also show design-help items
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const includeDesignHelp = searchParams.get("includeDesignHelp") === "true";

    // Get paid orders that aren't canceled/refunded, with their items
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["paid", "pending"] },
        productionStatus: { notIn: ["shipped", "completed", "canceled"] },
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        createdAt: true,
        productionStatus: true,
        items: {
          select: {
            id: true,
            productName: true,
            fileUrl: true,
            fileName: true,
            meta: true,
          },
        },
        files: {
          select: { id: true },
        },
        timeline: {
          where: { action: "file_uploaded" },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Filter to orders with items that need artwork
    const results: {
      orderId: string;
      customerName: string | null;
      customerEmail: string;
      createdAt: Date;
      productionStatus: string;
      daysSinceOrder: number;
      totalItems: number;
      itemsMissing: { id: string; productName: string; reason: string }[];
      totalFilesUploaded: number;
      hasAnyUploadActivity: boolean;
    }[] = [];

    const now = new Date();

    for (const order of orders) {
      const itemsMissing: { id: string; productName: string; reason: string }[] = [];

      for (const item of order.items) {
        const meta = item.meta && typeof item.meta === "object" ? item.meta as Record<string, unknown> : {};
        const isUploadLater = meta.artworkIntent === "upload-later" || meta.intakeMode === "upload-later";

        // Service-fee rows are financial line items, not producible — skip
        if (isServiceFeeItem(item as { meta?: unknown })) continue;

        if (itemHasArtwork(item)) continue;

        // Admin confirmed artwork exists off-platform — not missing
        if (itemIsArtworkProvided(item)) continue;

        if (itemIsDesignHelp(item)) {
          if (includeDesignHelp) {
            itemsMissing.push({ id: item.id, productName: item.productName, reason: "design-help" });
          }
          continue;
        }

        // If explicitly upload-later OR has no artwork at all
        itemsMissing.push({
          id: item.id,
          productName: item.productName,
          reason: isUploadLater ? "upload-later" : "no-artwork",
        });
      }

      if (itemsMissing.length > 0) {
        const daysSinceOrder = Math.floor((now.getTime() - order.createdAt.getTime()) / 86400000);
        results.push({
          orderId: order.id,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          createdAt: order.createdAt,
          productionStatus: order.productionStatus,
          daysSinceOrder,
          totalItems: order.items.length,
          itemsMissing,
          totalFilesUploaded: order.files.length,
          hasAnyUploadActivity: order.timeline.length > 0,
        });
      }
    }

    // Summary
    const urgentCount = results.filter((r) => r.daysSinceOrder >= 3).length;
    const staleCount = results.filter((r) => r.daysSinceOrder >= 7).length;

    return NextResponse.json({
      orders: results.slice(0, limit),
      total: results.length,
      urgentCount,
      staleCount,
    });
  } catch (error) {
    console.error("[Missing Artwork] Error:", error);
    return NextResponse.json({ error: "Failed to load missing artwork" }, { status: 500 });
  }
}
