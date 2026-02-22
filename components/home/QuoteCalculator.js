"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Hardcoded fallback — only used when server props are empty
const FALLBACK_PRODUCTS = [
  { slug: "retractable-banner-stand-premium", name: "Retractable Banner Stand", category: "banners-displays", basePrice: 14500, pricingUnit: "per_piece" },
  { slug: "vinyl-banners", name: "Vinyl Banners", category: "banners-displays", basePrice: 3500, pricingUnit: "per_sqft" },
  { slug: "business-cards-classic", name: "Business Cards (Classic)", category: "marketing-business-print", basePrice: 1299, pricingUnit: "per_piece" },
  { slug: "die-cut-stickers", name: "Die-Cut Stickers", category: "stickers-labels-decals", basePrice: 5500, pricingUnit: "per_piece" },
  { slug: "flyers", name: "Flyers", category: "marketing-business-print", basePrice: 1609, pricingUnit: "per_piece" },
  { slug: "floor-graphics", name: "Floor Graphics", category: "windows-walls-floors", basePrice: 4000, pricingUnit: "per_sqft" },
  { slug: "coroplast-yard-signs", name: "Yard Signs (Coroplast)", category: "signs-rigid-boards", basePrice: 2900, pricingUnit: "per_piece" },
  { slug: "full-vehicle-wrap-design-print", name: "Vehicle Wrap", category: "vehicle-graphics-fleet", basePrice: 8000, pricingUnit: "per_sqft" },
];

const SIZES_SQFT = [
  { label: '12" x 12"', w: 12, h: 12 },
  { label: '24" x 18"', w: 24, h: 18 },
  { label: '36" x 24"', w: 36, h: 24 },
  { label: '48" x 24"', w: 48, h: 24 },
  { label: '96" x 48"', w: 96, h: 48 },
];

const QTY_PRESETS = [1, 5, 10, 25, 50];

const cad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function getFromPrice(p) {
  return p.displayFromPrice || p.minPrice || p.basePrice || 0;
}

// Derive category slug for the shop link
function shopHref(p) {
  return `/shop/${p.category}/${p.slug}`;
}

