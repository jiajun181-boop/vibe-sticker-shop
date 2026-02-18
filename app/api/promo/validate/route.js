import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const promoLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { success: allowed } = promoLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
    }

    const now = new Date();
    if ((coupon.validFrom && now < coupon.validFrom) || (coupon.validTo && now > coupon.validTo)) {
      return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
    }

    if (coupon.minAmount && subtotal < coupon.minAmount) {
      return NextResponse.json(
        { error: `Minimum order of $${(coupon.minAmount / 100).toFixed(2)} required` },
        { status: 400 }
      );
    }

    let discountAmount;
    if (coupon.type === "percentage") {
      discountAmount = Math.round(subtotal * (coupon.value / 10000));
    } else {
      discountAmount = Math.min(coupon.value, subtotal);
    }

    return NextResponse.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      description: coupon.description,
    });
  } catch (err) {
    console.error("[Promo validate]", err);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
