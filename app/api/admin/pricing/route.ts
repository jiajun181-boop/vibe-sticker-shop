import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";

// GET /api/admin/pricing — list all presets with product count
export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const presets = await prisma.pricingPreset.findMany({
      orderBy: { key: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(presets);
  } catch (err) {
    console.error("[Pricing] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch presets" },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing — create a new preset
export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { key, name, model, config } = body;

    if (!key || !name || !model || !config) {
      return NextResponse.json(
        { error: "key, name, model, and config are required" },
        { status: 400 }
      );
    }

    const preset = await prisma.pricingPreset.create({
      data: { key, name, model, config },
    });

    return NextResponse.json(preset, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "A preset with this key already exists" },
        { status: 409 }
      );
    }
    console.error("[Pricing] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create preset" },
      { status: 500 }
    );
  }
}
