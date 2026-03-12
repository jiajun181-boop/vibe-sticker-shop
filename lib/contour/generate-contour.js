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

/**
 * Hard safety limits — prevent browser OOM / tab hangs on oversized artwork.
 *
 * MAX_INPUT_MEGAPIXELS  – reject files above this before any processing.
 *                         100 MP ≈ 10000×10000 — covers any sane print file.
 * MAX_CANVAS_PIXELS     – absolute ceiling for the processing canvas after
 *                         downsampling. Prevents accidental huge allocations.
 * MAX_BGREMOVAL_MPIX    – ML background-removal budget. The @imgly model
 *                         allocates ~4× the pixel count in GPU/WASM memory.
 *                         0.5 MP ≈ 700×700 keeps it under ~200 MB.
 */
export const SAFETY_LIMITS = {
  MAX_INPUT_MEGAPIXELS: 100,
  MAX_CANVAS_PIXELS: 512 * 512,       // 262 144 px — matches maxProcessingDim
  MAX_BGREMOVAL_MPIX: 0.5,            // 0.5 MP ≈ 512×512 downsampled
};

const DEFAULT_OPTS = {
  bleedMm: 3,
  smoothIterations: 2,
  simplifyEpsilon: 1.5,
  alphaThreshold: 128,
  maxProcessingDim: 512,
  dpi: 72,
  skipBgRemoval: false,
};

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

  // 1b. Hard safety guard — reject before allocating any canvas memory.
  //     Uses the exported checkImageSafety() contract so tests and pipeline agree.
  const safetyCheck = checkImageSafety(origW, origH);
  if (!safetyCheck.safe) {
    throw new Error(
      `${safetyCheck.reason} Resize the artwork before processing.`
    );
  }

  // Track all safety decisions for downstream persistence
  const safetyDecisions = {
    inputMegapixels: safetyCheck.megapixels,
    inputDimensions: { width: origW, height: origH },
    processingMegapixels: 0,      // filled after downsample
    processingDimensions: null,    // filled after downsample
    canvasLimitApplied: false,     // true if MAX_CANVAS_PIXELS forced extra downscale
    bgRemovalEligible: false,     // filled during extraction
    bgRemovalSkippedReason: null,  // filled if bg removal skipped
    degradedMode: false,           // true if any safety limit forced a cheaper path
  };

  // 2. Downsample for processing.
  //    maxProcessingDim controls the longest edge. MAX_CANVAS_PIXELS is the absolute
  //    pixel budget — if maxProcessingDim would exceed it, we clamp further.
  let effectiveMaxDim = cfg.maxProcessingDim;
  const naiveScale = Math.min(1, effectiveMaxDim / Math.max(origW, origH));
  const naiveW = Math.round(origW * naiveScale);
  const naiveH = Math.round(origH * naiveScale);
  if (naiveW * naiveH > SAFETY_LIMITS.MAX_CANVAS_PIXELS) {
    // Canvas would exceed pixel budget — compute a tighter maxDim
    const aspect = origW / origH;
    // Solve: w*h = MAX_CANVAS_PIXELS where w/h = aspect → w = sqrt(MAX*aspect)
    effectiveMaxDim = Math.floor(Math.sqrt(SAFETY_LIMITS.MAX_CANVAS_PIXELS * Math.max(aspect, 1 / aspect)));
    safetyDecisions.canvasLimitApplied = true;
    safetyDecisions.degradedMode = true;
  }

  const scale = Math.min(1, effectiveMaxDim / Math.max(origW, origH));
  const procW = Math.round(origW * scale);
  const procH = Math.round(origH * scale);

  safetyDecisions.processingMegapixels = (procW * procH) / 1_000_000;
  safetyDecisions.processingDimensions = { width: procW, height: procH };

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
    // Alpha path = no extraction needed, bg removal not applicable
    safetyDecisions.bgRemovalSkippedReason = "not_needed_has_alpha";
  } else {
    // ── Path B/C: No alpha → try foreground mask extraction (fast) ──
    progress("analyzing");

    const { extractForegroundMask, createMaskOverlay } = await import("./foreground-mask");
    const fgResult = extractForegroundMask(imageData, procW, procH);
    extractionMeta = fgResult.meta;

    // Evaluate mask quality: usable if coverage is between 2% and 95%
    const maskUsable = fgResult.meta.maskCoverage > 0.02 && fgResult.meta.maskCoverage < 0.95;

    if (maskUsable) {
      // Good foreground mask — apply it as the alpha channel
      extractionMode = fgResult.mode;
      safetyDecisions.bgRemovalSkippedReason = "not_needed_mask_usable";

      // Save original imageData for overlay before modifying alpha
      maskOverlayUrl = createMaskOverlay(imageData, fgResult.mask, procW, procH);

      // Inject mask into alpha channel
      for (let i = 0; i < procW * procH; i++) {
        imageData.data[i * 4 + 3] = fgResult.mask[i];
      }
      ctx.putImageData(imageData, 0, 0);
      processedImageUrl = await canvasToObjectUrl(canvas);

    } else {
      // Mask coverage too high/low — check ML background removal eligibility.
      // Uses the exported checkBgRemovalEligibility() contract so tests and pipeline agree.
      const bgEligibility = checkBgRemovalEligibility(procW, procH, { skipBgRemoval: cfg.skipBgRemoval });
      safetyDecisions.bgRemovalEligible = bgEligibility.eligible;
      if (!bgEligibility.eligible) {
        safetyDecisions.bgRemovalSkippedReason = bgEligibility.reason;
        if (bgEligibility.reason !== "skipped_by_config") {
          safetyDecisions.degradedMode = true;
        }
      }

      if (bgEligibility.eligible) {
        // Within ML budget — attempt background removal
        progress("removing-bg");
        try {
          const { removeBackground } = await import("@imgly/background-removal");
          const scaledBlob = await canvasToBlob(canvas, "image/png");
          const blob = await removeBackground(scaledBlob, {
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
          safetyDecisions.bgRemovalSkippedReason = "ml_runtime_error";
          // Fall back to foreground mask even with borderline coverage
          if (fgResult.meta.maskCoverage > 0.01) {
            extractionMode = fgResult.mode;
            maskOverlayUrl = createMaskOverlay(
              ctx.getImageData(0, 0, procW, procH),
              fgResult.mask,
              procW,
              procH
            );
            for (let i = 0; i < procW * procH; i++) {
              imageData.data[i * 4 + 3] = fgResult.mask[i];
            }
            ctx.putImageData(imageData, 0, 0);
            processedImageUrl = await canvasToObjectUrl(canvas);
          }
        }
      } else {
        // Ineligible for ML — use foreground mask if any usable coverage
        console.info(`Skipping ML bg removal: ${bgEligibility.reason}`);
        if (fgResult.meta.maskCoverage > 0.01 && fgResult.meta.maskCoverage < 0.98) {
          extractionMode = fgResult.mode;
          maskOverlayUrl = createMaskOverlay(imageData, fgResult.mask, procW, procH);
          for (let i = 0; i < procW * procH; i++) {
            imageData.data[i * 4 + 3] = fgResult.mask[i];
          }
          ctx.putImageData(imageData, 0, 0);
          processedImageUrl = await canvasToObjectUrl(canvas);
        } else {
          console.info("Foreground mask not usable and ML bg removal ineligible");
        }
      }
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
    safetyDecisions,
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

// ── Safety checks (exported for testing) ──

/**
 * Check whether an image is within safe processing limits.
 *
 * @param {number} width  — original image width in pixels
 * @param {number} height — original image height in pixels
 * @returns {{ safe: boolean, megapixels: number, reason?: string }}
 */
export function checkImageSafety(width, height) {
  const mpix = (width * height) / 1_000_000;
  if (mpix > SAFETY_LIMITS.MAX_INPUT_MEGAPIXELS) {
    return {
      safe: false,
      megapixels: mpix,
      reason:
        `Image too large (${Math.round(mpix)} MP, ${width}×${height}). ` +
        `Maximum is ${SAFETY_LIMITS.MAX_INPUT_MEGAPIXELS} MP.`,
    };
  }
  return { safe: true, megapixels: mpix };
}

/**
 * Determine whether ML background removal should be attempted,
 * given the downsampled processing canvas dimensions.
 *
 * @param {number} procW — processing canvas width
 * @param {number} procH — processing canvas height
 * @param {{ skipBgRemoval?: boolean }} [opts]
 * @returns {{ eligible: boolean, procMpix: number, reason?: string }}
 */
export function checkBgRemovalEligibility(procW, procH, opts = {}) {
  if (opts.skipBgRemoval) {
    return { eligible: false, procMpix: (procW * procH) / 1_000_000, reason: "skipped_by_config" };
  }
  const procMpix = (procW * procH) / 1_000_000;
  if (procMpix > SAFETY_LIMITS.MAX_BGREMOVAL_MPIX) {
    return {
      eligible: false,
      procMpix,
      reason: `Processing canvas ${procMpix.toFixed(2)} MP exceeds ${SAFETY_LIMITS.MAX_BGREMOVAL_MPIX} MP budget`,
    };
  }
  return { eligible: true, procMpix };
}

/**
 * Compute safe processing dimensions given original image size and config.
 *
 * Applies both maxProcessingDim (longest-edge cap) and MAX_CANVAS_PIXELS
 * (total pixel budget). Returns the effective dimensions and whether
 * the canvas limit forced additional downscaling.
 *
 * @param {number} origW  — original image width
 * @param {number} origH  — original image height
 * @param {number} [maxProcessingDim=512] — longest-edge cap from config
 * @returns {{ procW: number, procH: number, scale: number, canvasLimitApplied: boolean }}
 */
export function computeProcessingDimensions(origW, origH, maxProcessingDim = 512) {
  let effectiveMaxDim = maxProcessingDim;
  let canvasLimitApplied = false;

  const naiveScale = Math.min(1, effectiveMaxDim / Math.max(origW, origH));
  const naiveW = Math.round(origW * naiveScale);
  const naiveH = Math.round(origH * naiveScale);

  if (naiveW * naiveH > SAFETY_LIMITS.MAX_CANVAS_PIXELS) {
    const aspect = origW / origH;
    effectiveMaxDim = Math.floor(Math.sqrt(SAFETY_LIMITS.MAX_CANVAS_PIXELS * Math.max(aspect, 1 / aspect)));
    canvasLimitApplied = true;
  }

  const scale = Math.min(1, effectiveMaxDim / Math.max(origW, origH));
  const procW = Math.round(origW * scale);
  const procH = Math.round(origH * scale);

  return { procW, procH, scale, canvasLimitApplied };
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

function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode canvas image"));
    }, type, quality);
  });
}

async function canvasToObjectUrl(canvas, type = "image/png", quality) {
  const blob = await canvasToBlob(canvas, type, quality);
  return URL.createObjectURL(blob);
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
