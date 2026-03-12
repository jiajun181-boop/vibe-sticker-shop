"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

// ── Template-level fallback material options ──────────────────────────────────
// Used only when no product-level options are available.
const TEMPLATE_MATERIAL_FALLBACK = {
  vinyl_print: [
    { id: "white-vinyl", label: "White Vinyl" },
    { id: "clear-vinyl", label: "Clear Vinyl" },
    { id: "frosted-vinyl", label: "Frosted Vinyl" },
    { id: "holographic-vinyl", label: "Holographic Film" },
    { id: "3m-reflective", label: "3M Reflective" },
  ],
  board_sign: [
    { id: "coroplast_4mm", label: "Coroplast 4mm" },
    { id: "coroplast_6mm", label: "Coroplast 6mm" },
    { id: "foam_5mm", label: "Foam Board 5mm" },
    { id: "foam_10mm", label: "Foam Board 10mm" },
    { id: "pvc_3mm", label: "PVC Board 3mm" },
  ],
  banner: [
    { id: "13oz-vinyl", label: "13oz Frontlit Vinyl" },
    { id: "mesh-standard", label: "Mesh Standard (8oz)" },
    { id: "15oz-blockout", label: "15oz Blockout" },
    { id: "premium-vinyl", label: "PET Grey Back (Roll-up)" },
  ],
  paper_print: [
    { id: "14pt-gloss", label: "14pt Gloss Cardstock" },
    { id: "100lb-gloss-text", label: "100lb Gloss Text" },
    { id: "20lb_bond", label: "20lb Bond" },
  ],
  vinyl_cut: [
    { id: "cast-vinyl", label: "Cast Vinyl" },
    { id: "reflective", label: "Reflective Vinyl" },
    { id: "outdoor-vinyl", label: "Outdoor Vinyl" },
  ],
  canvas: null,
};

// Template display names — maps engine keys to i18n keys for bilingual display
const TEMPLATE_LABEL_KEYS = {
  vinyl_print: "admin.priceDetail.tplVinylPrint",
  sticker_ref: "admin.priceDetail.tplStickerRef",
  board_sign: "admin.priceDetail.tplBoardSign",
  banner: "admin.priceDetail.tplBanner",
  paper_print: "admin.priceDetail.tplPaperPrint",
  canvas: "admin.priceDetail.tplCanvas",
  vinyl_cut: "admin.priceDetail.tplVinylCut",
  outsourced: "admin.priceDetail.tplOutsourced",
  preset: "admin.priceDetail.tplPreset",
  poster_fixed: "admin.priceDetail.tplPosterFixed",
  quote_only: "admin.priceDetail.tplQuoteOnly",
};

/**
 * Client-side quote simulator for the pricing detail page.
 *
 * Material resolution priority:
 *   1. Product-level (productMaterials) — narrowest, from product-materials.js
 *   2. Template-level fallback — broader, from TEMPLATE_MATERIAL_FALLBACK
 *   3. Hidden — canvas, quote_only, or no template
 *
 * productMaterials shapes:
 *   - { type: "fixed" }           → material not configurable, field hidden
 *   - { type: "fixed", material } → single fixed material, shown as info
 *   - { type: "options", options } → constrained select dropdown
 *   - null                        → fall back to template-level
 */
