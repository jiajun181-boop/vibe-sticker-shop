"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuickAddButton from "@/components/product/QuickAddButton";
import { useSearchParams } from "next/navigation";
import { getProductImage, isSvgImage } from "@/lib/product-image";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );
const safeText = (value, fallback) =>
  typeof value === "string" && value.trim() ? value : fallback;

// Cross-sell recommendations: if viewing sub-group X, suggest Y
const CROSS_SELL_MAP = {
  "retractable-stands": ["tabletop-displays", "backdrops-popups"],
  "x-banner-stands": ["retractable-stands", "tabletop-displays"],
  "tabletop-displays": ["retractable-stands", "backdrops-popups"],
  "backdrops-popups": ["retractable-stands", "flags-hardware"],
  "vinyl-banners": ["mesh-banners", "retractable-stands"],
  "mesh-banners": ["vinyl-banners", "flags-hardware"],
  "pole-banners": ["flags-hardware", "vinyl-banners"],
  "flags-hardware": ["pole-banners", "tents-outdoor"],
  "a-frames-signs": ["lawn-yard-signs", "vinyl-banners"],
  "lawn-yard-signs": ["a-frames-signs", "flags-hardware"],
  "tents-outdoor": ["flags-hardware", "vinyl-banners"],
  "fabric-banners": ["retractable-stands", "backdrops-popups"],
  "canvas-prints": ["fabric-banners", "backdrops-popups"],
  "business-cards": ["letterhead", "envelopes"],
  "flyers": ["postcards", "rack-cards"],
  "postcards": ["flyers", "door-hangers"],
  "brochures": ["booklets", "presentation-folders"],
  "booklets": ["brochures", "posters"],
  "die-cut-stickers": ["sticker-pages", "sticker-rolls"],
  "sticker-pages": ["die-cut-stickers", "sticker-rolls"],
  "sticker-rolls": ["die-cut-stickers", "vinyl-lettering"],
  "vehicle-wraps": ["door-panel-graphics", "vehicle-decals"],
  "door-panel-graphics": ["vehicle-wraps", "magnetic-signs"],
  "vehicle-decals": ["vehicle-wraps", "magnetic-signs"],
};

function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ListIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function ProductCardGrid({ product, href, selectedSpec, t, viewOrderLabel }) {
  const image = product.images?.[0];
  const imageSrc = getProductImage(product, product.category);
  const sizeCount = product.optionsConfig?.sizes?.length || 0;
  const tk = getTurnaround(product);
  const price = product.fromPrice || product.basePrice;

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        selectedSpec === product.slug ? "border-[var(--color-gray-900)] ring-1 ring-[var(--color-gray-900)]" : "border-[var(--color-gray-200)]"
      }`}
    >
      <Link href={href} className="block">
      <div className="relative aspect-[4/3] bg-[var(--color-gray-100)]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={image?.alt || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            unoptimized={isSvgImage(imageSrc)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-gray-100)] to-[var(--color-gray-200)]">
            <div className="text-center px-3">
              <svg className="mx-auto h-8 w-8 text-[var(--color-gray-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="mt-1 text-xs font-medium text-[var(--color-gray-400)]">{product.name}</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1 ${turnaroundColor(tk)}`}>
          {t(turnaroundI18nKey(tk))}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-snug">{product.name}</h3>
        {selectedSpec === product.slug && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)]">Selected spec</p>
        )}
        {product.description && (
          <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2">{product.description}</p>
        )}
        {sizeCount > 0 && (
          <p className="mt-1.5 text-[11px] text-[var(--color-gray-400)]">{sizeCount} {t("mp.landing.options")}</p>
        )}
        {price > 0 && (
          <p className="mt-2 text-sm font-bold text-[var(--color-gray-900)]">{t("product.from", { price: formatCad(price) })}</p>
        )}
      </div>
      </Link>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="mt-1 flex items-center gap-2">
          <QuickAddButton product={product} />
          <Link
            href={href}
            className="inline-block rounded-xl bg-[var(--color-gray-900)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-black"
          >
            {viewOrderLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

function ProductCardList({ product, href, selectedSpec, t, viewOrderLabel }) {
  const image = product.images?.[0];
  const imageSrc = getProductImage(product, product.category);
  const sizeCount = product.optionsConfig?.sizes?.length || 0;
  const tk = getTurnaround(product);
  const price = product.fromPrice || product.basePrice;

  return (
    <article
      className={`group flex overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:shadow-lg ${
        selectedSpec === product.slug ? "border-[var(--color-gray-900)] ring-1 ring-[var(--color-gray-900)]" : "border-[var(--color-gray-200)]"
      }`}
    >
      <Link href={href} className="flex min-w-0 flex-1 overflow-hidden">
      <div className="relative w-32 sm:w-40 shrink-0 bg-[var(--color-gray-100)]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={image?.alt || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="160px"
            unoptimized={isSvgImage(imageSrc)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-gray-100)] to-[var(--color-gray-200)]">
            <svg className="h-8 w-8 text-[var(--color-gray-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${turnaroundColor(tk)}`}>
            {t(turnaroundI18nKey(tk))}
          </span>
          {selectedSpec === product.slug && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)]">Selected</span>
          )}
        </div>
        <h3 className="mt-1 text-sm font-semibold text-[var(--color-gray-900)] leading-snug">{product.name}</h3>
        {product.description && (
          <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2 sm:line-clamp-3">{product.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-3 flex-wrap">
          {sizeCount > 0 && (
            <span className="text-[11px] text-[var(--color-gray-400)]">{sizeCount} {t("mp.landing.options")}</span>
          )}
          {price > 0 && (
            <span className="text-sm font-bold text-[var(--color-gray-900)]">{t("product.from", { price: formatCad(price) })}</span>
          )}
          <span className="ml-auto rounded-xl bg-[var(--color-gray-900)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-black">
            {viewOrderLabel}
          </span>
        </div>
      </div>
      </Link>
      <div className="flex items-end p-3 sm:p-4">
        <QuickAddButton product={product} />
      </div>
    </article>
  );
}

