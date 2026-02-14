// lib/pricing/validate-config.js
// Validates PricingPreset config JSON before saving to the database.

/**
 * Validate a pricing preset config against its model's required schema.
 * @param {string} model  "AREA_TIERED" | "QTY_TIERED" | "QTY_OPTIONS"
 * @param {object} config The config JSON to validate
 * @returns {{ valid: boolean, errors: Array<{ field: string, message: string }> }}
 */
export function validatePresetConfig(model, config) {
  const errors = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: [{ field: "config", message: "Config must be a JSON object" }] };
  }

  // Common optional fields
  if (config.fileFee !== undefined && (typeof config.fileFee !== "number" || config.fileFee < 0)) {
    errors.push({ field: "fileFee", message: "Must be a number >= 0" });
  }
  if (config.minimumPrice !== undefined && (typeof config.minimumPrice !== "number" || config.minimumPrice < 0)) {
    errors.push({ field: "minimumPrice", message: "Must be a number >= 0" });
  }

  // Model-specific validation
  if (model === "AREA_TIERED") {
    if (!Array.isArray(config.tiers) || config.tiers.length === 0) {
      errors.push({ field: "tiers", message: "Must be a non-empty array of area tiers" });
    } else {
      config.tiers.forEach((tier, i) => {
        if (!tier || typeof tier !== "object") {
          errors.push({ field: `tiers[${i}]`, message: "Must be an object" });
          return;
        }
        if (typeof tier.upToSqft !== "number" || tier.upToSqft <= 0) {
          errors.push({ field: `tiers[${i}].upToSqft`, message: "Must be a number > 0" });
        }
        if (typeof tier.rate !== "number" || tier.rate <= 0) {
          errors.push({ field: `tiers[${i}].rate`, message: "Must be a number > 0" });
        }
      });
    }
  } else if (model === "QTY_TIERED") {
    if (!Array.isArray(config.tiers) || config.tiers.length === 0) {
      errors.push({ field: "tiers", message: "Must be a non-empty array of quantity tiers" });
    } else {
      config.tiers.forEach((tier, i) => {
        if (!tier || typeof tier !== "object") {
          errors.push({ field: `tiers[${i}]`, message: "Must be an object" });
          return;
        }
        if (typeof tier.minQty !== "number" || tier.minQty <= 0 || !Number.isInteger(tier.minQty)) {
          errors.push({ field: `tiers[${i}].minQty`, message: "Must be a positive integer" });
        }
        if (typeof tier.unitPrice !== "number" || tier.unitPrice <= 0) {
          errors.push({ field: `tiers[${i}].unitPrice`, message: "Must be a number > 0" });
        }
      });
    }
  } else if (model === "QTY_OPTIONS") {
    if (!Array.isArray(config.sizes) || config.sizes.length === 0) {
      errors.push({ field: "sizes", message: "Must be a non-empty array of size options" });
    } else {
      config.sizes.forEach((size, i) => {
        if (!size || typeof size !== "object") {
          errors.push({ field: `sizes[${i}]`, message: "Must be an object" });
          return;
        }
        if (!size.label || typeof size.label !== "string") {
          errors.push({ field: `sizes[${i}].label`, message: "Must be a non-empty string" });
        }
        if (!Array.isArray(size.tiers) || size.tiers.length === 0) {
          errors.push({ field: `sizes[${i}].tiers`, message: "Must be a non-empty array of qty tiers" });
        } else {
          size.tiers.forEach((tier, j) => {
            if (!tier || typeof tier !== "object") {
              errors.push({ field: `sizes[${i}].tiers[${j}]`, message: "Must be an object" });
              return;
            }
            if (typeof tier.qty !== "number" || tier.qty <= 0) {
              errors.push({ field: `sizes[${i}].tiers[${j}].qty`, message: "Must be a number > 0" });
            }
            if (typeof tier.unitPrice !== "number" || tier.unitPrice <= 0) {
              errors.push({ field: `sizes[${i}].tiers[${j}].unitPrice`, message: "Must be a number > 0" });
            }
          });
        }
      });
    }
  } else {
    errors.push({ field: "model", message: `Unknown pricing model: ${model}` });
  }

  return { valid: errors.length === 0, errors };
}
