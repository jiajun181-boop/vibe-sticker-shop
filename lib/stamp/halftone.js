// lib/stamp/halftone.js — Convert image to rubber-stamp halftone effect

/**
 * Apply halftone (dither) effect to an image, producing a stamp-like result.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} source
 * @param {object} opts
 * @param {"light"|"medium"|"heavy"} opts.intensity
 * @param {string} opts.color — ink hex color
 * @param {boolean} opts.circular — apply circular mask
 * @returns {HTMLCanvasElement} processed canvas
 */
export function applyHalftone(source, { intensity = "medium", color = "#111111", circular = false } = {}) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Draw source scaled to fit
  const sw = source.width || source.naturalWidth || size;
  const sh = source.height || source.naturalHeight || size;
  const scale = Math.min(size / sw, size / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(source, (size - dw) / 2, (size - dh) / 2, dw, dh);

  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;

  // 1. Grayscale
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = gray;
  }

  // 2. Contrast boost
  const contrastMap = { light: 1.2, medium: 1.5, heavy: 2.0 };
  const contrast = contrastMap[intensity] || 1.5;
  for (let i = 0; i < d.length; i += 4) {
    let v = ((d[i] / 255 - 0.5) * contrast + 0.5) * 255;
    d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, v));
  }

  // 3. Floyd-Steinberg dithering
  const w = size, h = size;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) gray[i] = d[i * 4];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const old = gray[idx];
      const nv = old < 128 ? 0 : 255;
      gray[idx] = nv;
      const err = old - nv;
      if (x + 1 < w) gray[idx + 1] += err * 7 / 16;
      if (y + 1 < h) {
        if (x > 0) gray[(y + 1) * w + x - 1] += err * 3 / 16;
        gray[(y + 1) * w + x] += err * 5 / 16;
        if (x + 1 < w) gray[(y + 1) * w + x + 1] += err * 1 / 16;
      }
    }
  }

  // 4. Dark → ink color, white → transparent
  const [cr, cg, cb] = hexToRgb(color);
  const cxC = size / 2, cyC = size / 2, maxR = size / 2;

  for (let i = 0; i < gray.length; i++) {
    const pi = i * 4;
    if (circular) {
      const px = i % w, py = Math.floor(i / w);
      if (Math.sqrt((px - cxC) ** 2 + (py - cyC) ** 2) > maxR) {
        d[pi] = d[pi + 1] = d[pi + 2] = 255;
        d[pi + 3] = 0;
        continue;
      }
    }
    if (gray[i] < 128) {
      d[pi] = cr; d[pi + 1] = cg; d[pi + 2] = cb; d[pi + 3] = 255;
    } else {
      d[pi] = d[pi + 1] = d[pi + 2] = 255; d[pi + 3] = 0;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
