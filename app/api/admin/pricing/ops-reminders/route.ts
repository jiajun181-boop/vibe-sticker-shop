// app/api/admin/pricing/ops-reminders/route.ts
// Combined ops health check — surfaces pricing gaps, drift alerts, pending approvals.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { buildAuditReport } from "@/lib/pricing/audit";
import { MissingFieldCode } from "@/lib/pricing/audit-types";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    // Fetch audit input data (same pattern as audit route)
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

    // Products missing displayFromPrice
    const missingDisplayPrice = report.productRows
      .filter((r) => r.missingFields.includes(MissingFieldCode.MISSING_DISPLAY_FROM_PRICE))
      .map((r) => r.slug);

    // Products missing floor policy
    const missingFloorPolicy = report.productRows
      .filter((r) => r.missingFields.includes(MissingFieldCode.MISSING_FLOOR_PRICE_POLICY))
      .map((r) => r.slug);

    // Materials with placeholder names
    const placeholderMaterials = report.materialGaps
      .filter((g) => g.issue === "placeholder")
      .map((g) => g.name);

    // Hardware with suspicious prices
    const suspiciousHardware = report.hardwareGaps.map((g) => ({
      name: g.name,
      slug: g.slug,
      priceCents: g.priceCents,
      issue: g.issue,
    }));

    // Products with fixedPrices but missing vendor cost
    const fixedPriceProducts = report.productRows
      .filter((r) => r.pricingSourceKind === "FIXED")
      .map((r) => ({ id: r.productId, slug: r.slug }));

    let missingVendorCost: string[] = [];
    let staleVendorCostSlugs: string[] = [];
    if (fixedPriceProducts.length > 0) {
      const vendorCostEntries = await prisma.vendorCost.findMany({
        where: {
          isActive: true,
          productSlug: { in: fixedPriceProducts.map((p) => p.slug) },
        },
        select: { productSlug: true, lastVerified: true },
      });

      // Group by slug — a slug is covered if it has at least one entry
      const slugLatestVerified = new Map<string, Date | null>();
      for (const v of vendorCostEntries) {
        if (!v.productSlug) continue;
        const current = slugLatestVerified.get(v.productSlug);
        if (!current || (v.lastVerified && (!current || v.lastVerified > current))) {
          slugLatestVerified.set(v.productSlug, v.lastVerified);
        }
      }

      const coveredSlugs = new Set(slugLatestVerified.keys());
      missingVendorCost = fixedPriceProducts
        .filter((p) => !coveredSlugs.has(p.slug))
        .map((p) => p.slug);

      // Stale check: vendor costs where lastVerified > 90 days ago (or null)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      for (const [slug, lastVerified] of slugLatestVerified) {
        if (!lastVerified || lastVerified < ninetyDaysAgo) {
          staleVendorCostSlugs.push(slug);
        }
      }
    }

    // Recent high-drift changes (>20% in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [highDriftCount, pendingApprovalCount] = await Promise.all([
      prisma.priceChangeLog.count({
        where: {
          driftPct: { gte: 20 },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.pricingApproval.count({
        where: { status: "pending" },
      }),
    ]);

    const reminders = {
      missingDisplayPrice: {
        count: missingDisplayPrice.length,
        slugs: missingDisplayPrice,
        severity: missingDisplayPrice.length > 0 ? "warning" : "ok",
        drilldownUrl: "/admin/pricing?tab=ops&section=reminders",
      },
      missingFloorPolicy: {
        count: missingFloorPolicy.length,
        slugs: missingFloorPolicy,
        severity: missingFloorPolicy.length > 0 ? "warning" : "ok",
        drilldownUrl: "/admin/pricing?tab=ops&section=reminders",
      },
      placeholderMaterials: {
        count: placeholderMaterials.length,
        names: placeholderMaterials,
        severity: placeholderMaterials.length > 0 ? "critical" : "ok",
        drilldownUrl: "/admin/materials?filter=placeholder",
      },
      suspiciousHardware: {
        count: suspiciousHardware.length,
        items: suspiciousHardware,
        severity: suspiciousHardware.length > 0 ? "warning" : "ok",
        drilldownUrl: "/admin/materials?tab=hardware&filter=suspicious",
      },
      missingVendorCost: {
        count: missingVendorCost.length,
        slugs: missingVendorCost,
        severity: missingVendorCost.length > 0 ? "warning" : "ok",
        drilldownUrl: "/admin/pricing?tab=governance&section=vendor",
      },
      staleVendorCosts: {
        count: staleVendorCostSlugs.length,
        slugs: staleVendorCostSlugs,
        severity: staleVendorCostSlugs.length > 5 ? "critical" : staleVendorCostSlugs.length > 0 ? "warning" : "ok",
        drilldownUrl: "/admin/pricing?tab=governance&section=vendor",
      },
      highDriftChanges: {
        count: highDriftCount,
        severity: highDriftCount > 0 ? "critical" : "ok",
        drilldownUrl: "/admin/pricing?tab=governance&section=changelog",
      },
      pendingApprovals: {
        count: pendingApprovalCount,
        severity: pendingApprovalCount > 0 ? "warning" : "ok",
        drilldownUrl: "/admin/pricing?tab=governance&section=approvals",
      },
    };

    // Compute overallHealth score
    const allSeverities = Object.values(reminders).map((r) => r.severity);
    const hasCritical = allSeverities.includes("critical");
    const warningCount = allSeverities.filter((s) => s === "warning").length;

    let overallHealth: "ok" | "warning" | "critical";
    if (hasCritical) {
      overallHealth = "critical";
    } else if (warningCount > 0) {
      overallHealth = "warning";
    } else {
      overallHealth = "ok";
    }

    return NextResponse.json({
      reminders,
      overallHealth,
      lastChecked: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ops-reminders] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to generate ops reminders" },
      { status: 500 }
    );
  }
}
