// lib/pricing/pricing-contract.js
// ═══════════════════════════════════════════════════════════════════
// Canonical Pricing Contract
//
// Normalizes ALL pricing paths into a single shape:
//   template-resolver (6 templates + sticker_ref)
//   quote-server (preset-based + legacy)
//   COST_PLUS, QTY_TIERED, AREA_TIERED, QTY_OPTIONS presets
//   fixedPrices (outsourced)
//   legacy basePrice
//   quote-only
//
// Reuses existing pricing engine — does NOT recompute formulas.
// ═══════════════════════════════════════════════════════════════════

import { calculatePrice } from "./template-resolver";
import { quoteProduct } from "./quote-server";
import { resolveFloorPrice, loadFloorSettings } from "./floor-price";
import { lookupVendorCost } from "./vendor-cost";
import { resolveB2BPrice } from "./b2b-rules";

// ── Constants ────────────────────────────────────────────────────

const COST_TEMPLATES = [
  "vinyl_print", "board_sign", "banner",
  "paper_print", "canvas", "vinyl_cut",
];

// ── Pure helpers (exported for testing) ──────────────────────────

/**
 * Empty cost-bucket object.
 */
export function emptyCost() {
  return {
    material: 0, print: 0, finishing: 0, labor: 0,
    packaging: 0, outsourcing: 0, setup: 0, waste: 0, transfer: 0,
  };
}

/**
 * Sum all cost buckets.
 */
export function sumCostBuckets(c) {
  return (
    (c.material || 0) + (c.print || 0) + (c.finishing || 0) + (c.labor || 0) +
    (c.packaging || 0) + (c.outsourcing || 0) + (c.setup || 0) + (c.waste || 0) +
    (c.transfer || 0)
  );
}

/**
 * Detect pricing source kind from a calculatePrice/quoteProduct result.
 */
export function detectSourceKind(result, product) {
  const t = result?.template;
  if (t === "quote_only") return "quote_only";
  if (t === "outsourced") return "fixed_prices";
  if (t === "poster_fixed") return "fixed_prices";
  if (t === "sticker_ref") return "sticker_ref";
  if (COST_TEMPLATES.includes(t)) return "template";
  // Preset-based (from calculatePrice returning template="preset", or from quoteProduct)
  if (t === "preset" || product?.pricingPreset) {
    const model = product?.pricingPreset?.model;
    if (model === "COST_PLUS") return "cost_plus";
    if (model === "AREA_TIERED") return "area_tiered";
    if (model === "QTY_TIERED") return "qty_tiered";
    if (model === "QTY_OPTIONS") return "qty_options";
    return "preset";
  }
  return "legacy";
}

/**
 * Map template breakdown fields → normalized cost buckets.
 * Each template has different field names; this normalizes them.
 */
const TEMPLATE_COST_EXTRACTORS = {
  vinyl_print: (b) => ({
    material: b.material || 0,
    print: b.ink || 0,
    finishing: b.lamination || 0,
    labor: b.cutting || 0,
    packaging: 0,
    outsourcing: 0,
    setup: 0,
    waste: b.waste || 0,
    transfer: 0,
  }),
  board_sign: (b) => ({
    material: (b.board || 0) + (b.vinyl || 0),
    print: b.ink || 0,
    finishing: 0,
    labor: b.labor || 0,
    packaging: 0,
    outsourcing: 0,
    setup: 0,
    waste: 0,
    transfer: 0,
  }),
  banner: (b) => ({
    material: b.material || 0,
    print: b.ink || 0,
    finishing: b.finishing || 0,
    labor: 0,
    packaging: 0,
    outsourcing: b.accessoryCost || 0,
    setup: b.setupFee || 0,
    waste: 0,
    transfer: 0,
  }),
  paper_print: (b) => ({
    material: b.paper || 0,
    print: b.ink || 0,
    finishing: (b.lamination || 0) + (b.finishing || 0),
    labor: 0,
    packaging: 0,
    outsourcing: 0,
    setup: 0,
    waste: 0,
    transfer: 0,
  }),
  canvas: (b) => ({
    material: b.canvas || 0,
    print: b.ink || 0,
    finishing: (b.lamination || 0) + (b.frame || 0),
    labor: 0,
    packaging: 0,
    outsourcing: 0,
    setup: 0,
    waste: 0,
    transfer: 0,
  }),
  vinyl_cut: (b) => ({
    material: b.material || 0,
    print: 0,
    finishing: 0,
    labor: (b.cutting || 0) + (b.weeding || 0),
    packaging: 0,
    outsourcing: 0,
    setup: 0,
    waste: 0,
    transfer: b.transfer || 0,
  }),
};

