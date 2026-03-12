// app/api/admin/pricing/vendor-costs/missing/route.ts
// Returns products with FIXED pricing source but no active vendor cost entries.
// Supports JSON (default) and CSV export.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { classifyPricingSource, type ProductInput } from "@/lib/pricing/audit";
import { PricingSourceKind } from "@/lib/pricing/audit-types";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category") || undefined;
    const format = searchParams.get("format") || "json";

    // Fetch all active products
    const whereClause: Record<string, unknown> = { isActive: true };
    if (categoryFilter) whereClause.category = categoryFilter;

    const products = await prisma.product.findMany({
      where: whereClause,
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
    });

    // Identify FIXED source products
    const fixedProducts = products.filter(
      (p) => classifyPricingSource(p as ProductInput) === PricingSourceKind.FIXED
    );

    if (fixedProducts.length === 0) {
      if (format === "csv") {
        return new NextResponse("slug,name,category,basePrice,pricingUnit\n", {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=missing-vendor-costs.csv",
          },
        });
      }
      return NextResponse.json({ products: [], total: 0, hasExport: false });
    }

    // Find which FIXED products have at least one active vendor cost
    const vendorCostSlugs = await prisma.vendorCost.findMany({
      where: {
        isActive: true,
        productSlug: { in: fixedProducts.map((p) => p.slug) },
      },
      select: { productSlug: true },
      distinct: ["productSlug"],
    });

    const coveredSlugs = new Set(vendorCostSlugs.map((v) => v.productSlug));

    // Products that are FIXED but have no vendor cost
    const missing = fixedProducts.filter((p) => !coveredSlugs.has(p.slug));

    if (format === "csv") {
      const header = "slug,name,category,basePrice,pricingUnit\n";
      const rows = missing
        .map((p) => {
          const name = p.name.replace(/"/g, '""');
          return `${p.slug},"${name}",${p.category},${p.basePrice},${p.pricingUnit}`;
        })
        .join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=missing-vendor-costs.csv",
        },
      });
    }

    return NextResponse.json({
      products: missing.map((p) => ({
        slug: p.slug,
        name: p.name,
        category: p.category,
        basePrice: p.basePrice,
        pricingUnit: p.pricingUnit,
      })),
      total: missing.length,
      hasExport: missing.length > 0,
    });
  } catch (err) {
    console.error("[vendor-costs/missing] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch missing vendor costs" },
      { status: 500 }
    );
  }
}
