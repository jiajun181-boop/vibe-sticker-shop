import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";
import { checkStock } from "@/lib/inventory";

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
    if (item.unitAmount < 50) {
      return NextResponse.json(
        { error: `Invalid price for product ${item.productId}: minimum $0.50 per unit` },
        { status: 400 }
      );
    }
  }

  // Stock check
  const stockCheck = await checkStock(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
  if (!stockCheck.ok) {
    return NextResponse.json(
      { error: "Insufficient stock", issues: stockCheck.issues },
      { status: 409 }
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.13);
  const shippingAmount = subtotal >= 15000 ? 0 : 1500;
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
}
