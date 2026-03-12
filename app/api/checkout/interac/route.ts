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
import {
  DESIGN_HELP_CENTS,
  MAX_ITEM_QUANTITY,
} from "@/lib/order-config";
import { resolveB2BPrice } from "@/lib/pricing/b2b-rules";
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

    // Get user session early for B2B discount + order linking
    const session = getSessionFromRequest(req as any);

    // B2B discount: resolve per-item rules for authenticated B2B users
    let partnerDiscount = 0;
    let isB2B = false;
    if (session?.userId) {
      const b2bUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, accountType: true, b2bApproved: true, partnerDiscount: true, companyName: true, partnerTier: true },
      });
      if (b2bUser?.accountType === "B2B" && b2bUser.b2bApproved) {
        isB2B = true;
        const itemsSubtotal = pricedItems.reduce((sum, p) => sum + p.lineTotal, 0);

        const flatDiscount = b2bUser.partnerDiscount > 0
          ? Math.round(itemsSubtotal * (b2bUser.partnerDiscount / 100))
          : 0;

        let rulesDiscount = 0;
        try {
          const ruleResults = await Promise.all(
            pricedItems.map((p) =>
              resolveB2BPrice({
                userId: b2bUser.id,
                companyName: b2bUser.companyName || undefined,
                partnerTier: b2bUser.partnerTier || undefined,
                productId: p.productId,
                productSlug: p.slug,
                quantity: p.quantity,
                retailPriceCents: p.lineTotal,
              })
            )
          );
          for (const r of ruleResults) {
            if (r && r.discountCents > 0) rulesDiscount += r.discountCents;
          }
        } catch {
          // Non-critical
        }

        partnerDiscount = Math.max(flatDiscount, rulesDiscount);
      }
    }

    // Coupon validation (same logic as Stripe/Invoice checkout)
    const itemsSubtotal = pricedItems.reduce((sum, p) => sum + p.lineTotal, 0);
    let couponData: { id: string; code: string; discountAmount: number } | null = null;
    if (promoCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (!coupon || !coupon.isActive) {
        return NextResponse.json(
          { error: "Invalid or inactive promo code", code: "COUPON_INVALID" },
          { status: 422 }
        );
      }
      const now = new Date();
      const isValid = (!coupon.validFrom || now >= coupon.validFrom) && (!coupon.validTo || now <= coupon.validTo);
      const hasUsesLeft = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
      const meetsMinimum = !coupon.minAmount || itemsSubtotal >= coupon.minAmount;

      if (!isValid) {
        return NextResponse.json({ error: "Promo code has expired", code: "COUPON_INVALID" }, { status: 422 });
      } else if (!hasUsesLeft) {
        return NextResponse.json({ error: "Promo code usage limit reached", code: "COUPON_INVALID" }, { status: 422 });
      } else if (!meetsMinimum) {
        return NextResponse.json(
          { error: `Minimum order of $${((coupon.minAmount || 0) / 100).toFixed(2)} required for this promo code`, code: "COUPON_INVALID" },
          { status: 422 }
        );
      } else {
        const discountAmt = coupon.type === "percentage"
          ? Math.round(itemsSubtotal * (coupon.value / 10000))
          : Math.min(coupon.value, itemsSubtotal);
        couponData = { id: coupon.id, code: coupon.code, discountAmount: discountAmt };
      }
    }

    // Settlement: shared computation across Stripe/Invoice/Interac
    const { totalCents: designHelpTotal } = calculateDesignHelpFee(pricedItems);
    const settlement = settleOrder({
      items: pricedItems,
      deliveryMethod: normalizeDeliveryMethod(deliveryMethod),
      couponDiscount: couponData?.discountAmount || 0,
      partnerDiscount,
      isB2B,
    });

    const subtotal = settlement.subtotal;
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
        productName: "Design Help Service",
        productType: "service",
        quantity: 1,
        unitPrice: designHelpTotal,
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
        subtotalAmount: subtotal,
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
          ...(designHelpTotal > 0 ? ["design_help"] : []),
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
