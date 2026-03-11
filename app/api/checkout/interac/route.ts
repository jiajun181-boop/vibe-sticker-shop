import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { buildInteracInstructionsHtml } from "@/lib/email/templates/interac-instructions";
import { getSessionFromRequest } from "@/lib/auth";
import { checkAndReserveStock } from "@/lib/inventory";
import { repriceItem, calculateDesignHelpFee } from "@/lib/checkout-reprice";
import { checkoutLimiter, getClientIp } from "@/lib/rate-limit";
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
  phone: z.string().optional(),
  deliveryMethod: z.enum(["shipping", "pickup"]).default("shipping"),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingProvince: z.string().optional(),
  shippingPostal: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Rate limiting — same as Stripe/Invoice checkout
    const ip = getClientIp(req);
    const { success } = checkoutLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again shortly.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = InteracSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation error", details: result.error.flatten() }, { status: 400 });
    }

    const { items, email, name, phone, deliveryMethod, shippingAddress, shippingCity, shippingProvince, shippingPostal } = result.data;

    // Server-side repricing: same logic as Stripe/Invoice checkout.
    const pricedItems = await Promise.all(
      items.map(async (item) => {
        // findActiveProduct: by ID first, then by slug — same pattern as Stripe/Invoice
        let product = await prisma.product.findFirst({
          where: { id: item.productId, isActive: true },
          include: { pricingPreset: true },
        });
        if (!product && item.slug) {
          product = await prisma.product.findFirst({
            where: { slug: item.slug, isActive: true },
            include: { pricingPreset: true },
          });
        }
        if (!product) {
          throw new Error(`Product unavailable: ${item.name}`);
        }

        const cartItem = { productId: product.id, name: item.name, unitAmount: item.unitAmount, quantity: item.quantity, meta: item.meta, slug: item.slug };
        const repriced = repriceItem(product, cartItem);

        // Price drift detection: reject extreme drift (>20%), warn moderate (>5%)
        const clientUnit = item.unitAmount;
        const serverUnit = repriced.unitAmount;
        if (clientUnit > 0 && serverUnit > 0) {
          const driftPct = Math.round(Math.abs(serverUnit - clientUnit) / clientUnit * 100);
          if (driftPct > 20) {
            throw new Error(
              `Price for "${item.name}" has changed significantly. Please refresh the page and try again.`
            );
          }
          if (driftPct > 5) {
            console.warn("[Interac checkout] Price drift:", {
              slug: product.slug, clientUnit, serverUnit, drift: `${driftPct}%`,
            });
          }
        }

        return { ...item, productId: product.id, ...repriced, productName: String(product.name || item.name) };
      })
    );

    // Design help as flat fee (same logic as Stripe checkout)
    const { totalCents: designHelpTotal } = calculateDesignHelpFee(pricedItems);

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0) + designHelpTotal;
    const isPickup = deliveryMethod === "pickup";
    // Pickup = free, free shipping threshold applies to subtotal (no coupon discount for Interac)
    const isFreeShipping = isPickup || subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingAmount = isFreeShipping ? 0 : SHIPPING_COST;
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
        customerPhone: phone || null,
        userId,
        deliveryMethod: deliveryMethod || "shipping",
        shippingAddress: shippingAddress || null,
        shippingCity: shippingCity || null,
        shippingProvince: shippingProvince || null,
        shippingPostal: shippingPostal || null,
        subtotalAmount: subtotal,
        taxAmount,
        shippingAmount,
        totalAmount,
        status: "pending",
        paymentStatus: "unpaid",
        productionStatus: "not_started",
        tags: [
          "interac_checkout",
          ...(pricedItems.some(p => p.rushApplied) ? ["rush"] : []),
          ...(designHelpTotal > 0 ? ["design_help"] : []),
        ],
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
