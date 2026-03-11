import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { repriceItem, calculateDesignHelpFee } from "@/lib/checkout-reprice";
import { checkoutLimiter, getClientIp } from "@/lib/rate-limit";
import {
  buildBaseOriginFromHeaders,
  buildSafeRedirectUrls,
} from "@/lib/checkout-origin";
import { getSessionFromRequest } from "@/lib/auth";
import { checkAndReserveStock } from "@/lib/inventory";
import {
  HST_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST,
  RUSH_MULTIPLIER, DESIGN_HELP_CENTS, MAX_ITEM_QUANTITY,
} from "@/lib/order-config";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

const MetaSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

const CartItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  unitAmount: z.number().int().nonnegative(),
  quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY, `Quantity must be ≤ ${MAX_ITEM_QUANTITY.toLocaleString()}`),
  meta: MetaSchema.optional(),
});

const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart is empty"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  promoCode: z.string().max(50).nullable().optional(),
  shippingMethod: z.enum(["delivery", "pickup"]).optional(),
});

// ProductWithPricingPreset type moved to lib/checkout-reprice.ts

// Meta parsing and repricing helpers are in lib/checkout-reprice.ts

async function findActiveProduct(item: z.infer<typeof CartItemSchema>) {
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

// repriceSingleItem is now repriceItem() from lib/checkout-reprice.ts

export async function POST(req: Request) {
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

    const result = CheckoutSchema.safeParse(body);

    if (!result.success) {
      const isEmptyCart = result.error.issues.some(
        (issue) => issue.path[0] === "items" && issue.code === "too_small"
      );
      return NextResponse.json(
        {
          error: "Validation Error",
          code: isEmptyCart ? "EMPTY_CART" : "VALIDATION_ERROR",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { items, successUrl, cancelUrl, promoCode, shippingMethod } = result.data;
    const isPickup = shippingMethod === "pickup";
    const baseOrigin = buildBaseOriginFromHeaders(
      req.headers,
      process.env.NEXT_PUBLIC_SITE_URL
    );
    const statusToken = crypto.randomBytes(16).toString("hex");
    const { safeSuccessUrl, safeCancelUrl } = buildSafeRedirectUrls({
      successUrl,
      cancelUrl,
      baseOrigin,
      statusToken,
    });

    const pricedItems = await Promise.all(
      items.map(async (item) => {
        const product = await findActiveProduct(item);
        if (!product) {
          throw new Error(`Product unavailable: ${item.name}`);
        }

        // repriceItem: server-side pricing + automatic rush surcharge application
        const cartItem = { productId: item.productId, slug: item.slug, name: item.name, unitAmount: item.unitAmount, quantity: item.quantity, meta: item.meta };
        const repriced = repriceItem(product, cartItem);

        // Log price drift between client and server for audit
        const clientUnit = item.unitAmount;
        const serverUnit = repriced.unitAmount;
        if (clientUnit > 0 && serverUnit > 0) {
          const driftPct = Math.round(Math.abs(serverUnit - clientUnit) / clientUnit * 100);
          if (driftPct > 5) {
            console.warn("[Checkout] Price drift:", {
              slug: product.slug,
              clientUnit,
              serverUnit,
              drift: `${driftPct}%`,
            });
          }
        }

        return {
          productId: String(product.id),
          slug: String(product.slug),
          name: String(product.name || item.name),
          quantity: repriced.quantity,
          unitAmount: repriced.unitAmount,
          lineTotal: repriced.lineTotal,
          meta: item.meta || {},
          originalUnitAmount: item.unitAmount,
          priceDrift: clientUnit > 0 ? Math.round(Math.abs(serverUnit - clientUnit) / clientUnit * 100) : 0,
        };
      })
    );

    // Design help: flat $45 per line item that requested it.
    // Added as a separate Stripe line item (not baked into unit price)
    // so it appears clearly on the receipt and tax is calculated correctly.
    const { count: designHelpCount, totalCents: designHelpTotal } = calculateDesignHelpFee(pricedItems);

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0) + designHelpTotal;

    // Atomic stock check + reservation (prevents TOCTOU race conditions)
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

    // Partner discount — auto-applied for B2B partners
    let partnerDiscount = 0;
    let partnerUserId: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = getSessionFromRequest(req as any);
    if (session?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, accountType: true, b2bApproved: true, partnerDiscount: true },
      });
      if (user?.accountType === "B2B" && user.b2bApproved && user.partnerDiscount > 0) {
        partnerDiscount = Math.round(subtotal * (user.partnerDiscount / 100));
        partnerUserId = user.id;
      }
    }

    // Validate coupon server-side and create Stripe discount
    let couponData: { id: string; code: string; discountAmount: number; stripeCouponId?: string } | null = null;
    let couponRejectionReason: string | null = null;
    if (promoCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (!coupon || !coupon.isActive) {
        couponRejectionReason = "Invalid or inactive promo code";
      } else {
        const now = new Date();
        const isValid = (!coupon.validFrom || now >= coupon.validFrom) && (!coupon.validTo || now <= coupon.validTo);
        const hasUsesLeft = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        const meetsMinimum = !coupon.minAmount || subtotal >= coupon.minAmount;

        if (!isValid) {
          couponRejectionReason = "Promo code has expired";
        } else if (!hasUsesLeft) {
          couponRejectionReason = "Promo code usage limit reached";
        } else if (!meetsMinimum) {
          couponRejectionReason = `Minimum order of $${((coupon.minAmount || 0) / 100).toFixed(2)} required for this promo code`;
        } else {
          const discountAmount = coupon.type === "percentage"
            ? Math.round(subtotal * (coupon.value / 10000))
            : Math.min(coupon.value, subtotal);

          // Create a one-time Stripe coupon for this checkout
          const stripeCoupon = coupon.type === "percentage"
            ? await getStripe().coupons.create({
                percent_off: coupon.value / 100,
                duration: "once",
                name: coupon.code,
              })
            : await getStripe().coupons.create({
                amount_off: discountAmount,
                currency: process.env.STRIPE_CURRENCY || "cad",
                duration: "once",
                name: coupon.code,
              });

          couponData = {
            id: coupon.id,
            code: coupon.code,
            discountAmount,
            stripeCouponId: stripeCoupon.id,
          };
        }
      }
    }

    // If coupon was provided but rejected, return error to client
    if (promoCode && couponRejectionReason) {
      return NextResponse.json(
        { error: couponRejectionReason, code: "COUPON_INVALID" },
        { status: 422 }
      );
    }

    const couponDiscount = couponData?.discountAmount || 0;
    // Cap total discount at subtotal to prevent negative amounts
    const discountAmount = Math.min(couponDiscount + partnerDiscount, subtotal);
    const afterDiscount = subtotal - discountAmount;

    const isFreeShipping = isPickup || afterDiscount >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = isFreeShipping ? 0 : SHIPPING_COST;

    // Tax is calculated by Stripe's automatic_tax; this estimate is for metadata only
    const taxableAmount = afterDiscount + shippingCost;
    const estimatedTax = Math.round(taxableAmount * HST_RATE);
    const estimatedTotal = afterDiscount + shippingCost + estimatedTax;

    // Keys that can exceed Stripe's 500-char metadata value limit
    const LARGE_META_KEYS = new Set([
      "contourSvg", "bleedSvg", "templateData", "contourPoints", "bleedPoints",
    ]);

    // --- Intake field extraction ---
    // These fields describe the customer's artwork/design intent and production urgency.
    // They originate from the configurator UI and are stringified by normalizeCheckoutMeta.
    // We extract them explicitly so downstream systems (webhook → order, preflight, auto-tag)
    // can rely on consistent, well-documented keys rather than opaque meta pass-through.
    //
    //   intakeMode      — "upload-required" | "upload-optional" | "editor-built-in"
    //                     Describes whether the product requires artwork upload.
    //   artworkIntent   — "upload-later" | "design-help" | null
    //                     What the customer chose to do about artwork at checkout time.
    //   designHelp      — "true" | "false"
    //                     Whether the customer opted into the $45 design help service.
    //   designHelpFee   — e.g. "4500" (cents) — the fee charged for design help.
    //   rushProduction   — "true" | "false"
    //                     Whether the customer requested rush production (30% surcharge).

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = pricedItems.map(
      (item) => {
        const meta = item.meta || {};
        // Strip large fields to prevent Stripe 500-char limit errors
        const stripeMeta: Record<string, string> = {};
        for (const [k, v] of Object.entries(meta)) {
          if (LARGE_META_KEYS.has(k)) continue;
          const s = String(v);
          if (s.length > 490) continue; // Safety: skip any unexpectedly large value
          stripeMeta[k] = s;
        }

        // Ensure intake fields are explicitly present as strings in Stripe metadata.
        // normalizeCheckoutMeta already stringifies, but we set explicit defaults
        // so these keys are always present (never silently absent).
        //
        // intakeMode defaults to "upload-optional" — safest for a print shop because
        // it means "customer can send artwork later" rather than silently empty.
        const rawIntakeMode = String(meta.intakeMode ?? "").trim();
        stripeMeta.intakeMode = rawIntakeMode || "upload-optional";

        const rawArtworkIntent = String(meta.artworkIntent ?? "").trim();
        stripeMeta.artworkIntent = rawArtworkIntent || "";

        if (!("designHelp" in stripeMeta))    stripeMeta.designHelp    = String(meta.designHelp ?? "false");
        if (!("designHelpFee" in stripeMeta)) stripeMeta.designHelpFee = String(meta.designHelpFee ?? "0");

        const rawRush = String(meta.rushProduction ?? "false").trim();
        stripeMeta.rushProduction = rawRush === "true" ? "true" : "false";

        // Rush surcharge is now re-applied server-side (after repriceSingleItem).
        // Tag verification status so admin/webhook can audit.
        if (stripeMeta.rushProduction === "true") {
          stripeMeta.rushVerified = "server";
        }

        // Derive artworkStatus so downstream systems (webhook, preflight, auto-tag)
        // know at a glance whether artwork was provided, pending, or needs design help.
        const hasArtwork = Boolean(
          meta.artworkUrl || meta.fileUrl || meta.uploadedFileUrl
        );
        if (hasArtwork) {
          stripeMeta.artworkStatus = "uploaded";
        } else if (rawArtworkIntent === "upload-later") {
          stripeMeta.artworkStatus = "pending";
        } else if (rawArtworkIntent === "design-help") {
          stripeMeta.artworkStatus = "design-help";
        } else {
          stripeMeta.artworkStatus = "none";
        }

        return {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || "cad",
            product_data: {
              name: item.name,
              metadata: {
                productId: String(item.productId),
                slug: String(item.slug),
                ...stripeMeta,
              },
            },
            unit_amount: item.unitAmount,
            tax_behavior: "exclusive",
          },
          quantity: item.quantity,
        };
      }
    );

    // Design help: add as explicit Stripe line item so it appears on the receipt
    if (designHelpTotal > 0) {
      line_items.push({
        price_data: {
          currency: process.env.STRIPE_CURRENCY || "cad",
          product_data: {
            name: designHelpCount > 1
              ? `Design Help Service (\u00d7${designHelpCount})`
              : "Design Help Service",
          },
          unit_amount: DESIGN_HELP_CENTS,
          tax_behavior: "exclusive" as const,
        },
        quantity: designHelpCount,
      });
    }

    // Create Stripe coupon for partner discount (if applicable and no coupon already)
    let partnerStripeCouponId: string | undefined;
    if (partnerDiscount > 0) {
      const partnerStripeCoupon = await getStripe().coupons.create({
        amount_off: partnerDiscount,
        currency: process.env.STRIPE_CURRENCY || "cad",
        duration: "once",
        name: "Partner Discount",
      });
      partnerStripeCouponId = partnerStripeCoupon.id;
    }

    // Build discounts array (Stripe allows multiple)
    const stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (couponData?.stripeCouponId) stripeDiscounts.push({ coupon: couponData.stripeCouponId });
    if (partnerStripeCouponId) stripeDiscounts.push({ coupon: partnerStripeCouponId });

    const stripeSession = await getStripe().checkout.sessions.create({
      line_items,
      mode: "payment",
      payment_method_types: ["card", "link"],
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      ...(stripeDiscounts.length > 0 && { discounts: stripeDiscounts }),

      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["CA"],
      },
      phone_number_collection: { enabled: true },

      shipping_options: isPickup
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 0, currency: process.env.STRIPE_CURRENCY || "cad" },
                display_name: "Store Pickup — FREE",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 2 },
                  maximum: { unit: "business_day", value: 3 },
                },
                tax_behavior: "exclusive",
              },
            },
          ]
        : [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: shippingCost, currency: process.env.STRIPE_CURRENCY || "cad" },
                display_name: isFreeShipping ? "Free Shipping" : "Standard Shipping",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 3 },
                  maximum: { unit: "business_day", value: 5 },
                },
                tax_behavior: "exclusive",
              },
            },
          ],

      automatic_tax: { enabled: true },

      metadata: {
        items: JSON.stringify(
          pricedItems.map((item) => {
            // Strip large fields from session metadata to stay under Stripe 8KB limit
            let safeMeta: Record<string, string | number | boolean> | null = item.meta || null;
            if (safeMeta && typeof safeMeta === "object") {
              const cleaned: Record<string, string | number | boolean> = {};
              for (const [k, v] of Object.entries(safeMeta)) {
                if (LARGE_META_KEYS.has(k)) continue;
                if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                  cleaned[k] = v;
                }
              }
              safeMeta = cleaned;
            }
            return {
              productId: item.productId,
              slug: item.slug,
              name: item.name,
              quantity: item.quantity,
              unitAmount: item.unitAmount,
              originalUnitAmount: item.originalUnitAmount,
              priceDrift: item.priceDrift || 0,
              meta: safeMeta,
            };
          })
        ),
        subtotalAmount: subtotal.toString(),
        discountAmount: discountAmount.toString(),
        shippingAmount: shippingCost.toString(),
        taxAmount: estimatedTax.toString(),
        totalAmount: estimatedTotal.toString(),
        maxPriceDrift: Math.max(...pricedItems.map((i) => i.priceDrift || 0)).toString(),
        ...(designHelpTotal > 0 && { designHelpTotal: designHelpTotal.toString() }),
        statusToken,
        // Order-wide intake flags — summarized from all items for quick admin visibility.
        // "true" if ANY item in the order has the flag set.
        hasDesignHelp: pricedItems.some((i) => {
          const m = i.meta || {};
          return m.designHelp === true || m.designHelp === "true";
        }).toString(),
        hasRushProduction: pricedItems.some((i) => {
          const m = i.meta || {};
          return m.rushProduction === true || m.rushProduction === "true";
        }).toString(),
        hasUploadLater: pricedItems.some((i) => {
          const m = i.meta || {};
          return m.artworkIntent === "upload-later";
        }).toString(),
        ...(couponData && {
          couponId: couponData.id,
          couponCode: couponData.code,
        }),
        ...(partnerUserId && {
          partnerUserId,
          partnerDiscount: partnerDiscount.toString(),
        }),
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout Error:", error);
    if (error instanceof Error && error.message.includes("Redirect URLs")) {
      return NextResponse.json(
        { error: "Invalid redirect URL", code: "INVALID_REDIRECT_URL" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("Product unavailable")) {
      return NextResponse.json(
        { error: error.message, code: "PRODUCT_UNAVAILABLE" },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message.includes("Unable to price item")) {
      return NextResponse.json(
        { error: `${error.message}. Please refresh cart and try again.`, code: "PRICE_RECALC_FAILED" },
        { status: 422 }
      );
    }
    if (error instanceof Error && error.message.includes("Dimensions must be > 0")) {
      return NextResponse.json(
        { error: "Some items are missing size info. Please open product page and reselect options.", code: "MISSING_DIMENSIONS" },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "CHECKOUT_ERROR" },
      { status: 500 }
    );
  }
}
