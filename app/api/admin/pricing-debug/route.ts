import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice } from "@/lib/pricing/template-resolver";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || "admin-secret-change-me");

async function getAdmin(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string; role: string; name: string };
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/pricing-debug
 * Calls the production pricing engine and returns the full QuoteLedger.
 * Admin-only — identical path as front-end pricing, but returns extra debug info.
 */
export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
