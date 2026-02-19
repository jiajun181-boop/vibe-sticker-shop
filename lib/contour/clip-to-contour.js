/**
 * Clip a sticker image to its die-cut contour shape.
 * Returns a canvas with the artwork clipped + a thin white vinyl border.
 */

/**
 * Create a canvas with the sticker clipped to its contour shape.
 * @param {string} imageUrl – artwork URL
 * @param {Array<{x:number,y:number}>} contourPoints – contour polygon at image scale
 * @param {object} [opts]
 * @param {number} [opts.borderPx=4] – white vinyl border width in pixels
 * @param {number} [opts.maxSize=600] – max output dimension
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function clipImageToContour(imageUrl, contourPoints, opts = {}) {
  const { borderPx = 4, maxSize = 600 } = opts;

  const img = await loadImage(imageUrl);

  // Calculate bounding box of contour
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of contourPoints) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const cw = maxX - minX;
  const ch = maxY - minY;
  const padding = borderPx + 2;

  // Scale to fit maxSize
  const scale = Math.min(1, maxSize / (cw + padding * 2), maxSize / (ch + padding * 2));
  const outW = Math.ceil((cw + padding * 2) * scale);
  const outH = Math.ceil((ch + padding * 2) * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");

  // Translate so contour bounding box starts at (padding, padding)
  const offX = -minX * scale + padding * scale;
  const offY = -minY * scale + padding * scale;

  // 1. Draw white border (slightly expanded contour)
  ctx.save();
  ctx.beginPath();
  const borderScale = 1 + (borderPx * 2) / Math.max(cw, ch);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (let i = 0; i < contourPoints.length; i++) {
    const p = contourPoints[i];
    const bx = cx + (p.x - cx) * borderScale;
    const by = cy + (p.y - cy) * borderScale;
    const sx = bx * scale + offX;
    const sy = by * scale + offY;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  // 2. Clip and draw the artwork
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < contourPoints.length; i++) {
    const p = contourPoints[i];
    const sx = p.x * scale + offX;
    const sy = p.y * scale + offY;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.clip();

  // Draw the full image, scaled
  ctx.drawImage(
    img,
    0, 0, img.width, img.height,
    offX, offY, img.width * scale, img.height * scale,
  );
  ctx.restore();

  return canvas;
}

/** Load an image as an HTMLImageElement. */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}
