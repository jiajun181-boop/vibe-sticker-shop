/**
 * Marching squares contour tracing on a binary alpha-channel grid.
 *
 * Input:  Uint8ClampedArray (alpha values), width, height, threshold
 * Output: Array of contour polygons — each an array of {x, y} points
 */

/**
 * Trace contour polygons from an alpha channel bitmap.
 * @param {Uint8ClampedArray|Uint8Array} alpha – one byte per pixel (alpha values)
 * @param {number} w – image width
 * @param {number} h – image height
 * @param {number} [threshold=128]
 * @returns {Array<Array<{x:number, y:number}>>} array of contour polygons
 */
export function traceContours(alpha, w, h, threshold = 128) {
  // Build binary grid: 1 = opaque, 0 = transparent
  // Grid is (w+1) x (h+1) — padded so border cells always see "outside"
  const gw = w + 1;
  const gh = h + 1;
  const grid = new Uint8Array(gw * gh); // default 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] >= threshold) {
        grid[y * gw + x] = 1;
      }
    }
  }

  // Visited flags for each cell (w × h cells, each cell is the square formed by 4 grid corners)
  const visited = new Uint8Array(w * h);

  const contours = [];

  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const caseIdx = cellCase(grid, gw, cx, cy);
      // Only start tracing from boundary cells (not fully inside or outside)
      if (caseIdx === 0 || caseIdx === 15) continue;
      if (visited[cy * w + cx]) continue;

      const polygon = tracePolygon(grid, gw, w, h, cx, cy, alpha, threshold, visited);
      if (polygon && polygon.length >= 3) {
        contours.push(polygon);
      }
    }
  }

  // Sort: largest contour first (by area)
  contours.sort((a, b) => polygonArea(b) - polygonArea(a));
  return contours;
}

/** Compute the 4-bit marching squares case for cell (cx, cy). */
function cellCase(grid, gw, cx, cy) {
  const tl = grid[cy * gw + cx];
  const tr = grid[cy * gw + (cx + 1)];
  const bl = grid[(cy + 1) * gw + cx];
  const br = grid[(cy + 1) * gw + (cx + 1)];
  return (tl << 3) | (tr << 2) | (br << 1) | bl;
}

/**
 * Trace a single contour polygon starting at cell (startX, startY).
 * Uses the marching squares edge-following approach.
 */
function tracePolygon(grid, gw, w, h, startX, startY, alpha, threshold, visited) {
  const points = [];
  let cx = startX;
  let cy = startY;
  // Direction: 0=right, 1=down, 2=left, 3=up
  let dir = 0;
  const maxSteps = w * h * 2; // safety limit

  for (let step = 0; step < maxSteps; step++) {
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) break;

    const ci = cellCase(grid, gw, cx, cy);
    if (ci === 0 || ci === 15) break;

    visited[cy * w + cx] = 1;

    // Interpolated edge point(s) for this cell
    const pt = interpolatedPoint(cx, cy, ci, grid, gw, alpha, w, threshold);
    if (pt) points.push(pt);

    // Determine next cell direction
    const nextDir = nextDirection(ci, dir);
    dir = nextDir;

    // Move to next cell
    switch (dir) {
      case 0: cx++; break;
      case 1: cy++; break;
      case 2: cx--; break;
      case 3: cy--; break;
    }

    // Check if we've returned to start
    if (cx === startX && cy === startY) break;
  }

  return points;
}

/**
 * Get the interpolated contour point for a cell.
 * Uses linear interpolation along the alpha values for sub-pixel precision.
 */
function interpolatedPoint(cx, cy, caseIdx, grid, gw, alpha, w, threshold) {
  // Corners: TL(cx,cy) TR(cx+1,cy) BL(cx,cy+1) BR(cx+1,cy+1)
  const tl = grid[cy * gw + cx];
  const tr = grid[cy * gw + (cx + 1)];
  const bl = grid[(cy + 1) * gw + cx];
  const br = grid[(cy + 1) * gw + (cx + 1)];

  // For interpolation, use actual alpha values when available
  function alphaAt(gx, gy) {
    if (gx < 0 || gx >= w || gy < 0 || gy >= (alpha.length / w)) return 0;
    return alpha[gy * w + gx];
  }

  function lerp(v0, v1) {
    if (v0 === v1) return 0.5;
    return (threshold - v0) / (v1 - v0);
  }

  const aTL = alphaAt(cx, cy);
  const aTR = alphaAt(Math.min(cx + 1, w - 1), cy);
  const aBL = alphaAt(cx, Math.min(cy + 1, Math.floor(alpha.length / w) - 1));
  const aBR = alphaAt(Math.min(cx + 1, w - 1), Math.min(cy + 1, Math.floor(alpha.length / w) - 1));

  // Edges: top (TL-TR), right (TR-BR), bottom (BL-BR), left (TL-BL)
  // Return midpoint of the primary edge crossing for this case
  switch (caseIdx) {
    case 1: // BL only
    case 14: // all except BL
      return { x: cx + lerp(aBL, aBR), y: cy + 1 }; // bottom edge approx
    case 2: // BR only
    case 13:
      return { x: cx + 1, y: cy + lerp(aTR, aBR) }; // right edge
    case 3: // BL + BR
    case 12:
      return { x: cx, y: cy + lerp(aTL, aBL) }; // left edge
    case 4: // TR only
    case 11:
      return { x: cx + lerp(aTL, aTR), y: cy }; // top edge
    case 6: // TR + BR
    case 9:
      return { x: cx + 1, y: cy + 0.5 }; // right edge mid
    case 7: // all except TL
    case 8: // TL only
      return { x: cx, y: cy + 0.5 }; // left edge mid
    case 5: // TL + BR (saddle)
      // Resolve saddle by checking center value
      return { x: cx + 0.5, y: cy + lerp(aTL, aBR) };
    case 10: // TR + BL (saddle)
      return { x: cx + lerp(aTL, aTR), y: cy + 0.5 };
    default:
      return { x: cx + 0.5, y: cy + 0.5 };
  }
}

/**
 * Determine the next direction for the marching squares walk.
 * @param {number} caseIdx – 4-bit cell case
 * @param {number} prevDir – previous direction (0=R,1=D,2=L,3=U)
 * @returns {number} next direction
 */
function nextDirection(caseIdx, prevDir) {
  // Standard marching squares direction rules
  switch (caseIdx) {
    case 1: return 0;  // right
    case 2: return 1;  // down
    case 3: return 0;  // right
    case 4: return 3;  // up
    case 5: return prevDir === 1 ? 2 : 0; // saddle: keep momentum
    case 6: return 1;  // down
    case 7: return 0;  // right
    case 8: return 2;  // left
    case 9: return 3;  // up
    case 10: return prevDir === 0 ? 3 : 1; // saddle: keep momentum
    case 11: return 3; // up
    case 12: return 2; // left
    case 13: return 1; // down
    case 14: return 2; // left
    default: return prevDir;
  }
}

/** Compute approximate polygon area (for sorting). */
function polygonArea(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  }
  return Math.abs(area / 2);
}
