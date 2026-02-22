import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice } from "@/lib/pricing/template-resolver";

/**
 * POST /api/pricing/calculate — Public pricing endpoint
 *
 * Request body:
 * {
 *   slug: string;           // product slug (required)
 *   widthIn: number;        // width in inches
 *   heightIn: number;       // height in inches
 *   quantity: number;       // quantity (required)
 *   material?: string;      // material alias (e.g. "white_vinyl", "coroplast_4mm")
 *   options?: {
 *     cutType?: "die_cut" | "kiss_cut" | "sheet";
 *     doubleSided?: boolean;
 *     lamination?: "gloss" | "matte" | "none";
 *     isSticker?: boolean;
 *     board?: string;       // board material for signs
 *     frameType?: string;   // "gallery" | "none" | "rolled" for canvas
 *     scoring?: boolean;
 *     binding?: string;
 *     roundedCorners?: boolean;
 *     holePunch?: boolean;
 *     folds?: number;
 *     grommets?: boolean;
 *     hems?: boolean;
 *     polePockets?: boolean;
 *     windSlits?: boolean;
 *   };
 *   accessories?: Array<{ id: string; quantity?: number }>;
 *   sizeLabel?: string;     // for fixed-size products
 * }
 *
 * Response:
 * {
 *   totalCents: number;
 *   unitCents: number;
 *   currency: "CAD";
 *   template: string;
 *   breakdown: { ... };
 *   meta: { ... };
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const qty = Number(body.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: "quantity must be a positive number" }, { status: 400 });
    }

    // Look up the product
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { pricingPreset: true },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Build input
    const input = {
      widthIn: body.widthIn != null ? Number(body.widthIn) : undefined,
      heightIn: body.heightIn != null ? Number(body.heightIn) : undefined,
      quantity: qty,
      material: body.material,
      options: body.options || {},
      accessories: body.accessories || [],
      sizeLabel: body.sizeLabel,
    };

    // Validate dimensions if provided
    if (input.widthIn != null && input.heightIn != null) {
      if (input.widthIn <= 0 || input.heightIn <= 0) {
        return NextResponse.json({ error: "Dimensions must be positive" }, { status: 400 });
      }
    }

    const result = await calculatePrice(product, input);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[/api/pricing/calculate]", err);
    const status = typeof err?.status === "number" ? err.status : 400;
    const payload: any = { error: err?.message || "Price calculation failed" };
    if (err?.details) payload.details = err.details;
    return NextResponse.json(payload, { status });
  }
}
