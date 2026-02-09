// lib/pricing/models/areaTiered.js
// AREA_TIERED — price = rate(tier) * sqft * qty + fileFee, floor = minimumPrice

/**
 * @param {object} config  PricingPreset.config JSON
 * @param {object} input   { widthIn, heightIn, quantity }
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

  const lineTotal = rateDollars * sqft * qty;
  const rawTotal = lineTotal + fileFee;
  const totalDollars = Math.max(rawTotal, minimumPrice);
  const totalCents = Math.round(totalDollars * 100);

  return {
    totalCents,
    currency: "CAD",
    breakdown: [
      {
        label: `${w}" x ${h}" (${sqft.toFixed(3)} sqft) x ${qty}`,
        amount: Math.round(lineTotal * 100),
      },
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
      model: "AREA_TIERED",
      sqftPerUnit: sqft,
      tierRate: rateDollars,
      tierLabel: `<= ${tier.upToSqft} sqft @ $${rateDollars}/sqft`,
      unitCents: Math.round(rateDollars * sqft * 100),
      fileFee: Math.round(fileFee * 100),
    },
  };
}
