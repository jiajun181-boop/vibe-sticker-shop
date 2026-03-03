"use client";

import { useEffect, useRef } from "react";
import { drawBorder } from "@/lib/stamp/borders";

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Representative stamp designs for product card thumbnails
const CARD_STAMPS = [
  { text: "PAID", color: "#DC2626", shape: "rect", border: "single" },
  { text: "COMPANY\n\u2605 EST. 2024 \u2605", color: "#1E40AF", shape: "round", border: "double" },
  { text: "APPROVED\n\u2713", color: "#16A34A", shape: "rect", border: "thick-thin" },
  { text: "COPY", color: "#2563EB", shape: "rect", border: "dotted" },
  { text: "NOTARY\nPUBLIC", color: "#111111", shape: "round", border: "star" },
];

const W = 400;
const H = 300;

export default function StampCardPreview({ index = 0 }) {
  const canvasRef = useRef(null);
  const stamp = CARD_STAMPS[index % CARD_STAMPS.length];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const isRound = stamp.shape === "round";
    const stampW = isRound ? 220 : 260;
    const stampH = isRound ? 220 : 180;
    const radius = isRound ? 110 : 0;

    // Faint dashed boundary
    ctx.save();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    if (isRound) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.roundRect(cx - stampW / 2, cy - stampH / 2, stampW, stampH, 6);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Decorative border
    drawBorder(ctx, stamp.border, stamp.shape, cx, cy, stampW, stampH, radius, stamp.color);

    // Text
    const lines = stamp.text.split("\n");
    ctx.fillStyle = stamp.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (isRound && lines.length >= 2) {
      // Top arc
      const fontSize1 = 22;
      ctx.font = `bold ${fontSize1}px sans-serif`;
      const textR = radius * 0.72;
      const chars = lines[0].split("");
      const totalAngle = Math.PI * 0.7;
      const startA = -Math.PI / 2 - totalAngle / 2;
      const step = chars.length > 1 ? totalAngle / (chars.length - 1) : 0;
      chars.forEach((ch, i) => {
        const a = startA + i * step;
        ctx.save();
        ctx.translate(cx + Math.cos(a) * textR, cy + Math.sin(a) * textR);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });

      // Bottom arc (reversed)
      const chars2 = lines[1].split("");
      ctx.font = `bold 16px sans-serif`;
      const innerR = radius * 0.55;
      const totalAngle2 = Math.PI * 0.6;
      const startA2 = Math.PI / 2 + totalAngle2 / 2;
      const step2 = chars2.length > 1 ? totalAngle2 / (chars2.length - 1) : 0;
      chars2.forEach((ch, i) => {
        const a = startA2 - i * step2;
        ctx.save();
        ctx.translate(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
        ctx.rotate(a - Math.PI / 2);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });

      // Center lines (if any)
      if (lines.length > 2) {
        ctx.font = `bold 14px sans-serif`;
        const remaining = lines.slice(2);
        const lh = 18;
        const sy = cy - ((remaining.length - 1) * lh) / 2;
        remaining.forEach((line, i) => ctx.fillText(line, cx, sy + i * lh));
      }
    } else {
      // Straight multi-line
      const maxW = isRound ? radius * 1.4 : stampW * 0.8;
      let fs = 40;
      while (fs > 12) {
        ctx.font = `bold ${fs}px sans-serif`;
        const allFit = lines.every((l) => ctx.measureText(l).width <= maxW);
        if (allFit && lines.length * fs * 1.3 <= stampH * 0.8) break;
        fs -= 2;
      }
      ctx.font = `bold ${fs}px sans-serif`;
      const lh = fs * 1.3;
      const totalH = lines.length * lh;
      const sy = cy - totalH / 2 + lh / 2;
      lines.forEach((line, i) => ctx.fillText(line, cx, sy + i * lh));
    }

    // Subtle ink noise
    try {
      const imgData = ctx.getImageData(0, 0, W * dpr, H * dpr);
      const d = imgData.data;
      const [r, g, b] = hexToRgb(stamp.color);
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) continue;
        const dr = Math.abs(d[i] - r);
        const dg = Math.abs(d[i + 1] - g);
        const db = Math.abs(d[i + 2] - b);
        if (dr + dg + db < 150) {
          const noise = (Math.random() - 0.5) * 10;
          d[i] = Math.max(0, Math.min(255, d[i] + noise));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));
          if (Math.random() < 0.02) d[i + 3] = Math.max(140, d[i + 3] - 30);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Canvas tainted
    }
  }, [stamp]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%" }}
      className="bg-white"
    />
  );
}
