import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quoteProduct } from "@/lib/pricing/quote-server.js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { pricingPreset: true },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const result = quoteProduct(product, body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/quote]", err);
    const status = typeof err?.status === "number" ? err.status : 400;
    const payload = { error: err?.message || "Quote calculation failed" };
    if (err?.details) payload.details = err.details;
    return NextResponse.json(payload, { status });
  }
}
