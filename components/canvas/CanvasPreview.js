"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const FRAME_COLORS = {
  black: "#1a1a1a",
  white: "#f5f5f0",
  oak: "#c8a06b",
  walnut: "#5c3a1e",
};

const MAX_WIDTH = 400;
const SHADOW_BLUR = 18;
const SHADOW_OFFSET = 6;
const FRAME_THICKNESS = 10;

function darkenColor(hex, amount) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}

/**
 * Draws a 3D canvas print mockup onto an HTML5 canvas context.
 * Exported so SplitPanelPreview can reuse the same drawing logic.
 */
export function drawCanvasMockup(
  ctx,
  {
    img,
    x,
    y,
    faceW,
    faceH,
    edgeRight,
    edgeBottom,
    edgeTreatment,
    frameColor,
    drawShadow,
  }
) {
  const frameHex = frameColor ? FRAME_COLORS[frameColor] : null;
  const frameT = frameHex ? FRAME_THICKNESS : 0;

  // Total bounding box including frame
  const totalW = faceW + edgeRight + frameT * 2;
  const totalH = faceH + edgeBottom + frameT * 2;

  // Drop shadow
  if (drawShadow) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = SHADOW_BLUR;
    ctx.shadowOffsetX = SHADOW_OFFSET;
    ctx.shadowOffsetY = SHADOW_OFFSET;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, totalW, totalH);
    ctx.restore();
  }

  // Frame border (if framed)
  if (frameHex) {
    ctx.fillStyle = frameHex;
    ctx.fillRect(x, y, totalW, totalH);

    // Inner shadow on frame
    ctx.save();
    ctx.strokeStyle = darkenColor(frameHex, 30);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, totalW - 1, totalH - 1);
    ctx.restore();
  }

  const faceX = x + frameT;
  const faceY = y + frameT;

  // -- Main face --
  if (img) {
    ctx.drawImage(img, faceX, faceY, faceW, faceH);
  } else {
    const grad = ctx.createLinearGradient(faceX, faceY, faceX + faceW, faceY + faceH);
    grad.addColorStop(0, "#e5e7eb");
    grad.addColorStop(1, "#9ca3af");
    ctx.fillStyle = grad;
    ctx.fillRect(faceX, faceY, faceW, faceH);
  }

  // -- Right edge --
  if (edgeRight > 0) {
    const rx = faceX + faceW;
    const ry = faceY;

    if (edgeTreatment === "image-wrap" && img) {
      // Show stretched right strip of image
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, edgeRight, faceH);
      ctx.clip();
      const srcStrip = Math.max(1, img.width * 0.05);
      ctx.drawImage(
        img,
        img.width - srcStrip, 0, srcStrip, img.height,
        rx, ry, edgeRight, faceH
      );
      // Darken overlay for depth
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(rx, ry, edgeRight, faceH);
      ctx.restore();
    } else if (edgeTreatment === "mirror" && img) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, edgeRight, faceH);
      ctx.clip();
      // Draw mirrored strip
      ctx.translate(rx + edgeRight, ry);
      ctx.scale(-1, 1);
      const srcStrip = Math.max(1, img.width * 0.08);
      ctx.drawImage(
        img,
        img.width - srcStrip, 0, srcStrip, img.height,
        0, 0, edgeRight, faceH
      );
      ctx.restore();
      // Darken for depth
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(rx, ry, edgeRight, faceH);
    } else if (edgeTreatment === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(rx, ry, edgeRight, faceH);
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(rx, ry, edgeRight, faceH);
    } else {
      // "color" or default — gray
      ctx.fillStyle = "#d1d5db";
      ctx.fillRect(rx, ry, edgeRight, faceH);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(rx, ry, edgeRight, faceH);
    }

    // Subtle edge line between face and right side
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx, ry + faceH);
    ctx.stroke();
  }

  // -- Bottom edge --
  if (edgeBottom > 0) {
    const bx = faceX;
    const by = faceY + faceH;

    if (edgeTreatment === "image-wrap" && img) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, faceW, edgeBottom);
      ctx.clip();
      const srcStrip = Math.max(1, img.height * 0.05);
      ctx.drawImage(
        img,
        0, img.height - srcStrip, img.width, srcStrip,
        bx, by, faceW, edgeBottom
      );
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(bx, by, faceW, edgeBottom);
      ctx.restore();
    } else if (edgeTreatment === "mirror" && img) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, faceW, edgeBottom);
      ctx.clip();
      ctx.translate(bx, by + edgeBottom);
      ctx.scale(1, -1);
      const srcStrip = Math.max(1, img.height * 0.08);
      ctx.drawImage(
        img,
        0, img.height - srcStrip, img.width, srcStrip,
        0, 0, faceW, edgeBottom
      );
      ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(bx, by, faceW, edgeBottom);
    } else if (edgeTreatment === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx, by, faceW, edgeBottom);
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(bx, by, faceW, edgeBottom);
    } else {
      ctx.fillStyle = "#c4c8ce";
      ctx.fillRect(bx, by, faceW, edgeBottom);
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(bx, by, faceW, edgeBottom);
    }

    // Subtle edge line between face and bottom
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + faceW, by);
    ctx.stroke();
  }

  // -- Corner piece (bottom-right) --
  if (edgeRight > 0 && edgeBottom > 0) {
    ctx.fillStyle = "#b0b4ba";
    ctx.fillRect(faceX + faceW, faceY + faceH, edgeRight, edgeBottom);
  }
}

export default function CanvasPreview({
  imageUrl,
  widthIn,
  heightIn,
  barDepth = 0.75,
  edgeTreatment = "mirror",
  frameColor = null,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [loadedImg, setLoadedImg] = useState(null);

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl) {
      setLoadedImg(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedImg(img);
    img.onerror = () => setLoadedImg(null);
    img.src = imageUrl;
  }, [imageUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Calculate proportional display sizes
    const aspect = widthIn / heightIn;
    const edgeScale = barDepth / widthIn;
    const padding = SHADOW_BLUR + SHADOW_OFFSET + 4;
    const frameT = frameColor ? FRAME_THICKNESS : 0;

    let faceW = MAX_WIDTH - padding * 2 - frameT * 2;
    let faceH = faceW / aspect;

    // Ensure it fits vertically too
    const maxH = MAX_WIDTH * 1.2;
    if (faceH + padding * 2 + frameT * 2 > maxH) {
      faceH = maxH - padding * 2 - frameT * 2;
      faceW = faceH * aspect;
    }

    const edgeRight = Math.round(faceW * edgeScale);
    const edgeBottom = Math.round(faceH * edgeScale);

    const totalW = faceW + edgeRight + frameT * 2 + padding * 2;
    const totalH = faceH + edgeBottom + frameT * 2 + padding * 2;

    // Set canvas size accounting for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalW * dpr;
    canvas.height = totalH * dpr;
    canvas.style.width = `${totalW}px`;
    canvas.style.height = `${totalH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, totalW, totalH);

    drawCanvasMockup(ctx, {
      img: loadedImg,
      x: padding,
      y: padding,
      faceW,
      faceH,
      edgeRight,
      edgeBottom,
      edgeTreatment,
      frameColor,
      drawShadow: true,
    });
  }, [loadedImg, widthIn, heightIn, barDepth, edgeTreatment, frameColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="max-w-full"
        style={{ maxWidth: `${MAX_WIDTH}px` }}
      />
      <span className="text-xs text-gray-500">
        {widthIn}&quot; &times; {heightIn}&quot;
      </span>
    </div>
  );
}
