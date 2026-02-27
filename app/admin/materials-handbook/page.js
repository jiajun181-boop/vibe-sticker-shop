"use client";

import { useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Material data (read-only reference)                               */
/* ------------------------------------------------------------------ */
const MATERIAL_CATEGORIES = [
  {
    id: "roll",
    title: "Roll Materials",
    icon: "roll",
    items: [
      { name: "13oz Scrim Vinyl", specs: '54" wide roll, 13oz', usage: "Banners, outdoor advertising", products: ["vinyl-banners"] },
      { name: "8oz Mesh Vinyl", specs: '54" wide roll, 8oz', usage: "Wind-through banners, fences", products: ["mesh-banners"] },
      { name: "Self-Adhesive Vinyl (Glossy)", specs: '54" wide roll', usage: "Wall, floor, window graphics", products: ["wall-graphics", "floor-graphics", "window-graphics"] },
      { name: "Self-Adhesive Vinyl (Matte)", specs: '54" wide roll', usage: "Wall graphics", products: ["wall-graphics"] },
      { name: "One-Way Vision Film", specs: '54" wide roll, perforated', usage: "Window one-way vision", products: ["one-way-vision"] },
      { name: "Vehicle Wrap Film (cast)", specs: '60" wide roll', usage: "Full vehicle wraps", products: ["full-vehicle-wrap", "partial-vehicle-wrap"] },
      { name: "Vehicle Wrap Film (calendered)", specs: '54" wide roll', usage: "Short-term vehicle decals", products: ["vehicle-decals"] },
      { name: "Canvas (poly-cotton)", specs: '17mil, 54"-60" roll', usage: "Canvas prints, art prints", products: ["canvas-prints"] },
      { name: "Fabric (dye-sub)", specs: "polyester knit", usage: "Fabric banners, table covers", products: ["fabric-banners", "table-covers"] },
      { name: "Magnetic Sheet", specs: "15mil-30mil", usage: "Magnetic vehicle signs", products: ["magnetic-signs"] },
      { name: "Reflective Vinyl", specs: "3M Scotchlite", usage: "Safety signs, DOT compliance", products: ["reflective-decals"] },
    ],
  },
  {
    id: "rigid",
    title: "Rigid Boards",
    icon: "rigid",
    items: [
      { name: "Coroplast", specs: '4mm, 48"x96" max sheet', usage: "Yard signs, temporary signage", products: ["yard-sign", "coroplast-signs"] },
      { name: "Foam Board", specs: '3/16"-1/2", 48"x96"', usage: "Indoor displays, presentations", products: ["foam-board"] },
      { name: "PVC/Sintra", specs: '3mm-6mm, 48"x96"', usage: "Indoor/outdoor signage", products: ["pvc-board-signs"] },
      { name: "Aluminum Composite Panel", specs: '3mm, 48"x96"', usage: "Long-term outdoor signage", products: ["aluminum-sign"] },
      // Acrylic/Plexiglass removed — no UV flatbed printer available
    ],
  },
  {
    id: "paper",
    title: "Paper Stock",
    icon: "paper",
    items: [
      { name: "14pt Cardstock (C2S)", specs: "Coated 2 sides", usage: "Business cards, postcards", products: ["business-cards", "postcards"] },
      { name: "16pt Cardstock (C2S)", specs: "Coated 2 sides, thicker", usage: "Premium business cards", products: ["business-cards-premium"] },
      { name: "100lb Gloss Text", specs: "Book weight", usage: "Flyers, brochures, booklets", products: ["flyers", "brochures", "booklets"] },
      { name: "100lb Matte Text", specs: "Book weight", usage: "Flyers, brochures", products: ["flyers", "brochures"] },
      { name: "80lb Gloss Cover", specs: "Card weight", usage: "Booklet covers", products: ["booklet-covers"] },
      { name: "NCR Paper", specs: "2-part / 3-part carbonless", usage: "Carbonless forms", products: ["ncr-forms"] },
      { name: "Linen Stock", specs: "Textured", usage: "Premium business cards", products: ["business-cards"] },
    ],
  },
  {
    id: "hardware",
    title: "Hardware & Frames",
    icon: "hardware",
    items: [
      { name: "H-Stakes (wire)", specs: '10"x30" galvanized', usage: "Yard sign stakes", products: ["yard-sign"] },
      { name: "Retractable Banner Stand", specs: '33"x81" aluminum', usage: "Pull-up banner display", products: ["retractable-banner"] },
      { name: "X-Banner Stand", specs: '24"x63"', usage: "X-frame banner display", products: ["x-banner"] },
      { name: "Feather Flag Pole Kit", specs: "spike + cross base", usage: "Feather flag display", products: ["feather-flag"] },
      { name: "Teardrop Flag Pole Kit", specs: "spike + cross base", usage: "Teardrop flag display", products: ["teardrop-flag"] },
      { name: "A-Frame Sidewalk Stand", specs: '24"x36" folding', usage: "Sidewalk advertising", products: ["a-frame-sign"] },
      { name: "Table Top Stand", specs: "various", usage: "Tabletop displays", products: ["table-top-display"] },
      { name: "Grommets", specs: 'brass, every 24"', usage: "Banner hanging", products: ["banners"] },
    ],
  },
  {
    id: "films",
    title: "Films & Laminates",
    icon: "films",
    items: [
      { name: "Gloss Laminate", specs: "1.5mil overlaminate", usage: "Sticker/card protection", products: ["stickers", "business-cards"] },
      { name: "Matte Laminate", specs: "1.5mil overlaminate", usage: "Sticker/card protection", products: ["stickers", "business-cards"] },
      { name: "Soft Touch Laminate", specs: "velvet finish", usage: "Premium business cards", products: ["business-cards"] },
      { name: "UV Coating (Spot/Flood)", specs: "liquid coat", usage: "Card spot highlights", products: ["business-cards"] },
      { name: "Floor Laminate", specs: "anti-slip textured", usage: "Floor graphics protection", products: ["floor-graphics"] },
      { name: "Cold Laminate", specs: "pressure-sensitive", usage: "Outdoor durability", products: ["outdoor-graphics"] },
    ],
  },
  {
    id: "sticker",
    title: "Sticker & Label Stock",
    icon: "sticker",
    items: [
      { name: "White Vinyl (permanent)", specs: "3mil, gloss/matte", usage: "General-purpose stickers", products: ["die-cut-stickers", "kiss-cut-stickers"] },
      { name: "Clear Vinyl", specs: "3mil, transparent", usage: "Transparent stickers", products: ["clear-stickers"] },
      { name: "Holographic Film", specs: "rainbow prismatic", usage: "Special effect stickers", products: ["holographic-stickers"] },
      { name: "Paper Label (uncoated)", specs: "removable/permanent", usage: "Product labels", products: ["product-labels"] },
      { name: "BOPP (White/Clear)", specs: "Biaxially-oriented PP", usage: "Waterproof labels", products: ["bopp-labels"] },
      { name: "Kraft Paper", specs: "brown uncoated", usage: "Rustic style labels", products: ["kraft-labels"] },
      { name: "Transfer Vinyl", specs: "heat transfer", usage: "Fabric transfers", products: ["transfer-vinyl"] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  SVG texture thumbnails (40x40)                                    */
/* ------------------------------------------------------------------ */
const TEXTURE_PATTERNS = {
  // Roll materials
  "13oz Scrim Vinyl": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#e0e7ff" />
      <line x1="0" y1="5" x2="40" y2="5" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="0" y1="10" x2="40" y2="10" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="0" y1="15" x2="40" y2="15" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="0" y1="20" x2="40" y2="20" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="0" y1="25" x2="40" y2="25" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="0" y1="30" x2="40" y2="30" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="0" y1="35" x2="40" y2="35" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="5" y1="0" x2="5" y2="40" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="10" y1="0" x2="10" y2="40" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="15" y1="0" x2="15" y2="40" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="20" y1="0" x2="20" y2="40" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="25" y1="0" x2="25" y2="40" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="30" y1="0" x2="30" y2="40" stroke="#818cf8" strokeWidth="0.5" />
      <line x1="35" y1="0" x2="35" y2="40" stroke="#818cf8" strokeWidth="0.5" />
    </svg>
  ),
  "8oz Mesh Vinyl": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fef3c7" />
      {[0, 4, 8, 12, 16, 20, 24, 28, 32, 36].map((y) =>
        [0, 4, 8, 12, 16, 20, 24, 28, 32, 36].map((x) => (
          <circle key={`${x}-${y}`} cx={x + 2} cy={y + 2} r="1" fill="#f59e0b" opacity="0.5" />
        ))
      )}
    </svg>
  ),
  "Self-Adhesive Vinyl (Glossy)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <defs><linearGradient id="gloss" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#dbeafe" /><stop offset="50%" stopColor="#fff" /><stop offset="100%" stopColor="#dbeafe" /></linearGradient></defs>
      <rect width="40" height="40" fill="url(#gloss)" />
      <line x1="0" y1="0" x2="40" y2="40" stroke="#93c5fd" strokeWidth="0.3" opacity="0.5" />
      <line x1="10" y1="0" x2="40" y2="30" stroke="#93c5fd" strokeWidth="0.3" opacity="0.5" />
      <line x1="0" y1="10" x2="30" y2="40" stroke="#93c5fd" strokeWidth="0.3" opacity="0.5" />
    </svg>
  ),
  "Self-Adhesive Vinyl (Matte)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f1f5f9" />
      <rect x="2" y="2" width="36" height="36" fill="#e2e8f0" rx="1" />
    </svg>
  ),
  "One-Way Vision Film": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#1e293b" />
      {[4, 10, 16, 22, 28, 34].map((y) =>
        [4, 10, 16, 22, 28, 34].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#fff" opacity="0.7" />
        ))
      )}
    </svg>
  ),
  "Vehicle Wrap Film (cast)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#ddd6fe" />
      <path d="M0 20 Q10 15 20 20 T40 20" fill="none" stroke="#7c3aed" strokeWidth="0.8" opacity="0.4" />
      <path d="M0 10 Q10 5 20 10 T40 10" fill="none" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
      <path d="M0 30 Q10 25 20 30 T40 30" fill="none" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
    </svg>
  ),
  "Vehicle Wrap Film (calendered)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#e9d5ff" />
      <line x1="0" y1="8" x2="40" y2="8" stroke="#a855f7" strokeWidth="0.5" opacity="0.4" />
      <line x1="0" y1="16" x2="40" y2="16" stroke="#a855f7" strokeWidth="0.5" opacity="0.4" />
      <line x1="0" y1="24" x2="40" y2="24" stroke="#a855f7" strokeWidth="0.5" opacity="0.4" />
      <line x1="0" y1="32" x2="40" y2="32" stroke="#a855f7" strokeWidth="0.5" opacity="0.4" />
    </svg>
  ),
  "Canvas (poly-cotton)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fef9c3" />
      {[0, 4, 8, 12, 16, 20, 24, 28, 32, 36].map((y) => (
        <line key={`h-${y}`} x1="0" y1={y} x2="40" y2={y} stroke="#ca8a04" strokeWidth="0.4" opacity="0.3" />
      ))}
      {[0, 4, 8, 12, 16, 20, 24, 28, 32, 36].map((x) => (
        <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="40" stroke="#ca8a04" strokeWidth="0.4" opacity="0.3" />
      ))}
    </svg>
  ),
  "Fabric (dye-sub)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fce7f3" />
      {[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39].map((y, i) => (
        <line key={`k-${y}`} x1={i % 2 === 0 ? 0 : 1.5} y1={y} x2={i % 2 === 0 ? 40 : 38.5} y2={y} stroke="#ec4899" strokeWidth="0.3" opacity="0.25" />
      ))}
    </svg>
  ),
  "Magnetic Sheet": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#374151" />
      <rect x="4" y="4" width="32" height="32" fill="#4b5563" rx="2" />
      <text x="20" y="24" textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="monospace">N/S</text>
    </svg>
  ),
  "Reflective Vinyl": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fef08a" />
      {[5, 15, 25, 35].map((x) =>
        [5, 15, 25, 35].map((y) => (
          <polygon key={`${x}-${y}`} points={`${x},${y - 3} ${x + 2},${y} ${x},${y + 3} ${x - 2},${y}`} fill="#eab308" opacity="0.4" />
        ))
      )}
    </svg>
  ),
  // Rigid boards
  Coroplast: (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fff" stroke="#d1d5db" strokeWidth="1" />
      {[0, 6, 12, 18, 24, 30, 36].map((x) => (
        <line key={`f-${x}`} x1={x} y1="0" x2={x} y2="40" stroke="#d1d5db" strokeWidth="0.5" />
      ))}
      <line x1="0" y1="10" x2="40" y2="10" stroke="#e5e7eb" strokeWidth="0.5" />
      <line x1="0" y1="30" x2="40" y2="30" stroke="#e5e7eb" strokeWidth="0.5" />
    </svg>
  ),
  "Foam Board": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fafafa" />
      <rect x="1" y="1" width="38" height="38" fill="#f5f5f5" rx="2" stroke="#e5e7eb" strokeWidth="0.5" />
      <rect x="3" y="14" width="34" height="12" fill="#fff" stroke="#d1d5db" strokeWidth="0.3" rx="1" />
    </svg>
  ),
  "PVC/Sintra": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f0fdf4" />
      <rect x="2" y="2" width="36" height="36" fill="#dcfce7" rx="1" stroke="#86efac" strokeWidth="0.5" />
    </svg>
  ),
  "Aluminum Composite Panel": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <defs><linearGradient id="alu" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e5e7eb" /><stop offset="30%" stopColor="#f9fafb" /><stop offset="70%" stopColor="#d1d5db" /><stop offset="100%" stopColor="#e5e7eb" /></linearGradient></defs>
      <rect width="40" height="40" fill="url(#alu)" />
      <line x1="0" y1="0" x2="40" y2="40" stroke="#9ca3af" strokeWidth="0.2" opacity="0.3" />
      <line x1="40" y1="0" x2="0" y2="40" stroke="#9ca3af" strokeWidth="0.2" opacity="0.3" />
    </svg>
  ),
  // Acrylic/Plexiglass SVG removed — no UV flatbed printer
  // Paper stock
  "14pt Cardstock (C2S)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fff" />
      <rect x="1" y="1" width="38" height="38" fill="#fafafa" stroke="#e5e7eb" strokeWidth="0.8" rx="1" />
      <text x="20" y="24" textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="monospace">14pt</text>
    </svg>
  ),
  "16pt Cardstock (C2S)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fff" />
      <rect x="1" y="1" width="38" height="38" fill="#f5f5f5" stroke="#d1d5db" strokeWidth="1" rx="1" />
      <text x="20" y="24" textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="monospace">16pt</text>
    </svg>
  ),
  "100lb Gloss Text": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <defs><linearGradient id="glt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fff" /><stop offset="50%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#fff" /></linearGradient></defs>
      <rect width="40" height="40" fill="url(#glt)" stroke="#e2e8f0" strokeWidth="0.5" />
      <line x1="4" y1="10" x2="36" y2="10" stroke="#cbd5e1" strokeWidth="0.3" />
      <line x1="4" y1="16" x2="36" y2="16" stroke="#cbd5e1" strokeWidth="0.3" />
      <line x1="4" y1="22" x2="36" y2="22" stroke="#cbd5e1" strokeWidth="0.3" />
      <line x1="4" y1="28" x2="36" y2="28" stroke="#cbd5e1" strokeWidth="0.3" />
    </svg>
  ),
  "100lb Matte Text": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
      <line x1="4" y1="10" x2="36" y2="10" stroke="#cbd5e1" strokeWidth="0.3" />
      <line x1="4" y1="16" x2="36" y2="16" stroke="#cbd5e1" strokeWidth="0.3" />
      <line x1="4" y1="22" x2="36" y2="22" stroke="#cbd5e1" strokeWidth="0.3" />
      <line x1="4" y1="28" x2="36" y2="28" stroke="#cbd5e1" strokeWidth="0.3" />
    </svg>
  ),
  "80lb Gloss Cover": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <defs><linearGradient id="gc" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#f1f5f9" /></linearGradient></defs>
      <rect width="40" height="40" fill="url(#gc)" stroke="#cbd5e1" strokeWidth="0.8" rx="1" />
    </svg>
  ),
  "NCR Paper": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fff" />
      <rect x="2" y="2" width="36" height="12" fill="#fef9c3" rx="1" stroke="#fde047" strokeWidth="0.3" />
      <rect x="2" y="15" width="36" height="12" fill="#fce7f3" rx="1" stroke="#f9a8d4" strokeWidth="0.3" />
      <rect x="2" y="28" width="36" height="10" fill="#dbeafe" rx="1" stroke="#93c5fd" strokeWidth="0.3" />
    </svg>
  ),
  "Linen Stock": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#faf5ff" />
      {[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39].map((y) => (
        <line key={`lh-${y}`} x1="0" y1={y} x2="40" y2={y} stroke="#c084fc" strokeWidth="0.25" opacity="0.35" />
      ))}
      {[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39].map((x) => (
        <line key={`lv-${x}`} x1={x} y1="0" x2={x} y2="40" stroke="#c084fc" strokeWidth="0.25" opacity="0.35" />
      ))}
    </svg>
  ),
  // Hardware & Frames
  "H-Stakes (wire)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f3f4f6" />
      <line x1="14" y1="6" x2="14" y2="34" stroke="#6b7280" strokeWidth="1.5" />
      <line x1="26" y1="6" x2="26" y2="34" stroke="#6b7280" strokeWidth="1.5" />
      <line x1="14" y1="20" x2="26" y2="20" stroke="#6b7280" strokeWidth="1.5" />
    </svg>
  ),
  "Retractable Banner Stand": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f3f4f6" />
      <rect x="14" y="4" width="12" height="28" fill="#d1d5db" rx="1" stroke="#9ca3af" strokeWidth="0.5" />
      <rect x="10" y="32" width="20" height="4" fill="#9ca3af" rx="1" />
    </svg>
  ),
  "X-Banner Stand": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f3f4f6" />
      <line x1="10" y1="6" x2="30" y2="34" stroke="#6b7280" strokeWidth="1" />
      <line x1="30" y1="6" x2="10" y2="34" stroke="#6b7280" strokeWidth="1" />
      <rect x="12" y="6" width="16" height="24" fill="#d1d5db" fillOpacity="0.4" rx="1" />
    </svg>
  ),
  "Feather Flag Pole Kit": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f3f4f6" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#6b7280" strokeWidth="1" />
      <path d="M20 4 Q30 8 28 16 Q26 24 20 28" fill="#93c5fd" fillOpacity="0.4" stroke="#60a5fa" strokeWidth="0.5" />
    </svg>
  ),
  "Teardrop Flag Pole Kit": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f3f4f6" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#6b7280" strokeWidth="1" />
      <path d="M20 4 Q32 12 28 22 Q24 30 20 30" fill="#a5b4fc" fillOpacity="0.4" stroke="#818cf8" strokeWidth="0.5" />
    </svg>
  ),
  "A-Frame Sidewalk Stand": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f3f4f6" />
      <line x1="12" y1="34" x2="20" y2="6" stroke="#6b7280" strokeWidth="1.2" />
      <line x1="28" y1="34" x2="20" y2="6" stroke="#6b7280" strokeWidth="1.2" />
      <rect x="14" y="10" width="12" height="18" fill="#d1d5db" fillOpacity="0.5" rx="1" />
    </svg>
  ),
  "Table Top Stand": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f3f4f6" />
      <rect x="8" y="28" width="24" height="6" fill="#9ca3af" rx="1" />
      <rect x="12" y="8" width="16" height="20" fill="#d1d5db" rx="1" stroke="#9ca3af" strokeWidth="0.5" />
    </svg>
  ),
  Grommets: (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fef3c7" />
      {[10, 20, 30].map((x) =>
        [10, 20, 30].map((y) => (
          <g key={`g-${x}-${y}`}>
            <circle cx={x} cy={y} r="3.5" fill="#d97706" opacity="0.3" />
            <circle cx={x} cy={y} r="1.5" fill="#fef3c7" />
          </g>
        ))
      )}
    </svg>
  ),
  // Films & Laminates
  "Gloss Laminate": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <defs><linearGradient id="glosslam" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e0f2fe" /><stop offset="40%" stopColor="#fff" /><stop offset="100%" stopColor="#e0f2fe" /></linearGradient></defs>
      <rect width="40" height="40" fill="url(#glosslam)" />
    </svg>
  ),
  "Matte Laminate": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f1f5f9" />
    </svg>
  ),
  "Soft Touch Laminate": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fce4ec" rx="4" />
      <rect x="4" y="4" width="32" height="32" fill="#fce7f3" rx="3" />
    </svg>
  ),
  "UV Coating (Spot/Flood)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fffbeb" />
      <circle cx="20" cy="20" r="12" fill="#fde68a" opacity="0.4" />
      <circle cx="20" cy="20" r="6" fill="#fbbf24" opacity="0.3" />
    </svg>
  ),
  "Floor Laminate": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f0fdf4" />
      {[0, 8, 16, 24, 32].map((y) => (
        <line key={`fl-${y}`} x1="0" y1={y} x2="40" y2={y} stroke="#86efac" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      ))}
    </svg>
  ),
  "Cold Laminate": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#eff6ff" />
      <rect x="3" y="3" width="34" height="34" fill="#dbeafe" rx="2" />
    </svg>
  ),
  // Sticker & Label Stock
  "White Vinyl (permanent)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fff" stroke="#d1d5db" strokeWidth="1" />
      <rect x="8" y="8" width="24" height="24" rx="12" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
    </svg>
  ),
  "Clear Vinyl": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <defs><pattern id="checker" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#e5e7eb" /><rect x="4" y="4" width="4" height="4" fill="#e5e7eb" /><rect x="4" y="0" width="4" height="4" fill="#f9fafb" /><rect x="0" y="4" width="4" height="4" fill="#f9fafb" /></pattern></defs>
      <rect width="40" height="40" fill="url(#checker)" />
    </svg>
  ),
  "Holographic Film": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <defs><linearGradient id="holo" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c084fc" /><stop offset="25%" stopColor="#60a5fa" /><stop offset="50%" stopColor="#34d399" /><stop offset="75%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f472b6" /></linearGradient></defs>
      <rect width="40" height="40" fill="url(#holo)" opacity="0.4" />
    </svg>
  ),
  "Paper Label (uncoated)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fff" stroke="#e5e7eb" strokeWidth="0.8" />
      <line x1="6" y1="12" x2="34" y2="12" stroke="#d1d5db" strokeWidth="0.3" />
      <line x1="6" y1="18" x2="34" y2="18" stroke="#d1d5db" strokeWidth="0.3" />
      <line x1="6" y1="24" x2="34" y2="24" stroke="#d1d5db" strokeWidth="0.3" />
    </svg>
  ),
  "BOPP (White/Clear)": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#f0f9ff" />
      <rect x="2" y="2" width="36" height="36" fill="#e0f2fe" rx="2" stroke="#7dd3fc" strokeWidth="0.4" />
    </svg>
  ),
  "Kraft Paper": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#d6b88c" />
      {[0, 5, 10, 15, 20, 25, 30, 35, 40].map((y) => (
        <line key={`kr-${y}`} x1="0" y1={y} x2="40" y2={y + 1} stroke="#c9a76c" strokeWidth="0.4" opacity="0.5" />
      ))}
    </svg>
  ),
  "Transfer Vinyl": (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill="#fef2f2" />
      <path d="M4 20 L12 12 L20 20 L28 12 L36 20" fill="none" stroke="#f87171" strokeWidth="0.8" opacity="0.4" />
      <path d="M4 28 L12 20 L20 28 L28 20 L36 28" fill="none" stroke="#f87171" strokeWidth="0.8" opacity="0.3" />
    </svg>
  ),
};

