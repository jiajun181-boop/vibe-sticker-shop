/**
 * Die-cut contour generation pipeline.
 *
 * Orchestrates: image loading → alpha detection → optional background removal
 * → marching squares → simplify → smooth → offset → SVG paths
 */

import { traceContours } from "./marching-squares";
import { simplifyPath, smoothPath } from "./simplify";
import { offsetContour, ensureClockwise } from "./offset";
import { pointsToCubicBezierPath, buildContourSvg } from "./svg-path";

const DEFAULT_OPTS = {
  bleedMm: 3,
  smoothIterations: 2,
  simplifyEpsilon: 1.5,
  alphaThreshold: 128,
  maxProcessingDim: 512,
  dpi: 72,
};

/**
 * Generate die-cut contour data from an image URL.
 *
 * @param {string} imageUrl
 * @param {object} [opts]
 * @param {number} [opts.bleedMm=3]        – bleed distance in mm
 * @param {number} [opts.smoothIterations=2]
 * @param {number} [opts.simplifyEpsilon=1.5]
 * @param {number} [opts.alphaThreshold=128]
 * @param {number} [opts.maxProcessingDim=512]
 * @param {number} [opts.dpi=72]
 * @param {(stage:string)=>void} [opts.onProgress] – progress callback
 * @returns {Promise<ContourResult>}
 *
 * @typedef {object} ContourResult
 * @property {string} cutPath       – SVG d-attribute for the cut line
 * @property {string} bleedPath     – SVG d-attribute for the bleed line
 * @property {string} svgString     – complete SVG markup
 * @property {Array<{x:number,y:number}>} contourPoints – main contour at original scale
 * @property {Array<{x:number,y:number}>} bleedPoints   – offset contour at original scale
 * @property {number} imageWidth    – original image width
 * @property {number} imageHeight   – original image height
 * @property {boolean} bgRemoved    – whether background removal was performed
 * @property {string|null} processedImageUrl – data URL of bg-removed image (if applicable)
 */
export async function generateContour(imageUrl, opts = {}) {
  const cfg = { ...DEFAULT_OPTS, ...opts };
  const progress = cfg.onProgress || (() => {});

  progress("loading");

  // 1. Load image onto offscreen canvas
  const img = await loadImage(imageUrl);
  const origW = img.width;
  const origH = img.height;

  // 2. Downsample for processing
  const scale = Math.min(1, cfg.maxProcessingDim / Math.max(origW, origH));
  const procW = Math.round(origW * scale);
  const procH = Math.round(origH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = procW;
  canvas.height = procH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, procW, procH);

  // 3. Check if image has meaningful alpha channel
  let imageData = ctx.getImageData(0, 0, procW, procH);
  let hasAlpha = detectAlphaChannel(imageData.data, procW, procH);
  let bgRemoved = false;
  let processedImageUrl = null;

  if (!hasAlpha) {
    // No alpha → run background removal
    progress("removing-bg");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(imageUrl, {
        output: { format: "image/png" },
      });
      const bgRemovedUrl = URL.createObjectURL(blob);
      const bgImg = await loadImage(bgRemovedUrl);

      // Re-draw onto processing canvas
      canvas.width = procW;
      canvas.height = procH;
      ctx.clearRect(0, 0, procW, procH);
      ctx.drawImage(bgImg, 0, 0, procW, procH);
      imageData = ctx.getImageData(0, 0, procW, procH);
      bgRemoved = true;
      processedImageUrl = bgRemovedUrl;
    } catch (err) {
      console.warn("Background removal failed, using original image:", err);
      // Fall back to treating the whole image as the sticker shape
      // Fill alpha to 255 so the contour wraps the entire image
    }
  }

  // 4. Extract alpha channel
  progress("tracing");
  const alpha = extractAlpha(imageData.data, procW, procH);

  // 5. Trace contours via marching squares
  const rawContours = traceContours(alpha, procW, procH, cfg.alphaThreshold);

  if (rawContours.length === 0) {
    throw new Error("No contour found — the image may be fully opaque or fully transparent");
  }

  // Use the largest contour (main sticker shape)
  const mainContour = ensureClockwise(rawContours[0]);

  // 6. Simplify
  const simplified = simplifyPath(mainContour, cfg.simplifyEpsilon);

  // 7. Smooth
  const smoothed = smoothPath(simplified, cfg.smoothIterations);

  // 8. Scale points back to original image dimensions
  const invScale = 1 / scale;
  const contourPoints = smoothed.map((p) => ({
    x: p.x * invScale,
    y: p.y * invScale,
  }));

  // 9. Offset for bleed
  const bleedPx = (cfg.bleedMm / 25.4) * cfg.dpi; // mm → inches → pixels
  const bleedPoints = offsetContour(contourPoints, bleedPx);

  // 10. Generate SVG paths
  const cutPath = pointsToCubicBezierPath(contourPoints, true, 0.3);
  const bleedPath = pointsToCubicBezierPath(bleedPoints, true, 0.3);

  const svgString = buildContourSvg({
    cutPath,
    bleedPath,
    width: origW,
    height: origH,
  });

  // 11. Quality analysis
  const quality = analyzeContourQuality(contourPoints, origW, origH, {
    bgRemoved,
    rawPointCount: mainContour.length,
    simplifiedPointCount: simplified.length,
  });

  progress("done");

  return {
    cutPath,
    bleedPath,
    svgString,
    contourPoints,
    bleedPoints,
    imageWidth: origW,
    imageHeight: origH,
    bgRemoved,
    processedImageUrl,
    quality,
  };
}

