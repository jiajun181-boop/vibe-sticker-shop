import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";
import { quoteProduct } from "@/lib/pricing/quote-server.js";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await authenticateApiKey(req);
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await req.json();

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { pricingPreset: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const quote = quoteProduct(product, body);
    return NextResponse.json(quote);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Quote failed" }, { status: 400 });
  }
}
