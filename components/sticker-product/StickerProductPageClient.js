"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import ImageGallery from "@/components/product/ImageGallery";
import RelatedProducts from "@/components/product/RelatedProducts";
import { MobileBottomBar, useConfiguratorQuote, useConfiguratorCart } from "@/components/configurator";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { STICKER_COMPARISON_TABLE } from "@/lib/sticker-page-content";
import InlineConfigurator from "./InlineConfigurator";
import ProductDetailsTabs from "./ProductDetailsTabs";
import UseCaseGallery from "./UseCaseGallery";
import ComparisonTable from "./ComparisonTable";
import FaqAccordion from "./FaqAccordion";

const STICKER_CATEGORY = "stickers-labels-decals";

/**
 * Rich sticker product page — two-column layout with gallery + inline configurator,
 * plus below-the-fold content sections.
 *
 * Props:
 *  - content: the content entry from STICKER_PAGE_CONTENT
 *  - cuttingTypeId: e.g. "die-cut"
 *  - product: DB product record (serialized)
 *  - images: product images array
 *  - relatedProducts: related products for bottom section
 */
export default function StickerProductPageClient({
  content,
  cuttingTypeId,
  product,
  images,
  relatedProducts,
}) {
  const { t } = useTranslation();
  const { intro, highlights, tabs, useCases, faq } = content;

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: t("nav.shop"), href: "/shop" },
            { label: "Stickers & Labels", href: `/shop/${STICKER_CATEGORY}` },
            { label: intro.headline },
          ]}
        />
      </div>

      {/* Two-column hero: Gallery (60%) + Configurator (40%) */}
      <div className="mx-auto max-w-[1600px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-5 lg:gap-10">
          {/* LEFT: Gallery + intro */}
          <div className="lg:col-span-3">
            <ImageGallery images={images} productName={intro.headline} />

            {/* Highlights row */}
            {highlights && highlights.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm"
                  >
                    <HighlightIcon type={h.icon} />
                    <span className="text-xs font-semibold text-gray-700">{h.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Title + Configurator */}
          <div className="mt-6 lg:col-span-2 lg:mt-0">
            <div className="sticky top-20 space-y-5">
              {/* Product title */}
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                  {intro.headline}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {intro.subtitle}
                </p>
              </div>

              {/* Inline configurator */}
              <InlineConfigurator cuttingTypeId={cuttingTypeId} />
            </div>
          </div>
        </div>
      </div>

      {/* Below-the-fold content */}
      <div className="mx-auto max-w-[1600px] space-y-12 px-4 pb-16 sm:px-6 lg:px-8">
        {/* Product Detail Tabs */}
        {tabs && <ProductDetailsTabs tabs={tabs} />}

        {/* Use Cases */}
        {useCases && <UseCaseGallery items={useCases} />}

        {/* Comparison Table */}
        <ComparisonTable
          tableData={STICKER_COMPARISON_TABLE}
          currentTypeId={cuttingTypeId}
          category={STICKER_CATEGORY}
        />

        {/* FAQ */}
        {faq && <FaqAccordion items={faq} />}

        {/* Related Products */}
        <RelatedProducts
          product={product}
          relatedProducts={relatedProducts}
          t={t}
        />
      </div>

      {/* Mobile bottom bar — uses a simplified version since InlineConfigurator handles its own state */}
      <MobileBottomBarBridge cuttingTypeId={cuttingTypeId} />
    </main>
  );
}

/**
 * Bridge component that provides a mobile bottom bar by observing
 * the inline configurator's price display. Since the InlineConfigurator
 * manages its own quote state internally, we render a simple scroll-to-top
 * CTA bar on mobile that anchors users back to the configurator.
 */
function MobileBottomBarBridge() {
  return (
    <>
      <div
        className="fixed inset-x-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden"
        style={{ bottom: "calc(var(--mobile-nav-offset, 72px) + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">Ready to order?</p>
            <p className="text-[11px] text-gray-500">Configure above & add to cart</p>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="shrink-0 rounded-lg bg-gray-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-gray-800"
          >
            Configure
          </button>
        </div>
      </div>
      <div className="lg:hidden" style={{ height: "calc(var(--mobile-nav-offset, 72px) + 80px)" }} />
    </>
  );
}

function HighlightIcon({ type }) {
  const iconClass = "h-5 w-5 text-gray-900";
  switch (type) {
    case "scissors":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm9.304 0l-1.536.887M17.152 8.25a3 3 0 105.196-3 3 3 0 00-5.196 3zM12 18.75l-2.616-7.125M12 18.75l2.616-7.125M12 18.75l.072-.195" />
        </svg>
      );
    case "droplets":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
        </svg>
      );
    case "clock":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "shield":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      );
  }
}
