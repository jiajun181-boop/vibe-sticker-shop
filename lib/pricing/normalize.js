// lib/pricing/normalize.js
// Normalize raw request body into a clean input object for the pricing engine.

/**
 * @param {object} body  Raw request body
 * @returns {object}     Normalized input
 */
export function normalizeInput(body) {
  const input = {};

  // Quantity — always required
  const qty = Number(body.quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("quantity must be a positive number");
  }
  input.quantity = Math.floor(qty);

  // Dimensions (optional, for AREA_TIERED)
  if (body.widthIn != null) input.widthIn = Number(body.widthIn);
  if (body.heightIn != null) input.heightIn = Number(body.heightIn);

  // Size label (optional, for QTY_OPTIONS)
  if (body.sizeLabel) input.sizeLabel = String(body.sizeLabel);

  // Material (optional, for materialLimits validation)
  if (body.material) input.material = String(body.material);

  // Add-ons (optional, for QTY_OPTIONS)
  if (Array.isArray(body.addons)) {
    input.addons = body.addons.map(String);
  }

  // Finishings (optional, for all models)
  if (Array.isArray(body.finishings)) {
    input.finishings = body.finishings.map(String);
  }

  return input;
}
