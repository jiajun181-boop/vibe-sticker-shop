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

// ── Step-and-repeat with rotation optimization ──────────────────────────────

/**
 * Calculate step-and-repeat positions for a single contour on a sheet.
 * Tries both normal and 90° rotated orientations, picks the one that fits more copies.
 *
 * @param {{width: number, height: number}} itemBounds — single item bounding box (px or inches)
 * @param {{width: number, height: number}} sheetBounds — print sheet dimensions (same unit)
 * @param {{gapMm?: number, dpi?: number, allowRotation?: boolean, maxCopies?: number, markOffset?: number}} options
 * @returns {{
 *   positions: Array<{x: number, y: number, rotation: number}>,
 *   count: number,
 *   utilization: number,
 *   wastePercent: number,
 *   cols: number,
 *   rows: number,
 *   rotated: boolean,
 *   sheetUsedWidth: number,
 *   sheetUsedHeight: number,
 * }}
 */
export function stepAndRepeat(itemBounds, sheetBounds, options = {}) {
  const { gapMm = 3, dpi = 72, allowRotation = true, maxCopies = Infinity, markOffset = 0 } = options;
  const gapPx = (gapMm / 25.4) * dpi;

  if (!itemBounds.width || !itemBounds.height || !sheetBounds.width || !sheetBounds.height) {
    return { positions: [], count: 0, utilization: 0, wastePercent: 100, cols: 0, rows: 0, rotated: false, sheetUsedWidth: 0, sheetUsedHeight: 0 };
  }

  // Account for registration mark offset on all sides
  const printableW = sheetBounds.width - markOffset * 2;
  const printableH = sheetBounds.height - markOffset * 2;
  if (printableW <= 0 || printableH <= 0) {
    return { positions: [], count: 0, utilization: 0, wastePercent: 100, cols: 0, rows: 0, rotated: false, sheetUsedWidth: 0, sheetUsedHeight: 0 };
  }

  function calcGrid(w, h, rotation) {
    const cellW = w + gapPx;
    const cellH = h + gapPx;
    const cols = Math.floor((printableW + gapPx) / cellW);
    const rows = Math.floor((printableH + gapPx) / cellH);
    const positions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (positions.length >= maxCopies) break;
        positions.push({
          x: markOffset + col * cellW,
          y: markOffset + row * cellH,
          rotation,
        });
      }
      if (positions.length >= maxCopies) break;
    }
    const usedW = cols > 0 ? cols * cellW - gapPx : 0;
    const usedH = rows > 0 ? rows * cellH - gapPx : 0;
    return { positions, cols, rows, usedW, usedH };
  }

  // Try normal orientation
  const normal = calcGrid(itemBounds.width, itemBounds.height, 0);
  // Try rotated 90°
  const rotated = allowRotation
    ? calcGrid(itemBounds.height, itemBounds.width, 90)
    : { positions: [], cols: 0, rows: 0, usedW: 0, usedH: 0 };

  const best = rotated.positions.length > normal.positions.length ? rotated : normal;
  const isRotated = best === rotated && allowRotation && rotated.positions.length > normal.positions.length;

  const itemW = isRotated ? itemBounds.height : itemBounds.width;
  const itemH = isRotated ? itemBounds.width : itemBounds.height;
  const count = best.positions.length;
  const usedArea = count * itemW * itemH;
  const sheetArea = sheetBounds.width * sheetBounds.height;
  const utilization = sheetArea > 0 ? Math.round((usedArea / sheetArea) * 100) : 0;

  return {
    positions: best.positions,
    count,
    utilization,
    wastePercent: 100 - utilization,
    cols: best.cols,
    rows: best.rows,
    rotated: isRotated,
    sheetUsedWidth: best.usedW,
    sheetUsedHeight: best.usedH,
  };
}

/**
 * Find the best standard sheet for a given item.
 * Evaluates all standard sheets and returns the one with highest utilization.
 *
 * @param {{widthIn: number, heightIn: number}} itemSize — item dimensions in inches
 * @param {number} quantity — desired number of copies
 * @param {{gapMm?: number}} options
 * @returns {{
 *   sheet: {id: string, label: string, widthIn: number, heightIn: number},
 *   layout: ReturnType<typeof stepAndRepeat>,
 *   sheetsNeeded: number,
 *   totalWastePercent: number,
 * } | null}
 */
export function findBestSheet(itemSize, quantity, options = {}) {
  if (!itemSize.widthIn || !itemSize.heightIn || !quantity) return null;

  let best = null;

  for (const sheet of STANDARD_SHEETS) {
    const layout = stepAndRepeat(
      { width: itemSize.widthIn, height: itemSize.heightIn },
      { width: sheet.widthIn, height: sheet.heightIn },
      { ...options, dpi: 1, maxCopies: quantity },
    );

    if (layout.count === 0) continue;

    const sheetsNeeded = Math.ceil(quantity / layout.count);
    const totalPrinted = sheetsNeeded * layout.count;
    const itemArea = itemSize.widthIn * itemSize.heightIn;
    const totalSheetArea = sheetsNeeded * sheet.widthIn * sheet.heightIn;
    const totalUsedArea = Math.min(totalPrinted, quantity) * itemArea;
    const totalWastePercent = totalSheetArea > 0
      ? Math.round((1 - totalUsedArea / totalSheetArea) * 100)
      : 100;

    if (!best || sheetsNeeded < best.sheetsNeeded || (sheetsNeeded === best.sheetsNeeded && totalWastePercent < best.totalWastePercent)) {
      best = { sheet, layout, sheetsNeeded, totalWastePercent };
    }
  }

  return best;
}

// ── Standard sheet sizes (for future imposition) ────────────────────────────

export const STANDARD_SHEETS = [
  { id: "12x18", label: "12\" x 18\"", widthIn: 12, heightIn: 18 },
  { id: "13x19", label: "13\" x 19\"", widthIn: 13, heightIn: 19 },
  { id: "letter", label: "Letter (8.5\" x 11\")", widthIn: 8.5, heightIn: 11 },
  { id: "tabloid", label: "Tabloid (11\" x 17\")", widthIn: 11, heightIn: 17 },
  { id: "24x36", label: "24\" x 36\"", widthIn: 24, heightIn: 36 },
];
