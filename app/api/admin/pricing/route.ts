import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { validatePresetConfig } from "@/lib/pricing/validate-config";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";

// GET /api/admin/pricing — list all presets with product count
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
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
  const auth = await requirePermission(request, "pricing", "edit");
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

    const validation = validatePresetConfig(model, config);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid pricing config", errors: validation.errors },
        { status: 400 }
      );
    }

    // Gate through approval workflow
    const gate = await gateWithApproval({
      operatorRole: auth.user?.role || "unknown",
      operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
      changeType: "preset_create",
      scope: "preset",
      targetSlug: key,
      targetName: name,
      description: `Create preset: ${name} (model: ${model})`,
      changeDiff: { key, name, model, config },
    });
    if (gate.needsApproval) {
      return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
    }

    const preset = await prisma.pricingPreset.create({
      data: { key, name, model, config },
    });

    // Log to PriceChangeLog (fire-and-forget)
    logPriceChange({
      productId: preset.id,
      productSlug: key,
      productName: name,
      scope: "preset",
      field: "preset.create",
      valueBefore: null,
      valueAfter: { key, name, model, config },
      operatorId: auth.user?.id || null,
      operatorName: auth.user?.name || auth.user?.email || "admin",
      note: "owner-bypass",
    }).catch(() => {});

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
