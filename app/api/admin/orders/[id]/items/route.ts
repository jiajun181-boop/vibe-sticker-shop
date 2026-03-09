import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * PATCH /api/admin/orders/[id]/items
 * Update an order item's meta — used by admin tools (contour, stamp studio) to
 * write production data back into the order.
 *
 * Body: { itemId: string, meta: Record<string, any> }
 * Merges `meta` into existing item.meta (does not replace).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { itemId, meta } = body;

    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }
    if (!meta || typeof meta !== "object") {
      return NextResponse.json({ error: "meta object is required" }, { status: 400 });
    }

    // Verify the item belongs to this order
    const item = await prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      select: { id: true, meta: true, productName: true },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found in this order" }, { status: 404 });
    }

    // Merge new meta into existing
    const existingMeta = (item.meta && typeof item.meta === "object" ? item.meta : {}) as Record<string, unknown>;
    const mergedMeta = { ...existingMeta, ...meta };

    await prisma.orderItem.update({
      where: { id: itemId },
      data: { meta: mergedMeta },
    });

    // Activity log
    logActivity({
      action: "item_meta_updated",
      entity: "order",
      entityId: orderId,
      actor: auth.user?.name || auth.user?.email || "admin",
      details: { message: `Updated meta for "${item.productName}"`, keys: Object.keys(meta) },
    });

    return NextResponse.json({ success: true, meta: mergedMeta });
  } catch (err) {
    console.error("[admin/orders/items] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
