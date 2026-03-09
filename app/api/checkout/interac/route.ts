import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { buildInteracInstructionsHtml } from "@/lib/email/templates/interac-instructions";
import { getSessionFromRequest } from "@/lib/auth";
import { checkAndReserveStock } from "@/lib/inventory";
import { HST_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/order-config";

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

    // Verify all products exist and are active, enforce minimum price + drift check
    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, isActive: true },
        select: { id: true, name: true, basePrice: true },
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
      // Price drift guard: reject if client price is <50% of base price (possible tampering)
      if (product.basePrice && product.basePrice > 0 && item.unitAmount < product.basePrice * 0.5) {
        console.warn(`[Interac] Price drift rejected: ${item.name} — client ${item.unitAmount}¢ vs base ${product.basePrice}¢`);
        return NextResponse.json(
          { error: `Price error for ${product.name}. Please refresh and try again.` },
          { status: 400 }
        );
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    const shippingAmount = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const taxAmount = Math.round((subtotal + shippingAmount) * HST_RATE);
    const totalAmount = subtotal + shippingAmount + taxAmount;

    // Atomic stock check + reservation (prevents overselling)
    const stockResult = await checkAndReserveStock(
      items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
    );
    if (!stockResult.ok) {
      const issue = stockResult.issues[0];
      return NextResponse.json(
        {
          error: `${issue.productName} only has ${issue.available_quantity} available (requested ${issue.requested})`,
          code: "INSUFFICIENT_STOCK",
        },
        { status: 409 }
      );
    }

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
        timeline: {
          create: {
            action: "order_created",
            details: "Interac e-Transfer — awaiting payment",
            actor: "customer",
          },
        },
      },
    });

    // Link ProofData records to this order (if saved before checkout)
    for (const item of items) {
      const proofDataId = item.meta?.proofDataId;
      if (proofDataId && typeof proofDataId === "string") {
        try {
          await prisma.proofData.update({
            where: { id: proofDataId },
            data: { orderId: order.id },
          });
        } catch {
          // ProofData may not exist — non-fatal
        }
      }
    }

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
