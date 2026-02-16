import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { quoteProduct } from "@/lib/pricing/quote-server.js";
import { checkoutLimiter, getClientIp } from "@/lib/rate-limit";
import {
  buildBaseOriginFromHeaders,
  buildSafeRedirectUrls,
} from "@/lib/checkout-origin";

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
  quantity: z.number().int().positive(),
  meta: MetaSchema.optional(),
});

const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart is empty"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  promoCode: z.string().max(50).nullable().optional(),
});

type ProductWithPricingPreset = Prisma.ProductGetPayload<{
  include: { pricingPreset: true };
}>;

function parseMetaValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text) return value;
  if (text === "null") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
    try {
      return JSON.parse(text);
    } catch {
      return value;
    }
  }
  return value;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

function parseStringArray(value: unknown): string[] {
  const parsed = parseMetaValue(value);
  if (Array.isArray(parsed)) {
    return parsed.map((v) => String(v)).filter((v) => v.length > 0);
  }
  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (!trimmed) return [];
    return [trimmed];
  }
  return [];
}

function parseSizeRows(value: unknown): Array<{ widthIn: number; heightIn: number; quantity: number }> {
  const parsed = parseMetaValue(value);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const width = toNumberOrNull(r.width ?? r.widthIn);
      const height = toNumberOrNull(r.height ?? r.heightIn);
      const quantity = toNumberOrNull(r.quantity);
      if (width == null || height == null || quantity == null) return null;
      if (width <= 0 || height <= 0 || quantity <= 0) return null;
      return { widthIn: width, heightIn: height, quantity: Math.floor(quantity) };
    })
    .filter((r): r is { widthIn: number; heightIn: number; quantity: number } => !!r);
}

function parseNormalizedMeta(meta: Record<string, string | number | boolean> | undefined) {
  const source = meta || {};
  const sizeMode = String(parseMetaValue(source.sizeMode) ?? "single");

  return {
    widthIn: toNumberOrNull(parseMetaValue(source.width)),
    heightIn: toNumberOrNull(parseMetaValue(source.height)),
    material: toStringOrNull(parseMetaValue(source.material)),
    sizeLabel: toStringOrNull(parseMetaValue(source.sizeLabel)),
    addons: parseStringArray(source.addons),
    finishings: parseStringArray(source.finishings),
    names: toNumberOrNull(parseMetaValue(source.names)),
    sizeMode,
    sizeRows: parseSizeRows(source.sizeRows),
  };
}

function splitByChargeType(
  selectedIds: string[],
  defs: Array<{ id: string; type?: string }>
): { flat: string[]; perUnit: string[] } {
  const byId = new Map(defs.map((d) => [String(d.id), d]));
  const flat: string[] = [];
  const perUnit: string[] = [];

  for (const id of selectedIds) {
    const def = byId.get(String(id));
    if ((def?.type || "per_unit") === "flat") flat.push(String(id));
    else perUnit.push(String(id));
  }

  return { flat, perUnit };
}

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

