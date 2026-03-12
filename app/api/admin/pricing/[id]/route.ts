import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { validatePresetConfig } from "@/lib/pricing/validate-config";
import { computeFromPrice } from "@/lib/pricing/from-price";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";

// GET /api/admin/pricing/[id] — single preset with products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const preset = await prisma.pricingPreset.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, slug: true, name: true, category: true },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!preset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(preset);
  } catch (err) {
    console.error("[Pricing] GET [id] error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// PUT /api/admin/pricing/[id] — update preset config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, config, isActive } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (config !== undefined) data.config = config;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Validate config if it's being updated
    const existing = await prisma.pricingPreset.findUnique({ where: { id }, select: { id: true, key: true, name: true, model: true, config: true } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (config !== undefined) {
      const validation = validatePresetConfig(existing.model, config);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid pricing config", errors: validation.errors },
          { status: 400 }
        );
      }

      // Gate config changes through approval
      const gate = await gateWithApproval({
        operatorRole: auth.user?.role || "unknown",
        operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
        changeType: "preset_config_edit",
        scope: "preset",
        targetId: id,
        targetSlug: existing.key,
        targetName: existing.name,
        description: `Edit preset config: ${existing.name}`,
        changeDiff: { before: existing.config, after: config },
      });
      if (gate.needsApproval) {
        return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
      }
    }

    const preset = await prisma.pricingPreset.update({
      where: { id },
      data,
    });

    // Log config change to PriceChangeLog
    if (config !== undefined) {
      logPriceChange({
        productId: id,
        productSlug: existing.key,
        productName: existing.name,
        scope: "preset",
        field: `preset.${existing.key}.config`,
        valueBefore: existing.config,
        valueAfter: config,
        operatorId: auth.user?.id || null,
        operatorName: auth.user?.name || auth.user?.email || "admin",
        note: "owner-bypass",
      }).catch(() => {});
    }

    // Auto-refresh minPrice for all products using this preset
    let minPriceRefreshed = 0;
    if (config !== undefined) {
      try {
        const affected = await prisma.product.findMany({
          where: { pricingPresetId: id, isActive: true },
          include: { pricingPreset: true },
        });
        for (const p of affected) {
          const fresh = computeFromPrice(p);
          if (fresh > 0 && fresh !== p.minPrice) {
            await prisma.product.update({
              where: { id: p.id },
              data: { minPrice: fresh },
            });
            minPriceRefreshed++;
          }
        }
      } catch (e) {
        console.warn("[Pricing] minPrice refresh non-critical error:", e);
      }
    }

    return NextResponse.json({ ...preset, minPriceRefreshed });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[Pricing] PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/admin/pricing/[id] — delete preset (nullifies product refs)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const existing = await prisma.pricingPreset.findUnique({ where: { id }, select: { id: true, key: true, name: true } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Count affected products
    const affectedCount = await prisma.product.count({ where: { pricingPresetId: id } });

    const gate = await gateWithApproval({
      operatorRole: auth.user?.role || "unknown",
      operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
      changeType: "preset_delete",
      scope: "preset",
      targetId: id,
      targetSlug: existing.key,
      targetName: existing.name,
      description: `Delete preset: ${existing.name} (affects ${affectedCount} products)`,
      changeDiff: { preset: existing, affectedProducts: affectedCount },
      affectedCount,
    });
    if (gate.needsApproval) {
      return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
    }

    // Nullify product references and clear cached minPrice
    await prisma.product.updateMany({
      where: { pricingPresetId: id },
      data: { pricingPresetId: null, minPrice: null },
    });

    await prisma.pricingPreset.delete({ where: { id } });

    logPriceChange({
      productId: id,
      productSlug: existing.key,
      productName: existing.name,
      scope: "preset",
      field: "preset.delete",
      valueBefore: existing,
      valueAfter: null,
      affectedCount,
      operatorId: auth.user?.id || null,
      operatorName: auth.user?.name || auth.user?.email || "admin",
      note: "owner-bypass",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[Pricing] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
