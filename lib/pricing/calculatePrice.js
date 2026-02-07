/**
 * 定价引擎核心 (Final GM Version)
 * 支持：MOQ 策略 B + Breakdown 返回 + tierApplied + Addon Types
 */
export function calculatePrice(product, inputs) {
  if (!product || !inputs) throw new Error("Missing product or inputs");

  const config = product.config || {};
  const qtyRequested = Number(inputs.quantity);

  if (!Number.isFinite(qtyRequested) || qtyRequested <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  const w = Number(inputs.width);
  const h = Number(inputs.height);
  const sizeLabel = inputs.sizeLabel;

  const breakdown = {
    model: product.pricingModel,
    qtyRequested,
    qtyBillable: qtyRequested,
    tierMinQty: 0,
    tierApplied: "",

    unitPrice: 0, 
    areaPerUnit: 0,

    fileFee: Number(config.fileFee || 0),
    minimumPrice: Number(config.minimumPrice || 0),

    addons: [],
    addonsTotal: 0,
  };

  let baseAmount = 0;

  // --- 模型 A: 面积阶梯 (area_tier) ---
  if (product.pricingModel === "area_tier") {
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      throw new Error("Dimensions must be greater than 0");
    }

    const singleArea = w * h;
    const tiers = [...(config.tiers || [])].sort((a, b) => Number(a.upTo) - Number(b.upTo));
    if (!tiers.length) throw new Error("No area tiers defined");

    const tier = tiers.find((t) => singleArea <= Number(t.upTo)) || tiers[tiers.length - 1];
    if (!tier) throw new Error("No pricing tier matched");

    const rate = Number(tier.rate);
    breakdown.areaPerUnit = singleArea;
    breakdown.unitPrice = rate;
    breakdown.tierApplied = `area<=${Number(tier.upTo)} @ ${rate.toFixed(6)}`;

    baseAmount = singleArea * rate * qtyRequested;
  }

  // --- 模型 B: 固定尺寸阶梯 (fixed_size_tier) ---
  else if (product.pricingModel === "fixed_size_tier") {
    const sizes = config.sizes || [];
    const sizeEntry = sizes.find((s) => s.label === sizeLabel);
    if (!sizeEntry) throw new Error(`Size ${sizeLabel} not supported`);

    const tiers = [...(sizeEntry.tiers || [])].sort((a, b) => Number(a.qty) - Number(b.qty));
    if (!tiers.length) throw new Error("No quantity tiers defined");

    let tier = tiers.find((t) => Number(t.qty) >= qtyRequested);
    let billableQty = qtyRequested;
    
    // MOQ 策略 B
    if (tier) {
      billableQty = Number(tier.qty);
    } else {
      tier = tiers[tiers.length - 1];
      billableQty = qtyRequested;
    }

    const tierQty = Number(tier.qty);
    const unit = Number(tier.price);

    breakdown.qtyBillable = billableQty;
    breakdown.tierMinQty = tierQty;
    breakdown.unitPrice = unit;
    breakdown.tierApplied = `${String(sizeLabel)} | requested=${qtyRequested} | billed=${billableQty} | tier>=${tierQty} | unit=${unit.toFixed(2)}`;

    baseAmount = unit * billableQty;
  }

  // --- 模型 C: 一口价 (unit_flat) ---
  else if (product.pricingModel === "unit_flat") {
    const unit = Number(config.unitPrice);
    breakdown.unitPrice = unit;
    breakdown.tierApplied = `unit_flat @ ${unit.toFixed(2)}`;
    baseAmount = unit * qtyRequested;
  }

  // --- Add-ons 计算 ---
  let addonsTotal = 0;
  const selectedAddons = Array.isArray(inputs.addons) ? inputs.addons : [];
  const addonDefs = product.options?.addons || [];

  selectedAddons.forEach((addonId) => {
    const def = addonDefs.find((a) => a.id === addonId);
    if (!def) return;

    const price = Number(def.price || 0);
    const type = def.type || "per_unit";

    let amt = 0;
    if (type === "flat") {
      amt = price;
    } else if (type === "per_unit") {
      amt = price * breakdown.qtyBillable;
    } else if (type === "per_area") {
      if (w > 0 && h > 0) amt = (w * h) * price * breakdown.qtyBillable;
    }

    addonsTotal += amt;
    breakdown.addons.push({ id: def.id, name: def.name, amount: amt });
  });

  breakdown.addonsTotal = Number(addonsTotal.toFixed(2));

  const totalRaw = baseAmount + addonsTotal + breakdown.fileFee;
  const totalFinal = Math.max(totalRaw, breakdown.minimumPrice);

  if (!Number.isFinite(totalFinal) || totalFinal <= 0) throw new Error("Calculation error");

  return { total: totalFinal, breakdown };
}