"use client";

import { useState } from "react";
import Image from "next/image";
import { isSvgImage } from "@/lib/product-image";

export default function ConfigProductGallery({ images, inline }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images || images.length === 0) {
    const placeholder = (
      <div className="overflow-hidden rounded-2xl bg-gray-100">
        <div className="flex aspect-[4/3] w-full items-center justify-center sm:aspect-[16/9]">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-400">Product Image</p>
          </div>
        </div>
      </div>
    );
    if (inline) return placeholder;
    return (
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
        {placeholder}
      </div>
    );
  }

  const main = images[activeIdx] || images[0];

  const inner = (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Main image */}
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
          <Image
            src={main.url}
            alt={main.alt || main.altOverride || "Product image"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 1600px"
            priority
            unoptimized={isSvgImage(main.url)}
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
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  i === activeIdx
                    ? "border-gray-900 ring-2 ring-gray-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || img.altOverride || `Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized={isSvgImage(img.url)}
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
