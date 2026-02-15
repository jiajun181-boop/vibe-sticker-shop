import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/account/orders/[id]/reorder
 * Returns cart items reconstructed from a previous order.
 * The client will add these to the Zustand cart store.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch order belonging to this user
    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [{ userId: user.id }, { customerEmail: user.email }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Reconstruct cart items from order items
    const cartItems = await Promise.all(
      order.items.map(async (item) => {
        // Try to find the current product for latest price
        let currentProduct = null;
        if (item.productId) {
          currentProduct = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, slug: true, name: true, basePrice: true, isActive: true, category: true },
          });
        }

        // Use current price if product still exists, otherwise use historical price
        const price = currentProduct?.isActive
          ? currentProduct.basePrice
          : item.unitPrice;

        return {
          id: currentProduct?.id || item.productId || item.productName,
          slug: currentProduct?.slug || null,
          name: currentProduct?.name || item.productName,
          category: currentProduct?.category || null,
          price,
          quantity: item.quantity,
          options: {
            ...(item.material ? { material: item.material } : {}),
            ...(item.finishing ? { finishing: item.finishing } : {}),
            ...(item.widthIn ? { widthIn: item.widthIn } : {}),
            ...(item.heightIn ? { heightIn: item.heightIn } : {}),
            ...(item.specsJson || {}),
          },
          isDiscontinued: !currentProduct?.isActive,
          priceChanged: currentProduct?.isActive && currentProduct.basePrice !== item.unitPrice,
        };
      })
    );

    return NextResponse.json({
      items: cartItems,
      originalOrderId: order.id,
      originalDate: order.createdAt,
    });
  } catch (err) {
    console.error("[Reorder] Error:", err);
    return NextResponse.json(
      { error: "Failed to prepare reorder" },
      { status: 500 }
    );
  }
}
