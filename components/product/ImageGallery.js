"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/* ── Lightbox (full-screen zoom viewer) ── */
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const img = images[idx];
  const canNav = images.length > 1;

  // Navigate and reset zoom/pan together
  const goTo = useCallback((nextIdx) => {
    setIdx(nextIdx);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard controls
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && canNav) goTo((idx - 1 + images.length) % images.length);
      if (e.key === "ArrowRight" && canNav) goTo((idx + 1) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canNav, images.length, onClose, goTo, idx]);

  // Toggle zoom on click (fit ↔ 2×)
  const toggleZoom = useCallback((e) => {
    e.stopPropagation();
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Scroll to zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => {
      const next = clamp(z + (e.deltaY < 0 ? 0.25 : -0.25), 1, 4);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Pan while zoomed (mouse drag)
  const onPointerDown = useCallback((e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [zoom, pan]);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  // Touch swipe navigation (only when not zoomed)
  const touchRef = useRef({ startX: 0, startY: 0 });
  const onTouchStart = useCallback((e) => {
    if (zoom > 1) return;
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
  }, [zoom]);
  const onTouchEnd = useCallback((e) => {
    if (zoom > 1 || !canNav) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goTo(dx < 0 ? (idx + 1) % images.length : (idx - 1 + images.length) % images.length);
    }
  }, [zoom, canNav, images.length, goTo, idx]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Zoom hint */}
      <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
        {zoom > 1 ? `${Math.round(zoom * 100)}%` : "Click to zoom"}
        {canNav && <span className="ml-2 text-white/50">{idx + 1} / {images.length}</span>}
      </div>

      {/* Prev / Next */}
      {canNav && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goTo((idx - 1 + images.length) % images.length); }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Previous image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goTo((idx + 1) % images.length); }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Next image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Main image */}
      <div
        className="relative h-[85vh] w-[90vw] max-w-5xl select-none"
        onClick={toggleZoom}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ cursor: zoom > 1 ? "grab" : "zoom-in" }}
      >
        {img?.url && (
          <Image
            src={img.url}
            alt={img.alt || "Product image"}
            fill
            className="pointer-events-none object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            sizes="90vw"
            priority
            unoptimized={img.mimeType === "image/svg+xml" || img.url.endsWith(".svg")}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * @param {object} props
 * @param {Array} props.images - Array of image objects with { url, alt, focalX?, focalY?, mimeType? }
 * @param {string} [props.productName] - Fallback alt text
 */
export default function ImageGallery({ images, productName }) {
  const list = useMemo(
    () => (Array.isArray(images) ? images.filter((x) => x && x.url) : []),
    [images]
  );
  const safeName = productName || "Product image";

  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(() => new Set());
  const listKey = useMemo(() => list.map((img) => img.url).join("|"), [list]);

  useEffect(() => {
    setActive(0);
    setFailed(new Set());
  }, [listKey]);

  const activeIndex = useMemo(() => {
    if (list.length === 0) return 0;
    const normalized = ((active % list.length) + list.length) % list.length;
    if (!failed.has(normalized)) return normalized;
    for (let i = 0; i < list.length; i += 1) {
      if (!failed.has(i)) return i;
    }
    return normalized;
  }, [active, list.length, failed]);
  const activeImage = list[activeIndex] || null;

  const canNav = list.length > 1;

  const go = useCallback(
    (delta) => {
      if (!canNav) return;
      setActive((idx) => {
        const next = (idx + delta) % list.length;
        return next < 0 ? next + list.length : next;
      });
    },
    [canNav, list.length]
  );

  useEffect(() => {
    function onKeyDown(e) {
      if (!canNav) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canNav, go]);

  // Touch swipe support
  const touchRef = useRef({ startX: 0, startY: 0 });
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchRef.current = { startX: touch.clientX, startY: touch.clientY };
  }, []);
  const handleTouchEnd = useCallback(
    (e) => {
      if (!canNav) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchRef.current.startX;
      const dy = touch.clientY - touchRef.current.startY;
      // Only trigger if horizontal swipe > 50px and mostly horizontal
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        go(dx < 0 ? 1 : -1);
      }
    },
    [canNav, go]
  );

  const thumbs = useMemo(() => list.slice(0, 20), [list]);

  // Lightbox state
  const [lightbox, setLightbox] = useState(false);
  const openLightbox = useCallback(() => {
    if (activeImage?.url) setLightbox(true);
  }, [activeImage]);
  const closeLightbox = useCallback(() => setLightbox(false), []);

  return (
    <div className="space-y-3">
      {lightbox && list.length > 0 && (
        <Lightbox images={list} startIndex={activeIndex} onClose={closeLightbox} />
      )}

      <div
        className="relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-3xl border border-[var(--color-gray-200)] bg-gradient-to-br from-white to-gray-50 shadow-sm cursor-zoom-in"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={openLightbox}
        role="button"
        tabIndex={0}
        aria-label="Click to zoom"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openLightbox(); }}
      >
        {activeImage?.url ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt || safeName}
            fill
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            onError={() => {
              setFailed((prev) => {
                if (prev.has(activeIndex)) return prev;
                const next = new Set(prev);
                next.add(activeIndex);
                return next;
              });
            }}
            style={{
              objectPosition: `${(activeImage.focalX ?? 0.5) * 100}% ${(activeImage.focalY ?? 0.5) * 100}%`,
            }}
            sizes="(max-width: 1024px) 100vw, 58vw"
            priority
            unoptimized={activeImage.mimeType === "image/svg+xml" || activeImage.url.endsWith(".svg")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-gray-400)]">
            No image
          </div>
        )}

        {/* Zoom icon hint */}
        {activeImage?.url && (
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </div>
        )}

        {canNav && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-black/45 text-[#fff] backdrop-blur transition-colors hover:bg-black/60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-black/45 text-[#fff] backdrop-blur transition-colors hover:bg-black/60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {canNav && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl border border-white/30 bg-black/60 px-3 py-1 text-[11px] font-semibold text-[#fff] backdrop-blur">
            {clamp(activeIndex + 1, 1, list.length)} / {list.length}
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 pt-1">
          {thumbs.map((img, idx) => (
            <button
              key={img.id || img.url}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Select image ${idx + 1}`}
              className={`relative h-16 w-16 flex-none snap-start overflow-hidden rounded-xl border transition-all ${
                idx === activeIndex ? "border-[var(--color-gray-900)] ring-2 ring-gray-200" : "border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || safeName}
                fill
                className={`object-cover ${failed.has(idx) ? "opacity-0" : ""}`}
                onError={() => {
                  setFailed((prev) => {
                    if (prev.has(idx)) return prev;
                    const next = new Set(prev);
                    next.add(idx);
                    return next;
                  });
                }}
                style={{
                  objectPosition: `${(img.focalX ?? 0.5) * 100}% ${(img.focalY ?? 0.5) * 100}%`,
                }}
                sizes="64px"
                unoptimized={img.mimeType === "image/svg+xml" || img.url.endsWith(".svg")}
              />
              {failed.has(idx) && (
                <span className="absolute inset-0 flex items-center justify-center bg-[var(--color-gray-100)] text-[10px] font-semibold text-[var(--color-gray-500)]">
                  ERR
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
