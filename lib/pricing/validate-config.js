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
  } else if (model === "COST_PLUS") {
    // Materials map
    if (!config.materials || typeof config.materials !== "object" || Object.keys(config.materials).length === 0) {
      errors.push({ field: "materials", message: "Must be a non-empty object keyed by material id" });
    } else {
      for (const [key, mat] of Object.entries(config.materials)) {
        if (!mat || typeof mat !== "object") {
          errors.push({ field: `materials.${key}`, message: "Must be an object" });
        } else if (typeof mat.costPerSqft !== "number" || mat.costPerSqft < 0) {
          errors.push({ field: `materials.${key}.costPerSqft`, message: "Must be a number >= 0" });
        }
      }
    }
    // Ink costs map
    if (!config.inkCosts || typeof config.inkCosts !== "object" || Object.keys(config.inkCosts).length === 0) {
      errors.push({ field: "inkCosts", message: "Must be a non-empty object keyed by print mode" });
    } else {
      for (const [key, ink] of Object.entries(config.inkCosts)) {
        if (!ink || typeof ink !== "object") {
          errors.push({ field: `inkCosts.${key}`, message: "Must be an object" });
        } else {
          if (typeof ink.inkPerSqft !== "number" || ink.inkPerSqft < 0) {
            errors.push({ field: `inkCosts.${key}.inkPerSqft`, message: "Must be a number >= 0" });
          }
          if (ink.sqmPerHour !== undefined && (typeof ink.sqmPerHour !== "number" || ink.sqmPerHour < 0)) {
            errors.push({ field: `inkCosts.${key}.sqmPerHour`, message: "Must be a number >= 0" });
          }
        }
      }
    }
    // Machine labor
    if (config.machineLabor) {
      if (typeof config.machineLabor !== "object") {
        errors.push({ field: "machineLabor", message: "Must be an object" });
      } else if (typeof config.machineLabor.hourlyRate !== "number" || config.machineLabor.hourlyRate <= 0) {
        errors.push({ field: "machineLabor.hourlyRate", message: "Must be a number > 0" });
      }
    }
    // Markup
    if (!config.markup || typeof config.markup !== "object") {
      errors.push({ field: "markup", message: "Must be an object with retail and b2b" });
    } else {
      if (typeof config.markup.retail !== "number" || config.markup.retail <= 0) {
        errors.push({ field: "markup.retail", message: "Must be a number > 0" });
      }
      if (typeof config.markup.b2b !== "number" || config.markup.b2b <= 0) {
        errors.push({ field: "markup.b2b", message: "Must be a number > 0" });
      }
    }
    // Cutting
    if (config.cutting && typeof config.cutting === "object") {
      if (config.cutting.rectangularPerFt !== undefined && typeof config.cutting.rectangularPerFt !== "number") {
        errors.push({ field: "cutting.rectangularPerFt", message: "Must be a number" });
      }
      if (config.cutting.contourPerSqft !== undefined && typeof config.cutting.contourPerSqft !== "number") {
        errors.push({ field: "cutting.contourPerSqft", message: "Must be a number" });
      }
    }
  } else {
    errors.push({ field: "model", message: `Unknown pricing model: ${model}` });
  }

  return { valid: errors.length === 0, errors };
}
