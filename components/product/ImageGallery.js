"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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
  const activeIndex = list.length > 0 ? active % list.length : 0;
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

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeImage?.url ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt || safeName}
            fill
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            style={{
              objectPosition: `${(activeImage.focalX ?? 0.5) * 100}% ${(activeImage.focalY ?? 0.5) * 100}%`,
            }}
            sizes="(max-width: 1024px) 100vw, 58vw"
            priority
            unoptimized={activeImage.mimeType === "image/svg+xml" || activeImage.url.endsWith(".svg")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}

        {canNav && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {canNav && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
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
                idx === activeIndex ? "border-gray-900 ring-2 ring-gray-200" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || safeName}
                fill
                className="object-cover"
                style={{
                  objectPosition: `${(img.focalX ?? 0.5) * 100}% ${(img.focalY ?? 0.5) * 100}%`,
                }}
                sizes="64px"
                unoptimized={img.mimeType === "image/svg+xml" || img.url.endsWith(".svg")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