/**
 * Extract normalized cost buckets from pricing result.
 *
 * @param {string} sourceKind
 * @param {object|null} templateResult — from calculatePrice
 * @param {object|null} quoteResult — from quoteProduct (for COST_PLUS meta)
 * @returns {object} cost buckets
 */
export function extractCostBuckets(sourceKind, templateResult, quoteResult) {
  // Template-based: use breakdown
  if (sourceKind === "template" && templateResult?.breakdown) {
    const extractor = TEMPLATE_COST_EXTRACTORS[templateResult.template];
    if (extractor) return extractor(templateResult.breakdown);
  }

  // COST_PLUS: use meta from quoteProduct (richer than calculatePrice "preset" result)
  if (sourceKind === "cost_plus") {
    const m = quoteResult?.meta || templateResult?.meta || {};
    if (m.rawCostCents != null || m.materialCostCents != null) {
      return {
        material: m.materialCostCents || 0,
        print: m.inkCostCents || 0,
        finishing: 0,
        labor: (m.laborCostCents || 0) + (m.cuttingCostCents || 0),
        packaging: 0,
        outsourcing: 0,
        setup: m.fileFee || 0,
        waste: m.wasteCostCents || 0,
        transfer: 0,
      };
    }
  }

  return emptyCost();
}

/**
 * Compute profit from sell price and total cost.
 */
export function computeProfit(sellTotalCents, totalCostCents) {
  if (totalCostCents <= 0 || sellTotalCents <= 0) {
    return { amountCents: 0, rate: 0 };
  }
  const amount = sellTotalCents - totalCostCents;
  const rate = Number(((sellTotalCents - totalCostCents) / sellTotalCents).toFixed(4));
  return { amountCents: amount, rate };
}

/**
 * Build comprehensive explanation answering 4 questions:
 *   1. Where does the price come from? (path)
 *   2. Which cost items participate? (cost items)
 *   3. What's still missing? (gaps)
 *   4. Why is the floor price this number? (floor reasoning)
 *
 * @param {string} sourceKind
 * @param {object} result — from calculatePrice
 * @param {object} product
 * @param {object} [contractCtx] — partial contract for richer explanation
 */
