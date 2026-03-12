/**
 * Foreground mask extraction for opaque images (no alpha channel).
 *
 * Used when the uploaded image is a regular JPG/PNG without transparency.
 * Detects background via corner/edge sampling, then flood-fills from image
 * borders — stopping at strong gradient edges — to separate background
 * from the sticker subject.
 *
 * Handles:
 *  A. Sticker product photos on solid-color backgrounds
 *  B. White-border sticker mockups on white/light backgrounds
 *  C. Simple product shots on clean backgrounds
 */

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract foreground mask from opaque image data.
 *
 * @param {ImageData} imageData – canvas ImageData (RGBA)
 * @param {number} w – width in pixels
 * @param {number} h – height in pixels
 * @returns {Promise<{ mask: Uint8Array, mode: string, meta: object }>}
 *   mask: 255 = foreground, 0 = background
 *   mode: "corner_flood" | "edge_gradient"
 *   meta: { bgColor, bgUniformity, maskCoverage, componentCount, ... }
 */
export async function extractForegroundMask(imageData, w, h) {
  const data = imageData.data;

  // 1. Analyse background from corners + edge midpoints
  const bgInfo = analyzeBackground(data, w, h);
  await yieldToMain();

  // 2. Compute Sobel gradient magnitude (edge map)
  const gradient = sobelGradient(data, w, h);
  await yieldToMain();

  // 3. Choose strategy based on background uniformity
  let rawMask;
  let mode;

  if (bgInfo.uniformity > 0.6) {
    // Uniform background → edge-aware flood fill from borders
    rawMask = edgeAwareFloodFill(data, w, h, bgInfo.color, bgInfo.tolerance, gradient);
    mode = "corner_flood";
  } else {
    // Non-uniform background → gradient-based segmentation
    rawMask = gradientBasedMask(gradient, w, h);
    mode = "edge_gradient";
  }
  await yieldToMain();

  // 4. Post-process: largest component + morph closing + hole filling
  const { cleaned, componentCount, largestArea } = await cleanupMask(rawMask, w, h);
  await yieldToMain();

  // 5. Compute coverage stats
  let fgCount = 0;
  for (let i = 0; i < w * h; i++) {
    if (cleaned[i] > 0) fgCount++;
  }
  const maskCoverage = fgCount / (w * h);

  return {
    mask: cleaned,
    mode,
    meta: {
      bgColor: bgInfo.color,
      bgUniformity: Math.round(bgInfo.uniformity * 100) / 100,
      maskCoverage: Math.round(maskCoverage * 1000) / 1000,
      componentCount,
      selectedComponentArea: largestArea,
      isLightBg: bgInfo.isLight,
    },
  };
}

/**
 * Create a visualization of the detected mask overlaid on the source image.
 * Foreground = full opacity, background = dimmed with green border highlight.
 *
 * @param {ImageData} imageData – original image
 * @param {Uint8Array} mask – foreground mask (255=fg, 0=bg)
 * @param {number} w
 * @param {number} h
 * @returns {string} data URL of the overlay PNG
 */
export function createMaskOverlay(imageData, mask, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const overlay = ctx.createImageData(w, h);
  const src = imageData.data;
  const od = overlay.data;

  for (let i = 0; i < w * h; i++) {
    const isFg = mask[i] > 0;
    const pi = i * 4;
    od[pi] = src[pi];
    od[pi + 1] = src[pi + 1];
    od[pi + 2] = src[pi + 2];
    od[pi + 3] = isFg ? 255 : 60;
  }

  // Draw green border directly into pixel data (avoids expensive per-pixel fillRect)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (mask[idx] === 0) continue;
      const hasBackgroundNeighbor =
        x === 0 || x === w - 1 || y === 0 || y === h - 1 ||
        mask[idx - 1] === 0 ||
        mask[idx + 1] === 0 ||
        mask[idx - w] === 0 ||
        mask[idx + w] === 0;
      if (hasBackgroundNeighbor) {
        const pi = idx * 4;
        // Blend green (0, 200, 0) at 60% opacity over the existing pixel
        od[pi] = Math.round(od[pi] * 0.4 + 0 * 0.6);
        od[pi + 1] = Math.round(od[pi + 1] * 0.4 + 200 * 0.6);
        od[pi + 2] = Math.round(od[pi + 2] * 0.4 + 0 * 0.6);
        od[pi + 3] = 255;
      }
    }
  }

  ctx.putImageData(overlay, 0, 0);
  return canvas.toDataURL("image/png");
}

// ── Background Analysis ──────────────────────────────────────────────────────

