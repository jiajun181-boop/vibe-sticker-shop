/**
 * Registration Marks — Caldera-lite groundwork (M7-6)
 *
 * This module provides SVG registration mark generation for die-cut
 * production files. Registration marks are alignment aids placed around
 * the contour path so the cutting machine can track the print.
 *
 * Mark types (future — only crosshair implemented):
 *   crosshair   — standard crosshair (+) marks at corners
 *   corner-crop — L-shaped crop marks
 *   center-dot  — center registration dots
 *
 * Usage:
 *   import { generateCrosshairs, wrapContourWithMarks } from "@/lib/contour/registration-marks";
 *   const marks = generateCrosshairs(contourBounds, { offsetMm: 5 });
 *   const svgWithMarks = wrapContourWithMarks(cutPath, bleedPath, marks, imageBounds);
 */

// ── Constants ───────────────────────────────────────────────────────────────

/** Default offset from bleed edge to registration mark center (mm) */
export const DEFAULT_MARK_OFFSET_MM = 5;

/** Standard mark size (mm) */
export const MARK_SIZE_MM = 3;

/** Registration mark color — industry standard is 100% K or Registration Black */
export const MARK_COLOR = "#000000";

// ── Mark generation ─────────────────────────────────────────────────────────

/**
 * Generate crosshair registration marks at the four corners of a bounding box.
 *
 * @param {{x: number, y: number, width: number, height: number}} bounds — bounding box (in px)
 * @param {{offsetMm?: number, sizeMm?: number, dpi?: number}} options
 * @returns {Array<{cx: number, cy: number, sizePx: number, type: "crosshair"}>}
 */
export function generateCrosshairs(bounds, options = {}) {
  const { offsetMm = DEFAULT_MARK_OFFSET_MM, sizeMm = MARK_SIZE_MM, dpi = 72 } = options;
  const offsetPx = (offsetMm / 25.4) * dpi;
  const sizePx = (sizeMm / 25.4) * dpi;

  if (!bounds || !bounds.width || !bounds.height) return [];

  const { x, y, width, height } = bounds;

  return [
    // Top-left
    { cx: x - offsetPx, cy: y - offsetPx, sizePx, type: "crosshair" },
    // Top-right
    { cx: x + width + offsetPx, cy: y - offsetPx, sizePx, type: "crosshair" },
    // Bottom-left
    { cx: x - offsetPx, cy: y + height + offsetPx, sizePx, type: "crosshair" },
    // Bottom-right
    { cx: x + width + offsetPx, cy: y + height + offsetPx, sizePx, type: "crosshair" },
  ];
}

/**
 * Generate SVG elements for crosshair marks.
 *
 * @param {Array<{cx: number, cy: number, sizePx: number}>} marks
 * @returns {string} — SVG group element string
 */
export function crosshairsToSvg(marks) {
  if (!marks || marks.length === 0) return "";

  const elements = marks.map((m) => {
    const half = m.sizePx / 2;
    return [
      // Horizontal line
      `<line x1="${m.cx - half}" y1="${m.cy}" x2="${m.cx + half}" y2="${m.cy}" stroke="${MARK_COLOR}" stroke-width="0.5" />`,
      // Vertical line
      `<line x1="${m.cx}" y1="${m.cy - half}" x2="${m.cx}" y2="${m.cy + half}" stroke="${MARK_COLOR}" stroke-width="0.5" />`,
      // Center circle (optional visual aid)
      `<circle cx="${m.cx}" cy="${m.cy}" r="${half * 0.3}" fill="none" stroke="${MARK_COLOR}" stroke-width="0.25" />`,
    ].join("\n    ");
  });

  return `<g id="registration-marks" class="registration">\n    ${elements.join("\n    ")}\n  </g>`;
}

/**
 * Wrap a contour (cut + bleed paths) with registration marks into a complete SVG.
 *
 * @param {string} cutPathD — SVG d attribute for cut path
 * @param {string} bleedPathD — SVG d attribute for bleed path
 * @param {Array} marks — from generateCrosshairs
 * @param {{width: number, height: number}} imageBounds — original image dimensions
 * @returns {string} — Complete SVG string with layers: artwork-bounds, bleed, cut, registration
 */
export function wrapContourWithMarks(cutPathD, bleedPathD, marks, imageBounds) {
  const marksSvg = crosshairsToSvg(marks);
  const padding = 30; // extra padding for marks
  const viewBox = `${-padding} ${-padding} ${imageBounds.width + padding * 2} ${imageBounds.height + padding * 2}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${imageBounds.width + padding * 2}" height="${imageBounds.height + padding * 2}">
  <!-- Bleed path (print extends to here) -->
  <g id="bleed-layer" class="bleed">
    <path d="${bleedPathD}" fill="none" stroke="#00BFFF" stroke-width="1" stroke-dasharray="4,2" />
  </g>

  <!-- Cut path (die-cut line) -->
  <g id="cut-layer" class="cut">
    <path d="${cutPathD}" fill="none" stroke="#FF0000" stroke-width="1.5" />
  </g>

  <!-- Registration marks -->
  ${marksSvg}
</svg>`;
}

// ── Step-and-repeat placeholder ─────────────────────────────────────────────

/**
 * Calculate step-and-repeat positions for a single contour on a sheet.
 * PLACEHOLDER — full nesting/bin-packing algorithm is a future task.
 *
 * @param {{width: number, height: number}} itemBounds — single item bounding box (px)
 * @param {{width: number, height: number}} sheetBounds — print sheet dimensions (px)
 * @param {{gapMm?: number, dpi?: number}} options
 * @returns {{positions: Array<{x: number, y: number, rotation: number}>, count: number, utilization: number}}
 */
export function stepAndRepeat(itemBounds, sheetBounds, options = {}) {
  const { gapMm = 3, dpi = 72 } = options;
  const gapPx = (gapMm / 25.4) * dpi;

  if (!itemBounds.width || !itemBounds.height || !sheetBounds.width || !sheetBounds.height) {
    return { positions: [], count: 0, utilization: 0 };
  }

  const cellW = itemBounds.width + gapPx;
  const cellH = itemBounds.height + gapPx;

  const cols = Math.floor(sheetBounds.width / cellW);
  const rows = Math.floor(sheetBounds.height / cellH);

  const positions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: col * cellW + gapPx / 2,
        y: row * cellH + gapPx / 2,
        rotation: 0,
      });
    }
  }

  const count = positions.length;
  const usedArea = count * itemBounds.width * itemBounds.height;
  const sheetArea = sheetBounds.width * sheetBounds.height;
  const utilization = sheetArea > 0 ? Math.round((usedArea / sheetArea) * 100) : 0;

  return { positions, count, utilization };
}

// ── Standard sheet sizes (for future imposition) ────────────────────────────

export const STANDARD_SHEETS = [
  { id: "12x18", label: "12\" x 18\"", widthIn: 12, heightIn: 18 },
  { id: "13x19", label: "13\" x 19\"", widthIn: 13, heightIn: 19 },
  { id: "letter", label: "Letter (8.5\" x 11\")", widthIn: 8.5, heightIn: 11 },
  { id: "tabloid", label: "Tabloid (11\" x 17\")", widthIn: 11, heightIn: 17 },
  { id: "24x36", label: "24\" x 36\"", widthIn: 24, heightIn: 36 },
];
