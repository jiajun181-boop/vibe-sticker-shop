"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";

// ─── Material Metadata Lookup ────────────────────────────────────────────────
// Keyed by common material IDs. Each entry carries texture info, subtitle,
// description, durability rating, and weight class used by the swatch card
// hover tooltip and auto-subtitle fallback.

export const MATERIAL_META = {
  // Rigid boards
  "4mm-coroplast": { pattern: "fluted", baseColor: "#f5f3ef", subtitle: "4mm Corrugated Plastic", description: "Lightweight, weather-resistant. Great for yard signs.", durability: "Outdoor 1-2 years", weight: "Light" },
  "coroplast": { pattern: "fluted", baseColor: "#f5f3ef", subtitle: "4mm Corrugated Plastic", description: "Lightweight, weather-resistant. Great for yard signs.", durability: "Outdoor 1-2 years", weight: "Light" },
  "foam-board": { pattern: "stipple", baseColor: "#ffffff", subtitle: '3/16"\u20131/2" Polystyrene', description: "Indoor displays and presentations.", durability: "Indoor only", weight: "Ultra-light" },
  // Acrylic removed — no UV flatbed printer available
  "aluminum-040": { pattern: "brushed", baseColor: "#d8dce2", subtitle: "3mm Aluminum Composite", description: "Premium long-term outdoor signage.", durability: "Outdoor 5yr+", weight: "Medium" },
  "aluminum": { pattern: "brushed", baseColor: "#d8dce2", subtitle: "3mm Aluminum Composite", description: "Premium long-term outdoor signage.", durability: "Outdoor 5yr+", weight: "Medium" },
  "pvc-sintra": { pattern: "smooth", baseColor: "#f8f8f8", subtitle: "3mm\u20136mm Expanded PVC", description: "Versatile indoor/outdoor signage.", durability: "Outdoor 3-5 years", weight: "Light" },
  "pvc": { pattern: "smooth", baseColor: "#f8f8f8", subtitle: "3mm\u20136mm Expanded PVC", description: "Versatile indoor/outdoor signage.", durability: "Outdoor 3-5 years", weight: "Light" },
  // Banners
  "13oz-vinyl": { pattern: "woven", baseColor: "#faf8f5", subtitle: "13oz Scrim Vinyl", description: "Standard outdoor banners.", durability: "Outdoor 2-3 years", weight: "Medium" },
  "8oz-mesh": { pattern: "mesh", baseColor: "#f2f0ed", subtitle: "8oz Mesh Vinyl", description: "Wind-through banners for fences.", durability: "Outdoor 2 years", weight: "Light" },
  "canvas": { pattern: "canvas", baseColor: "#faf5ee", subtitle: "17mil Poly-Cotton", description: "Art prints and displays.", durability: "Indoor", weight: "Medium" },
  // Stickers
  "white-vinyl": { pattern: "smooth-white", baseColor: "#ffffff", subtitle: "3mil White Vinyl", description: "Durable, waterproof stickers.", durability: "Outdoor 3-5 years", weight: "Light" },
  "matte": { pattern: "smooth-white", baseColor: "#f5f5f5", subtitle: "Matte Vinyl", description: "Non-glare, premium look.", durability: "Outdoor 3-5 years", weight: "Light" },
  "clear": { pattern: "checkerboard", baseColor: "transparent", subtitle: "Clear Vinyl", description: "Transparent background stickers.", durability: "Outdoor 3-5 years", weight: "Light" },
  "holographic": { pattern: "holographic", baseColor: "#e8e0f0", subtitle: "Holographic Film", description: "Rainbow sparkle effect.", durability: "Outdoor 2-3 years", weight: "Light" },
  "reflective": { pattern: "brushed", baseColor: "#e0e0e0", subtitle: "Reflective Vinyl", description: "High visibility, 3M Scotchlite.", durability: "Outdoor 5yr+", weight: "Light" },
  "glossy-paper": { pattern: "smooth-white", baseColor: "#fffdf8", subtitle: "Glossy Paper", description: "Bright indoor stickers.", durability: "Indoor only", weight: "Ultra-light" },
  // Paper
  "14pt-cardstock": { pattern: "smooth-white", baseColor: "#fefefe", subtitle: "14pt C2S Cardstock", description: "Standard business cards and postcards.", durability: "Indoor", weight: "Light" },
  "16pt-cardstock": { pattern: "smooth-white", baseColor: "#fcfcfc", subtitle: "16pt C2S Cardstock", description: "Premium thicker cards.", durability: "Indoor", weight: "Light" },
  // BOPP & specialty stickers
  "white-bopp": { pattern: "smooth-white", baseColor: "#ffffff", subtitle: "White BOPP", description: "Waterproof product labels.", durability: "Outdoor 3-5 years", weight: "Light" },
  "clear-bopp": { pattern: "checkerboard", baseColor: "transparent", subtitle: "Clear BOPP", description: "No-label look.", durability: "Outdoor 3-5 years", weight: "Light" },
  "kraft-paper": { pattern: "kraft", baseColor: "#d4b896", subtitle: "Kraft Paper", description: "Rustic, natural look.", durability: "Indoor", weight: "Ultra-light" },
  "silver": { pattern: "brushed", baseColor: "#c0c0c0", subtitle: "Silver Metallic", description: "Metallic finish labels.", durability: "Outdoor 2-3 years", weight: "Light" },
  "magnetic-vinyl": { pattern: "smooth", baseColor: "#e8e8e8", subtitle: "Magnetic Vinyl", description: "Removable magnetic signs.", durability: "Outdoor 3-5 years", weight: "Heavy" },
  "transfer-vinyl": { pattern: "smooth-white", baseColor: "#ffffff", subtitle: "Transfer Vinyl", description: "Heat transfer for fabrics.", durability: "50+ washes", weight: "Light" },
  "outdoor": { pattern: "smooth-white", baseColor: "#ffffff", subtitle: "Outdoor Vinyl", description: "UV-resistant outdoor stickers.", durability: "Outdoor 3-5 years", weight: "Light" },
  "indoor": { pattern: "smooth-white", baseColor: "#fffdf8", subtitle: "Indoor Paper", description: "Cost-effective indoor labels.", durability: "Indoor only", weight: "Ultra-light" },
  "floor-nonslip": { pattern: "stipple", baseColor: "#f0f0f0", subtitle: "Non-Slip Floor Vinyl", description: "Textured anti-slip surface.", durability: "Indoor 6-12 months", weight: "Heavy" },
  "perforated": { pattern: "mesh", baseColor: "#f0f0f0", subtitle: "Perforated Window Film", description: "One-way vision film.", durability: "Outdoor 2-3 years", weight: "Light" },
  "white-cling": { pattern: "smooth-white", baseColor: "#ffffff", subtitle: "White Static Cling", description: "Removable, no adhesive.", durability: "Indoor", weight: "Light" },
  "clear-cling": { pattern: "checkerboard", baseColor: "transparent", subtitle: "Clear Static Cling", description: "Removable, transparent.", durability: "Indoor", weight: "Light" },
  // ── New sticker material IDs (kebab-case from sticker-order-config) ──
  "matte-vinyl": { pattern: "smooth", baseColor: "#f0f0ee", subtitle: "3mil Matte Vinyl", description: "Non-glare, premium look.", durability: "Outdoor 3-5 years", weight: "Light" },
  "clear-vinyl": { pattern: "checkerboard", baseColor: "transparent", subtitle: "3mil Clear Vinyl", description: "Transparent background stickers.", durability: "Outdoor 3-5 years", weight: "Light" },
  "frosted-vinyl": { pattern: "frosted", baseColor: "#e8edf2", subtitle: "Frosted Vinyl", description: "Etched glass look.", durability: "Outdoor 3-5 years", weight: "Light" },
  "holographic-vinyl": { pattern: "holographic", baseColor: "#e8e0f0", subtitle: "Holographic Film", description: "Rainbow sparkle effect.", durability: "Outdoor 2-3 years", weight: "Light" },
  "3m-reflective": { pattern: "brushed", baseColor: "#d8dce2", subtitle: "3M Reflective Vinyl", description: "High visibility, 3M Scotchlite.", durability: "Outdoor 5yr+", weight: "Light" },
  "heavy-duty-vinyl": { pattern: "smooth", baseColor: "#e8e8e8", subtitle: "Heavy-Duty Vinyl", description: "Extra thick, industrial grade.", durability: "Outdoor 5yr+", weight: "Medium" },
  "gloss-paper": { pattern: "gloss", baseColor: "#fffdf8", subtitle: "Glossy Paper", description: "Bright indoor stickers.", durability: "Indoor only", weight: "Ultra-light" },
  "matte-paper": { pattern: "smooth-white", baseColor: "#f8f6f4", subtitle: "Matte Paper", description: "Non-glare indoor stickers.", durability: "Indoor only", weight: "Ultra-light" },
  "soft-touch-paper": { pattern: "smooth", baseColor: "#faf5f0", subtitle: "Soft-Touch Paper", description: "Velvety feel premium paper.", durability: "Indoor only", weight: "Ultra-light" },
  "foil-stamping": { pattern: "gloss", baseColor: "#f0d890", subtitle: "Foil Stamping", description: "Metallic accent finish.", durability: "Indoor", weight: "Light" },
  "clear-static-cling": { pattern: "checkerboard", baseColor: "transparent", subtitle: "Clear Static Cling", description: "Removable, transparent, no adhesive.", durability: "Indoor", weight: "Light" },
  "frosted-static-cling": { pattern: "frosted", baseColor: "#e8edf2", subtitle: "Frosted Static Cling", description: "Removable, frosted look.", durability: "Indoor", weight: "Light" },
  "white-static-cling": { pattern: "smooth-white", baseColor: "#ffffff", subtitle: "White Static Cling", description: "Removable, opaque, no adhesive.", durability: "Indoor", weight: "Light" },
  // ── Roll labels BOPP IDs (kebab-case from sticker-order-config) ──
  "white-gloss-bopp": { pattern: "gloss", baseColor: "#ffffff", subtitle: "White Gloss BOPP", description: "Waterproof product labels.", durability: "Outdoor 3-5 years", weight: "Light" },
  "matte-white-bopp": { pattern: "smooth-white", baseColor: "#f5f5f5", subtitle: "Matte White BOPP", description: "Non-glare product labels.", durability: "Outdoor 3-5 years", weight: "Light" },
  "silver-brushed-bopp": { pattern: "brushed", baseColor: "#c0c0c0", subtitle: "Silver Brushed BOPP", description: "Metallic finish labels.", durability: "Outdoor 2-3 years", weight: "Light" },
  "freezer-grade-bopp": { pattern: "smooth", baseColor: "#e0eaf0", subtitle: "Freezer Grade BOPP", description: "Cold-resistant adhesive.", durability: "Outdoor 3-5 years", weight: "Light" },
  // ── Vehicle graphics materials ──
  "cast-vinyl": { pattern: "smooth", baseColor: "#f0f0f0", subtitle: "Cast Vinyl", description: "Premium — conforms to curves without bubbling.", durability: "Outdoor 5yr+", weight: "Light" },
  "avery-cast": { pattern: "smooth", baseColor: "#f0f0f0", subtitle: "Avery Cast Vinyl", description: "Premium — conforms to curves without bubbling.", durability: "Outdoor 5yr+", weight: "Light" },
  "calendered": { pattern: "smooth", baseColor: "#e8e8e8", subtitle: "Calendered Vinyl", description: "Budget-friendly — best for flat surfaces.", durability: "Outdoor 1-3 years", weight: "Light" },
  "magnetic-30mil": { pattern: "smooth", baseColor: "#d0d0d0", subtitle: "30mil Magnetic", description: "Removable magnetic signs for vehicles.", durability: "Outdoor 3-5 years", weight: "Heavy" },
  // ── Sign materials (additional IDs) ──
  "6mm-coroplast": { pattern: "fluted", baseColor: "#f5f3ef", subtitle: "6mm Corrugated Plastic", description: "Thicker, extra rigid for larger signs.", durability: "Outdoor 1-2 years", weight: "Light" },
  "10mm-coroplast": { pattern: "fluted", baseColor: "#f0ede8", subtitle: "10mm Corrugated Plastic", description: "Heavy-duty corrugated for A-frames.", durability: "Outdoor 2-3 years", weight: "Medium" },
  "3/16-foam": { pattern: "stipple", baseColor: "#ffffff", subtitle: '3/16" Foam Board', description: "Standard indoor displays.", durability: "Indoor only", weight: "Ultra-light" },
  "1/2-foam": { pattern: "stipple", baseColor: "#fafafa", subtitle: '1/2" Foam Board', description: "Extra thick for sturdy presentations.", durability: "Indoor only", weight: "Light" },
  "gatorboard": { pattern: "stipple", baseColor: "#f5f5f0", subtitle: "Gatorboard", description: "Foam-core board — warp-resistant, heavy-duty.", durability: "Indoor 5yr+", weight: "Medium" },
  "aluminum-040": { pattern: "brushed", baseColor: "#d8dce2", subtitle: '.040" Aluminum', description: "Standard aluminum — rust-proof outdoor.", durability: "Outdoor 5yr+", weight: "Medium" },
  "aluminum-063": { pattern: "brushed", baseColor: "#d0d4da", subtitle: '.063" Aluminum', description: "Thicker aluminum — extra durable.", durability: "Outdoor 5yr+", weight: "Heavy" },
  "acm-dibond": { pattern: "brushed", baseColor: "#c8ccd2", subtitle: "Aluminum Composite", description: "Premium sandwich panel — rigid, lightweight.", durability: "Outdoor 10yr+", weight: "Medium" },
  "3mm-pvc": { pattern: "smooth", baseColor: "#f8f8f8", subtitle: "3mm PVC / Sintra", description: "Versatile plastic for indoor/outdoor.", durability: "Outdoor 3-5 years", weight: "Light" },
  "6mm-pvc": { pattern: "smooth", baseColor: "#f5f5f5", subtitle: "6mm PVC / Sintra", description: "Thicker PVC — extra rigid.", durability: "Outdoor 3-5 years", weight: "Medium" },
  // ── Banner materials (additional IDs) ──
  "15oz-blockout": { pattern: "woven", baseColor: "#f8f5f0", subtitle: "15oz Blockout Vinyl", description: "Opaque — blocks light completely.", durability: "Outdoor 3-5 years", weight: "Heavy" },
  "9oz-mesh": { pattern: "mesh", baseColor: "#f2f0ed", subtitle: "9oz Mesh", description: "Wind-through for fences and buildings.", durability: "Outdoor 2 years", weight: "Light" },
  "heavy-mesh": { pattern: "mesh", baseColor: "#eae8e5", subtitle: "Heavy Mesh", description: "Stronger mesh for large outdoor banners.", durability: "Outdoor 3 years", weight: "Medium" },
  "fabric-banner": { pattern: "canvas", baseColor: "#faf5ee", subtitle: "Fabric Banner", description: "Wrinkle-free, premium indoor look.", durability: "Indoor", weight: "Light" },
  "satin-fabric": { pattern: "canvas", baseColor: "#f5f0e8", subtitle: "Satin Fabric", description: "Smooth finish for trade shows.", durability: "Indoor", weight: "Light" },
  "polyester-fabric": { pattern: "canvas", baseColor: "#f0ebe3", subtitle: "Polyester Fabric", description: "Durable fabric for events.", durability: "Indoor/Outdoor", weight: "Medium" },
  "mesh-standard": { pattern: "mesh", baseColor: "#f2f0ed", subtitle: "Standard Mesh", description: "Wind-through for fences and buildings.", durability: "Outdoor 2 years", weight: "Light" },
  "mesh-heavy": { pattern: "mesh", baseColor: "#eae8e5", subtitle: "Heavy-Duty Mesh", description: "Stronger mesh for large outdoor banners.", durability: "Outdoor 3 years", weight: "Medium" },
  "polyester": { pattern: "canvas", baseColor: "#f0ebe3", subtitle: "Polyester Fabric", description: "Durable wrinkle-free fabric.", durability: "Indoor/Outdoor", weight: "Medium" },
  "satin": { pattern: "canvas", baseColor: "#f5f0e8", subtitle: "Satin Fabric", description: "Smooth finish for trade shows.", durability: "Indoor", weight: "Light" },
  "18oz-vinyl": { pattern: "woven", baseColor: "#f5f0ea", subtitle: "18oz Heavy Vinyl", description: "Extra-thick for outdoor durability.", durability: "Outdoor 5yr+", weight: "Heavy" },
  "pet-grey-back": { pattern: "smooth", baseColor: "#e0e0e0", subtitle: "PET Grey Back", description: "Retractable banner media — smooth finish.", durability: "Indoor", weight: "Light" },
  "premium-vinyl": { pattern: "smooth-white", baseColor: "#ffffff", subtitle: "Premium Vinyl", description: "High-quality banner vinyl.", durability: "Outdoor 3-5 years", weight: "Medium" },
};

