"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/**
 * Fixed mobile bottom bar for configurator pricing + CTA.
 *
 * Props:
 *  - quoteLoading       — show skeleton
 *  - hasQuote           — whether pricing is available
 *  - totalCents         — total including tax
 *  - quantity           — order quantity (for dual pricing)
 *  - summaryText        — one-line subtitle (e.g. "$1.20/ea × 500")
 *  - canAddToCart        — enables buttons
 *  - onAddToCart         — handler (accepts optional extraOptions param)
 *  - onBuyNow           — handler (optional, omit for single-button mode)
 *  - buyNowLoading      — spinner state
 *  - placeholderText    — shown when no quote
 *  - t                  — translation function
 *  - quoteOnly          — show "Request Quote" instead
 *  - onRequestQuote     — handler for quote-only
 */
export default function MobileBottomBar({
  quoteLoading,
  hasQuote,
  totalCents = 0,
  quantity = 0,
  summaryText,
  canAddToCart,
  onAddToCart,
  onBuyNow,
  buyNowLoading,
  placeholderText,
  t,
  quoteOnly,
  onRequestQuote,
  quoteError,
  onRetryPrice,
}) {
  // ─── Add to Cart Animation ───
  const [atcState, setAtcState] = useState("idle");
  const atcTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(atcTimerRef.current);
  }, []);

  const handleAtcClick = useCallback(() => {
    if (atcState !== "idle") return;
    setAtcState("adding");
    onAddToCart?.();

    atcTimerRef.current = setTimeout(() => {
      setAtcState("added");
      atcTimerRef.current = setTimeout(() => {
        setAtcState("idle");
      }, 2000);
    }, 1000);
  }, [atcState, onAddToCart]);

  const atcContent =
    atcState === "adding" ? (
      <svg className="mx-auto h-4 w-4 animate-spin text-[#fff]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : atcState === "added" ? (
      <span className="inline-flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        {t?.("configurator.added") || "Added!"}
      </span>
    ) : (
      t?.("configurator.addToCart") || "Add to Cart"
    );

  const atcBgClass =
    atcState === "added"
      ? "bg-emerald-600 text-[#fff]"
      : atcState === "adding"
      ? "bg-gray-600 text-[#fff] cursor-wait"
      : canAddToCart
      ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800"
      : "cursor-not-allowed bg-gray-200 text-gray-400";

  return (
    <>
      <div
        className="fixed inset-x-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden"
        style={{ bottom: "calc(var(--mobile-nav-offset, 72px) + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteError ? (
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-red-600">
                  {t?.("configurator.priceError") || "Unable to calculate price"}
                </p>
                {onRetryPrice && (
                  <button
                    type="button"
                    onClick={onRetryPrice}
                    className="shrink-0 rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    {t?.("configurator.retry") || "Retry"}
                  </button>
                )}
              </div>
            ) : hasQuote ? (
              <>
                <p className="text-lg font-black text-gray-900">{formatCad(totalCents)} <span className="text-[10px] font-normal text-gray-400">before tax</span></p>
                {/* Dual pricing or summary text */}
                {quantity > 1 ? (
                  <p className="truncate text-[11px] text-gray-500">
                    ({formatCad(Math.round(totalCents / quantity))}/each)
                  </p>
                ) : summaryText ? (
                  <p className="truncate text-[11px] text-gray-500">{summaryText}</p>
                ) : null}
              </>
            ) : !canAddToCart && !quoteLoading ? (
              <p className="text-xs text-amber-600">{t?.("configurator.selectFirst") || "Select options above"}</p>
            ) : (
              <p className="text-sm text-gray-400">{placeholderText || t?.("configurator.selectOptions") || "Select options"}</p>
            )}
          </div>
          {quoteOnly ? (
            <button
              type="button"
              onClick={onRequestQuote}
              className="shrink-0 rounded-sm bg-gray-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#fff] shadow-lg hover:bg-gray-800"
            >
              {t?.("configurator.requestQuote") || "Get Quote"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAtcClick}
                disabled={!canAddToCart || atcState !== "idle"}
                className={`shrink-0 rounded-sm px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${atcBgClass}`}
              >
                {atcContent}
              </button>
              {onBuyNow && (
                <button
                  type="button"
                  onClick={onBuyNow}
                  disabled={!canAddToCart || buyNowLoading}
                  className={`shrink-0 rounded-sm border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    canAddToCart && !buyNowLoading
                      ? "border-gray-900 bg-gray-900 text-[#fff] hover:bg-gray-800"
                      : "cursor-not-allowed border-gray-200 text-gray-400"
                  }`}
                >
                  {buyNowLoading ? "..." : (t?.("configurator.buyNow") || "Buy Now")}
                </button>
              )}
            </>
          )}
        </div>
        {/* Trust signals */}
        <div className="mx-auto mt-2 flex max-w-lg items-center justify-center gap-3 text-[10px] text-gray-400">
          <span className="inline-flex items-center gap-0.5">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            {t?.("configurator.trustSecure") || "Secure"}
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-0.5">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            {t?.("configurator.trustToronto") || "Toronto"}
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-0.5">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t?.("configurator.freeProof") || "Free Proof"}
          </span>
        </div>
      </div>
      {/* Bottom spacing */}
      <div className="lg:hidden" style={{ height: "calc(var(--mobile-nav-offset, 72px) + 96px)" }} />
    </>
  );
}
