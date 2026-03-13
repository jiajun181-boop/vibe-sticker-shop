"use client";

import { useEffect, useRef, useState } from "react";
import useConfiguratorActions from "./useConfiguratorActions";
import { formatCad } from "@/lib/product-helpers";

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
 *  - productName        — product display name for email quote
 *  - summaryLines       — [{ label, value }] for email quote
 *  - unitCents          — unit price for email quote
 *  - subtotalCents      — subtotal for email quote
 *  - categorySlug       — category for delivery estimate
 *  - locale             — "en" or "zh" for delivery estimate
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
  productName,
  summaryLines,
  unitCents = 0,
  subtotalCents = 0,
  fromPrice,
  categorySlug,
  locale,
  disabledReason,
  artworkMode,
  hasArtwork,
  artworkIntent,
  onArtworkIntentChange,
  hideRush,
}) {
  // ─── Publish --mobile-cta-h so page padding stays correct ───
  const barRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const h = Math.ceil(barRef.current?.offsetHeight || 0);
      root.style.setProperty("--mobile-cta-h", `${h}px`);
    };
    update();
    let ro = null;
    if (typeof ResizeObserver !== "undefined" && barRef.current) {
      ro = new ResizeObserver(update);
      ro.observe(barRef.current);
    }
    return () => {
      if (ro) ro.disconnect();
      root.style.setProperty("--mobile-cta-h", "0px");
    };
  }, []);

  // ─── Shared configurator state (rush, artwork gating, ATC animation) ───
  const {
    rushProduction, setRushProduction,
    needsArtworkDecision, effectiveCanAddToCart,
    displayTotal, displayTotalWithFees,
    atcState, handleAtcClick, handleBuyNowClick,
  } = useConfiguratorActions({
    canAddToCart, artworkMode, hasArtwork, artworkIntent,
    unitCents, subtotalCents, totalCents,
    onAddToCart, onBuyNow,
  });

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
      : effectiveCanAddToCart
      ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800"
      : "cursor-not-allowed bg-gray-200 text-gray-400";

  return (
    <>
      <div
        ref={barRef}
        className="fixed inset-x-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] md:hidden"
        style={{ bottom: "calc(var(--mobile-nav-h, 0px) + var(--safe-bottom, 0px))" }}
      >
        {/* Rush toggle for mobile — hidden when product has its own turnaround step */}
        {hasQuote && !quoteOnly && !hideRush && (
          <div className="mx-auto mb-2 flex max-w-lg items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition-colors has-[:checked]:border-red-300 has-[:checked]:bg-red-50 has-[:checked]:text-red-700">
              <input
                type="checkbox"
                checked={rushProduction}
                onChange={(e) => setRushProduction(e.target.checked)}
                className="h-3 w-3 rounded border-gray-300"
              />
              {t?.("configurator.rushProduction") || "24-Hour Rush"} {rushProduction && "+30%"}
            </label>
          </div>
        )}
        {/* Compact artwork intent picker for mobile */}
        {needsArtworkDecision && hasQuote && !quoteOnly && artworkMode === "upload-optional" && (
          <div className="mx-auto mb-2 max-w-lg space-y-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onArtworkIntentChange?.(artworkIntent === "upload-later" ? null : "upload-later")}
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold border transition-colors ${
                  artworkIntent === "upload-later"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-600"
                }`}
              >
                {t?.("configurator.uploadLater") || "Upload Later"}
              </button>
              <button
                type="button"
                onClick={() => onArtworkIntentChange?.(artworkIntent === "design-help" ? null : "design-help")}
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold border transition-colors ${
                  artworkIntent === "design-help"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700"
                }`}
              >
                {t?.("configurator.designHelpOption") || "Design Help (+$45)"}
              </button>
            </div>
            {artworkIntent === "upload-later" && (
              <p className="text-center text-[10px] text-gray-400">{t?.("configurator.uploadLaterReassurance") || "No worries — you can upload files after checkout"}</p>
            )}
            {artworkIntent === "design-help" && (
              <p className="text-center text-[10px] text-indigo-500">{t?.("configurator.designHelpTimeline") || "We'll contact you within 1 business day"}</p>
            )}
          </div>
        )}
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteError ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-red-600 truncate">
                    {t?.("configurator.priceError") || "Unable to calculate price"}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {t?.("configurator.priceErrorHelp") || "Still having trouble? Call (647) 783-4728"}
                  </p>
                </div>
                {onRetryPrice && (
                  <button
                    type="button"
                    onClick={onRetryPrice}
                    className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white min-h-[40px] shadow-sm active:bg-red-700"
                  >
                    {t?.("configurator.retry") || "Retry"}
                  </button>
                )}
              </div>
            ) : quoteOnly && fromPrice > 0 ? (
              <>
                <p className="text-sm font-black text-gray-900">
                  {t?.("configurator.from") || "From"} {formatCad(fromPrice)}
                </p>
                <p className="truncate text-[10px] text-gray-400">{t?.("configurator.exactPriceOnQuote") || "Exact price based on vehicle & coverage"}</p>
              </>
            ) : hasQuote ? (
              <>
                <p className="text-lg font-black text-gray-900">{formatCad(displayTotalWithFees)} <span className="text-[10px] font-normal text-gray-400">{t?.("configurator.beforeTax") || "before tax"}</span></p>
                {quantity > 1 ? (
                  <p className="truncate text-[11px] font-semibold text-emerald-600">
                    {(t?.("configurator.thatsOnly") || "That's only {price} each").replace("{price}", formatCad(Math.round(displayTotal / quantity)))}
                  </p>
                ) : summaryText ? (
                  <p className="truncate text-[11px] text-gray-500">{summaryText}</p>
                ) : null}
              </>
            ) : !effectiveCanAddToCart && !quoteLoading ? (
              <p className="text-xs text-amber-600">
                {needsArtworkDecision && canAddToCart
                  ? (artworkMode === "upload-required"
                    ? (t?.("configurator.uploadDesign") || "Upload artwork above")
                    : (t?.("configurator.chooseArtworkOption") || "Choose artwork option below"))
                  : disabledReason || t?.("configurator.selectFirst") || "Select options above"}
              </p>
            ) : (
              <p className="text-sm text-gray-400">{placeholderText || t?.("configurator.selectOptions") || "Select options"}</p>
            )}
          </div>
          {quoteOnly ? (
            <button
              type="button"
              onClick={onRequestQuote}
              className="shrink-0 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#fff] shadow-lg hover:bg-gray-800"
            >
              {t?.("configurator.requestQuote") || "Get Quote"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAtcClick}
                disabled={!effectiveCanAddToCart || atcState !== "idle"}
                className={`shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${atcBgClass}`}
              >
                {atcContent}
              </button>
              {onBuyNow && (
                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  disabled={!effectiveCanAddToCart || buyNowLoading}
                  className={`shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    effectiveCanAddToCart && !buyNowLoading
                      ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800"
                      : "cursor-not-allowed bg-gray-100 text-gray-400"
                  }`}
                >
                  {buyNowLoading ? "..." : (t?.("configurator.buyNow") || "Buy Now")}
                </button>
              )}
            </>
          )}
        </div>
        {/* Trust signals — compact single line */}
        <div className="mx-auto mt-1.5 flex max-w-lg items-center justify-center gap-3 text-[10px] text-gray-400">
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
      {/* Spacer removed — #main-content uses padding-bottom: var(--bottom-chrome) */}
    </>
  );
}
