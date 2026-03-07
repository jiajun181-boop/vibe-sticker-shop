"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { STAMP_MODELS, STAMP_QUANTITIES, STAMP_PRESETS } from "@/lib/stamp-order-config";
import dynamic from "next/dynamic";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import {
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  DeliveryEstimate,
  EmailQuotePopover,
  useConfiguratorPrice,
  useConfiguratorCart,
  StepCard,
  OptionCard,
  OptionGrid,
} from "@/components/configurator";
import QuantityScroller from "@/components/configurator/QuantityScroller";

function StampEditorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading stamp editor">
      {/* Canvas preview skeleton */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-3 w-16 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded-full bg-gray-100" />
        </div>
        <div className="mx-auto aspect-square w-full max-w-[260px] sm:max-w-[360px] md:max-w-[450px] rounded-xl bg-gray-100 flex items-center justify-center">
          <span className="text-xs text-gray-400">Loading stamp preview…</span>
        </div>
        <div className="mt-2 mx-auto h-2 w-32 rounded bg-gray-100" />
      </div>
      {/* Font picker skeleton */}
      <div>
        <div className="h-3 w-12 rounded bg-gray-200 mb-2" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 w-20 rounded-lg bg-gray-100" />)}
        </div>
      </div>
      {/* Border picker skeleton */}
      <div>
        <div className="h-3 w-14 rounded bg-gray-200 mb-2" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 w-10 rounded-full bg-gray-100" />)}
        </div>
      </div>
      {/* Templates skeleton */}
      <div>
        <div className="h-3 w-20 rounded bg-gray-200 mb-2" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-100" />)}
        </div>
      </div>
    </div>
  );
}

const StampEditor = dynamic(() => import("@/components/product/StampEditor"), {
  ssr: false,
  loading: () => <StampEditorSkeleton />,
});

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// Ink color is locked to black for now
const INK_COLOR = "#111111";

