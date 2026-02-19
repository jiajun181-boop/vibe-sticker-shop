/**
 * Convert contour point arrays to SVG path strings.
 */

/**
 * Convert points to an SVG path using line segments.
 * @param {Array<{x:number,y:number}>} points
 * @param {boolean} [closed=true]
 * @returns {string} SVG path d-attribute
 */
export function pointsToSvgPath(points, closed = true) {
  if (!points || points.length === 0) return "";
  const parts = [`M ${r(points[0].x)} ${r(points[0].y)}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${r(points[i].x)} ${r(points[i].y)}`);
  }
  if (closed) parts.push("Z");
  return parts.join(" ");
}

/**
 * Convert points to a smooth SVG path using cubic Bezier curves.
 * Uses Catmull-Rom → Bezier conversion for smooth C-curves.
 * @param {Array<{x:number,y:number}>} points
 * @param {boolean} [closed=true]
 * @param {number} [tension=0.3] – 0 = sharp, 1 = very smooth
 * @returns {string} SVG path d-attribute
 */
export function pointsToCubicBezierPath(points, closed = true, tension = 0.3) {
  const n = points.length;
  if (n < 2) return pointsToSvgPath(points, closed);
  if (n === 2) return pointsToSvgPath(points, closed);

  const parts = [`M ${r(points[0].x)} ${r(points[0].y)}`];

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    if (!closed && i === 0) continue; // skip first segment for open paths

    // Catmull-Rom to Bezier control points
    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;

    parts.push(`C ${r(cp1x)} ${r(cp1y)}, ${r(cp2x)} ${r(cp2y)}, ${r(p2.x)} ${r(p2.y)}`);
  }

  if (closed) parts.push("Z");
  return parts.join(" ");
}

/**
 * Build a complete SVG string with cut line and bleed line.
 * @param {object} opts
 * @param {string} opts.cutPath – SVG d-attribute for the cut line
 * @param {string} opts.bleedPath – SVG d-attribute for the bleed line
 * @param {number} opts.width – image width in pixels
 * @param {number} opts.height – image height in pixels
 * @returns {string} complete SVG markup
 */
export function buildContourSvg({ cutPath, bleedPath, width, height }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <path d="${bleedPath}" fill="none" stroke="#ff000040" stroke-width="1" stroke-dasharray="4 2"/>
  <path d="${cutPath}" fill="none" stroke="#ff0000" stroke-width="1.5"/>
</svg>`;
}

/** Round to 1 decimal place for compact SVG paths. */
function r(v) {
  return Math.round(v * 10) / 10;
}
