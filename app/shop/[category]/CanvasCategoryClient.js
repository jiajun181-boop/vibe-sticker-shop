"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import { isSvgImage } from "@/lib/product-image";

const BASE = "/shop/canvas-prints";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const SECTIONS = [
  {
    key: "classic-framed",
    title: "Classic & Framed Canvas",
    subtitle:
      "Timeless wall art formats for portraits, family photos, and interior decor projects.",
    layout: "elegant-grid",
    items: [
      {
        key: "canvas-standard",
        name: "Standard Canvas Prints",
        href: `${BASE}/canvas-standard`,
        gradient: "from-stone-300 via-zinc-200 to-neutral-100",
        accent: "Classic",
      },
      {
        key: "canvas-gallery-wrap",
        name: "Gallery Wrap Canvas",
        href: `${BASE}/canvas-gallery-wrap`,
        gradient: "from-amber-200 via-orange-100 to-stone-50",
        accent: "Best Seller",
      },
      {
        key: "canvas-framed",
        name: "Framed Canvas Prints (Floating Frame)",
        href: `${BASE}/canvas-framed`,
        gradient: "from-slate-300 via-zinc-200 to-stone-100",
        accent: "Premium Frame",
      },
    ],
  },
  {
    key: "multi-panel",
    title: "Multi-Panel Splits (Statement Pieces)",
    subtitle:
      "Create a dramatic focal point with split-panel sets for living rooms, offices, and hospitality spaces.",
    layout: "statement-grid",
    items: [
      {
        key: "canvas-split-2",
        name: "2-Panel Canvas Set (Diptych)",
        href: `${BASE}/canvas-split-2`,
        gradient: "from-emerald-200 via-teal-100 to-cyan-50",
        accent: "Diptych",
      },
      {
        key: "canvas-split-3",
        name: "3-Panel Canvas Set (Triptych)",
        href: `${BASE}/canvas-split-3`,
        gradient: "from-violet-200 via-fuchsia-100 to-rose-50",
        accent: "Triptych",
      },
      {
        key: "canvas-split-5",
        name: "5-Panel Canvas Set",
        href: `${BASE}/canvas-split-5`,
        gradient: "from-sky-200 via-indigo-100 to-blue-50",
        accent: "Large Statement",
      },
    ],
  },
  {
    key: "panoramic-oversize",
    title: "Panoramic & Large Format",
    subtitle:
      "Wide-format art for feature walls, commercial interiors, and oversized custom dimensions.",
    layout: "wide-grid",
    items: [
      {
        key: "canvas-panoramic",
        name: "Panoramic Canvas Prints",
        href: `${BASE}/canvas-panoramic`,
        gradient: "from-blue-200 via-cyan-100 to-sky-50",
        accent: "Wide Format",
      },
      {
        key: "canvas-custom-oversize",
        name: "Oversize / Custom Dimensions",
        href: "/quote",
        gradient: "from-zinc-300 via-stone-200 to-neutral-100",
        accent: "Quote Required",
        quoteOnly: true,
        priceKeys: [],
      },
    ],
  },
];

function getPrice(canvasPrices, item) {
  const keys = Array.isArray(item.priceKeys) ? item.priceKeys : [item.key];
  const values = keys.map((k) => canvasPrices[k]).filter((v) => Number(v) > 0);
  return values.length ? Math.min(...values) : 0;
}

function shouldShow(canvasPrices, item) {
  if (item.quoteOnly) return true;
  const keys = Array.isArray(item.priceKeys) ? item.priceKeys : [item.key];
  return keys.some((k) => k in canvasPrices);
}

function PriceTag({ price, quoteOnly = false }) {
  if (quoteOnly) {
    return <span className="text-xs font-semibold text-[var(--color-gray-600)]">Custom quote</span>;
  }
  if (price > 0) {
    return <span className="text-sm font-semibold text-[var(--color-gray-900)]">From {formatCad(price)}</span>;
  }
  return <span className="text-xs text-[var(--color-gray-400)]">Get a quote</span>;
}

