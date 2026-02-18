"use client";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/**
 * Sticky pricing sidebar shared across all configurators.
 *
 * Props:
 *  - summaryLines: [{ label, value }]  — option summary rows
 *  - quoteLoading, quoteError          — loading / error state
 *  - unitCents, subtotalCents, taxCents, totalCents — pricing
 *  - canAddToCart                       — enables buttons
 *  - onAddToCart, onBuyNow             — handlers
 *  - buyNowLoading                     — buy-now spinner
 *  - badges: [string]                  — trust badge labels
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
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Preview area */}
        {previewSlot && (
          <div className="flex items-center justify-center rounded-xl bg-gray-50 p-6">
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
              <span className="text-sm font-bold text-gray-800">{formatCad(unitCents)} / ea</span>
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
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">HST (13%)</span>
              <span className="text-sm text-gray-500">{formatCad(taxCents)}</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex items-baseline justify-between">
              <span className="text-base font-black text-gray-900">Total</span>
              <span className="text-2xl font-black text-gray-900">{formatCad(totalCents)}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 px-4 py-6 text-center">
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
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
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

        {/* Action buttons */}
        <div className="space-y-2.5 pt-2">
          {quoteOnly ? (
            <button
              type="button"
              onClick={onRequestQuote}
              className="w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
            >
              {t?.("configurator.requestQuote") || "Request a Quote"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onAddToCart}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                  canAddToCart
                    ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t?.("configurator.addToCart") || "Add to Cart"}
              </button>
              <button
                type="button"
                onClick={onBuyNow}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
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

        {/* Trust badges */}
        {badges.length > 0 && (
          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            {badges.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mr-3 text-gray-300">|</span>}
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