export default function QuoteCalculator({ products: serverProducts }) {
  const { t } = useTranslation();

  const items = useMemo(() => {
    const raw = Array.isArray(serverProducts) && serverProducts.length > 0
      ? serverProducts
      : FALLBACK_PRODUCTS;
    return raw
      .filter((p) => p && p.slug && (p.basePrice > 0 || p.minPrice > 0))
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        category: p.category,
        basePrice: getFromPrice(p),
        unit: p.pricingUnit || "per_piece",
        href: shopHref(p),
      }));
  }, [serverProducts]);

  const [selectedSlug, setSelectedSlug] = useState(items[0]?.slug || "");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [rush, setRush] = useState(false);

  const product = items.find((p) => p.slug === selectedSlug) || items[0];
  const size = SIZES_SQFT[Math.min(sizeIdx, SIZES_SQFT.length - 1)];

  const estimate = useMemo(() => {
    if (!product) return 0;
    let base;
    if (product.unit === "per_sqft") {
      const sqft = (size.w * size.h) / 144;
      base = product.basePrice * sqft * qty;
    } else {
      base = product.basePrice * qty;
    }
    return Math.round(rush ? base * 1.3 : base);
  }, [product, size, qty, rush]);

  const handleProductChange = (slug) => {
    setSelectedSlug(slug);
    setSizeIdx(0);
  };

  if (!product) return null;

  return (
    <section id="quote" className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="grid md:grid-cols-2">
        {/* Left — Form */}
        <div className="p-8 md:p-10 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]" />
              <span className="label-xs text-[var(--color-gray-400)]">
                {t("quote.badge")}
              </span>
            </div>
            <h2 className="heading-2">
              {t("quote.title")}
            </h2>
          </div>

          {/* Product type */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-gray-500)] uppercase mb-2">{t("quote.productType")}</label>
            <select
              value={selectedSlug}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full border border-[var(--color-gray-200)] rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] bg-[var(--color-gray-50)] hover:bg-white transition-colors"
            >
              {items.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} — {t("quote.from")} {cad(p.basePrice)}
                </option>
              ))}
            </select>
          </div>

          {/* Size — only for per_sqft */}
          {product.unit === "per_sqft" && (
            <div>
              <label className="block text-xs font-bold text-[var(--color-gray-500)] uppercase mb-2">{t("quote.size")}</label>
              <div className="flex flex-wrap gap-2">
                {SIZES_SQFT.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => setSizeIdx(i)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                      sizeIdx === i
                        ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)]"
                        : "bg-[var(--color-gray-50)] text-[var(--color-gray-600)] border-[var(--color-gray-200)] hover:border-[var(--color-brand)]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-gray-500)] uppercase mb-2">{t("quote.quantity")}</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-lg border border-[var(--color-gray-200)] font-bold text-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border border-[var(--color-gray-200)] rounded-lg py-2.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-lg border border-[var(--color-gray-200)] font-bold text-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center justify-center"
              >
                +
              </button>
              <div className="hidden sm:flex gap-1.5 ml-2">
                {QTY_PRESETS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setQty(n)}
                    className={`px-3 py-1.5 rounded-full label-xs font-bold transition-all ${
                      qty === n ? "bg-[var(--color-brand)] text-white" : "bg-[var(--color-gray-100)] text-[var(--color-gray-500)] hover:bg-[var(--color-gray-200)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rush production */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-6 rounded-full relative transition-colors ${rush ? "bg-[var(--color-brand)]" : "bg-[var(--color-gray-200)]"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${rush ? "left-[18px]" : "left-0.5"}`} />
            </div>
            <div>
              <span className="text-sm font-bold group-hover:text-black transition-colors">{t("quote.rush")}</span>
              <span className="label-xs text-[var(--color-gray-400)] block">{t("quote.rushDesc")}</span>
            </div>
          </label>
        </div>

        {/* Right — Price display */}
        <div className="bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-brand-100)] p-8 md:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[var(--color-brand-100)]">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-[var(--color-gray-400)] uppercase tracking-[0.14em]">{t("quote.estimatedPrice")}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-black tracking-tighter">
                  {cad(estimate)}
                </span>
                <span className="text-[var(--color-gray-400)] text-sm">{t("quote.cad")}</span>
              </div>
              {rush && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-amber-50 text-amber-700 label-xs font-bold px-3 py-1 rounded-full">
                  <span>&#9889;</span> {t("quote.rushIncluded")}
                </div>
              )}
              {qty > 1 && (
                <p className="text-xs text-[var(--color-gray-400)] mt-2 font-mono">
                  {product.unit === "per_sqft"
                    ? cad(Math.round(product.basePrice * (size.w * size.h) / 144))
                    : cad(product.basePrice)}/{t("quote.each")} &times; {qty}
                </p>
              )}
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-white px-3 py-1.5 rounded-full label-xs font-bold text-[var(--color-gray-500)] border border-[var(--color-gray-200)]">
                {product.name}
              </span>
              {product.unit === "per_sqft" && (
                <span className="bg-white px-3 py-1.5 rounded-full label-xs font-bold text-[var(--color-gray-500)] border border-[var(--color-gray-200)]">
                  {size.label}
                </span>
              )}
              <span className="bg-white px-3 py-1.5 rounded-full label-xs font-bold text-[var(--color-gray-500)] border border-[var(--color-gray-200)]">
                {t("quote.qty")}: {qty}
              </span>
              {rush && (
                <span className="bg-amber-50 px-3 py-1.5 rounded-full label-xs font-bold text-amber-700 border border-amber-200">
                  {t("quote.rush24h")}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-[var(--color-gray-400)]">
              <p>{t("quote.hstNote")}</p>
              <p>{t("quote.finalNote")}</p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href={product.href}
              className="btn-primary-pill btn-lg block w-full text-center"
            >
              {t("quote.cta")}
            </Link>
            <p className="text-center label-xs text-[var(--color-gray-400)]">
              {t("quote.noObligation")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
