import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";
import { checkAndReserveStock } from "@/lib/inventory";
import { HST_RATE, SHIPPING_COST, MIN_UNIT_AMOUNT, B2B_FREE_SHIPPING_THRESHOLD } from "@/lib/order-config";

const BulkOrderSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      unitAmount: z.number().int().nonnegative(),
      meta: z.record(z.string(), z.unknown()).optional(),
    })
  ).min(1),
});

export async function POST(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = BulkOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, items } = result.data;

    // Validate all products exist and are active
    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, isActive: true },
        select: { id: true, name: true },
      });
      if (!product) {
        return NextResponse.json(
          { error: `Product not found or inactive: ${item.productId}` },
          { status: 400 }
        );
      }
      if (item.unitAmount < MIN_UNIT_AMOUNT) {
        return NextResponse.json(
          { error: `Invalid price for product ${item.productId}: minimum $${(MIN_UNIT_AMOUNT / 100).toFixed(2)} per unit` },
          { status: 400 }
        );
      }
    }

    // Atomic stock check + reservation (prevents overselling on concurrent API calls)
    const stockCheck = await checkAndReserveStock(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    if (!stockCheck.ok) {
      return NextResponse.json(
        { error: "Insufficient stock", issues: stockCheck.issues },
        { status: 409 }
      );
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    const taxAmount = Math.round(subtotal * HST_RATE);
    const shippingAmount = subtotal >= B2B_FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const totalAmount = subtotal + taxAmount + shippingAmount;

    const order = await prisma.order.create({
      data: {
        customerEmail: email,
        customerName: name,
        userId: user.id,
        subtotalAmount: subtotal,
        taxAmount,
        shippingAmount,
        totalAmount,
        status: "pending",
        paymentStatus: "unpaid",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.meta?.name as string || "Item",
            quantity: item.quantity,
            unitPrice: item.unitAmount,
            totalPrice: item.unitAmount * item.quantity,
            meta: item.meta || undefined,
          })),
        },
        notes: {
          create: {
            authorType: "system",
            isInternal: true,
            message: `Order created via Bulk API by user ${user.email}`,
          },
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
    }, { status: 201 });
  } catch (err) {
    console.error("[v1/orders] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
