/**
 * lib/checkout-shared.ts — Shared pre-settlement helpers for all checkout paths.
 *
 * Extracts duplicated coupon validation, B2B discount resolution, and product
 * lookup logic so Stripe, Invoice, and Interac routes converge on one truth
 * before calling settleOrder().
 *
 * Does NOT handle: Stripe API calls, order creation, email sending.
 */

import { prisma } from "@/lib/prisma";
import { resolveB2BPrice } from "@/lib/pricing/b2b-rules";

// ── Types ───────────────────────────────────────────────────────

export interface CouponResult {
  id: string;
  code: string;
  discountAmount: number;
}

export interface CouponValidationResult {
  couponData: CouponResult | null;
  rejectionReason: string | null;
}

export interface B2BDiscountResult {
  isB2B: boolean;
  partnerDiscount: number;
  partnerUserId: string | null;
  b2bSource: "flat" | "rules" | null;
}

export interface PricedItemForB2B {
  productId: string;
  slug?: string;
  quantity: number;
  lineTotal: number;
}

// ── Product Lookup ──────────────────────────────────────────────

/**
 * Find an active product by ID first, then by slug as fallback.
 * Includes pricingPreset for repricing.
 */
export async function findActiveProduct(item: { productId: string; slug?: string }) {
  const byId = await prisma.product.findFirst({
    where: { id: item.productId, isActive: true },
    include: { pricingPreset: true },
  });
  if (byId) return byId;

  if (item.slug) {
    return prisma.product.findFirst({
      where: { slug: item.slug, isActive: true },
      include: { pricingPreset: true },
    });
  }
  return null;
}

// ── Coupon Validation ───────────────────────────────────────────

/**
 * Validate a promo code and compute the discount amount.
 *
 * @param promoCode - The promo code string (null/undefined = no coupon)
 * @param subtotal  - The subtotal in cents (items + design help) against which
 *                    the coupon minimum and discount are calculated.
 *                    IMPORTANT: this must include design help fees for consistency.
 * @returns couponData (if valid) or rejectionReason (if invalid)
 */
export async function validateCoupon(
  promoCode: string | null | undefined,
  subtotal: number
): Promise<CouponValidationResult> {
  if (!promoCode) {
    return { couponData: null, rejectionReason: null };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: promoCode.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    return { couponData: null, rejectionReason: "Invalid or inactive promo code" };
  }

  const now = new Date();
  const isValid =
    (!coupon.validFrom || now >= coupon.validFrom) &&
    (!coupon.validTo || now <= coupon.validTo);
  const hasUsesLeft = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
  const meetsMinimum = !coupon.minAmount || subtotal >= coupon.minAmount;

  if (!isValid) {
    return { couponData: null, rejectionReason: "Promo code has expired" };
  }
  if (!hasUsesLeft) {
    return { couponData: null, rejectionReason: "Promo code usage limit reached" };
  }
  if (!meetsMinimum) {
    return {
      couponData: null,
      rejectionReason: `Minimum order of $${((coupon.minAmount || 0) / 100).toFixed(2)} required for this promo code`,
    };
  }

  const discountAmount =
    coupon.type === "percentage"
      ? Math.round(subtotal * (coupon.value / 10000))
      : Math.min(coupon.value, subtotal);

  return {
    couponData: { id: coupon.id, code: coupon.code, discountAmount },
    rejectionReason: null,
  };
}

// ── B2B Discount Resolution ─────────────────────────────────────

/**
 * Resolve B2B/partner discount for an authenticated user.
 *
 * Two sources: (1) flat user.partnerDiscount %, (2) per-item B2B price rules.
 * Uses whichever yields the larger discount for the customer.
 *
 * @param userId  - The authenticated user ID (null = guest, returns zero discount)
 * @param subtotal - The subtotal in cents (items + design help) for flat % calculation.
 *                   IMPORTANT: this must include design help fees for consistency.
 * @param items   - The repriced items for per-item B2B rules lookup.
 */
export async function resolveB2BDiscount(
  userId: string | null | undefined,
  subtotal: number,
  items: PricedItemForB2B[]
): Promise<B2BDiscountResult> {
  const noDiscount: B2BDiscountResult = {
    isB2B: false,
    partnerDiscount: 0,
    partnerUserId: null,
    b2bSource: null,
  };

  if (!userId) return noDiscount;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accountType: true,
      b2bApproved: true,
      partnerDiscount: true,
      companyName: true,
      partnerTier: true,
    },
  });

  if (!user || user.accountType !== "B2B" || !user.b2bApproved) {
    return noDiscount;
  }

  // (1) Flat partner discount from user profile
  const flatDiscount =
    user.partnerDiscount > 0
      ? Math.round(subtotal * (user.partnerDiscount / 100))
      : 0;

  // (2) Per-item B2B rules discount
  let rulesDiscount = 0;
  try {
    const ruleResults = await Promise.all(
      items.map((item) =>
        resolveB2BPrice({
          userId: user.id,
          companyName: user.companyName || undefined,
          partnerTier: user.partnerTier || undefined,
          productId: item.productId,
          productSlug: item.slug,
          quantity: item.quantity,
          retailPriceCents: item.lineTotal,
        })
      )
    );
    for (const r of ruleResults) {
      if (r && r.discountCents > 0) rulesDiscount += r.discountCents;
    }
  } catch {
    // Non-critical: if rules lookup fails, fall back to flat discount
  }

  // Use whichever is larger for the customer
  let partnerDiscount = 0;
  let b2bSource: "flat" | "rules" | null = null;
  if (rulesDiscount > flatDiscount) {
    partnerDiscount = rulesDiscount;
    b2bSource = "rules";
  } else if (flatDiscount > 0) {
    partnerDiscount = flatDiscount;
    b2bSource = "flat";
  }

  return {
    isB2B: true,
    partnerDiscount,
    partnerUserId: user.id,
    b2bSource,
  };
}
