// app/api/quote/route.js
// POST /api/quote — compute a price quote for a product.
// Input:  { slug, quantity, widthIn?, heightIn?, material?, sizeLabel?, addons? }
// Output: { totalCents, currency, breakdown[], meta, unitCents }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeQuote, normalizeInput } from "@/lib/pricing";
import { validateDimensions } from "@/lib/materialLimits";

export async function POST(req) {
  try {
    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    // Look up product + preset
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { pricingPreset: true },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Normalize input
    const input = normalizeInput(body);

    // Material-limits validation (for area-based products)
    if (input.widthIn != null && input.heightIn != null) {
      const dimCheck = validateDimensions(
        input.widthIn,
        input.heightIn,
        input.material || null,
        product
      );
      if (!dimCheck.valid) {
        return NextResponse.json(
          { error: "Dimension validation failed", details: dimCheck.errors },
          { status: 422 }
        );
      }
    }

    // If product has a pricing preset, use the engine
    if (product.pricingPreset) {
      const result = computeQuote(product.pricingPreset, input);
      return NextResponse.json({
        ...result,
        unitCents: Math.round(result.totalCents / input.quantity),
      });
    }

    // Fallback: use legacy basePrice + simple tier discounts
    const qty = input.quantity;
    let discount = 1;
    if (qty >= 1000) discount = 0.82;
    else if (qty >= 500) discount = 0.88;
    else if (qty >= 250) discount = 0.93;
    else if (qty >= 100) discount = 0.97;

    const isPerSqft = product.pricingUnit === "per_sqft";
    let unitCents;
    if (isPerSqft && input.widthIn && input.heightIn) {
      const sqft = (input.widthIn * input.heightIn) / 144;
      unitCents = Math.max(1, Math.round(product.basePrice * sqft * discount));
    } else {
      unitCents = Math.max(1, Math.round(product.basePrice * discount));
    }

    const totalCents = unitCents * qty;

    return NextResponse.json({
      totalCents,
      currency: "CAD",
      breakdown: [
        {
          label: `${qty} pcs @ ${(unitCents / 100).toFixed(2)}/ea (legacy pricing)`,
          amount: totalCents,
        },
      ],
      meta: { model: "LEGACY", discount },
      unitCents,
    });
  } catch (err) {
    console.error("[/api/quote]", err);
    return NextResponse.json(
      { error: err.message || "Quote calculation failed" },
      { status: 400 }
    );
  }
}
