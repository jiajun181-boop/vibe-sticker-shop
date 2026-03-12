import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice, getProductTemplate, validateMaterialForTemplate } from "@/lib/pricing/template-resolver";
import { validateMaterialForProduct, getProductMaterials } from "@/lib/pricing/product-materials";
import { requirePermission } from "@/lib/admin-auth";

/**
 * POST /api/admin/pricing-debug
 * Calls the production pricing engine and returns the full QuoteLedger.
 * Admin-only — identical path as front-end pricing, but returns extra debug info.
 *
 * Two-layer validation:
 *   1. Template-level: rejects cross-family nonsense (vinyl in paper_print)
 *   2. Product-level: rejects within-template invalidity (NCR stock for business cards)
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

    const template = getProductTemplate(product);

    // ── Layer 1: Template-level material validation ──────────────────
    if (material && template) {
      const templateValidation = validateMaterialForTemplate(material, template, { strict: true });
      if (!templateValidation.valid) {
        return NextResponse.json({
          error: `Invalid material for this product: ${templateValidation.reason}`,
          validation: { level: "template", ...templateValidation },
          product: {
            id: product.id,
            slug: product.slug,
            name: product.name,
            category: product.category,
          },
        }, { status: 422 });
      }
    }

    // ── Layer 2: Product-level material validation ───────────────────
    if (material) {
      const productValidation = validateMaterialForProduct(material, slug);
      if (!productValidation.valid) {
        return NextResponse.json({
          error: `Invalid material for this product: ${productValidation.reason}`,
          validation: { level: "product", ...productValidation },
          product: {
            id: product.id,
            slug: product.slug,
            name: product.name,
            category: product.category,
          },
        }, { status: 422 });
      }
    }

    const input: Record<string, unknown> = {
      quantity: quantity || 100,
      widthIn: widthIn || 2,
      heightIn: heightIn || 2,
    };
    if (material) input.material = material;
    if (sizeLabel) input.sizeLabel = sizeLabel;
    if (options) input.options = options;

    const result = await calculatePrice(product, input, { strict: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productMaterials: any = getProductMaterials(slug);

    return NextResponse.json({
      ...result,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        pricingUnit: product.pricingUnit,
      },
      _resolved: {
        template,
        materialValidation: material ? {
          template: validateMaterialForTemplate(material, template || "", { strict: true }),
          product: validateMaterialForProduct(material, slug),
        } : null,
      },
      _coverage: {
        materialSource: productMaterials?.source || "template",
        hasMaterialCoverage: !!productMaterials,
        materialType: productMaterials?.type || null,
        materialOptionCount: productMaterials?.type === "options"
          ? productMaterials.options?.length ?? null
          : null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = (err instanceof Error && "status" in err && typeof (err as Record<string, unknown>).status === "number")
      ? (err as Record<string, unknown>).status as number
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
