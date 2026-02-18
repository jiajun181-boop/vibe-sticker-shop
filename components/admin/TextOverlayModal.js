"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const FONTS = [
  { name: "Playfair Display", label: "Playfair Display", style: "Elegant serif" },
  { name: "Dancing Script", label: "Dancing Script", style: "Cursive calligraphy" },
  { name: "Pacifico", label: "Pacifico", style: "Handwritten" },
  { name: "Lobster", label: "Lobster", style: "Retro decorative" },
  { name: "Great Vibes", label: "Great Vibes", style: "Elegant script" },
  { name: "Bebas Neue", label: "Bebas Neue", style: "Bold condensed" },
  { name: "Permanent Marker", label: "Permanent Marker", style: "Marker/graffiti" },
  { name: "Caveat", label: "Caveat", style: "Casual handwritten" },
];

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=" +
  FONTS.map((f) => f.name.replace(/ /g, "+") + ":wght@400;700").join("&family=") +
  "&display=swap";

function injectGoogleFonts() {
  if (document.getElementById("text-overlay-gfonts")) return;
  const link = document.createElement("link");
  link.id = "text-overlay-gfonts";
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_URL;
  document.head.appendChild(link);
}

export default function TextOverlayModal({ image, onSave, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const [fontsReady, setFontsReady] = useState(false);
  const [text, setText] = useState("Your Text Here");
  const [font, setFont] = useState(FONTS[0].name);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [textAlign, setTextAlign] = useState("center");
  const [strokeEnabled, setStrokeEnabled] = useState(true);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [textPos, setTextPos] = useState({ x: 0.5, y: 0.5 }); // normalized 0-1
  const [saving, setSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load Google Fonts on mount
  useEffect(() => {
    injectGoogleFonts();
    const loadAll = FONTS.map((f) =>
      document.fonts.load(`bold 48px "${f.name}"`).catch(() => {})
    );
    Promise.all(loadAll).then(() => setFontsReady(true));
    // Fallback: mark ready after 3s even if some fonts fail
    const t = setTimeout(() => setFontsReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Load the source image
  useEffect(() => {
    if (!image?.url) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      // Retry without crossOrigin for same-origin images
      const img2 = new window.Image();
      img2.onload = () => {
        imgRef.current = img2;
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
    const maxW = container ? container.clientWidth : 600;
    const maxH = 500;

    // Scale image to fit canvas
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (!text.trim()) return;

    // Font setup
    const weight = bold ? "bold" : "normal";
    const style = italic ? "italic" : "normal";
    const realFontSize = (fontSize / scale); // scale font to full-res canvas
    ctx.font = `${style} ${weight} ${realFontSize}px "${font}"`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";
    ctx.globalAlpha = opacity / 100;

    const x = textPos.x * canvas.width;
    const y = textPos.y * canvas.height;

    // Shadow
    if (shadowEnabled) {
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = realFontSize * 0.15;
      ctx.shadowOffsetX = realFontSize * 0.05;
      ctx.shadowOffsetY = realFontSize * 0.05;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Multi-line support
    const lines = text.split("\n");
    const lineHeight = realFontSize * 1.25;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
      const ly = startY + i * lineHeight;
      if (strokeEnabled) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(2, realFontSize * 0.06);
        ctx.lineJoin = "round";
        ctx.strokeText(line, x, ly);
      }
      ctx.fillStyle = color;
      ctx.fillText(line, x, ly);
    });

    ctx.globalAlpha = 1;
  }, [imgLoaded, text, font, fontSize, color, bold, italic, textAlign, strokeEnabled, strokeColor, shadowEnabled, opacity, textPos]);

  useEffect(() => {
    if (fontsReady && imgLoaded) renderCanvas();
  }, [fontsReady, imgLoaded, renderCanvas]);

  // Also re-render when specific font loads
  useEffect(() => {
    if (!fontsReady) return;
    document.fonts.load(`${bold ? "bold" : "normal"} ${fontSize}px "${font}"`).then(() => renderCanvas());
  }, [font, bold, fontSize, fontsReady, renderCanvas]);

  // --- Drag handlers ---
  function getCanvasPos(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0.5, y: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    draggingRef.current = true;
    const pos = getCanvasPos(e);
    dragStartRef.current = { x: pos.x, y: pos.y, tx: textPos.x, ty: textPos.y };
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const dx = pos.x - dragStartRef.current.x;
    const dy = pos.y - dragStartRef.current.y;
    setTextPos({
      x: Math.max(0, Math.min(1, dragStartRef.current.tx + dx)),
      y: Math.max(0, Math.min(1, dragStartRef.current.ty + dy)),
    });
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  // --- Save ---
  async function handleSave(replaceOriginal) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], `text-overlay-${Date.now()}.png`, { type: "image/png" });
      await onSave(file, replaceOriginal ? image.id : null);
      onClose();
    } catch (err) {
      console.error("Text overlay save failed:", err);
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
          <h2 className="text-sm font-semibold text-black">Text Overlay</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#999] hover:bg-[#f5f5f5] hover:text-black">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-auto md:flex-row">
          {/* Canvas area */}
          <div
            ref={containerRef}
            className="flex flex-1 items-center justify-center bg-[#f0f0f0] p-4"
          >
            {!imgLoaded ? (
              <div className="text-xs text-[#999]">Loading image...</div>
            ) : (
              <canvas
                ref={canvasRef}
                className="cursor-move border border-[#d0d0d0] shadow-sm"
                style={{ touchAction: "none", maxWidth: "100%" }}
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

          {/* Controls panel */}
          <div className="w-full border-t border-[#e0e0e0] md:w-72 md:border-l md:border-t-0 overflow-y-auto">
            <div className="space-y-3 p-4">
              {/* Text input */}
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">Text</label>
                <textarea
                  rows={2}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
                  placeholder="Enter text..."
                />
              </div>

              {/* Font selector */}
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">Font</label>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
                >
                  {FONTS.map((f) => (
                    <option key={f.name} value={f.name} style={{ fontFamily: `"${f.name}", cursive` }}>
                      {f.label} — {f.style}
                    </option>
                  ))}
                </select>
                {/* Font preview */}
                <div
                  className="mt-1.5 rounded border border-[#e0e0e0] bg-[#fafafa] px-3 py-2 text-center"
                  style={{ fontFamily: `"${font}", cursive`, fontSize: "18px" }}
                >
                  {text.split("\n")[0] || "Preview"}
                </div>
              </div>

              {/* Size slider */}
              <div>
                <label className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-[#999]">
                  <span>Size</span>
                  <span className="text-black">{fontSize}px</span>
                </label>
                <input
                  type="range"
                  min={12}
                  max={200}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-black"
                />
              </div>

              {/* Color */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border border-[#d0d0d0]" />
                    <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 rounded-[3px] border border-[#d0d0d0] px-2 py-1 font-mono text-xs outline-none focus:border-gray-900" />
                  </div>
                </div>
              </div>

              {/* Stroke */}
              <div>
                <label className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[#999]">
                  <input type="checkbox" checked={strokeEnabled} onChange={(e) => setStrokeEnabled(e.target.checked)} className="rounded" />
                  <span>Stroke</span>
                </label>
                {strokeEnabled && (
                  <div className="mt-1 flex items-center gap-2">
                    <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="h-7 w-7 cursor-pointer rounded border border-[#d0d0d0]" />
                    <span className="font-mono text-xs text-[#666]">{strokeColor}</span>
                  </div>
                )}
              </div>

              {/* Shadow toggle */}
              <label className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[#999]">
                <input type="checkbox" checked={shadowEnabled} onChange={(e) => setShadowEnabled(e.target.checked)} className="rounded" />
                <span>Shadow</span>
              </label>

              {/* Bold / Italic */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBold(!bold)}
                  className={`flex-1 rounded-[3px] border px-2 py-1.5 text-xs font-bold ${bold ? "border-black bg-black text-white" : "border-[#d0d0d0] text-[#666] hover:bg-[#fafafa]"}`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setItalic(!italic)}
                  className={`flex-1 rounded-[3px] border px-2 py-1.5 text-xs italic ${italic ? "border-black bg-black text-white" : "border-[#d0d0d0] text-[#666] hover:bg-[#fafafa]"}`}
                >
                  I
                </button>
              </div>

              {/* Text align */}
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">Align</label>
                <div className="flex gap-1">
                  {["left", "center", "right"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setTextAlign(a)}
                      className={`flex-1 rounded-[3px] border px-2 py-1.5 text-xs capitalize ${textAlign === a ? "border-black bg-black text-white" : "border-[#d0d0d0] text-[#666] hover:bg-[#fafafa]"}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-[#999]">
                  <span>Opacity</span>
                  <span className="text-black">{opacity}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e0e0e0] px-5 py-3">
          <p className="text-[10px] text-[#999]">Drag text on canvas to reposition</p>
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
