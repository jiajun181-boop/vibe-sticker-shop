// lib/stamp/borders.js — Decorative stamp border definitions

export const STAMP_BORDERS = [
  { id: "none", labelKey: "stamp.border.none" },
  { id: "single", labelKey: "stamp.border.single" },
  { id: "double", labelKey: "stamp.border.double" },
  { id: "thick-thin", labelKey: "stamp.border.thickThin" },
  { id: "dotted", labelKey: "stamp.border.dotted" },
  { id: "star", labelKey: "stamp.border.star" },
  { id: "rope", labelKey: "stamp.border.rope" },
];

/**
 * Draw a stamp border onto a Canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} borderId — one of STAMP_BORDERS[].id
 * @param {"round"|"rect"} shape
 * @param {number} cx — center x
 * @param {number} cy — center y
 * @param {number} w — stamp width (px)
 * @param {number} h — stamp height (px)
 * @param {number} radius — radius for round stamps (px)
 * @param {string} color — ink color hex
 */
export function drawBorder(ctx, borderId, shape, cx, cy, w, h, radius, color) {
  if (borderId === "none") return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.setLineDash([]);

  switch (borderId) {
    case "single":
      drawSingle(ctx, shape, cx, cy, w, h, radius);
      break;
    case "double":
      drawDouble(ctx, shape, cx, cy, w, h, radius);
      break;
    case "thick-thin":
      drawThickThin(ctx, shape, cx, cy, w, h, radius);
      break;
    case "dotted":
      drawDotted(ctx, shape, cx, cy, w, h, radius);
      break;
    case "star":
      drawStar(ctx, shape, cx, cy, w, h, radius);
      break;
    case "rope":
      drawRope(ctx, shape, cx, cy, w, h, radius);
      break;
  }

  ctx.restore();
}

// ── Border drawing functions ──

function drawSingle(ctx, shape, cx, cy, w, h, radius) {
  ctx.lineWidth = 2;
  if (shape === "round") {
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 6, cy - h / 2 + 6, w - 12, h - 12, 4);
    ctx.stroke();
  }
}

function drawDouble(ctx, shape, cx, cy, w, h, radius) {
  ctx.lineWidth = 2.5;
  if (shape === "round") {
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 11, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h - 8, 4);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 11, cy - h / 2 + 11, w - 22, h - 22, 3);
    ctx.stroke();
  }
}

function drawThickThin(ctx, shape, cx, cy, w, h, radius) {
  ctx.lineWidth = 4;
  if (shape === "round") {
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 12, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h - 8, 4);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 12, cy - h / 2 + 12, w - 24, h - 24, 3);
    ctx.stroke();
  }
}

function drawDotted(ctx, shape, cx, cy, w, h, radius) {
  const dotR = 1.8;
  const gap = 8;
  if (shape === "round") {
    const r = radius - 7;
    const circumference = 2 * Math.PI * r;
    const count = Math.floor(circumference / gap);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const x0 = cx - w / 2 + 7;
    const y0 = cy - h / 2 + 7;
    const bw = w - 14;
    const bh = h - 14;
    // Top + bottom edges
    for (let x = 0; x <= bw; x += gap) {
      ctx.beginPath(); ctx.arc(x0 + x, y0, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x0 + x, y0 + bh, dotR, 0, Math.PI * 2); ctx.fill();
    }
    // Left + right edges
    for (let y = gap; y < bh; y += gap) {
      ctx.beginPath(); ctx.arc(x0, y0 + y, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x0 + bw, y0 + y, dotR, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawStar(ctx, shape, cx, cy, w, h, radius) {
  // Base: double border
  drawDouble(ctx, shape, cx, cy, w, h, radius);

  // Add stars at cardinal points
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (shape === "round") {
    const r = radius - 7;
    ctx.fillText("\u2605", cx, cy - r);
    ctx.fillText("\u2605", cx, cy + r);
    ctx.fillText("\u2605", cx - r, cy);
    ctx.fillText("\u2605", cx + r, cy);
  } else {
    const hx = w / 2 - 7;
    const hy = h / 2 - 7;
    ctx.fillText("\u2605", cx, cy - hy);
    ctx.fillText("\u2605", cx, cy + hy);
    ctx.fillText("\u2605", cx - hx, cy);
    ctx.fillText("\u2605", cx + hx, cy);
  }
}

function drawRope(ctx, shape, cx, cy, w, h, radius) {
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.lineCap = "round";
  if (shape === "round") {
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 6, cy - h / 2 + 6, w - 12, h - 12, 6);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

/**
 * Draw a border preview into a small canvas (for picker thumbnails).
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} borderId
 * @param {number} size — canvas size (square)
 * @param {string} color
 */
export function drawBorderPreview(ctx, borderId, size, color) {
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  drawBorder(ctx, borderId, "round", cx, cy, size - 4, size - 4, r, color);
}
