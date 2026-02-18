import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { buildInteracInstructionsHtml } from "@/lib/email/templates/interac-instructions";
import { getSessionFromRequest } from "@/lib/auth";

const InteracSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().int().positive(),
    unitAmount: z.number().int().nonnegative(),
    meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })).min(1).max(50),
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = InteracSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation error", details: result.error.flatten() }, { status: 400 });
    }

    const { items, email, name } = result.data;

    // Verify all products exist and are active, enforce minimum price
    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, isActive: true },
        select: { id: true, name: true },
      });
      if (!product) {
        return NextResponse.json(
          { error: `Product not found or inactive: ${item.name}` },
          { status: 400 }
        );
      }
      if (item.unitAmount < 50) {
        return NextResponse.json(
          { error: `Invalid price for ${item.name}` },
          { status: 400 }
        );
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    const taxAmount = Math.round(subtotal * 0.13);
    const shippingAmount = subtotal >= 15000 ? 0 : 1500;
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Get user if logged in
    const session = getSessionFromRequest(req as any);
    const userId = session?.userId || null;

    // Create draft order
    const order = await prisma.order.create({
      data: {
        customerEmail: email,
        customerName: name,
        userId,
        subtotalAmount: subtotal,
        taxAmount,
        shippingAmount,
        totalAmount,
        status: "pending",
        paymentStatus: "unpaid",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.name,
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
            message: "Order created via Interac e-Transfer — awaiting payment",
          },
        },
      },
    });

    // Send instructions email
    const html = buildInteracInstructionsHtml({
      orderId: order.id,
      customerName: name,
      totalAmount,
    });

    await sendEmail({
      to: email,
      subject: `Interac e-Transfer Instructions — Order #${order.id.slice(0, 8)}`,
      html,
      template: "interac-instructions",
      orderId: order.id,
    });

    return NextResponse.json({ orderId: order.id, totalAmount });
  } catch (err) {
    console.error("[Interac Checkout] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
