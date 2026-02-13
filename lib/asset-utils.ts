/**
 * Asset utility functions for image metadata extraction and validation.
 * No external dependencies (no Sharp) — uses raw buffer parsing.
 */

// ── Allowed MIME types ──
export const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

// ── Validation limits ──
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MIN_DIMENSION = 200;
export const MAX_DIMENSION = 10000;

export interface ImageMeta {
  widthPx: number;
  heightPx: number;
  hasAlpha: boolean;
}

/**
 * Extract image dimensions from a buffer without external dependencies.
 * Supports JPEG, PNG, WebP, AVIF. SVG uses regex on text content.
 */
export function extractImageMeta(
  buffer: Buffer,
  mimeType: string
): ImageMeta | null {
  try {
    if (mimeType === "image/png") return parsePng(buffer);
    if (mimeType === "image/jpeg") return parseJpeg(buffer);
    if (mimeType === "image/webp") return parseWebp(buffer);
    if (mimeType === "image/avif") return parseAvif(buffer);
    if (mimeType === "image/svg+xml") return parseSvg(buffer);
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse SVG dimensions from text content.
 */
function parseSvg(buffer: Buffer): ImageMeta {
  const text = buffer.toString("utf8", 0, Math.min(buffer.length, 4096));

  // Try viewBox first
  const vbMatch = text.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { widthPx: Math.round(parts[2]), heightPx: Math.round(parts[3]), hasAlpha: true };
    }
  }

  // Try width/height attributes
  const wMatch = text.match(/\bwidth\s*=\s*["'](\d+)/);
  const hMatch = text.match(/\bheight\s*=\s*["'](\d+)/);
  if (wMatch && hMatch) {
    return { widthPx: parseInt(wMatch[1]), heightPx: parseInt(hMatch[1]), hasAlpha: true };
  }

  // Default SVG dimensions
  return { widthPx: 600, heightPx: 400, hasAlpha: true };
}

/**
 * Parse PNG IHDR chunk for dimensions and alpha channel.
 */
function parsePng(buffer: Buffer): ImageMeta | null {
  // PNG signature: 137 80 78 71 13 10 26 10
  if (buffer.length < 24) return null;
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50) return null;

  const widthPx = buffer.readUInt32BE(16);
  const heightPx = buffer.readUInt32BE(20);
  const colorType = buffer[25]; // 4 = gray+alpha, 6 = RGBA
  const hasAlpha = colorType === 4 || colorType === 6;

  return { widthPx, heightPx, hasAlpha };
}

/**
 * Parse JPEG SOF markers for dimensions.
 */
function parseJpeg(buffer: Buffer): ImageMeta | null {
  if (buffer.length < 4) return null;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) { offset++; continue; }

    const marker = buffer[offset + 1];

    // SOF markers (0xC0-0xCF except 0xC4, 0xC8, 0xCC)
    if (
      marker >= 0xc0 && marker <= 0xcf &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    ) {
      if (offset + 9 >= buffer.length) return null;
      const heightPx = buffer.readUInt16BE(offset + 5);
      const widthPx = buffer.readUInt16BE(offset + 7);
      return { widthPx, heightPx, hasAlpha: false };
    }

    // Skip to next marker
    if (offset + 3 >= buffer.length) return null;
    const segLen = buffer.readUInt16BE(offset + 2);
    offset += 2 + segLen;
  }

  return null;
}

/**
 * Parse WebP container for dimensions.
 */
function parseWebp(buffer: Buffer): ImageMeta | null {
  if (buffer.length < 30) return null;
  // RIFF....WEBP
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null;

  const chunk = buffer.toString("ascii", 12, 16);

  if (chunk === "VP8 " && buffer.length >= 30) {
    // Lossy
    const widthPx = buffer.readUInt16LE(26) & 0x3fff;
    const heightPx = buffer.readUInt16LE(28) & 0x3fff;
    return { widthPx, heightPx, hasAlpha: false };
  }

  if (chunk === "VP8L" && buffer.length >= 25) {
    // Lossless
    const bits = buffer.readUInt32LE(21);
    const widthPx = (bits & 0x3fff) + 1;
    const heightPx = ((bits >> 14) & 0x3fff) + 1;
    const hasAlpha = !!(bits & (1 << 28));
    return { widthPx, heightPx, hasAlpha };
  }

  if (chunk === "VP8X" && buffer.length >= 30) {
    // Extended
    const flags = buffer[20];
    const hasAlpha = !!(flags & 0x10);
    const widthPx = ((buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) & 0xffffff) + 1;
    const heightPx = ((buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) & 0xffffff) + 1;
    return { widthPx, heightPx, hasAlpha };
  }

  return null;
}

/**
 * Parse AVIF (ISOBMFF) container for dimensions.
 * Reads the ispe (ImageSpatialExtentsProperty) box.
 */
function parseAvif(buffer: Buffer): ImageMeta | null {
  if (buffer.length < 12) return null;

  // Search for 'ispe' box within first 1KB
  const searchLen = Math.min(buffer.length, 1024);
  for (let i = 0; i < searchLen - 12; i++) {
    if (
      buffer[i + 4] === 0x69 && // i
      buffer[i + 5] === 0x73 && // s
      buffer[i + 6] === 0x70 && // p
      buffer[i + 7] === 0x65    // e
    ) {
      // ispe box: 4 bytes size, 4 bytes type, 4 bytes version/flags, 4 bytes width, 4 bytes height
      if (i + 20 <= buffer.length) {
        const widthPx = buffer.readUInt32BE(i + 12);
        const heightPx = buffer.readUInt32BE(i + 16);
        if (widthPx > 0 && heightPx > 0) {
          return { widthPx, heightPx, hasAlpha: true }; // AVIF often supports alpha
        }
      }
    }
  }

  return null;
}

/**
 * Validate an upload before accepting it.
 * Returns null if valid, or an error message string.
 */
export function validateUpload(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): string | null {
  // Check MIME
  if (!ALLOWED_MIMES.has(mimeType)) {
    return `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WebP, SVG, AVIF.`;
  }

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Max: 20MB.`;
  }

  // Check file extension matches MIME
  const ext = fileName.split(".").pop()?.toLowerCase();
  const extMimeMap: Record<string, string[]> = {
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    webp: ["image/webp"],
    svg: ["image/svg+xml"],
    avif: ["image/avif"],
  };
  if (ext && extMimeMap[ext] && !extMimeMap[ext].includes(mimeType)) {
    return `File extension (.${ext}) does not match MIME type (${mimeType}).`;
  }

  // Check dimensions (skip for SVG)
  if (mimeType !== "image/svg+xml") {
    const meta = extractImageMeta(buffer, mimeType);
    if (!meta) {
      return "Could not read image dimensions. File may be corrupted.";
    }
    if (meta.widthPx < MIN_DIMENSION || meta.heightPx < MIN_DIMENSION) {
      return `Image too small: ${meta.widthPx}x${meta.heightPx}. Min: ${MIN_DIMENSION}x${MIN_DIMENSION}.`;
    }
    if (meta.widthPx > MAX_DIMENSION || meta.heightPx > MAX_DIMENSION) {
      return `Image too large: ${meta.widthPx}x${meta.heightPx}. Max: ${MAX_DIMENSION}x${MAX_DIMENSION}.`;
    }
  }

  return null;
}

/**
 * Compute SHA256 hash of a buffer.
 */
export async function computeSha256(buffer: Buffer): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(buffer).digest("hex");
}