function repriceSingleItem(product: ProductWithPricingPreset, item: z.infer<typeof CartItemSchema>) {
  const meta = parseNormalizedMeta(item.meta);
  const names = meta.names && meta.names > 1 ? Math.floor(meta.names) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const optsCfg = product.optionsConfig as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presetCfg = product.pricingPreset?.config as any;
  const addonDefs: Array<{ id: string; type?: string }> = Array.isArray(optsCfg?.addons)
    ? optsCfg.addons.filter((a: any) => a && typeof a === "object" && "id" in a)
    : [];
  const finishingDefs: Array<{ id: string; type?: string }> = Array.isArray(presetCfg?.finishings)
    ? presetCfg.finishings.filter((f: any) => f && typeof f === "object" && "id" in f)
    : [];

  if (meta.sizeMode === "multi" && meta.sizeRows.length > 0) {
    const addons = splitByChargeType(meta.addons, addonDefs);
    const finishings = splitByChargeType(meta.finishings, finishingDefs);

    let totalCents = 0;
    let totalQty = 0;

    meta.sizeRows.forEach((row, idx) => {
      const body: Record<string, unknown> = {
        quantity: row.quantity,
        widthIn: row.widthIn,
        heightIn: row.heightIn,
      };

      if (meta.material) body.material = meta.material;
      if (meta.sizeLabel) body.sizeLabel = meta.sizeLabel;
      if (names && names > 1) body.names = names;

      const selectedAddons = idx === 0 ? [...addons.perUnit, ...addons.flat] : addons.perUnit;
      const selectedFinishings = idx === 0 ? [...finishings.perUnit, ...finishings.flat] : finishings.perUnit;

      if (selectedAddons.length > 0) body.addons = selectedAddons;
      if (selectedFinishings.length > 0) body.finishings = selectedFinishings;

      const quote = quoteProduct(product, body);
      totalCents += Number(quote.totalCents || 0);
      totalQty += row.quantity;
    });

    if (totalQty <= 0 || totalCents <= 0) {
      throw new Error(`Unable to price item: ${item.name}`);
    }

    const unitAmount = Math.max(1, Math.round(totalCents / totalQty));
    return {
      quantity: totalQty,
      unitAmount,
      lineTotal: unitAmount * totalQty,
      meta,
    };
  }

  const body: Record<string, unknown> = {
    quantity: item.quantity,
  };

  if (meta.widthIn != null) body.widthIn = meta.widthIn;
  if (meta.heightIn != null) body.heightIn = meta.heightIn;
  if (meta.material) body.material = meta.material;
  if (meta.sizeLabel) body.sizeLabel = meta.sizeLabel;
  if (meta.addons.length > 0) body.addons = meta.addons;
  if (meta.finishings.length > 0) body.finishings = meta.finishings;
  if (names && names > 1) body.names = names;

  const quote = quoteProduct(product, body);
  const unitAmount = Number(quote.unitCents || Math.round(Number(quote.totalCents || 0) / item.quantity));

  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    throw new Error(`Unable to price item: ${item.name}`);
  }

  return {
    quantity: item.quantity,
    unitAmount: Math.round(unitAmount),
    lineTotal: Math.round(unitAmount) * item.quantity,
    meta,
  };
}

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

    const { items, successUrl, cancelUrl, promoCode } = result.data;
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

        const repriced = repriceSingleItem(product, item);

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

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    // Validate coupon server-side and create Stripe discount
    let couponData: { id: string; code: string; discountAmount: number; stripeCouponId?: string } | null = null;
    if (promoCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (coupon && coupon.isActive) {
        const now = new Date();
        const isValid = now >= coupon.validFrom && now <= coupon.validTo;
        const hasUsesLeft = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        const meetsMinimum = !coupon.minAmount || subtotal >= coupon.minAmount;

        if (isValid && hasUsesLeft && meetsMinimum) {
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

    const discountAmount = couponData?.discountAmount || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);

    const FREE_SHIPPING_THRESHOLD = 15000;
    const isFreeShipping = afterDiscount >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = isFreeShipping ? 0 : 1500;

    const taxableAmount = afterDiscount + shippingCost;
    const estimatedTax = Math.round(taxableAmount * 0.13);
    const estimatedTotal = afterDiscount + shippingCost + estimatedTax;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = pricedItems.map(
      (item) => {
        const meta = item.meta || {};
        const stripeMeta: Record<string, string> = Object.fromEntries(
          Object.entries(meta).map(([k, v]) => [k, String(v)])
        );

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

    const session = await getStripe().checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      ...(couponData?.stripeCouponId && {
        discounts: [{ coupon: couponData.stripeCouponId }],
      }),

      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["CA"],
      },
      phone_number_collection: { enabled: true },

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingCost,
              currency: process.env.STRIPE_CURRENCY || "cad",
            },
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
          pricedItems.map((item) => ({
            productId: item.productId,
            slug: item.slug,
            name: item.name,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            originalUnitAmount: item.originalUnitAmount,
            priceDrift: item.priceDrift || 0,
            meta: item.meta || null,
          }))
        ),
        subtotalAmount: subtotal.toString(),
        discountAmount: discountAmount.toString(),
        shippingAmount: shippingCost.toString(),
        taxAmount: estimatedTax.toString(),
        totalAmount: estimatedTotal.toString(),
        maxPriceDrift: Math.max(...pricedItems.map((i) => i.priceDrift || 0)).toString(),
        statusToken,
        ...(couponData && {
          couponId: couponData.id,
          couponCode: couponData.code,
        }),
      },
    });

    return NextResponse.json({ url: session.url });
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
