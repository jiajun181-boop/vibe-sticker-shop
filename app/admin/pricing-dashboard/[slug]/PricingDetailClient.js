"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import QuoteSimulator from "./QuoteSimulator";

/**
 * Client wrapper for pricing detail page.
 * Product data is pre-loaded by the server component — no loading state needed.
 */
export default function PricingDetailClient({ product, pricingTemplate, productMaterials, materialSource }) {
  const { t } = useTranslation();

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

      {/* Product Info Card — rendered instantly from server data */}
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

      {/* Quote Simulator + Ledger */}
      <QuoteSimulator product={product} pricingTemplate={pricingTemplate} productMaterials={productMaterials} materialSource={materialSource} />
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
