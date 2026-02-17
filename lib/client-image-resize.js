/**
 * Client-side image resize before upload.
 * Shrinks images larger than maxDim to save bandwidth & storage.
 * SVGs are passed through unchanged.
 */

const MAX_DIM = 2000;
const QUALITY = 0.85;

/**
 * @param {File} file
 * @param {object} [opts]
 * @param {number} [opts.maxDim=2000]
 * @param {number} [opts.quality=0.85]
 * @returns {Promise<File>} — resized file (or original if no resize needed)
 */
export async function resizeImageFile(file, opts = {}) {
  const maxDim = opts.maxDim || MAX_DIM;
  const quality = opts.quality || QUALITY;

  // Don't touch SVGs or small files (<100KB)
  if (file.type === "image/svg+xml" || file.size < 100 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;

      // No resize needed
      if (width <= maxDim && height <= maxDim) {
        resolve(file);
        return;
      }

      // Calculate new dimensions
      const ratio = Math.min(maxDim / width, maxDim / height);
      const newW = Math.round(width * ratio);
      const newH = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, newW, newH);

      // Output as WebP if supported, else JPEG
      const outType = "image/webp";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // Keep original name but change extension
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const ext = outType === "image/webp" ? "webp" : "jpg";
          const resized = new File([blob], `${baseName}.${ext}`, { type: outType });
          resolve(resized);
        },
        outType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };

    img.src = url;
  });
}

/**
 * Resize multiple files in parallel.
 * @param {File[]} files
 * @param {object} [opts]
 * @returns {Promise<File[]>}
 */
export async function resizeImageFiles(files, opts = {}) {
  return Promise.all(files.map((f) => resizeImageFile(f, opts)));
}
