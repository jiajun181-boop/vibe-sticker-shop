// lib/stamp/halftone.js — Client-side halftone/stipple effect for stamp images

/**
 * Convert an image to a rubber-stamp-style halftone/stipple effect.
 *
 * Pipeline:
 * 1. Draw image onto offscreen canvas at target size
 * 2. Convert to grayscale
 * 3. Apply contrast enhancement
 * 4. Floyd-Steinberg dithering at chosen intensity
 * 5. Map: white → transparent, dark → ink color
 * 6. Optional circular mask for round stamps
 *
 * @param {HTMLImageElement|ImageBitmap} img — source image
 * @param {object} opts
 * @param {"light"|"medium"|"heavy"} opts.intensity — stipple density
 * @param {[number,number,number]} opts.inkRgb — ink color as [r,g,b]
 * @param {number} opts.size — output size in px (square)
 * @param {boolean} opts.circularMask — apply circular clip
 * @returns {ImageData} — processed halftone image data
 */
export function applyHalftone(img, opts) {
  const { intensity = "medium", inkRgb = [17, 17, 17], size = 300, circularMask = false } = opts;

  // 1. Draw to offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Fit image into square
  const scale = Math.min(size / img.width, size / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const sx = (size - sw) / 2;
  const sy = (size - sh) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, sw, sh);

  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;

  // 2. Grayscale
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = gray;
  }

  // 3. Contrast enhancement — stretch to full range
  let min = 255, max = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // skip transparent
    if (d[i] < min) min = d[i];
    if (d[i] > max) max = d[i];
  }
  const range = max - min || 1;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const v = Math.round(((d[i] - min) / range) * 255);
    d[i] = d[i + 1] = d[i + 2] = v;
  }

  // 4. Floyd-Steinberg dithering
  const thresholds = { light: 180, medium: 128, heavy: 80 };
  const threshold = thresholds[intensity] ?? 128;
  const gray = new Float32Array(size * size);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = d[i * 4];
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const old = gray[idx];
      const newVal = old > threshold ? 255 : 0;
      gray[idx] = newVal;
      const err = old - newVal;

      if (x + 1 < size) gray[idx + 1] += err * 7 / 16;
      if (y + 1 < size && x > 0) gray[idx + size - 1] += err * 3 / 16;
      if (y + 1 < size) gray[idx + size] += err * 5 / 16;
      if (y + 1 < size && x + 1 < size) gray[idx + size + 1] += err * 1 / 16;
    }
  }

  // 5. Map to ink color: dark → ink, white → transparent
  const [r, g, b] = inkRgb;
  for (let i = 0; i < gray.length; i++) {
    const pi = i * 4;
    if (gray[i] > 128) {
      // White → transparent
      d[pi] = 255; d[pi + 1] = 255; d[pi + 2] = 255; d[pi + 3] = 0;
    } else {
      // Dark → ink color
      d[pi] = r; d[pi + 1] = g; d[pi + 2] = b; d[pi + 3] = 255;
    }
  }

  // 6. Circular mask
  if (circularMask) {
    const centerX = size / 2;
    const centerY = size / 2;
    const maskRadius = size / 2 - 2;
    for (let i = 0; i < gray.length; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist > maskRadius) {
        d[i * 4 + 3] = 0; // make transparent
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return imgData;
}

/**
 * Helper: convert hex color to [r,g,b] array.
 */
export function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Generate a halftone preview as a data URL.
 * @param {HTMLImageElement|ImageBitmap} img
 * @param {object} opts — same as applyHalftone
 * @returns {string} — data:image/png base64
 */
export function halftoneToDataURL(img, opts) {
  const size = opts.size || 300;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const imgData = applyHalftone(img, opts);
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}