export default function StampOrderClient({ defaultSlug, productImages = [] }) {
  const { t, locale } = useTranslation();

  // Resolve preset (personalized entry) or model slug
  const preset = defaultSlug ? STAMP_PRESETS[defaultSlug] : null;

  // ── State ──
  const [modelIdx, setModelIdx] = useState(() => {
    // 1. Check if defaultSlug is a preset with a defaultModel
    if (preset) {
      const idx = STAMP_MODELS.findIndex((m) => m.id === preset.defaultModel);
      if (idx >= 0) return idx;
    }
    // 2. Check if defaultSlug is a model slug
    if (defaultSlug) {
      const idx = STAMP_MODELS.findIndex((m) => m.slug === defaultSlug);
      if (idx >= 0) return idx;
    }
    return 3; // default to S-827
  });
  const model = STAMP_MODELS[modelIdx];
  const sizeLabel = model.label;
  const widthIn = model.w;
  const heightIn = model.h;
  const shape = model.shape;

  const [quantity, setQuantity] = useState(1);
  const [stampText, setStampText] = useState(
    preset?.defaultText || "YOUR COMPANY\nAddress Line\nPhone Number"
  );
  const [stampFont, setStampFont] = useState(preset?.defaultFont || "Helvetica");
  const [stampConfig, setStampConfig] = useState({});

  const effectiveQty = quantity;

  // ── Pricing ──
  const quote = useConfiguratorPrice({
    slug: "stamps",
    quantity: effectiveQty,
    widthIn,
    heightIn,
    sizeLabel,
    enabled: effectiveQty > 0,
  });

  const canAddToCart = quote.quoteData && !quote.quoteLoading && effectiveQty > 0;

  // ── Cart ──
  const buildCartItem = useCallback(() => {
    if (effectiveQty <= 0) return null;
    return {
      id: model.slug,
      slug: model.slug,
      name: preset ? preset.name : `Self-Inking Stamp — ${sizeLabel}`,
      price: quote.unitCents || 0,
      quantity: effectiveQty,
      image: null,
      options: {
        model: model.id,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        shape,
        stampText,
        stampFont,
        stampColor: INK_COLOR,
        ...stampConfig,
      },
    };
  }, [effectiveQty, model, sizeLabel, quote.unitCents, widthIn, heightIn, shape, stampText, stampFont, stampConfig]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: preset ? `${preset.name} added to cart!` : "Self-Inking Stamp added to cart!",
  });

  // ── Stamp editor callback ──
  const handleStampChange = useCallback((patch) => {
    if (patch.font !== undefined) setStampFont(patch.font);
    // Strip color from patch — ink is locked to black
    const { color: _dropped, ...safePatch } = patch;
    setStampConfig((prev) => ({ ...prev, ...safePatch }));
  }, []);

  // ── Steps (all alwaysOpen — no collapsing) ──
  // When uploadFirst: Design(1) → Model(2) → Text(3) → Quantity(4)
  // Default:          Model(1) → Quantity(2) → Text(3) → Design(4)
  const stepNums = preset?.uploadFirst
    ? { stampDesign: 1, model: 2, stampText: 3, quantity: 4 }
    : { model: 1, quantity: 2, stampText: 3, stampDesign: 4 };
  const stepNum = (id) => stepNums[id] || 0;

  // ── Summary lines ──
  const summaryLines = useMemo(() => [
    ...(preset ? [{ label: "Product", value: preset.name }] : []),
    { label: "Model", value: sizeLabel },
    { label: "Shape", value: shape === "round" ? "Round" : "Rectangle" },
    { label: "Ink", value: "Black" },
    { label: "Quantity", value: effectiveQty.toLocaleString() },
  ], [sizeLabel, shape, effectiveQty, preset]);

  // ── Hero text ──
  const heroTitle = preset ? preset.name : "Custom Self-Inking Stamps";
  const heroSubtitle = preset
    ? preset.description
    : "Premium self-inking stamps with built-in ink pad and custom artwork";

  // ── Render ──
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("marketingPrint.breadcrumb", "Marketing & Print"), href: "/shop/marketing-business-print" },
          { label: "Stamps", href: "/shop/marketing-business-print/stamps" },
          { label: heroTitle },
        ]}
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          preset?.badge || "Built-in ink pad",
          t("marketingPrint.badgeShipping", "Fast shipping"),
          t("marketingPrint.badgeProof", "Free digital proof"),
        ]}
      />

      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-2 sm:space-y-3 md:col-span-2">

            {/* Product Gallery */}
            {productImages?.length > 0 && (
              <ConfigProductGallery images={productImages} inline />
            )}

            {/* Halftone hint for Custom Face Stamp (only when NOT uploadFirst — uploadFirst puts upload at top) */}
            {preset?.halftoneHint && !preset?.uploadFirst && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">Upload your face photo in Step 4</p>
                <p className="mt-0.5 text-xs text-amber-700">Use the halftone feature in the design editor to convert your photo into a stamp-ready image.</p>
              </div>
            )}

            {/* Preset tagline + CTA card */}
            {preset?.tagline && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                <p className="text-sm text-teal-900">{preset.tagline}</p>
                {preset.ctaLabel && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = preset.uploadFirst ? "step-stampDesign" : "step-stampText";
                      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="mt-2 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
                  >
                    {preset.ctaLabel} &darr;
                  </button>
                )}
              </div>
            )}

            {/* Steps — reorder when uploadFirst */}
            {preset?.uploadFirst ? (
              <>
                {/* Step 1: Design Your Stamp (upload-first) */}
                <StepCard
                  stepNumber={stepNum("stampDesign")}
                  title={t("stamp.design", "Design Your Stamp")}
                  summaryText={shape === "round" ? "Round" : "Rectangle"}
                  stepId="step-stampDesign"
                  alwaysOpen
                >
                  <StampEditor
                    shape={shape}
                    widthIn={widthIn}
                    heightIn={heightIn}
                    diameterIn={shape === "round" ? widthIn : undefined}
                    text={stampText}
                    font={stampFont}
                    color={INK_COLOR}
                    onChange={handleStampChange}
                    hideInkColor
                    uploadFirst
                  />
                </StepCard>

                {/* Step 2: Model / Size */}
                <StepCard
                  stepNumber={stepNum("model")}
                  title="Stamp Model"
                  hint="Choose your stamp size"
                  summaryText={sizeLabel}
                  stepId="step-model"
                  alwaysOpen
                  compact
                >
                  <OptionGrid columns={4} label="Stamp Model">
                    {STAMP_MODELS.map((m, idx) => (
                      <OptionCard
                        key={m.id}
                        label={m.label}
                        selected={modelIdx === idx}
                        onSelect={() => setModelIdx(idx)}
                      />
                    ))}
                  </OptionGrid>
                </StepCard>

                {/* Step 3: Stamp Text */}
                <StepCard
                  stepNumber={stepNum("stampText")}
                  title={t("stamp.text", "Stamp Text")}
                  summaryText={stampText.split("\n")[0]}
                  stepId="step-stampText"
                  alwaysOpen
                >
                  <textarea
                    rows={4}
                    placeholder={t("stamp.textPlaceholder", "Enter your stamp text (one line per row)")}
                    value={stampText}
                    onChange={(e) => {
                      setStampText(e.target.value);
                      handleStampChange({ text: e.target.value });
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10 resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">{t("stamp.textHint", "Each line will be displayed separately on the stamp")}</p>
                </StepCard>

                {/* Step 4: Quantity */}
                <StepCard
                  stepNumber={stepNum("quantity")}
                  title={t("marketingPrint.quantity", "Quantity")}
                  hint={t("step.quantity.hint")}
                  summaryText={`${effectiveQty} pcs`}
                  stepId="step-quantity"
                  alwaysOpen
                  compact
                >
                  <QuantityScroller
                    quantities={STAMP_QUANTITIES}
                    selected={quantity}
                    onSelect={(q) => setQuantity(q)}
                    t={t}
                  />
                </StepCard>
              </>
            ) : (
              <>
                {/* Step 1: Model / Size */}
                <StepCard
                  stepNumber={stepNum("model")}
                  title="Stamp Model"
                  hint="Choose your stamp size"
                  summaryText={sizeLabel}
                  stepId="step-model"
                  alwaysOpen
                  compact
                >
                  <OptionGrid columns={4} label="Stamp Model">
                    {STAMP_MODELS.map((m, idx) => (
                      <OptionCard
                        key={m.id}
                        label={m.label}
                        selected={modelIdx === idx}
                        onSelect={() => setModelIdx(idx)}
                      />
                    ))}
                  </OptionGrid>
                </StepCard>

                {/* Step 2: Quantity */}
                <StepCard
                  stepNumber={stepNum("quantity")}
                  title={t("marketingPrint.quantity", "Quantity")}
                  hint={t("step.quantity.hint")}
                  summaryText={`${effectiveQty} pcs`}
                  stepId="step-quantity"
                  alwaysOpen
                  compact
                >
                  <QuantityScroller
                    quantities={STAMP_QUANTITIES}
                    selected={quantity}
                    onSelect={(q) => setQuantity(q)}
                    t={t}
                  />
                </StepCard>

                {/* Step 3: Stamp Text */}
                <StepCard
                  stepNumber={stepNum("stampText")}
                  title={t("stamp.text", "Stamp Text")}
                  summaryText={stampText.split("\n")[0]}
                  stepId="step-stampText"
                  alwaysOpen
                >
                  <textarea
                    rows={4}
                    placeholder={t("stamp.textPlaceholder", "Enter your stamp text (one line per row)")}
                    value={stampText}
                    onChange={(e) => {
                      setStampText(e.target.value);
                      handleStampChange({ text: e.target.value });
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10 resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">{t("stamp.textHint", "Each line will be displayed separately on the stamp")}</p>
                </StepCard>

                {/* Step 4: Design Your Stamp */}
                <StepCard
                  stepNumber={stepNum("stampDesign")}
                  title={t("stamp.design", "Design Your Stamp")}
                  summaryText={shape === "round" ? "Round" : "Rectangle"}
                  stepId="step-stampDesign"
                  alwaysOpen
                >
                  <StampEditor
                    shape={shape}
                    widthIn={widthIn}
                    heightIn={heightIn}
                    diameterIn={shape === "round" ? widthIn : undefined}
                    text={stampText}
                    font={stampFont}
                    color={INK_COLOR}
                    onChange={handleStampChange}
                    hideInkColor
                  />
                </StepCard>
              </>
            )}
          </div>

          {/* RIGHT COLUMN — Pricing Sidebar */}
          <PricingSidebar
            summaryLines={summaryLines}
            quoteLoading={quote.quoteLoading}
            quoteError={quote.quoteError}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            taxCents={quote.taxCents}
            totalCents={quote.subtotalCents}
            quantity={effectiveQty}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            badges={[
              "Built-in ink pad",
              t("marketingPrint.badgeShipping", "Fast shipping"),
            ]}
            t={t}
            productName={heroTitle}
            categorySlug="marketing-business-print"
            locale={locale}
            productSlug="stamps"
            onRetryPrice={quote.retry}
          />
        </div>
      </div>

      {/* Inline mobile delivery + email quote */}
      {!!quote.quoteData && (
        <div className="mx-auto max-w-4xl px-4 pb-4 md:hidden space-y-3">
          <DeliveryEstimate categorySlug="marketing-business-print" t={t} locale={locale} />
          <EmailQuotePopover
            productName={heroTitle}
            summaryLines={summaryLines || []}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            quantity={effectiveQty}
            t={t}
          />
        </div>
      )}

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        quantity={effectiveQty}
        summaryText={quote.quoteData ? `${formatCad(quote.unitCents)}/ea × ${effectiveQty}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        onRetryPrice={quote.retry}
      />

      {/* FAQ Section */}
      {(() => {
        const faqItems = getConfiguratorFaqs("stamps");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl pb-16 pt-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}
    </main>
  );
}
