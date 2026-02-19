/**
 * Path simplification (Ramer-Douglas-Peucker) and smoothing (Chaikin's corner-cutting).
 */

/**
 * Ramer-Douglas-Peucker line simplification.
 * Reduces point count while preserving shape fidelity.
 * @param {Array<{x:number,y:number}>} points
 * @param {number} epsilon – tolerance in pixels (1.0–2.0 is typical)
 * @returns {Array<{x:number,y:number}>}
 */
export function simplifyPath(points, epsilon = 1.5) {
  if (points.length <= 2) return points;

  // Find the point with the maximum perpendicular distance
  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [first, last];
}

/**
 * Chaikin's corner-cutting smoothing algorithm.
 * Each iteration doubles the point count and rounds corners.
 * @param {Array<{x:number,y:number}>} points
 * @param {number} [iterations=2]
 * @returns {Array<{x:number,y:number}>}
 */
export function smoothPath(points, iterations = 2) {
  if (points.length < 3) return points;

  let current = points;
  for (let iter = 0; iter < iterations; iter++) {
    const next = [];
    const n = current.length;
    for (let i = 0; i < n; i++) {
      const p0 = current[i];
      const p1 = current[(i + 1) % n];

      // Q = 3/4 P0 + 1/4 P1
      next.push({
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
      });
      // R = 1/4 P0 + 3/4 P1
      next.push({
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
      });
    }
    current = next;
  }

  return current;
}

/** Perpendicular distance from a point to a line segment. */
function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    // lineStart == lineEnd
    const ex = point.x - lineStart.x;
    const ey = point.y - lineStart.y;
    return Math.sqrt(ex * ex + ey * ey);
  }
  const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  return num / Math.sqrt(lenSq);
}