/** Fallback texture swatch for materials without a specific pattern */
function DefaultSwatch({ name }) {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="rounded">
      <rect width="40" height="40" fill={`hsl(${hue}, 30%, 92%)`} />
      <rect x="4" y="4" width="32" height="32" rx="4" fill={`hsl(${hue}, 30%, 86%)`} />
    </svg>
  );
}

function MaterialSwatch({ name }) {
  const pattern = TEXTURE_PATTERNS[name];
  if (pattern) return pattern;
  return <DefaultSwatch name={name} />;
}

/* ------------------------------------------------------------------ */
/*  Category icon SVGs (inline, teal-colored)                         */
/* ------------------------------------------------------------------ */
function CategoryIcon({ type }) {
  const cls = "h-5 w-5 text-teal-600";
  const icons = {
    roll: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    ),
    rigid: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    paper: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    hardware: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.84-3.37a.75.75 0 01-.27-1.02l2.47-4.28a.75.75 0 011.02-.27l5.84 3.37m-3.22 5.57l5.84 3.37a.75.75 0 001.02-.27l2.47-4.28a.75.75 0 00-.27-1.02l-5.84-3.37m-3.22 5.57l3.22-5.57" />
      </svg>
    ),
    films: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m12.75 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m1.5 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
      </svg>
    ),
    sticker: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  };
  return icons[type] || null;
}

