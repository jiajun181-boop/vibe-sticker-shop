// lib/design-studio/preflight.js — Pre-press check engine
import { getCanvasDimensions } from "./product-configs";

/**
 * Run preflight checks on a Fabric.js canvas.
 * @param {fabric.Canvas} canvas
 * @param {object} spec - product spec from getProductSpec()
 * @returns {{ passed: boolean, errors: Array, warnings: Array }}
 */
export function runPreflight(canvas, spec) {
  const errors = [];
  const warnings = [];
  const dims = getCanvasDimensions(spec);

  const userObjects = canvas
    .getObjects()
    .filter((obj) => !obj.id?.startsWith("__guide_") && obj.visible !== false);

  // 1. EMPTY_CANVAS — no user content
  if (userObjects.length === 0) {
    errors.push({
      code: "EMPTY_CANVAS",
      message: "Your design is empty. Please add some content before approving.",
    });
    return { passed: false, errors, warnings };
  }

  // 2. LOW_DPI — check image resolution
  const imageObjects = userObjects.filter(
    (obj) => obj.type === "Image" || obj.type === "FabricImage"
  );
  for (const img of imageObjects) {
    const imgWidth = img.width || 0;
    const imgHeight = img.height || 0;
    const scaleX = img.scaleX || 1;
    const scaleY = img.scaleY || 1;

    // Displayed size in canvas pixels
    const displayW = imgWidth * scaleX;
    const displayH = imgHeight * scaleY;

    // Convert to inches
    const widthInches = displayW / spec.dpi;
    const heightInches = displayH / spec.dpi;

    // Effective DPI
    const effectiveDpiX = widthInches > 0 ? imgWidth / widthInches : Infinity;
    const effectiveDpiY = heightInches > 0 ? imgHeight / heightInches : Infinity;
    const effectiveDpi = Math.min(effectiveDpiX, effectiveDpiY);

    if (effectiveDpi < spec.dpi * 0.5) {
      errors.push({
        code: "LOW_DPI",
        message: `An image has very low resolution (${Math.round(effectiveDpi)} DPI). Minimum recommended: ${spec.dpi} DPI. It will appear blurry when printed.`,
        objectId: img.id,
      });
    } else if (effectiveDpi < spec.dpi) {
      warnings.push({
        code: "LOW_DPI",
        message: `An image has below-optimal resolution (${Math.round(effectiveDpi)} DPI). Recommended: ${spec.dpi} DPI. Print quality may be reduced.`,
        objectId: img.id,
      });
    }
  }

  // 3. SAFE_ZONE_VIOLATION — text outside safe area
  const safeLeft = dims.bleedPx + dims.safePx;
  const safeTop = dims.bleedPx + dims.safePx;
  const safeRight = dims.width - dims.bleedPx - dims.safePx;
  const safeBottom = dims.height - dims.bleedPx - dims.safePx;

  const textObjects = userObjects.filter(
    (obj) =>
      obj.type === "Textbox" ||
      obj.type === "IText" ||
      obj.type === "Text"
  );

  for (const text of textObjects) {
    const bounds = text.getBoundingRect();
    if (
      bounds.left < safeLeft ||
      bounds.top < safeTop ||
      bounds.left + bounds.width > safeRight ||
      bounds.top + bounds.height > safeBottom
    ) {
      warnings.push({
        code: "SAFE_ZONE_VIOLATION",
        message: `Text "${(text.text || "").substring(0, 30)}..." extends beyond the safe area and may be cut off during trimming.`,
        objectId: text.id,
      });
    }
  }

  // 4. SMALL_TEXT — font size below 6pt
  for (const text of textObjects) {
    const fontSize = text.fontSize || 12;
    const scaleY = text.scaleY || 1;
    const effectiveSize = fontSize * scaleY;
    // Convert canvas pixels to points (at spec DPI)
    const sizeInInches = effectiveSize / spec.dpi;
    const sizeInPt = sizeInInches * 72;

    if (sizeInPt < 6) {
      warnings.push({
        code: "SMALL_TEXT",
        message: `Text "${(text.text || "").substring(0, 20)}..." is very small (${sizeInPt.toFixed(1)}pt). Text below 6pt may not be readable when printed.`,
        objectId: text.id,
      });
    }
  }

  // 5. NO_TRIM_CONTENT — all content is within bleed area only (nothing in trim)
  const trimLeft = dims.bleedPx;
  const trimTop = dims.bleedPx;
  const trimRight = dims.width - dims.bleedPx;
  const trimBottom = dims.height - dims.bleedPx;

  const hasContentInTrim = userObjects.some((obj) => {
    const bounds = obj.getBoundingRect();
    // Check if ANY part of the object overlaps with the trim area
    return (
      bounds.left + bounds.width > trimLeft &&
      bounds.left < trimRight &&
      bounds.top + bounds.height > trimTop &&
      bounds.top < trimBottom
    );
  });

  if (!hasContentInTrim) {
    errors.push({
      code: "NO_TRIM_CONTENT",
      message:
        "All content is outside the printable area. Please move your design inside the trim lines.",
    });
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}