function CanvasCard({ item, price, variant = "standard", imageUrl }) {
  const isLarge = variant === "large";
  const isWide = variant === "wide";
  const isSvg = imageUrl && isSvgImage(imageUrl);

  return (
    <Link
      href={item.href}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        isWide ? "sm:col-span-2" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${imageUrl ? "bg-[var(--color-gray-100)]" : `bg-gradient-to-br ${item.gradient}`} ${isLarge ? "h-52" : isWide ? "h-40 sm:h-44" : "h-40"}`}>
        {imageUrl ? (
          <>
            {isSvg ? (
              <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <Image src={imageUrl} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
            )}
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="rounded-full border border-gray-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-700)]">
                {item.accent}
              </span>
              {item.quoteOnly && (
                <span className="rounded-full border border-gray-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-700)]">
                  Quote-Only
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_55%)]" />
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:14px_14px]" />
            <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-white/70 bg-white/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-700)]">
                  {item.accent}
                </span>
                {item.quoteOnly && (
                  <span className="rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-700)]">
                    Quote-Only
                  </span>
                )}
              </div>
              <div className="mx-auto flex w-full max-w-[240px] items-center justify-center">
                <div className="rounded-lg border border-white/70 bg-white/80 p-2 shadow-sm">
                  <div
                    className={`bg-white shadow-inner ${
                      item.key.includes("split-5")
                        ? "grid grid-cols-5 gap-1 p-1"
                        : item.key.includes("split-3")
                          ? "grid grid-cols-3 gap-1 p-1"
                          : item.key.includes("split-2")
                            ? "grid grid-cols-2 gap-1 p-1"
                            : item.key.includes("panoramic")
                              ? "h-16 w-32"
                              : "h-20 w-24"
                    }`}
                  >
                    {item.key.includes("split-") ? (
                      Array.from({ length: item.key.includes("split-5") ? 5 : item.key.includes("split-3") ? 3 : 2 }).map((_, i) => (
                        <div key={i} className="h-14 rounded-sm bg-gradient-to-b from-white to-zinc-100 border border-zinc-100" />
                      ))
                    ) : (
                      <div className="h-full w-full rounded-sm border border-zinc-100 bg-gradient-to-b from-white to-zinc-100" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-[var(--color-gray-900)] sm:text-base">{item.name}</h3>
          <div className="mt-1">
            <PriceTag price={price} quoteOnly={item.quoteOnly} />
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-gray-200)] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-700)] transition-colors group-hover:border-[var(--color-brand)] group-hover:text-[var(--color-gray-900)]">
          {item.quoteOnly ? "Quote" : "Configure"}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function SectionGrid({ section, canvasPrices, canvasImages = {} }) {
  const visibleItems = section.items.filter((item) => shouldShow(canvasPrices, item));
  if (!visibleItems.length) return null;

  if (section.layout === "elegant-grid") {
    return (
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {visibleItems.map((item, idx) => (
          <CanvasCard
            key={item.key}
            item={item}
            price={getPrice(canvasPrices, item)}
            variant={idx === 1 ? "large" : "standard"}
            imageUrl={canvasImages[item.key]}
          />
        ))}
      </div>
    );
  }

  if (section.layout === "statement-grid") {
    return (
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {visibleItems.map((item) => (
          <CanvasCard key={item.key} item={item} price={getPrice(canvasPrices, item)} variant="large" imageUrl={canvasImages[item.key]} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-3">
      {visibleItems.map((item, idx) => (
        <CanvasCard
          key={item.key}
          item={item}
          price={getPrice(canvasPrices, item)}
          variant={idx === 0 ? "wide" : "standard"}
          imageUrl={canvasImages[item.key]}
        />
      ))}
    </div>
  );
}

export default function CanvasCategoryClient({ canvasPrices = {}, canvasImages = {} }) {
  const { t } = useTranslation();

  return (
    <main className="bg-[linear-gradient(180deg,#f7f2eb_0%,#fbfaf7_35%,#ffffff_100%)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: "Canvas Prints" },
          ]}
        />

        <div className="mt-6">
          <CategoryHero category="canvas-prints" title="Museum-Quality Canvas Prints" icon="🖼️" />
        </div>

        {SECTIONS.map((section, index) => (
          <section key={section.key} className={index === 0 ? "mt-10" : "mt-12"}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>
                <p className="mt-1 text-sm text-[var(--color-gray-500)]">{section.subtitle}</p>
              </div>
            </div>
            <SectionGrid section={section} canvasPrices={canvasPrices} canvasImages={canvasImages} />
          </section>
        ))}

        <CategoryFaq category="canvas-prints" />

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-[var(--color-gray-700)]">Print on Demand Fulfillment</h3>
            <p className="mt-2 text-sm text-[var(--color-gray-600)]">
              We help online sellers with drop-ship fulfillment — print, stretch, pack, and ship direct to your customers under your brand.
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-[var(--color-gray-700)]">Premium Quality, Every Piece</h3>
            <p className="mt-2 text-sm text-[var(--color-gray-600)]">
              Epson professional printer with original ink and custom ICC profiles. Acid-free cotton canvas on kiln-dried pine stretcher bars.
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-[var(--color-gray-700)]">Custom Sizes Available</h3>
            <p className="mt-2 text-sm text-[var(--color-gray-600)]">
              Need a panoramic or non-standard size? Enter any dimension in the configurator or contact us for oversize projects.
            </p>
            <Link
              href="/order/canvas-prints"
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[var(--color-brand-dark)]"
            >
              Configure &amp; Quote
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Categories
          </Link>
        </div>
      </div>
    </main>
  );
}
