/**
 * Die-cut contour generation pipeline.
 *
 * Orchestrates: image loading → alpha detection → foreground mask extraction
 * (corner flood / edge gradient) → optional ML background removal fallback
 * → marching squares → simplify → smooth → offset → SVG paths
 *
 * Extraction modes:
 *   "alpha"          – image had transparency, used directly
 *   "corner_flood"   – detected uniform background, flood-filled from edges
 *   "edge_gradient"  – non-uniform bg, used gradient-based segmentation
 *   "bg_removal"     – used @imgly/background-removal ML model
 *   "hybrid"         – combined foreground mask + ML refinement
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
  skipBgRemoval: false,
  preferFastMode: false,
  maxBgRemovalPixels: 2000000,
  maxMaskOverlayPixels: 160000,
};

export const SAFETY_LIMITS = {
  MAX_INPUT_MEGAPIXELS: 100,
  MAX_CANVAS_PIXELS: 512 * 512,
  MAX_BGREMOVAL_MPIX: 0.5,
};

export function checkImageSafety(width, height) {
  const megapixels = (Math.max(0, width) * Math.max(0, height)) / 1_000_000;
  if (megapixels > SAFETY_LIMITS.MAX_INPUT_MEGAPIXELS) {
    return {
      safe: false,
      megapixels,
      reason: `Image too large: ${megapixels} MP exceeds ${SAFETY_LIMITS.MAX_INPUT_MEGAPIXELS} MP limit`,
    };
  }
  return { safe: true, megapixels };
}

export function checkBgRemovalEligibility(procW, procH, opts = {}) {
  const procMpix = (Math.max(0, procW) * Math.max(0, procH)) / 1_000_000;
  if (opts.skipBgRemoval) {
    return { eligible: false, procMpix, reason: "skipped_by_config" };
  }
  if (procMpix > SAFETY_LIMITS.MAX_BGREMOVAL_MPIX) {
    return {
      eligible: false,
      procMpix,
      reason: `processing canvas exceeds ${SAFETY_LIMITS.MAX_BGREMOVAL_MPIX} MP background-removal budget`,
    };
  }
  return { eligible: true, procMpix };
}

export function computeProcessingDimensions(origW, origH, maxProcessingDim = DEFAULT_OPTS.maxProcessingDim) {
  const longestSide = Math.max(origW || 0, origH || 0, 1);
  let scale = Math.min(1, maxProcessingDim / longestSide);
  let procW = Math.max(1, Math.round((origW || 1) * scale));
  let procH = Math.max(1, Math.round((origH || 1) * scale));
  let canvasLimitApplied = false;

  const procPixels = procW * procH;
  if (procPixels > SAFETY_LIMITS.MAX_CANVAS_PIXELS) {
    const canvasScale = Math.sqrt(SAFETY_LIMITS.MAX_CANVAS_PIXELS / procPixels);
    scale *= canvasScale;
    procW = Math.max(1, Math.floor(procW * canvasScale));
    procH = Math.max(1, Math.floor(procH * canvasScale));
    canvasLimitApplied = true;
  }

  return { procW, procH, scale, canvasLimitApplied };
}

/**
 * Generate die-cut contour data from an image URL.
 *
 * @param {string} imageUrl
 * @param {object} [opts]
 * @param {number} [opts.bleedMm=3]
 * @param {number} [opts.smoothIterations=2]
 * @param {number} [opts.simplifyEpsilon=1.5]
 * @param {number} [opts.alphaThreshold=128]
 * @param {number} [opts.maxProcessingDim=512]
 * @param {number} [opts.dpi=72]
 * @param {boolean} [opts.skipBgRemoval=false]
 * @param {(stage:string)=>void} [opts.onProgress]
 * @returns {Promise<ContourResult>}
 */
