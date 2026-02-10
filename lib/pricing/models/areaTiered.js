// lib/pricing/models/areaTiered.js
// AREA_TIERED — price = rate(tier) * materialMultiplier * sqft * qty + finishings + fileFee, floor = minimumPrice

import { resolveMaterialMultiplier, computeFinishings } from "../shared.js";

/**
 * @param {object} config  PricingPreset.config JSON
 * @param {object} input   { widthIn, heightIn, quantity, material?, finishings? }
 * @returns {{ totalCents, currency, breakdown, meta }}
 */
export function compute(config, input) {
  const { widthIn, heightIn, quantity } = input;
  const w = Number(widthIn);
  const h = Number(heightIn);
  const qty = Number(quantity);

  if (!w || w <= 0 || !h || h <= 0) throw new Error("Dimensions must be > 0");
  if (!qty || qty <= 0) throw new Error("Quantity must be > 0");

  const sqft = (w * h) / 144;

  // Tiers sorted ascending by upToSqft
  const tiers = [...(config.tiers || [])].sort(
    (a, b) => Number(a.upToSqft) - Number(b.upToSqft)
  );
  if (!tiers.length) throw new Error("No area tiers configured");

  const tier =
    tiers.find((t) => sqft <= Number(t.upToSqft)) || tiers[tiers.length - 1];

  const rateDollars = Number(tier.rate); // $/sqft
  const fileFee = Number(config.fileFee || 0);
  const minimumPrice = Number(config.minimumPrice || 0);

  // Material multiplier
  const matMul = resolveMaterialMultiplier(config, input.material);

  const lineTotal = rateDollars * matMul * sqft * qty;

  // Finishings
  const fin = computeFinishings(config, input.finishings, { quantity: qty, sqftPerUnit: sqft });

  const rawTotal = lineTotal + fin.totalDollars + fileFee;
  const totalDollars = Math.max(rawTotal, minimumPrice);
  const totalCents = Math.round(totalDollars * 100);

  const breakdown = [
    {
      label: `${w}" x ${h}" (${sqft.toFixed(3)} sqft) x ${qty}`,
      amount: Math.round(lineTotal * 100),
    },
  ];

  if (matMul !== 1.0) {
    breakdown.push({
      label: `Material: ${input.material} (${matMul}x)`,
      amount: 0,
    });
  }

  for (const line of fin.lines) {
    breakdown.push(line);
  }

  if (fileFee > 0) {
    breakdown.push({ label: "File / setup fee", amount: Math.round(fileFee * 100) });
  }

  if (rawTotal < minimumPrice) {
    breakdown.push({
      label: "Minimum order adjustment",
      amount: Math.round((minimumPrice - rawTotal) * 100),
    });
  }

  return {
    totalCents,
    currency: "CAD",
    breakdown,
    meta: {
      model: "AREA_TIERED",
      sqftPerUnit: sqft,
      tierRate: rateDollars,
      tierLabel: `<= ${tier.upToSqft} sqft @ $${rateDollars}/sqft`,
      materialMultiplier: matMul,
      unitCents: Math.round(rateDollars * matMul * sqft * 100),
      finishingsTotal: Math.round(fin.totalDollars * 100),
      fileFee: Math.round(fileFee * 100),
    },
  };
}