function analyzeBackground(data, w, h) {
  const blockSize = Math.max(4, Math.min(16, Math.floor(Math.min(w, h) * 0.05)));

  // Sample 4 corners + 4 edge midpoints = 8 sample blocks
  const samples = [
    sampleBlock(data, w, h, 0, 0, blockSize),
    sampleBlock(data, w, h, w - blockSize, 0, blockSize),
    sampleBlock(data, w, h, 0, h - blockSize, blockSize),
    sampleBlock(data, w, h, w - blockSize, h - blockSize, blockSize),
    sampleBlock(data, w, h, Math.floor(w / 2 - blockSize / 2), 0, blockSize),
    sampleBlock(data, w, h, Math.floor(w / 2 - blockSize / 2), h - blockSize, blockSize),
    sampleBlock(data, w, h, 0, Math.floor(h / 2 - blockSize / 2), blockSize),
    sampleBlock(data, w, h, w - blockSize, Math.floor(h / 2 - blockSize / 2), blockSize),
  ];

  const means = samples.map((s) => s.mean);
  const overallR = avg(means.map((m) => m.r));
  const overallG = avg(means.map((m) => m.g));
  const overallB = avg(means.map((m) => m.b));

  // Uniformity: how similar are the 8 sample means to each other?
  const distances = means.map((m) =>
    colorDist(m.r, m.g, m.b, overallR, overallG, overallB)
  );
  const maxDist = Math.max(...distances);
  // 0–1 scale: 1 = perfectly uniform, 0 = very different corners
  const uniformity = 1 - Math.min(1, maxDist / 80);

  const brightness = (overallR + overallG + overallB) / 3;

  return {
    color: {
      r: Math.round(overallR),
      g: Math.round(overallG),
      b: Math.round(overallB),
    },
    uniformity,
    isLight: brightness > 180,
    // Adaptive tolerance: tighter for very uniform bg, wider for noisier
    tolerance: Math.max(20, Math.min(65, 25 + maxDist * 0.6)),
  };
}

function sampleBlock(data, w, h, startX, startY, size) {
  let sumR = 0, sumG = 0, sumB = 0;
  let count = 0;

  for (let dy = 0; dy < size && startY + dy < h; dy++) {
    for (let dx = 0; dx < size && startX + dx < w; dx++) {
      const idx = ((startY + dy) * w + (startX + dx)) * 4;
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
      count++;
    }
  }

  return {
    mean: { r: sumR / count, g: sumG / count, b: sumB / count },
  };
}

// ── Sobel Edge Detection ─────────────────────────────────────────────────────

function sobelGradient(data, w, h) {
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  const mag = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)] +
        -2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)] +
        -gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)];
      const gy =
        -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)] +
         gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];
      mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return mag;
}

// ── Edge-Aware Flood Fill ────────────────────────────────────────────────────

/**
 * Flood fill from image borders, marking background pixels.
 * Stops at strong gradient edges — this preserves sticker boundaries even
 * when the border color matches the background (e.g. white-on-white).
 *
 * Returns Uint8Array: 255 = foreground, 0 = background.
 */
function edgeAwareFloodFill(data, w, h, bgColor, tolerance, gradient) {
  const edgeThreshold = computeEdgeThreshold(gradient, w, h);

  const BG = 1;
  const BLOCKED = 2;
  const state = new Uint8Array(w * h); // 0 = unvisited
  const stack = [];

  function tryPush(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = y * w + x;
    if (state[idx] !== 0) return;

    // Strong edge → block flood fill (acts as barrier)
    if (gradient[idx] > edgeThreshold) {
      state[idx] = BLOCKED;
      return;
    }

    const pi = idx * 4;
    const dist = colorDist(data[pi], data[pi + 1], data[pi + 2], bgColor.r, bgColor.g, bgColor.b);
    if (dist <= tolerance) {
      state[idx] = BG;
      stack.push(idx);
    } else {
      state[idx] = BLOCKED;
    }
  }

  // Seed from all image border pixels
  for (let x = 0; x < w; x++) { tryPush(x, 0); tryPush(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { tryPush(0, y); tryPush(w - 1, y); }

  // DFS flood fill
  while (stack.length > 0) {
    const idx = stack.pop();
    const x = idx % w;
    const y = (idx - x) / w;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }

  // Invert: BG → 0, everything else → 255 (foreground)
  const result = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    result[i] = state[i] === BG ? 0 : 255;
  }
  return result;
}

/**
 * Adaptive edge threshold: use a percentile of the gradient distribution.
 * Higher percentile → fewer edges block the fill → more aggressive background removal.
 */
function computeEdgeThreshold(gradient, w, h) {
  const p80 = approxGradientPercentile(gradient, w * h, 0.8);
  if (!p80) return 50;
  return Math.max(12, Math.min(120, p80 * 0.6));
}

// ── Gradient-Based Segmentation (fallback for non-uniform backgrounds) ───────

function gradientBasedMask(gradient, w, h) {
  // Threshold gradient to binary edge map, then flood fill from borders
  // treating edge pixels as barriers. Enclosed regions = foreground.
  const threshold = approxGradientPercentile(gradient, w * h, 0.7) || 30;

  // Flood fill from image border, edge pixels block
  const EDGE = 2;
  const BG = 1;
  const state = new Uint8Array(w * h);
  const stack = [];

  for (let i = 0; i < w * h; i++) {
    if (gradient[i] >= threshold) state[i] = EDGE;
  }

  // Seed non-edge border pixels
  function trySeed(idx) {
    if (state[idx] === 0) { state[idx] = BG; stack.push(idx); }
  }
  for (let x = 0; x < w; x++) { trySeed(x); trySeed((h - 1) * w + x); }
  for (let y = 1; y < h - 1; y++) { trySeed(y * w); trySeed(y * w + w - 1); }

  while (stack.length > 0) {
    const idx = stack.pop();
    const x = idx % w;
    for (const ni of [idx - 1, idx + 1, idx - w, idx + w]) {
      if (ni < 0 || ni >= w * h) continue;
      const nx = ni % w;
      if (Math.abs(nx - x) > 1) continue; // row wrap guard
      if (state[ni] === 0) { state[ni] = BG; stack.push(ni); }
    }
  }

  // Everything not BG and not EDGE = foreground; include edge pixels touching foreground
  const result = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    result[i] = state[i] === BG ? 0 : 255;
  }
  return result;
}

