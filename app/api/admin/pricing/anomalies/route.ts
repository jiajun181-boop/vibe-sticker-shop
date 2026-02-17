/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

function checkMonotonicNonIncreasing(values: number[]) {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[i - 1]) return false;
  }
  return true;
}

function extractUnitSeries(model: string, config: any): number[] {
  if (!config) return [];
  if (model === "QTY_TIERED" && Array.isArray(config.tiers)) {
    return config.tiers.map((t: any) => Number(t?.unitPrice)).filter((x: number) => Number.isFinite(x));
  }
  if (model === "AREA_TIERED" && Array.isArray(config.tiers)) {
    return config.tiers.map((t: any) => Number(t?.rate)).filter((x: number) => Number.isFinite(x));
  }
  if (model === "QTY_OPTIONS" && Array.isArray(config.sizes) && config.sizes[0]?.tiers) {
    return config.sizes[0].tiers
      .map((t: any) => Number(t?.unitPrice))
      .filter((x: number) => Number.isFinite(x));
  }
  return [];
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const [presets, productsWithoutPresetAndPrice] = await Promise.all([
      prisma.pricingPreset.findMany({
        where: { isActive: true },
        select: { id: true, key: true, name: true, model: true, config: true },
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          pricingPresetId: null,
          basePrice: { lte: 0 },
        },
        select: { id: true, name: true, slug: true, category: true, basePrice: true },
        take: 80,
      }),
    ]);

    const presetAnomalies: any[] = [];

    for (const p of presets) {
      const series = extractUnitSeries(p.model, p.config);
      if (!series.length) {
        presetAnomalies.push({
          type: "missing_tiers",
          presetId: p.id,
          key: p.key,
          name: p.name,
          message: "No numeric tiers/rates found",
        });
        continue;
      }
      const minValue = Math.min(...series);
      if (minValue <= 0) {
        presetAnomalies.push({
          type: "non_positive_price",
          presetId: p.id,
          key: p.key,
          name: p.name,
          message: `Contains non-positive price (${minValue})`,
        });
      }
      if (!checkMonotonicNonIncreasing(series)) {
        presetAnomalies.push({
          type: "non_monotonic_tiers",
          presetId: p.id,
          key: p.key,
          name: p.name,
          message: "Tier prices are not monotonic non-increasing",
        });
      }
    }

    return NextResponse.json({
      summary: {
        totalPresetsChecked: presets.length,
        presetAnomalies: presetAnomalies.length,
        productsMissingPrice: productsWithoutPresetAndPrice.length,
      },
      presetAnomalies: presetAnomalies.slice(0, 120),
      productsMissingPrice: productsWithoutPresetAndPrice,
    });
  } catch (err) {
    console.error("[Pricing anomalies] GET failed:", err);
    return NextResponse.json({ error: "Failed to analyze pricing anomalies" }, { status: 500 });
  }
}
