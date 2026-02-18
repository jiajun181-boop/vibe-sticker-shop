"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/**
 * ImageCropper — drag-to-pan, scroll/pinch-to-zoom image positioning tool.
 * Outputs cropData: { x, y, zoom } relative to the image dimensions.
 */
export default function ImageCropper({
  imageUrl,
  aspectRatio = 1.25, // width / height (e.g. 16/20 = 0.8, 24/36 = 0.667)
  onChange,
  className = "",
}) {
  const containerRef = useRef(null);
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Load image
  useEffect(() => {
    if (!imageUrl) { setImg(null); return; }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    image.onerror = () => setImg(null);
    image.src = imageUrl;
  }, [imageUrl]);

  // Emit crop data on change
  useEffect(() => {
    if (onChange) {
      onChange({ x: pan.x, y: pan.y, zoom });
    }
  }, [pan, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      return Math.max(0.5, Math.min(3, prev + delta));
    });
  }, []);

  // Mouse drag
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Touch drag + pinch
  const touchState = useRef({ touches: [], dist: 0, panX: 0, panY: 0, zoom: 1 });

  const handleTouchStart = useCallback((e) => {
    const touches = e.touches;
    if (touches.length === 1) {
      dragStart.current = { x: touches[0].clientX, y: touches[0].clientY, panX: pan.x, panY: pan.y };
      setDragging(true);
    } else if (touches.length === 2) {
      const dist = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
      touchState.current = { dist, zoom, panX: pan.x, panY: pan.y };
    }
  }, [pan, zoom]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touches = e.touches;
    if (touches.length === 1 && dragging) {
      const dx = touches[0].clientX - dragStart.current.x;
      const dy = touches[0].clientY - dragStart.current.y;
      setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
    } else if (touches.length === 2) {
      const dist = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
      const scale = dist / touchState.current.dist;
      setZoom(Math.max(0.5, Math.min(3, touchState.current.zoom * scale)));
    }
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
  }, []);

  // Attach non-passive wheel listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  if (!imageUrl || !img) {
    return (
      <div className={`flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-400 ${className}`}>
        Upload an image to adjust positioning
      </div>
    );
  }

  // Container dimensions
  const containerWidth = 320;
  const containerHeight = containerWidth / aspectRatio;

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative mx-auto overflow-hidden rounded-xl border-2 border-gray-300 bg-gray-100"
        style={{ width: containerWidth, height: containerHeight, cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={img.src}
          alt="Crop preview"
          className="pointer-events-none absolute select-none"
          style={{
            width: containerWidth * zoom,
            height: "auto",
            left: pan.x,
            top: pan.y,
            transformOrigin: "top left",
          }}
          draggable={false}
        />
        {/* Crop frame overlay */}
        <div className="absolute inset-0 border-2 border-white/50 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(transparent 33%, transparent 33%, transparent 67%, transparent 67%)",
          backgroundSize: "33.33% 33.33%",
        }}>
          {/* Rule of thirds grid */}
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
        </div>
      </div>

      {/* Zoom slider */}
      <div className="mx-auto mt-3 flex max-w-xs items-center gap-3">
        <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
        </svg>
        <input
          type="range"
          min="50"
          max="300"
          value={Math.round(zoom * 100)}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-gray-900"
        />
        <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
        </svg>
        <span className="w-12 text-right text-xs font-medium text-gray-500">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
