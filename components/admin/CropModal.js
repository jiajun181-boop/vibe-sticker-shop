"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const RATIOS = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

const HANDLE_SIZE = 10;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function CropModal({ image, onSave, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ratio, setRatio] = useState(null); // null = free
  const [displayScale, setDisplayScale] = useState(1);

  // Crop rect in image-space coordinates
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Drag state
  const dragRef = useRef(null); // { type, startX, startY, startCrop }

  // Load image
  useEffect(() => {
    if (!image?.url) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      // Initial crop = full image with 10% inset
      const inset = 0.1;
      setCrop({
        x: Math.round(img.naturalWidth * inset),
        y: Math.round(img.naturalHeight * inset),
        w: Math.round(img.naturalWidth * (1 - 2 * inset)),
        h: Math.round(img.naturalHeight * (1 - 2 * inset)),
      });
      setImgLoaded(true);
    };
    img.onerror = () => {
      const img2 = new window.Image();
      img2.onload = () => {
        imgRef.current = img2;
        const inset = 0.1;
        setCrop({
          x: Math.round(img2.naturalWidth * inset),
          y: Math.round(img2.naturalHeight * inset),
          w: Math.round(img2.naturalWidth * (1 - 2 * inset)),
          h: Math.round(img2.naturalHeight * (1 - 2 * inset)),
        });
        setImgLoaded(true);
      };
      img2.src = image.url;
    };
    img.src = image.url;
  }, [image?.url]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const container = containerRef.current;
    const maxW = container ? container.clientWidth - 32 : 600;
    const maxH = 500;

    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    setDisplayScale(scale);

    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const ctx = canvas.getContext("2d");

    // Draw image
    ctx.drawImage(img, 0, 0, w, h);

    // Dark overlay outside crop
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, w, h);

    // Clear crop area (show image)
    const cx = crop.x * scale;
    const cy = crop.y * scale;
    const cw = crop.w * scale;
    const ch = crop.h * scale;

    ctx.clearRect(cx, cy, cw, ch);
    ctx.drawImage(
      img,
      crop.x, crop.y, crop.w, crop.h,
      cx, cy, cw, ch
    );

    // Crop border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // Rule of thirds grid
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + (cw * i) / 3, cy);
      ctx.lineTo(cx + (cw * i) / 3, cy + ch);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + (ch * i) / 3);
      ctx.lineTo(cx + cw, cy + (ch * i) / 3);
      ctx.stroke();
    }

    // Corner handles
    ctx.fillStyle = "#fff";
    const hs = HANDLE_SIZE * (1 / scale > 1.5 ? 1.5 : 1);
    const corners = [
      [cx, cy],
      [cx + cw, cy],
      [cx, cy + ch],
      [cx + cw, cy + ch],
    ];
    corners.forEach(([hx, hy]) => {
      ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    });

    // Edge midpoint handles
    const edges = [
      [cx + cw / 2, cy],
      [cx + cw / 2, cy + ch],
      [cx, cy + ch / 2],
      [cx + cw, cy + ch / 2],
    ];
    edges.forEach(([hx, hy]) => {
      ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    });

    // Dimensions label
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    const label = `${crop.w} × ${crop.h}`;
    ctx.font = "12px system-ui, sans-serif";
    const tm = ctx.measureText(label);
    const lx = cx + cw / 2 - tm.width / 2 - 6;
    const ly = cy + ch + 6;
    if (ly + 20 < h) {
      ctx.fillRect(lx, ly, tm.width + 12, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, lx + 6, ly + 14);
    } else {
      ctx.fillRect(lx, cy - 26, tm.width + 12, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, lx + 6, cy - 12);
    }
  }, [imgLoaded, crop]);

  useEffect(() => {
    if (imgLoaded) renderCanvas();
  }, [imgLoaded, renderCanvas]);

  // --- Determine what's under cursor ---
  function hitTest(canvasX, canvasY) {
    const scale = displayScale;
    const cx = crop.x * scale;
    const cy = crop.y * scale;
    const cw = crop.w * scale;
    const ch = crop.h * scale;
    const hs = HANDLE_SIZE + 4; // hit tolerance

    // Corner handles
    const corners = [
      { x: cx, y: cy, type: "nw" },
      { x: cx + cw, y: cy, type: "ne" },
      { x: cx, y: cy + ch, type: "sw" },
      { x: cx + cw, y: cy + ch, type: "se" },
    ];
    for (const c of corners) {
      if (Math.abs(canvasX - c.x) < hs && Math.abs(canvasY - c.y) < hs) return c.type;
    }

    // Edge handles
    const edges = [
      { x: cx + cw / 2, y: cy, type: "n" },
      { x: cx + cw / 2, y: cy + ch, type: "s" },
      { x: cx, y: cy + ch / 2, type: "w" },
      { x: cx + cw, y: cy + ch / 2, type: "e" },
    ];
    for (const e of edges) {
      if (Math.abs(canvasX - e.x) < hs && Math.abs(canvasY - e.y) < hs) return e.type;
    }

    // Inside crop = move
    if (canvasX >= cx && canvasX <= cx + cw && canvasY >= cy && canvasY <= cy + ch) {
      return "move";
    }

    return null;
  }

  function getCanvasXY(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    const pos = getCanvasXY(e);
    const type = hitTest(pos.x, pos.y);
    if (!type) return;
    dragRef.current = { type, startX: pos.x, startY: pos.y, startCrop: { ...crop } };
  }

  function handlePointerMove(e) {
    const d = dragRef.current;
    if (!d) {
      // Update cursor
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pos = getCanvasXY(e);
      const type = hitTest(pos.x, pos.y);
      const cursors = {
        nw: "nw-resize", ne: "ne-resize", sw: "sw-resize", se: "se-resize",
        n: "n-resize", s: "s-resize", w: "w-resize", e: "e-resize",
        move: "move",
      };
      canvas.style.cursor = cursors[type] || "crosshair";
      return;
    }

    e.preventDefault();
    const pos = getCanvasXY(e);
    const scale = displayScale;
    const dx = (pos.x - d.startX) / scale;
    const dy = (pos.y - d.startY) / scale;
    const img = imgRef.current;
    if (!img) return;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const sc = d.startCrop;
    const minSize = 20;

    let nx = sc.x, ny = sc.y, nw = sc.w, nh = sc.h;

    if (d.type === "move") {
      nx = clamp(sc.x + dx, 0, imgW - sc.w);
      ny = clamp(sc.y + dy, 0, imgH - sc.h);
      nw = sc.w;
      nh = sc.h;
    } else {
      // Resize
      if (d.type.includes("w")) {
        const newX = clamp(sc.x + dx, 0, sc.x + sc.w - minSize);
        nw = sc.w - (newX - sc.x);
        nx = newX;
      }
      if (d.type.includes("e")) {
        nw = clamp(sc.w + dx, minSize, imgW - sc.x);
      }
      if (d.type.includes("n")) {
        const newY = clamp(sc.y + dy, 0, sc.y + sc.h - minSize);
        nh = sc.h - (newY - sc.y);
        ny = newY;
      }
      if (d.type.includes("s")) {
        nh = clamp(sc.h + dy, minSize, imgH - sc.y);
      }

      // Enforce aspect ratio
      if (ratio) {
        if (d.type === "n" || d.type === "s") {
          nw = Math.round(nh * ratio);
          if (nx + nw > imgW) { nw = imgW - nx; nh = Math.round(nw / ratio); }
        } else if (d.type === "w" || d.type === "e") {
          nh = Math.round(nw / ratio);
          if (ny + nh > imgH) { nh = imgH - ny; nw = Math.round(nh * ratio); }
        } else {
          // Corner — use the dominant axis
          const newRatio = nw / nh;
          if (newRatio > ratio) {
            nw = Math.round(nh * ratio);
          } else {
            nh = Math.round(nw / ratio);
          }
          // Re-anchor based on direction
          if (d.type.includes("w")) nx = sc.x + sc.w - nw;
          if (d.type.includes("n")) ny = sc.y + sc.h - nh;
        }
      }
    }

    setCrop({
      x: Math.round(clamp(nx, 0, imgW - minSize)),
      y: Math.round(clamp(ny, 0, imgH - minSize)),
      w: Math.round(Math.max(minSize, nw)),
      h: Math.round(Math.max(minSize, nh)),
    });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  // Apply ratio constraint when ratio changes
  useEffect(() => {
    if (!ratio || !imgRef.current) return;
    setCrop((prev) => {
      const newH = Math.round(prev.w / ratio);
      const imgH = imgRef.current.naturalHeight;
      if (prev.y + newH > imgH) {
        const h = imgH - prev.y;
        const w = Math.round(h * ratio);
        return { ...prev, w, h };
      }
      return { ...prev, h: newH };
    });
  }, [ratio]);

  // --- Save ---
  async function handleSave(replaceOriginal) {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);
    try {
      // Draw cropped region at full resolution
      const outCanvas = document.createElement("canvas");
      outCanvas.width = crop.w;
      outCanvas.height = crop.h;
      const ctx = outCanvas.getContext("2d");
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

      const blob = await new Promise((resolve) => outCanvas.toBlob(resolve, "image/png"));
      const file = new File([blob], `cropped-${Date.now()}.png`, { type: "image/png" });
      await onSave(file, replaceOriginal ? image.id : null);
      onClose();
    } catch (err) {
      console.error("Crop save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-[3px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-3">
          <h2 className="text-sm font-semibold text-black">Crop Image</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#999] hover:bg-[#f5f5f5] hover:text-black">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ratio bar */}
        <div className="flex items-center gap-2 border-b border-[#e0e0e0] px-5 py-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#999]">Ratio</span>
          {RATIOS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRatio(r.value)}
              className={`rounded-[3px] border px-2.5 py-1 text-xs font-medium ${
                ratio === r.value
                  ? "border-black bg-black text-white"
                  : "border-[#d0d0d0] text-[#666] hover:bg-[#fafafa]"
              }`}
            >
              {r.label}
            </button>
          ))}
          {imgRef.current && (
            <span className="ml-auto text-[10px] text-[#999]">
              Original: {imgRef.current.naturalWidth} × {imgRef.current.naturalHeight}
            </span>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex flex-1 items-center justify-center overflow-auto bg-[#1a1a1a] p-4"
        >
          {!imgLoaded ? (
            <div className="text-xs text-[#999]">Loading image...</div>
          ) : (
            <canvas
              ref={canvasRef}
              style={{ touchAction: "none" }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e0e0e0] px-5 py-3">
          <p className="text-[10px] text-[#999]">
            Crop: {crop.w} × {crop.h}px
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-[#666] hover:bg-[#fafafa]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !imgLoaded}
              onClick={() => handleSave(false)}
              className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as New"}
            </button>
            <button
              type="button"
              disabled={saving || !imgLoaded}
              onClick={() => handleSave(true)}
              className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Replace Original"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
