"use client";

/**
 * Trust signals block for inline configurators.
 * Mirrors what PricingSidebar displays — secure checkout badges,
 * "Made in Toronto", free proof, quality guarantee, payment logos.
 *
 * Usage: <InlineTrustSignals t={t} />
 */
export default function InlineTrustSignals({ t }) {
  return (
    <div className="space-y-3">
      {/* Trust signals bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-gray-400">
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
        <span className="group relative inline-flex items-center gap-1 cursor-help">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {t?.("configurator.freeProof") || "Free Proof"}
          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {t?.("configurator.freeProofTooltip") || "We send a digital proof for your approval before printing. No surprises!"}
          </span>
        </span>
      </div>

      {/* Payment badges */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        {t?.("trust.secureCheckout") || "Secure Checkout"}
        <span className="mx-1 text-gray-300">&middot;</span>
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

      {/* Quality guarantee */}
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
    </div>
  );
}
