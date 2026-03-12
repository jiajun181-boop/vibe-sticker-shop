// app/api/admin/pricing/floor-check/route.ts
// Standalone floor price compliance check endpoint.
// Used by Quick Quote panel for on-the-fly floor checks
// when an admin considers a price override.
//
// POST: { productSlug, proposedPriceCents, quantity?, widthIn?, heightIn?, material? }
// Returns: FloorCheckResult

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { checkFloorCompliance } from "@/lib/pricing/floor-enforcement";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    if (!body.productSlug || typeof body.productSlug !== "string") {
      return NextResponse.json(
        { error: "productSlug is required" },
        { status: 400 }
      );
    }

    if (body.proposedPriceCents == null || !Number.isFinite(Number(body.proposedPriceCents))) {
      return NextResponse.json(
        { error: "proposedPriceCents is required and must be a number" },
        { status: 400 }
      );
    }

    const result = await checkFloorCompliance({
      productSlug: body.productSlug,
      proposedPriceCents: Math.round(Number(body.proposedPriceCents)),
      quantity: body.quantity ? Number(body.quantity) : undefined,
      widthIn: body.widthIn != null ? Number(body.widthIn) : undefined,
      heightIn: body.heightIn != null ? Number(body.heightIn) : undefined,
      material: body.material || undefined,
      operatorRole: auth.user.role,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[floor-check] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to check floor compliance" },
      { status: 500 }
    );
  }
}
