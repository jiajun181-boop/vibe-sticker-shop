// app/api/admin/pricing/vendor-costs/[id]/route.ts
// Single vendor cost: GET, PATCH, DELETE
// PATCH and DELETE gated with approval workflow.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { updateVendorCost, deleteVendorCost } from "@/lib/pricing/vendor-cost";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";

/**
 * GET /api/admin/pricing/vendor-costs/[id] — Fetch a single vendor cost.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const cost = await prisma.vendorCost.findUnique({ where: { id } });

    if (!cost) {
      return NextResponse.json({ error: "Vendor cost not found" }, { status: 404 });
    }

    return NextResponse.json(cost);
  } catch (err) {
    console.error("[vendor-costs] GET by id failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch vendor cost" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/pricing/vendor-costs/[id] — Update a vendor cost.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    // Fetch existing for changeDiff and existence check
    const existing = await prisma.vendorCost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor cost not found" }, { status: 404 });
    }

    const body = await request.json();

    // Approval gate — vendor_cost_update
    const gate = await gateWithApproval({
      operatorRole: auth.user.role,
      operator: {
        id: auth.user.id,
        name: auth.user.name || auth.user.email,
        role: auth.user.role,
      },
      changeType: "vendor_cost_update",
      scope: "b2b",
      targetId: id,
      targetSlug: existing.productSlug || existing.vendorName,
      targetName: `Vendor cost: ${existing.vendorName} — ${existing.productName || existing.productSlug || "global"}`,
      description: `Update vendor cost ${id} for ${existing.vendorName}`,
      changeDiff: { id, before: existing, after: body },
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
    const cost = await updateVendorCost(id, {
      productId: body.productId,
      productSlug: body.productSlug,
      productName: body.productName,
      vendorName: body.vendorName,
      vendorSku: body.vendorSku,
      sizeKey: body.sizeKey,
      qtyTier: body.qtyTier !== undefined ? Number(body.qtyTier) : undefined,
      unitCostCents: body.unitCostCents !== undefined ? Number(body.unitCostCents) : undefined,
      setupFeeCents: body.setupFeeCents !== undefined ? Number(body.setupFeeCents) : undefined,
      shippingCents: body.shippingCents !== undefined ? Number(body.shippingCents) : undefined,
      leadTimeDays: body.leadTimeDays !== undefined ? Number(body.leadTimeDays) : undefined,
      note: body.note,
    });

    // Log change (fire-and-forget, owner-bypass note when applicable)
    logPriceChange({
      scope: "b2b",
      field: "vendor_cost.update",
      productSlug: existing.productSlug || undefined,
      valueBefore: existing,
      valueAfter: cost,
      operatorId: auth.user.id,
      operatorName: auth.user.name || auth.user.email,
      note: "owner-bypass",
    });

    return NextResponse.json({ cost });
  } catch (err) {
    console.error("[vendor-costs] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update vendor cost" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pricing/vendor-costs/[id] — Soft-delete a vendor cost.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    // Fetch existing for changeDiff and existence check
    const existing = await prisma.vendorCost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor cost not found" }, { status: 404 });
    }

    // Approval gate — vendor_cost_delete
    const gate = await gateWithApproval({
      operatorRole: auth.user.role,
      operator: {
        id: auth.user.id,
        name: auth.user.name || auth.user.email,
        role: auth.user.role,
      },
      changeType: "vendor_cost_delete",
      scope: "b2b",
      targetId: id,
      targetSlug: existing.productSlug || existing.vendorName,
      targetName: `Vendor cost: ${existing.vendorName} — ${existing.productName || existing.productSlug || "global"}`,
      description: `Delete vendor cost ${id} for ${existing.vendorName}`,
      changeDiff: { id, cost: existing },
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
    await deleteVendorCost(id);

    // Log change (fire-and-forget)
    logPriceChange({
      scope: "b2b",
      field: "vendor_cost.delete",
      productSlug: existing.productSlug || undefined,
      valueBefore: existing,
      valueAfter: { deleted: true },
      operatorId: auth.user.id,
      operatorName: auth.user.name || auth.user.email,
      note: "owner-bypass",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vendor-costs] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete vendor cost" },
      { status: 500 }
    );
  }
}
