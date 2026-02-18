// lib/pricing/models/costPlus.js
// COST_PLUS — smoothly interpolated area-based pricing
//
// Formula:
//   materialCost = material.costPerSqft × area_sqft × qty        (real, linear)
//   inkCost      = printMode.inkPerSqft × area_sqft × qty        (real, linear)
//   laborCost    = (area_sqm × qty / sqmPerHour) × hourlyRate    (machine time)
//   cuttingCost  = perimeter or area based                        (machine time)
//
//   ★ qtyEfficiency = interpolate(qtyTiers, qty)  — bulk runs cheaper per piece
//     applied to labor + cutting only (material & ink are real per-piece costs)
//
//   rawCost  = (materialCost + inkCost) + (laborCost + cuttingCost) × qtyEfficiency
//            × (1 + wasteFactor)
//   markup   = interpolate(markupTiers, area_sqft)  — smooth, floor 1.5×
//   price    = roundTo99(rawCost × markup + fileFee)
//           >= minimumPrice

const SQFT_TO_SQM = 1 / 10.7639;

/**
 * Linear interpolation between tier anchor points.
 * tiers = [{ maxSqft: 2, factor: 3.5 }, ...]  (or maxQty for qty tiers)
 * `key` = the field name to compare against (default "maxSqft")
 */
function interpolateTiers(tiers, value, floor = 0, key = "maxSqft") {
  if (!Array.isArray(tiers) || tiers.length === 0) return 2.5;
  if (tiers.length === 1) return Math.max(Number(tiers[0].factor), floor);

  if (value <= tiers[0][key]) {
    return Math.max(Number(tiers[0].factor), floor);
  }

  for (let i = 1; i < tiers.length; i++) {
    if (value <= tiers[i][key]) {
      const prev = tiers[i - 1];
      const curr = tiers[i];
      const t = (value - prev[key]) / (curr[key] - prev[key]);
      const val = Number(prev.factor) + t * (Number(curr.factor) - Number(prev.factor));
      return Math.max(val, floor);
    }
  }

  return Math.max(Number(tiers[tiers.length - 1].factor), floor);
}

function roundTo99(dollars) {
  return Math.floor(dollars) + 0.99;
}

/**
 * @param {object} config  PricingPreset.config JSON
 * @param {object} input   { widthIn, heightIn, quantity, printMode?, cutType?, isB2B? }
 * @returns {{ totalCents, currency, breakdown, meta }}
 */