// ─── SVG Texture Pattern Renderer ────────────────────────────────────────────
// Returns inline SVG markup for the 56px-tall swatch preview area.
// Each instance receives a unique `uid` to namespace SVG defs (patterns,
// gradients, filters) so multiple swatches of the same type on one page
// do not collide.

function TexturePattern({ pattern, baseColor, uid, width = "100%", height = 56 }) {
  const bg = baseColor === "transparent" ? "#ffffff" : baseColor;

  switch (pattern) {
    // Corrugated parallel horizontal lines
    case "fluted":
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={i}
              x1="0"
              y1={6 + i * 6}
              x2="100%"
              y2={6 + i * 6}
              stroke="#c8c4bc"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          ))}
        </svg>
      );

    // Scattered small dots — subtle noise
    case "stipple": {
      const filterId = `stipple-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
          <defs>
            <filter id={filterId}>
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="2" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
              <feComponentTransfer in="gray">
                <feFuncA type="discrete" tableValues="0 0 0.08 0.12 0.08 0" />
              </feComponentTransfer>
            </filter>
          </defs>
          <rect width="100%" height="100%" filter={`url(#${filterId})`} />
        </svg>
      );
    }

    // Linear gradient with white highlight streak
    case "gloss": {
      const gradId = `gloss-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={bg} />
              <stop offset="35%" stopColor={bg} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="65%" stopColor={bg} />
              <stop offset="100%" stopColor={bg} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </svg>
      );
    }

    // Fine horizontal lines — brushed metal
    case "brushed":
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
          {Array.from({ length: 18 }, (_, i) => (
            <line
              key={i}
              x1="0"
              y1={1.5 + i * 3}
              x2="100%"
              y2={1.5 + i * 3}
              stroke="#999"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
          ))}
        </svg>
      );

    // Solid with very subtle gradient
    case "smooth": {
      const gradId = `smooth-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={bg} />
              <stop offset="100%" stopColor="#e8e8e8" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={bg} />
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </svg>
      );
    }

    // Pure white / off-white solid
    case "smooth-white":
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
        </svg>
      );

    // Cross-hatch warp and weft lines
    case "woven": {
      const patId = `woven-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
          <defs>
            <pattern id={patId} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="4" x2="8" y2="4" stroke="#c0b8a8" strokeWidth="0.6" strokeOpacity="0.5" />
              <line x1="4" y1="0" x2="4" y2="8" stroke="#c0b8a8" strokeWidth="0.6" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patId})`} />
        </svg>
      );
    }

    // Regular perforated dots
    case "mesh": {
      const patId = `mesh-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
          <defs>
            <pattern id={patId} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1.5" fill="#999" fillOpacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patId})`} />
        </svg>
      );
    }

    // Diagonal cross-weave textile
    case "canvas": {
      const patId = `canvas-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
          <defs>
            <pattern id={patId} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="10" y2="10" stroke="#c8b898" strokeWidth="0.5" strokeOpacity="0.4" />
              <line x1="10" y1="0" x2="0" y2="10" stroke="#c8b898" strokeWidth="0.5" strokeOpacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patId})`} />
        </svg>
      );
    }

    // Frosted glass effect — soft blur overlay on white
    case "frosted": {
      const filterId = `frost-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
          <defs>
            <filter id={filterId}>
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" seed="5" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
              <feComponentTransfer in="gray">
                <feFuncA type="discrete" tableValues="0 0.06 0.12 0.18 0.12 0.06 0" />
              </feComponentTransfer>
            </filter>
          </defs>
          <rect width="100%" height="100%" filter={`url(#${filterId})`} />
          <rect width="100%" height="100%" fill="#b8cee0" fillOpacity="0.12" />
        </svg>
      );
    }

    // Clear / transparent material — glass-like gradient instead of raw checkerboard
    case "checkerboard": {
      const gradId = `clear-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0f4f8" />
              <stop offset="30%" stopColor="#e4ecf4" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#e8eff6" />
              <stop offset="100%" stopColor="#f0f4f8" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
          <rect width="100%" height="100%" fill="#ffffff" fillOpacity="0.3" />
        </svg>
      );
    }

    // Rainbow linear gradient
    case "holographic": {
      const gradId = `holo-${uid}`;
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f0c0e8" />
              <stop offset="20%" stopColor="#c0d0f8" />
              <stop offset="40%" stopColor="#b0f0d0" />
              <stop offset="60%" stopColor="#f0f0a0" />
              <stop offset="80%" stopColor="#f0c0a0" />
              <stop offset="100%" stopColor="#e0b0f0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </svg>
      );
    }

    // Brown with fiber-like lines
    case "kraft":
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg} />
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={i}
              x1="0"
              y1={2 + i * 4 + (i % 3)}
              x2="100%"
              y2={2 + i * 4 - (i % 2)}
              stroke="#b8976a"
              strokeWidth="0.5"
              strokeOpacity={0.2 + (i % 3) * 0.08}
            />
          ))}
        </svg>
      );

    default:
      return (
        <svg width={width} height={height} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100%" height="100%" fill={bg || "#f0f0f0"} />
        </svg>
      );
  }
}

// ─── Individual Swatch Card ──────────────────────────────────────────────────

export function MaterialSwatch({ material, selected, onSelect, recommended = false, recommendedLabel, priceHint, detailRows }) {
  const { id, label, name, subtitle, image } = material;
  const displayName = label || name || id;
  const meta = MATERIAL_META[id];
  const displaySubtitle = subtitle || meta?.subtitle || "";
  const pattern = meta?.pattern || "smooth";
  const baseColor = meta?.baseColor || "#f0f0f0";

  // Unique ID for SVG defs so multiple swatches never collide
  const uid = useId();
  const safeUid = uid.replace(/:/g, "");

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimer = useRef(null);

  const showTooltip = useCallback(() => {
    tooltipTimer.current = setTimeout(() => setTooltipVisible(true), 300);
  }, []);

  const hideTooltip = useCallback(() => {
    clearTimeout(tooltipTimer.current);
    setTooltipVisible(false);
  }, []);

  const hasTooltipContent = meta && (meta.description || meta.durability || meta.weight);

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-pressed={selected}
      className={`
        group relative flex flex-col overflow-hidden rounded-lg border-2 bg-white text-left
        transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40
        ${selected
          ? "border-teal-500 shadow-md shadow-teal-500/10"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }
      `}
    >
      {/* Texture preview area */}
      <div className="relative h-14 w-full overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={displayName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <TexturePattern pattern={pattern} baseColor={baseColor} uid={safeUid} />
        )}

        {/* Recommended / Popular badge */}
        {recommended && (
          <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-green-100 px-1.5 py-px text-[9px] font-bold text-green-700 shadow-sm">
            {"\u2605"} {recommendedLabel || "Rec"}
          </span>
        )}
        {/* Selected checkmark badge */}
        {selected && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[#fff] shadow-sm">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
        )}
      </div>

      {/* Label area */}
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-bold leading-tight text-gray-900">
          {displayName}
          {priceHint && (
            <span className="text-[10px] font-semibold text-amber-600">{priceHint}</span>
          )}
        </span>
        {displaySubtitle && (
          <span className="text-[11px] leading-tight text-gray-400">{displaySubtitle}</span>
        )}
        {detailRows && detailRows.length > 0 && (
          <span className="mt-0.5 space-y-0.5">
            {detailRows.map((row, i) => (
              <span key={i} className="flex gap-1 text-[10px] text-gray-400">
                <span className="font-semibold shrink-0">{row.label}:</span>
                <span>{row.text}</span>
              </span>
            ))}
          </span>
        )}
      </div>

      {/* Hover tooltip */}
      {hasTooltipContent && tooltipVisible && (
        <div
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
          role="tooltip"
        >
          {meta.description && (
            <p className="mb-1.5 text-xs leading-relaxed text-gray-600">{meta.description}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {meta.durability && (
              <span className="text-gray-500">
                <span className="font-semibold text-gray-700">Durability:</span> {meta.durability}
              </span>
            )}
            {meta.weight && (
              <span className="text-gray-500">
                <span className="font-semibold text-gray-700">Weight:</span> {meta.weight}
              </span>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2">
            <div className="h-2 w-2 rotate-45 border-b border-r border-gray-200 bg-white" />
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Grid Column Lookup ──────────────────────────────────────────────────────
// Tailwind cannot detect dynamically-constructed class names. This static map
// ensures every grid-cols variant we might use is present in the CSS output.

const GRID_COL_CLASSES = {
  1: "grid-cols-1 sm:grid-cols-1 lg:grid-cols-1",
  2: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

// ─── Swatch Grid ─────────────────────────────────────────────────────────────

/**
 * Material selection grid with visual SVG texture swatches.
 *
 * Props:
 *  - materials     — array of { id, label|name, subtitle?, image?, priceHint? }
 *  - selectedId    — currently selected material id
 *  - onSelect(id)  — selection callback
 *  - columns       — optional column count (default: 2 mobile, 4 desktop)
 *  - recommendedId — id of the recommended material (shows badge)
 *  - recommendedLabel — custom label for the recommended badge (default: "Rec")
 *  - getPriceHint(id) — optional fn returning price hint string (e.g. "+$2.50")
 *  - getDetailRows(id) — optional fn returning detail rows array
 */
export default function MaterialSwatchGrid({
  materials = [],
  selectedId,
  onSelect,
  columns,
  recommendedId,
  recommendedLabel,
  getPriceHint,
  getDetailRows,
}) {
  // Resolve grid classes from static lookup (Tailwind-safe)
  const gridClasses = GRID_COL_CLASSES[columns] || GRID_COL_CLASSES[4];

  // Resolve the selected material for the confirmation strip
  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedId),
    [materials, selectedId],
  );

  const selectedMeta = selectedId ? MATERIAL_META[selectedId] : null;
  const selectedName = selectedMaterial
    ? selectedMaterial.label || selectedMaterial.name || selectedMaterial.id
    : null;
  const selectedSubtitle = selectedMaterial
    ? selectedMaterial.subtitle || selectedMeta?.subtitle || ""
    : "";

  if (!materials.length) return null;

  return (
    <div>
      {/* Grid */}
      <div className={`grid gap-3 ${gridClasses}`}>
        {materials.map((mat) => (
          <MaterialSwatch
            key={mat.id}
            material={mat}
            selected={mat.id === selectedId}
            onSelect={onSelect}
            recommended={!!recommendedId && mat.id === recommendedId}
            recommendedLabel={recommendedLabel}
            priceHint={mat.priceHint || (getPriceHint ? getPriceHint(mat.id) : undefined)}
            detailRows={getDetailRows ? getDetailRows(mat.id) : undefined}
          />
        ))}
      </div>

      {/* Confirmation strip with description (visible on mobile where hover tooltips aren't) */}
      {selectedId && selectedMaterial && (
        <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <p className="text-xs font-medium text-teal-800">
              Selected: <span className="font-bold">{selectedName}</span>
              {selectedSubtitle && (
                <span className="text-teal-600"> &mdash; {selectedSubtitle}</span>
              )}
            </p>
          </div>
          {selectedMeta && (selectedMeta.description || selectedMeta.durability) && (
            <p className="mt-1 ml-6 text-[11px] text-teal-700">
              {selectedMeta.description}
              {selectedMeta.durability && (
                <span className="ml-2 font-semibold">{selectedMeta.durability}</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
