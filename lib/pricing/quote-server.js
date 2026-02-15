import { computeQuote, normalizeInput } from "@/lib/pricing";
import { computeFinishings } from "@/lib/pricing/shared.js";
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

function tryExactOptionsPriceByQtyQuote(product, input) {
  if (!input.sizeLabel) return null;
  if (!product.optionsConfig || typeof product.optionsConfig !== "object") return null;

  const sizes = Array.isArray(product.optionsConfig.sizes) ? product.optionsConfig.sizes : [];
  const match =
    sizes.find((s) => s && typeof s === "object" && s.label === input.sizeLabel) ||
    sizes.find((s) => s && typeof s === "object" && s.id === input.sizeLabel);
  if (!match || !match.priceByQty || typeof match.priceByQty !== "object") return null;

  const qty = input.quantity;
  const baseTotalRaw = match.priceByQty[String(qty)];
  const baseTotalCents =
    typeof baseTotalRaw === "number" && Number.isFinite(baseTotalRaw) ? Math.round(baseTotalRaw) : null;
  if (baseTotalCents == null || baseTotalCents <= 0) return null;

  const addonsCents = computeAddonsCents(product, input);
  const fin = product.pricingPreset?.config
    ? computeFinishings(product.pricingPreset.config, input.finishings, { quantity: qty, sqftPerUnit: 0 })
    : { totalDollars: 0, lines: [] };
  const finishingsCents = Math.round(Number(fin.totalDollars || 0) * 100);
  const totalCents = baseTotalCents + addonsCents + finishingsCents;
  const displayUnitCents = Math.round(totalCents / qty);

  return {
    totalCents,
    currency: "CAD",
    breakdown: [
      {
        label: `${qty} pcs @ ${(displayUnitCents / 100).toFixed(2)}/ea (size: ${input.sizeLabel})`,
        amount: baseTotalCents,
      },
      ...(addonsCents > 0 ? [{ label: "Selected add-ons", amount: addonsCents }] : []),
      ...((fin.lines || []).map((l) => ({
        label: l.label,
        amount: typeof l.amount === "number" ? Math.round(l.amount) : 0,
      }))),
    ],
    meta: { model: "OPTIONS_EXACT_QTY", sizeLabel: input.sizeLabel, addonsCents, finishingsCents },
    unitCents: displayUnitCents,
  };
}

function quoteByInput(product, input) {
  const exact = tryExactOptionsPriceByQtyQuote(product, input);
  if (exact) return exact;

  if (product.pricingPreset) {
    const result = computeQuote(product.pricingPreset, input);
    return {
      ...result,
      unitCents: Math.round(result.totalCents / input.quantity),
    };
  }

  if (input.sizeLabel && product.optionsConfig && typeof product.optionsConfig === "object") {
    const sizes = Array.isArray(product.optionsConfig.sizes) ? product.optionsConfig.sizes : [];
    const match =
      sizes.find((s) => s && typeof s === "object" && s.label === input.sizeLabel) ||
      sizes.find((s) => s && typeof s === "object" && s.id === input.sizeLabel);

    let unitCents = null;
    const qty = input.quantity;

    if (match && match.priceByQty && typeof match.priceByQty === "object") {
      const baseTotalRaw = match.priceByQty[String(qty)];
      const baseTotalCents =
        typeof baseTotalRaw === "number" && Number.isFinite(baseTotalRaw) ? Math.round(baseTotalRaw) : null;

      if (baseTotalCents != null && baseTotalCents > 0) {
        const addonsCents = computeAddonsCents(product, input);
        const totalCents = baseTotalCents + addonsCents;
        const displayUnitCents = Math.round(totalCents / qty);

        return {
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
        };
      }
    }

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

    if (unitCents == null) {
      unitCents =
        match && typeof match.unitCents === "number"
          ? Math.round(match.unitCents)
          : match && typeof match.unitPriceCents === "number"
            ? Math.round(match.unitPriceCents)
            : null;
    }

    if (unitCents == null && match && typeof match.sizeMultiplier === "number" && product.basePrice > 0) {
      const discount = getLegacyDiscount(qty);
      unitCents = Math.max(1, Math.round(product.basePrice * Number(match.sizeMultiplier) * discount));
    }

    if (unitCents != null && Number.isFinite(unitCents) && unitCents > 0) {
      const addonsCents = computeAddonsCents(product, input);
      const totalCents = unitCents * qty + addonsCents;

      return {
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
      };
    }

    if (!product.basePrice || product.basePrice <= 0) {
      const err = new Error("Price not configured for selected size");
      err.status = 422;
      err.details = { sizeLabel: input.sizeLabel };
      throw err;
    }
  }

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

  return {
    totalCents,
    currency: "CAD",
    breakdown,
    meta: { model: "LEGACY", discount, materialMultiplier: matMul },
    unitCents,
  };
}

export function quoteProduct(product, rawBody) {
  const input = normalizeInput(rawBody);

  if (input.widthIn != null && input.heightIn != null) {
    const dimCheck = validateDimensions(
      input.widthIn,
      input.heightIn,
      input.material || null,
      product
    );
    if (!dimCheck.valid) {
      const err = new Error("Dimension validation failed");
      err.status = 422;
      err.details = dimCheck.errors;
      throw err;
    }
  }

  return quoteByInput(product, input);
}

