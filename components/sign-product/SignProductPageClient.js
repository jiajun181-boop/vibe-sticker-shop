"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import FamilyContextStrip from "@/components/storefront/FamilyContextStrip";
import ImageGallery from "@/components/product/ImageGallery";
import RelatedProducts from "@/components/product/RelatedProducts";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { SIGN_COMPARISON_TABLE } from "@/lib/sign-page-content";
import { isOversizedProduct } from "@/lib/pickup-hints";
import SignInlineConfigurator from "./SignInlineConfigurator";
import ProductDetailsTabs from "@/components/sticker-product/ProductDetailsTabs";
import UseCaseGallery from "@/components/sticker-product/UseCaseGallery";
import ComparisonTable from "@/components/sticker-product/ComparisonTable";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import GuaranteeInfo from "@/components/product/GuaranteeInfo";

const SIGN_CATEGORY = "signs-rigid-boards";

/**
 * Rich sign product page — two-column layout with gallery + inline configurator,
 * plus below-the-fold content sections.
 *
 * Props:
 *  - content: the content entry from SIGN_PAGE_CONTENT
 *  - signTypeId: e.g. "real-estate-signs"
 *  - product: DB product record (serialized)
 *  - images: product images array
 *  - relatedProducts: related products for bottom section
 */
export default function SignProductPageClient({
  content,
  signTypeId,
  product,
  images,
  relatedProducts,
}) {
  const { t, locale } = useTranslation();
  const { intro, highlights, tabs, useCases, faq } = content;

  // Map signTypeId to the configurator sign type id (sign-order-config SIGN_TYPES.id)
  const SIGN_TYPE_MAP = {
    "real-estate-signs": "real-estate",
    "yard-sign": "yard-sign",
    "yard-signs": "yard-sign",
    "election-signs": "yard-sign",
    "open-house-signs": "real-estate",
    "directional-signs": "aluminum-sign",
    "aluminum-signs": "aluminum-sign",
    "pvc-board-signs": "pvc-sign",
    "pvc-signs": "pvc-sign",
    "foam-board-signs": "foam-board",
    "foam-board-prints": "foam-board",
    "a-frame-signs": "a-frame",
    "magnetic-signs": "yard-sign",
    "event-boards": "event-board",
  };
  const configuratorTypeId = SIGN_TYPE_MAP[signTypeId] || signTypeId;

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: t("nav.shop"), href: "/shop" },
            { label: t("productPage.cat.signsDisplayBoards"), href: `/shop/${SIGN_CATEGORY}` },
            { label: intro.headline },
          ]}
        />
        <div className="mt-3"><FamilyContextStrip /></div>
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
              <div id="configurator">
                <SignInlineConfigurator signTypeId={configuratorTypeId} />
              </div>

              {/* Pickup hint for oversized products */}
              {product?.slug && isOversizedProduct(product.slug) && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="text-xs text-amber-800">{t("pickup.recommendedOversized")}</span>
                </div>
              )}
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
          tableData={SIGN_COMPARISON_TABLE}
          currentTypeId={configuratorTypeId}
          category={SIGN_CATEGORY}
          title={t("productPage.compareSignTypes")}
        />

        {/* Quality Guarantee */}
        <GuaranteeInfo />

        {/* FAQ */}
        {faq && <FaqAccordion items={faq} />}

        {/* Related Products */}
        <RelatedProducts
          product={product}
          relatedProducts={relatedProducts}
          t={t}
        />
      </div>

      {/* Mobile bottom bar */}
      <MobileBottomBarBridge />
    </main>
  );
}

/**
 * Mobile sticky CTA bar — scrolls to the configurator section with strong CTA.
 */
function MobileBottomBarBridge() {
  const { t } = useTranslation();
  const scrollToConfigurator = () => {
    const el = document.getElementById("configurator");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <>
      <div
        className="fixed inset-x-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden"
        style={{ bottom: "calc(var(--mobile-nav-h, 0px) + var(--safe-bottom, 0px))" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">{t("productPage.readyToOrder")}</p>
            <p className="text-[11px] text-gray-500">{t("productPage.customizeAndOrder")}</p>
          </div>
          <button
            type="button"
            onClick={scrollToConfigurator}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#fff] shadow-lg hover:bg-[var(--color-brand-dark)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l2.828 2.818L15 13.182" />
            </svg>
            {t("productPage.getYourPrice")}
          </button>
        </div>
      </div>
      {/* Spacer removed — #main-content uses padding-bottom: var(--bottom-chrome) */}
    </>
  );
}

function HighlightIcon({ type }) {
  const iconClass = "h-5 w-5 text-gray-900";
  switch (type) {
    case "sign":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      );
    case "shield":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case "clock":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "check":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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
