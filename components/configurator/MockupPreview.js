"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/**
 * Mockup scene: renders a die-cut sticker on real-world objects.
 * Uses Canvas API to composite the clipped sticker onto a scene background.
 *
 * Props:
 *  - scene        "laptop" | "bottle" | "phone"
 *  - stickerCanvas  HTMLCanvasElement (sticker clipped to contour via clip-to-contour)
 *  - t            translation function
 */

// Scene configs: where to place the sticker on each mockup
const SCENES = {
  laptop: {
    label: "Laptop",
    bgColor: "#f1f5f9",
    // The sticker is placed on a laptop lid illustration
    sticker: { xPct: 0.55, yPct: 0.38, maxWPct: 0.22, rotation: -3 },
  },
  bottle: {
    label: "Water Bottle",
    bgColor: "#f0fdf4",
    sticker: { xPct: 0.5, yPct: 0.45, maxWPct: 0.28, rotation: 0 },
  },
  phone: {
    label: "Phone Case",
    bgColor: "#fef3c7",
    sticker: { xPct: 0.5, yPct: 0.42, maxWPct: 0.30, rotation: 0 },
  },
};

export default function MockupPreview({ scene = "laptop", stickerCanvas, t }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const cfg = SCENES[scene] || SCENES.laptop;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const displayW = containerRef.current?.clientWidth || 500;
    const displayH = Math.min(400, displayW * 0.75);

    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, displayW, displayH);

    // Draw the object illustration
    drawSceneObject(ctx, scene, displayW, displayH);

    // Draw the sticker
    if (stickerCanvas) {
      const { xPct, yPct, maxWPct, rotation } = cfg.sticker;
      const maxStickerW = displayW * maxWPct;
      const stickerAspect = stickerCanvas.width / stickerCanvas.height;
      const stickerW = Math.min(maxStickerW, stickerCanvas.width);
      const stickerH = stickerW / stickerAspect;

      const cx = displayW * xPct;
      const cy = displayH * yPct;

      ctx.save();
      ctx.translate(cx, cy);
      if (rotation) ctx.rotate((rotation * Math.PI) / 180);

      // Drop shadow
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;

      ctx.drawImage(
        stickerCanvas,
        -stickerW / 2,
        -stickerH / 2,
        stickerW,
        stickerH
      );
      ctx.restore();
    }
  }, [scene, stickerCanvas, cfg]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="overflow-hidden rounded-xl border border-gray-200">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}

// ── Simple vector illustrations for each scene ──

function drawSceneObject(ctx, scene, w, h) {
  ctx.save();
  switch (scene) {
    case "laptop":
      drawLaptop(ctx, w, h);
      break;
    case "bottle":
      drawBottle(ctx, w, h);
      break;
    case "phone":
      drawPhone(ctx, w, h);
      break;
  }
  ctx.restore();
}

function drawLaptop(ctx, w, h) {
  const cx = w / 2;
  const baseY = h * 0.82;
  const lidW = w * 0.52;
  const lidH = h * 0.52;

  // Lid
  ctx.fillStyle = "#e2e8f0";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  roundRect(ctx, cx - lidW / 2, baseY - lidH, lidW, lidH, 8);
  ctx.fill();
  ctx.stroke();

  // Screen area (darker)
  const screenPad = 8;
  ctx.fillStyle = "#cbd5e1";
  roundRect(ctx, cx - lidW / 2 + screenPad, baseY - lidH + screenPad, lidW - screenPad * 2, lidH - screenPad * 2, 4);
  ctx.fill();

  // Base
  const baseW = lidW * 1.05;
  const baseH = h * 0.05;
  ctx.fillStyle = "#cbd5e1";
  ctx.strokeStyle = "#94a3b8";
  roundRect(ctx, cx - baseW / 2, baseY, baseW, baseH, 3);
  ctx.fill();
  ctx.stroke();

  // Hinge
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(cx - baseW * 0.4, baseY - 1, baseW * 0.8, 3);
}

function drawBottle(ctx, w, h) {
  const cx = w / 2;
  const bodyW = w * 0.18;
  const bodyH = h * 0.65;
  const topY = h * 0.12;

  // Cap
  ctx.fillStyle = "#94a3b8";
  roundRect(ctx, cx - bodyW * 0.3, topY, bodyW * 0.6, h * 0.06, 3);
  ctx.fill();

  // Neck
  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(cx - bodyW * 0.2, topY + h * 0.06, bodyW * 0.4, h * 0.06);

  // Body
  ctx.fillStyle = "#e2e8f0";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  roundRect(ctx, cx - bodyW / 2, topY + h * 0.12, bodyW, bodyH, 10);
  ctx.fill();
  ctx.stroke();

  // Bottom
  ctx.fillStyle = "#cbd5e1";
  roundRect(ctx, cx - bodyW * 0.52, topY + h * 0.12 + bodyH - 4, bodyW * 1.04, h * 0.04, 4);
  ctx.fill();
}

function drawPhone(ctx, w, h) {
  const cx = w / 2;
  const phoneW = w * 0.28;
  const phoneH = phoneW * 2;
  const topY = (h - phoneH) / 2;

  // Phone body
  ctx.fillStyle = "#e2e8f0";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  roundRect(ctx, cx - phoneW / 2, topY, phoneW, phoneH, 16);
  ctx.fill();
  ctx.stroke();

  // Camera bump
  const camX = cx - phoneW * 0.25;
  const camY = topY + phoneH * 0.06;
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.arc(camX, camY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(camX + 16, camY, 6, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
