import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { computeFromPrice } from "@/lib/pricing/from-price";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const presetId = typeof body?.presetId === "string" ? body.presetId.trim() : "";
    const overwriteExisting = Boolean(body?.overwriteExisting);
    const activeOnly = body?.activeOnly !== false;

    if (!category || !presetId) {
      return NextResponse.json({ error: "category and presetId are required" }, { status: 400 });
    }

    const preset = await prisma.pricingPreset.findUnique({
      where: { id: presetId },
      select: { id: true, key: true, name: true },
    });
    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = { category };
    if (activeOnly) where.isActive = true;
    if (!overwriteExisting) where.pricingPresetId = null;

    // Count affected products before gating
    const affectedCount = await prisma.product.count({ where });

    const gate = await gateWithApproval({
      operatorRole: auth.user?.role || "unknown",
      operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
      changeType: "preset_assign",
      scope: "preset",
      targetSlug: category,
      targetName: `Assign ${preset.name} → ${category}`,
      description: `Assign preset "${preset.name}" to ${affectedCount} products in ${category}`,
      changeDiff: { presetId, category, overwriteExisting },
      affectedCount,
    });
    if (gate.needsApproval) {
      return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
    }

    const result = await prisma.product.updateMany({
      where,
      data: { pricingPresetId: presetId },
    });

    // Auto-recompute minPrice for affected products
    let minPriceUpdated = 0;
    try {
      const affected = await prisma.product.findMany({
        where: { category, pricingPresetId: presetId, isActive: true },
        include: { pricingPreset: true },
      });
      for (const p of affected) {
        const minPrice = computeFromPrice(p);
        if (minPrice > 0) {
          await prisma.product.update({ where: { id: p.id }, data: { minPrice } });
          minPriceUpdated++;
        }
      }
    } catch {
      // Non-critical
    }

    logPriceChange({
      productSlug: category,
      productName: `Assign: ${preset.name} → ${category}`,
      scope: "preset",
      field: "preset.assign",
      valueAfter: { presetId, presetKey: preset.key },
      affectedCount: result.count,
      operatorId: auth.user?.id || null,
      operatorName: auth.user?.name || auth.user?.email || "admin",
      note: "owner-bypass",
    }).catch(() => {});

    return NextResponse.json({
      category,
      preset: { id: preset.id, key: preset.key, name: preset.name },
      updated: result.count,
      minPriceUpdated,
      overwriteExisting,
      activeOnly,
    });
  } catch (err) {
    console.error("[Pricing assign] POST failed:", err);
    return NextResponse.json({ error: "Failed to assign preset" }, { status: 500 });
  }
}

