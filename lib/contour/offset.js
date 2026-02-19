/**
 * Polygon offset — expand or contract a contour by a fixed distance.
 * Used to generate the bleed (outset) path around a die-cut contour.
 */

/**
 * Offset a closed polygon outward by `distance` pixels.
 * @param {Array<{x:number,y:number}>} points – closed polygon (no duplicated last point)
 * @param {number} distance – positive = outward, negative = inward
 * @param {number} [miterLimit=3] – max miter extension as multiple of distance
 * @returns {Array<{x:number,y:number}>}
 */
export function offsetContour(points, distance, miterLimit = 3) {
  const n = points.length;
  if (n < 3) return points;

  const result = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    // Edge normals (outward-pointing, assuming clockwise winding)
    const n1 = edgeNormal(prev, curr);
    const n2 = edgeNormal(curr, next);

    // Average normal at vertex
    let nx = n1.x + n2.x;
    let ny = n1.y + n2.y;
    const len = Math.sqrt(nx * nx + ny * ny);

    if (len < 1e-8) {
      // Degenerate: use edge normal directly
      result.push({
        x: curr.x + n1.x * distance,
        y: curr.y + n1.y * distance,
      });
      continue;
    }

    nx /= len;
    ny /= len;

    // Miter length: distance / cos(half-angle)
    const dot = n1.x * nx + n1.y * ny;
    let miterLen = dot > 1e-8 ? distance / dot : distance * miterLimit;

    // Clamp miter to prevent spikes at sharp corners
    if (Math.abs(miterLen) > Math.abs(distance) * miterLimit) {
      miterLen = Math.sign(miterLen) * Math.abs(distance) * miterLimit;
    }

    result.push({
      x: curr.x + nx * miterLen,
      y: curr.y + ny * miterLen,
    });
  }

  return result;
}

/**
 * Compute the outward-facing unit normal for edge from p0 to p1.
 * Assumes clockwise polygon winding → outward normal points right of the edge direction.
 */
function edgeNormal(p0, p1) {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-8) return { x: 0, y: 0 };
  // Rotate 90 degrees clockwise: (dx, dy) → (dy, -dx)
  return { x: dy / len, y: -dx / len };
}

/**
 * Determine polygon winding order and ensure it's clockwise.
 * If counter-clockwise, reverses the points.
 * @param {Array<{x:number,y:number}>} points
 * @returns {Array<{x:number,y:number}>} clockwise-ordered points
 */
export function ensureClockwise(points) {
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];
    sum += (next.x - curr.x) * (next.y + curr.y);
  }
  // Positive sum = clockwise in screen coordinates (y-down)
  return sum >= 0 ? points : [...points].reverse();
}
