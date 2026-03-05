"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Admin Product Pricing Detail page.
 * 3-section layout:
 *   1. Product info card
 *   2. Live Quote Simulator (calls /api/admin/pricing-debug)
 *   3. Quote Ledger breakdown (formula display)
 *
 * Designed for 50-60 year old non-technical operators:
 * - Large fonts (>=16px body, 20-24px key prices)
 * - Touch-friendly inputs (>=44px height)
 * - Chinese labels with plain language
 * - No JSON / code terminology
 */
export default function ProductPricingDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();

  // Product data
  const [product, setProduct] = useState(null);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodError, setProdError] = useState(null);

  // Simulator inputs
  const [quantity, setQuantity] = useState(100);
  const [widthIn, setWidthIn] = useState(3);
  const [heightIn, setHeightIn] = useState(3);
  const [material, setMaterial] = useState("");

  // Quote result
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  // Load product
  useEffect(() => {
    if (!slug) return;
    setProdLoading(true);
    setProdError(null);
    fetch(`/api/admin/products?page=1&limit=500`)
      .then(r => r.json())
      .then(data => {
        const found = (data.products || []).find(p => p.slug === slug);
        if (!found) throw new Error(t("admin.priceDetail.notFound"));
        setProduct(found);
        // Set sensible defaults based on product
        if (found.pricingUnit === "per_sqft" || found.category === "banners-displays") {
          setWidthIn(24);
          setHeightIn(36);
        } else if (found.category === "signs-rigid-boards") {
          setWidthIn(18);
          setHeightIn(24);
        }
      })
      .catch(err => setProdError(err.message))
      .finally(() => setProdLoading(false));
  }, [slug, t]);

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    if (!slug) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const body = { slug, quantity, widthIn, heightIn };
      if (material) body.material = material;
      const res = await fetch("/api/admin/pricing-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quote failed");
      setQuote(data);
    } catch (err) {
      setQuoteError(err.message);
    } finally {
      setQuoteLoading(false);
    }
  }, [slug, quantity, widthIn, heightIn, material]);

  // Auto-fetch on param change (debounced)
  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  if (prodLoading) {
    return <div className="py-12 text-center text-lg text-gray-400">{t("admin.common.loading")}</div>;
  }
  if (prodError) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <p className="text-lg text-red-600">{prodError}</p>
        <Link href="/admin/pricing-dashboard" className="mt-4 inline-block text-base text-indigo-600 underline">{t("admin.priceDetail.backToList")}</Link>
      </div>
    );
  }

  const ledger = quote?.quoteLedger;
  const pricingConfig = (() => {
    try {
      return typeof product?.pricingConfig === "string" ? JSON.parse(product.pricingConfig) : (product?.pricingConfig || {});
    } catch { return {}; }
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/pricing-dashboard" className="text-indigo-600 hover:underline">
          {t("admin.priceDash.title")}
        </Link>
        <span>/</span>
        <span className="text-gray-700">{product?.name}</span>
      </nav>

      {/* Product Info Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{product?.name}</h1>
            <p className="mt-1 text-base text-gray-500">{product?.slug}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <InfoBadge label={t("admin.priceDetail.category")} value={product?.category} />
              <InfoBadge label={t("admin.priceDetail.pricingUnit")} value={product?.pricingUnit || "per_item"} />
              {product?.pricingPresetId && (
                <InfoBadge label={t("admin.priceDetail.presetId")} value={product.pricingPresetId} />
              )}
            </div>
          </div>
          <Link
            href={`/shop/${product?.category}/${product?.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            {t("admin.priceDetail.viewStorefront")}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        </div>

        {/* Pricing config summary */}
        {pricingConfig.fixedPrices && Object.keys(pricingConfig.fixedPrices).length > 0 && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">{t("admin.priceDetail.fixedPriceMode")}</p>
            <p className="mt-1 text-sm text-green-700">{t("admin.priceDetail.fixedPriceDesc")}</p>
          </div>
        )}
      </div>

      {/* Two-column: Simulator + Ledger */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Live Quote Simulator */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">{t("admin.priceDetail.simulatorTitle")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("admin.priceDetail.simulatorDesc")}</p>

          <div className="mt-5 space-y-4">
            {/* Quantity */}
            <SimInput
              label={t("admin.priceDetail.inputQty")}
              type="number"
              min={1}
              value={quantity}
              onChange={v => setQuantity(Math.max(1, Number(v) || 1))}
            />
            {/* Width */}
            <SimInput
              label={t("admin.priceDetail.inputWidth")}
              type="number"
              min={0.5}
              step={0.5}
              value={widthIn}
              onChange={v => setWidthIn(Number(v) || 1)}
              suffix={t("admin.priceDetail.inches")}
            />
            {/* Height */}
            <SimInput
              label={t("admin.priceDetail.inputHeight")}
              type="number"
              min={0.5}
              step={0.5}
              value={heightIn}
              onChange={v => setHeightIn(Number(v) || 1)}
              suffix={t("admin.priceDetail.inches")}
            />
            {/* Material */}
            <SimInput
              label={t("admin.priceDetail.inputMaterial")}
              type="text"
              value={material}
              onChange={v => setMaterial(v)}
              placeholder={t("admin.priceDetail.materialPlaceholder")}
            />

            <button
              onClick={fetchQuote}
              disabled={quoteLoading}
              className="w-full rounded-lg bg-indigo-600 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
              style={{ minHeight: 48 }}
            >
              {quoteLoading ? t("admin.priceDetail.calculating") : t("admin.priceDetail.calculate")}
            </button>
          </div>

          {/* Quote Result */}
          {quoteError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-base text-red-700">{quoteError}</p>
            </div>
          )}

          {quote && !quoteError && (
            <div className="mt-5 space-y-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-base text-gray-600">{t("admin.priceDetail.unitPrice")}</span>
                  <span className="text-2xl font-bold text-gray-900">${((quote.unitCents || 0) / 100).toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-gray-200 pt-2">
                  <span className="text-base text-gray-600">{t("admin.priceDetail.totalPrice")}</span>
                  <span className="text-2xl font-bold text-indigo-600">${((quote.totalCents || 0) / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Breakdown summary (if available, non-ledger) */}
              {quote.breakdown && (
                <details className="rounded-lg border border-gray-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {t("admin.priceDetail.rawBreakdown")}
                  </summary>
                  <div className="border-t border-gray-100 px-4 py-3">
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-gray-600">
                      {JSON.stringify(quote.breakdown, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Right: Quote Ledger (formula breakdown) */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">{t("admin.priceDetail.ledgerTitle")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("admin.priceDetail.ledgerDesc")}</p>

          {quoteLoading ? (
            <div className="mt-8 text-center text-base text-gray-400">{t("admin.priceDetail.calculating")}</div>
          ) : !ledger ? (
            <div className="mt-8 text-center text-base text-gray-400">{t("admin.priceDetail.ledgerEmpty")}</div>
          ) : (
            <div className="mt-5 space-y-4">
              {/* Input summary */}
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">{t("admin.priceDetail.ledgerInputs")}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-blue-700">
                  {ledger.inputs && Object.entries(ledger.inputs).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-medium">{k}:</span> {String(v)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Derived values */}
              {ledger.derived && Object.keys(ledger.derived).length > 0 && (
                <div className="rounded-lg bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">{t("admin.priceDetail.ledgerDerived")}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-amber-700">
                    {Object.entries(ledger.derived).map(([k, v]) => (
                      <div key={k}>
                        <span className="font-medium">{k}:</span> {typeof v === "number" ? v.toFixed(4) : String(v)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Line items — THE formula breakdown */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600">{t("admin.priceDetail.ledgerItem")}</th>
                      <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600">{t("admin.priceDetail.ledgerFormula")}</th>
                      <th className="px-3 py-2.5 text-right text-sm font-semibold text-gray-600">{t("admin.priceDetail.ledgerAmount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(ledger.lines || []).map((line, i) => (
                      <tr key={i} className={`text-sm ${line.code === "ROUNDING" || line.code === "RECONCILE" ? "bg-gray-50" : ""}`}>
                        <td className="px-3 py-2.5">
                          <div>
                            <span className="font-medium text-gray-900">{line.label}</span>
                            <span className="ml-1.5 text-xs text-gray-400">{line.code}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-gray-600">{line.formula}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm">
                          <span className={line.amountCents < 0 ? "text-red-600" : "text-gray-900"}>
                            ${(line.amountCents / 100).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td className="px-3 py-3 text-base font-bold text-gray-900" colSpan={2}>
                        {t("admin.priceDetail.ledgerTotal")}
                      </td>
                      <td className="px-3 py-3 text-right text-xl font-bold text-indigo-600">
                        ${((ledger.totalCents || 0) / 100).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-600" colSpan={2}>
                        {t("admin.priceDetail.ledgerUnitPrice")}
                      </td>
                      <td className="px-3 py-2 text-right text-base font-bold text-gray-900">
                        ${((ledger.unitCents || 0) / 100).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Engine version */}
              {ledger.engineVersion && (
                <p className="text-xs text-gray-400">
                  {t("admin.priceDetail.engineVersion")}: {ledger.engineVersion}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBadge({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm">
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-700">{value}</span>
    </span>
  );
}

function SimInput({ label, suffix, ...props }) {
  return (
    <div>
      <label className="block text-base font-medium text-gray-700">{label}</label>
      <div className="relative mt-1">
        <input
          {...props}
          onChange={e => props.onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          style={{ minHeight: 48 }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}
