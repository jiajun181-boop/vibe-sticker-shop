"use client";

import { useState } from "react";
import EmailQuotePopover from "./EmailQuotePopover";
import DeliveryEstimate from "./DeliveryEstimate";
import useConfiguratorActions from "./useConfiguratorActions";
import { PRODUCT_PRINT_SPECS } from "@/lib/design-studio/product-configs";
import { RUSH_MULTIPLIER, HST_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/order-config";
import { formatCad } from "@/lib/product-helpers";

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
 *  - productName                       — product display name for email quote
 *  - quickQuantities: [number]         — common quantity presets (e.g. [50,100,250,500,1000])
 *  - onQuantityChange: (qty) => void   — callback to set quantity from quick-select buttons
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
  fromPrice,
  onRequestQuote,
  onRetryPrice,
  productName,
  categorySlug,
  locale,
  productSlug,
  disabledReason,
  artworkMode,
  hasArtwork,
  artworkIntent,
  onArtworkIntentChange,
  hideRush,
  quickQuantities,
  onQuantityChange,
}) {
  // ─── Shared configurator state (rush, artwork gating, ATC animation) ───
  const {
    rushProduction, setRushProduction, rushSurcharge,
    needsArtworkDecision, effectiveCanAddToCart,
    designHelpCents,
    displayUnit, displaySubtotal, displaySubtotalWithFees,
    atcState, handleAtcClick, handleBuyNowClick,
  } = useConfiguratorActions({
    canAddToCart, artworkMode, hasArtwork, artworkIntent,
    unitCents, subtotalCents, totalCents,
    onAddToCart, onBuyNow,
  });

  const atcLabel =
    atcState === "adding" ? null :
    atcState === "added" ? null :
    (t?.("configurator.addToCart") || "Add to Cart");

  const atcClasses =
    atcState === "added"
      ? "w-full rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider bg-emerald-600 text-[#fff] cursor-default"
      : atcState === "adding"
      ? "w-full rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider bg-gray-600 text-[#fff] cursor-wait"
      : effectiveCanAddToCart
      ? "w-full rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-200 bg-gray-900 text-[#fff] shadow-lg shadow-gray-900/20 hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
      : "w-full rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider cursor-not-allowed bg-gray-200 text-gray-400";

  return (
    <aside className="hidden md:block">
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
              <dd className="flex items-center gap-1.5 font-semibold text-gray-800">
                {r.value}
                {r.badge && (
                  <span className="rounded-full bg-green-100 px-1.5 py-px text-[9px] font-bold text-green-700">
                    {r.badge}
                  </span>
                )}
                {r.priceHint && (
                  <span className="text-[10px] font-semibold text-amber-600">
                    {r.priceHint}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {/* Quick quantity select */}
        {quickQuantities && quickQuantities.length > 0 && onQuantityChange && (
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              {t?.("configurator.popularQuantities") || "Popular quantities"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickQuantities.map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => onQuantityChange(qty)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    quantity === qty
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900"
                  }`}
                >
                  {qty.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* Pricing */}
        {quoteLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : quoteError ? (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-4 space-y-2 text-center">
            <p className="text-sm font-medium text-red-700">
              {t?.("configurator.priceError") || "Unable to calculate price"}
            </p>
            {onRetryPrice && (
              <button
                type="button"
                onClick={onRetryPrice}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                {t?.("configurator.retry") || "Try Again"}
              </button>
            )}
            <p className="text-xs text-red-500">
              {t?.("configurator.priceErrorHelp") || "Still having trouble? Call (647) 783-4728"}
            </p>
          </div>
        ) : quoteOnly && fromPrice > 0 ? (
          <div className="space-y-1 text-center">
            <p className="text-xs text-gray-500">{t?.("configurator.startingFrom") || "Starting from"}</p>
            <p className="text-2xl font-black text-gray-900">{formatCad(fromPrice)}</p>
            <p className="text-[10px] text-gray-400">{t?.("configurator.exactPriceOnQuote") || "Exact price based on vehicle & coverage"}</p>
          </div>
        ) : unitCents > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">{t?.("configurator.unitPrice") || "Unit price"}</span>
              <span className="text-sm font-bold text-gray-800">{formatCad(displayUnit)} {t?.("configurator.perEa") || "/ ea"}</span>
            </div>
            {extraRows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between">
                <span className="text-xs text-gray-500">{r.label}</span>
                <span className="text-sm text-gray-600">{r.value}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">{t?.("configurator.subtotal") || "Subtotal"}</span>
              <span className="text-sm font-medium text-gray-700">{formatCad(subtotalCents)}</span>
            </div>
            {rushProduction && !hideRush && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-amber-600">{t?.("configurator.rushSurcharge") || "Rush surcharge (+30%)"}</span>
                <span className="text-sm font-medium text-amber-600">
                  + {formatCad(rushSurcharge)}
                </span>
              </div>
            )}
            {designHelpCents > 0 && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-indigo-600">{t?.("configurator.designHelp") || "Design help"}</span>
                <span className="text-sm font-medium text-indigo-600">
                  + {formatCad(designHelpCents)}
                </span>
              </div>
            )}
            <hr className="border-gray-100" />
            <div className="flex items-baseline justify-between">
              <span className="text-base font-black text-gray-900">{t?.("configurator.total") || "Total"}</span>
              <span className="text-2xl font-black text-gray-900">{formatCad(displaySubtotalWithFees)}</span>
            </div>
            {/* Estimated tax + shipping breakdown */}
            <div className="mt-1 space-y-0.5 text-[11px] text-gray-400">
              <div className="flex justify-between">
                <span>{t?.("configurator.estHST") || "Est. HST (13%)"}</span>
                <span>+ {formatCad(Math.round(displaySubtotalWithFees * HST_RATE))}</span>
              </div>
              <div className="flex justify-between">
                <span>{t?.("configurator.shipping") || "Shipping"}</span>
                <span>{displaySubtotalWithFees >= FREE_SHIPPING_THRESHOLD ? (t?.("configurator.freeShipping") || "Free") : formatCad(SHIPPING_COST)}</span>
              </div>
              <div className="flex justify-between font-medium text-gray-500">
                <span>{t?.("configurator.estTotal") || "Est. total"}</span>
                <span>{formatCad(displaySubtotalWithFees + Math.round(displaySubtotalWithFees * HST_RATE) + (displaySubtotalWithFees >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST))}</span>
              </div>
            </div>
            {/* Prominent unit price callout */}
            {quantity > 1 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-center">
                <p className="text-sm font-bold text-emerald-700">
                  {(t?.("configurator.thatsOnly") || "That's only {price} each").replace("{price}", formatCad(displayUnit))}
                </p>
              </div>
            )}
            {/* Next tier nudge */}
            {(() => {
              if (!volumeRows || volumeRows.length === 0 || !activeQty) return null;
              const currentIdx = volumeRows.findIndex((r) => r.qty === activeQty);
              const nextTier = currentIdx >= 0 && currentIdx < volumeRows.length - 1
                ? volumeRows[currentIdx + 1]
                : null;
              if (!nextTier || nextTier.discount >= 1) return null;
              const savePercent = Math.round((1 - nextTier.discount) * 100);
              return (
                <p className="text-center text-xs text-amber-700 font-medium">
                  {(t?.("configurator.orderMoreSave") || "Order {qty}+ to save {percent}%")
                    .replace("{qty}", nextTier.qty.toLocaleString())
                    .replace("{percent}", savePercent)}
                </p>
              );
            })()}
          </div>
        ) : (
          <div className="rounded-sm bg-gray-50 px-4 py-6 text-center">
            <p className="text-xs text-gray-400">{t?.("configurator.selectOptions") || "Select your options for pricing"}</p>
          </div>
        )}

        {/* Volume discounts with save badges */}
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
              {volumeRows.map((row, i) => {
                const isActive = activeQty === row.qty;
                const isLast = i === volumeRows.length - 1;
                const savePercent = row.discount < 1 ? Math.round((1 - row.discount) * 100) : 0;
                return (
                  <div
                    key={row.qty}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      isActive ? "bg-gray-100 font-bold text-gray-900 ring-1 ring-gray-300" : "text-gray-500"
                    }`}
                  >
                    <span>{row.qty.toLocaleString()}+</span>
                    <span className="flex items-center gap-1.5">
                      {savePercent > 0 && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isLast ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {isLast ? (t?.("configurator.bestValue") || "Best Value") : (
                            (t?.("configurator.savePercent") || "Save {percent}%").replace("{percent}", savePercent)
                          )}
                        </span>
                      )}
                      <span>{savePercent > 0 ? `-${savePercent}%` : "Base"}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery estimate */}
        {unitCents > 0 && (
          <DeliveryEstimate
            categorySlug={categorySlug}
            rushProduction={rushProduction}
            t={t}
            locale={locale}
          />
        )}

        {/* Rush Production Checkbox — hidden when product has its own turnaround step */}
        {!quoteOnly && !hideRush && unitCents > 0 && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100">
            <input
              type="checkbox"
              checked={rushProduction}
              onChange={(e) => setRushProduction(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-800">{t?.("configurator.rushProduction") || "24-Hour Rush Production"}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{t?.("configurator.rushJustification") || "Prioritized queue, dedicated operator, shipped next business day (+30%)"}</p>
            </div>
          </label>
        )}

        {/* Artwork intent picker — shown when artwork not yet uploaded */}
        {needsArtworkDecision && unitCents > 0 && !quoteOnly && (
          artworkMode === "upload-required" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">{t?.("configurator.artworkRequired") || "Artwork Required"}</p>
              <p className="text-xs text-amber-600 mt-1">{t?.("configurator.uploadDesign") || "Upload your design file above to continue"}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t?.("configurator.noArtwork") || "No artwork yet?"}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onArtworkIntentChange?.(artworkIntent === "upload-later" ? null : "upload-later")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                    artworkIntent === "upload-later"
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t?.("configurator.uploadLater") || "Upload Later"}
                </button>
                <button
                  type="button"
                  onClick={() => onArtworkIntentChange?.(artworkIntent === "design-help" ? null : "design-help")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                    artworkIntent === "design-help"
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400"
                  }`}
                >
                  {t?.("configurator.designHelpOption") || "Design Help (+$45)"}
                </button>
              </div>
              {artworkIntent === "upload-later" && (
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <svg className="h-4 w-4 flex-shrink-0 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium text-emerald-700">{t?.("configurator.uploadLaterReassurance") || "No worries! You can email your artwork to orders@lunarprint.ca after placing your order."}</p>
                      <p className="text-[10px] text-emerald-600">{t?.("configurator.uploadLaterNote") || "We'll email you for artwork after you order."}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 px-3 py-2 space-y-1">
                    <p className="text-[10px] font-semibold text-gray-600">{t?.("configurator.fileAcceptLabel") || "When you're ready, we accept:"}</p>
                    <p className="text-[10px] text-gray-400">{t?.("configurator.acceptedFormats") || "PDF, AI, PNG, JPG (300+ DPI recommended)"}</p>
                  </div>
                  <a
                    href="/design-services"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                    {t?.("configurator.needDesignHelp") || "Need help? View our design services"}
                  </a>
                </div>
              )}
              {artworkIntent === "design-help" && (
                <div className="space-y-1">
                  <p className="text-[11px] text-indigo-600">{t?.("configurator.designHelpNote") || "Our designer will create your layout — $45 flat fee included."}</p>
                  <p className="text-[10px] text-indigo-400">{t?.("configurator.designHelpTimeline") || "We'll contact you within 1 business day to get started."}</p>
                </div>
              )}
            </div>
          )
        )}

        {/* Disabled hint — specific reason when available */}
        {!effectiveCanAddToCart && (
          <p className="text-center text-xs text-amber-600">
            {(artworkMode === "upload-required" && !hasArtwork && canAddToCart)
              ? (t?.("configurator.uploadDesign") || "Upload your artwork above to continue")
              : (artworkMode === "upload-optional" && !hasArtwork && !artworkIntent && canAddToCart)
              ? (t?.("configurator.chooseArtworkOption") || "Choose an artwork option above")
              : disabledReason
              || (quoteLoading ? (t?.("configurator.calculating") || "Calculating price...") : null)
              || (quoteError ? (t?.("configurator.fixError") || "Fix the error above") : null)
              || (unitCents === 0 ? (t?.("configurator.selectFirst") || "Select options above") : null)
              || (t?.("configurator.completeOptions") || "Complete all required options")}
          </p>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5 pt-2">
          {quoteOnly ? (
            <button
              type="button"
              onClick={onRequestQuote}
              className="w-full rounded-sm bg-gray-900 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-[#fff] shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
            >
              {t?.("configurator.requestQuote") || "Request a Quote"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAtcClick}
                disabled={!effectiveCanAddToCart || atcState !== "idle"}
                className={atcClasses}
              >
                {atcState === "adding" ? (
                  <svg className="mx-auto h-5 w-5 animate-spin text-[#fff]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : atcState === "added" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {t?.("configurator.added") || "Added!"}
                  </span>
                ) : (
                  atcLabel
                )}
              </button>
              <button
                type="button"
                onClick={handleBuyNowClick}
                disabled={!effectiveCanAddToCart || buyNowLoading}
                className={`w-full rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                  effectiveCanAddToCart && !buyNowLoading
                    ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800 active:scale-[0.98]"
                    : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
              >
                {buyNowLoading ? (t?.("configurator.processing") || "Processing...") : (t?.("configurator.buyNow") || "Buy Now")}
              </button>
            </>
          )}
        </div>

        {/* Email quote */}
        {productName && unitCents > 0 && !quoteOnly && (
          <EmailQuotePopover
            productName={productName}
            summaryLines={summaryLines}
            unitCents={unitCents}
            subtotalCents={subtotalCents}
            quantity={quantity}
            t={t}
          />
        )}

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            {t?.("configurator.secureCheckout") || "Secure Checkout"}
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            {t?.("configurator.madeInToronto") || "Made in Toronto"}
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t?.("configurator.freeProof") || "Free Proof"}
          </span>
        </div>

        {/* Design Online button — hidden for stamps (has built-in StampEditor) */}
        {productSlug && PRODUCT_PRINT_SPECS[productSlug] && !productSlug.startsWith("stamps") && (
          <a
            href={`/design/${productSlug}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
            {t?.("configurator.designOnline") || "Design Online"}
          </a>
        )}

        {/* Secure payment badges */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          {t?.("trust.secureCheckout") || "Secure Checkout"}
          <span className="mx-1 text-gray-300">·</span>
          <span className="font-bold tracking-wider text-gray-300">VISA</span>
          <span className="font-bold tracking-wider text-gray-300">MC</span>
          <span className="font-bold tracking-wider text-gray-300">AMEX</span>
        </div>

        {/* Free shipping banner */}
        <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-xs text-blue-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <span className="font-semibold">{t?.("configurator.freeShipping") || "Free shipping on orders $99+"}</span>
        </div>

        {/* Quality guarantee + refund link */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            {t?.("configurator.qualityGuarantee") || "Quality Guarantee"}
          </div>
          <p className="text-[11px] text-emerald-600 leading-relaxed">
            {t?.("configurator.guaranteeDesc") || "Free reprints if we make an error. You approve a digital proof before we print."}
          </p>
          <a href="/returns" className="inline-block text-[11px] font-semibold text-emerald-700 underline hover:text-emerald-900">
            {t?.("configurator.refundPolicy") || "Refund & Return Policy"}
          </a>
        </div>

        {/* Need help? Contact CTA */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center space-y-1">
          <p className="text-xs font-semibold text-gray-700">
            {t?.("configurator.needHelpTitle") || "Not sure what to order?"}
          </p>
          <p className="text-[11px] text-gray-500">
            {t?.("configurator.needHelpDesc") || "We'll help you pick the right product and options."}
          </p>
          <a
            href="tel:+16477834728"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-gray-800"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            {t?.("configurator.callUs") || "(647) 783-4728"}
          </a>
        </div>
      </div>
    </aside>
  );
}
