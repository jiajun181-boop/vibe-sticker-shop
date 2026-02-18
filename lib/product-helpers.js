/**
 * Pure helper/parser functions extracted from ProductClient.
 * These have no React dependencies and can be used server-side or client-side.
 */

export const HST_RATE = 0.13;
export const PRESET_QUANTITIES = [50, 100, 250, 500, 1000];
export const INCH_TO_CM = 2.54;

export const createSizeRowId = () =>
  `sz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const normalizeInches = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 500 && value <= 5000) return value / 1000;
    if (value > 50 && value < 500) return value / 100;
    if (value > 10 && value <= 50) return value / 10;
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.trim().replace(",", ".");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      if (parsed >= 500 && parsed <= 5000) return parsed / 1000;
      if (parsed > 50 && parsed < 500) return parsed / 100;
      if (parsed > 10 && parsed <= 50) return parsed / 10;
      return parsed;
    }
  }
  return null;
};

export const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export function parseInventorySignal(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return null;
  const raw = optionsConfig.inventory;
  if (!raw || typeof raw !== "object") return null;
  const available = Number(raw.available);
  const lowStockThreshold = Number(raw.lowStockThreshold ?? 5);
  const restockEta = typeof raw.restockEta === "string" ? raw.restockEta : "";
  const leadDays = Number(raw.leadDays ?? 0);

  if (Number.isFinite(available)) {
    if (available <= 0) {
      return {
        tone: "amber",
        label: restockEta
          ? `Backorder - ETA ${restockEta}`
          : `Backorder - ships in ${leadDays > 0 ? `${leadDays} days` : "extended lead time"}`,
      };
    }
    if (available <= lowStockThreshold) {
      return { tone: "amber", label: `Low stock - ${available} left` };
    }
    return { tone: "green", label: `In stock - ${available} available` };
  }

  return null;
}

export function applyAllowlist(items, allowIds) {
  if (!Array.isArray(items)) return [];
  if (!Array.isArray(allowIds)) return items;
  const allow = new Set(allowIds.map(String));
  return items.filter((x) => x && typeof x === "object" && allow.has(String(x.id)));
}

export function getStartingUnitPrice(option) {
  const pbq = option?.priceByQty;
  if (!pbq || typeof pbq !== "object") return null;
  const entries = Object.entries(pbq)
    .map(([q, t]) => [Number(q), Number(t)])
    .filter(([q, t]) => q > 0 && t > 0)
    .sort((a, b) => a[0] - b[0]);
  if (entries.length === 0) return null;
  return Math.round(entries[0][1] / entries[0][0]);
}

export function normalizeCheckoutMeta(meta) {
  const input = meta && typeof meta === "object" ? meta : {};
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v == null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
      continue;
    }
    try {
      out[k] = JSON.stringify(v);
    } catch {
      out[k] = String(v);
    }
  }
  return out;
}

export function parseMaterials(optionsConfig, presetConfig) {
  if (presetConfig && Array.isArray(presetConfig.materials) && presetConfig.materials.length > 0) {
    return presetConfig.materials
      .filter((m) => m && typeof m === "object" && m.id)
      .map((m) => ({
        id: m.id,
        name: m.name || m.id,
        multiplier: typeof m.multiplier === "number" ? m.multiplier : 1.0,
      }));
  }
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const direct = Array.isArray(optionsConfig.materials) ? optionsConfig.materials : [];
  return direct
    .map((item) => {
      if (typeof item === "string") return { id: item, name: item, multiplier: 1.0 };
      if (item && typeof item === "object" && typeof item.label === "string")
        return { id: item.id || item.label, name: item.label, multiplier: typeof item.multiplier === "number" ? item.multiplier : 1.0 };
      return null;
    })
    .filter(Boolean);
}

export function parseFinishings(presetConfig) {
  if (!presetConfig || !Array.isArray(presetConfig.finishings)) return [];
  return presetConfig.finishings
    .filter((f) => f && typeof f === "object" && f.id)
    .map((f) => ({
      id: f.id,
      name: f.name || f.id,
      type: f.type || "flat",
      price: typeof f.price === "number" ? f.price : 0,
    }));
}

export function parseAddons(optionsConfig, presetConfig) {
  if (presetConfig && Array.isArray(presetConfig.addons) && presetConfig.addons.length > 0) {
    return presetConfig.addons
      .filter((a) => a && typeof a === "object" && a.id)
      .map((a) => ({
        id: a.id,
        name: a.name || a.id,
        description: typeof a.description === "string" ? a.description : "",
        price: typeof a.price === "number" ? a.price : 0,
        type: a.type || "per_unit",
      }));
  }
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const list = Array.isArray(optionsConfig.addons) ? optionsConfig.addons : [];
  return list
    .filter((addon) => addon && typeof addon === "object" && typeof addon.id === "string")
    .map((addon) => ({
      id: addon.id,
      name: typeof addon.name === "string" ? addon.name : addon.id,
      description: typeof addon.description === "string" ? addon.description : "",
      price: typeof addon.price === "number" ? addon.price : 0,
      type: addon.type || "per_unit",
    }));
}

export function parseScenes(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const scenes = Array.isArray(optionsConfig.scenes) ? optionsConfig.scenes : [];
  return scenes
    .filter((scene) => scene && typeof scene === "object" && typeof scene.id === "string")
    .map((scene) => ({
      id: scene.id,
      label: typeof scene.label === "string" ? scene.label : scene.id,
      description: typeof scene.description === "string" ? scene.description : "",
      defaultMaterial: typeof scene.defaultMaterial === "string" ? scene.defaultMaterial : null,
      defaultWidthIn: typeof scene.defaultWidthIn === "number" ? scene.defaultWidthIn : null,
      defaultHeightIn: typeof scene.defaultHeightIn === "number" ? scene.defaultHeightIn : null,
      defaultAddons: Array.isArray(scene.defaultAddons) ? scene.defaultAddons.filter((id) => typeof id === "string") : [],
    }));
}

export function parseSizeOptions(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const sizes = Array.isArray(optionsConfig.sizes) ? optionsConfig.sizes : [];
  return sizes
    .filter((item) => item && typeof item === "object" && typeof item.label === "string")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : item.label,
      label: item.label,
      displayLabel: typeof item.displayLabel === "string" ? item.displayLabel : null,
      widthIn: typeof item.widthIn === "number" ? item.widthIn : null,
      heightIn: typeof item.heightIn === "number" ? item.heightIn : null,
      notes: typeof item.notes === "string" ? item.notes : "",
      quantityChoices: Array.isArray(item.quantityChoices) && item.quantityChoices.length > 0
        ? item.quantityChoices.map((q) => Number(q)).filter((q) => Number.isFinite(q) && q > 0)
        : item.priceByQty && typeof item.priceByQty === "object"
          ? Object.keys(item.priceByQty).map((q) => Number(q)).filter((q) => Number.isFinite(q) && q > 0).sort((a, b) => a - b)
          : [],
      priceByQty: item.priceByQty && typeof item.priceByQty === "object" ? item.priceByQty : null,
      recommended: item.recommended === true,
    }));
}

export function parseQuantityRange(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return null;
  const q = optionsConfig.quantityRange;
  if (!q || typeof q !== "object") return null;
  const min = Number(q.min);
  const max = Number(q.max);
  const step = Number(q.step || 1);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) return null;
  return { min, max, step: Number.isFinite(step) && step > 0 ? step : 1 };
}

export function buildVariantConfig(sizeOptions) {
  const regex = /^(.+)\s+-\s+(.+)$/;
  const parsed = sizeOptions
    .map((s) => {
      const m = typeof s.label === "string" ? s.label.match(regex) : null;
      if (!m) return null;
      return { base: m[1], variant: m[2], option: s };
    })
    .filter(Boolean);

  if (parsed.length < 2 || parsed.length !== sizeOptions.length)
    return { enabled: false, bases: [], variants: [], byBase: {}, recommendedBases: new Set() };

  const variantSet = new Set(parsed.map((p) => p.variant));
  if (variantSet.size < 2)
    return { enabled: false, bases: [], variants: [], byBase: {}, recommendedBases: new Set() };

  const byBase = {};
  const recommendedBases = new Set();
  const seenBases = new Set();
  const bases = [];
  for (const p of parsed) {
    if (!seenBases.has(p.base)) { bases.push(p.base); seenBases.add(p.base); }
    if (!byBase[p.base]) byBase[p.base] = {};
    byBase[p.base][p.variant] = p.option;
    if (p.option.recommended) recommendedBases.add(p.base);
  }
  const variants = [...variantSet];
  return { enabled: true, bases, variants, byBase, recommendedBases };
}
