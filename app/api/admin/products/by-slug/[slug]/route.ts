import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/products/by-slug/[slug]
 *
 * Dedicated endpoint for the pricing detail page.
 * Returns a single product by slug with pricing-relevant fields.
 * No more fetching 500 products and filtering client-side.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requirePermission(request, "products", "view");
  if (!auth.authenticated) return auth.response;

  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      pricingPreset: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}
