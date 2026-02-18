"use client";

const SHAPES = {
  "die-cut": (
    <svg viewBox="0 0 80 80" fill="none">
      <path d="M40 8C25 8 14 20 12 32c-2 14 6 26 18 32 6 3 14 4 20 0 8-5 14-14 16-24 2-12-6-24-18-30a20 20 0 0 0-8-2z" fill="#FCD34D" stroke="#92400E" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M30 36l6 6 14-14" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "kiss-cut": (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="6" fill="#E0E7FF" stroke="#4338CA" strokeWidth="1.5" />
      <rect x="18" y="18" width="44" height="44" rx="22" fill="#C7D2FE" stroke="#4338CA" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="40" cy="40" r="8" fill="#818CF8" />
    </svg>
  ),
  sheets: (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
      <rect x="14" y="14" width="22" height="22" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
      <rect x="44" y="14" width="22" height="22" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
      <rect x="14" y="44" width="22" height="22" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
      <rect x="44" y="44" width="22" height="22" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
    </svg>
  ),
  "roll-labels": (
    <svg viewBox="0 0 80 80" fill="none">
      <ellipse cx="40" cy="40" rx="32" ry="18" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
      <ellipse cx="40" cy="40" rx="12" ry="18" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
      <circle cx="40" cy="40" r="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
    </svg>
  ),
  "vinyl-lettering": (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="8" y="20" width="64" height="40" rx="4" fill="#F3E8FF" stroke="#7C3AED" strokeWidth="1.5" />
      <text x="40" y="48" textAnchor="middle" fill="#7C3AED" fontSize="22" fontWeight="bold" fontFamily="sans-serif">ABC</text>
    </svg>
  ),
  decals: (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="8" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
      <rect x="16" y="16" width="48" height="48" rx="4" fill="#FECACA" stroke="#DC2626" strokeWidth="1" strokeDasharray="4 3" />
      <path d="M32 40h16M40 32v16" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  transfer: (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="6" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" />
      <path d="M28 52V28h24v24" stroke="#EA580C" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
      <path d="M40 20v24m0 0l-8-8m8 8l8-8" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "static-cling": (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="6" fill="#F0FDF4" stroke="#16A34A" strokeWidth="1.5" />
      <path d="M40 18v8m0 28v8M18 40h8m28 0h8" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="40" r="14" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
      <path d="M36 40l3 3 6-6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  magnets: (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
      <path d="M26 30a14 14 0 0 1 28 0v16H46V30a6 6 0 0 0-12 0v16H26V30z" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
      <rect x="26" y="46" width="8" height="6" rx="1" fill="#DC2626" />
      <rect x="46" y="46" width="8" height="6" rx="1" fill="#2563EB" />
    </svg>
  ),
};

// Background gradients matching each shape's color palette
const BG_COLORS = {
  "die-cut": "from-amber-50 to-yellow-50",
  "kiss-cut": "from-indigo-50 to-blue-50",
  sheets: "from-emerald-50 to-green-50",
  "roll-labels": "from-amber-50 to-orange-50",
  "vinyl-lettering": "from-purple-50 to-violet-50",
  decals: "from-red-50 to-rose-50",
  transfer: "from-orange-50 to-amber-50",
  "static-cling": "from-green-50 to-emerald-50",
  magnets: "from-blue-50 to-indigo-50",
};

export function ShapeIcon({ type, className = "h-12 w-12" }) {
  const svg = SHAPES[type];
  if (!svg) return null;
  return <span className={`inline-flex ${className}`}>{svg}</span>;
}

export function getShapeBg(type) {
  return BG_COLORS[type] || "from-gray-50 to-gray-100";
}

export default ShapeIcon;