export function buildExplanation(sourceKind, result, product, contractCtx) {
  const template = result?.template;
  const presetKey = product?.pricingPreset?.key;
  const presetModel = product?.pricingPreset?.model;

  const sections = [];

  // 1. Pricing path
  switch (sourceKind) {
    case "template":
      sections.push(`[Path] template-resolver → "${template}". Material costs from DB, margin from MARGIN_TIERS[${result?.meta?.marginCategory || "unknown"}].`);
      break;
    case "cost_plus":
      sections.push(`[Path] quote-server → COST_PLUS preset "${presetKey}". Full cost model: material, ink, labor, cutting, waste, interpolated markup.`);
      break;
    case "sticker_ref":
      sections.push("[Path] template-resolver → sticker_ref. Vendor reference table: base lookup + setup fee.");
      break;
    case "qty_tiered":
    case "area_tiered":
    case "qty_options":
      sections.push(`[Path] quote-server → ${presetModel || sourceKind.toUpperCase()} preset "${presetKey}". Sell-price tiers only.`);
      break;
    case "fixed_prices":
      sections.push("[Path] template-resolver → outsourced/fixed prices. Hardcoded sell prices per size.");
      break;
    case "quote_only":
      sections.push("[Path] Quote-only product. No automated pricing engine.");
      break;
    default:
      sections.push("[Path] Legacy basePrice fallback — no template or preset route.");
      break;
  }

  // 2. Cost items (if available from contract context)
  if (contractCtx?.cost) {
    const nonZero = Object.entries(contractCtx.cost).filter(([, v]) => v > 0);
    if (nonZero.length > 0) {
      sections.push(`[Costs] ${nonZero.length} active: ${nonZero.map(([k, v]) => `${k}=$${(v / 100).toFixed(2)}`).join(", ")}.`);
    } else if (sourceKind !== "quote_only") {
      sections.push("[Costs] No cost data — all buckets zero.");
    }
  }

  // 3. Missing data (if available)
  if (contractCtx?.completeness) {
    const { missing, warnings } = contractCtx.completeness;
    if (missing?.length > 0) {
      sections.push(`[Missing] ${missing.join(", ")}.`);
    }
    if (warnings?.length > 0) {
      sections.push(`[Warnings] ${warnings.join(", ")}.`);
    }
  }

  // 4. Floor reasoning (if available)
  if (contractCtx?.floor?.priceCents > 0) {
    sections.push(`[Floor] ${contractCtx.floor.policyDetail || contractCtx.floor.policySource}. Floor=$${(contractCtx.floor.priceCents / 100).toFixed(2)}.`);
  }

  // 5. Active modifiers
  const modLines = [];
  if (contractCtx?.input?.options?.rush) {
    modLines.push("Rush order: 1.3\u00d7 total price surcharge");
  }
  if (contractCtx?.input?.options?.designHelp) {
    modLines.push("Design help: +$45 flat fee per item");
  }
  if (contractCtx?.input?.options?.doubleSided) {
    modLines.push("Double-sided: 2\u00d7 print cost");
  }
  if (contractCtx?.input?.options?.finishing) {
    modLines.push(`Finishing: ${contractCtx.input.options.finishing} applied`);
  }
  if (contractCtx?.b2bImpact) {
    const b = contractCtx.b2bImpact;
    modLines.push(`B2B discount: ${b.ruleType} ${b.value}, adjusted to $${((b.adjustedPrice || 0) / 100).toFixed(2)}`);
  }
  if (contractCtx?.vendorCost) {
    const vc = contractCtx.vendorCost;
    modLines.push(`Vendor sourced from ${vc.vendorName}: unit cost $${((vc.unitCostCents || 0) / 100).toFixed(2)}`);
  }
  if (modLines.length > 0) {
    sections.push(`[Modifiers] ${modLines.join(". ")}.`);
  }

  // 6. Confidence rating
  if (contractCtx?.completeness) {
    const score = contractCtx.completeness.score ?? 0;
    const missingCount = (contractCtx.completeness.missing || []).length;
    if (score >= 90) {
      sections.push("[Confidence] High confidence \u2014 complete cost model with verified data.");
    } else if (score >= 70) {
      sections.push(`[Confidence] Medium confidence \u2014 ${missingCount} data point${missingCount !== 1 ? "s" : ""} missing.`);
    } else {
      sections.push("[Confidence] Low confidence \u2014 significant cost data gaps, price may not reflect true margins.");
    }
  }

  return sections.join(" ");
}

/**
 * Build a plain-English sales-ready explanation from a full contract.
 * Suitable for a sales rep to read to a customer or paste in an email.
 *
 * @param {object} contract — full canonical pricing contract
 * @returns {string} multi-line plain-English explanation
 */
