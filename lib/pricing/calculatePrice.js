export function calculatePrice(product, inputs) {
  if (!product || !inputs) throw new Error("Missing product or inputs");

  const config = product.config || {};
  const qty = Number(inputs.quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantity must be greater than 0");

  const w = Number(inputs.width);
  const h = Number(inputs.height);
  const sizeLabel = inputs.sizeLabel;

  const breakdown = {
    model: product.pricingModel,
    qtyRequested: qty,
    qtyBillable: qty,
    unitPrice: 0,
    fileFee: Number(config.fileFee || 0),
    addons: [],
    minimumPrice: Number(config.minimumPrice || 0),
  };

  let baseAmount = 0;

  if (product.pricingModel === "area_tier") {
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      throw new Error("Dimensions must be greater than 0");
    }
    const singleArea = w * h;
    const tiers = [...(config.tiers || [])].sort((a, b) => a.upTo - b.upTo);
    if (tiers.length === 0) throw new Error("No area tiers defined");

    const tier = tiers.find(t => singleArea <= t.upTo) || tiers[tiers.length - 1];
    breakdown.unitPrice = singleArea * tier.rate; // per piece
    baseAmount = breakdown.unitPrice * qty;
  }

  else if (product.pricingModel === "fixed_size_tier") {
    const sizes = config.sizes || [];
    const sizeEntry = sizes.find(s => s.label === sizeLabel);
    if (!sizeEntry) throw new Error(`Size ${sizeLabel} not supported`);

    const tiers = [...(sizeEntry.tiers || [])].sort((a, b) => a.qty - b.qty);
    if (tiers.length === 0) throw new Error("No quantity tiers defined");

    let tier = tiers.find(t => t.qty >= qty);
    
    // MOQ 策略 B
    if (tier) {
      breakdown.qtyBillable = tier.qty;
    } else {
      tier = tiers[tiers.length - 1];
      breakdown.qtyBillable = qty;
    }

    breakdown.unitPrice = tier.price;
    baseAmount = tier.price * breakdown.qtyBillable;
  }

  // Add-ons
  let addonAmount = 0;
  (inputs.addons || []).forEach(addonId => {
    const def = (product.options?.addons || []).find(a => a.id === addonId);
    if (!def) return;

    let amt = 0;
    if (def.type === "flat") amt = def.price;
    else if (def.type === "per_unit") amt = def.price * breakdown.qtyBillable;
    else if (def.type === "per_area") amt = (w * h) * def.price * breakdown.qtyBillable;

    addonAmount += amt;
    breakdown.addons.push({ id: def.id, name: def.name, amount: amt });
  });

  const total = baseAmount + addonAmount + breakdown.fileFee;
  const final = Math.max(total, breakdown.minimumPrice);

  return { total: final, breakdown };
}