function QuickQuoteFAB({ t }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/quote"
      className="fixed right-4 z-50 flex items-center gap-2 rounded-xl bg-[var(--color-gray-900)] px-4 py-2.5 text-white shadow-lg transition-all hover:bg-black animate-in fade-in-0 slide-in-from-bottom-4 duration-300 md:hidden"
      style={{ bottom: "calc(var(--mobile-nav-offset, 72px) + env(safe-area-inset-bottom) + 8px)" }}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-[0.12em]">
        {t("shop.quickQuote")}
      </span>
    </Link>
  );
}

export default function SubProductLandingClient({
  parentSlug,
  category,
  categoryTitle,
  products,
  siblingSubGroups = [],
}) {
  const { t } = useTranslation();
  const viewOrderLabel = safeText(t("mp.landing.viewOrder"), "View & Order");
  const browseLabel = safeText(t("mp.landing.browse"), "Browse");
  const i18nBase = `sp.${parentSlug}`;
  const searchParams = useSearchParams();
  const selectedSpec = searchParams?.get("spec") || "";
  const [viewMode, setViewMode] = useState("grid");

  // Compute cross-sell suggestions from sibling data
  const crossSellSlugs = CROSS_SELL_MAP[parentSlug] || [];
  const crossSellGroups = siblingSubGroups.filter((sg) => crossSellSlugs.includes(sg.slug));

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: categoryTitle, href: `/shop/${category}` },
            { label: t(`${i18nBase}.title`) },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t(`${i18nBase}.title`)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--color-gray-600)]">
            {t(`${i18nBase}.subtitle`)}
          </p>

          {/* Product count + View toggle */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[var(--color-gray-400)]">
              {products.length} {t("mp.landing.products")}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-[var(--color-gray-200)] bg-white p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "grid" ? "bg-[var(--color-gray-900)] text-white" : "text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)]"
                }`}
                title={t("shop.viewGrid")}
              >
                <GridIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list" ? "bg-[var(--color-gray-900)] text-white" : "text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)]"
                }`}
                title={t("shop.viewList")}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Product Cards */}
        {viewMode === "grid" ? (
          <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCardGrid
                key={product.id}
                product={product}
                href={`/shop/${product.category}/${product.slug}`}
                selectedSpec={selectedSpec}
                t={t}
                viewOrderLabel={viewOrderLabel}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {products.map((product) => (
              <ProductCardList
                key={product.id}
                product={product}
                href={`/shop/${product.category}/${product.slug}`}
                selectedSpec={selectedSpec}
                t={t}
                viewOrderLabel={viewOrderLabel}
              />
            ))}
          </div>
        )}

        {products.length === 0 && (
          <p className="mt-8 text-center text-sm text-[var(--color-gray-500)]">
            No products available yet.
          </p>
        )}

        {/* Complete Your Setup — cross-sell */}
        {crossSellGroups.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--color-gray-900)]">
              {t("shop.completeSetup")}
            </h2>
            <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
              {crossSellGroups.map((sg) => (
                <Link
                  key={sg.slug}
                  href={sg.href}
                  className="group flex items-center gap-4 rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-gray-400)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-gray-100)] text-[var(--color-gray-400)] group-hover:bg-[var(--color-gray-200)] transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-moon-gold)] transition-colors">
                      {sg.title}
                    </h3>
                    <p className="text-[11px] text-[var(--color-gray-400)]">
                      {browseLabel}
                    </p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-gray-600)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sibling sub-groups — Also browse */}
        {siblingSubGroups.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
              {t("shop.alsoBrowse") || "Also Browse"}
            </h2>
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide scroll-fade pb-2">
              {siblingSubGroups.map((sg) => (
                <Link
                  key={sg.slug}
                  href={sg.href}
                  className="group shrink-0 flex items-center gap-2 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-gray-400)]"
                >
                  <span className="text-sm font-medium text-[var(--color-gray-700)] group-hover:text-[var(--color-gray-900)] whitespace-nowrap">
                    {sg.title}
                  </span>
                  <svg className="h-3 w-3 text-[var(--color-gray-400)] group-hover:text-[var(--color-gray-600)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to category */}
        <div className="mt-10 text-center">
          <Link
            href={`/shop/${category}`}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {categoryTitle}
          </Link>
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.qualityTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-gray-700)]">
              {["quality1", "quality2", "quality3", "quality4"].map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t(`mp.landing.${k}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.turnaroundTitle")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mp.landing.turnaroundText")}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mp.landing.customText")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-xl bg-[var(--color-gray-900)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-black"
            >
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Quote FAB */}
      <QuickQuoteFAB t={t} />
    </main>
  );
}
