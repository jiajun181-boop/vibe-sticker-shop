"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { drawCanvasMockup } from "./CanvasPreview";

// Room reference dimensions in inches
const ROOM_W_IN = 100;
const ROOM_H_IN = 76;

const SCENE_W = 480;
const SCENE_H = 340;
const PX_PER_IN = SCENE_W / ROOM_W_IN;

// Couch reference
const COUCH_W_IN = 72;
const COUCH_H_IN = 18;
const COUCH_BACK_H_IN = 8;
const FLOOR_H = 44;

function drawCouch(ctx, cx, floorY) {
  const couchW = COUCH_W_IN * PX_PER_IN;
  const seatH = COUCH_H_IN * PX_PER_IN;
  const backH = COUCH_BACK_H_IN * PX_PER_IN;
  const x = cx - couchW / 2;
  const y = floorY - seatH;

  // Legs
  const legW = 4;
  const legH = 10;
  ctx.fillStyle = "#8b7355";
  ctx.fillRect(x + 14, floorY - legH, legW, legH);
  ctx.fillRect(x + couchW - 18, floorY - legH, legW, legH);

  // Seat body
  ctx.save();
  ctx.fillStyle = "#6b7280";
  ctx.beginPath();
  ctx.roundRect(x, y, couchW, seatH - legH, [6, 6, 3, 3]);
  ctx.fill();
  ctx.restore();

  // Back cushions
  ctx.save();
  ctx.fillStyle = "#5b6270";
  ctx.beginPath();
  ctx.roundRect(x + 2, y - backH + 4, couchW - 4, backH, [8, 8, 0, 0]);
  ctx.fill();
  ctx.restore();

  // Armrests
  ctx.save();
  ctx.fillStyle = "#5f6673";
  // Left arm
  ctx.beginPath();
  ctx.roundRect(x - 6, y - backH + 10, 14, seatH + backH - 16, [6, 6, 4, 4]);
  ctx.fill();
  // Right arm
  ctx.beginPath();
  ctx.roundRect(x + couchW - 8, y - backH + 10, 14, seatH + backH - 16, [6, 6, 4, 4]);
  ctx.fill();
  ctx.restore();

  // Seat cushion lines
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  const cushionCount = 3;
  for (let i = 1; i < cushionCount; i++) {
    const lx = x + (couchW / cushionCount) * i;
    ctx.beginPath();
    ctx.moveTo(lx, y + 4);
    ctx.lineTo(lx, y + seatH - legH - 4);
    ctx.stroke();
  }
}