export function compute(config, input) {
  const { widthIn, heightIn, quantity } = input;
  const w = Number(widthIn);
  const h = Number(heightIn);
  const qty = Number(quantity);

  if (!w || w <= 0 || !h || h <= 0) throw new Error("Dimensions must be > 0");
  if (!qty || qty <= 0) throw new Error("Quantity must be > 0");

  const areaSqft = (w * h) / 144;
  const areaSqm = areaSqft * SQFT_TO_SQM;
  const panelMult = Number(input.panelMultiplier || 1);
  const perimeterFt = ((2 * (w + h)) / 12) * panelMult;

  // ── Resolve material ──
  const materials = config.materials || {};
  const materialKey = input.material || config.defaultMaterial;
  const mat = materials[materialKey];
  if (!mat) throw new Error(`Unknown material: ${materialKey}`);
  const costPerSqft = Number(mat.costPerSqft);

  // ── Resolve print mode ──
  const inkCosts = config.inkCosts || {};
  const printModeKey = input.printMode || config.defaultPrintMode || "cmyk";
  const ink = inkCosts[printModeKey];
  if (!ink) throw new Error(`Unknown print mode: ${printModeKey}`);
  const inkPerSqft = Number(ink.inkPerSqft);
  const sqmPerHour = Number(ink.sqmPerHour);

  // ── Resolve cutting ──
  const cutting = config.cutting || {};
  const cutType = input.cutType || config.defaultCutType || "rectangular";
  const rectRate = Number(cutting.rectangularPerFt || 0.15);
  const contourRate = Number(cutting.contourPerSqft || 1.20);
  const contourMin = Number(cutting.contourMinimum || 8);

  // ── Resolve waste (interpolated by area) ──
  const wasteConfig = config.waste || {};
  const wasteTiers = wasteConfig.tiers;
  let wasteFactor;
  if (Array.isArray(wasteTiers) && wasteTiers.length > 0) {
    wasteFactor = interpolateTiers(wasteTiers, areaSqft, 0) / 100;
  } else {
    wasteFactor = Number(config.wasteFactor ?? 0.08);
  }

  // ── Resolve markup (interpolated by area, floor 1.5×) ──
  const markup = config.markup || {};
  const markupFloor = Number(markup.floor ?? 1.5);
  const markupTiers = input.isB2B ? markup.b2bTiers : markup.retailTiers;
  let markupFactor;
  if (Array.isArray(markupTiers) && markupTiers.length > 0) {
    markupFactor = interpolateTiers(markupTiers, areaSqft, markupFloor);
  } else {
    markupFactor = input.isB2B ? Number(markup.b2b || 1.8) : Number(markup.retail || 2.5);
    markupFactor = Math.max(markupFactor, markupFloor);
  }

  // ── Resolve quantity efficiency (interpolated by qty) ──
  // Applies to labor + cutting only — material & ink are real per-piece costs
  const qtyConfig = config.qtyEfficiency || {};
  const qtyTiers = qtyConfig.tiers;
  let qtyFactor = 1.0;
  if (Array.isArray(qtyTiers) && qtyTiers.length > 0) {
    qtyFactor = interpolateTiers(qtyTiers, qty, 0.3, "maxQty");
  }

  // ── Resolve fees ──
  const fileFee = Number(config.fileFee || 0);
  const minimumPrice = Number(config.minimumPrice || 0);
  const hourlyRate = Number(config.machineLabor?.hourlyRate || 60);

  // ── Calculate costs ──
  // Material & ink: real per-piece, scales linearly
  const materialCost = costPerSqft * areaSqft * qty;
  const inkCost = inkPerSqft * areaSqft * qty;

  // Labor & cutting: machine time, discounted for bulk runs
  let laborBase = 0;
  if (sqmPerHour > 0) {
    const hours = (areaSqm * qty) / sqmPerHour;
    laborBase = hours * hourlyRate;
  }

  let cuttingBase = 0;
  if (cutType === "contour") {
    cuttingBase = Math.max(contourRate * areaSqft * qty, contourMin);
  } else {
    cuttingBase = rectRate * perimeterFt * qty;
  }

  // Apply qty efficiency to labor+cutting
  const laborCost = laborBase * qtyFactor;
  const cuttingCost = cuttingBase * qtyFactor;

  const subtotal = materialCost + inkCost + laborCost + cuttingCost;
  const wasteCost = subtotal * wasteFactor;
  const rawCost = subtotal + wasteCost;
  const priceBeforeRound = rawCost * markupFactor + fileFee;
  const priceRounded = roundTo99(priceBeforeRound);
  const totalDollars = Math.max(priceRounded, minimumPrice);
  const totalCents = Math.round(totalDollars * 100);

  // ── Build breakdown (customer-facing — no raw costs exposed) ──
  const breakdown = [
    {
      label: `Material: ${areaSqft.toFixed(1)} sqft × ${qty}`,
      amount: Math.round(materialCost * 100),
    },
    {
      label: `Printing (${printModeKey}): ${areaSqft.toFixed(1)} sqft × ${qty}`,
      amount: Math.round(inkCost * 100),
    },
  ];

  if (laborCost > 0) {
    breakdown.push({
      label: "Production",
      amount: Math.round(laborCost * 100),
    });
  }

  breakdown.push({
    label: cutType === "contour" ? "Contour cutting" : "Cutting",
    amount: Math.round(cuttingCost * 100),
  });

  if (fileFee > 0) {
    breakdown.push({ label: "Setup fee", amount: Math.round(fileFee * 100) });
  }

  return {
    totalCents,
    currency: "CAD",
    breakdown,
    meta: {
      model: "COST_PLUS",
      areaSqft,
      areaSqm,
      perimeterFt,
      material: materialKey,
      printMode: printModeKey,
      cutType,
      markupFactor: Math.round(markupFactor * 1000) / 1000,
      wasteFactor: Math.round(wasteFactor * 10000) / 10000,
      qtyEfficiency: Math.round(qtyFactor * 1000) / 1000,
      isB2B: !!input.isB2B,
      rawCostCents: Math.round(rawCost * 100),
      materialCostCents: Math.round(materialCost * 100),
      inkCostCents: Math.round(inkCost * 100),
      laborCostCents: Math.round(laborCost * 100),
      cuttingCostCents: Math.round(cuttingCost * 100),
      wasteCostCents: Math.round(wasteCost * 100),
      fileFee: Math.round(fileFee * 100),
      unitCents: Math.round(totalCents / qty),
    },
  };
}