/**
 * Regenerate only the bleed offset path (fast — no image processing).
 * @param {Array<{x:number,y:number}>} contourPoints
 * @param {number} bleedMm
 * @param {number} [dpi=72]
 * @returns {{ bleedPath: string, bleedPoints: Array<{x:number,y:number}> }}
 */
export function regenerateBleed(contourPoints, bleedMm, dpi = 72) {
  const bleedPx = (bleedMm / 25.4) * dpi;
  const bleedPoints = offsetContour(contourPoints, bleedPx);
  const bleedPath = pointsToCubicBezierPath(bleedPoints, true, 0.3);
  return { bleedPath, bleedPoints };
}

// ── Quality analysis ──

/**
 * Analyse contour quality and classify shape type.
 *
 * Returns a grade + warnings that the UI and job records can use:
 *   confidence  : "good" | "rectangular" | "low"
 *   shapeType   : "organic" | "near-rectangular" | "rectangular"
 *   warnings[]  : human-readable warning strings (keys for i18n)
 *   contourBounds / imageBounds : bounding-box data
 */
export function analyzeContourQuality(
  contourPoints,
  imageWidth,
  imageHeight,
  { bgRemoved = false, rawPointCount = 0, simplifiedPointCount = 0 } = {}
) {
  const warnings = [];

  // ── Bounding box of contour ──
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of contourPoints) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const contourW = maxX - minX;
  const contourH = maxY - minY;

  const contourBounds = { minX, minY, maxX, maxY, width: contourW, height: contourH };
  const imageBounds = { width: imageWidth, height: imageHeight };

  // ── Coverage: how much of the image does the contour bbox fill? ──
  const coverageX = contourW / imageWidth;
  const coverageY = contourH / imageHeight;
  const areaCoverage = (contourW * contourH) / (imageWidth * imageHeight);

  // ── Rectangularity: contour area vs bbox area ──
  // Approximate contour area via shoelace formula
  const contourArea = Math.abs(shoelaceArea(contourPoints));
  const bboxArea = contourW * contourH;
  const rectangularity = bboxArea > 0 ? contourArea / bboxArea : 0;

  // ── Edge proximity: how close does the contour get to image edges? ──
  const edgeMarginX = Math.min(minX, imageWidth - maxX) / imageWidth;
  const edgeMarginY = Math.min(minY, imageHeight - maxY) / imageHeight;
  const edgeMargin = Math.min(edgeMarginX, edgeMarginY);

  // ── Classify ──
  let shapeType = "organic";
  let confidence = "good";

  // Rectangular detection: high rectangularity + high coverage
  if (rectangularity > 0.92 && areaCoverage > 0.85) {
    shapeType = "rectangular";
    confidence = "rectangular";
    warnings.push("warn_rectangular");
  } else if (rectangularity > 0.85 && areaCoverage > 0.75) {
    shapeType = "near-rectangular";
    confidence = "rectangular";
    warnings.push("warn_near_rectangular");
  }

  // Full-bleed / document detection
  if (coverageX > 0.95 && coverageY > 0.95) {
    if (!warnings.includes("warn_rectangular")) {
      warnings.push("warn_full_bleed");
    }
    if (confidence === "good") confidence = "low";
  }

  // Edge proximity warning
  if (edgeMargin < 0.01 && areaCoverage > 0.8) {
    warnings.push("warn_edge_proximity");
  }

  // Very few contour points → possible low-detail or fully simple shape
  if (simplifiedPointCount > 0 && simplifiedPointCount < 8) {
    warnings.push("warn_low_detail");
    if (confidence === "good") confidence = "low";
  }

  // BG removal had to run → source had no alpha, quality may vary
  if (bgRemoved) {
    warnings.push("info_bg_removed");
  }

  return {
    confidence,
    shapeType,
    warnings,
    contourBounds,
    imageBounds,
    areaCoverage: Math.round(areaCoverage * 100),
    rectangularity: Math.round(rectangularity * 100),
    pointCount: contourPoints.length,
  };
}

/** Shoelace formula for polygon area. */
function shoelaceArea(pts) {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return area / 2;
}

// ── Helpers ──

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Check if at least 1% of pixels have alpha < 250.
 * Returns true if image has meaningful transparency.
 */
function detectAlphaChannel(data, w, h) {
  const total = w * h;
  let transparentCount = 0;
  const sampleStep = Math.max(1, Math.floor(total / 5000)); // sample up to 5000 pixels

  for (let i = 0; i < total; i += sampleStep) {
    if (data[i * 4 + 3] < 250) {
      transparentCount++;
    }
  }

  const sampled = Math.ceil(total / sampleStep);
  return transparentCount / sampled > 0.01;
}

/** Extract alpha channel as a flat Uint8Array. */
function extractAlpha(data, w, h) {
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    alpha[i] = data[i * 4 + 3];
  }
  return alpha;
}
