"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function ImageGallery({ images, productName }) {
  const list = Array.isArray(images) ? images.filter((x) => x && x.url) : [];
  const safeName = productName || "Product image";

  const [active, setActive] = useState(0);
  const activeImage = list[active] || null;

  useEffect(() => {
    setActive(0);
  }, [list.length]);

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

  const thumbs = useMemo(() => list.slice(0, 20), [list]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-gray-200 bg-white">
        {activeImage?.url ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt || safeName}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 58vw"
            priority
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
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 backdrop-blur hover:bg-white"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 backdrop-blur hover:bg-white"
            >
              Next
            </button>
          </>
        )}

        {canNav && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white">
            {clamp(active + 1, 1, list.length)} / {list.length}
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {thumbs.map((img, idx) => (
            <button
              key={img.id || img.url}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Select image ${idx + 1}`}
              className={`relative h-16 w-16 flex-none overflow-hidden rounded-xl border ${
                idx === active ? "border-gray-900" : "border-gray-200"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || safeName}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

