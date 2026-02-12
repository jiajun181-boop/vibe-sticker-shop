"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductClient from "@/app/shop/[category]/[product]/ProductClient";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function getStartingUnitPrice(option) {
  const pbq = option?.priceByQty;
  if (!pbq || typeof pbq !== "object") return null;
  const entries = Object.entries(pbq)
    .map(([q, t]) => [Number(q), Number(t)])
    .filter(([q, t]) => q > 0 && t > 0)
    .sort((a, b) => a[0] - b[0]);
  if (entries.length === 0) return null;
  return Math.round(entries[0][1] / entries[0][0]);
}

function parseSizeOptions(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const sizes = Array.isArray(optionsConfig.sizes) ? optionsConfig.sizes : [];
  return sizes
    .filter((item) => item && typeof item === "object" && typeof item.label === "string")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : item.label,
      label: item.label,
      displayLabel: typeof item.displayLabel === "string" ? item.displayLabel : null,
      widthIn: typeof item.widthIn === "number" ? item.widthIn : null,
      heightIn: typeof item.heightIn === "number" ? item.heightIn : null,
      notes: typeof item.notes === "string" ? item.notes : "",
      priceByQty: item.priceByQty && typeof item.priceByQty === "object" ? item.priceByQty : null,
      recommended: item.recommended === true,
    }));
}

function parseVariantConfig(sizeOptions) {
  const regex = /^(.+)\s+-\s+(.+)$/;
  const parsed = sizeOptions
    .map((s) => {
      const m = typeof s.label === "string" ? s.label.match(regex) : null;
      if (!m) return null;
      return { base: m[1], variant: m[2], option: s };
    })
    .filter(Boolean);

  if (parsed.length < 2 || parsed.length !== sizeOptions.length)
    return { enabled: false, bases: [], variants: [], byBase: {} };

  const variantSet = new Set(parsed.map((p) => p.variant));
  if (variantSet.size < 2)
    return { enabled: false, bases: [], variants: [], byBase: {} };

  const byBase = {};
  const seenBases = new Set();
  const bases = [];
  for (const p of parsed) {
    if (!seenBases.has(p.base)) { bases.push(p.base); seenBases.add(p.base); }
    if (!byBase[p.base]) byBase[p.base] = {};
    byBase[p.base][p.variant] = p.option;
  }
  return { enabled: true, bases, variants: [...variantSet], byBase };
}

function getFeatureTags(product) {
  const tags = [];
  const preset = product.pricingPreset?.config;
  const opts = product.optionsConfig;

  // From finishings
  if (preset?.finishings?.length > 0) {
    for (const f of preset.finishings) {
      const name = f.name || f.id;
      if (name && !tags.includes(name)) tags.push(name);
    }
  }

  // From addons
  const addons = preset?.addons || opts?.addons || [];
  if (Array.isArray(addons)) {
    for (const a of addons) {
      const name = a.name || a.id;
      if (name && !tags.includes(name)) tags.push(name);
    }
  }

  // From materials count
  const mats = preset?.materials || opts?.materials || [];
  if (Array.isArray(mats) && mats.length > 1) {
    tags.push(`${mats.length} Paper Stocks`);
  }

  return tags.slice(0, 6);
}

export default function ProductLandingClient({ product, relatedProducts }) {
  const { t } = useTranslation();
  const configuratorRef = useRef(null);

  const sizeOptions = useMemo(() => parseSizeOptions(product.optionsConfig), [product]);
  const variantConfig = useMemo(() => parseVariantConfig(sizeOptions), [sizeOptions]);
  const featureTags = useMemo(() => getFeatureTags(product), [product]);

  const turnaroundKey = getTurnaround(product);
  const turnaroundLabel = t(turnaroundI18nKey(turnaroundKey));
  const turnaroundClasses = turnaroundColor(turnaroundKey);

  // Build model cards data
  const modelCards = useMemo(() => {
    if (variantConfig.enabled) {
      return variantConfig.bases.map((base) => {
        const opts = Object.values(variantConfig.byBase[base]);
        const anyOpt = opts[0];
        const dims =
          anyOpt?.widthIn && anyOpt?.heightIn
            ? `${anyOpt.widthIn}" × ${anyOpt.heightIn}"`
            : anyOpt?.notes || null;
        let minPrice = Infinity;
        for (const opt of opts) {
          const p = getStartingUnitPrice(opt);
          if (p !== null) minPrice = Math.min(minPrice, p);
        }
        const recommended = opts.some((o) => o.recommended);
        // For variant products, initialSize is "Base - FirstVariant"
        const firstVariant = Object.keys(variantConfig.byBase[base])[0];
        const initialSize = firstVariant ? `${base} - ${firstVariant}` : base;
        return { key: base, label: base, dims, minPrice, recommended, initialSize };
      });
    }
    return sizeOptions.map((o) => {
      const dims =
        o.widthIn && o.heightIn ? `${o.widthIn}" × ${o.heightIn}"` : null;
      const subtitle = dims || o.notes || null;
      const unitPrice = getStartingUnitPrice(o);
      return {
        key: o.label,
        label: o.displayLabel || o.label,
        dims: subtitle,
        minPrice: unitPrice ?? Infinity,
        recommended: o.recommended,
        initialSize: o.label,
      };
    });
  }, [variantConfig, sizeOptions]);

  const scrollToConfigurator = (initialSize) => {
    // Update the configurator's initial size by dispatching a custom event
    window.dispatchEvent(
      new CustomEvent("landing-select-size", { detail: { size: initialSize } })
    );
    configuratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("mp.landing.title"), href: "/shop/marketing-prints" },
            { label: product.name },
          ]}
        />

        {/* Hero Section */}
        <header className="mt-6">
          <h1 className="text-4xl font-semibold tracking-tight">{product.name}</h1>
          {product.description && (
            <p className="mt-3 max-w-2xl text-base text-gray-600 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Feature tags */}
          {featureTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {featureTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Model Cards */}
        {modelCards.length > 1 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-800">
              {t("productLanding.chooseStyle")}
            </h2>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {modelCards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => scrollToConfigurator(card.initialSize)}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400"
                >
                  {card.recommended && (
                    <span className="absolute top-2 right-2 rounded-full bg-gray-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Popular
                    </span>
                  )}
                  <span className="block text-sm font-semibold text-gray-900">
                    {card.label}
                  </span>
                  {card.dims && (
                    <span className="mt-1 block text-xs text-gray-500">{card.dims}</span>
                  )}
                  {card.minPrice < Infinity && (
                    <span className="mt-2 block text-sm font-bold text-gray-900">
                      {t("product.from", { price: formatCad(card.minPrice) })}/ea
                    </span>
                  )}
                  <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600 transition-colors group-hover:bg-gray-900 group-hover:text-white">
                    {t("productLanding.selectOrder")}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Info Bar */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-900">{t("productLanding.qualityGuarantee")}</p>
              <p className="text-[11px] text-gray-500">{t("productLanding.qualityDetail")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <svg className="h-5 w-5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-900">{turnaroundLabel}</p>
              <p className="text-[11px] text-gray-500">{t("productLanding.rushAvailable")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <svg className="h-5 w-5 flex-shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-900">{t("productLanding.customOptions")}</p>
              <p className="text-[11px] text-gray-500">
                <Link href="/contact" className="underline hover:text-gray-900">
                  {t("productLanding.getQuote")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configurator Section */}
      <div ref={configuratorRef} className="mt-12 scroll-mt-20">
        <ProductClient product={product} relatedProducts={relatedProducts} embedded />
      </div>
    </main>
  );
}
