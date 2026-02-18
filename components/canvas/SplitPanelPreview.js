"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { drawCanvasMockup } from "./CanvasPreview";

const MAX_TOTAL_WIDTH = 400;
const SHADOW_BLUR = 14;
const SHADOW_OFFSET = 5;
const FRAME_THICKNESS = 10;

export default function SplitPanelPreview({
  imageUrl,
  widthIn,
  heightIn,
  panelCount = 3,
  gapInches = 2,
  barDepth = 0.75,
  edgeTreatment = "mirror",
}) {
  const canvasRef = useRef(null);
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

    // Calculate sizes in inches
    const panelWidthIn = widthIn / panelCount;
    const totalSpanIn = widthIn + gapInches * (panelCount - 1);

    // Scale factor: map total span (inches) to pixel width
    const padding = SHADOW_BLUR + SHADOW_OFFSET + 4;
    const availableW = MAX_TOTAL_WIDTH - padding * 2;
    const scale = availableW / totalSpanIn;

    const panelFaceW = Math.round(panelWidthIn * scale);
    const panelFaceH = Math.round(heightIn * scale);
    const gapPx = Math.round(gapInches * scale);

    const edgeScale = barDepth / panelWidthIn;
    const edgeRight = Math.round(panelFaceW * edgeScale);
    const edgeBottom = Math.round(panelFaceH * edgeScale);

    // Total canvas dimensions
    const panelTotalW = panelFaceW + edgeRight;
    const panelTotalH = panelFaceH + edgeBottom;
    const totalW = panelTotalW * panelCount + gapPx * (panelCount - 1) + padding * 2;
    const totalH = panelTotalH + padding * 2;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalW * dpr;
    canvas.height = totalH * dpr;
    canvas.style.width = `${totalW}px`;
    canvas.style.height = `${totalH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, totalW, totalH);

    // Draw each panel
    for (let i = 0; i < panelCount; i++) {
      const panelX = padding + i * (panelTotalW + gapPx);
      const panelY = padding;

      // Create a clipped image for this panel's slice
      let panelImg = null;
      if (loadedImg) {
        // Calculate source region for this panel's slice
        const srcX = Math.round((loadedImg.width / panelCount) * i);
        const srcW = Math.round(loadedImg.width / panelCount);

        // Create an offscreen canvas for the sliced image
        const offscreen = document.createElement("canvas");
        offscreen.width = srcW;
        offscreen.height = loadedImg.height;
        const offCtx = offscreen.getContext("2d");
        offCtx.drawImage(
          loadedImg,
          srcX, 0, srcW, loadedImg.height,
          0, 0, srcW, loadedImg.height
        );
        panelImg = offscreen;
      }

      drawCanvasMockup(ctx, {
        img: panelImg,
        x: panelX,
        y: panelY,
        faceW: panelFaceW,
        faceH: panelFaceH,
        edgeRight,
        edgeBottom,
        edgeTreatment,
        frameColor: null,
        drawShadow: true,
      });
    }
  }, [loadedImg, widthIn, heightIn, panelCount, gapInches, barDepth, edgeTreatment]);

  useEffect(() => {
    draw();
  }, [draw]);

  const totalSpan = widthIn + gapInches * (panelCount - 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="max-w-full"
        style={{ maxWidth: `${MAX_TOTAL_WIDTH}px` }}
      />
      <span className="text-xs text-gray-500">
        {panelCount}-panel set &mdash; Total span: {totalSpan}&quot;
      </span>
    </div>
  );
}