function drawSideTable(ctx, x, floorY) {
  const tableW = 28;
  const tableH = 40;
  const top = floorY - tableH;

  // Legs
  ctx.fillStyle = "#8b7355";
  ctx.fillRect(x + 4, floorY - 8, 3, 8);
  ctx.fillRect(x + tableW - 7, floorY - 8, 3, 8);

  // Table surface
  ctx.fillStyle = "#a0845c";
  ctx.beginPath();
  ctx.roundRect(x, top, tableW, 6, [3, 3, 0, 0]);
  ctx.fill();

  // Bottom shelf
  ctx.fillStyle = "#917650";
  ctx.fillRect(x + 2, floorY - 14, tableW - 4, 4);

  // Lamp base
  const lampX = x + tableW / 2;
  ctx.fillStyle = "#9ca3af";
  ctx.beginPath();
  ctx.ellipse(lampX, top - 1, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lamp pole
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lampX, top - 3);
  ctx.lineTo(lampX, top - 28);
  ctx.stroke();

  // Lamp shade
  ctx.fillStyle = "#e5e0d5";
  ctx.beginPath();
  ctx.moveTo(lampX - 14, top - 28);
  ctx.lineTo(lampX + 14, top - 28);
  ctx.lineTo(lampX + 10, top - 46);
  ctx.lineTo(lampX - 10, top - 46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPlant(ctx, x, floorY) {
  const potW = 22;
  const potH = 24;

  // Pot
  ctx.fillStyle = "#c47a5a";
  ctx.beginPath();
  ctx.moveTo(x - potW / 2, floorY - potH);
  ctx.lineTo(x + potW / 2, floorY - potH);
  ctx.lineTo(x + potW / 2 - 3, floorY - 4);
  ctx.lineTo(x - potW / 2 + 3, floorY - 4);
  ctx.closePath();
  ctx.fill();

  // Pot rim
  ctx.fillStyle = "#b56e4e";
  ctx.fillRect(x - potW / 2 - 1, floorY - potH - 3, potW + 2, 5);

  // Leaves
  ctx.fillStyle = "#5a7a52";
  const leafY = floorY - potH - 6;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(x, leafY);
    ctx.rotate(((i - 2) * Math.PI) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -18, 5, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Darker leaves behind
  ctx.fillStyle = "#4a6a42";
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(x, leafY + 2);
    ctx.rotate(((i - 1) * Math.PI) / 4 + 0.3);
    ctx.beginPath();
    ctx.ellipse(0, -14, 4, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export default function WallContextPreview({
  imageUrl,
  widthIn,
  heightIn,
  barDepth = 0.75,
  edgeTreatment = "mirror",
  frameColor = null,
  panelCount = 1,
  gapInches = 2,
}) {
  const canvasRef = useRef(null);
  const [loadedImg, setLoadedImg] = useState(null);

  useEffect(() => {
    if (!imageUrl) {
      setLoadedImg(null);
      return;
    }
    const img = new Image();
    img.onload = () => setLoadedImg(img);
    img.onerror = () => setLoadedImg(null);
    img.src = imageUrl;
  }, [imageUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!widthIn || !heightIn || !isFinite(widthIn) || !isFinite(heightIn)) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SCENE_W * dpr;
    canvas.height = SCENE_H * dpr;
    canvas.style.width = `${SCENE_W}px`;
    canvas.style.height = `${SCENE_H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // --- Wall ---
    const wallGrad = ctx.createLinearGradient(0, 0, 0, SCENE_H - FLOOR_H);
    wallGrad.addColorStop(0, "#f0ebe4");
    wallGrad.addColorStop(1, "#e8e2da");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H - FLOOR_H);

    // Subtle wall texture (thin horizontal lines)
    ctx.strokeStyle = "rgba(0,0,0,0.015)";
    ctx.lineWidth = 1;
    for (let y = 10; y < SCENE_H - FLOOR_H; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SCENE_W, y);
      ctx.stroke();
    }

    // --- Baseboard ---
    ctx.fillStyle = "#d4cec5";
    ctx.fillRect(0, SCENE_H - FLOOR_H, SCENE_W, 6);
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, SCENE_H - FLOOR_H, SCENE_W, 1);

    // --- Floor ---
    const floorGrad = ctx.createLinearGradient(0, SCENE_H - FLOOR_H + 6, 0, SCENE_H);
    floorGrad.addColorStop(0, "#c4b59c");
    floorGrad.addColorStop(1, "#b8a88e");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, SCENE_H - FLOOR_H + 6, SCENE_W, FLOOR_H - 6);

    // Floor planks
    ctx.strokeStyle = "rgba(0,0,0,0.04)";
    ctx.lineWidth = 1;
    for (let x = 30; x < SCENE_W; x += 65) {
      ctx.beginPath();
      ctx.moveTo(x, SCENE_H - FLOOR_H + 6);
      ctx.lineTo(x, SCENE_H);
      ctx.stroke();
    }

    const floorTop = SCENE_H - FLOOR_H;
    const centerX = SCENE_W / 2;

    // --- Furniture ---
    drawCouch(ctx, centerX, floorTop - 2);
    drawSideTable(ctx, SCENE_W - 70, floorTop - 2);
    drawPlant(ctx, 42, floorTop - 2);

    // --- Canvas print on wall ---
    // Scale the canvas to room proportions
    const totalSpanIn = panelCount > 1
      ? widthIn + gapInches * (panelCount - 1)
      : widthIn;

    // Canvas pixel dimensions
    const printW = totalSpanIn * PX_PER_IN;
    const printH = heightIn * PX_PER_IN;

    // Clamp to reasonable wall display
    const maxPrintW = SCENE_W * 0.7;
    const maxPrintH = (SCENE_H - FLOOR_H) * 0.55;
    let scale = 1;
    if (printW > maxPrintW) scale = Math.min(scale, maxPrintW / printW);
    if (printH > maxPrintH) scale = Math.min(scale, maxPrintH / printH);

    const finalPrintW = printW * scale;
    const finalPrintH = printH * scale;

    // Center above couch, vertically centered in wall upper portion
    const printCX = centerX;
    const printCY = (floorTop - COUCH_H_IN * PX_PER_IN - COUCH_BACK_H_IN * PX_PER_IN) / 2;
    const printX = printCX - finalPrintW / 2;
    const printY = printCY - finalPrintH / 2;

    if (panelCount > 1) {
      // Split panels
      const panelWidthIn = widthIn / panelCount;
      const totalSpanPx = finalPrintW;
      const gapPx = (gapInches * PX_PER_IN * scale);
      const panelFaceW = (totalSpanPx - gapPx * (panelCount - 1)) / panelCount;
      const panelFaceH = finalPrintH;
      const edgeR = Math.round(panelFaceW * (barDepth / panelWidthIn));
      const edgeB = Math.round(panelFaceH * (barDepth / heightIn));

      for (let i = 0; i < panelCount; i++) {
        const px = printX + i * (panelFaceW + gapPx);

        let panelImg = null;
        if (loadedImg) {
          const srcX = Math.round((loadedImg.width / panelCount) * i);
          const srcW = Math.round(loadedImg.width / panelCount);
          const offscreen = document.createElement("canvas");
          offscreen.width = srcW;
          offscreen.height = loadedImg.height;
          const offCtx = offscreen.getContext("2d");
          offCtx.drawImage(loadedImg, srcX, 0, srcW, loadedImg.height, 0, 0, srcW, loadedImg.height);
          panelImg = offscreen;
        }

        drawCanvasMockup(ctx, {
          img: panelImg,
          x: px,
          y: printY,
          faceW: panelFaceW - edgeR,
          faceH: panelFaceH - edgeB,
          edgeRight: edgeR,
          edgeBottom: edgeB,
          edgeTreatment,
          frameColor: null,
          drawShadow: true,
        });
      }
    } else {
      // Single canvas
      const edgeScale = barDepth / widthIn;
      const edgeR = Math.round(finalPrintW * edgeScale);
      const edgeB = Math.round(finalPrintH * edgeScale);

      drawCanvasMockup(ctx, {
        img: loadedImg,
        x: printX,
        y: printY,
        faceW: finalPrintW - edgeR,
        faceH: finalPrintH - edgeB,
        edgeRight: edgeR,
        edgeBottom: edgeB,
        edgeTreatment,
        frameColor,
        drawShadow: true,
      });
    }

    // Dimension annotation below print
    const annotY = printY + finalPrintH + 14;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    const dimText = panelCount > 1
      ? `${panelCount} panels — ${widthIn}" × ${heightIn}" total`
      : `${widthIn}" × ${heightIn}"`;
    ctx.fillText(dimText, centerX, annotY);
    ctx.textAlign = "start";

  }, [loadedImg, widthIn, heightIn, barDepth, edgeTreatment, frameColor, panelCount, gapInches]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        className="w-full max-w-[480px] rounded-xl"
      />
    </div>
  );
}
