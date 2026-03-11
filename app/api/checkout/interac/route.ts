import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { buildInteracInstructionsHtml } from "@/lib/email/templates/interac-instructions";
import { getSessionFromRequest } from "@/lib/auth";
import { checkAndReserveStock } from "@/lib/inventory";
import { repriceItem, calculateDesignHelpFee } from "@/lib/checkout-reprice";
import {
  HST_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST, DESIGN_HELP_CENTS,
  MAX_ITEM_QUANTITY,
} from "@/lib/order-config";

const InteracSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    slug: z.string().optional(),
    name: z.string(),
    quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY),
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

    // Server-side repricing: same logic as Stripe checkout.
    // Recalculate each item's price using quoteProduct + rush surcharge.
    const pricedItems = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findFirst({
          where: { id: item.productId, isActive: true },
          include: { pricingPreset: true },
        });
        if (!product) {
          // Fallback: try by slug
          const bySlug = item.slug
            ? await prisma.product.findFirst({
                where: { slug: item.slug, isActive: true },
                include: { pricingPreset: true },
              })
            : null;
          if (!bySlug) {
            throw new Error(`Product not found or inactive: ${item.name}`);
          }
          const cartItem = { productId: bySlug.id, name: item.name, unitAmount: item.unitAmount, quantity: item.quantity, meta: item.meta, slug: item.slug };
          const repriced = repriceItem(bySlug, cartItem);
          return { ...item, productId: bySlug.id, ...repriced, productName: String(bySlug.name || item.name) };
        }
        const cartItem = { productId: item.productId, name: item.name, unitAmount: item.unitAmount, quantity: item.quantity, meta: item.meta, slug: item.slug };
        const repriced = repriceItem(product, cartItem);
        return { ...item, ...repriced, productName: String(product.name || item.name) };
      })
    );

    // Design help as flat fee (same logic as Stripe checkout)
    const { totalCents: designHelpTotal } = calculateDesignHelpFee(pricedItems);

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0) + designHelpTotal;
    const shippingAmount = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const taxAmount = Math.round((subtotal + shippingAmount) * HST_RATE);
    const totalAmount = subtotal + shippingAmount + taxAmount;

    // Atomic stock check + reservation (prevents overselling)
    const stockResult = await checkAndReserveStock(
      pricedItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
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

    // Build order items data
    const orderItemsData = pricedItems.map((item) => ({
      productId: item.productId as string | null,
      productName: item.productName,
      productType: "custom" as string,
      quantity: item.quantity,
      unitPrice: item.unitAmount,
      totalPrice: item.lineTotal,
      meta: item.meta || undefined,
    }));

    // Add design help as a separate order item (if applicable)
    if (designHelpTotal > 0) {
      orderItemsData.push({
        productId: null,
        productName: "Design Help Service",
        productType: "service",
        quantity: 1,
        unitPrice: designHelpTotal,
        totalPrice: designHelpTotal,
        meta: { isServiceFee: "true", feeType: "design-help" } as any,
      });
    }

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
        items: { create: orderItemsData },
        notes: {
          create: {
            authorType: "system",
            isInternal: true,
            message: "Order created via Interac e-Transfer \u2014 awaiting payment",
          },
        },
        timeline: {
          create: {
            action: "order_created",
            details: "Interac e-Transfer \u2014 awaiting payment",
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
      subject: `Interac e-Transfer Instructions \u2014 Order #${order.id.slice(0, 8)}`,
      html,
      template: "interac-instructions",
      orderId: order.id,
    });

    return NextResponse.json({ orderId: order.id, totalAmount });
  } catch (err) {
    console.error("[Interac Checkout] Error:", err);
    if (err instanceof Error && err.message.includes("Product not found")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message.includes("Unable to price")) {
      return NextResponse.json(
        { error: `${err.message}. Please refresh and try again.` },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
