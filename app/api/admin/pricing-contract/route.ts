import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { buildPricingContract, getDefaultInput, buildSalesExplanation } from "@/lib/pricing/pricing-contract";

/**
 * POST /api/admin/pricing-contract
 *
 * Returns the canonical pricing contract for a product.
 * Uses the same pricing engine as the storefront — read-only, no mutations.
 *
 * Body:
 *   { slug: string, quantity?, widthIn?, heightIn?, material?, sizeLabel?, options?,
 *     b2bUserId?, b2bCompanyName?, b2bPartnerTier? }
 *
 * If any B2B params provided, the contract includes b2bAdjustment via buildPricingContract.
 *
 * Returns: canonical PricingContract object.
 */
export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "products", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { slug },
      include: { pricingPreset: true },
    });

    if (!product) {
      return NextResponse.json({ error: `Product not found: ${slug}` }, { status: 404 });
    }

    // Merge caller input with sensible defaults
    const defaults = getDefaultInput(product);
    const input = {
      quantity: Number(body.quantity) || defaults.quantity,
      widthIn: body.widthIn != null ? Number(body.widthIn) : defaults.widthIn,
      heightIn: body.heightIn != null ? Number(body.heightIn) : defaults.heightIn,
      material: body.material || undefined,
      sizeLabel: body.sizeLabel || undefined,
      options: body.options || {},
    };

    // Build contract options — pass B2B params if any are provided
    const contractOptions: Record<string, unknown> = {};
    const hasB2B = body.b2bUserId || body.b2bCompanyName || body.b2bPartnerTier;
    if (hasB2B) {
      contractOptions.b2b = {
        ...(body.b2bUserId ? { userId: body.b2bUserId } : {}),
        ...(body.b2bCompanyName ? { companyName: body.b2bCompanyName } : {}),
        ...(body.b2bPartnerTier ? { partnerTier: body.b2bPartnerTier } : {}),
      };
    }

    const contract = await buildPricingContract(product, input, contractOptions);
    contract.salesExplanation = buildSalesExplanation(contract);

    return NextResponse.json(contract);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/admin/pricing-contract]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
