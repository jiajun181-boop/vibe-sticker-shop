import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * POST /api/admin/orders/[id]/duplicate
 * Creates a new draft order by cloning an existing order's items.
 * Useful for repeat orders, corrections, or admin-initiated reorders.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const source = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source order not found" }, { status: 404 });
    }

    // Create new draft order with same customer info
    const newOrder = await prisma.order.create({
      data: {
        customerEmail: source.customerEmail,
        customerName: source.customerName,
        customerPhone: source.customerPhone,
        userId: source.userId,
        status: "draft",
        paymentStatus: "unpaid",
        productionStatus: "not_started",
        shippingMethod: source.shippingMethod,
        shippingAmount: source.shippingAmount,
        // Recalculate totals from items
        subtotalAmount: source.subtotalAmount,
        taxAmount: source.taxAmount,
        totalAmount: source.totalAmount,
        tags: source.tags ? [...(source.tags as string[]), "duplicated"] : ["duplicated"],
        items: {
          create: source.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            material: item.material,
            finishing: item.finishing,
            widthIn: item.widthIn,
            heightIn: item.heightIn,
            specsJson: item.specsJson || undefined,
          })),
        },
        timeline: {
          create: {
            action: "order_created",
            details: JSON.stringify({
              duplicatedFrom: id,
              sourceOrderRef: source.id.slice(0, 8),
            }),
            actor: auth.user?.email || "admin",
          },
        },
      },
      include: { items: true },
    });

    await logActivity({
      action: "order_duplicated",
      entity: "order",
      entityId: newOrder.id,
      actor: auth.user?.email || "admin",
      details: { sourceOrderId: id },
    });

    return NextResponse.json({
      id: newOrder.id,
      message: `Draft order created from #${id.slice(0, 8)}`,
    });
  } catch (error) {
    console.error("[Order Duplicate] Error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate order" },
      { status: 500 }
    );
  }
}
