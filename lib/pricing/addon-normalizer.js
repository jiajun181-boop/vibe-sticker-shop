// lib/pricing/addon-normalizer.js
// ═══════════════════════════════════════════════════════════════════
// Unified addon/process schema adapter layer.
// Converts all existing config formats → unified chargeType schema.
// Does NOT modify existing config files.
//
// Unified Schema:
//   { id, code, label, category, chargeType, value, tiers?,
//     minChargeCents?, conditions?, required?, enabled?, source, group }
//
// chargeType: "flat" | "per_qty" | "per_area" | "per_perimeter"
//           | "setup_plus_run" | "tiered" | "multiplier" | "percentage"
//
// Backward compatibility:
//   type="flat"     → chargeType="flat"
//   type="per_unit" → chargeType="per_qty"
// ═══════════════════════════════════════════════════════════════════

/**
 * Normalize a single addon/finishing/process definition to unified schema.
 * Handles both old-format and new-format definitions.
 *
 * @param {object} def — raw definition from any config
 * @param {object} opts — { source, group, categoryType }
 * @returns {object} unified addon
 */
export function normalizeAddon(def, opts = {}) {
  const { source = "unknown", group = "addon", categoryType = "addon" } = opts;

  // Already in unified format
  if (def.chargeType) {
    return {
      id: def.id,
      code: def.code || makeCode(def.id, group),
      label: def.label || def.name || def.id,
      category: def.category || categoryType,
      chargeType: def.chargeType,
      value: def.value,
      tiers: def.tiers || null,
      minChargeCents: def.minChargeCents ?? def.minCharge ?? null,
      conditions: def.conditions || null,
      required: def.required ?? false,
      enabled: def.enabled ?? true,
      displayOrder: def.displayOrder ?? 0,
      source: def.source || source,
      group,
    };
  }

  // Old format: { id, label, surcharge } → per_qty
  if (def.surcharge != null) {
    return {
      id: def.id,
      code: makeCode(def.id, group),
      label: def.label || def.name || def.id,
      category: categoryType,
      chargeType: "per_qty",
      value: def.surcharge, // cents per unit
      tiers: null,
      minChargeCents: null,
      conditions: null,
      required: false,
      enabled: true,
      displayOrder: def.displayOrder ?? 0,
      source,
      group,
    };
  }

  // Old format: { id, label, multiplier } → multiplier
  if (def.multiplier != null) {
    return {
      id: def.id,
      code: makeCode(def.id, group),
      label: def.label || def.name || def.id,
      category: categoryType,
      chargeType: "multiplier",
      value: def.multiplier,
      tiers: null,
      minChargeCents: null,
      conditions: null,
      required: def.required ?? false,
      enabled: true,
      displayOrder: def.displayOrder ?? 0,
      source,
      group,
    };
  }

  // Old format: { id, type: "flat"|"per_unit", priceCents|unitCents }
  const oldType = def.type || "per_unit";
  const cents = def.priceCents ?? def.unitCents ?? def.price ?? 0;
  return {
    id: def.id,
    code: makeCode(def.id, group),
    label: def.label || def.name || def.id,
    category: categoryType,
    chargeType: oldType === "flat" ? "flat" : "per_qty",
    value: cents,
    tiers: null,
    minChargeCents: null,
    conditions: null,
    required: def.required ?? false,
    enabled: true,
    displayOrder: def.displayOrder ?? 0,
    source,
    group,
  };
}

/**
 * Normalize an array of addon/finishing definitions.
 */
export function normalizeAddons(defs, opts = {}) {
  if (!Array.isArray(defs)) return [];
  return defs.map((d) => normalizeAddon(d, opts));
}

/**
 * Normalize sign accessory options.
 * Input: { "h-stake": { label: "H-Stakes", surcharge: 150 }, ... }
 */
export function normalizeSignAccessories(ACCESSORY_OPTIONS) {
  return Object.entries(ACCESSORY_OPTIONS).map(([id, def]) =>
    normalizeAddon({ id, ...def }, {
      source: "sign-order-config",
      group: "accessory",
      categoryType: "addon",
    })
  );
}

/**
 * Normalize banner/surface finishing options.
 * Input: { "pole-pockets": { label: "Pole Pockets", surcharge: 50 }, ... }
 */
export function normalizeFinishingOptions(FINISHING_OPTIONS, source = "config") {
  return Object.entries(FINISHING_OPTIONS).map(([id, def]) =>
    normalizeAddon({ id, ...def }, {
      source,
      group: "finishing",
      categoryType: "finishing",
    })
  );
}

/**
 * Normalize sticker multiplier-based options into unified addons.
 * These are "implicit" — auto-applied based on selected options.
 */
