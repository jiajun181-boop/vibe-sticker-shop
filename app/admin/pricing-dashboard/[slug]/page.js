"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Admin Product Pricing Detail page.
 *
 * Data flow:
 *   1. Fetch product via /api/admin/products/by-slug/[slug] (dedicated endpoint)
 *   2. Quote simulator calls /api/admin/pricing-debug independently
 *   3. Quote failure is LOCAL — product info card stays visible
 *
 * States:
 *   - loading: fetching product
 *   - not-found: slug doesn't match any product
 *   - loaded: product info visible, quote may or may not be ready
 *   - unauthorized: 401 → redirect to login
 */
export default function ProductPricingDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();

  // Product data — loaded once from dedicated API
  const [product, setProduct] = useState(null);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodError, setProdError] = useState(null);

  // Simulator inputs
  const [quantity, setQuantity] = useState(100);
  const [widthIn, setWidthIn] = useState(3);
  const [heightIn, setHeightIn] = useState(3);
  const [material, setMaterial] = useState("");

  // Quote result — independent from product loading
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  // ── Load product from dedicated endpoint ──
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    setProdLoading(true);
    setProdError(null);
    fetch(`/api/admin/products/by-slug/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = "/admin/login";
          return null;
        }
        if (r.status === 404) throw new Error("not-found");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const p = data.product;
        setProduct(p);
        // Set sensible size defaults based on category
        if (p.pricingUnit === "per_sqft" || p.category === "banners-displays") {
          setWidthIn(24);
          setHeightIn(36);
        } else if (p.category === "signs-rigid-boards") {
          setWidthIn(18);
          setHeightIn(24);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          setProdError("timeout");
        } else {
          setProdError(err.message || "unknown");
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setProdLoading(false);
      });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [slug]);

  // ── Fetch quote (independent, can fail without affecting product display) ──
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
    if (!product) return; // wait until product loads
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote, product]);

  // ── Loading state ──
  if (prodLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="flex items-center gap-2 text-sm text-[#999]">
          <Link href="/admin/pricing-dashboard" className="text-[#4f46e5] hover:underline">{t("admin.priceDash.title")}</Link>
          <span>/</span>
          <span className="text-[#666]">{slug}</span>
        </nav>
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
            <div className="h-80 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not found state ──
  if (prodError === "not-found") {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8">
          <p className="text-lg font-bold text-[#111]">{t("admin.priceDetail.notFound")}</p>
          <p className="mt-2 text-sm text-[#999]">{t("admin.priceDetail.notFoundDesc").replace("{slug}", slug)}</p>
          <Link href="/admin/pricing-dashboard" className="mt-4 inline-block rounded-[3px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#222]">
            {t("admin.priceDetail.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  // ── Timeout error state ──
  if (prodError === "timeout") {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="rounded-[3px] border border-amber-200 bg-amber-50 p-8">
          <p className="text-lg font-bold text-amber-700">{t("admin.priceDetail.timeoutError")}</p>
          <p className="mt-2 text-sm text-amber-600">{t("admin.priceDetail.timeoutDesc")}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button onClick={() => window.location.reload()} className="rounded-[3px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#222]">
              {t("admin.priceDetail.retryLoad")}
            </button>
            <Link href="/admin/pricing-dashboard" className="rounded-[3px] border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">
              {t("admin.priceDetail.backToList")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Generic error state ──
  if (prodError) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="rounded-[3px] border border-red-200 bg-red-50 p-8">
          <p className="text-lg font-bold text-red-700">{t("admin.priceDetail.loadError")}</p>
          <p className="mt-2 text-sm text-red-600">{prodError}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button onClick={() => window.location.reload()} className="rounded-[3px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#222]">
              {t("admin.priceDetail.retryLoad")}
            </button>
            <Link href="/admin/pricing-dashboard" className="rounded-[3px] border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
              {t("admin.priceDetail.backToList")}
            </Link>
          </div>
        </div>
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
      <nav className="flex items-center gap-2 text-sm text-[#999]">
        <Link href="/admin/pricing-dashboard" className="text-[#4f46e5] hover:underline">
          {t("admin.priceDash.title")}
        </Link>
        <span>/</span>
        <span className="text-[#666]">{product?.name}</span>
      </nav>

      {/* Product Info Card — always visible once loaded */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#111]">{product?.name}</h1>
            <p className="mt-1 text-sm text-[#999]">{product?.slug}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <InfoBadge label={t("admin.priceDetail.category")} value={product?.category} />
              <InfoBadge label={t("admin.priceDetail.pricingUnit")} value={product?.pricingUnit || "per_item"} />
              {product?.pricingPresetId && (
                <InfoBadge label={t("admin.priceDetail.presetId")} value={product.pricingPresetId} />
              )}
              {product?.minPrice > 0 && (
                <InfoBadge label={t("admin.priceDetail.fromPrice")} value={`$${(product.minPrice / 100).toFixed(2)}`} />
              )}
              <InfoBadge label={t("admin.priceDetail.status")} value={product?.isActive ? t("admin.priceDetail.active") : t("admin.priceDetail.inactive")} />
            </div>
          </div>
          <Link
            href={`/shop/${product?.category}/${product?.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#e0e0e0] px-4 py-2.5 text-sm font-medium text-[#666] transition-colors hover:border-black hover:text-black"
          >
            {t("admin.priceDetail.viewStorefront")}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        </div>

        {/* Pricing config summary */}
        {pricingConfig.fixedPrices && Object.keys(pricingConfig.fixedPrices).length > 0 && (
          <div className="mt-4 rounded-[3px] border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">{t("admin.priceDetail.fixedPriceMode")}</p>
            <p className="mt-1 text-xs text-green-700">{t("admin.priceDetail.fixedPriceDesc")}</p>
          </div>
        )}
      </div>

      {/* Two-column: Simulator + Ledger */}
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

          {/* Quote Error — local to this section, doesn't kill the page */}
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

        {/* Right: Quote Ledger (formula breakdown) */}
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
    </div>
  );
}

function InfoBadge({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] px-2.5 py-1 text-xs">
      <span className="text-[#999]">{label}:</span>
      <span className="font-medium text-[#666]">{value}</span>
    </span>
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
