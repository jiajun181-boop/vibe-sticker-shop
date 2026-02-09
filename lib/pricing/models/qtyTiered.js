// lib/pricing/models/qtyTiered.js
// QTY_TIERED — price = unitPrice(tier) * qty, MOQ bump if below first tier

/**
 * @param {object} config  PricingPreset.config JSON
 * @param {object} input   { quantity }
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

  const lineTotal = unitPriceDollars * billableQty;
  const rawTotal = lineTotal + fileFee;
  const totalDollars = Math.max(rawTotal, minimumPrice);
  const totalCents = Math.round(totalDollars * 100);

  return {
    totalCents,
    currency: "CAD",
    breakdown: [
      {
        label: `${billableQty} pcs @ $${unitPriceDollars.toFixed(2)}/ea`,
        amount: Math.round(lineTotal * 100),
      },
      ...(billableQty > qty
        ? [{ label: `MOQ bump (${qty} → ${billableQty})`, amount: 0 }]
        : []),
      ...(fileFee > 0
        ? [{ label: "File / setup fee", amount: Math.round(fileFee * 100) }]
        : []),
      ...(rawTotal < minimumPrice
        ? [
            {
              label: "Minimum order adjustment",
              amount: Math.round((minimumPrice - rawTotal) * 100),
            },
          ]
        : []),
    ],
    meta: {
      model: "QTY_TIERED",
      tierMinQty: Number(tier.minQty),
      unitCents: Math.round(unitPriceDollars * 100),
      billableQty,
      fileFee: Math.round(fileFee * 100),
    },
  };
}