export function normalizeStickerOptions(opts = {}) {
  const addons = [];

  if (opts.materialMultiplier && opts.materialMultiplier !== 1.0) {
    addons.push({
      id: `material-${opts.materialId || "unknown"}`,
      code: "MAT_MULT",
      label: opts.materialLabel || "材料加价",
      category: "base_process",
      chargeType: "multiplier",
      value: opts.materialMultiplier,
      tiers: null,
      minChargeCents: null,
      conditions: null,
      required: true,
      enabled: true,
      displayOrder: 0,
      source: "sticker-order-config",
      group: "material",
    });
  }

  if (opts.laminationMultiplier && opts.laminationMultiplier !== 1.0) {
    addons.push({
      id: `lamination-${opts.laminationId || "unknown"}`,
      code: "LAM_MULT",
      label: opts.laminationLabel || "覆膜加价",
      category: "finishing",
      chargeType: "multiplier",
      value: opts.laminationMultiplier,
      tiers: null,
      minChargeCents: null,
      conditions: null,
      required: true,
      enabled: true,
      displayOrder: 0,
      source: "sticker-order-config",
      group: "finishing",
    });
  }

  if (opts.turnaroundMultiplier && opts.turnaroundMultiplier > 1) {
    addons.push({
      id: "rush-turnaround",
      code: "RUSH_MULT",
      label: "加急费",
      category: "turnaround",
      chargeType: "multiplier",
      value: opts.turnaroundMultiplier,
      tiers: null,
      minChargeCents: null,
      conditions: null,
      required: true,
      enabled: true,
      displayOrder: 0,
      source: "sticker-order-config",
      group: "turnaround",
    });
  }

  if (opts.shapeSurcharge && opts.shapeSurcharge > 0) {
    addons.push({
      id: "custom-shape",
      code: "SHAPE_PCT",
      label: "异形加价",
      category: "base_process",
      chargeType: "percentage",
      value: opts.shapeSurcharge,
      tiers: null,
      minChargeCents: null,
      conditions: null,
      required: true,
      enabled: true,
      displayOrder: 0,
      source: "sticker-order-config",
      group: "shape",
    });
  }

  if (opts.printModeMultiplier && opts.printModeMultiplier !== 1.0) {
    addons.push({
      id: `print-mode-${opts.printMode || "unknown"}`,
      code: "PRINT_MULT",
      label: opts.printModeLabel || "印刷模式加价",
      category: "base_process",
      chargeType: "multiplier",
      value: opts.printModeMultiplier,
      tiers: null,
      minChargeCents: null,
      conditions: null,
      required: true,
      enabled: true,
      displayOrder: 0,
      source: "sticker-order-config",
      group: "print_mode",
    });
  }

  return addons;
}

/**
 * Calculate the cents contribution of a unified addon.
 * @param {object} addon — unified addon definition
 * @param {object} context — { quantity, areaSqFt?, perimeterIn?, runningCents? }
 * @returns {number} cents to add
 */
export function computeAddonCents(addon, context = {}) {
  const { quantity = 1, areaSqFt = 0, perimeterIn = 0, runningCents = 0 } = context;

  switch (addon.chargeType) {
    case "flat":
      return Math.round(addon.value);
    case "per_qty":
      return Math.round(addon.value * quantity);
    case "per_area":
      return Math.round(addon.value * areaSqFt);
    case "per_perimeter":
      return Math.round(addon.value * perimeterIn);
    case "multiplier":
      return Math.round(runningCents * addon.value) - runningCents;
    case "percentage":
      return Math.round(runningCents * addon.value);
    case "setup_plus_run": {
      const setup = addon.value?.setup || 0;
      const run = addon.value?.run || 0;
      const runUnit = addon.value?.runUnit || "qty";
      const runBase = runUnit === "area" ? areaSqFt : quantity;
      return Math.round(setup + run * runBase);
    }
    case "tiered": {
      if (!Array.isArray(addon.tiers)) return 0;
      let matched = addon.tiers[0];
      for (const tier of addon.tiers) {
        if (quantity >= (tier.min || 0)) matched = tier;
      }
      return Math.round((matched?.unitPrice || 0) * quantity);
    }
    default:
      return 0;
  }
}

// ── Helpers ──

function makeCode(id, group) {
  const prefix = {
    material: "MAT",
    finishing: "FIN",
    accessory: "ACC",
    turnaround: "RUSH",
    shape: "SHAPE",
    addon: "OPT",
    extra: "EXT",
    print_mode: "PRINT",
  }[group] || "OPT";
  return `${prefix}_${(id || "").toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 20)}`;
}
