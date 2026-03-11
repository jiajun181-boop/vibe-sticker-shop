import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { isServiceFeeItem } from "@/lib/order-item-utils";
import { detectProductFamily } from "@/lib/preflight";

/**
 * POST /api/admin/orders/create
 * Creates a manual order from admin panel.
 * Creates Order + OrderItems + ProductionJobs in a single transaction.
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "orders", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      customerPhone,
      items,
      notes,
      paymentStatus = "unpaid",
      isRush = false,
      artworkIntent,
      fromQuoteId,
    } = body;

    if (!customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer email and at least one item are required" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.productName || item.quantity < 1) {
        return NextResponse.json(
          { error: "Each item must have a productName and quantity >= 1" },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotalAmount = items.reduce(
      (sum: number, item: { totalPrice?: number; unitPrice?: number; quantity: number }) =>
        sum + (item.totalPrice || (item.unitPrice || 0) * item.quantity),
      0
    );

    // Look up existing user by email
    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail.toLowerCase().trim() },
      select: { id: true },
    });

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          customerEmail: customerEmail.toLowerCase().trim(),
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          userId: existingUser?.id || null,
          subtotalAmount,
          totalAmount: subtotalAmount,
          status: "pending",
          paymentStatus: paymentStatus as "unpaid" | "paid",
          productionStatus: "not_started",
          tags: isRush ? ["admin_manual", "rush"] : ["admin_manual"],
          items: {
            create: items.map(
              (item: {
                productName: string;
                productType?: string;
                quantity: number;
                unitPrice?: number;
                totalPrice?: number;
                widthIn?: number;
                heightIn?: number;
                material?: string;
                finishing?: string;
                meta?: Record<string, unknown>;
              }) => ({
                productName: item.productName,
                productType: item.productType || "custom",
                quantity: item.quantity,
                unitPrice: item.unitPrice || 0,
                totalPrice:
                  item.totalPrice || (item.unitPrice || 0) * item.quantity,
                widthIn: item.widthIn || null,
                heightIn: item.heightIn || null,
                material: item.material || null,
                finishing: item.finishing || null,
                meta: item.meta || null,
              })
            ),
          },
        },
        include: { items: true },
      });

      // Create ProductionJob for each item (skip service-fee items)
      for (const orderItem of newOrder.items) {
        if (isServiceFeeItem(orderItem)) continue;
        const itemMeta = orderItem.meta && typeof orderItem.meta === "object"
          ? orderItem.meta as Record<string, unknown> : {};
        const family = detectProductFamily(orderItem);
        const artworkUrl = orderItem.fileUrl
          || (typeof itemMeta.artworkUrl === "string" ? itemMeta.artworkUrl : null);

        await tx.productionJob.create({
          data: {
            orderItemId: orderItem.id,
            status: "queued",
            priority: isRush ? "urgent" : "normal",
            isRush: !!isRush,
            dueAt: isRush ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            productName: orderItem.productName || null,
            family,
            quantity: orderItem.quantity,
            widthIn: orderItem.widthIn || null,
            heightIn: orderItem.heightIn || null,
            material: orderItem.material || null,
            finishing: orderItem.finishing || null,
            artworkUrl,
          },
        });
      }

      // Add a note if provided
      if (notes) {
        await tx.orderNote.create({
          data: {
            orderId: newOrder.id,
            message: notes,
            authorType: "staff",
            isInternal: true,
          },
        });
      }

      // Add timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          action: "created",
          details: "Order created manually from admin panel",
          actor: auth.user?.email || "admin",
        },
      });

      return newOrder;
    });

    // Link quote if converting
    if (fromQuoteId) {
      try {
        await prisma.quoteRequest.update({
          where: { id: fromQuoteId },
          data: { status: "converted", convertedOrderId: order.id },
        });
      } catch {
        // Non-critical — don't fail the order creation
      }
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[AdminOrderCreate] Error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
