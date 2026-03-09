/**
 * White ink layer generation utilities.
 * Runs client-side on canvas — used by sticker/label order pages
 * when transparent materials (clear-vinyl, frosted, holographic, etc.) are selected.
 *
 * Three modes:
 *  - auto:   solid white mask wherever artwork has visible pixels (alpha > threshold)
 *  - follow: white density matches the artwork's alpha channel (anti-aliased edges)
 *  - upload: customer provides their own white layer (no generation needed)
 */

/**
 * Generate an automatic white ink layer.
 * Binary mask: solid white wherever artwork alpha > threshold, transparent elsewhere.
 * @param {string} imageUrl
 * @param {number} [threshold=10] alpha threshold 0-255
 * @returns {Promise<{dataUrl: string, blob: Blob, width: number, height: number}>}
 */
export async function generateAutoWhite(imageUrl, threshold = 10) {
  const img = await loadImage(imageUrl);
  const { naturalWidth: width, naturalHeight: height } = img;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, width, height);
  const out = ctx.createImageData(width, height);

  for (let i = 0; i < src.data.length; i += 4) {
    if (src.data[i + 3] > threshold) {
      out.data[i] = 255;
      out.data[i + 1] = 255;
      out.data[i + 2] = 255;
      out.data[i + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await canvasToBlob(canvas);
  return { dataUrl, blob, width, height };
}

/**
 * Generate a "follow color" white ink layer.
 * White everywhere, but alpha matches the original artwork's alpha.
 * Preserves anti-aliased edges for smoother print results.
 * @param {string} imageUrl
 * @returns {Promise<{dataUrl: string, blob: Blob, width: number, height: number}>}
 */
export async function generateFollowColor(imageUrl) {
  const img = await loadImage(imageUrl);
  const { naturalWidth: width, naturalHeight: height } = img;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, width, height);
  const out = ctx.createImageData(width, height);

  for (let i = 0; i < src.data.length; i += 4) {
    out.data[i] = 255;
    out.data[i + 1] = 255;
    out.data[i + 2] = 255;
    out.data[i + 3] = src.data[i + 3]; // alpha matches original
  }

  ctx.putImageData(out, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await canvasToBlob(canvas);
  return { dataUrl, blob, width, height };
}

/** @param {string} url */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/** @param {HTMLCanvasElement} canvas */
function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
