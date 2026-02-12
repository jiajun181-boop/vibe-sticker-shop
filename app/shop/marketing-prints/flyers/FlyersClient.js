"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductClient from "@/app/shop/[category]/[product]/ProductClient";
import { getTurnaround, turnaroundI18nKey } from "@/lib/turnaroundConfig";

/* ── helpers (same logic as ProductLandingClient) ── */

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

function getPrintGlossary(t) {
  const keys = [
    "bleed", "safeArea", "cmyk", "dpi", "textStock",
    "cardstock", "coating", "lamination", "turnaround", "proof",
  ];
  return keys.map((k) => ({
    term: t(`printBasics.term.${k}`),
    desc: t(`printBasics.desc.${k}`),
  }));
}

function getFlyerPlaybook(t) {
  return {
    title: t("productLanding.flyer.title"),
    subtitle: t("productLanding.flyer.subtitle"),
    items: [
      {
        id: "promo-fast",
        title: t("productLanding.flyer.promoFast.title"),
        subtitle: t("productLanding.flyer.promoFast.subtitle"),
        badge: t("productLanding.flyer.promoFast.badge"),
        fromPrice: "CA$0.08+",
        eta: t("productLanding.flyer.promoFast.eta"),
        highlights: [
          t("productLanding.flyer.promoFast.h1"),
          t("productLanding.flyer.promoFast.h2"),
          t("productLanding.flyer.promoFast.h3"),
        ],
        preset: { size: "A5", quantity: 1000, material: "100lb gloss text" },
        accent: "bg-emerald-400",
      },
      {
        id: "menu-daily",
        title: t("productLanding.flyer.menuDaily.title"),
        subtitle: t("productLanding.flyer.menuDaily.subtitle"),
        badge: t("productLanding.flyer.menuDaily.badge"),
        fromPrice: "CA$0.11+",
        eta: t("productLanding.flyer.menuDaily.eta"),
        highlights: [
          t("productLanding.flyer.menuDaily.h1"),
          t("productLanding.flyer.menuDaily.h2"),
          t("productLanding.flyer.menuDaily.h3"),
        ],
        preset: { size: "A4", quantity: 500, material: "100lb gloss text" },
        accent: "bg-blue-400",
      },
      {
        id: "event-impact",
        title: t("productLanding.flyer.eventImpact.title"),
        subtitle: t("productLanding.flyer.eventImpact.subtitle"),
        badge: t("productLanding.flyer.eventImpact.badge"),
        fromPrice: "CA$0.14+",
        eta: t("productLanding.flyer.eventImpact.eta"),
        highlights: [
          t("productLanding.flyer.eventImpact.h1"),
          t("productLanding.flyer.eventImpact.h2"),
          t("productLanding.flyer.eventImpact.h3"),
        ],
        preset: { size: "8.5x11", quantity: 500, material: "12pt cardstock" },
        accent: "bg-amber-400",
      },
      {
        id: "brand-premium",
        title: t("productLanding.flyer.brandPremium.title"),
        subtitle: t("productLanding.flyer.brandPremium.subtitle"),
        badge: t("productLanding.flyer.brandPremium.badge"),
        fromPrice: "CA$0.19+",
        eta: t("productLanding.flyer.brandPremium.eta"),
        highlights: [
          t("productLanding.flyer.brandPremium.h1"),
          t("productLanding.flyer.brandPremium.h2"),
          t("productLanding.flyer.brandPremium.h3"),
        ],
        preset: { size: "8.5x11", quantity: 250, material: "14pt cardstock" },
        accent: "bg-violet-400",
      },
    ],
  };
}

/* ── Use case scenarios ── */

function getUseCases(t) {
  return [
    {
      id: "menu",
      label: t("flyersPage.useCase.menu"),
      preset: { size: "A4", quantity: 500, material: "100lb gloss text" },
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
        </svg>
      ),
    },
    {
      id: "event",
      label: t("flyersPage.useCase.event"),
      preset: { size: "8.5x11", quantity: 500, material: "12pt cardstock" },
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
    {
      id: "realEstate",
      label: t("flyersPage.useCase.realEstate"),
      preset: { size: "8.5x11", quantity: 250, material: "14pt cardstock" },
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      id: "retail",
      label: t("flyersPage.useCase.retail"),
      preset: { size: "A5", quantity: 1000, material: "100lb gloss text" },
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
    {
      id: "service",
      label: t("flyersPage.useCase.service"),
      preset: { size: "A5", quantity: 500, material: "100lb gloss text" },
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
        </svg>
      ),
    },
  ];
}

/* ── Size visualization data ── */

const SIZE_VISUALS = [
  { key: "half-letter", nameEn: "Half Letter", nameZh: "半信纸", dims: '5.5" \u00d7 8.5"', w: 5.5, h: 8.5 },
  { key: "letter", nameEn: "Letter", nameZh: "信纸", dims: '8.5" \u00d7 11"', w: 8.5, h: 11 },
  { key: "tabloid", nameEn: "Tabloid", nameZh: "小报", dims: '11" \u00d7 17"', w: 11, h: 17 },
];

/* ── Main Component ── */