export default function QuoteSimulator({ product, pricingTemplate, productMaterials, materialSource }) {
  const { t } = useTranslation();
  const slug = product?.slug;

  // ── Resolve material display mode ─────────────────────────────────────────
  // Priority: product-level > template-level > hidden
  const isFixedMaterial = productMaterials?.type === "fixed";
  const fixedMaterialId = isFixedMaterial ? productMaterials.material || null : null;
  const fixedMaterialLabel = isFixedMaterial ? productMaterials.label || null : null;

  const materialOptions = productMaterials?.type === "options"
    ? productMaterials.options
    : (!productMaterials ? (TEMPLATE_MATERIAL_FALLBACK[pricingTemplate] || null) : null);

  const hideMaterial = isFixedMaterial || pricingTemplate === "canvas" || !pricingTemplate;

  // Smart size defaults based on category
  const defaultWidth = (product?.pricingUnit === "per_sqft" || product?.category === "banners-displays") ? 24
    : product?.category === "signs-rigid-boards" ? 18 : 3;
  const defaultHeight = (product?.pricingUnit === "per_sqft" || product?.category === "banners-displays") ? 36
    : product?.category === "signs-rigid-boards" ? 24 : 3;

  const [quantity, setQuantity] = useState(100);
  const [widthIn, setWidthIn] = useState(defaultWidth);
  const [heightIn, setHeightIn] = useState(defaultHeight);
  const [material, setMaterial] = useState(fixedMaterialId || materialOptions?.[0]?.id || "");

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const fetchQuote = useCallback(async () => {
    if (!slug) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setQuoteLoading(true);
    setQuoteError(null);
    setValidationError(null);
    try {
      const body = { slug, quantity, widthIn, heightIn };
      // Send material: fixed material, selected material, or nothing
      if (fixedMaterialId) {
        body.material = fixedMaterialId;
      } else if (!hideMaterial && material) {
        body.material = material;
      }
      const res = await fetch("/api/admin/pricing-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.status === 422) {
        setValidationError(data.error || t("admin.priceDetail.invalidMaterialFallback"));
        setQuote(null);
      } else if (!res.ok) {
        throw new Error(data.error || t("admin.priceDetail.quoteFailed"));
      } else {
        setQuote(data);
      }
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
  }, [slug, quantity, widthIn, heightIn, material, fixedMaterialId, hideMaterial, t]);

  // Auto-fetch on param change (debounced)
  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const ledger = quote?.quoteLedger;
  const resolvedTemplate = quote?.template || quote?._resolved?.template || pricingTemplate;
  const resolvedMaterial = quote?.meta?.materialName || quote?.meta?.paperName || quote?.meta?.boardName || null;

  // Material source label for operator context
  const materialSourceLabel = productMaterials?.type === "options"
    ? t("admin.priceDetail.sourceProduct")
    : productMaterials?.type === "fixed"
      ? t("admin.priceDetail.sourceFixed")
      : t("admin.priceDetail.sourceTemplate");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Live Quote Simulator */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#111]">{t("admin.priceDetail.simulatorTitle")}</h2>
        <p className="mt-1 text-xs text-[#999]">{t("admin.priceDetail.simulatorDesc")}</p>

        {/* Template indicator */}
        {pricingTemplate && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wide">{t("admin.priceDetail.templateIndicator")}</span>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {TEMPLATE_LABEL_KEYS[pricingTemplate] ? t(TEMPLATE_LABEL_KEYS[pricingTemplate]) : pricingTemplate}
            </span>
            {materialOptions && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-[#888]">
                {t("admin.priceDetail.stockCount").replace("{count}", materialOptions.length).replace("{source}", materialSourceLabel)}
              </span>
            )}
          </div>
        )}

        {/* Fixed material notice */}
        {isFixedMaterial && (
          <div className="mt-3 rounded-[3px] bg-blue-50 border border-blue-200 px-3 py-2">
            <p className="text-[11px] font-medium text-blue-800">
              {t("admin.priceDetail.fixedStockNotice").replace("{label}", fixedMaterialLabel || t("admin.priceDetail.fixedByType"))}
            </p>
            <p className="text-[10px] text-blue-600">
              {t("admin.priceDetail.materialNotConfigurable")}
            </p>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <SimInput label={t("admin.priceDetail.inputQty")} type="number" min={1} value={quantity} onChange={(v) => setQuantity(Math.max(1, Number(v) || 1))} />
          <SimInput label={t("admin.priceDetail.inputWidth")} type="number" min={0.5} step={0.5} value={widthIn} onChange={(v) => setWidthIn(Number(v) || 1)} suffix={t("admin.priceDetail.inches")} />
          <SimInput label={t("admin.priceDetail.inputHeight")} type="number" min={0.5} step={0.5} value={heightIn} onChange={(v) => setHeightIn(Number(v) || 1)} suffix={t("admin.priceDetail.inches")} />

          {/* Material input — constrained to known-valid options only */}
          {!hideMaterial && (
            <div>
              <label className="block text-sm font-medium text-[#666]">{t("admin.priceDetail.inputMaterial")}</label>
              <div className="mt-1">
                {materialOptions ? (
                  <select
                    value={material}
                    onChange={(e) => { setMaterial(e.target.value); setValidationError(null); }}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-4 py-3 text-sm text-[#111] outline-none focus:border-black bg-white"
                    style={{ minHeight: 48 }}
                  >
                    {materialOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-[3px] bg-amber-50 border border-amber-200 px-3 py-2">
                    <p className="text-[11px] font-medium text-amber-800">{t("admin.priceDetail.noMaterialOptions")}</p>
                    <p className="text-[10px] text-amber-600">{t("admin.priceDetail.noMaterialOptionsHint")}</p>
                  </div>
                )}
              </div>

              {/* Inline validation error */}
              {validationError && (
                <div className="mt-2 rounded-[3px] border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-xs font-semibold text-red-700">{t("admin.priceDetail.invalidMaterial")}</p>
                  <p className="mt-0.5 text-[11px] text-red-600">{validationError}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={fetchQuote}
            disabled={quoteLoading}
            className="w-full rounded-[3px] bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:opacity-50"
            style={{ minHeight: 48 }}
          >
            {quoteLoading ? t("admin.priceDetail.calculating") : t("admin.priceDetail.calculate")}
          </button>
        </div>

        {/* Quote Error — non-validation errors */}
        {quoteError && (
          <div className="mt-4 rounded-[3px] border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{t("admin.priceDetail.quoteErrorTitle")}</p>
            <p className="mt-1 text-xs text-red-600">{quoteError}</p>
            <p className="mt-1 text-[10px] text-red-500">{t("admin.priceDetail.quoteErrorHint")}</p>
            <button onClick={fetchQuote} className="mt-2 rounded-[3px] bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">{t("admin.priceDetail.retryQuote")}</button>
          </div>
        )}

        {/* Quote Result */}
        {quote && !quoteError && !validationError && (
          <div className="mt-5 space-y-3">
            {/* Pricing truth summary */}
            <div className="rounded-[3px] bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span>
                  <span className="font-medium text-emerald-800">{t("admin.priceDetail.templateIndicator")}</span>{" "}
                  <span className="text-emerald-700">{TEMPLATE_LABEL_KEYS[resolvedTemplate] ? t(TEMPLATE_LABEL_KEYS[resolvedTemplate]) : resolvedTemplate}</span>
                </span>
                {resolvedMaterial && (
                  <span>
                    <span className="font-medium text-emerald-800">{t("admin.priceDetail.materialIndicator")}</span>{" "}
                    <span className="text-emerald-700">{resolvedMaterial}</span>
                  </span>
                )}
                {quote.meta?.marginCategory && (
                  <span>
                    <span className="font-medium text-emerald-800">{t("admin.priceDetail.marginIndicator")}</span>{" "}
                    <span className="text-emerald-700">{quote.meta.marginCategory}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Price display */}
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

            {/* Raw debug detail — demoted to secondary collapsible */}
            {(quote.breakdown || quote.meta) && (
              <details className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa]">
                <summary className="cursor-pointer px-4 py-2.5 text-[10px] font-medium text-[#bbb] hover:text-[#999] uppercase tracking-wide">
                  {t("admin.priceDetail.rawBreakdown")}
                </summary>
                <div className="border-t border-[#e0e0e0] px-4 py-3 space-y-2">
                  {quote.breakdown && (
                    <pre className="overflow-x-auto whitespace-pre-wrap text-[10px] text-[#888] font-mono">
                      {JSON.stringify(quote.breakdown, null, 2)}
                    </pre>
                  )}
                  {quote.meta && (
                    <pre className="overflow-x-auto whitespace-pre-wrap text-[10px] text-[#888] font-mono">
                      {JSON.stringify(quote.meta, null, 2)}
                    </pre>
                  )}
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
            <p className="text-xs text-[#999]">{t("admin.priceDetail.ledgerLoading")}</p>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-[3px] bg-[#f0f0f0]" />)}
          </div>
        ) : quoteError || validationError ? (
          <div className="mt-8 rounded-[3px] border border-yellow-200 bg-yellow-50 p-4 text-center">
            <p className="text-sm font-semibold text-yellow-800">{t("admin.priceDetail.ledgerUnavailable")}</p>
            <p className="mt-1 text-xs text-yellow-700">{t("admin.priceDetail.ledgerUnavailableDesc")}</p>
            <button onClick={fetchQuote} className="mt-2 rounded-[3px] bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-700">{t("admin.priceDetail.retryQuote")}</button>
          </div>
        ) : !ledger ? (
          <div className="mt-8 text-center text-sm text-[#999]">{t("admin.priceDetail.ledgerEmpty")}</div>
        ) : (
          <div className="mt-5 space-y-4">
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
