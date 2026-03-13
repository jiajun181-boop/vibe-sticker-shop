import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { buildInteracInstructionsHtml } from "@/lib/email/templates/interac-instructions";
import { getSessionFromRequest } from "@/lib/auth";
import { checkAndReserveStock } from "@/lib/inventory";
import { repriceItem, calculateDesignHelpFee } from "@/lib/checkout-reprice";
import { settleOrder, normalizeDeliveryMethod } from "@/lib/settlement";
import { checkoutLimiter, getClientIp } from "@/lib/rate-limit";
import { MAX_ITEM_QUANTITY, DESIGN_HELP_CENTS } from "@/lib/order-config";
import { findActiveProduct, validateCoupon, resolveB2BDiscount } from "@/lib/checkout-shared";
import { applyAutoTags } from "@/lib/auto-tag";

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
  promoCode: z.string().max(50).nullable().optional(),
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

    const { items, email, name, phone, promoCode, deliveryMethod, shippingAddress, shippingCity, shippingProvince, shippingPostal } = result.data;

    // Server-side repricing: same logic as Stripe/Invoice checkout.
    const pricedItems = await Promise.all(
      items.map(async (item) => {
        const product = await findActiveProduct({ productId: item.productId, slug: item.slug });
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

    // Get user session early for B2B discount + order linking
    const session = getSessionFromRequest(req as any);

    // Design help + subtotal (needed for coupon/B2B discount base)
    const { count: designHelpCount, totalCents: designHelpTotal } = calculateDesignHelpFee(pricedItems);
    const itemsSubtotal = pricedItems.reduce((sum, p) => sum + p.lineTotal, 0);
    const subtotal = itemsSubtotal + designHelpTotal;

    // B2B discount: shared resolution (flat % vs per-item rules, picks larger)
    const b2bResult = await resolveB2BDiscount(session?.userId, subtotal, pricedItems);
    const { isB2B, partnerDiscount } = b2bResult;

    // Coupon validation: shared resolution (validates against subtotal incl. design help)
    const { couponData, rejectionReason: couponRejectionReason } = await validateCoupon(promoCode, subtotal);
    if (promoCode && couponRejectionReason) {
      return NextResponse.json(
        { error: couponRejectionReason, code: "COUPON_INVALID" },
        { status: 422 }
      );
    }

    // Settlement: shared computation across Stripe/Invoice/Interac
    const settlement = settleOrder({
      items: pricedItems,
      deliveryMethod: normalizeDeliveryMethod(deliveryMethod),
      couponDiscount: couponData?.discountAmount || 0,
      partnerDiscount,
      isB2B,
    });

    const settledSubtotal = settlement.subtotal;
    const discountAmount = settlement.totalDiscount;
    const shippingAmount = settlement.shippingAmount;
    const taxAmount = settlement.taxAmount;
    const totalAmount = settlement.totalAmount;

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
        productName: designHelpCount > 1
          ? `Design Help Service (\u00d7${designHelpCount})`
          : "Design Help Service",
        productType: "service",
        quantity: designHelpCount,
        unitPrice: DESIGN_HELP_CENTS,
        totalPrice: designHelpTotal,
        meta: { isServiceFee: "true", feeType: "design-help" } as any,
      });
    }

    // NOTE: Coupon usage is NOT incremented here.
    // Interac orders are unpaid at creation — coupon is only consumed when
    // the order status transitions to "paid" (handled in order PATCH API).

    // Create draft order
    const order = await prisma.order.create({
      data: {
        customerEmail: email,
        customerName: name,
        customerPhone: phone || null,
        userId,
        deliveryMethod: normalizeDeliveryMethod(deliveryMethod),
        shippingAddress: shippingAddress || null,
        shippingCity: shippingCity || null,
        shippingProvince: shippingProvince || null,
        shippingPostal: shippingPostal || null,
        subtotalAmount: settledSubtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        status: "pending",
        paymentStatus: "unpaid",
        productionStatus: "not_started",
        ...(couponData && { couponId: couponData.id }),
        tags: [
          "interac_checkout",
          ...(pricedItems.some(p => p.rushApplied) ? ["rush"] : []),
          ...(designHelpTotal > 0 ? ["design-help"] : []),
          ...(couponData ? ["has_coupon"] : []),
        ],
        items: { create: orderItemsData },
        notes: {
          create: {
            authorType: "system",
            isInternal: true,
            message: `Order created via Interac e-Transfer \u2014 awaiting payment${couponData ? ` | Coupon: ${couponData.code} (-$${(couponData.discountAmount / 100).toFixed(2)})` : ""}`,
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

    // Auto-tag order (non-blocking — same as Stripe webhook path)
    applyAutoTags(order.id, prisma).catch(() => {});

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

    // Send instructions email (non-blocking — order already created)
    try {
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
    } catch (emailErr) {
      console.error("[Interac checkout] email send failed:", emailErr);
    }

    return NextResponse.json({ orderId: order.id, totalAmount });
  } catch (err) {
    console.error("[Interac Checkout] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to submit order";
    const status = message.includes("Product unavailable") || message.includes("Product not found") ? 409
      : message.includes("Unable to price") || message.includes("has changed significantly") ? 422
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
