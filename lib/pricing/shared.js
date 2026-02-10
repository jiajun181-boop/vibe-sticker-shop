// lib/pricing/shared.js
// Shared utilities for material multiplier and finishing surcharges.
// Used by all three pricing models (areaTiered, qtyTiered, qtyOptions).

/**
 * Resolve material price multiplier from preset config.
 * Matches by id (exact) or name (case-insensitive).
 * Returns 1.0 if no material selected or no materials configured.
 */
export function resolveMaterialMultiplier(config, materialId) {
  if (!materialId || !Array.isArray(config.materials) || config.materials.length === 0) {
    return 1.0;
  }
  const lower = materialId.toLowerCase();
  const mat = config.materials.find(
    (m) => m.id === materialId || m.name?.toLowerCase() === lower
  );
  return mat ? Number(mat.multiplier || 1) : 1.0;
}

/**
 * Compute finishing/processing surcharges.
 * @param {object} config        Preset config (must have .finishings array)
 * @param {string[]} selectedIds Finishing IDs selected by customer
 * @param {object} ctx           { quantity, sqftPerUnit }
 * @returns {{ totalDollars: number, lines: { label: string, amount: number }[] }}
 */
export function computeFinishings(config, selectedIds, { quantity, sqftPerUnit = 0 }) {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return { totalDollars: 0, lines: [] };
  }
  const defs = Array.isArray(config.finishings) ? config.finishings : [];
  let totalDollars = 0;
  const lines = [];

  for (const id of selectedIds) {
    const def = defs.find((f) => f.id === id);
    if (!def) continue;

    const price = Number(def.price || 0);
    let amt = 0;

    if (def.type === "flat") {
      amt = price;
    } else if (def.type === "per_unit") {
      amt = price * quantity;
    } else if (def.type === "per_sqft") {
      amt = price * sqftPerUnit * quantity;
    }

    totalDollars += amt;
    lines.push({ label: def.name || id, amount: Math.round(amt * 100) });
  }

  return { totalDollars, lines };
}
