/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { validatePresetConfig } from "@/lib/pricing/validate-config";
import { logActivity } from "@/lib/activity-log";
import { computeFromPrice } from "@/lib/pricing/from-price";

type AdjustFlags = {
  tiers: boolean;
  addons: boolean;
  finishings: boolean;
  minimumPrice: boolean;
  fileFee: boolean;
};

const DEFAULT_FLAGS: AdjustFlags = {
  tiers: true,
  addons: false,
  finishings: false,
  minimumPrice: false,
  fileFee: false,
};

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roundCurrency(value: number, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function adjustByPercent(value: number, percent: number, decimals = 3) {
  const scaled = value * (1 + percent / 100);
  const floored = Math.max(0, scaled);
  return roundCurrency(floored, decimals);
}

function adjustConfig(model: string, config: any, percent: number, flags: AdjustFlags) {
  const next = structuredClone(config || {});

  if (flags.minimumPrice && typeof next.minimumPrice === "number") {
    next.minimumPrice = adjustByPercent(asNumber(next.minimumPrice), percent, 2);
  }
  if (flags.fileFee && typeof next.fileFee === "number") {
    next.fileFee = adjustByPercent(asNumber(next.fileFee), percent, 2);
  }

  if (flags.addons && Array.isArray(next.addons)) {
    next.addons = next.addons.map((addon: any) => ({
      ...addon,
      price:
        typeof addon?.price === "number"
          ? adjustByPercent(asNumber(addon.price), percent, 3)
          : addon?.price,
    }));
  }

  if (flags.finishings && Array.isArray(next.finishings)) {
    next.finishings = next.finishings.map((fin: any) => ({
      ...fin,
      price:
        typeof fin?.price === "number"
          ? adjustByPercent(asNumber(fin.price), percent, 3)
          : fin?.price,
    }));
  }

  if (flags.tiers) {
    if (model === "QTY_TIERED" && Array.isArray(next.tiers)) {
      next.tiers = next.tiers.map((tier: any) => ({
        ...tier,
        unitPrice:
          typeof tier?.unitPrice === "number"
            ? adjustByPercent(asNumber(tier.unitPrice), percent, 3)
            : tier?.unitPrice,
      }));
    }
    if (model === "AREA_TIERED" && Array.isArray(next.tiers)) {
      next.tiers = next.tiers.map((tier: any) => ({
        ...tier,
        rate:
          typeof tier?.rate === "number"
            ? adjustByPercent(asNumber(tier.rate), percent, 3)
            : tier?.rate,
      }));
    }
    if (model === "QTY_OPTIONS" && Array.isArray(next.sizes)) {
      next.sizes = next.sizes.map((size: any) => ({
        ...size,
        tiers: Array.isArray(size?.tiers)
          ? size.tiers.map((tier: any) => ({
              ...tier,
              unitPrice:
                typeof tier?.unitPrice === "number"
                  ? adjustByPercent(asNumber(tier.unitPrice), percent, 3)
                  : tier?.unitPrice,
            }))
          : size?.tiers,
      }));
    }
  }

  return next;
}

function sampleDelta(model: string, before: any, after: any) {
  if (model === "QTY_TIERED") {
    const b = before?.tiers?.[0]?.unitPrice;
    const a = after?.tiers?.[0]?.unitPrice;
    return typeof b === "number" && typeof a === "number" ? { field: "tiers[0].unitPrice", before: b, after: a } : null;
  }
  if (model === "AREA_TIERED") {
    const b = before?.tiers?.[0]?.rate;
    const a = after?.tiers?.[0]?.rate;
    return typeof b === "number" && typeof a === "number" ? { field: "tiers[0].rate", before: b, after: a } : null;
  }
  if (model === "QTY_OPTIONS") {
    const b = before?.sizes?.[0]?.tiers?.[0]?.unitPrice;
    const a = after?.sizes?.[0]?.tiers?.[0]?.unitPrice;
    return typeof b === "number" && typeof a === "number" ? { field: "sizes[0].tiers[0].unitPrice", before: b, after: a } : null;
  }
  return null;
}

function parseFlags(raw: any): AdjustFlags {
  return {
    tiers: Boolean(raw?.tiers ?? DEFAULT_FLAGS.tiers),
    addons: Boolean(raw?.addons ?? DEFAULT_FLAGS.addons),
    finishings: Boolean(raw?.finishings ?? DEFAULT_FLAGS.finishings),
    minimumPrice: Boolean(raw?.minimumPrice ?? DEFAULT_FLAGS.minimumPrice),
    fileFee: Boolean(raw?.fileFee ?? DEFAULT_FLAGS.fileFee),
  };
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const grouped = await prisma.product.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { category: "asc" },
    });
    return NextResponse.json(
      grouped.map((g) => ({
        category: g.category,
        productCount: g._count._all,
      })),
    );
  } catch (err) {
    console.error("[Pricing bulk-adjust] GET failed:", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const mode = body?.mode === "apply" ? "apply" : "preview";
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const percent = asNumber(body?.percent, NaN);
    const includeSharedPresets = Boolean(body?.includeSharedPresets);
    const flags = parseFlags(body?.adjust);

    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }
    if (!Number.isFinite(percent) || percent <= -95 || percent > 500) {
      return NextResponse.json({ error: "percent must be between -95 and 500" }, { status: 400 });
    }

    const categoryProducts = await prisma.product.findMany({
      where: { category, isActive: true, pricingPresetId: { not: null } },
      select: { id: true, pricingPresetId: true },
    });

    const presetIds = [...new Set(categoryProducts.map((p) => p.pricingPresetId).filter(Boolean))] as string[];
    if (!presetIds.length) {
      return NextResponse.json({
        mode,
        category,
        percent,
        flags,
        touchedPresets: 0,
        touchedProducts: 0,
        skippedShared: 0,
        invalidConfigs: 0,
        applied: 0,
        results: [],
      });
    }

    const [presets, usageRows] = await Promise.all([
      prisma.pricingPreset.findMany({
        where: { id: { in: presetIds } },
        select: { id: true, key: true, name: true, model: true, config: true },
      }),
      prisma.product.findMany({
        where: { pricingPresetId: { in: presetIds }, isActive: true },
        select: { pricingPresetId: true, category: true, id: true },
      }),
    ]);

    const usageByPreset = new Map<string, { total: number; inCategory: number; categories: Set<string> }>();
    for (const row of usageRows) {
      const presetId = row.pricingPresetId;
      if (!presetId) continue;
      const usage = usageByPreset.get(presetId) || { total: 0, inCategory: 0, categories: new Set<string>() };
      usage.total += 1;
      if (row.category === category) usage.inCategory += 1;
      usage.categories.add(row.category);
      usageByPreset.set(presetId, usage);
    }

    const results: any[] = [];
    const updates: any[] = [];
    const snapshots: Array<{ presetId: string; key: string; name: string; before: any; after: any }> = [];
    let skippedShared = 0;
    let invalidConfigs = 0;

    for (const preset of presets) {
      const usage = usageByPreset.get(preset.id) || { total: 0, inCategory: 0, categories: new Set<string>() };
      const sharedAcrossCategories = usage.categories.size > 1;
      if (sharedAcrossCategories && !includeSharedPresets) {
        skippedShared += 1;
        results.push({
          presetId: preset.id,
          key: preset.key,
          name: preset.name,
          model: preset.model,
          status: "skipped_shared",
          usage: {
            totalProducts: usage.total,
            inCategory: usage.inCategory,
            categories: [...usage.categories].sort(),
          },
        });
        continue;
      }

      const nextConfig = adjustConfig(preset.model, preset.config, percent, flags);
      const validation = validatePresetConfig(preset.model, nextConfig);
      if (!validation.valid) {
        invalidConfigs += 1;
        results.push({
          presetId: preset.id,
          key: preset.key,
          name: preset.name,
          model: preset.model,
          status: "invalid",
          errors: validation.errors,
        });
        continue;
      }

      const sample = sampleDelta(preset.model, preset.config, nextConfig);
      results.push({
        presetId: preset.id,
        key: preset.key,
        name: preset.name,
        model: preset.model,
        status: "ready",
        sample,
        usage: {
          totalProducts: usage.total,
          inCategory: usage.inCategory,
          categories: [...usage.categories].sort(),
        },
      });

      if (mode === "apply") {
        snapshots.push({
          presetId: preset.id,
          key: preset.key,
          name: preset.name,
          before: preset.config,
          after: nextConfig,
        });
        updates.push(
          prisma.pricingPreset.update({
            where: { id: preset.id },
            data: { config: nextConfig },
          }),
        );
      }
    }

    let applied = 0;
    let minPriceRefreshed = 0;
    if (mode === "apply" && updates.length) {
      await prisma.$transaction(updates);
      applied = updates.length;
      await logActivity({
        action: "bulk_adjust_apply",
        entity: "PricingBulkAdjust",
        actor: auth.user?.email || "admin",
        details: {
          category,
          percent,
          flags,
          includeSharedPresets,
          applied,
          touchedPresets: presets.length,
          touchedProducts: categoryProducts.length,
          snapshots,
        },
      });

      // Refresh minPrice for affected products
      try {
        const affectedProducts = await prisma.product.findMany({
          where: { category, isActive: true, pricingPresetId: { not: null } },
          include: { pricingPreset: true },
        });
        for (const p of affectedProducts) {
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
        console.warn("[Pricing bulk-adjust] minPrice refresh error:", e);
      }
    }

    return NextResponse.json({
      mode,
      category,
      percent,
      flags,
      touchedPresets: presets.length,
      touchedProducts: categoryProducts.length,
      skippedShared,
      invalidConfigs,
      applied,
      minPriceRefreshed,
      results,
    });
  } catch (err) {
    console.error("[Pricing bulk-adjust] POST failed:", err);
    return NextResponse.json({ error: "Failed to process bulk adjustment" }, { status: 500 });
  }
}
