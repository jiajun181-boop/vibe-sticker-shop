"use client";

/**
 * Shows the best volume-discount tier for a cutting type's quantity presets.
 * E.g. "500+ Save 12%"
 */
export default function DiscountBadge({ quantities }) {
  if (!quantities?.length) return null;

  // Find the lowest qty tier that has a discount
  let bestQty = null;
  let bestPct = 0;
  for (const q of quantities) {
    const pct = q >= 1000 ? 18 : q >= 500 ? 12 : q >= 250 ? 7 : q >= 100 ? 3 : 0;
    if (pct > 0 && (!bestQty || q < bestQty)) {
      bestQty = q;
      bestPct = pct;
    }
  }

  if (!bestQty) return null;

  const label = bestQty >= 1000 ? `${bestQty / 1000}K` : String(bestQty);

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
      {label}+ Save {bestPct}%
    </span>
  );
}
