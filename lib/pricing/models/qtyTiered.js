// lib/pricing/models/qtyTiered.js
// QTY_TIERED — price = unitPrice(tier) * materialMultiplier * qty + finishings, MOQ bump if below first tier

import { resolveMaterialMultiplier, computeFinishings } from "../shared.js";

/**
 * @param {object} config  PricingPreset.config JSON
 * @param {object} input   { quantity, material?, finishings? }
 * @returns {{ totalCents, currency, breakdown, meta }}
 */
export function compute(config, input) {
  const qty = Number(input.quantity);
  if (!qty || qty <= 0) throw new Error("Quantity must be > 0");

  // Tiers sorted ascending by minQty
  const tiers = [...(config.tiers || [])].sort(
    (a, b) => Number(a.minQty) - Number(b.minQty)
  );
  if (!tiers.length) throw new Error("No quantity tiers configured");

  // Find the highest tier where minQty <= qty (best price for this qty)
  let tier = tiers[0];
  for (const t of tiers) {
    if (qty >= Number(t.minQty)) tier = t;
  }

  const billableQty = Math.max(qty, Number(tiers[0].minQty));
  const unitPriceDollars = Number(tier.unitPrice);
  const fileFee = Number(config.fileFee || 0);
  const minimumPrice = Number(config.minimumPrice || 0);

  // Material multiplier
  const matMul = resolveMaterialMultiplier(config, input.material);

  const lineTotal = unitPriceDollars * matMul * billableQty;

  // Finishings
  const fin = computeFinishings(config, input.finishings, { quantity: billableQty, sqftPerUnit: 0 });

  const rawTotal = lineTotal + fin.totalDollars + fileFee;
  const totalDollars = Math.max(rawTotal, minimumPrice);
  const totalCents = Math.round(totalDollars * 100);

  const breakdown = [
    {
      label: `${billableQty} pcs @ $${(unitPriceDollars * matMul).toFixed(2)}/ea`,
      amount: Math.round(lineTotal * 100),
    },
  ];

  if (billableQty > qty) {
    breakdown.push({ label: `MOQ bump (${qty} → ${billableQty})`, amount: 0 });
  }

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
      model: "QTY_TIERED",
      tierMinQty: Number(tier.minQty),
      materialMultiplier: matMul,
      unitCents: Math.round(unitPriceDollars * matMul * 100),
      billableQty,
      finishingsTotal: Math.round(fin.totalDollars * 100),
      fileFee: Math.round(fileFee * 100),
    },
  };
}
