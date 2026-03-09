"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Client-side quote simulator for the pricing detail page.
 * Receives pre-loaded product data from server component — no re-fetch needed.
 */
export default function QuoteSimulator({ product }) {
  const { t } = useTranslation();
  const slug = product?.slug;

  // Smart size defaults based on category
  const defaultWidth = (product?.pricingUnit === "per_sqft" || product?.category === "banners-displays") ? 24
    : product?.category === "signs-rigid-boards" ? 18 : 3;
  const defaultHeight = (product?.pricingUnit === "per_sqft" || product?.category === "banners-displays") ? 36
    : product?.category === "signs-rigid-boards" ? 24 : 3;

  const [quantity, setQuantity] = useState(100);
  const [widthIn, setWidthIn] = useState(defaultWidth);
  const [heightIn, setHeightIn] = useState(defaultHeight);
  const [material, setMaterial] = useState("");

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const fetchQuote = useCallback(async () => {
    if (!slug) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const body = { slug, quantity, widthIn, heightIn };
      if (material) body.material = material;
      const res = await fetch("/api/admin/pricing-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("admin.priceDetail.quoteFailed"));
      setQuote(data);
    } catch (err) {
      if (err.name === "AbortError") {
        setQuoteError(t("admin.priceDetail.timeoutError"));
      } else {
        setQuoteError(err.message);
      }
    } finally {
      clearTimeout(timeout);
      setQuoteLoading(false);
    }
  }, [slug, quantity, widthIn, heightIn, material, t]);

  // Auto-fetch on param change (debounced)
  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const ledger = quote?.quoteLedger;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Live Quote Simulator */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#111]">{t("admin.priceDetail.simulatorTitle")}</h2>
        <p className="mt-1 text-xs text-[#999]">{t("admin.priceDetail.simulatorDesc")}</p>

        <div className="mt-5 space-y-4">
          <SimInput label={t("admin.priceDetail.inputQty")} type="number" min={1} value={quantity} onChange={(v) => setQuantity(Math.max(1, Number(v) || 1))} />
          <SimInput label={t("admin.priceDetail.inputWidth")} type="number" min={0.5} step={0.5} value={widthIn} onChange={(v) => setWidthIn(Number(v) || 1)} suffix={t("admin.priceDetail.inches")} />
          <SimInput label={t("admin.priceDetail.inputHeight")} type="number" min={0.5} step={0.5} value={heightIn} onChange={(v) => setHeightIn(Number(v) || 1)} suffix={t("admin.priceDetail.inches")} />
          <SimInput label={t("admin.priceDetail.inputMaterial")} type="text" value={material} onChange={(v) => setMaterial(v)} placeholder={t("admin.priceDetail.materialPlaceholder")} />

          <button
            onClick={fetchQuote}
            disabled={quoteLoading}
            className="w-full rounded-[3px] bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:opacity-50"
            style={{ minHeight: 48 }}
          >
            {quoteLoading ? t("admin.priceDetail.calculating") : t("admin.priceDetail.calculate")}
          </button>
        </div>

        {/* Quote Error */}
        {quoteError && (
          <div className="mt-4 rounded-[3px] border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{t("admin.priceDetail.quoteErrorTitle")}</p>
            <p className="mt-1 text-xs text-red-600">{quoteError}</p>
            <button onClick={fetchQuote} className="mt-2 text-xs font-medium text-red-700 underline">{t("admin.priceDetail.retryQuote")}</button>
          </div>
        )}

        {/* Quote Result */}
        {quote && !quoteError && (
          <div className="mt-5 space-y-3">
            <div className="rounded-[3px] bg-[#fafafa] p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#666]">{t("admin.priceDetail.unitPrice")}</span>
                <span className="text-2xl font-bold text-[#111]">${((quote.unitCents || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-[#e0e0e0] pt-2">
                <span className="text-sm text-[#666]">{t("admin.priceDetail.totalPrice")}</span>
                <span className="text-2xl font-bold text-[#4f46e5]">${((quote.totalCents || 0) / 100).toFixed(2)}</span>
              </div>
            </div>

            {quote.breakdown && (
              <details className="rounded-[3px] border border-[#e0e0e0] bg-white">
                <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-[#666] hover:bg-[#fafafa]">
                  {t("admin.priceDetail.rawBreakdown")}
                </summary>
                <div className="border-t border-[#e0e0e0] px-4 py-3">
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-[#666]">
                    {JSON.stringify(quote.breakdown, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Right: Quote Ledger */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#111]">{t("admin.priceDetail.ledgerTitle")}</h2>
        <p className="mt-1 text-xs text-[#999]">{t("admin.priceDetail.ledgerDesc")}</p>

        {quoteLoading ? (
          <div className="mt-8 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-[3px] bg-[#f0f0f0]" />)}
          </div>
        ) : quoteError ? (
          <div className="mt-8 rounded-[3px] border border-yellow-200 bg-yellow-50 p-4 text-center">
            <p className="text-sm text-yellow-800">{t("admin.priceDetail.ledgerUnavailable")}</p>
            <p className="mt-1 text-xs text-yellow-700">{t("admin.priceDetail.ledgerUnavailableDesc")}</p>
          </div>
        ) : !ledger ? (
          <div className="mt-8 text-center text-sm text-[#999]">{t("admin.priceDetail.ledgerEmpty")}</div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Input summary */}
            <div className="rounded-[3px] bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-800">{t("admin.priceDetail.ledgerInputs")}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-700">
                {ledger.inputs && Object.entries(ledger.inputs).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-medium">{k}:</span> {String(v)}
                  </div>
                ))}
              </div>
            </div>

            {/* Derived values */}
            {ledger.derived && Object.keys(ledger.derived).length > 0 && (
              <div className="rounded-[3px] bg-amber-50 p-4">
                <p className="text-xs font-semibold text-amber-800">{t("admin.priceDetail.ledgerDerived")}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-amber-700">
                  {Object.entries(ledger.derived).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-medium">{k}:</span> {typeof v === "number" ? v.toFixed(4) : String(v)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Line items */}
            <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#fafafa]">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.priceDetail.ledgerItem")}</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.priceDetail.ledgerFormula")}</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.priceDetail.ledgerAmount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec]">
                    {(ledger.lines || []).map((line, i) => (
                      <tr key={i} className={`text-sm ${line.code === "ROUNDING" || line.code === "RECONCILE" ? "bg-[#fafafa]" : ""}`}>
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-[#111]">{line.label}</span>
                          <span className="ml-1.5 text-[10px] text-[#999]">{line.code}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[#666]">{line.formula}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm">
                          <span className={line.amountCents < 0 ? "text-red-600" : "text-[#111]"}>
                            ${(line.amountCents / 100).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#ccc] bg-[#fafafa]">
                      <td className="px-3 py-3 text-sm font-bold text-[#111]" colSpan={2}>{t("admin.priceDetail.ledgerTotal")}</td>
                      <td className="px-3 py-3 text-right text-lg font-bold text-[#4f46e5]">${((ledger.totalCents || 0) / 100).toFixed(2)}</td>
                    </tr>
                    <tr className="bg-[#fafafa]">
                      <td className="px-3 py-2 text-xs text-[#666]" colSpan={2}>{t("admin.priceDetail.ledgerUnitPrice")}</td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-[#111]">${((ledger.unitCents || 0) / 100).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {ledger.engineVersion && (
              <p className="text-[10px] text-[#999]">{t("admin.priceDetail.engineVersion")}: {ledger.engineVersion}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SimInput({ label, suffix, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#666]">{label}</label>
      <div className="relative mt-1">
        <input
          {...props}
          onChange={(e) => props.onChange(e.target.value)}
          className="w-full rounded-[3px] border border-[#d0d0d0] px-4 py-3 text-sm text-[#111] outline-none focus:border-black"
          style={{ minHeight: 48 }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">{suffix}</span>
        )}
      </div>
    </div>
  );
}
