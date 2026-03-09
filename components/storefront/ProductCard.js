"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import { getProductImage, isSvgImage } from "@/lib/product-image";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/**
 * Unified product card for all storefront category/family pages.
 *
 * Props:
 * - product      — { slug, name, description, fromPrice, basePrice, images, category, badge?, ctaKey? }
 * - href         — link URL (default: /shop/{category}/{slug})
 * - imageSrc     — resolved image URL (falls back to getProductImage)
 * - hoverImageSrc — optional second image for hover swap
 * - badge        — { label, color } overrides product.badge if both set
 * - showTurnaround — show turnaround badge (default: true)
 * - showDescription — show product description (default: false)
 * - gradientFallback — tailwind gradient class for when no image (e.g. "from-violet-400 to-fuchsia-400")
 * - aspect       — image aspect ratio class (default: "aspect-[4/3]")
 * - ctaKey        — i18n key for CTA (default: product.ctaKey or "shop.configure")
 * - children     — optional extra content below CTA
 */
export default function ProductCard({
  product,
  href,
  imageSrc,
  hoverImageSrc,
  badge,
  showTurnaround = true,
  showDescription = false,
  gradientFallback = "from-gray-200 to-gray-300",
  aspect = "aspect-[4/3]",
  ctaKey,
  children,
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  const resolvedHref = href || `/shop/${product.category}/${product.slug}`;
  const resolvedImage = imageSrc || getProductImage(product, product.category);
  const showUrl = hovered && hoverImageSrc ? hoverImageSrc : resolvedImage;
  const isSvg = showUrl && isSvgImage(showUrl);
  const price = product.fromPrice || product.basePrice || 0;
  const turnaround = showTurnaround ? getTurnaround(product) : null;
  const resolvedBadge = badge || product.badge;
  const resolvedCtaKey = ctaKey || product.ctaKey || "shop.configure";

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={resolvedHref} className="block">
        <div className={`relative ${aspect} overflow-hidden bg-[var(--color-gray-100)]`}>
          {showUrl ? (
            isSvg ? (
              <img
                src={showUrl}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <Image
                src={showUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              />
            )
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFallback}`}>
              <p className="px-4 text-center text-sm font-bold text-white drop-shadow-md">
                {product.name}
              </p>
            </div>
          )}

          {/* Turnaround badge */}
          {turnaround && (
            <span className={`absolute top-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white ${turnaroundColor(turnaround)}`}>
              {t(turnaroundI18nKey(turnaround))}
            </span>
          )}

          {/* Product badge (e.g. Best Seller) */}
          {resolvedBadge && (
            <span className={`absolute ${turnaround ? "top-7" : "top-1.5"} left-1.5 max-w-[calc(100%-12px)] truncate rounded-full px-2 py-0.5 text-[10px] font-bold ${resolvedBadge.color}`}>
              {resolvedBadge.label}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={resolvedHref}>
          <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-snug line-clamp-2 group-hover:text-[var(--color-brand)] transition-colors">
            {product.name}
          </h3>
        </Link>

        {showDescription && product.description && (
          <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-xs font-bold text-[var(--color-gray-900)]">
              {t("shop.fromLabel")} {formatCad(price)}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--color-gray-400)]">{t("shop.getQuote")}</span>
          )}
          <Link
            href={resolvedHref}
            className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-dark)]"
          >
            {t(resolvedCtaKey)}
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        {children}
      </div>
    </article>
  );
}
