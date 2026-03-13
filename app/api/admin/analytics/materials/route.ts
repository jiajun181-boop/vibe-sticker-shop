import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/materials
 *
 * Material usage analytics — tracks which materials are used most,
 * estimated consumption, and cost impact.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "analytics", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30")));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Material usage from production jobs
    const materialUsage = await prisma.$queryRaw`
      SELECT
        COALESCE(pj."material", 'unknown') AS "materialId",
        COALESCE(pj."materialLabel", pj."material", 'Unknown') AS "materialName",
        COUNT(*)::int AS "jobCount",
        SUM(COALESCE(pj."quantity", 0))::int AS "totalUnits",
        SUM(
          CASE WHEN pj."widthIn" IS NOT NULL AND pj."heightIn" IS NOT NULL
          THEN (pj."widthIn" * pj."heightIn" * COALESCE(pj."quantity", 1)) / 144.0
          ELSE 0 END
        ) AS "totalSqFt",
        COUNT(DISTINCT oi."orderId")::int AS "orderCount"
      FROM "ProductionJob" pj
      JOIN "OrderItem" oi ON oi.id = pj."orderItemId"
      WHERE pj."createdAt" >= ${since}
        AND pj."material" IS NOT NULL
      GROUP BY pj."material", pj."materialLabel"
      ORDER BY COUNT(*) DESC
    ` as Array<{
      materialId: string;
      materialName: string;
      jobCount: number;
      totalUnits: number;
      totalSqFt: number;
      orderCount: number;
    }>;

    // Finishing usage stats
    const finishingUsage = await prisma.$queryRaw`
      SELECT
        COALESCE(pj."finishing", 'none') AS "finishingId",
        COALESCE(pj."finishingLabel", pj."finishing", 'None') AS "finishingName",
        COUNT(*)::int AS "jobCount",
        SUM(COALESCE(pj."quantity", 0))::int AS "totalUnits"
      FROM "ProductionJob" pj
      WHERE pj."createdAt" >= ${since}
        AND pj."finishing" IS NOT NULL
        AND pj."finishing" != ''
      GROUP BY pj."finishing", pj."finishingLabel"
      ORDER BY COUNT(*) DESC
    ` as Array<{
      finishingId: string;
      finishingName: string;
      jobCount: number;
      totalUnits: number;
    }>;

    // Material stock levels (from Material model)
    const stockLevels = await prisma.material.findMany({
      where: { isActive: true },
      select: {
        id: true,
        type: true,
        name: true,
        stockQty: true,
        costPerSqft: true,
        lamination: true,
      },
      orderBy: { stockQty: "asc" },
      take: 20,
    });

    // Cost analysis: material cost from order items
    const costByMaterial = await prisma.$queryRaw`
      SELECT
        COALESCE(pj."materialLabel", pj."material", 'Unknown') AS "materialName",
        SUM(oi."materialCostCents")::int AS "totalMaterialCost",
        SUM(oi."totalPrice")::int AS "totalRevenue",
        COUNT(*)::int AS "itemCount"
      FROM "OrderItem" oi
      JOIN "ProductionJob" pj ON pj."orderItemId" = oi.id
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o."paymentStatus" = 'paid'
        AND o."createdAt" >= ${since}
        AND pj."material" IS NOT NULL
      GROUP BY pj."materialLabel", pj."material"
      ORDER BY SUM(oi."materialCostCents") DESC
    ` as Array<{
      materialName: string;
      totalMaterialCost: number;
      totalRevenue: number;
      itemCount: number;
    }>;

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      materialUsage: materialUsage.map((m) => ({
        ...m,
        totalSqFt: Math.round(Number(m.totalSqFt) * 100) / 100,
      })),
      finishingUsage,
      stockLevels,
      costByMaterial: costByMaterial.map((c) => ({
        ...c,
        marginPct: c.totalRevenue > 0
          ? Math.round(((c.totalRevenue - c.totalMaterialCost) / c.totalRevenue) * 10000) / 100
          : 0,
      })),
      summary: {
        totalMaterials: materialUsage.length,
        totalSqFtUsed: Math.round(materialUsage.reduce((s, m) => s + Number(m.totalSqFt), 0) * 100) / 100,
        totalJobs: materialUsage.reduce((s, m) => s + m.jobCount, 0),
        lowStockCount: stockLevels.filter((s) => s.stockQty < 5).length,
      },
    });
  } catch (error) {
    console.error("[Materials Analytics] Error:", error);
    return NextResponse.json({ error: "Failed to fetch material analytics" }, { status: 500 });
  }
}
