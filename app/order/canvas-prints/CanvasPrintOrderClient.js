"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import CanvasPreview from "@/components/canvas/CanvasPreview";
import ImageCropper from "@/components/canvas/ImageCropper";
import QualityBadges from "@/components/canvas/QualityBadges";
import {
  StepCard,
  OptionCard,
  OptionGrid,
  useStepScroll,
  ConfigHero,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import DeliveryEstimate from "@/components/configurator/DeliveryEstimate";

// ─── Canvas Print Configuration ───

const SIZES = [
  { id: "8x10", label: '8" \u00d7 10"', tag: "Small", w: 8, h: 10 },
  { id: "11x14", label: '11" \u00d7 14"', w: 11, h: 14 },
  { id: "16x20", label: '16" \u00d7 20"', w: 16, h: 20 },
  { id: "18x24", label: '18" \u00d7 24"', w: 18, h: 24 },
  { id: "24x36", label: '24" \u00d7 36"', w: 24, h: 36 },
];

const WRAP_DEPTHS = [
  { id: "0.75in", label: "Standard (0.75\")", surcharge: 0, icon: "standard" },
  { id: "1.5in", label: "Gallery (1.5\")", surcharge: 300, icon: "gallery" },
];

const EDGE_STYLES = [
  { id: "wrapped-image", label: "Wrapped Image", surcharge: 0 },
  { id: "mirror-wrap", label: "Mirror Wrap", surcharge: 0 },
  { id: "black-edges", label: "Black Edges", surcharge: 0 },
  { id: "white-edges", label: "White Edges", surcharge: 0 },
];

const COATINGS = [
  { id: "satin", label: "Satin", surcharge: 0 },
  { id: "gloss", label: "Gloss", surcharge: 100 },
  { id: "matte", label: "Matte", surcharge: 100 },
];

const QUANTITIES = [1, 2, 5, 10];

// Map edge style IDs to CanvasPreview edgeTreatment values
const EDGE_TO_TREATMENT = {
  "wrapped-image": "image-wrap",
  "mirror-wrap": "mirror",
  "black-edges": "color",
  "white-edges": "white",
};

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Icons ───

function WrapIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "standard":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="16" rx="1" />
          <path d="M5 4l-2 2v12l2 2" opacity="0.3" />
          <path strokeLinecap="round" d="M9 9h6M9 13h4" />
        </svg>
      );
    case "gallery":
      return (
        <svg {...common}>
          <rect x="6" y="4" width="12" height="16" rx="1" />
          <path d="M6 4l-3 3v10l3 3" opacity="0.3" />
          <path d="M18 4l3 3v10l-3 3" opacity="0.3" />
          <path strokeLinecap="round" d="M10 9h4M10 13h3" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function CanvasPrintOrderClient() {
  const { t, locale } = useTranslation();

  // ── State ──
  const [sizeIdx, setSizeIdx] = useState(2); // 16×20 default
  const [wrapId, setWrapId] = useState("0.75in");
  const [edgeId, setEdgeId] = useState("wrapped-image");
  const [coatingId, setCoatingId] = useState("satin");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artworkIntent, setArtworkIntent] = useState(null);
  const [cropData, setCropData] = useState(null);

  const size = SIZES[sizeIdx];

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  const slug = wrapId === "1.5in" ? "canvas-gallery-wrap" : "canvas-standard";

  // ── Surcharges ──
  const wrapSurcharge = useMemo(
    () => (WRAP_DEPTHS.find((w) => w.id === wrapId)?.surcharge ?? 0) * activeQty,
    [wrapId, activeQty]
  );
  const coatingSurcharge = useMemo(
    () => (COATINGS.find((c) => c.id === coatingId)?.surcharge ?? 0) * activeQty,
    [coatingId, activeQty]
  );

  // ── Pricing (via shared hook) ──
  const quoteExtra = useMemo(
    () => ({
      edge: EDGE_TO_TREATMENT[edgeId] || edgeId,
      coating: coatingId,
      barDepth: wrapId === "1.5in" ? 1.5 : 0.75,
    }),
    [edgeId, coatingId, wrapId]
  );

  const quote = useConfiguratorPrice({
    slug,
    quantity: activeQty,
    widthIn: size.w,
    heightIn: size.h,
    options: quoteExtra,
    enabled: activeQty > 0,
  });

  // Add surcharges
  useEffect(() => {
    quote.addSurcharge(wrapSurcharge + coatingSurcharge);
  }, [wrapSurcharge, coatingSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart =
    quote.quoteData && !quote.quoteLoading && activeQty > 0;

  const disabledReason = !canAddToCart
    ? quote.quoteLoading
      ? "Calculating price\u2026"
      : !quote.quoteData
        ? "Select your options for pricing"
        : "Complete all options to continue"
    : null;

  // ── Cart (via shared hook) ──
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;

    const wrapObj = WRAP_DEPTHS.find((w) => w.id === wrapId);
    const edgeObj = EDGE_STYLES.find((e) => e.id === edgeId);
    const coatingObj = COATINGS.find((c) => c.id === coatingId);
    const orientation = size.w > size.h ? "landscape" : size.w < size.h ? "portrait" : "square";

    return {
      id: slug,
      name: `${t("cv.title")} \u2014 ${size.label} \u2014 ${wrapObj?.label || wrapId}`,
      slug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        orientation,
        wrapDepth: wrapId,
        wrapDepthLabel: wrapObj?.label || wrapId,
        edgeStyle: edgeId,
        edgeStyleLabel: edgeObj?.label || edgeId,
        coating: coatingId,
        coatingLabel: coatingObj?.label || coatingId,
        barDepth: wrapId === "1.5in" ? 1.5 : 0.75,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
        cropData: cropData ? JSON.stringify(cropData) : null,
      },
      forceNewLine: true,
    };
  }, [
    quote.quoteData,
    quote.subtotalCents,
    activeQty,
    slug,
    size,
    wrapId,
    edgeId,
    coatingId,
    uploadedFile,
    cropData,
    t,
  ]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("cv.addedToCart"),
  });

  // ── Summary lines ──
  const summaryLines = useMemo(() => {
    const wrapObj = WRAP_DEPTHS.find((w) => w.id === wrapId);
    const edgeObj = EDGE_STYLES.find((e) => e.id === edgeId);
    const coatingObj = COATINGS.find((c) => c.id === coatingId);
    return [
      { label: t("cv.size"), value: size.label },
      { label: t("cv.wrap.label"), value: wrapObj?.label || t(`cv.wrap.${wrapId}`) },
      { label: t("cv.edge.label"), value: edgeObj?.label || t(`cv.edge.${edgeId}`) },
      { label: t("cv.coating.label"), value: coatingObj?.label || t(`cv.coating.${coatingId}`) },
      { label: t("cv.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "\u2014" },
      { label: "Artwork", value: uploadedFile ? "Uploaded" : "Not uploaded" },
      ...(uploadedFile ? [{ label: "Crop", value: cropData ? "Positioned" : "Default" }] : []),
    ];
  }, [size, wrapId, edgeId, coatingId, activeQty, uploadedFile, cropData, t]);

  // Extra pricing rows
  const extraRows = useMemo(() => {
    const rows = [];
    if (wrapSurcharge > 0) {
      rows.push({
        label: t(`cv.wrap.${wrapId}`),
        value: `+ $${(wrapSurcharge / 100).toFixed(2)}`,
      });
    }
    if (coatingSurcharge > 0) {
      rows.push({
        label: t(`cv.coating.${coatingId}`),
        value: `+ $${(coatingSurcharge / 100).toFixed(2)}`,
      });
    }
    return rows;
  }, [wrapSurcharge, coatingSurcharge, wrapId, coatingId, t]);

  // ── Accordion state ──
  const [activeStepId, setActiveStepId] = useState("step-size");

  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "size", vis: true },
      { id: "wrap", vis: true },
      { id: "edge", vis: true },
      { id: "coating", vis: true },
      { id: "quantity", vis: true },
      { id: "artwork", vis: true },
      { id: "imageCrop", vis: !!uploadedFile },
      { id: "quality", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [uploadedFile]);

  const stepNum = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);

  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // ── Preview slot ──
  const previewSlot = useMemo(() => (
    <div className="flex flex-col items-center">
      <CanvasPreview
        imageUrl={uploadedFile?.url || null}
        widthIn={size.w}
        heightIn={size.h}
        barDepth={wrapId === "1.5in" ? 1.5 : 0.75}
        edgeTreatment={EDGE_TO_TREATMENT[edgeId] || "mirror"}
        frameColor={null}
      />
      {!uploadedFile && (
        <p className="mt-2 text-center text-[10px] text-gray-400">Upload artwork to see live preview</p>
      )}
    </div>
  ), [uploadedFile, size, wrapId, edgeId]);

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("cv.breadcrumb"), href: "/shop/signs-banners/canvas-prints" },
          { label: t("cv.order") },
        ]}
        title={t("cv.title")}
        subtitle={t("cv.subtitle", "Premium canvas prints on gallery-grade material")}
        badges={[t("cv.badge.gallery"), t("cv.badge.shipping")]}
      />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-3 lg:col-span-2">

            {/* Step: Size */}
            <StepCard
              stepNumber={stepNum("size")}
              title={t("cv.size")}
              hint="Choose your canvas size"
              summaryText={size.label}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
            >
              <OptionGrid columns={3}>
                {SIZES.map((s, i) => (
                  <OptionCard
                    key={s.id}
                    label={s.label}
                    description={s.tag || null}
                    selected={sizeIdx === i}
                    onSelect={() => { setSizeIdx(i); advanceStep("step-size"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Wrap Depth */}
            <StepCard
              stepNumber={stepNum("wrap")}
              title={t("cv.wrap.label")}
              hint="Standard or gallery depth stretcher bars"
              summaryText={WRAP_DEPTHS.find((w) => w.id === wrapId)?.label || wrapId}
              open={isStepOpen("wrap")}
              onToggle={() => toggleStep("wrap")}
              stepId="step-wrap"
            >
              <OptionGrid columns={2}>
                {WRAP_DEPTHS.map((w) => (
                  <OptionCard
                    key={w.id}
                    label={w.label}
                    selected={wrapId === w.id}
                    onSelect={() => { setWrapId(w.id); advanceStep("step-wrap"); }}
                    icon={<WrapIcon type={w.icon} className="h-7 w-7" />}
                    badge={w.surcharge > 0 ? (
                      <span className="text-[9px] font-bold text-amber-600">
                        +{formatCad(w.surcharge)}/ea
                      </span>
                    ) : null}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Edge Style */}
            <StepCard
              stepNumber={stepNum("edge")}
              title={t("cv.edge.label")}
              hint="How the image wraps around the sides"
              summaryText={EDGE_STYLES.find((e) => e.id === edgeId)?.label || edgeId}
              open={isStepOpen("edge")}
              onToggle={() => toggleStep("edge")}
              stepId="step-edge"
            >
              <OptionGrid columns={2}>
                {EDGE_STYLES.map((e) => (
                  <OptionCard
                    key={e.id}
                    label={e.label}
                    selected={edgeId === e.id}
                    onSelect={() => { setEdgeId(e.id); advanceStep("step-edge"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Coating */}
            <StepCard
              stepNumber={stepNum("coating")}
              title={t("cv.coating.label")}
              hint="Protective finish for your canvas"
              summaryText={COATINGS.find((c) => c.id === coatingId)?.label || coatingId}
              open={isStepOpen("coating")}
              onToggle={() => toggleStep("coating")}
              stepId="step-coating"
            >
              <OptionGrid columns={3}>
                {COATINGS.map((c) => (
                  <OptionCard
                    key={c.id}
                    label={c.label}
                    selected={coatingId === c.id}
                    onSelect={() => { setCoatingId(c.id); advanceStep("step-coating"); }}
                    badge={c.surcharge > 0 ? (
                      <span className="text-[9px] font-bold text-amber-600">
                        +{formatCad(c.surcharge)}/ea
                      </span>
                    ) : null}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Quantity */}
            <StepCard
              stepNumber={stepNum("quantity")}
              title={t("cv.quantity")}
              hint="How many prints do you need?"
              summaryText={`${activeQty.toLocaleString()} pcs`}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
            >
              <div className="flex flex-wrap gap-2">
                {QUANTITIES.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setQuantity(q);
                        setCustomQty("");
                        advanceStep("step-quantity");
                      }}
                      className={`flex-shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-150 ${
                        isActive
                          ? "border-teal-500 bg-teal-50 text-gray-900"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">
                  {t("cv.customQty")}:
                </label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
            </StepCard>

            {/* Step: Artwork Upload */}
            <StepCard
              stepNumber={stepNum("artwork")}
              title={t("cv.artwork")}
              hint="Upload your image for a live preview"
              summaryText={uploadedFile?.name || "Not uploaded yet"}
              optional
              open={isStepOpen("artwork")}
              onToggle={() => toggleStep("artwork")}
              stepId="step-artwork"
            >
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => { setUploadedFile(null); setCropData(null); }}
                t={t}
              />
            </StepCard>

            {/* Step: Image Positioning (shown when image uploaded) */}
            {uploadedFile && (
              <StepCard
                stepNumber={stepNum("imageCrop")}
                title="Image Position"
                hint="Drag to reposition, scroll to zoom"
                summaryText={cropData ? "Positioned" : "Default"}
                optional
                open={isStepOpen("imageCrop")}
                onToggle={() => toggleStep("imageCrop")}
                stepId="step-imageCrop"
              >
                <ImageCropper
                  imageUrl={uploadedFile.url}
                  aspectRatio={size.w / size.h}
                  onChange={setCropData}
                />
              </StepCard>
            )}

            {/* Step: Quality Badges */}
            <StepCard
              stepNumber={stepNum("quality")}
              title="Quality Promise"
              hint="Gallery-grade materials and craftsmanship"
              summaryText="Premium quality"
              open={isStepOpen("quality")}
              onToggle={() => toggleStep("quality")}
              stepId="step-quality"
            >
              <QualityBadges />
            </StepCard>
          </div>

          {/* RIGHT: Pricing Sidebar */}
          <PricingSidebar
            previewSlot={previewSlot}
            summaryLines={summaryLines}
            quoteLoading={quote.quoteLoading}
            quoteError={quote.quoteError}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            taxCents={quote.taxCents}
            totalCents={quote.subtotalCents}
            quantity={activeQty}
            canAddToCart={canAddToCart}
            disabledReason={disabledReason}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            extraRows={extraRows}
            badges={[t("cv.badge.gallery"), t("cv.badge.shipping")]}
            t={t}
            productName={t("cv.title")}
            categorySlug="canvas-prints"
            locale={locale}
            productSlug={slug}
            onRetryPrice={quote.retry}
            artworkMode="upload-optional"
            hasArtwork={!!uploadedFile}
            artworkIntent={artworkIntent}
            onArtworkIntentChange={setArtworkIntent}
          />
        </div>
      </div>

      {/* FAQ */}
      {(() => {
        const faqItems = getConfiguratorFaqs("canvas-prints");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl pb-16 pt-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

      {/* Inline mobile delivery estimate */}
      {!!quote.quoteData && (
        <div className="mx-auto max-w-4xl px-4 pb-4 md:hidden">
          <DeliveryEstimate categorySlug="canvas-prints" t={t} locale={locale} />
        </div>
      )}

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        quantity={activeQty}
        summaryText={
          quote.quoteData
            ? `${formatCad(quote.unitCents)}/ea \u00d7 ${activeQty}`
            : null
        }
        canAddToCart={canAddToCart}
        disabledReason={disabledReason}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        productName={t("cv.title")}
        summaryLines={summaryLines}
        unitCents={quote.unitCents}
        subtotalCents={quote.subtotalCents}
        categorySlug="canvas-prints"
        locale={locale}
        onRetryPrice={quote.retry}
        artworkMode="upload-optional"
        hasArtwork={!!uploadedFile}
        artworkIntent={artworkIntent}
        onArtworkIntentChange={setArtworkIntent}
      />
    </main>
  );
}