export async function generateContour(imageUrl, opts = {}) {
  const cfg = { ...DEFAULT_OPTS, ...opts };
  const progress = cfg.onProgress || (() => {});

  progress("loading");

  // 1. Load image onto offscreen canvas
  const img = await loadImage(imageUrl);
  const origW = img.width;
  const origH = img.height;

  const safety = checkImageSafety(origW, origH);
  if (!safety.safe) {
    throw new Error(safety.reason);
  }

  // 2. Downsample for processing
  const { procW, procH, scale } = computeProcessingDimensions(origW, origH, cfg.maxProcessingDim);

  const canvas = document.createElement("canvas");
  canvas.width = procW;
  canvas.height = procH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error(
      "Could not create canvas context — your browser may be out of memory. " +
      "Try a smaller image or use a desktop browser."
    );
  }
  ctx.drawImage(img, 0, 0, procW, procH);
  await yieldToMain();

  // 3. Check if image has meaningful alpha channel
  let imageData = ctx.getImageData(0, 0, procW, procH);
  let hasAlpha = detectAlphaChannel(imageData.data, procW, procH);
  let bgRemoved = false;
  let processedImageUrl = null;
  let extractionMode = "alpha";
  let extractionMeta = {};
  let maskOverlayUrl = null;

  if (hasAlpha) {
    // ── Path A: Image has transparency → use alpha directly ──
    extractionMode = "alpha";
  } else {
    // ── Path B/C: No alpha → try foreground mask extraction (fast) ──
    progress("analyzing");

    const { extractForegroundMask, createMaskOverlay } = await import("./foreground-mask");
    const fgResult = await extractForegroundMask(imageData, procW, procH);
    extractionMeta = fgResult.meta;

    // Evaluate mask quality: usable if coverage is between 2% and 95%
    const maskUsable = fgResult.meta.maskCoverage > 0.02 && fgResult.meta.maskCoverage < 0.95;
    const canBuildMaskOverlay = shouldBuildMaskOverlay(procW, procH, cfg.maxMaskOverlayPixels);
    const canAttemptBgRemoval = shouldAttemptBgRemoval({
      maskCoverage: fgResult.meta.maskCoverage,
      skipBgRemoval: cfg.skipBgRemoval,
      preferFastMode: cfg.preferFastMode,
      procW,
      procH,
      originalPixels: origW * origH,
      maxBgRemovalPixels: cfg.maxBgRemovalPixels,
    });

    if (maskUsable) {
      // Good foreground mask — apply it as the alpha channel
      extractionMode = fgResult.mode;

      // Save original imageData for overlay before modifying alpha
      if (canBuildMaskOverlay) {
        maskOverlayUrl = createMaskOverlay(imageData, fgResult.mask, procW, procH);
      }

      // Inject mask into alpha channel
      for (let i = 0; i < procW * procH; i++) {
        imageData.data[i * 4 + 3] = fgResult.mask[i];
      }
      ctx.putImageData(imageData, 0, 0);
      processedImageUrl = canvas.toDataURL("image/png");

    } else if (canAttemptBgRemoval) {
      // Mask coverage too high/low — try ML background removal
      progress("removing-bg");
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(imageUrl, {
          output: { format: "image/png" },
        });
        const bgRemovedUrl = URL.createObjectURL(blob);
        const bgImg = await loadImage(bgRemovedUrl);

        canvas.width = procW;
        canvas.height = procH;
        ctx.clearRect(0, 0, procW, procH);
        ctx.drawImage(bgImg, 0, 0, procW, procH);
        imageData = ctx.getImageData(0, 0, procW, procH);
        bgRemoved = true;
        processedImageUrl = bgRemovedUrl;
        extractionMode = "bg_removal";
      } catch (err) {
        console.warn("Background removal failed, falling back to foreground mask:", err);
        // Fall back to foreground mask even with borderline coverage
        if (fgResult.meta.maskCoverage > 0.01) {
          extractionMode = fgResult.mode;
          if (canBuildMaskOverlay) {
            maskOverlayUrl = createMaskOverlay(
              ctx.getImageData(0, 0, procW, procH),
              fgResult.mask,
              procW,
              procH
            );
          }
          for (let i = 0; i < procW * procH; i++) {
            imageData.data[i * 4 + 3] = fgResult.mask[i];
          }
          ctx.putImageData(imageData, 0, 0);
          processedImageUrl = canvas.toDataURL("image/png");
        }
      }

    } else {
      // Mobile: skip ML, use foreground mask if any coverage
      if (fgResult.meta.maskCoverage > 0.01 && fgResult.meta.maskCoverage < 0.98) {
        extractionMode = fgResult.mode;
        if (canBuildMaskOverlay) {
          maskOverlayUrl = createMaskOverlay(imageData, fgResult.mask, procW, procH);
        }
        for (let i = 0; i < procW * procH; i++) {
          imageData.data[i * 4 + 3] = fgResult.mask[i];
        }
        ctx.putImageData(imageData, 0, 0);
        processedImageUrl = canvas.toDataURL("image/png");
      } else {
        console.info("Foreground mask not usable, background removal skipped (mobile)");
      }
    }
  }

  // 4. Extract alpha channel
  progress("tracing");
  const alpha = extractAlpha(imageData.data, procW, procH);
  await yieldToMain();

  // 5. Trace contours via marching squares
  const rawContours = traceContours(alpha, procW, procH, cfg.alphaThreshold);

  if (rawContours.length === 0) {
    throw new Error("No contour found — the image may be fully opaque or fully transparent");
  }

  // Use the largest contour (main sticker shape)
  const mainContour = ensureClockwise(rawContours[0]);

  // 6. Simplify
  const simplified = simplifyPath(mainContour, cfg.simplifyEpsilon);
  await yieldToMain();

  // 7. Smooth
  const smoothed = smoothPath(simplified, cfg.smoothIterations);
  await yieldToMain();

  // 8. Scale points back to original image dimensions
  const invScale = 1 / scale;
  const contourPoints = smoothed.map((p) => ({
    x: p.x * invScale,
    y: p.y * invScale,
  }));

  // 9. Offset for bleed
  const bleedPx = (cfg.bleedMm / 25.4) * cfg.dpi;
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

  // 11. Quality analysis — enriched with extraction metadata
  const quality = analyzeContourQuality(contourPoints, origW, origH, {
    bgRemoved,
    rawPointCount: mainContour.length,
    simplifiedPointCount: simplified.length,
    extractionMode,
    extractionMeta,
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
    extractionMode,
    extractionMeta,
    maskOverlayUrl,
  };
}