export function buildSalesExplanation(contract) {
  if (!contract) return "";
  const lines = [];

  // Line 1: Price summary
  const qty = contract.input?.quantity || 1;
  const productName = contract.product?.name || "this product";
  const totalCents = contract.sellPrice?.totalCents || 0;
  const sourceKind = contract.source?.kind || "unknown";

  const sourceDescriptions = {
    template: "our standard cost model",
    cost_plus: "a detailed cost-plus calculation",
    sticker_ref: "our vendor reference pricing table",
    qty_tiered: "quantity-based tiered pricing",
    area_tiered: "area-based tiered pricing",
    qty_options: "quantity option pricing",
    fixed_prices: "fixed pricing for this product",
    quote_only: "a custom quote",
    legacy: "our base price list",
    preset: "preset pricing",
  };
  const sourceDesc = sourceDescriptions[sourceKind] || "our pricing system";
  lines.push(`This price of $${(totalCents / 100).toFixed(2)} for ${qty} ${productName} is based on ${sourceDesc}.`);

  // Line 2: Cost breakdown (only non-zero buckets, in plain English)
  if (contract.cost) {
    const bucketLabels = {
      material: "material",
      print: "printing",
      finishing: "finishing",
      labor: "labor",
      packaging: "packaging",
      outsourcing: "outsourcing",
      setup: "setup",
      waste: "waste allowance",
      transfer: "transfer",
    };
    const nonZero = Object.entries(contract.cost)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${bucketLabels[k] || k} $${(v / 100).toFixed(2)}`);
    if (nonZero.length > 0) {
      lines.push(`Cost breakdown: ${nonZero.join(", ")}.`);
    }
  }

  // Line 3: Active modifiers
  const modifiers = [];
  if (contract.input?.options?.rush) {
    modifiers.push("a rush surcharge of 30%");
  }
  if (contract.input?.options?.designHelp) {
    modifiers.push("a design help fee of $45");
  }
  if (contract.input?.options?.doubleSided) {
    modifiers.push("double-sided printing");
  }
  if (contract.input?.options?.finishing) {
    modifiers.push(`${contract.input.options.finishing} finishing`);
  }
  if (contract.vendorCost) {
    modifiers.push(`vendor sourcing from ${contract.vendorCost.vendorName}`);
  }
  if (modifiers.length > 0) {
    lines.push(`This includes ${modifiers.join(", ")}.`);
  }

  // Line 4: Floor validation
  const floorCents = contract.floor?.priceCents || 0;
  if (floorCents > 0) {
    if (totalCents >= floorCents) {
      lines.push("This price meets our minimum pricing policy.");
    } else {
      lines.push(`Note: this price is below our standard minimum of $${(floorCents / 100).toFixed(2)}.`);
    }
  }

  // Line 5: Confidence
  const score = contract.completeness?.score ?? 0;
  if (score >= 90) {
    lines.push("All cost data is verified.");
  } else if (score >= 70) {
    lines.push("Some cost estimates are used.");
  } else {
    lines.push("Limited cost data available — final price may be adjusted.");
  }

  return lines.join("\n");
}

/**
 * Assess data completeness of the contract.
 */
export function computeCompleteness(sourceKind, costBuckets, product) {
  const missing = [];
  const warnings = [];
  const totalCost = sumCostBuckets(costBuckets);

  if (totalCost === 0 && sourceKind !== "quote_only") {
    missing.push("cost_data");
  }

  if ((sourceKind === "template" || sourceKind === "cost_plus") && costBuckets.material === 0) {
    missing.push("material_cost");
  }

  if (costBuckets.packaging === 0 && sourceKind !== "quote_only") {
    warnings.push("no_packaging_cost");
  }

  if (product?.minPrice == null || product.minPrice <= 0) {
    warnings.push("no_display_from_price");
  }

  if (sourceKind === "fixed_prices") {
    missing.push("outsourcing_cost");
  }

  if (["qty_tiered", "area_tiered", "qty_options"].includes(sourceKind)) {
    missing.push("cost_model");
  }

  if (sourceKind === "sticker_ref") {
    missing.push("detailed_cost_breakdown");
  }

  if (sourceKind === "legacy") {
    missing.push("cost_model");
  }

  const score = Math.max(0, Math.min(100, 100 - missing.length * 20 - warnings.length * 5));
  return { score, missing, warnings };
}

/**
 * Detect which fields the product overrides vs inheriting from template/preset.
 */
function detectProductOverrides(product) {
  const overrides = [];
  const cfg = parseJson(product?.pricingConfig);
  if (cfg?.fixedPrices) overrides.push("fixedPrices");
  if (cfg?.floorPolicy) overrides.push("floorPolicy");
  if (product?.basePrice && product.basePrice > 0) overrides.push("basePrice");
  if (product?.displayFromPrice && product.displayFromPrice > 0) overrides.push("displayFromPrice");
  return overrides;
}

/**
 * Build option → cost bucket mapping for a product.
 * Each entry describes:
 *   - option: user-facing option name
 *   - costBuckets: array of cost bucket keys this option affects
 *   - chargeType: "multiplier" | "flat" | "per_unit" | "per_sqft" | "formula"
 *   - impact: human-readable description
 *   - mapped: whether this option has a known cost formula
 */
function buildOptionImpacts(product, sourceKind) {
  const impacts = [];
  const opts = parseJson(product?.optionsConfig) || {};

  if (Array.isArray(opts.materials) && opts.materials.length > 0) {
    impacts.push({
      option: "material",
      costBuckets: ["material"],
      chargeType: "multiplier",
      impact: `${opts.materials.length} materials — each has cost multiplier applied to material bucket`,
      mapped: true,
    });
  }

  if (Array.isArray(opts.sizes) && opts.sizes.length > 0) {
    impacts.push({
      option: "size",
      costBuckets: ["material", "print"],
      chargeType: "formula",
      impact: `${opts.sizes.length} sizes — area drives material + print cost`,
      mapped: true,
    });
  }

  if (Array.isArray(opts.addons) && opts.addons.length > 0) {
    const priced = opts.addons.filter((a) => a?.unitCents || a?.priceCents).length;
    const unpriced = opts.addons.length - priced;
    const types = [...new Set(opts.addons.map((a) => a?.type || "per_unit"))];
    impacts.push({
      option: "addons",
      costBuckets: ["outsourcing", "finishing"],
      chargeType: types.length === 1 ? types[0] : "mixed",
      impact: `${priced} priced (${types.join("+")}), ${unpriced} unpriced`,
      mapped: unpriced === 0,
    });
  }

  if (Array.isArray(opts.finishings) && opts.finishings.length > 0) {
    const priced = opts.finishings.filter((f) => f?.priceCents || f?.unitCents).length;
    impacts.push({
      option: "finishings",
      costBuckets: ["finishing"],
      chargeType: "per_unit",
      impact: `${opts.finishings.length} options, ${priced} with cost data`,
      mapped: priced === opts.finishings.length,
    });
  }

  // Standard system-wide options
  impacts.push(
    {
      option: "rush",
      costBuckets: ["surcharge"],
      chargeType: "multiplier",
      impact: "1.3× total (RUSH_MULTIPLIER from order-config)",
      mapped: true,
    },
    {
      option: "designHelp",
      costBuckets: ["setup"],
      chargeType: "flat",
      impact: "$45 flat per item (DESIGN_HELP_CENTS from order-config)",
      mapped: true,
    },
    {
      option: "lamination",
      costBuckets: ["finishing"],
      chargeType: "per_sqft",
      impact: sourceKind === "template" ? "Per-sqft rate from template cost table" : "Not mapped for this pricing source",
      mapped: sourceKind === "template",
    },
    {
      option: "doubleSided",
      costBuckets: ["print"],
      chargeType: "multiplier",
      impact: sourceKind === "template" ? "2× print cost in paper_print template" : "Not mapped for this pricing source",
      mapped: sourceKind === "template",
    },
  );

  return impacts;
}

function parseJson(val) {
  if (!val) return null;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return null; }
}

/**
 * Build floor policy chain showing all three layers.
 * Used for UI display — shows which layer is active vs available.
 */
function buildFloorPolicyChain(product, templateName, floorSettings) {
  const DEFAULTS = { minFixedProfitCents: 500, minMarginRate: 0.15 };
  const chain = [];

  // Layer 1: Product override
  const cfg = parseJson(product?.pricingConfig);
  const productPolicy = cfg?.floorPolicy || null;
  chain.push({
    layer: "product",
    label: "Product Override",
    active: !!productPolicy,
    policy: productPolicy || null,
  });

  // Layer 2: Template-level
  const settings = floorSettings || {};
  const tplKey = templateName ? `floor_policy_template_${templateName}` : null;
  const tplPolicy = tplKey ? (parseJson(settings[tplKey]) || settings[tplKey] || null) : null;
  chain.push({
    layer: "template",
    label: templateName ? `Template "${templateName}"` : "Template (none)",
    active: !productPolicy && !!tplPolicy,
    policy: tplPolicy || null,
  });

  // Layer 3: Global
  const globalPolicy = parseJson(settings["floor_policy_global"]) || settings["floor_policy_global"] || null;
  chain.push({
    layer: "global",
    label: "Global Default",
    active: !productPolicy && !tplPolicy,
    policy: globalPolicy || DEFAULTS,
  });

  return chain;
}

/**
 * Generate sensible default pricing input for a product.
 */
export function getDefaultInput(product) {
  const category = product?.category || "";
  const unit = product?.pricingUnit || "per_piece";

  if (unit === "per_sqft" || category === "banners-displays") {
    return { quantity: 1, widthIn: 24, heightIn: 36 };
  }
  if (category === "signs-rigid-boards") return { quantity: 1, widthIn: 18, heightIn: 24 };
  if (category === "canvas-prints") return { quantity: 1, widthIn: 16, heightIn: 20 };
  if (category === "stickers-labels-decals") return { quantity: 100, widthIn: 3, heightIn: 3 };
  if (category === "marketing-business-print") return { quantity: 250, widthIn: 3.5, heightIn: 2 };
  if (category === "vehicle-graphics-fleet") return { quantity: 1, widthIn: 48, heightIn: 24 };
  if (category === "windows-walls-floors") return { quantity: 1, widthIn: 24, heightIn: 36 };
  return { quantity: 100, widthIn: 3, heightIn: 3 };
}

// ── Main Builder ─────────────────────────────────────────────────

/**
 * Build canonical pricing contract for a product.
 *
 * @param {object} product — Product row with pricingPreset included
 * @param {object} input — { quantity, widthIn, heightIn, material, sizeLabel, options, ... }
 * @param {object} [options] — { floorSettings?: Record<string,object> }
 * @returns {Promise<object>} Canonical pricing contract
 */
export async function buildPricingContract(product, input, options = {}) {
  const contract = {
    product: {
      id: product?.id || null,
      slug: product?.slug || null,
      name: product?.name || null,
      category: product?.category || null,
      pricingUnit: product?.pricingUnit || null,
      isActive: product?.isActive ?? false,
    },
    source: { kind: "unknown", template: null, presetKey: null, presetModel: null, explanation: "" },
    sellPrice: { totalCents: 0, unitCents: 0, currency: "CAD" },
    cost: emptyCost(),
    totalCost: 0,
    profit: { amountCents: 0, rate: 0 },
    floor: { priceCents: 0, policySource: "none", policyDetail: "" },
    inheritance: { templateName: null, presetKey: null, productOverrides: [] },
    optionImpacts: [],
    completeness: { score: 0, missing: ["product"], warnings: [] },
    explanation: "",
    input: input || {},
    vendorCost: null,
    b2bAdjustment: null,
    quoteLedger: null,
    error: null,
  };

  if (!product) {
    contract.error = "Product not provided";
    return contract;
  }

  // ── 1. Call pricing engine(s) ──
  let templateResult = null;
  let quoteResult = null;

  try {
    templateResult = await calculatePrice(product, input);
  } catch (e) {
    contract.error = `template-resolver: ${e.message}`;
  }

  // For preset products, also call quoteProduct for richer COST_PLUS meta
  if (product.pricingPreset) {
    try {
      quoteResult = quoteProduct(product, input);
    } catch {
      // Non-critical — templateResult may suffice
    }
  }

  const primary = templateResult || quoteResult;
  if (!primary) return contract;

  // ── 2. Source detection ──
  const sourceKind = detectSourceKind(primary, product);
  contract.source = {
    kind: sourceKind,
    template: primary.template || null,
    presetKey: product.pricingPreset?.key || null,
    presetModel: product.pricingPreset?.model || null,
    explanation: "", // filled in step 10 with full contract context
  };

  // ── 3. Sell price ──
  const qty = Number(input?.quantity) || 1;
  contract.sellPrice = {
    totalCents: primary.totalCents || 0,
    unitCents: primary.unitCents || Math.round((primary.totalCents || 0) / qty),
    currency: primary.currency || "CAD",
  };

  // ── 4. Cost extraction ──
  contract.cost = extractCostBuckets(sourceKind, templateResult, quoteResult);
  contract.totalCost = sumCostBuckets(contract.cost);

  // ── 4b. Vendor cost lookup (fixed_prices / outsourced products only) ──
  // Only applies to fixed_prices source kind where outsourcing cost is unknown.
  // Does NOT affect template, cost_plus, or other pricing sources.
  if (sourceKind === "fixed_prices" && product.slug) {
    try {
      const sizeKey = input?.sizeLabel || input?.sizeKey || input?.size || null;
      const vc = await lookupVendorCost({
        productSlug: product.slug,
        sizeKey: sizeKey || undefined,
        quantity: qty,
      });
      if (vc) {
        contract.cost.outsourcing = vc.unitCostCents * qty;
        contract.cost.setup = (contract.cost.setup || 0) + vc.setupFeeCents;
        if (vc.shippingCents > 0) {
          contract.cost.outsourcing += vc.shippingCents;
        }
        contract.totalCost = sumCostBuckets(contract.cost);
        contract.vendorCost = {
          vendorName: vc.vendorName,
          unitCostCents: vc.unitCostCents,
          setupFeeCents: vc.setupFeeCents,
          shippingCents: vc.shippingCents,
          totalForQty: vc.totalForQty,
        };
      }
    } catch {
      // Non-critical: if vendor cost lookup fails, leave cost buckets as-is
    }
  }

  // ── 5. Profit ──
  contract.profit = computeProfit(contract.sellPrice.totalCents, contract.totalCost);

  // ── 5b. B2B price adjustment (admin simulation only) ──
  if (options.b2b) {
    try {
      const b2bResult = await resolveB2BPrice({
        userId: options.b2b.userId || undefined,
        companyName: options.b2b.companyName || undefined,
        partnerTier: options.b2b.partnerTier || undefined,
        productId: product.id || undefined,
        productSlug: product.slug || undefined,
        category: product.category || undefined,
        templateKey: primary.template || undefined,
        quantity: qty,
        retailPriceCents: contract.sellPrice.totalCents,
        costCents: contract.totalCost > 0 ? contract.totalCost : undefined,
      });
      if (b2bResult) {
        contract.b2bAdjustment = {
          retailPriceCents: contract.sellPrice.totalCents,
          adjustedPriceCents: b2bResult.adjustedPriceCents,
          discountCents: b2bResult.discountCents,
          appliedRule: b2bResult.appliedRule,
          adjustedProfit: computeProfit(b2bResult.adjustedPriceCents, contract.totalCost),
        };
      }
    } catch {
      // Non-critical: B2B resolution failure should not block contract
    }
  }

  // ── 6. Floor price ──
  try {
    const floorSettings = options.floorSettings || await loadFloorSettings();
    contract.floor = await resolveFloorPrice(
      contract.totalCost, product, primary.template, floorSettings,
    );
  } catch {
    contract.floor = { priceCents: 0, policySource: "none", policyDetail: "Floor computation failed" };
  }

  // ── 7. Inheritance ──
  contract.inheritance = {
    templateName: COST_TEMPLATES.includes(primary.template) ? primary.template : null,
    presetKey: product.pricingPreset?.key || null,
    presetModel: product.pricingPreset?.model || null,
    productOverrides: detectProductOverrides(product),
    floorPolicyChain: buildFloorPolicyChain(product, primary.template, options.floorSettings),
  };

  // ── 8. Option impacts ──
  contract.optionImpacts = buildOptionImpacts(product, sourceKind);

  // ── 9. Completeness ──
  contract.completeness = computeCompleteness(sourceKind, contract.cost, product);

  // If vendor cost filled the outsourcing gap, remove "outsourcing_cost" from missing
  if (contract.vendorCost && contract.completeness.missing.includes("outsourcing_cost")) {
    contract.completeness.missing = contract.completeness.missing.filter(
      (m) => m !== "outsourcing_cost"
    );
    // Also remove "cost_data" if outsourcing cost is now non-zero
    if (contract.totalCost > 0) {
      contract.completeness.missing = contract.completeness.missing.filter(
        (m) => m !== "cost_data"
      );
    }
    contract.completeness.score = Math.max(0, Math.min(100,
      100 - contract.completeness.missing.length * 20 - contract.completeness.warnings.length * 5
    ));
  }

  // ── 10. Explanation (rebuild with full contract context) ──
  contract.explanation = buildExplanation(sourceKind, primary, product, contract);
  contract.source.explanation = contract.explanation;
  if (contract.vendorCost) {
    contract.explanation += ` Vendor cost loaded from "${contract.vendorCost.vendorName}".`;
  }

  // ── 11. QuoteLedger (if available from template-resolver) ──
  contract.quoteLedger = primary.quoteLedger || null;

  return contract;
}
