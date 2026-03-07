"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { STAMP_MODELS, STAMP_QUANTITIES } from "@/lib/stamp-order-config";
import { INK_COLORS } from "@/lib/stampTemplates";
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
  useStepScroll,
} from "@/components/configurator";
import QuantityScroller from "@/components/configurator/QuantityScroller";

const StampEditor = dynamic(() => import("@/components/product/StampEditor"), { ssr: false });

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function StampOrderClient({ defaultSlug, productImages = [] }) {
  const { t, locale } = useTranslation();

  // ── State ──
  const [modelIdx, setModelIdx] = useState(() => {
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

  const [inkColor, setInkColor] = useState("#111111"); // black default
  const [quantity, setQuantity] = useState(1);
  const [stampText, setStampText] = useState("YOUR COMPANY\nAddress Line\nPhone Number");
  const [stampFont, setStampFont] = useState("Helvetica");
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
      name: `Self-Inking Stamp — ${sizeLabel}`,
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
        stampColor: inkColor,
        ...stampConfig,
      },
    };
  }, [effectiveQty, model, sizeLabel, quote.unitCents, widthIn, heightIn, shape, stampText, stampFont, inkColor, stampConfig]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: "Self-Inking Stamp added to cart!",
  });

  // ── Stamp editor callback ──
  const handleStampChange = useCallback((patch) => {
    if (patch.font !== undefined) setStampFont(patch.font);
    setStampConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Steps ──
  const [activeStepId, setActiveStepId] = useState(null);
  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "model",      vis: true },
      { id: "inkColor",   vis: true },
      { id: "quantity",   vis: true },
      { id: "stampText",  vis: true },
      { id: "stampDesign", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, []);

  const stepNum = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);
  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // ── Ink color helpers ──
  const inkColorName = inkColor === "#DC2626" ? "Red" : inkColor === "#2563EB" ? "Blue" : "Black";

  // ── Summary lines ──
  const summaryLines = useMemo(() => [
    { label: "Model", value: sizeLabel },
    { label: "Shape", value: shape === "round" ? "Round" : "Rectangle" },
    { label: "Ink Color", value: inkColorName },
    { label: "Quantity", value: effectiveQty.toLocaleString() },
  ], [sizeLabel, shape, inkColorName, effectiveQty]);

  // ── Render ──
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("marketingPrint.breadcrumb", "Marketing & Print"), href: "/shop/marketing-business-print" },
          { label: "Self-Inking Stamps" },
        ]}
        title="Custom Self-Inking Stamps"
        subtitle="Premium self-inking stamps with built-in ink pad and custom artwork"
        badges={[
          "Built-in ink pad",
          t("marketingPrint.badgeShipping", "Fast shipping"),
          t("marketingPrint.badgeProof", "Free digital proof"),
        ]}
      />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-2 sm:space-y-3 md:col-span-2">

            {/* Product Gallery */}
            {productImages?.length > 0 && (
              <ConfigProductGallery images={productImages} inline />
            )}

            {/* Step 1: Model / Size */}
            <StepCard
              stepNumber={stepNum("model")}
              title="Stamp Model"
              hint="Choose your stamp size"
              summaryText={sizeLabel}
              open={isStepOpen("model")}
              onToggle={() => toggleStep("model")}
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
                    onSelect={() => { setModelIdx(idx); advanceStep("step-model"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step 2: Ink Color */}
            <StepCard
              stepNumber={stepNum("inkColor")}
              title={t("stamp.inkColor", "Ink Color")}
              hint="Select your stamp ink color"
              summaryText={inkColorName}
              open={isStepOpen("inkColor")}
              onToggle={() => toggleStep("inkColor")}
              stepId="step-inkColor"
              alwaysOpen
              compact
            >
              <OptionGrid columns={3} label={t("stamp.inkColor", "Ink Color")}>
                {INK_COLORS.map((c) => (
                  <OptionCard
                    key={c.id}
                    label={t(c.labelKey, c.id.charAt(0).toUpperCase() + c.id.slice(1))}
                    selected={inkColor === c.hex}
                    onSelect={() => { setInkColor(c.hex); advanceStep("step-inkColor"); }}
                    badge={
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: c.hex }}
                      />
                    }
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step 3: Quantity */}
            <StepCard
              stepNumber={stepNum("quantity")}
              title={t("marketingPrint.quantity", "Quantity")}
              hint={t("step.quantity.hint")}
              summaryText={`${effectiveQty} pcs`}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
              compact
            >
              <QuantityScroller
                quantities={STAMP_QUANTITIES}
                selected={quantity}
                onSelect={(q) => { setQuantity(q); advanceStep("step-quantity"); }}
                t={t}
              />
            </StepCard>

            {/* Step 4: Stamp Text */}
            <StepCard
              stepNumber={stepNum("stampText")}
              title={t("stamp.text", "Stamp Text")}
              summaryText={stampText.split("\n")[0]}
              open={isStepOpen("stampText")}
              onToggle={() => toggleStep("stampText")}
              stepId="step-stampText"
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

            {/* Step 5: Design Your Stamp */}
            <StepCard
              stepNumber={stepNum("stampDesign")}
              title={t("stamp.design", "Design Your Stamp")}
              summaryText={`${shape === "round" ? "Round" : "Rectangle"}, ${inkColorName}`}
              open={isStepOpen("stampDesign")}
              onToggle={() => toggleStep("stampDesign")}
              stepId="step-stampDesign"
            >
              <StampEditor
                shape={shape}
                widthIn={widthIn}
                heightIn={heightIn}
                diameterIn={shape === "round" ? widthIn : undefined}
                text={stampText}
                font={stampFont}
                color={inkColor}
                onChange={handleStampChange}
                hideInkColor
              />
            </StepCard>
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
            productName="Self-Inking Stamps"
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
            productName="Self-Inking Stamps"
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
