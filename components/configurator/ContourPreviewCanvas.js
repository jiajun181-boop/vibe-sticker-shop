"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/**
 * Renders the sticker artwork with die-cut contour line overlaid.
 * Uses a <canvas> for the image + an absolutely-positioned <svg> for contour paths.
 *
 * Props:
 *  - imageUrl         artwork URL (original or bg-removed)
 *  - cutPath          SVG d-attribute for the cut line
 *  - bleedPath        SVG d-attribute for the bleed line
 *  - imageWidth       natural pixel width of the source image
 *  - imageHeight      natural pixel height of the source image
 *  - widthIn          physical width in inches
 *  - heightIn         physical height in inches
 *  - t                translation function
 */
export default function ContourPreviewCanvas({
  imageUrl,
  cutPath,
  bleedPath,
  imageWidth,
  imageHeight,
  widthIn,
  heightIn,
  t,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [loadedImg, setLoadedImg] = useState(null);
  const [zoom, setZoom] = useState("fit"); // "fit" | "100" | "200"

  // Load image
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedImg(img);
    img.onerror = () => setLoadedImg(null);
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw checkerboard + image on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageWidth || !imageHeight) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Display size
    const maxW = containerRef.current?.clientWidth || 500;
    const maxH = 400;
    const aspect = imageWidth / imageHeight;
    let dispW, dispH;

    if (zoom === "fit") {
      dispW = Math.min(maxW, maxH * aspect);
      dispH = dispW / aspect;
      if (dispH > maxH) {
        dispH = maxH;
        dispW = dispH * aspect;
      }
    } else {
      const z = zoom === "200" ? 2 : 1;
      dispW = imageWidth * z;
      dispH = imageHeight * z;
    }

    canvas.width = dispW * dpr;
    canvas.height = dispH * dpr;
    canvas.style.width = `${dispW}px`;
    canvas.style.height = `${dispH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Checkerboard background (shows transparency)
    const tileSize = 10;
    for (let y = 0; y < dispH; y += tileSize) {
      for (let x = 0; x < dispW; x += tileSize) {
        const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isLight ? "#f0f0f0" : "#d8d8d8";
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Draw artwork
    if (loadedImg) {
      ctx.drawImage(loadedImg, 0, 0, dispW, dispH);
    }
  }, [loadedImg, imageWidth, imageHeight, zoom]);

  useEffect(() => { draw(); }, [draw]);

  // Resize observer to redraw on container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  // Compute display size for SVG overlay
  const maxW = containerRef.current?.clientWidth || 500;
  const maxH = 400;
  const aspect = imageWidth && imageHeight ? imageWidth / imageHeight : 1;
  let dispW, dispH;
  if (zoom === "fit") {
    dispW = Math.min(maxW, maxH * aspect);
    dispH = dispW / aspect;
    if (dispH > maxH) { dispH = maxH; dispW = dispH * aspect; }
  } else {
    const z = zoom === "200" ? 2 : 1;
    dispW = imageWidth * z;
    dispH = imageHeight * z;
  }

  const sizeLabel = widthIn && heightIn
    ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
    : "";

  return (
    <div className="space-y-3">
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        {["fit", "100", "200"].map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => setZoom(z)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              zoom === z
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {z === "fit" ? (t?.("configurator.proofZoomFit") || "Fit") : `${z}%`}
          </button>
        ))}
      </div>

      {/* Preview container */}
      <div
        ref={containerRef}
        className="relative overflow-auto rounded-xl border border-gray-200 bg-gray-50"
        style={{ maxHeight: zoom === "fit" ? "auto" : "420px" }}
      >
        <canvas ref={canvasRef} className="block" />

        {/* SVG overlay for contour lines */}
        {cutPath && (
          <svg
            viewBox={`0 0 ${imageWidth} ${imageHeight}`}
            className="pointer-events-none absolute left-0 top-0"
            style={{ width: `${dispW}px`, height: `${dispH}px` }}
            preserveAspectRatio="none"
          >
            {/* Bleed area fill */}
            {bleedPath && cutPath && (
              <>
                <defs>
                  <clipPath id="bleed-clip"><path d={bleedPath} /></clipPath>
                </defs>
                <path
                  d={bleedPath}
                  fill="rgba(255,0,0,0.06)"
                  stroke="none"
                  clipPath="url(#bleed-clip)"
                />
              </>
            )}
            {/* Bleed line (dashed) */}
            {bleedPath && (
              <path
                d={bleedPath}
                fill="none"
                stroke="rgba(255,0,0,0.35)"
                strokeWidth={Math.max(1, imageWidth / 300)}
                strokeDasharray={`${imageWidth / 80} ${imageWidth / 120}`}
              />
            )}
            {/* Cut line (solid) */}
            <path
              d={cutPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth={Math.max(1.5, imageWidth / 200)}
            />
          </svg>
        )}
      </div>

      {/* Legend + dimensions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-red-500" />
            {t?.("configurator.proofCutLine") || "Cut line"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-red-300" />
            {t?.("configurator.proofBleedLine") || "Bleed line"}
          </span>
        </div>
        {sizeLabel && (
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
            {t?.("configurator.proofDimensions") || "Actual Size"}: {sizeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
