"use client";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/**
 * Fixed mobile bottom bar for configurator pricing + CTA.
 *
 * Props:
 *  - quoteLoading       — show skeleton
 *  - hasQuote           — whether pricing is available
 *  - totalCents         — total including tax
 *  - summaryText        — one-line subtitle (e.g. "$1.20/ea × 500")
 *  - canAddToCart        — enables buttons
 *  - onAddToCart         — handler
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
  summaryText,
  canAddToCart,
  onAddToCart,
  onBuyNow,
  buyNowLoading,
  placeholderText,
  t,
  quoteOnly,
  onRequestQuote,
}) {
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
            ) : hasQuote ? (
              <>
                <p className="text-lg font-black text-gray-900">{formatCad(totalCents)}</p>
                {summaryText && (
                  <p className="truncate text-[11px] text-gray-500">{summaryText}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">{placeholderText || t?.("configurator.selectOptions") || "Select options"}</p>
            )}
          </div>
          {quoteOnly ? (
            <button
              type="button"
              onClick={onRequestQuote}
              className="shrink-0 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-gray-800"
            >
              {t?.("configurator.requestQuote") || "Get Quote"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onAddToCart}
                disabled={!canAddToCart}
                className={`shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  canAddToCart
                    ? "bg-gray-900 text-white shadow-lg hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t?.("configurator.addToCart") || "Add to Cart"}
              </button>
              {onBuyNow && (
                <button
                  type="button"
                  onClick={onBuyNow}
                  disabled={!canAddToCart || buyNowLoading}
                  className={`shrink-0 rounded-xl border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    canAddToCart && !buyNowLoading
                      ? "border-gray-900 text-gray-900"
                      : "cursor-not-allowed border-gray-200 text-gray-400"
                  }`}
                >
                  {buyNowLoading ? "..." : (t?.("configurator.buyNow") || "Buy Now")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {/* Bottom spacing */}
      <div className="lg:hidden" style={{ height: "calc(var(--mobile-nav-offset, 72px) + 80px)" }} />
    </>
  );
}