/**
 * Regenerate only the bleed offset path (fast — no image processing).
 */
export function regenerateBleed(contourPoints, bleedMm, dpi = 72) {
  const bleedPx = (bleedMm / 25.4) * dpi;
  const bleedPoints = offsetContour(contourPoints, bleedPx);
  const bleedPath = pointsToCubicBezierPath(bleedPoints, true, 0.3);
  return { bleedPath, bleedPoints };
}

export function shouldAttemptBgRemoval({
  maskCoverage,
  skipBgRemoval = false,
  preferFastMode = false,
  procW = 0,
  procH = 0,
  originalPixels = 0,
  maxBgRemovalPixels = DEFAULT_OPTS.maxBgRemovalPixels,
} = {}) {
  const budget = checkBgRemovalEligibility(procW, procH, { skipBgRemoval });
  if (!budget.eligible) return false;
  if (originalPixels > maxBgRemovalPixels) return false;
  if (preferFastMode) {
    return maskCoverage <= 0.01 || maskCoverage >= 0.99;
  }
  return maskCoverage <= 0.02 || maskCoverage >= 0.95;
}

export function shouldBuildMaskOverlay(width, height, maxMaskOverlayPixels = DEFAULT_OPTS.maxMaskOverlayPixels) {
  return width * height <= maxMaskOverlayPixels;
}

// ── Quality analysis ──

