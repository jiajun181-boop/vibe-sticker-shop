import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { repriceItem, calculateDesignHelpFee } from "@/lib/checkout-reprice";
import { checkoutLimiter, getClientIp } from "@/lib/rate-limit";
import { getUserFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { buildInvoiceConfirmationHtml } from "@/lib/email/templates/invoice-confirmation";
import { checkAndReserveStock } from "@/lib/inventory";
import { HST_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST, DESIGN_HELP_CENTS, MAX_ITEM_QUANTITY } from "@/lib/order-config";

const MetaSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

const CartItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  unitAmount: z.number().int().nonnegative(),
  quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY),
  meta: MetaSchema.optional(),
});

const InvoiceCheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart is empty"),
  companyName: z.string().nullable().optional(),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  poNumber: z.string().nullable().optional(),
  paymentTerms: z.enum(["net15", "net30", "net45"]).default("net30"),
  notes: z.string().nullable().optional(),
  promoCode: z.string().max(50).nullable().optional(),
  deliveryMethod: z.enum(["shipping", "pickup"]).default("shipping"),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingProvince: z.string().optional(),
  shippingPostal: z.string().optional(),
});

type CartItem = z.infer<typeof CartItemSchema>;

async function findActiveProduct(item: CartItem) {
  const byId = await prisma.product.findFirst({
    where: { id: item.productId, isActive: true },
    include: { pricingPreset: true },
  });
  if (byId) return byId;
  return prisma.product.findFirst({
    where: { slug: item.slug, isActive: true },
    include: { pricingPreset: true },
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success } = checkoutLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again shortly.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = InvoiceCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getUserFromRequest(req);
    const { items, companyName, contactName, email, phone, poNumber, paymentTerms, notes, promoCode, deliveryMethod, shippingAddress, shippingCity, shippingProvince, shippingPostal } = parsed.data;

    // Server-side repricing: same shared logic as Stripe/Interac checkout.
    // repriceItem() handles base pricing + rush surcharge via RUSH_MULTIPLIER.
    const pricedItems = await Promise.all(
      items.map(async (item) => {
        const product = await findActiveProduct(item);
        if (!product) throw new Error(`Product unavailable: ${item.name}`);

        const cartItem = {
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          unitAmount: item.unitAmount,
          quantity: item.quantity,
          meta: item.meta,
        };
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
            console.warn("[Invoice checkout] Price drift:", {
              slug: product.slug, clientUnit, serverUnit, drift: `${driftPct}%`,
            });
          }
        }

        return {
          product,
          item,
          repriced,
          meta: item.meta || {},
        };
      })
    );

    // Design help: flat fee per line item (same as Stripe/Interac)
    const { count: designHelpCount, totalCents: designHelpTotal } = calculateDesignHelpFee(pricedItems);

    const itemsSubtotal = pricedItems.reduce((sum, p) => sum + p.repriced.lineTotal, 0);
    const subtotalAmount = itemsSubtotal + designHelpTotal;

    // Coupon validation (same logic as Stripe checkout)
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
      const meetsMinimum = !coupon.minAmount || subtotalAmount >= coupon.minAmount;

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
        const discountAmount = coupon.type === "percentage"
          ? Math.round(subtotalAmount * (coupon.value / 10000))
          : Math.min(coupon.value, subtotalAmount);

        couponData = { id: coupon.id, code: coupon.code, discountAmount };
      }
    }

    // Cap discount at subtotal to prevent negative amounts
    const discountAmount = Math.min(couponData?.discountAmount || 0, subtotalAmount);
    const afterDiscount = subtotalAmount - discountAmount;
    const shippingAmount = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const taxAmount = Math.round((afterDiscount + shippingAmount) * HST_RATE);
    const totalAmount = afterDiscount + shippingAmount + taxAmount;

    // Atomic stock check + reservation (prevents overselling)
    const stockResult = await checkAndReserveStock(
      pricedItems.map(({ product, repriced }) => ({
        productId: product!.id,
        quantity: repriced.quantity,
      }))
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

    // Build order items
    const orderItemsData = pricedItems.map(({ product, item, repriced }) => ({
      productId: product!.id as string | null,
      productName: product!.name || item.name,
      productType: product!.type,
      quantity: repriced.quantity,
      unitPrice: repriced.unitAmount,
      totalPrice: repriced.lineTotal,
      meta: item.meta || null,
    }));

    // Design help as separate order item (same pattern as Interac checkout)
    if (designHelpTotal > 0) {
      orderItemsData.push({
        productId: null,
        productName: designHelpCount > 1
          ? `Design Help Service (\u00d7${designHelpCount})`
          : "Design Help Service",
        productType: "service",
        quantity: 1,
        unitPrice: designHelpTotal,
        totalPrice: designHelpTotal,
        meta: { isServiceFee: "true", feeType: "design-help" } as any,
      });
    }

    // Increment coupon usage if applicable
    if (couponData) {
      await prisma.coupon.update({
        where: { id: couponData.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const isPickup = deliveryMethod === "pickup";
    const created = await prisma.order.create({
      data: {
        customerEmail: email,
        customerName: contactName,
        customerPhone: phone || null,
        userId: user?.id || null,
        deliveryMethod: deliveryMethod || "shipping",
        shippingAddress: shippingAddress || null,
        shippingCity: shippingCity || null,
        shippingProvince: shippingProvince || null,
        shippingPostal: shippingPostal || null,
        subtotalAmount,
        discountAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        status: "pending",
        paymentStatus: "unpaid",
        productionStatus: "not_started",
        ...(couponData && { couponId: couponData.id }),
        tags: [
          "invoice_checkout",
          paymentTerms,
          ...(poNumber ? ["has_po"] : []),
          ...(pricedItems.some(p => p.repriced.rushApplied) ? ["rush"] : []),
          ...(designHelpTotal > 0 ? ["design_help"] : []),
        ],
        notes: {
          create: [
            {
              authorType: "staff",
              isInternal: true,
              message: `Invoice checkout request${companyName ? ` | Company: ${companyName}` : ""}${poNumber ? ` | PO: ${poNumber}` : ""}${couponData ? ` | Coupon: ${couponData.code} (-$${(couponData.discountAmount / 100).toFixed(2)})` : ""}${notes ? ` | Notes: ${notes}` : ""}`,
            },
          ],
        },
        timeline: {
          create: [
            {
              action: "Invoice checkout requested",
              details: `Terms ${paymentTerms.toUpperCase()}${poNumber ? ` | PO ${poNumber}` : ""}`,
              actor: "customer",
            },
            {
              action: "Awaiting payment",
              details: `Payment terms: ${paymentTerms.toUpperCase()}`,
              actor: "system",
            },
          ],
        },
        items: {
          create: orderItemsData,
        },
      },
      select: { id: true, customerEmail: true, totalAmount: true },
    });

    // Send confirmation email (non-blocking)
    try {
      const orderWithItems = await prisma.order.findUnique({
        where: { id: created.id },
        include: { items: true },
      });
      const html = buildInvoiceConfirmationHtml({
        orderId: created.id,
        customerName: contactName,
        companyName: companyName || null,
        totalAmount: created.totalAmount,
        paymentTerms,
        items: (orderWithItems?.items || []).map((i: any) => ({
          name: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      await sendEmail({
        to: email,
        subject: `Invoice Order Received — #${created.id.slice(0, 8)}`,
        html,
        template: "invoice-confirmation",
        orderId: created.id,
      });
    } catch (emailErr) {
      console.error("[Invoice checkout] email send failed:", emailErr);
    }

    return NextResponse.json({
      ok: true,
      orderId: created.id,
      totalAmount: created.totalAmount,
      customerEmail: created.customerEmail,
    });
  } catch (error) {
    console.error("[Invoice checkout] error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit invoice order";
    const status = message.includes("Product unavailable") ? 409
      : message.includes("Unable to price") ? 422
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
