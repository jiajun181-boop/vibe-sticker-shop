"use client";

import { useState } from "react";
import Image from "next/image";

export default function ConfigProductGallery({ images, inline }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images || images.length === 0) return null;

  const main = images[activeIdx] || images[0];

  const inner = (
    <div className="overflow-hidden rounded-2xl bg-gray-50">
        {/* Main image */}
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
          <Image
            src={main.url}
            alt={main.alt || main.altOverride || "Product image"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 1600px"
            priority
          />
        </div>

        {/* Thumbnails — only when multiple images */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {images.map((img, i) => (
              <button
                key={img.id || i}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === activeIdx
                    ? "border-indigo-600 ring-2 ring-indigo-600/30"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || img.altOverride || `Thumbnail ${i + 1}`}
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

  if (inline) return inner;

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
      {inner}
    </div>
  );
}
