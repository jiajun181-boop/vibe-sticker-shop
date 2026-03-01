"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { getCanvasDimensions } from "@/lib/design-studio/product-configs";
import { useEditorStore } from "@/lib/design-studio/editor-store";

const RULER_SIZE = 24; // px height/width of ruler bar
const RULER_BG = "#f8f9fa";
const RULER_TEXT = "#9ca3af";
const RULER_TICK = "#d1d5db";
const RULER_MAJOR_TICK = "#9ca3af";

/**
 * Canvas area component — handles the DOM canvas element, zoom, and rulers.
 * The actual Fabric.js instance is managed by DesignStudio via useFabricCanvas.
 */
export default function EditorCanvas({ productSpec, canvasElRef }) {
  const containerRef = useRef(null);
  const hRulerRef = useRef(null);
  const vRulerRef = useRef(null);
  const { zoom, setZoom } = useEditorStore();
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  const dims = productSpec ? getCanvasDimensions(productSpec) : null;

  // Observe container size for responsive scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Auto-fit zoom when container or canvas size changes
  useEffect(() => {
    if (!dims) return;
    const padding = 60;
    const availW = containerSize.w - padding - RULER_SIZE;
    const availH = containerSize.h - padding - RULER_SIZE;
    const scaleX = availW / dims.width;
    const scaleY = availH / dims.height;
    const fitZoom = Math.min(scaleX, scaleY, 1);
    setZoom(Math.max(0.1, fitZoom));
  }, [containerSize, dims, setZoom]);

  // Draw rulers whenever zoom or dimensions change
  useEffect(() => {
    if (!dims || !productSpec) return;
    drawRuler(hRulerRef.current, "horizontal", dims, productSpec, zoom, containerSize);
    drawRuler(vRulerRef.current, "vertical", dims, productSpec, zoom, containerSize);
  }, [dims, productSpec, zoom, containerSize]);

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom + 0.1, 3));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom - 0.1, 0.1));
  }, [zoom, setZoom]);

  const handleZoomFit = useCallback(() => {
    if (!dims) return;
    const padding = 60;
    const availW = containerSize.w - padding - RULER_SIZE;
    const availH = containerSize.h - padding - RULER_SIZE;
    const fitZoom = Math.min(availW / dims.width, availH / dims.height, 1);
    setZoom(Math.max(0.1, fitZoom));
  }, [dims, containerSize, setZoom]);

  if (!productSpec || !dims) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Loading canvas...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 flex-col overflow-hidden"
    >
      {/* Horizontal ruler */}
      <div className="flex" style={{ height: RULER_SIZE }}>
        {/* Corner square */}
        <div
          style={{
            width: RULER_SIZE,
            height: RULER_SIZE,
            backgroundColor: RULER_BG,
            borderRight: `1px solid ${RULER_TICK}`,
            borderBottom: `1px solid ${RULER_TICK}`,
          }}
        />
        {/* Horizontal ruler canvas */}
        <canvas
          ref={hRulerRef}
          style={{
            flex: 1,
            height: RULER_SIZE,
            backgroundColor: RULER_BG,
            borderBottom: `1px solid ${RULER_TICK}`,
          }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Vertical ruler */}
        <canvas
          ref={vRulerRef}
          style={{
            width: RULER_SIZE,
            backgroundColor: RULER_BG,
            borderRight: `1px solid ${RULER_TICK}`,
          }}
        />

        {/* Main canvas area */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            backgroundColor: "#f3f4f6",
          }}
        >
          {/* Canvas wrapper with zoom transform */}
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease",
            }}
          >
            <div
              className="shadow-xl"
              style={{
                width: dims.width,
                height: dims.height,
                position: "relative",
              }}
            >
              <canvas ref={canvasElRef} />
            </div>
          </div>

          {/* Zoom controls — floating bottom */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-sm">
            <button
              onClick={handleZoomOut}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Zoom out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="min-w-[3rem] text-center text-xs font-medium text-gray-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Zoom in"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="mx-1 h-4 w-px bg-gray-200" />
            <button
              onClick={handleZoomFit}
              className="rounded p-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Fit to screen"
            >
              Fit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Draw ruler markings on a canvas element.
 * Shows inch marks with sub-divisions.
 */
function drawRuler(canvasEl, direction, dims, spec, zoom, containerSize) {
  if (!canvasEl) return;

  const dpr = window.devicePixelRatio || 1;
  const isHorizontal = direction === "horizontal";

  const displayLen = isHorizontal
    ? containerSize.w - RULER_SIZE
    : containerSize.h - RULER_SIZE;

  canvasEl.width = (isHorizontal ? displayLen : RULER_SIZE) * dpr;
  canvasEl.height = (isHorizontal ? RULER_SIZE : displayLen) * dpr;
  canvasEl.style.width = isHorizontal ? `${displayLen}px` : `${RULER_SIZE}px`;
  canvasEl.style.height = isHorizontal ? `${RULER_SIZE}px` : `${displayLen}px`;

  const ctx = canvasEl.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, displayLen, displayLen);

  // Pixels per inch at current zoom
  const pxPerInch = spec.dpi * zoom;

  // Total inches including bleed
  const totalInches = isHorizontal
    ? spec.widthIn + spec.bleedIn * 2
    : spec.heightIn + spec.bleedIn * 2;

  // Canvas display size at current zoom
  const canvasDisplaySize = isHorizontal
    ? dims.width * zoom
    : dims.height * zoom;

  // Offset: center the canvas in the container
  const offset = (displayLen - canvasDisplaySize) / 2;

  // Determine tick interval based on zoom
  let subdivisions = 4; // quarter inch
  if (pxPerInch < 30) subdivisions = 1;
  else if (pxPerInch < 60) subdivisions = 2;
  else if (pxPerInch > 200) subdivisions = 8;

  const tickInterval = pxPerInch / subdivisions;

  ctx.font = "9px -apple-system, sans-serif";
  ctx.textBaseline = "top";

  for (let i = 0; i <= totalInches * subdivisions; i++) {
    const pos = offset + i * tickInterval;
    if (pos < 0 || pos > displayLen) continue;

    const isMajor = i % subdivisions === 0;
    const isHalf = subdivisions >= 2 && i % (subdivisions / 2) === 0;

    let tickLen = 4;
    if (isMajor) tickLen = RULER_SIZE - 8;
    else if (isHalf) tickLen = 8;

    ctx.beginPath();
    ctx.strokeStyle = isMajor ? RULER_MAJOR_TICK : RULER_TICK;
    ctx.lineWidth = isMajor ? 1 : 0.5;

    if (isHorizontal) {
      ctx.moveTo(pos, RULER_SIZE - tickLen);
      ctx.lineTo(pos, RULER_SIZE);
    } else {
      ctx.moveTo(RULER_SIZE - tickLen, pos);
      ctx.lineTo(RULER_SIZE, pos);
    }
    ctx.stroke();

    // Draw inch number for major ticks
    if (isMajor) {
      const inch = i / subdivisions;
      ctx.fillStyle = RULER_TEXT;
      if (isHorizontal) {
        ctx.fillText(`${inch}"`, pos + 2, 2);
      } else {
        ctx.save();
        ctx.translate(2, pos + 2);
        ctx.fillText(`${inch}"`, 0, 0);
        ctx.restore();
      }
    }
  }
}
