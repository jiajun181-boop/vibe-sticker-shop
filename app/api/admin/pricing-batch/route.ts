import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { buildPricingContract, getDefaultInput } from "@/lib/pricing/pricing-contract";
import { loadFloorSettings } from "@/lib/pricing/floor-price";

/**
 * GET /api/admin/pricing-batch
 *
 * Returns lightweight pricing summaries for all active products.
 * Uses the canonical pricing contract under the hood, but returns only
 * the fields needed for the dashboard list view.
 *
 * Query params:
 *   category? — filter by category
 *   limit? — max products (default 200)
 */
export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 200, 500);

    // 1. Load all active products with presets in one query
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      include: { pricingPreset: true },
      take: limit,
      orderBy: { name: "asc" },
    });

    // 2. Pre-load floor settings once for all products
    const floorSettings = await loadFloorSettings();

    // 3. Build summaries in parallel (batched to avoid overwhelming DB)
    const BATCH_SIZE = 15;
    const summaries: Array<Record<string, unknown>> = [];

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (product) => {
          const input = getDefaultInput(product);
          const contract = await buildPricingContract(product, input, { floorSettings });
          return {
            id: product.id,
            slug: product.slug,
            name: product.name,
            category: product.category,
            pricingUnit: product.pricingUnit,
            sourceKind: contract.source.kind,
            sourceTemplate: contract.source.template,
            presetModel: contract.source.presetModel,
            sellPriceCents: contract.sellPrice.totalCents,
            unitPriceCents: contract.sellPrice.unitCents,
            totalCostCents: contract.totalCost,
            profitCents: contract.profit.amountCents,
            profitRate: contract.profit.rate,
            floorPriceCents: contract.floor.priceCents,
            floorPolicySource: contract.floor.policySource,
            completenessScore: contract.completeness.score,
            missingFlags: contract.completeness.missing,
            warnings: contract.completeness.warnings,
            explanation: contract.explanation,
            inputUsed: input,
          };
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          summaries.push(r.value);
        } else {
          // Include error entry so UI knows which product failed
          summaries.push({
            error: r.reason?.message || "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      products: summaries,
      total: summaries.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/admin/pricing-batch]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
