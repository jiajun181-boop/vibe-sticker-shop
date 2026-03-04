// lib/stamp/borders.js — Decorative border drawing for stamp editor

export const BORDER_LIST = [
  { id: "none", labelKey: "stamp.border.none" },
  { id: "single", labelKey: "stamp.border.single" },
  { id: "double", labelKey: "stamp.border.double" },
  { id: "thick-thin", labelKey: "stamp.border.thickThin" },
  { id: "dotted", labelKey: "stamp.border.dotted" },
  { id: "star", labelKey: "stamp.border.star" },
  { id: "rope", labelKey: "stamp.border.rope" },
];

/**
 * Draw a decorative border on the stamp canvas.
 */
export function drawBorder(ctx, borderId, shape, cx, cy, w, h, radius, color) {
  if (borderId === "none") return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  const isRound = shape === "round";
  const inset = 6;

  switch (borderId) {
    case "single":
      ctx.lineWidth = 2;
      if (isRound) {
        ctx.beginPath(); ctx.arc(cx, cy, radius - inset, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.roundRect(cx - w / 2 + inset, cy - h / 2 + inset, w - inset * 2, h - inset * 2, 6); ctx.stroke();
      }
      break;

    case "double":
      ctx.lineWidth = 2.5;
      if (isRound) {
        ctx.beginPath(); ctx.arc(cx, cy, radius - inset, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, radius - inset - 5, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.roundRect(cx - w / 2 + inset, cy - h / 2 + inset, w - inset * 2, h - inset * 2, 6); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - w / 2 + inset + 5, cy - h / 2 + inset + 5, w - inset * 2 - 10, h - inset * 2 - 10, 4); ctx.stroke();
      }
      break;

    case "thick-thin":
      ctx.lineWidth = 4;
      if (isRound) {
        ctx.beginPath(); ctx.arc(cx, cy, radius - inset, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, radius - inset - 7, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.roundRect(cx - w / 2 + inset, cy - h / 2 + inset, w - inset * 2, h - inset * 2, 6); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - w / 2 + inset + 7, cy - h / 2 + inset + 7, w - inset * 2 - 14, h - inset * 2 - 14, 4); ctx.stroke();
      }
      break;

    case "dotted": {
      const dotR = 1.8;
      const gap = 8;
      if (isRound) {
        const r = radius - inset - 2;
        const count = Math.floor((2 * Math.PI * r) / gap);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dotR, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        const x1 = cx - w / 2 + inset + 4, y1 = cy - h / 2 + inset + 4;
        const bw = w - inset * 2 - 8, bh = h - inset * 2 - 8;
        for (let x = 0; x <= bw; x += gap) {
          ctx.beginPath(); ctx.arc(x1 + x, y1, dotR, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x1 + x, y1 + bh, dotR, 0, Math.PI * 2); ctx.fill();
        }
        for (let y = gap; y < bh; y += gap) {
          ctx.beginPath(); ctx.arc(x1, y1 + y, dotR, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x1 + bw, y1 + y, dotR, 0, Math.PI * 2); ctx.fill();
        }
      }
      break;
    }

    case "star": {
      ctx.lineWidth = 2;
      if (isRound) {
        ctx.beginPath(); ctx.arc(cx, cy, radius - inset, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, radius - inset - 6, 0, Math.PI * 2); ctx.stroke();
        const sr = radius - inset - 3;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          drawStar(ctx, cx + Math.cos(a) * sr, cy + Math.sin(a) * sr, 4, 3);
        }
      } else {
        ctx.beginPath(); ctx.roundRect(cx - w / 2 + inset, cy - h / 2 + inset, w - inset * 2, h - inset * 2, 6); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - w / 2 + inset + 6, cy - h / 2 + inset + 6, w - inset * 2 - 12, h - inset * 2 - 12, 4); ctx.stroke();
        const corners = [
          [cx - w / 2 + inset + 3, cy - h / 2 + inset + 3],
          [cx + w / 2 - inset - 3, cy - h / 2 + inset + 3],
          [cx - w / 2 + inset + 3, cy + h / 2 - inset - 3],
          [cx + w / 2 - inset - 3, cy + h / 2 - inset - 3],
        ];
        corners.forEach(([sx, sy]) => drawStar(ctx, sx, sy, 4, 3));
      }
      break;
    }

    case "rope":
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      if (isRound) {
        ctx.beginPath(); ctx.arc(cx, cy, radius - inset - 1, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.roundRect(cx - w / 2 + inset + 1, cy - h / 2 + inset + 1, w - inset * 2 - 2, h - inset * 2 - 2, 6); ctx.stroke();
      }
      ctx.setLineDash([]);
      break;
  }

  ctx.restore();
}

function drawStar(ctx, x, y, points, r) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
