// lib/pricing/get-smart-defaults.js
// Extracts smart defaults (min quantity + default material) from a product's pricing preset.

/**
 * @param {object} product  Prisma product with pricingPreset included
 * @returns {{ minQuantity: number, defaultMaterial: string | null }}
 */
export function getSmartDefaults(product) {
  const preset = product?.pricingPreset;
  const config = preset?.config;
  const model = preset?.model;

  let minQuantity = 1;
  let defaultMaterial = null;

  if (config && model) {
    if (model === "QTY_TIERED") {
      const tiers = Array.isArray(config.tiers) ? config.tiers : [];
      const sorted = [...tiers].sort((a, b) => Number(a.minQty) - Number(b.minQty));
      if (sorted.length > 0) minQuantity = Number(sorted[0].minQty) || 1;
    } else if (model === "QTY_OPTIONS") {
      const sizes = Array.isArray(config.sizes) ? config.sizes : [];
      if (sizes.length > 0) {
        const firstSize = sizes[0];
        const tiers = Array.isArray(firstSize.tiers) ? firstSize.tiers : [];
        const sorted = [...tiers].sort((a, b) => Number(a.qty) - Number(b.qty));
        if (sorted.length > 0) minQuantity = Number(sorted[0].qty) || 1;
      }
    }
    // AREA_TIERED & COST_PLUS → always 1 (dimension-based)

    // COST_PLUS: defaultMaterial comes from product optionsConfig
    if (model === "COST_PLUS") {
      const cpMaterials = config.materials && typeof config.materials === "object" ? Object.keys(config.materials) : [];
      if (cpMaterials.length > 0) {
        defaultMaterial = cpMaterials[0];
      }
      return { minQuantity, defaultMaterial };
    }

    // Default material: first material with multiplier === 1.0, or first material
    const materials = Array.isArray(config.materials) ? config.materials : [];
    if (materials.length > 0) {
      const standard = materials.find((m) => m && typeof m.multiplier === "number" && m.multiplier === 1.0);
      defaultMaterial = standard?.id || materials[0]?.id || null;
    }
  }

  return { minQuantity, defaultMaterial };
}
