"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const BASE = "/shop/canvas-prints";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "single",
    title: "Single Panel Canvas",
    subtitle: "Classic one-piece canvas prints in a variety of styles and frames.",
    size: "large",
    items: [
      { key: "canvas-standard", name: "Standard Canvas Print", href: `${BASE}/canvas-standard`, gradient: "from-amber-400 to-orange-400" },
      { key: "canvas-gallery-wrap", name: "Gallery Wrap Canvas", href: `${BASE}/canvas-gallery-wrap`, gradient: "from-violet-400 to-fuchsia-400" },
      { key: "canvas-framed", name: "Framed Canvas Print", href: `${BASE}/canvas-framed`, gradient: "from-slate-400 to-gray-500" },
      { key: "canvas-panoramic", name: "Panoramic Canvas", href: `${BASE}/canvas-panoramic`, gradient: "from-sky-400 to-blue-400" },
    ],
  },
  {
    key: "multi",
    title: "Multi-Panel Canvas Sets",
    subtitle: "Split your image across multiple panels for a dramatic wall display.",
    size: "large",
    items: [
      { key: "canvas-split-2", name: "2-Panel Diptych", href: `${BASE}/canvas-split-2`, gradient: "from-emerald-400 to-teal-400" },
      { key: "canvas-split-3", name: "3-Panel Triptych", href: `${BASE}/canvas-split-3`, gradient: "from-rose-400 to-pink-400" },
      { key: "canvas-split-5", name: "5-Panel Set", href: `${BASE}/canvas-split-5`, gradient: "from-indigo-400 to-blue-400" },
    ],
  },
];

function ProductCard({ item, price }) {
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className={`flex items-center justify-center bg-gradient-to-br ${item.gradient} h-[200px]`}>
        <p className="px-6 text-center text-lg font-bold text-white drop-shadow-md">
          {item.name}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-[var(--color-gray-900)]">
          {item.name}
        </h3>
        <div className="mt-auto pt-3 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-sm font-bold text-[var(--color-gray-900)]">
              From {formatCad(price)}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-gray-400)]">Get a quote</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3.5 py-1.5 text-[10px] font-semibold text-white transition-colors group-hover:bg-[var(--color-brand-dark)]">
            Configure
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CanvasCategoryClient({ canvasPrices = {} }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gradient-to-b from-amber-50 to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: "Canvas Prints" },
          ]}
        />

        {/* Hero */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Canvas Prints
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--color-gray-500)]">
            Museum-quality canvas prints on premium cotton blend. Gallery wrap, framed, panoramic, and multi-panel sets.
          </p>
        </header>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in canvasPrices);
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.key} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">{section.subtitle}</p>
              <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {visibleItems.map((item) => (
                  <ProductCard
                    key={item.key}
                    item={item}
                    price={canvasPrices[item.key] || 0}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Back to shop */}
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

        {/* Value Props */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Premium Cotton Blend
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              350gsm poly-cotton canvas with archival-quality UV inks. Vibrant colour that lasts 75+ years indoors.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Ready to Hang
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Every canvas ships stretched on kiln-dried wood stretcher bars with pre-installed hanging hardware.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Custom Sizes
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Standard sizes from 8×10 to 40×60. Custom sizes available up to 54" wide by any length.
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-brand-dark)]"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
