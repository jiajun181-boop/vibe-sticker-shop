"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductClient from "@/app/shop/[category]/[product]/ProductClient";
import { getTurnaround, turnaroundI18nKey } from "@/lib/turnaroundConfig";

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

function getPrintGlossary(t) {
  const keys = [
    "bleed",
    "safeArea",
    "cmyk",
    "dpi",
    "textStock",
    "cardstock",
    "coating",
    "lamination",
    "turnaround",
    "proof",
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
    },
    ],
  };
}

function getPlaybookForSlug(slug, t, locale) {
  if (slug === "flyers" || slug === "mp-flyers") return getFlyerPlaybook(t);

  const zh = locale === "zh";

  if (slug === "postcards") {
    return {
      title: zh ? "先选一个明信片方案" : "Pick a postcard plan first",
      subtitle: zh ? "按用途先选，再微调尺寸与纸张。" : "Choose by scenario first, then fine-tune size and stock.",
      items: [
        {
          id: "postcard-direct-mail",
          title: zh ? "直邮推广款" : "Direct Mail",
          subtitle: zh ? "活动宣传 / 门店触达" : "Campaigns / local outreach",
          badge: zh ? "常用" : "Popular",
          fromPrice: "CA$0.09+",
          eta: zh ? "2-3个工作日" : "2-3 business days",
          highlights: zh ? ["覆盖面广", "适合批量投放", "支持双面"] : ["Wide reach", "Bulk ready", "Double-side friendly"],
          preset: { size: "4x6", quantity: 1000, material: "12pt cardstock" },
        },
        {
          id: "postcard-promo",
          title: zh ? "促销活动款" : "Promo Card",
          subtitle: zh ? "优惠券 / 到店引流" : "Coupons / store visits",
          badge: zh ? "推荐" : "Recommended",
          fromPrice: "CA$0.11+",
          eta: zh ? "2-3个工作日" : "2-3 business days",
          highlights: zh ? ["颜色醒目", "适合短期活动", "可加急"] : ["Vibrant color", "Short campaign fit", "Rush option"],
          preset: { size: "5x7", quantity: 500, material: "14pt cardstock" },
        },
        {
          id: "postcard-premium",
          title: zh ? "品牌高级款" : "Premium Brand",
          subtitle: zh ? "品牌介绍 / 高端邀约" : "Brand story / premium invite",
          badge: zh ? "高级" : "Premium",
          fromPrice: "CA$0.16+",
          eta: zh ? "2-4个工作日" : "2-4 business days",
          highlights: zh ? ["厚卡质感", "品牌感更强", "适合长期物料"] : ["Heavier feel", "Stronger branding", "Long-life collateral"],
          preset: { size: "6x9", quantity: 250, material: "16pt cardstock" },
        },
      ],
    };
  }

  if (slug === "brochures") {
    return {
      title: zh ? "先选一个折页方案" : "Pick a brochure plan first",
      subtitle: zh ? "先看场景，再选折法和材质。" : "Start from use case, then pick fold type and stock.",
      items: [
        {
          id: "brochure-bi-fold",
          title: zh ? "二折简洁款" : "Bi-fold Basic",
          subtitle: zh ? "产品介绍 / 价格单" : "Product intro / price sheet",
          badge: zh ? "易读" : "Clean",
          fromPrice: "CA$0.22+",
          eta: zh ? "2-3个工作日" : "2-3 business days",
          highlights: zh ? ["信息清晰", "制作快速", "适配多数场景"] : ["Clear layout", "Fast to produce", "Fits most use cases"],
          preset: { size: "8.5x11", quantity: 500, material: "100lb gloss text" },
        },
        {
          id: "brochure-tri-fold",
          title: zh ? "三折营销款" : "Tri-fold Marketing",
          subtitle: zh ? "门店介绍 / 服务说明" : "Store intro / service details",
          badge: zh ? "推荐" : "Recommended",
          fromPrice: "CA$0.26+",
          eta: zh ? "2-3个工作日" : "2-3 business days",
          highlights: zh ? ["分栏清楚", "便于携带", "转化友好"] : ["Structured sections", "Pocket-friendly", "Conversion ready"],
          preset: { size: "8.5x14", quantity: 500, material: "100lb gloss text" },
        },
        {
          id: "brochure-premium",
          title: zh ? "高端质感款" : "Premium Finish",
          subtitle: zh ? "品牌画册 / 高价值客户" : "Brand brochure / premium leads",
          badge: zh ? "高级" : "Premium",
          fromPrice: "CA$0.33+",
          eta: zh ? "3-4个工作日" : "3-4 business days",
          highlights: zh ? ["纸张更厚", "触感更好", "品牌感更强"] : ["Heavier stock", "Better tactile feel", "Stronger brand feel"],
          preset: { size: "11x17", quantity: 250, material: "14pt cardstock" },
        },
      ],
    };
  }

  if (slug === "menus") {
    return {
      title: zh ? "先选一个菜单方案" : "Pick a menu plan first",
      subtitle: zh ? "按使用环境先选，再细调尺寸和数量。" : "Choose by environment first, then tune size and quantity.",
      items: [
        {
          id: "menu-counter",
          title: zh ? "柜台快用款" : "Counter Quick",
          subtitle: zh ? "点单台 / 外卖夹单" : "Counter / takeout inserts",
          badge: zh ? "高频" : "Fast",
          fromPrice: "CA$0.10+",
          eta: zh ? "2-3个工作日" : "2-3 business days",
          highlights: zh ? ["经济高效", "更新成本低", "适合频繁改价"] : ["Cost effective", "Low refresh cost", "Good for frequent updates"],
          preset: { size: "8.5x11", quantity: 1000, material: "100lb gloss text" },
        },
        {
          id: "menu-dinein",
          title: zh ? "堂食耐用款" : "Dine-in Durable",
          subtitle: zh ? "餐桌菜单 / 长期使用" : "Table menus / long-term use",
          badge: zh ? "推荐" : "Recommended",
          fromPrice: "CA$0.18+",
          eta: zh ? "2-4个工作日" : "2-4 business days",
          highlights: zh ? ["可选覆膜", "抗污更好", "手感更稳定"] : ["Lamination ready", "Better stain resistance", "Stable feel"],
          preset: { size: "11x17", quantity: 250, material: "14pt cardstock" },
        },
        {
          id: "menu-premium",
          title: zh ? "品牌展示款" : "Brand Showcase",
          subtitle: zh ? "精品餐厅 / 饮品单" : "Premium dining / drink menus",
          badge: zh ? "高级" : "Premium",
          fromPrice: "CA$0.24+",
          eta: zh ? "3-4个工作日" : "3-4 business days",
          highlights: zh ? ["质感更强", "色彩更饱满", "提升品牌形象"] : ["Premium feel", "Richer color", "Boosts brand image"],
          preset: { size: "8.5x14", quantity: 250, material: "16pt cardstock" },
        },
      ],
    };
  }

  if (slug === "booklets") {
    return {
      title: zh ? "先选一个画册方案" : "Pick a booklet plan first",
      subtitle: zh ? "先按内容量选，再微调尺寸与页数配置。" : "Pick by content volume first, then fine-tune format.",
      items: [
        {
          id: "booklet-compact",
          title: zh ? "轻量展示款" : "Compact Intro",
          subtitle: zh ? "活动手册 / 产品速览" : "Event handout / quick catalog",
          badge: zh ? "实用" : "Practical",
          fromPrice: "CA$0.69+",
          eta: zh ? "3-5个工作日" : "3-5 business days",
          highlights: zh ? ["页数精简", "成本可控", "交付稳定"] : ["Lean pages", "Budget friendly", "Stable turnaround"],
          preset: { size: "5.5x8.5", quantity: 250, material: "100lb gloss text" },
        },
        {
          id: "booklet-standard",
          title: zh ? "标准营销款" : "Standard Marketing",
          subtitle: zh ? "服务手册 / 品牌介绍" : "Service guide / brand story",
          badge: zh ? "推荐" : "Recommended",
          fromPrice: "CA$0.88+",
          eta: zh ? "3-5个工作日" : "3-5 business days",
          highlights: zh ? ["信息容量更大", "版式更完整", "适配大部分场景"] : ["Higher content capacity", "More complete layout", "Fits most use cases"],
          preset: { size: "8.5x11", quantity: 250, material: "100lb gloss text" },
        },
        {
          id: "booklet-premium",
          title: zh ? "高端画册款" : "Premium Catalog",
          subtitle: zh ? "品牌画册 / 高端展示" : "Brand catalog / premium showcase",
          badge: zh ? "高级" : "Premium",
          fromPrice: "CA$1.20+",
          eta: zh ? "4-6个工作日" : "4-6 business days",
          highlights: zh ? ["封面更厚", "阅读体验更好", "品牌感更强"] : ["Heavier cover", "Better reading feel", "Stronger brand impression"],
          preset: { size: "8.5x11", quantity: 100, material: "14pt cardstock" },
        },
      ],
    };
  }

  return null;
}

