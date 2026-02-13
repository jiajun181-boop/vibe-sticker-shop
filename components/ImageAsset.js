"use client";

import Image from "next/image";

// Purpose → responsive sizes
const SIZES_MAP = {
  hero: "(max-width: 768px) 100vw, 100vw",
  gallery: "(max-width: 1024px) 100vw, 58vw",
  card: "(max-width: 768px) 50vw, 25vw",
  thumbnail: "64px",
  banner: "(max-width: 768px) 100vw, 80vw",
  logo: "128px",
  background: "100vw",
  other: "(max-width: 768px) 100vw, 50vw",
};

// Purpose → default dimensions
const DIMS_MAP = {
  hero: { width: 1200, height: 675 },
  gallery: { width: 800, height: 800 },
  card: { width: 400, height: 300 },
  thumbnail: { width: 128, height: 128 },
  banner: { width: 1200, height: 400 },
  logo: { width: 128, height: 128 },
  background: { width: 1920, height: 1080 },
  other: { width: 600, height: 600 },
};

/**
 * Unified image component for the asset system.
 *
 * @param {object} props
 * @param {object} props.asset - Asset data: { url, alt, focalX, focalY, mimeType, widthPx, heightPx }
 * @param {string} [props.purpose="card"] - Image purpose for responsive sizing
 * @param {string} [props.alt] - Override alt text
 * @param {string} [props.className=""] - Additional CSS classes
 * @param {boolean} [props.fill=false] - Use fill mode (parent must be position: relative)
 * @param {boolean} [props.priority=false] - Load with priority (above-the-fold images)
 * @param {object} [props.style] - Additional inline styles
 */
export default function ImageAsset({
  asset,
  purpose = "card",
  alt,
  className = "",
  fill = false,
  priority = false,
  style,
  ...rest
}) {
  if (!asset?.url) return null;

  const isSvg =
    asset.mimeType === "image/svg+xml" || asset.url?.endsWith(".svg");

  const dims = DIMS_MAP[purpose] || DIMS_MAP.card;
  const sizes = SIZES_MAP[purpose] || SIZES_MAP.card;
  const altText = alt || asset.alt || asset.altText || "";

  // Focal point → CSS object-position
  const focalX = asset.focalX ?? 0.5;
  const focalY = asset.focalY ?? 0.5;
  const objectPosition = `${focalX * 100}% ${focalY * 100}%`;

  const imgProps = {
    src: asset.url,
    alt: altText,
    className: `object-cover ${className}`,
    style: { objectPosition, ...style },
    sizes,
    unoptimized: isSvg,
    priority,
    ...rest,
  };

  if (fill) {
    return <Image {...imgProps} fill />;
  }

  return (
    <Image
      {...imgProps}
      width={asset.widthPx || dims.width}
      height={asset.heightPx || dims.height}
    />
  );
}
