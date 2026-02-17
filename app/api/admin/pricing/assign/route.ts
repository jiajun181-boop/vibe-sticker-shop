import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { computeFromPrice } from "@/lib/pricing/from-price";

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

