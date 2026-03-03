import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/orders/create
 * Creates a manual order from admin panel.
 * Creates Order + OrderItems + ProductionJobs in a single transaction.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      customerPhone,
      items,
      notes,
      paymentStatus = "unpaid",
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
          tags: ["admin_manual"],
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

      // Create ProductionJob for each item
      for (const orderItem of newOrder.items) {
        await tx.productionJob.create({
          data: {
            orderItemId: orderItem.id,
            status: "queued",
            priority: "normal",
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
          actor: "admin",
        },
      });

      return newOrder;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[AdminOrderCreate] Error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
