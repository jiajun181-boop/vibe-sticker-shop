// lib/design-studio/print-guides.js — Bleed/trim/safe area visualization for Fabric.js
import { Rect, Line, Group } from "fabric";
import { getCanvasDimensions } from "./product-configs";

const GUIDE_PROPS = {
  selectable: false,
  evented: false,
  excludeFromExport: true,
};

/**
 * Create print guide objects for a product spec.
 * Returns array of Fabric.js objects to add to canvas.
 */
export function createPrintGuides(spec) {
  const dims = getCanvasDimensions(spec);
  const { width, height, bleedPx, safePx } = dims;
  const guides = [];

  // --- Bleed area masks (4 semi-transparent red strips) ---
  const bleedColor = "rgba(255,0,0,0.08)";

  // Top bleed strip
  guides.push(
    new Rect({
      left: 0,
      top: 0,
      width: width,
      height: bleedPx,
      fill: bleedColor,
      id: "__guide_bleed_top",
      ...GUIDE_PROPS,
    })
  );
  // Bottom bleed strip
  guides.push(
    new Rect({
      left: 0,
      top: height - bleedPx,
      width: width,
      height: bleedPx,
      fill: bleedColor,
      id: "__guide_bleed_bottom",
      ...GUIDE_PROPS,
    })
  );
  // Left bleed strip
  guides.push(
    new Rect({
      left: 0,
      top: bleedPx,
      width: bleedPx,
      height: height - bleedPx * 2,
      fill: bleedColor,
      id: "__guide_bleed_left",
      ...GUIDE_PROPS,
    })
  );
  // Right bleed strip
  guides.push(
    new Rect({
      left: width - bleedPx,
      top: bleedPx,
      width: bleedPx,
      height: height - bleedPx * 2,
      fill: bleedColor,
      id: "__guide_bleed_right",
      ...GUIDE_PROPS,
    })
  );

  // --- Trim line (black dashed rectangle) ---
  guides.push(
    new Rect({
      left: bleedPx,
      top: bleedPx,
      width: width - bleedPx * 2,
      height: height - bleedPx * 2,
      fill: "transparent",
      stroke: "#000000",
      strokeWidth: 1,
      strokeDashArray: [6, 4],
      id: "__guide_trim",
      ...GUIDE_PROPS,
    })
  );

  // --- Safe area line (blue dashed rectangle) ---
  const safeOffset = bleedPx + safePx;
  guides.push(
    new Rect({
      left: safeOffset,
      top: safeOffset,
      width: width - safeOffset * 2,
      height: height - safeOffset * 2,
      fill: "transparent",
      stroke: "rgba(37,99,235,0.5)",
      strokeWidth: 0.5,
      strokeDashArray: [4, 4],
      id: "__guide_safe",
      ...GUIDE_PROPS,
    })
  );

  return guides;
}

/**
 * Toggle visibility of print guides on canvas.
 */
export function togglePrintGuides(canvas, visible) {
  if (!canvas) return;
  const objects = canvas.getObjects();
  for (const obj of objects) {
    if (obj.id && obj.id.startsWith("__guide_")) {
      obj.visible = visible;
    }
  }
  canvas.requestRenderAll();
}

/**
 * Remove all print guides from canvas.
 */
export function removePrintGuides(canvas) {
  if (!canvas) return;
  const toRemove = canvas
    .getObjects()
    .filter((obj) => obj.id && obj.id.startsWith("__guide_"));
  for (const obj of toRemove) {
    canvas.remove(obj);
  }
  canvas.requestRenderAll();
}