function getBrochureModelPreset(model) {
  if (model === "bi-fold") {
    return { size: "bi-fold", quantity: 500, material: "100lb gloss text" };
  }
  if (model === "tri-fold") {
    return { size: "tri-fold", quantity: 500, material: "100lb gloss text" };
  }
  if (model === "z-fold") {
    return { size: "gate fold", quantity: 250, material: "14pt cardstock" };
  }
  return null;
}

export default function ProductLandingClient({ product, relatedProducts, brochureModel = null }) {
  const { t, locale } = useTranslation();
  const configuratorRef = useRef(null);

  const sizeOptions = useMemo(() => parseSizeOptions(product.optionsConfig), [product]);
  const variantConfig = useMemo(() => parseVariantConfig(sizeOptions), [sizeOptions]);
  const featureTags = useMemo(() => getFeatureTags(product), [product]);
  const printGlossary = useMemo(() => getPrintGlossary(t), [t]);
  const playbook = useMemo(() => getPlaybookForSlug(product.slug, t, locale), [product.slug, t, locale]);
  const [selectedPlanState, setSelectedPlanState] = useState({ slug: "", id: "" });
  const isBrochureModelPage = product.slug === "brochures" && Boolean(brochureModel);
  const brochureModelPreset = useMemo(() => getBrochureModelPreset(brochureModel), [brochureModel]);

  const turnaroundKey = getTurnaround(product);
  const turnaroundLabel = t(turnaroundI18nKey(turnaroundKey));

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

  const applyPresetAndScroll = (preset, planId) => {
    if (planId) setSelectedPlanState({ slug: product.slug, id: planId });
    window.dispatchEvent(new CustomEvent("landing-apply-preset", { detail: preset }));
    configuratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const selectedPlanId =
    selectedPlanState.slug === product.slug && selectedPlanState.id
      ? selectedPlanState.id
      : playbook?.items?.[0]?.id || "";
  const selectedPlan = (playbook?.items || []).find((item) => item.id === selectedPlanId) || playbook?.items?.[0];

  useEffect(() => {
    if (!isBrochureModelPage || !brochureModelPreset) return;
    window.dispatchEvent(new CustomEvent("landing-apply-preset", { detail: brochureModelPreset }));
  }, [isBrochureModelPage, brochureModelPreset]);

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

        {playbook && !isBrochureModelPage && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800">
              {playbook.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {playbook.subtitle}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {playbook.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyPresetAndScroll(item.preset, item.id)}
                  className={`group rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-lg ${
                    selectedPlanId === item.id ? "border-gray-900 ring-2 ring-gray-900/10" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>
                  <p className="mt-2 text-sm font-bold text-gray-900">{item.fromPrice}</p>
                  <p className="text-[11px] text-gray-500">{item.eta}</p>
                  <div className="mt-2 space-y-1">
                    {item.highlights.map((h) => (
                      <p key={h} className="text-[11px] text-gray-600">• {h}</p>
                    ))}
                  </div>
                  <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-700 transition-colors group-hover:bg-gray-900 group-hover:text-white">
                    {t("productLanding.flyer.usePlan")}
                  </span>
                </button>
              ))}
            </div>
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
        )}

        {/* Model Cards */}
        {modelCards.length > 1 && !isBrochureModelPage && (
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

      {/* Configurator Section */}
      <div ref={configuratorRef} className="mt-12 scroll-mt-20">
        <ProductClient product={product} relatedProducts={relatedProducts} embedded />
      </div>
    </main>
  );
}
