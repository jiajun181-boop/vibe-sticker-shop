// lib/pricing/engine.js
// Plugin-based pricing engine. Delegates to model-specific compute() functions.

import { compute as areaTiered } from "./models/areaTiered.js";
import { compute as qtyTiered } from "./models/qtyTiered.js";
import { compute as qtyOptions } from "./models/qtyOptions.js";

const MODELS = {
  AREA_TIERED: areaTiered,
  QTY_TIERED: qtyTiered,
  QTY_OPTIONS: qtyOptions,
};

/**
 * Run the pricing engine for a preset + normalized input.
 *
 * @param {object} preset  PricingPreset row (must have .model and .config)
 * @param {object} input   Normalized input from normalize()
 * @returns {{ totalCents: number, currency: string, breakdown: object[], meta: object }}
 */
export function computeQuote(preset, input) {
  if (!preset?.model) throw new Error("Preset missing model");
  if (!preset?.config) throw new Error("Preset missing config");

  const fn = MODELS[preset.model];
  if (!fn) throw new Error(`Unknown pricing model: ${preset.model}`);

  return fn(preset.config, input);
}
