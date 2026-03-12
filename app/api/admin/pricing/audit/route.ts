// app/api/admin/pricing/audit/route.ts
// ═══════════════════════════════════════════════════════════════════
// Read-only live pricing audit API.
// Returns a full PricingAuditReport from real database data.
//
// Purpose: Support endpoint for Pricing Center / audit UI.
// - Does NOT modify any pricing data.
// - Does NOT run pricing calculations.
// - Admin permission required (pricing:view).
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { buildAuditReport } from "@/lib/pricing/audit";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const [products, materials, hardware, presets] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          isActive: true,
          basePrice: true,
          pricingUnit: true,
          pricingPresetId: true,
          pricingConfig: true,
          optionsConfig: true,
          displayFromPrice: true,
          minPrice: true,
        },
      }),
      prisma.material.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          costPerSqft: true,
          rollCost: true,
          isActive: true,
        },
      }),
      prisma.hardwareItem.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          priceCents: true,
          unit: true,
          isActive: true,
        },
      }),
      prisma.pricingPreset.findMany({
        where: { isActive: true },
        select: {
          id: true,
          key: true,
          name: true,
          model: true,
          isActive: true,
        },
      }),
    ]);

    const report = buildAuditReport({ products, materials, hardware, presets });

    return NextResponse.json(report);
  } catch (err) {
    console.error("[Pricing audit] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to generate pricing audit report" },
      { status: 500 }
    );
  }
}