/**
 * Analyse contour quality and classify shape type.
 *
 * Returns a grade + warnings that the UI and job records can use:
 *   confidence  : "good" | "rectangular" | "low"
 *   shapeType   : "organic" | "near-rectangular" | "rectangular"
 *   warnings[]  : human-readable warning strings (keys for i18n)
 *   suggestion  : i18n key for human-readable next-step guidance
 */
export function analyzeContourQuality(
  contourPoints,
  imageWidth,
  imageHeight,
  {
    bgRemoved = false,
    rawPointCount = 0,
    simplifiedPointCount = 0,
    extractionMode = "alpha",
    extractionMeta = {},
  } = {}
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
  const contourArea = Math.abs(shoelaceArea(contourPoints));
  const bboxArea = contourW * contourH;
  const rectangularity = bboxArea > 0 ? contourArea / bboxArea : 0;

  // ── Edge proximity ──
  const edgeMarginX = Math.min(minX, imageWidth - maxX) / imageWidth;
  const edgeMarginY = Math.min(minY, imageHeight - maxY) / imageHeight;
  const edgeMargin = Math.min(edgeMarginX, edgeMarginY);

  // ── Classify ──
  let shapeType = "organic";
  let confidence = "good";

  // Rectangular detection
  if (rectangularity > 0.92 && areaCoverage > 0.85) {
    shapeType = "rectangular";
    confidence = "rectangular";
    warnings.push("warn_rectangular");
  } else if (rectangularity > 0.85 && areaCoverage > 0.75) {
    shapeType = "near-rectangular";
    confidence = "rectangular";
    warnings.push("warn_near_rectangular");
  }

  // Full-bleed detection
  if (coverageX > 0.95 && coverageY > 0.95) {
    if (!warnings.includes("warn_rectangular")) {
      warnings.push("warn_full_bleed");
    }
    if (confidence === "good") confidence = "low";
  }

  // Edge proximity
  if (edgeMargin < 0.01 && areaCoverage > 0.8) {
    warnings.push("warn_edge_proximity");
  }

  // Low detail
  if (simplifiedPointCount > 0 && simplifiedPointCount < 8) {
    warnings.push("warn_low_detail");
    if (confidence === "good") confidence = "low";
  }

  // Extraction info tags
  if (bgRemoved) {
    warnings.push("info_bg_removed");
  }
  if (extractionMode === "corner_flood" || extractionMode === "edge_gradient") {
    warnings.push("info_foreground_mask");
  }

  // ── Human-readable suggestion ──
  const suggestion = generateSuggestion(
    confidence, shapeType, extractionMode, extractionMeta
  );

  return {
    confidence,
    shapeType,
    warnings,
    suggestion,
    contourBounds,
    imageBounds,
    areaCoverage: Math.round(areaCoverage * 100),
    rectangularity: Math.round(rectangularity * 100),
    pointCount: contourPoints.length,
    extractionMode,
    extractionMeta,
  };
}

/**
 * Generate a human-readable i18n key for the result suggestion.
 */
function generateSuggestion(confidence, shapeType, extractionMode, extractionMeta) {
  if (confidence === "good") {
    if (extractionMode === "alpha") return "suggestion_alpha_good";
    if (extractionMode === "corner_flood") return "suggestion_flood_good";
    if (extractionMode === "edge_gradient") return "suggestion_edge_good";
    if (extractionMode === "bg_removal") return "suggestion_bgremoval_good";
    return "suggestion_generic_good";
  }

  if (confidence === "rectangular") {
    if (extractionMode === "alpha") return "suggestion_rectangular_alpha";
    return "suggestion_rectangular";
  }

  // Low confidence
  if (extractionMeta?.maskCoverage > 0.9) return "suggestion_complex_bg";
  if (extractionMeta?.componentCount > 3) return "suggestion_multiple_subjects";
  return "suggestion_low_generic";
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
 */
function detectAlphaChannel(data, w, h) {
  const total = w * h;
  let transparentCount = 0;
  const sampleStep = Math.max(1, Math.floor(total / 5000));

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

function yieldToMain() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}
