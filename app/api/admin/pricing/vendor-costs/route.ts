// app/api/admin/pricing/vendor-costs/route.ts
// Vendor cost CRUD API for outsourced products.
// GET: list vendor costs
// POST: create/upsert vendor cost (with approval gate + floor warnings)

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { upsertVendorCost, listVendorCosts } from "@/lib/pricing/vendor-cost";
import { checkVendorCostFloorImpact } from "@/lib/pricing/floor-enforcement";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const vendorName = searchParams.get("vendorName") || undefined;
    const productSlug = searchParams.get("productSlug") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;

    const focused = !!(productSlug || vendorName);
    const result = await listVendorCosts({ vendorName, productSlug, page, limit });
    const items = (result as Record<string, unknown>).vendorCosts as unknown[] | undefined;
    return NextResponse.json({
      ...result,
      focused,
      ...(focused && {
        focusParams: {
          productSlug: productSlug || undefined,
          vendorName: vendorName || undefined,
        },
        primaryRecord: items?.[0] || null,
      }),
    });
  } catch (err) {
    console.error("[vendor-costs] GET failed:", err);
    return NextResponse.json({ error: "Failed to list vendor costs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    if (!body.vendorName) {
      return NextResponse.json({ error: "vendorName is required" }, { status: 400 });
    }

    // Approval gate — vendor_cost_create
    const gate = await gateWithApproval({
      operatorRole: auth.user.role,
      operator: {
        id: auth.user.id,
        name: auth.user.name || auth.user.email,
        role: auth.user.role,
      },
      changeType: "vendor_cost_create",
      scope: "b2b",
      targetSlug: body.productSlug || body.vendorName,
      targetName: `Vendor cost: ${body.vendorName} — ${body.productName || body.productSlug || "global"}`,
      description: `Create/upsert vendor cost for ${body.vendorName} (${body.productSlug || "no product"})`,
      changeDiff: body,
    });

    if (gate.needsApproval) {
      return NextResponse.json(
        {
          requiresApproval: true,
          approvalId: gate.approvalId,
          reason: gate.reason,
        },
        { status: 202 }
      );
    }

    // Owner bypass or within guardrails — apply directly
    const cost = await upsertVendorCost({
      productId: body.productId,
      productSlug: body.productSlug,
      productName: body.productName,
      vendorName: body.vendorName,
      vendorSku: body.vendorSku,
      sizeKey: body.sizeKey,
      qtyTier: body.qtyTier ? Number(body.qtyTier) : undefined,
      unitCostCents: Number(body.unitCostCents) || 0,
      setupFeeCents: body.setupFeeCents ? Number(body.setupFeeCents) : undefined,
      shippingCents: body.shippingCents ? Number(body.shippingCents) : undefined,
      leadTimeDays: body.leadTimeDays ? Number(body.leadTimeDays) : undefined,
      note: body.note,
    });

    // Log change (fire-and-forget, owner-bypass note when applicable)
    logPriceChange({
      scope: "b2b",
      field: "vendor_cost.create",
      productSlug: body.productSlug || undefined,
      valueBefore: null,
      valueAfter: cost,
      operatorId: auth.user.id,
      operatorName: auth.user.name || auth.user.email,
      note: "owner-bypass",
    });

    // After upserting, check if any products using this vendor now have
    // sell price below floor. Non-blocking — just add warnings to response.
    let floorWarnings: Awaited<ReturnType<typeof checkVendorCostFloorImpact>> = [];
    if (body.productSlug) {
      try {
        floorWarnings = await checkVendorCostFloorImpact({
          productSlug: body.productSlug,
          operatorRole: auth.user.role,
        });
      } catch (floorErr) {
        console.error("[vendor-costs] floor check failed:", floorErr);
        // Non-blocking: don't fail the upsert because of floor check
      }
    }

    return NextResponse.json({
      cost,
      floorWarnings,
      refreshHint: { invalidates: ["missingVendorCost"] },
    });
  } catch (err) {
    console.error("[vendor-costs] POST failed:", err);
    return NextResponse.json({ error: "Failed to save vendor cost" }, { status: 500 });
  }
}
