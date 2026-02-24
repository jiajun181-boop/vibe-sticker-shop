"use client";

import { useState, useEffect } from "react";

/**
 * BusinessCardPreview — Visual 3D business card mockup with paper texture hints.
 * Shows the selected card type, sides, rounded corners, and uploaded artwork.
 */

const TEXTURES = {
  classic: { bg: "#ffffff", label: "14pt Classic", pattern: null, shine: false },
  gloss: { bg: "#ffffff", label: "Gloss UV", pattern: null, shine: true },
  matte: { bg: "#fafaf8", label: "Matte Finish", pattern: null, shine: false },
  "soft-touch": { bg: "#f8f7f4", label: "Soft Touch", pattern: "softtouch", shine: false },
  "gold-foil": { bg: "#ffffff", label: "Gold Foil", pattern: "foil", shine: true },
  linen: { bg: "#faf8f5", label: "Linen Texture", pattern: "linen", shine: false },
  pearl: { bg: "#faf9f7", label: "Pearl Shimmer", pattern: "pearl", shine: true },
  thick: { bg: "#ffffff", label: "32pt Ultra Thick", pattern: null, shine: false },
  magnet: { bg: "#f5f5f5", label: "Magnetic", pattern: "magnet", shine: false },
};

function CardFace({ imageUrl, cardType, rounded, side, flipped }) {
  const texture = TEXTURES[cardType] || TEXTURES.classic;
  const rx = rounded ? "8" : "2";
  const isThick = cardType === "thick";

  return (
    <svg viewBox="0 0 210 120" className="w-full">
      <defs>
        {/* Gloss/Pearl shine overlay */}
        <linearGradient id={`shine-${side}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="40%" stopColor="white" stopOpacity={texture.shine ? "0.15" : "0"} />
          <stop offset="60%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity={texture.shine ? "0.08" : "0"} />
        </linearGradient>
        {/* Linen texture pattern */}
        <pattern id={`linen-${side}`} patternUnits="userSpaceOnUse" width="4" height="4">
          <line x1="0" y1="0" x2="4" y2="0" stroke="#e5e0d5" strokeWidth="0.3" />
          <line x1="0" y1="2" x2="4" y2="2" stroke="#e5e0d5" strokeWidth="0.3" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="#e5e0d5" strokeWidth="0.3" />
          <line x1="2" y1="0" x2="2" y2="4" stroke="#e5e0d5" strokeWidth="0.3" />
        </pattern>
        {/* Soft-touch micro texture */}
        <filter id={`soft-${side}`}>
          <feTurbulence baseFrequency="0.8" numOctaves="3" seed="42" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
          <feBlend in="SourceGraphic" in2="gray" mode="multiply" />
        </filter>
        {/* Drop shadow */}
        <filter id={`shadow-${side}`}>
          <feDropShadow dx="2" dy={isThick ? "4" : "2"} stdDeviation={isThick ? "4" : "3"} floodOpacity="0.15" />
        </filter>
        {/* Card clip path for rounded/sharp corners */}
        <clipPath id={`clip-${side}`}>
          <rect x="10" y="10" width="190" height="100" rx={rx} />
        </clipPath>
      </defs>

      {/* Card shadow */}
      <rect x="10" y="10" width="190" height="100" rx={rx} fill="white" filter={`url(#shadow-${side})`} />

      {/* Card edge (thickness) — visible on thick cards */}
      {isThick && (
        <rect x="10" y="107" width="190" height="4" rx="1" fill="#d1d5db" />
      )}

      {/* Card body */}
      <rect x="10" y="10" width="190" height="100" rx={rx} fill={texture.bg} stroke="#e5e7eb" strokeWidth="0.5" />

      {/* Uploaded artwork */}
      {imageUrl && (
        <image
          href={imageUrl}
          x="10" y="10" width="190" height="100"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#clip-${side})`}
        />
      )}

      {/* Pattern overlays */}
      {texture.pattern === "linen" && (
        <rect x="10" y="10" width="190" height="100" rx={rx} fill={`url(#linen-${side})`} opacity="0.5" />
      )}

      {texture.pattern === "pearl" && (
        <>
          <rect x="10" y="10" width="190" height="100" rx={rx} fill={`url(#shine-${side})`} />
          <rect x="10" y="10" width="190" height="100" rx={rx} fill="white" opacity="0.03" />
        </>
      )}

      {texture.pattern === "foil" && !imageUrl && (
        <>
          {/* Gold foil accent lines */}
          <rect x="20" y="20" width="80" height="2" rx="1" fill="#c5a55a" opacity="0.6" />
          <rect x="20" y="28" width="50" height="1.5" rx="0.75" fill="#c5a55a" opacity="0.4" />
          <rect x="20" y="85" width="120" height="1" rx="0.5" fill="#c5a55a" opacity="0.3" />
        </>
      )}

      {texture.pattern === "magnet" && (
        <>
          {/* Magnet indicator stripe */}
          <rect x="10" y="100" width="190" height="10" rx={`0 0 ${rx} ${rx}`} fill="#6b7280" opacity="0.15" />
          <text x="105" y="108" textAnchor="middle" fill="#9ca3af" fontSize="5" fontFamily="system-ui">MAGNETIC</text>
        </>
      )}

      {/* Shine overlay */}
      {texture.shine && (
        <rect x="10" y="10" width="190" height="100" rx={rx} fill={`url(#shine-${side})`} />
      )}

      {/* Placeholder text (when no artwork) */}
      {!imageUrl && !flipped && (
        <g opacity="0.25">
          <rect x="20" y="42" width="60" height="6" rx="3" fill="#9ca3af" />
          <rect x="20" y="52" width="90" height="4" rx="2" fill="#d1d5db" />
          <rect x="20" y="60" width="70" height="3" rx="1.5" fill="#d1d5db" />
          <rect x="20" y="67" width="50" height="3" rx="1.5" fill="#d1d5db" />
          <rect x="150" y="20" width="40" height="40" rx="4" fill="#e5e7eb" />
        </g>
      )}

      {/* Back side indicator */}
      {flipped && !imageUrl && (
        <g opacity="0.15">
          <rect x="50" y="35" width="110" height="4" rx="2" fill="#9ca3af" />
          <rect x="65" y="45" width="80" height="3" rx="1.5" fill="#d1d5db" />
          <rect x="75" y="55" width="60" height="3" rx="1.5" fill="#d1d5db" />
          <rect x="80" y="65" width="50" height="3" rx="1.5" fill="#d1d5db" />
        </g>
      )}

      {/* Label */}
      <text x="105" y="122" textAnchor="middle" fill="#9ca3af" fontSize="6" fontFamily="system-ui, sans-serif">
        {texture.label}
      </text>
    </svg>
  );
}

export default function BusinessCardPreview({
  cardType = "classic",
  sides = "double",
  rounded = false,
  imageUrl = null,
}) {
  const [showBack, setShowBack] = useState(false);
  const isDouble = sides === "double";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Card face */}
      <div className="relative w-full">
        <CardFace
          imageUrl={showBack ? null : imageUrl}
          cardType={cardType}
          rounded={rounded}
          side={showBack ? "back" : "front"}
          flipped={showBack}
        />
      </div>

      {/* Front/Back toggle (only for double-sided) */}
      {isDouble && (
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
          <button
            type="button"
            onClick={() => setShowBack(false)}
            className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${
              !showBack
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setShowBack(true)}
            className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${
              showBack
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Back
          </button>
        </div>
      )}

      {/* Size label */}
      <span className="text-[11px] text-gray-400">
        3.5&quot; &times; 2&quot; {rounded ? "— Rounded Corners" : ""}
      </span>
    </div>
  );
}
