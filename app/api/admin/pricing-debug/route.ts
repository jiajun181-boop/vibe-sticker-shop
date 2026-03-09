import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice } from "@/lib/pricing/template-resolver";
import { requirePermission } from "@/lib/admin-auth";

/**
 * POST /api/admin/pricing-debug
 * Calls the production pricing engine and returns the full QuoteLedger.
 * Admin-only — identical path as front-end pricing, but returns extra debug info.
 */
export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "products", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    const { slug, quantity, widthIn, heightIn, material, sizeLabel, options } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { pricingPreset: true },
    });

    if (!product) {
      return NextResponse.json({ error: `Product not found: ${slug}` }, { status: 404 });
    }

    const input: Record<string, unknown> = {
      quantity: quantity || 100,
      widthIn: widthIn || 2,
      heightIn: heightIn || 2,
    };
    if (material) input.material = material;
    if (sizeLabel) input.sizeLabel = sizeLabel;
    if (options) input.options = options;

    const result = await calculatePrice(product, input);

    return NextResponse.json({
      ...result,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        pricingUnit: product.pricingUnit,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
