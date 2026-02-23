"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/**
 * Sticky pricing sidebar shared across all configurators.
 *
 * Props:
 *  - summaryLines: [{ label, value }]  — option summary rows
 *  - quoteLoading, quoteError          — loading / error state
 *  - unitCents, subtotalCents, taxCents, totalCents — pricing
 *  - quantity                           — order quantity (for dual pricing display)
 *  - canAddToCart                       — enables buttons
 *  - onAddToCart, onBuyNow             — handlers (accept optional extraOptions param)
 *  - buyNowLoading                     — buy-now spinner
 *  - badges: [string]                  — trust badge labels (legacy, optional)
 *  - previewSlot                       — optional top preview area (e.g. SVG illustration)
 *  - extraRows                         — optional extra pricing rows [{ label, value }]
 *  - t                                 — translation function
 *  - volumeRows                        — optional [{ qty, discount }] for volume discounts
 *  - activeQty                         — current qty (highlights matching volume row)
 *  - quoteOnly                         — if true, show "Request Quote" instead of ATC/Buy Now
 *  - onRequestQuote                    — handler for quote-only mode
 */
export default function PricingSidebar({
  summaryLines = [],
  quoteLoading,
  quoteError,
  unitCents = 0,
  subtotalCents = 0,
  taxCents = 0,
  totalCents = 0,
  quantity = 0,
  canAddToCart,
  onAddToCart,
  onBuyNow,
  buyNowLoading,
  badges = [],
  previewSlot,
  extraRows = [],
  t,
  volumeRows,
  activeQty,
  quoteOnly,
  onRequestQuote,
}) {
  // ─── Rush Production ───
  const [rushProduction, setRushProduction] = useState(false);
  const rushMultiplier = rushProduction ? 1.3 : 1;

  const displaySubtotal = Math.round(subtotalCents * rushMultiplier);
  const displayTax = Math.round(taxCents * rushMultiplier);
  const displayTotal = Math.round(totalCents * rushMultiplier);
  const displayUnit = Math.round(unitCents * rushMultiplier);

  // ─── Add to Cart Animation ───
  const [atcState, setAtcState] = useState("idle"); // "idle" | "adding" | "added"
  const atcTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(atcTimerRef.current);
  }, []);

  const handleAtcClick = useCallback(() => {
    if (atcState !== "idle") return;
    setAtcState("adding");

    // Call parent handler with rush info
    onAddToCart?.({ rushProduction });

    // Spinner → Added! → idle
    atcTimerRef.current = setTimeout(() => {
      setAtcState("added");
      atcTimerRef.current = setTimeout(() => {
        setAtcState("idle");
      }, 2000);
    }, 1000);
  }, [atcState, onAddToCart, rushProduction]);

  const handleBuyNowClick = useCallback(() => {
    onBuyNow?.({ rushProduction });
  }, [onBuyNow, rushProduction]);

  const atcLabel =
    atcState === "adding" ? null :
    atcState === "added" ? null :
    (t?.("configurator.addToCart") || "Add to Cart");

  const atcClasses =
    atcState === "added"
      ? "w-full rounded-sm px-4 py-3.5 text-sm font-bold uppercase tracking-wider bg-emerald-600 text-white cursor-default"
      : atcState === "adding"
      ? "w-full rounded-sm px-4 py-3.5 text-sm font-bold uppercase tracking-wider bg-gray-600 text-white cursor-wait"
      : canAddToCart
      ? "w-full rounded-sm px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-200 bg-gray-900 text-white shadow-lg shadow-gray-900/20 hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
      : "w-full rounded-sm px-4 py-3.5 text-sm font-bold uppercase tracking-wider cursor-not-allowed bg-gray-200 text-gray-400";

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Preview area */}
        {previewSlot && (
          <div className="flex items-center justify-center rounded-sm bg-gray-50 p-6">
            {previewSlot}
          </div>
        )}

        {/* Summary title */}
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-gray-400">
          {t?.("configurator.summary") || "Order Summary"}
        </h2>

        {/* Summary details */}
        <dl className="space-y-2.5">
          {summaryLines.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <dt className="text-gray-500">{r.label}</dt>
              <dd className="font-semibold text-gray-800">{r.value}</dd>
            </div>
          ))}
        </dl>

        <hr className="border-gray-100" />

        {/* Pricing */}
        {quoteLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : quoteError ? (
          <p className="text-xs font-medium text-red-500">{quoteError}</p>
        ) : unitCents > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">{t?.("configurator.unitPrice") || "Unit price"}</span>
              <span className="text-sm font-bold text-gray-800">{formatCad(displayUnit)} / ea</span>
            </div>
            {extraRows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between">
                <span className="text-xs text-gray-500">{r.label}</span>
                <span className="text-sm text-gray-600">{r.value}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">{t?.("configurator.subtotal") || "Subtotal"}</span>
              <span className="text-sm font-medium text-gray-700">{formatCad(displaySubtotal)}</span>
            </div>
            {rushProduction && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-amber-600">Rush surcharge (+30%)</span>
                <span className="text-sm font-medium text-amber-600">
                  + {formatCad(Math.round(subtotalCents * 0.3))}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">HST (13%)</span>
              <span className="text-sm text-gray-500">{formatCad(displayTax)}</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex items-baseline justify-between">
              <span className="text-base font-black text-gray-900">Total</span>
              <span className="text-2xl font-black text-gray-900">{formatCad(displayTotal)}</span>
            </div>
            {/* Dual pricing: unit price below total */}
            {quantity > 1 && (
              <p className="text-right text-xs text-gray-400">
                ({formatCad(Math.round(displayTotal / quantity))}/each)
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-sm bg-gray-50 px-4 py-6 text-center">
            <p className="text-xs text-gray-400">{t?.("configurator.selectOptions") || "Select your options for pricing"}</p>
          </div>
        )}

        {/* Volume discounts */}
        {volumeRows && volumeRows.length > 0 && (
          <div>
            <button
              type="button"
              onClick={(e) => e.currentTarget.nextElementSibling.classList.toggle("hidden")}
              className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-gray-400 hover:text-gray-600"
            >
              <span>{t?.("configurator.volumeDiscounts") || "Volume Discounts"}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <div className="mt-2 space-y-1 hidden">
              {volumeRows.map((row) => (
                <div
                  key={row.qty}
                  className={`flex items-center justify-between rounded-sm px-3 py-1.5 text-xs transition-colors ${
                    activeQty === row.qty ? "bg-gray-100 font-bold text-gray-900" : "text-gray-500"
                  }`}
                >
                  <span>{row.qty.toLocaleString()}+</span>
                  <span>{row.discount < 1 ? `-${Math.round((1 - row.discount) * 100)}%` : "Base"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rush Production Checkbox */}
        {!quoteOnly && unitCents > 0 && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100">
            <input
              type="checkbox"
              checked={rushProduction}
              onChange={(e) => setRushProduction(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-800">24-Hour Rush Production</span>
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">+30%</span>
            </div>
          </label>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5 pt-2">
          {quoteOnly ? (
            <button
              type="button"
              onClick={onRequestQuote}
              className="w-full rounded-sm bg-gray-900 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
            >
              {t?.("configurator.requestQuote") || "Request a Quote"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAtcClick}
                disabled={!canAddToCart || atcState !== "idle"}
                className={atcClasses}
              >
                {atcState === "adding" ? (
                  <svg className="mx-auto h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : atcState === "added" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Added!
                  </span>
                ) : (
                  atcLabel
                )}
              </button>
              <button
                type="button"
                onClick={handleBuyNowClick}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-sm border-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                  canAddToCart && !buyNowLoading
                    ? "border-gray-900 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
                    : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
              >
                {buyNowLoading ? (t?.("configurator.processing") || "Processing...") : (t?.("configurator.buyNow") || "Buy Now")}
              </button>
            </>
          )}
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            Secure Checkout
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            Made in Toronto
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Free Proof
          </span>
        </div>
      </div>
    </aside>
  );
}
