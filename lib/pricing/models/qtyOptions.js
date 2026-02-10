// lib/pricing/models/qtyOptions.js
// QTY_OPTIONS — fixed sizes × qty tiers + optional add-on surcharges + material multiplier + finishings
// Designed for paper goods (business cards, postcards, etc.)

import { resolveMaterialMultiplier, computeFinishings } from "../shared.js";

/**
 * @param {object} config  PricingPreset.config JSON
 * @param {object} input   { sizeLabel, quantity, addons?: string[], material?, finishings? }
 * @returns {{ totalCents, currency, breakdown, meta }}
 */
export function compute(config, input) {
  const { sizeLabel, quantity, addons: selectedAddons = [] } = input;
  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new Error("Quantity must be > 0");

  // Find the requested size entry
  const sizes = config.sizes || [];
  const sizeEntry = sizes.find((s) => s.label === sizeLabel);
  if (!sizeEntry) {
    const available = sizes.map((s) => s.label).join(", ");
    throw new Error(
      `Size "${sizeLabel}" not available. Options: ${available || "none"}`
    );
  }

  // Find qty tier — sorted ascending, pick highest tier where tier.qty <= qty
  const tiers = [...(sizeEntry.tiers || [])].sort(
    (a, b) => Number(a.qty) - Number(b.qty)
  );
  if (!tiers.length) throw new Error("No quantity tiers for this size");

  let tier = tiers[0];
  for (const t of tiers) {
    if (qty >= Number(t.qty)) tier = t;
  }

  const billableQty = Math.max(qty, Number(tiers[0].qty));
  const unitPriceDollars = Number(tier.unitPrice);

  // Material multiplier
  const matMul = resolveMaterialMultiplier(config, input.material);

  const lineTotal = unitPriceDollars * matMul * billableQty;

  const breakdown = [
    {
      label: `${sizeLabel} x ${billableQty} pcs @ $${(unitPriceDollars * matMul).toFixed(2)}/ea`,
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

  // Add-ons (existing logic preserved)
  const addonDefs = config.addons || [];
  let addonsTotal = 0;

  for (const addonId of selectedAddons) {
    const def = addonDefs.find((a) => a.id === addonId);
    if (!def) continue;

    const price = Number(def.price || 0);
    const type = def.type || "per_unit";
    let amt = 0;

    if (type === "flat") {
      amt = price;
    } else if (type === "per_unit") {
      amt = price * billableQty;
    }

    addonsTotal += amt;
    breakdown.push({
      label: `Add-on: ${def.name || addonId}`,
      amount: Math.round(amt * 100),
    });
  }

  // Finishings
  const fin = computeFinishings(config, input.finishings, { quantity: billableQty, sqftPerUnit: 0 });

  for (const line of fin.lines) {
    breakdown.push(line);
  }

  const fileFee = Number(config.fileFee || 0);
  const minimumPrice = Number(config.minimumPrice || 0);

  if (fileFee > 0) {
    breakdown.push({
      label: "File / setup fee",
      amount: Math.round(fileFee * 100),
    });
  }

  const rawTotal = lineTotal + addonsTotal + fin.totalDollars + fileFee;
  const totalDollars = Math.max(rawTotal, minimumPrice);

  if (rawTotal < minimumPrice) {
    breakdown.push({
      label: "Minimum order adjustment",
      amount: Math.round((minimumPrice - rawTotal) * 100),
    });
  }

  const totalCents = Math.round(totalDollars * 100);

  return {
    totalCents,
    currency: "CAD",
    breakdown,
    meta: {
      model: "QTY_OPTIONS",
      sizeLabel,
      tierQty: Number(tier.qty),
      materialMultiplier: matMul,
      unitCents: Math.round(unitPriceDollars * matMul * 100),
      billableQty,
      addonsTotal: Math.round(addonsTotal * 100),
      finishingsTotal: Math.round(fin.totalDollars * 100),
      fileFee: Math.round(fileFee * 100),
    },
  };
}
