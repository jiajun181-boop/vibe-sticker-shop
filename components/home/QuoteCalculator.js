"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const PRODUCT_TYPES = [
  { id: "retractable-stand", label: "Retractable Banner Stand", slug: "retractable-banner-stand-premium", category: "display-stands", basePrice: 14500, unit: "per_piece" },
  { id: "x-banner-sm", label: "X-Banner Stand (24x63)", slug: "x-banner-stand-standard", category: "display-stands", basePrice: 4500, unit: "per_piece" },
  { id: "x-banner-lg", label: "X-Banner Stand (31x71)", slug: "x-banner-stand-large", category: "display-stands", basePrice: 6500, unit: "per_piece" },
  { id: "tabletop-a4", label: "Tabletop Banner A4", slug: "tabletop-banner-a4", category: "display-stands", basePrice: 3500, unit: "per_piece" },
  { id: "tabletop-a3", label: "Tabletop Banner A3", slug: "tabletop-banner-a3", category: "display-stands", basePrice: 5500, unit: "per_piece" },
  { id: "vehicle-decals", label: "Vehicle Decals", slug: "custom-printed-vehicle-logo-decals", category: "vehicle-branding-advertising", basePrice: 1800, unit: "per_sqft" },
  { id: "vehicle-wrap", label: "Vehicle Wrap (Print)", slug: "vehicle-wrap-print-only-quote", category: "vehicle-branding-advertising", basePrice: 2200, unit: "per_sqft" },
  { id: "custom-stickers", label: "Custom Stickers", slug: "custom-cut-vinyl-lettering-any-text", category: "vehicle-branding-advertising", basePrice: 2000, unit: "per_piece" },
  { id: "backdrop", label: "Backdrop Banner", slug: "trailer-box-truck-large-graphics", category: "vehicle-branding-advertising", basePrice: 1200, unit: "per_sqft" },
  { id: "floor-graphics", label: "Floor Graphics", slug: "warehouse-floor-safety-graphics", category: "facility-asset-labels", basePrice: 1800, unit: "per_sqft" },
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

export default function QuoteCalculator() {
  const { t } = useTranslation();
  const [productId, setProductId] = useState(PRODUCT_TYPES[0].id);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [rush, setRush] = useState(false);

  const product = PRODUCT_TYPES.find((p) => p.id === productId);
  const size = SIZES_SQFT[Math.min(sizeIdx, SIZES_SQFT.length - 1)];

  const estimate = useMemo(() => {
    let base;
    if (product.unit === "per_sqft") {
      const sqft = (size.w * size.h) / 144;
      base = product.basePrice * sqft * qty;
    } else {
      base = product.basePrice * qty;
    }
    return Math.round(rush ? base * 1.3 : base);
  }, [product, size, qty, rush]);

  const handleProductChange = (id) => {
    setProductId(id);
    setSizeIdx(0);
  };

  return (
    <section id="quote" className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
      <div className="grid md:grid-cols-2">
        {/* Left — Form */}
        <div className="p-8 md:p-10 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-moon-gold)]" />
              <span className="label-xs text-gray-400">
                {t("quote.badge")}
              </span>
            </div>
            <h2 className="heading-2">
              {t("quote.title")}
            </h2>
          </div>

          {/* Product type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t("quote.productType")}</label>
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 hover:bg-white transition-colors"
            >
              {PRODUCT_TYPES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {t("quote.from")} {cad(p.basePrice)}{p.unit === "per_sqft" ? "/sqft" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Size — only for per_sqft */}
          {product.unit === "per_sqft" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t("quote.size")}</label>
              <div className="flex flex-wrap gap-2">
                {SIZES_SQFT.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => setSizeIdx(i)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      sizeIdx === i
                        ? "bg-[var(--color-ink-black)] text-white border-[var(--color-ink-black)]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
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
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t("quote.quantity")}</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 font-bold text-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border border-gray-200 rounded-xl py-2.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 font-bold text-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                +
              </button>
              <div className="hidden sm:flex gap-1.5 ml-2">
                {QTY_PRESETS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setQty(n)}
                    className={`px-3 py-1.5 rounded-lg label-xs font-bold transition-all ${
                      qty === n ? "bg-[var(--color-ink-black)] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
            <div className={`w-10 h-6 rounded-full relative transition-colors ${rush ? "bg-[var(--color-moon-gold)]" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${rush ? "left-[18px]" : "left-0.5"}`} />
            </div>
            <div>
              <span className="text-sm font-bold group-hover:text-black transition-colors">{t("quote.rush")}</span>
              <span className="label-xs text-gray-400 block">{t("quote.rushDesc")}</span>
            </div>
          </label>
        </div>

        {/* Right — Price display */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 md:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("quote.estimatedPrice")}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-black tracking-tighter">
                  {cad(estimate)}
                </span>
                <span className="text-gray-400 text-sm">{t("quote.cad")}</span>
              </div>
              {rush && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-amber-50 text-amber-700 label-xs font-bold px-3 py-1 rounded-full">
                  <span>&#9889;</span> {t("quote.rushIncluded")}
                </div>
              )}
              {product.unit === "per_sqft" && (
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  {cad(product.basePrice)}/sqft &times; {((size.w * size.h) / 144).toFixed(1)} sqft &times; {qty}
                </p>
              )}
              {product.unit === "per_piece" && qty > 1 && (
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  {cad(product.basePrice)}/ea &times; {qty}
                </p>
              )}
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-white px-3 py-1.5 rounded-full label-xs font-bold text-gray-500 border border-gray-200">
                {product.label}
              </span>
              {product.unit === "per_sqft" && (
                <span className="bg-white px-3 py-1.5 rounded-full label-xs font-bold text-gray-500 border border-gray-200">
                  {size.label}
                </span>
              )}
              <span className="bg-white px-3 py-1.5 rounded-full label-xs font-bold text-gray-500 border border-gray-200">
                {t("quote.qty")}: {qty}
              </span>
              {rush && (
                <span className="bg-amber-50 px-3 py-1.5 rounded-full label-xs font-bold text-amber-700 border border-amber-200">
                  {t("quote.rush24h")}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-gray-400">
              <p>{t("quote.hstNote")}</p>
              <p>{t("quote.finalNote")}</p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href={`/shop/${product.category}/${product.slug}`}
              className="btn-dark-pill btn-lg block w-full text-center tracking-widest"
            >
              {t("quote.cta")}
            </Link>
            <p className="text-center label-xs text-gray-400">
              {t("quote.noObligation")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
