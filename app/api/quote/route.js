// app/api/quote/route.js
// POST /api/quote — compute a price quote for a product.
// Input:  { slug, quantity, widthIn?, heightIn?, material?, sizeLabel?, addons?, finishings? }
// Output: { totalCents, currency, breakdown[], meta, unitCents }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeQuote, normalizeInput } from "@/lib/pricing";
import { validateDimensions } from "@/lib/materialLimits";

function getOptionsMaterialMultiplier(optionsConfig, materialId) {
  if (!materialId || !optionsConfig || typeof optionsConfig !== "object") return 1.0;
  const mats = Array.isArray(optionsConfig.materials) ? optionsConfig.materials : [];
  const lower = materialId.toLowerCase();
  const mat = mats.find(
    (m) => m && typeof m === "object" && (m.id === materialId || m.name?.toLowerCase() === lower)
  );
  return mat && typeof mat.multiplier === "number" ? mat.multiplier : 1.0;
}

function getLegacyDiscount(qty) {
  if (qty >= 1000) return 0.82;
  if (qty >= 500) return 0.88;
  if (qty >= 250) return 0.93;
  if (qty >= 100) return 0.97;
  return 1;
}

function computeAddonsCents(product, input) {
  // add-ons (flat/per_unit) for options-based products
  let addonsCents = 0;
  const qty = input.quantity;
  const selectedAddons = Array.isArray(input.addons) ? input.addons : [];
  const addonDefs =
    product.optionsConfig && typeof product.optionsConfig === "object" && Array.isArray(product.optionsConfig.addons)
      ? product.optionsConfig.addons
      : [];

  for (const addonId of selectedAddons) {
    const def = addonDefs.find((a) => a && typeof a === "object" && a.id === addonId);
    if (!def) continue;
    const cents =
      typeof def.unitCents === "number"
        ? Math.round(def.unitCents)
        : typeof def.priceCents === "number"
          ? Math.round(def.priceCents)
          : typeof def.price === "number"
            ? Math.round(def.price * 100)
            : 0;
    const type = def.type || "per_unit";
    if (type === "flat") addonsCents += cents;
    else addonsCents += cents * qty;
  }

  return addonsCents;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    // Look up product + preset
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { pricingPreset: true },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Normalize input
    const input = normalizeInput(body);

    // Material-limits validation (for area-based products)
    if (input.widthIn != null && input.heightIn != null) {
      const dimCheck = validateDimensions(
        input.widthIn,
        input.heightIn,
        input.material || null,
        product
      );
      if (!dimCheck.valid) {
        return NextResponse.json(
          { error: "Dimension validation failed", details: dimCheck.errors },
          { status: 422 }
        );
      }
    }

    // If product has a pricing preset, use the engine
    if (product.pricingPreset) {
      const result = computeQuote(product.pricingPreset, input);
      return NextResponse.json({
        ...result,
        unitCents: Math.round(result.totalCents / input.quantity),
      });
    }

    // Fallback: optionsConfig size pricing (useful for fixed-size SKUs like stamps)
    if (input.sizeLabel && product.optionsConfig && typeof product.optionsConfig === "object") {
      const sizes = Array.isArray(product.optionsConfig.sizes) ? product.optionsConfig.sizes : [];
      const match =
        sizes.find((s) => s && typeof s === "object" && s.label === input.sizeLabel) ||
        sizes.find((s) => s && typeof s === "object" && s.id === input.sizeLabel);

      let unitCents = null;
      const qty = input.quantity;

      // 0) Exact total pricing by quantity (avoids rounding issues for per-unit cents)
      if (match && match.priceByQty && typeof match.priceByQty === "object") {
        const baseTotalRaw = match.priceByQty[String(qty)];
        const baseTotalCents =
          typeof baseTotalRaw === "number" && Number.isFinite(baseTotalRaw) ? Math.round(baseTotalRaw) : null;

        if (baseTotalCents != null && baseTotalCents > 0) {
          const addonsCents = computeAddonsCents(product, input);
          const totalCents = baseTotalCents + addonsCents;
          const displayUnitCents = Math.round(totalCents / qty);

          return NextResponse.json({
            totalCents,
            currency: "CAD",
            breakdown: [
              {
                label: `${qty} pcs @ ${(displayUnitCents / 100).toFixed(2)}/ea (size: ${input.sizeLabel})`,
                amount: baseTotalCents,
              },
              ...(addonsCents > 0 ? [{ label: "Selected add-ons", amount: addonsCents }] : []),
            ],
            meta: { model: "OPTIONS_EXACT_QTY", sizeLabel: input.sizeLabel, addonsCents },
            unitCents: displayUnitCents,
          });
        }
      }

      // 1) Tiered size pricing (qty-based)
      if (match && Array.isArray(match.tiers) && match.tiers.length > 0) {
        const tiers = [...match.tiers]
          .filter((tier) => tier && typeof tier === "object")
          .map((tier) => ({
            minQty: Number(tier.minQty ?? tier.qty ?? 0),
            unitCents:
              typeof tier.unitCents === "number"
                ? Math.round(tier.unitCents)
                : typeof tier.unitPriceCents === "number"
                  ? Math.round(tier.unitPriceCents)
                  : null,
          }))
          .filter((tier) => Number.isFinite(tier.minQty) && tier.unitCents != null && tier.unitCents > 0)
          .sort((a, b) => a.minQty - b.minQty);

        if (tiers.length > 0) {
          let selected = tiers[0];
          for (const tier of tiers) {
            if (qty >= tier.minQty) selected = tier;
          }
          unitCents = selected.unitCents;
        }
      }

      // 2) Flat per-size unit
      if (unitCents == null) {
        unitCents =
          match && typeof match.unitCents === "number"
            ? Math.round(match.unitCents)
            : match && typeof match.unitPriceCents === "number"
              ? Math.round(match.unitPriceCents)
              : null;
      }

      // 3) Size multiplier on legacy basePrice
      if (unitCents == null && match && typeof match.sizeMultiplier === "number" && product.basePrice > 0) {
        const discount = getLegacyDiscount(qty);
        unitCents = Math.max(1, Math.round(product.basePrice * Number(match.sizeMultiplier) * discount));
      }

      if (unitCents != null && Number.isFinite(unitCents) && unitCents > 0) {
        const addonsCents = computeAddonsCents(product, input);
        const totalCents = unitCents * qty + addonsCents;

        return NextResponse.json({
          totalCents,
          currency: "CAD",
          breakdown: [
            {
              label: `${qty} pcs @ ${(unitCents / 100).toFixed(2)}/ea (size: ${input.sizeLabel})`,
              amount: unitCents * qty,
            },
            ...(addonsCents > 0 ? [{ label: "Selected add-ons", amount: addonsCents }] : []),
          ],
          meta: { model: "OPTIONS_SIZE", sizeLabel: input.sizeLabel, addonsCents },
          unitCents,
        });
      }

      // If this product is meant to be priced by size and there's no basePrice, surface a clear error.
      if (!product.basePrice || product.basePrice <= 0) {
        return NextResponse.json(
          { error: "Price not configured for selected size", details: { sizeLabel: input.sizeLabel } },
          { status: 422 }
        );
      }
    }

    // Fallback: use legacy basePrice + simple tier discounts + material multiplier
    const qty = input.quantity;
    const discount = getLegacyDiscount(qty);
    const matMul = getOptionsMaterialMultiplier(product.optionsConfig, input.material);

    const isPerSqft = product.pricingUnit === "per_sqft";
    let unitCents;
    if (isPerSqft && input.widthIn && input.heightIn) {
      const sqft = (input.widthIn * input.heightIn) / 144;
      unitCents = Math.max(1, Math.round(product.basePrice * matMul * sqft * discount));
    } else {
      unitCents = Math.max(1, Math.round(product.basePrice * matMul * discount));
    }

    const totalCents = unitCents * qty;
    const breakdown = [
      {
        label: `${qty} pcs @ ${(unitCents / 100).toFixed(2)}/ea (legacy pricing)`,
        amount: totalCents,
      },
    ];

    if (matMul !== 1.0) {
      breakdown.push({ label: `Material: ${input.material} (${matMul}x)`, amount: 0 });
    }

    return NextResponse.json({
      totalCents,
      currency: "CAD",
      breakdown,
      meta: { model: "LEGACY", discount, materialMultiplier: matMul },
      unitCents,
    });
  } catch (err) {
    console.error("[/api/quote]", err);
    return NextResponse.json(
      { error: err.message || "Quote calculation failed" },
      { status: 400 }
    );
  }
}
