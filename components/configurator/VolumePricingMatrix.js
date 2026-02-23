"use client";

import { useEffect, useRef, useState } from "react";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const DEFAULT_TIERS = [25, 50, 100, 250, 500];
const BEST_VALUE_INDEX = 2; // middle tier

/**
 * Volume pricing matrix — clickable grid showing 5 quantity tiers with pricing.
 *
 * Props:
 *  - slug              — product slug for pricing API
 *  - tiers             — array of quantities (default [25, 50, 100, 250, 500])
 *  - selectedQty       — currently selected quantity
 *  - onSelectQty(qty)  — callback when a tier is clicked
 *  - customQty         — custom quantity input value (string)
 *  - onCustomQtyChange — callback for custom quantity input
 *  - widthIn, heightIn — dimensions (forwarded to API)
 *  - material          — material (forwarded to API)
 *  - options           — options (forwarded to API)
 *  - sizeLabel         — size label (forwarded to API)
 *  - t                 — translation function
 */
export default function VolumePricingMatrix({
  slug,
  tiers = DEFAULT_TIERS,
  selectedQty,
  onSelectQty,
  customQty = "",
  onCustomQtyChange,
  widthIn,
  heightIn,
  material,
  options = {},
  sizeLabel,
  t,
}) {
  const [tierPrices, setTierPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  // Fetch prices for all tiers
  useEffect(() => {
    if (!slug) return;
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);

    const fetches = tiers.map((qty) => {
      const body = { slug, quantity: qty };
      if (widthIn > 0) body.widthIn = widthIn;
      if (heightIn > 0) body.heightIn = heightIn;
      if (material) body.material = material;
      if (options && Object.keys(options).length > 0) body.options = options;
      if (sizeLabel) body.sizeLabel = sizeLabel;

      return fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      })
        .then((r) => r.json())
        .then((data) => ({ qty, totalCents: data.totalCents || 0, unitCents: data.unitCents || 0 }))
        .catch(() => ({ qty, totalCents: 0, unitCents: 0 }));
    });

    Promise.all(fetches)
      .then((results) => {
        const map = {};
        for (const r of results) map[r.qty] = r;
        setTierPrices(map);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [slug, JSON.stringify(tiers), widthIn, heightIn, material, JSON.stringify(options), sizeLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCustom = customQty !== "" && !tiers.includes(parseInt(customQty, 10));

  return (
    <div className="space-y-3">
      {/* Tier grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {tiers.map((qty, idx) => {
          const price = tierPrices[qty];
          const isSelected = !isCustom && selectedQty === qty;
          const isBestValue = idx === BEST_VALUE_INDEX;

          return (
            <button
              key={qty}
              type="button"
              onClick={() => {
                onSelectQty?.(qty);
                onCustomQtyChange?.("");
              }}
              className={`relative rounded-xl border-2 px-3 py-3.5 text-center transition-all ${
                isSelected
                  ? "border-teal-500 bg-teal-50 shadow-md"
                  : "border-gray-200 bg-white shadow-sm hover:border-gray-400 hover:shadow-md"
              }`}
            >
              {/* Best Value badge */}
              {isBestValue && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-teal-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Best Value
                </span>
              )}

              {/* Quantity */}
              <span className={`block text-lg font-black ${isSelected ? "text-teal-700" : "text-gray-900"}`}>
                {qty.toLocaleString()}
              </span>

              {/* Pricing */}
              {loading ? (
                <div className="mt-1.5 space-y-1">
                  <div className="mx-auto h-3 w-14 animate-pulse rounded bg-gray-200" />
                  <div className="mx-auto h-3 w-10 animate-pulse rounded bg-gray-200" />
                </div>
              ) : price && price.unitCents > 0 ? (
                <div className="mt-1.5">
                  <span className={`block text-xs font-semibold ${isSelected ? "text-teal-600" : "text-gray-600"}`}>
                    {formatCad(price.unitCents)}/ea
                  </span>
                  <span className="block text-[11px] text-gray-400">
                    {formatCad(price.totalCents)} total
                  </span>
                </div>
              ) : (
                <span className="mt-1.5 block text-xs text-gray-400">—</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom quantity */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500">
          {t?.("configurator.customQty") || "Custom Quantity"}:
        </label>
        <input
          type="number"
          min="1"
          max="999999"
          value={customQty}
          onChange={(e) => {
            onCustomQtyChange?.(e.target.value);
            const n = parseInt(e.target.value, 10);
            if (n > 0) onSelectQty?.(n);
          }}
          placeholder="e.g. 750"
          className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
    </div>
  );
}
