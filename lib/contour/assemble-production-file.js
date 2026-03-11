/**
 * Production File Assembly — Caldera-lite groundwork (Wave 5)
 *
 * Combines artwork image + contour SVG + registration marks + bleed path
 * into a single production-ready SVG suitable for print-and-cut workflows.
 *
 * The output SVG uses industry-standard spot color conventions:
 *   - CutContour layer: die-cut path (Spot Color: CutContour)
 *   - Bleed layer: print-extends-to boundary (cyan dashed)
 *   - Registration layer: alignment marks for cutting machine
 *   - Artwork layer: referenced image (linked, not embedded)
 *
 * Usage:
 *   import { assembleProductionSvg } from "@/lib/contour/assemble-production-file";
 *   const svg = assembleProductionSvg({ artworkUrl, cutPathD, bleedPathD, bounds, options });
 */

import { generateCrosshairs, crosshairsToSvg, DEFAULT_MARK_OFFSET_MM, MARK_SIZE_MM } from "./registration-marks";
import { stepAndRepeat, findBestSheet, STANDARD_SHEETS } from "./registration-marks";

// ── Spot color names (Caldera / Summa / Roland convention) ──────────────────

export const SPOT_COLORS = {
  CutContour: "#FF0000",     // Standard die-cut path
  PerfCutContour: "#00FF00", // Perforation cut
  ThruCut: "#FF00FF",        // Through-cut (cuts through media + liner)
  HalfCut: "#FFFF00",        // Kiss-cut (cuts through vinyl, not liner)
  RegMark: "#000000",        // Registration marks
};

// ── Single-item production SVG ──────────────────────────────────────────────

/**
 * Assemble a single-item production SVG with all layers.
 *
 * @param {{
 *   artworkUrl: string,
 *   cutPathD: string,
 *   bleedPathD?: string,
 *   bounds: {x: number, y: number, width: number, height: number},
 *   options?: {
 *     bleedMm?: number,
 *     markOffsetMm?: number,
 *     markSizeMm?: number,
 *     dpi?: number,
 *     showBleed?: boolean,
 *     showMarks?: boolean,
 *     cutType?: "CutContour" | "HalfCut" | "ThruCut" | "PerfCutContour",
 *     title?: string,
 *   }
 * }} params
 * @returns {string} — Complete SVG string
 */
export function assembleProductionSvg({ artworkUrl, cutPathD, bleedPathD, bounds, options = {} }) {
  const {
    bleedMm = 3,
    markOffsetMm = DEFAULT_MARK_OFFSET_MM,
    markSizeMm = MARK_SIZE_MM,
    dpi = 72,
    showBleed = true,
    showMarks = true,
    cutType = "CutContour",
    title = "Production File",
  } = options;

  if (!bounds || !bounds.width || !bounds.height) {
    return `<!-- Error: Invalid bounds -->`;
  }

  const cutColor = SPOT_COLORS[cutType] || SPOT_COLORS.CutContour;

  // Calculate marks
  let marksSvg = "";
  let markPadding = 0;
  if (showMarks) {
    const marks = generateCrosshairs(bounds, { offsetMm: markOffsetMm, sizeMm: markSizeMm, dpi });
    marksSvg = crosshairsToSvg(marks);
    markPadding = ((markOffsetMm + markSizeMm) / 25.4) * dpi;
  }

  // ViewBox with padding for marks
  const padding = showMarks ? Math.ceil(markPadding + 5) : 10;
  const vbX = bounds.x - padding;
  const vbY = bounds.y - padding;
  const vbW = bounds.width + padding * 2;
  const vbH = bounds.height + padding * 2;

  const bleedLayer = showBleed && bleedPathD
    ? `  <!-- Bleed path (print area extends to here) -->
  <g id="bleed-layer" data-spot-color="Bleed">
    <path d="${bleedPathD}" fill="none" stroke="#00BFFF" stroke-width="0.75" stroke-dasharray="4,2" />
  </g>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="${vbX} ${vbY} ${vbW} ${vbH}"
     width="${vbW}" height="${vbH}">
  <title>${escapeXml(title)}</title>

  <!-- Artwork layer (linked image) -->
  <g id="artwork-layer">
    <image href="${escapeXml(artworkUrl)}" x="${bounds.x}" y="${bounds.y}"
           width="${bounds.width}" height="${bounds.height}"
           preserveAspectRatio="none" />
  </g>

${bleedLayer}

  <!-- Cut contour (${cutType} spot color: ${cutColor}) -->
  <g id="cut-layer" data-spot-color="${cutType}">
    <path d="${cutPathD}" fill="none" stroke="${cutColor}" stroke-width="1" />
  </g>

  <!-- Registration marks -->
  ${marksSvg}
</svg>`;
}

// ── Multi-up (step-and-repeat) production SVG ───────────────────────────────

/**
 * Assemble a multi-up production SVG with step-and-repeat layout.
 *
 * @param {{
 *   artworkUrl: string,
 *   cutPathD: string,
 *   bleedPathD?: string,
 *   itemBounds: {width: number, height: number},
 *   sheetSizeIn?: {widthIn: number, heightIn: number},
 *   quantity?: number,
 *   options?: {
 *     gapMm?: number,
 *     dpi?: number,
 *     cutType?: string,
 *     autoSheet?: boolean,
 *     title?: string,
 *   }
 * }} params
 * @returns {{
 *   svg: string,
 *   layout: ReturnType<typeof stepAndRepeat>,
 *   sheet: {id: string, label: string, widthIn: number, heightIn: number} | null,
 *   sheetsNeeded: number,
 * }}
 */
