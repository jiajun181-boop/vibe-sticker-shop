"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import { getProductImage, isSvgImage } from "@/lib/product-image";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function QuickViewModal({ product, onClose, onAddToCart, t }) {
  /* ── Escape key listener ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  /* ── Body scroll lock ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!product) return null;

  /* ── Turnaround badge ── */
  const turnaroundKey = getTurnaround(product);
  const turnaroundLabel = t(turnaroundI18nKey(turnaroundKey));
  const turnaroundBadge = turnaroundColor(turnaroundKey);

  /* ── Price range ── */
  const base = product.basePrice ?? 0;
  const multiplier = product.pricingUnit === "per_sqft" ? 3.5 : 2.2;
  const high = Math.round(base * multiplier);

  /* ── Primary image ── */
  const imgSrc = getProductImage(product);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Product image */}
        <div className="aspect-[4/3] relative w-full bg-gray-100">
          <Image
            src={imgSrc}
            alt={product.name || "Product"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, 32rem"
            unoptimized={isSvgImage(imgSrc)}
          />
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Turnaround badge */}
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${turnaroundBadge}`}>
            {turnaroundLabel}
          </span>

          {/* Product name */}
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            {product.name}
          </h3>

          {/* Price range */}
          <p className="mt-1 text-sm font-medium text-gray-700">
            {formatCad(base)} &ndash; {formatCad(high)}
          </p>

          {/* Description */}
          {product.description && (
            <p className="mt-2 line-clamp-3 text-sm text-gray-500">
              {product.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-5 flex items-center gap-3">
            <Link
              href={`/shop/${product.category}/${product.slug}`}
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("shop.view")}
            </Link>
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="flex-1 rounded-lg bg-black px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              {t("shop.quickAdd")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
