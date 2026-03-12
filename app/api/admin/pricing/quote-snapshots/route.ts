// app/api/admin/pricing/quote-snapshots/route.ts
// Read-only list + create for admin quote snapshots.
// Supports: pricing simulator save, quote audit trail.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { saveQuoteSnapshot, listQuoteSnapshots, getQuoteStats } from "@/lib/pricing/quote-snapshot";
import { canSimulateQuotes } from "@/lib/pricing/pricing-permissions";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const productSlug = searchParams.get("productSlug") || undefined;
    const operatorId = searchParams.get("operatorId") || undefined;
    const operatorName = searchParams.get("operatorName") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 30;
    const statsOnly = searchParams.get("stats") === "true";

    if (statsOnly) {
      const stats = await getQuoteStats(30);
      return NextResponse.json(stats);
    }

    const result = await listQuoteSnapshots({ productSlug, operatorId, operatorName, dateFrom, dateTo, page, limit });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[quote-snapshots] GET failed:", err);
    return NextResponse.json({ error: "Failed to list quote snapshots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  // Check pricing tier — need at least simulator
  if (!canSimulateQuotes(auth.user.role)) {
    return NextResponse.json(
      { error: "Insufficient pricing tier. Need simulator or above." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const id = await saveQuoteSnapshot({
      productId: body.productId,
      productSlug: body.productSlug,
      productName: body.productName,
      category: body.category,
      configInput: body.configInput || {},
      pricingSource: body.pricingSource || "UNKNOWN",
      sellPriceCents: Number(body.sellPriceCents) || 0,
      totalCostCents: Number(body.totalCostCents) || 0,
      floorPriceCents: Number(body.floorPriceCents) || 0,
      quoteLedger: body.quoteLedger,
      operatorId: auth.user.id,
      operatorName: auth.user.name || auth.user.email,
      note: body.note,
    });

    if (!id) {
      return NextResponse.json({ error: "Failed to save snapshot" }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch (err) {
    console.error("[quote-snapshots] POST failed:", err);
    return NextResponse.json({ error: "Failed to save quote snapshot" }, { status: 500 });
  }
}