/* ------------------------------------------------------------------ */
/*  Chevron component                                                 */
/* ------------------------------------------------------------------ */
function Chevron({ open }) {
  return (
    <svg
      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                               */
/* ------------------------------------------------------------------ */
export default function MaterialsHandbookPage() {
  const [openSection, setOpenSection] = useState(null);
  const [search, setSearch] = useState("");

  // Compute totals
  const totalMaterials = useMemo(
    () => MATERIAL_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0),
    []
  );

  // Filter items based on search
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MATERIAL_CATEGORIES;

    return MATERIAL_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.specs.toLowerCase().includes(q) ||
          item.usage.toLowerCase().includes(q) ||
          item.products.some((p) => p.toLowerCase().includes(q))
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [search]);

  // When searching, auto-expand all matching sections
  const isSearching = search.trim().length > 0;

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const isSectionOpen = (id) => {
    if (isSearching) return true;
    return openSection === id;
  };

  const filteredTotal = useMemo(
    () => filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0),
    [filteredCategories]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Materials Handbook</h1>
        <p className="mt-1 text-sm text-gray-500">
          Read-only reference guide for all materials, substrates, hardware, and finishing options
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
            Total Materials
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">{totalMaterials}</p>
        </div>
        {MATERIAL_CATEGORIES.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
              {cat.title}
            </p>
            <p className="mt-1 text-2xl font-black text-gray-900">{cat.items.length}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, specs, usage, or product slug..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search results summary */}
      {isSearching && (
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900">{filteredTotal}</span> material{filteredTotal !== 1 ? "s" : ""} matching &ldquo;{search.trim()}&rdquo;
        </p>
      )}

      {/* Accordion sections */}
      <div className="space-y-3">
        {filteredCategories.map((cat) => {
          const open = isSectionOpen(cat.id);
          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(cat.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <CategoryIcon type={cat.icon} />
                <h2 className="flex-1 text-sm font-bold text-gray-900" style={{ color: "#0d9488" }}>
                  {cat.title}
                </h2>
                <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                  {cat.items.length}
                </span>
                <Chevron open={open} />
              </button>

              {/* Section content */}
              {open && (
                <div className="border-t border-gray-100">
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          <th className="w-[56px] px-4 py-2.5"></th>
                          <th className="px-4 py-2.5">Material</th>
                          <th className="px-4 py-2.5">Specs</th>
                          <th className="px-4 py-2.5">Usage / Purpose</th>
                          <th className="px-4 py-2.5">Products</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map((item, idx) => (
                          <tr
                            key={item.name}
                            className={`border-b border-gray-50 transition-colors hover:bg-teal-50/30 ${
                              idx % 2 === 0 ? "" : "bg-gray-50/30"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <MaterialSwatch name={item.name} />
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">
                              {item.specs}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.usage}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {item.products.map((slug) => (
                                  <span
                                    key={slug}
                                    className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                                  >
                                    {slug}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card layout */}
                  <div className="space-y-0 md:hidden">
                    {cat.items.map((item, idx) => (
                      <div
                        key={item.name}
                        className={`border-b border-gray-100 p-4 ${idx % 2 === 0 ? "" : "bg-gray-50/40"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0">
                            <MaterialSwatch name={item.name} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="mt-0.5 font-mono text-xs text-gray-500">{item.specs}</p>
                            <p className="mt-1 text-sm text-gray-600">{item.usage}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.products.map((slug) => (
                                <span
                                  key={slug}
                                  className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                                >
                                  {slug}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No results */}
      {filteredCategories.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <svg
            className="mx-auto h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">
            No materials found matching &ldquo;{search.trim()}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