export default function FlyersClient({ product, relatedProducts }) {
  const { t, locale } = useTranslation();
  const configuratorRef = useRef(null);

  const sizeOptions = useMemo(() => parseSizeOptions(product.optionsConfig), [product]);
  const variantConfig = useMemo(() => parseVariantConfig(sizeOptions), [sizeOptions]);
  const playbook = useMemo(() => getFlyerPlaybook(t), [t]);
  const printGlossary = useMemo(() => getPrintGlossary(t), [t]);
  const useCases = useMemo(() => getUseCases(t), [t]);

  const [selectedPlanId, setSelectedPlanId] = useState(playbook.items[0]?.id || "");
  const selectedPlan = playbook.items.find((item) => item.id === selectedPlanId) || playbook.items[0];

  const turnaroundKey = getTurnaround(product);
  const turnaroundLabel = t(turnaroundI18nKey(turnaroundKey));

  // Build comparison table data from variant config
  const comparisonData = useMemo(() => {
    if (!variantConfig.enabled) return null;
    return variantConfig.bases.map((base) => {
      const opts = variantConfig.byBase[base];
      const anyOpt = Object.values(opts)[0];
      const recommended = Object.values(opts).some((o) => o.recommended);
      const cells = variantConfig.variants.map((v) => {
        const opt = opts[v];
        const unitPrice = opt ? getStartingUnitPrice(opt) : null;
        return { variant: v, unitPrice, label: opt?.label || `${base} - ${v}` };
      });
      return {
        base,
        dims: anyOpt?.widthIn && anyOpt?.heightIn ? `${anyOpt.widthIn}" \u00d7 ${anyOpt.heightIn}"` : null,
        recommended,
        cells,
      };
    });
  }, [variantConfig]);

  // Get min price per size visual for the hero
  const sizePrices = useMemo(() => {
    const prices = {};
    for (const sv of SIZE_VISUALS) {
      let minPrice = Infinity;
      for (const opt of sizeOptions) {
        const label = opt.label?.toLowerCase() || "";
        if (label.includes(String(sv.w)) && label.includes(String(sv.h))) {
          const p = getStartingUnitPrice(opt);
          if (p !== null) minPrice = Math.min(minPrice, p);
        }
      }
      prices[sv.key] = minPrice < Infinity ? minPrice : null;
    }
    return prices;
  }, [sizeOptions]);

  const scrollToConfigurator = (initialSize) => {
    window.dispatchEvent(
      new CustomEvent("landing-select-size", { detail: { size: initialSize } })
    );
    configuratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyPresetAndScroll = (preset, planId) => {
    if (planId) setSelectedPlanId(planId);
    window.dispatchEvent(new CustomEvent("landing-apply-preset", { detail: preset }));
    configuratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Find the first variant label matching a size visual (for scroll-to)
  const getSizeInitialLabel = (sv) => {
    const match = sizeOptions.find((o) => {
      const l = o.label?.toLowerCase() || "";
      return l.includes(String(sv.w)) && l.includes(String(sv.h));
    });
    return match?.label || "";
  };

  // Largest size for scaling reference
  const maxArea = Math.max(...SIZE_VISUALS.map((s) => s.w * s.h));

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

        {/* ══════════ A. Hero — split layout ══════════ */}
        <header className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          {/* Left: text */}
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{product.name}</h1>
            {product.description && (
              <p className="mt-3 max-w-xl text-base text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {turnaroundLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("productLanding.qualityGuarantee")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => configuratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="mt-6 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              {t("flyersPage.heroCta")}
            </button>
          </div>

          {/* Right: proportional size comparison */}
          <div className="flex items-end justify-center gap-4 lg:gap-5 py-4">
            {SIZE_VISUALS.map((sv) => {
              const scale = Math.sqrt((sv.w * sv.h) / maxArea);
              const price = sizePrices[sv.key];
              return (
                <button
                  key={sv.key}
                  type="button"
                  onClick={() => scrollToConfigurator(getSizeInitialLabel(sv))}
                  className="group flex flex-col items-center"
                >
                  {/* Proportional rectangle */}
                  <div
                    className="relative rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-all duration-200 group-hover:border-gray-900 group-hover:shadow-md flex items-center justify-center"
                    style={{
                      width: `${Math.round(scale * 140)}px`,
                      height: `${Math.round(scale * 140 * (sv.h / sv.w))}px`,
                      maxHeight: "180px",
                    }}
                  >
                    <div className="text-center px-1">
                      <p className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-900 transition-colors">
                        {sv.dims}
                      </p>
                    </div>
                  </div>
                  {/* Label below */}
                  <p className="mt-2 text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {locale === "zh" ? sv.nameZh : sv.nameEn}
                  </p>
                  {price && (
                    <p className="text-[11px] text-gray-500">
                      {t("product.from", { price: formatCad(price) })}/ea
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* ══════════ B. Playbook Presets ══════════ */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-800">{playbook.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{playbook.subtitle}</p>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {playbook.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyPresetAndScroll(item.preset, item.id)}
                className={`group relative min-w-[220px] snap-start rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg sm:min-w-0 ${
                  selectedPlanId === item.id
                    ? "border-gray-900 ring-2 ring-gray-900/10"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                {/* Accent bar */}
                <div className={`absolute top-0 left-4 right-4 h-1 rounded-b-full ${item.accent}`} />

                <div className="flex items-start justify-between gap-2 pt-1">
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap">
                    {item.badge}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>
                <p className="mt-2 text-sm font-bold text-gray-900">{item.fromPrice}</p>
                <p className="text-[11px] text-gray-500">{item.eta}</p>
                <div className="mt-2 space-y-1">
                  {item.highlights.map((h) => (
                    <p key={h} className="text-[11px] text-gray-600">&bull; {h}</p>
                  ))}
                </div>
                <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-700 transition-colors group-hover:bg-gray-900 group-hover:text-white">
                  {t("productLanding.flyer.usePlan")}
                </span>
              </button>
            ))}
          </div>

          {/* Selected plan summary */}
          {selectedPlan && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                {t("productLanding.flyer.selected")}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-gray-900">{selectedPlan.title}</p>
                <p className="text-xs text-gray-500">{selectedPlan.subtitle}</p>
                <p className="text-xs text-gray-600">{t("productLanding.flyer.size", { value: selectedPlan.preset.size })}</p>
                <p className="text-xs text-gray-600">{t("productLanding.flyer.qty", { value: selectedPlan.preset.quantity })}</p>
                <p className="text-xs text-gray-600">{t("productLanding.flyer.material", { value: selectedPlan.preset.material })}</p>
              </div>
            </div>
          )}
        </section>

        {/* ══════════ C. Size × Side Comparison Table ══════════ */}
        {comparisonData && comparisonData.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-gray-800">{t("flyersPage.compareTitle")}</h2>
            <p className="mt-1 text-sm text-gray-600">{t("flyersPage.compareSub")}</p>

            {/* Desktop table */}
            <div className="mt-4 hidden sm:block overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                      {t("flyersPage.sizeShowcase")}
                    </th>
                    {variantConfig.variants.map((v) => (
                      <th key={v} className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                        {v}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr key={row.base} className={idx < comparisonData.length - 1 ? "border-b border-gray-100" : ""}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{row.base}</span>
                          {row.recommended && (
                            <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                              {t("flyersPage.recommended")}
                            </span>
                          )}
                        </div>
                        {row.dims && <p className="text-[11px] text-gray-500">{row.dims}</p>}
                      </td>
                      {row.cells.map((cell) => (
                        <td key={cell.variant} className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => scrollToConfigurator(cell.label)}
                            className="group inline-flex flex-col items-center rounded-xl px-3 py-2 transition-all hover:bg-gray-50"
                          >
                            {cell.unitPrice !== null ? (
                              <span className="text-sm font-bold text-gray-900">
                                {formatCad(cell.unitPrice)}/ea
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">&mdash;</span>
                            )}
                            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 transition-colors group-hover:text-gray-900">
                              {t("flyersPage.selectSize")}
                            </span>
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="mt-4 space-y-3 sm:hidden">
              {comparisonData.map((row) => (
                <div key={row.base} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{row.base}</p>
                    {row.recommended && (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        {t("flyersPage.recommended")}
                      </span>
                    )}
                  </div>
                  {row.dims && <p className="text-[11px] text-gray-500">{row.dims}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {row.cells.map((cell) => (
                      <button
                        key={cell.variant}
                        type="button"
                        onClick={() => scrollToConfigurator(cell.label)}
                        className="group rounded-xl border border-gray-100 px-3 py-2 text-center transition-all hover:border-gray-900"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{cell.variant}</p>
                        {cell.unitPrice !== null ? (
                          <p className="mt-1 text-sm font-bold text-gray-900">{formatCad(cell.unitPrice)}/ea</p>
                        ) : (
                          <p className="mt-1 text-xs text-gray-400">&mdash;</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════ D. Use Case Inspiration ══════════ */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-800">{t("flyersPage.useCaseTitle")}</h2>
          <p className="mt-1 text-sm text-gray-600">{t("flyersPage.useCaseSub")}</p>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible sm:pb-0">
            {useCases.map((uc) => (
              <button
                key={uc.id}
                type="button"
                onClick={() => applyPresetAndScroll(uc.preset)}
                className="group flex min-w-[140px] snap-start flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-lg sm:min-w-0"
              >
                <div className="text-gray-400 transition-colors group-hover:text-gray-900">
                  {uc.icon}
                </div>
                <p className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                  {uc.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* ══════════ E. Quality & Trust Info Bar ══════════ */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
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

        {/* ══════════ F. Print Glossary ══════════ */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">{t("printBasics.title")}</h2>
          <p className="mt-1 text-sm text-gray-600">{t("printBasics.subtitle")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {printGlossary.map((item) => (
              <div key={item.term} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <p className="text-sm font-semibold text-gray-900">{item.term}</p>
                <p className="mt-0.5 text-xs text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ══════════ G. Embedded Configurator ══════════ */}
      <div ref={configuratorRef} className="mt-12 scroll-mt-20">
        <ProductClient product={product} relatedProducts={relatedProducts} embedded />
      </div>
    </main>
  );
}