export function assembleMultiUpSvg({
  artworkUrl,
  cutPathD,
  bleedPathD,
  itemBounds,
  sheetSizeIn,
  quantity = 1,
  options = {},
}) {
  const {
    gapMm = 3,
    dpi = 72,
    cutType = "CutContour",
    autoSheet = true,
    title = "Step-and-Repeat Production File",
  } = options;

  const cutColor = SPOT_COLORS[cutType] || SPOT_COLORS.CutContour;

  // Convert item bounds to inches if they're in px
  const itemW = itemBounds.width;
  const itemH = itemBounds.height;

  // Determine sheet
  let sheet = sheetSizeIn || null;
  let layout;

  if (!sheet && autoSheet) {
    const best = findBestSheet({ widthIn: itemW, heightIn: itemH }, quantity, { gapMm });
    if (best) {
      sheet = best.sheet;
      layout = best.layout;
    }
  }

  if (!sheet) {
    // Default to 13x19
    sheet = STANDARD_SHEETS[1];
  }

  if (!layout) {
    layout = stepAndRepeat(
      { width: itemW, height: itemH },
      { width: sheet.widthIn, height: sheet.heightIn },
      { gapMm, dpi: 1, maxCopies: quantity },
    );
  }

  const sheetsNeeded = layout.count > 0 ? Math.ceil(quantity / layout.count) : 0;

  // Build SVG at DPI scale
  const svgW = sheet.widthIn * dpi;
  const svgH = sheet.heightIn * dpi;
  const markOffsetPx = (DEFAULT_MARK_OFFSET_MM / 25.4) * dpi;

  // Generate marks for the full sheet
  const sheetMarks = generateCrosshairs(
    { x: 0, y: 0, width: svgW, height: svgH },
    { offsetMm: DEFAULT_MARK_OFFSET_MM, dpi },
  );
  const marksSvg = crosshairsToSvg(sheetMarks);

  // Build repeated items
  const itemSvgW = itemW * dpi;
  const itemSvgH = itemH * dpi;
  const items = layout.positions.map((pos, i) => {
    const tx = pos.x * dpi;
    const ty = pos.y * dpi;
    const transform = pos.rotation === 90
      ? `translate(${tx + itemSvgH}, ${ty}) rotate(90)`
      : `translate(${tx}, ${ty})`;

    return `    <g transform="${transform}" data-copy="${i + 1}">
      <image href="${escapeXml(artworkUrl)}" x="0" y="0" width="${itemSvgW}" height="${itemSvgH}" preserveAspectRatio="none" />
      <path d="${cutPathD}" fill="none" stroke="${cutColor}" stroke-width="0.75" />
${bleedPathD ? `      <path d="${bleedPathD}" fill="none" stroke="#00BFFF" stroke-width="0.5" stroke-dasharray="3,1.5" />` : ""}
    </g>`;
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">
  <title>${escapeXml(title)}</title>
  <desc>Sheet: ${sheet.label} | Items: ${layout.count} | Utilization: ${layout.utilization}%</desc>

  <!-- Sheet boundary -->
  <rect x="0" y="0" width="${svgW}" height="${svgH}" fill="none" stroke="#CCCCCC" stroke-width="0.5" stroke-dasharray="8,4" />

  <!-- Step-and-repeat items -->
  <g id="items-layer">
${items.join("\n")}
  </g>

  <!-- Cut contour layer (${cutType}) -->
  <g id="cut-layer" data-spot-color="${cutType}" />

  <!-- Registration marks -->
  ${marksSvg}
</svg>`;

  return { svg, layout, sheet, sheetsNeeded };
}

// ── Production file metadata ────────────────────────────────────────────────

/**
 * Build production file metadata for a job.
 * Used to determine what type of production file to generate.
 *
 * @param {object} job — ProductionJob with family, material, etc.
 * @returns {{
 *   needsContour: boolean,
 *   cutType: string,
 *   needsWhiteInk: boolean,
 *   needsStepAndRepeat: boolean,
 *   suggestedSheet: string | null,
 *   isLargeFormat: boolean,
 * }}
 */
export function getProductionFileRequirements(job) {
  const family = job.family || "";
  const material = (job.material || "").toLowerCase();
  const widthIn = job.widthIn || 0;
  const heightIn = job.heightIn || 0;
  const quantity = job.quantity || 1;

  const needsContour = family === "sticker" || family === "label";
  const isLargeFormat = widthIn > 24 || heightIn > 24;

  // Determine cut type
  let cutType = "CutContour";
  if (family === "sticker" && material.includes("kiss")) {
    cutType = "HalfCut";
  } else if (family === "sticker" && (material.includes("die") || material.includes("vinyl"))) {
    cutType = "CutContour";
  } else if (family === "label" && material.includes("roll")) {
    cutType = "HalfCut";
  }

  // White ink needed for transparent materials
  const needsWhiteInk = material.includes("clear") || material.includes("transparent") || material.includes("frosted");

  // Step-and-repeat for small items in quantity
  const needsStepAndRepeat = !isLargeFormat && quantity > 1 && needsContour;

  // Suggest sheet for small items
  let suggestedSheet = null;
  if (needsStepAndRepeat && widthIn && heightIn) {
    const best = findBestSheet({ widthIn, heightIn }, quantity);
    suggestedSheet = best?.sheet?.id || null;
  }

  return {
    needsContour,
    cutType,
    needsWhiteInk,
    needsStepAndRepeat,
    suggestedSheet,
    isLargeFormat,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