// ── Mask Cleanup ─────────────────────────────────────────────────────────────

async function cleanupMask(mask, w, h) {
  // 1. Find connected components
  const { labels, count } = labelComponents(mask, w, h);

  // 2. Measure each component
  const sizes = new Uint32Array(count + 1);
  for (let i = 0; i < w * h; i++) {
    if (labels[i] > 0) sizes[labels[i]]++;
  }

  // 3. Keep only the largest component
  let maxLabel = 0, maxSize = 0;
  for (let i = 1; i <= count; i++) {
    if (sizes[i] > maxSize) { maxSize = sizes[i]; maxLabel = i; }
  }

  const single = new Uint8Array(w * h);
  if (maxLabel > 0) {
    for (let i = 0; i < w * h; i++) {
      single[i] = labels[i] === maxLabel ? 255 : 0;
    }
  }

  await yieldToMain();

  // 4. Morphological closing (dilate then erode) to smooth edges
  const closeRadius = w * h > 140000 ? 1 : 2;
  const closed = morphClose(single, w, h, closeRadius);

  await yieldToMain();

  // 5. Fill interior holes (background regions not reachable from image border)
  const filled = fillInteriorHoles(closed, w, h);

  return { cleaned: filled, componentCount: count, largestArea: maxSize };
}

function labelComponents(mask, w, h) {
  const labels = new Int32Array(w * h);
  let currentLabel = 0;

  for (let i = 0; i < w * h; i++) {
    if (mask[i] === 0 || labels[i] !== 0) continue;

    currentLabel++;
    const stack = [i];
    labels[i] = currentLabel;

    while (stack.length > 0) {
      const ci = stack.pop();
      const cx = ci % w, cy = (ci - cx) / w;
      for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const ni = ny * w + nx;
        if (mask[ni] > 0 && labels[ni] === 0) {
          labels[ni] = currentLabel;
          stack.push(ni);
        }
      }
    }
  }

  return { labels, count: currentLabel };
}

function fillInteriorHoles(mask, w, h) {
  // Background flood fill from image border — anything not reached is an interior hole
  const reachable = new Uint8Array(w * h);
  const stack = [];

  function trySeed(idx) {
    if (mask[idx] === 0 && !reachable[idx]) { reachable[idx] = 1; stack.push(idx); }
  }

  for (let x = 0; x < w; x++) { trySeed(x); trySeed((h - 1) * w + x); }
  for (let y = 1; y < h - 1; y++) { trySeed(y * w); trySeed(y * w + w - 1); }

  while (stack.length > 0) {
    const idx = stack.pop();
    const x = idx % w, y = (idx - x) / w;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = ny * w + nx;
      if (mask[ni] === 0 && !reachable[ni]) { reachable[ni] = 1; stack.push(ni); }
    }
  }

  // Fill holes: any bg pixel not reachable from border = interior hole → make foreground
  const result = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    result[i] = (mask[i] > 0 || !reachable[i]) ? 255 : 0;
  }
  return result;
}

// ── Morphological Operations ─────────────────────────────────────────────────

function morphDilate(mask, w, h, radius) {
  const result = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let found = false;
      outer: for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w && mask[ny * w + nx] > 0) {
            found = true;
            break outer;
          }
        }
      }
      result[y * w + x] = found ? 255 : 0;
    }
  }
  return result;
}

function morphErode(mask, w, h, radius) {
  const result = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let allSet = true;
      outer: for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny < 0 || ny >= h || nx < 0 || nx >= w || mask[ny * w + nx] === 0) {
            allSet = false;
            break outer;
          }
        }
      }
      result[y * w + x] = allSet ? 255 : 0;
    }
  }
  return result;
}

function morphClose(mask, w, h, radius) {
  return morphErode(morphDilate(mask, w, h, radius), w, h, radius);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function colorDist(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function approxGradientPercentile(gradient, totalPixels, percentile) {
  const step = Math.max(1, Math.floor(totalPixels / 4096));
  const samples = [];

  for (let i = 0; i < totalPixels; i += step) {
    const value = gradient[i];
    if (value > 2) samples.push(value);
  }

  if (samples.length === 0) return 0;
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length * percentile)];
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
