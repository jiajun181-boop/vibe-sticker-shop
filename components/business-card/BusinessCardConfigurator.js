"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  StepCard,
  OptionCard,
  OptionGrid,
  useStepScroll,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";
import QuantityScroller from "@/components/configurator/QuantityScroller";
import BusinessCardPreview from "@/components/business-card/BusinessCardPreview";
import { getBusinessCardConfig, computeMultiNameFileFees } from "@/lib/business-card-configs";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import DeliveryEstimate from "@/components/configurator/DeliveryEstimate";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SIDES = [
  { id: "single", label: "bc.side.single" },
  { id: "double", label: "bc.side.double" },
];

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BusinessCardConfigurator({ slug, productImages = [] }) {
  const config = getBusinessCardConfig(slug);
  const { t, locale } = useTranslation();

  // ── State ──
  const [sideId, setSideId] = useState(config.defaultSideId || "double");
  const [finishingId, setFinishingId] = useState(
    config.finishingOptions?.[0]?.id || "none"
  );
  const [foilCoverage, setFoilCoverage] = useState(
    config.foilCoverageOptions?.[0]?.id || "logo"
  );
  const [foilSides, setFoilSides] = useState(
    config.foilSidesOptions?.[0]?.id || "front"
  );
  const [layerId, setLayerId] = useState(config.defaultLayerId || "double-layer");
  const [rounded, setRounded] = useState(false);
  const [quantity, setQuantity] = useState(config.quantities[2] || 250);
  const [customQty, setCustomQty] = useState("");
  const [names, setNames] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  const hasMultiName = config.multiName?.enabled && names > 1;
  const extraNames = Math.max(0, names - 1);
  const totalCards = activeQty * names;

  // ── Size label for pricing ──
  const sizeLabel = useMemo(
    () => config.buildSizeLabel({ sideId, layerId, foilCoverage, foilSides, finishingId }),
    [config, sideId, layerId, foilCoverage, foilSides, finishingId]
  );

  // ── Pricing ──
  // API returns price for activeQty (per-name quantity)
  const quote = useConfiguratorPrice({
    slug: config.slug,
    quantity: activeQty,
    widthIn: config.size.w,
    heightIn: config.size.h,
    sizeLabel,
    enabled: activeQty > 0,
  });

  // Fetch foil surcharge rates from settings API (with fallbacks)
  const [foilSettings, setFoilSettings] = useState({ foilFull: 1.30, foilBothSides: 1.50 });
  useEffect(() => {
    if (!config.steps.foilOptions) return;
    fetch("/api/pricing/settings")
      .then((r) => r.ok ? r.json() : {})
      .then((data) => {
        setFoilSettings({
          foilFull: data["pricing.surcharge.foilFull"] ?? 1.30,
          foilBothSides: data["pricing.surcharge.foilBothSides"] ?? 1.50,
        });
      })
      .catch(() => {});
  }, [config.steps.foilOptions]);

  // Build surcharges:
  // - Foil: full coverage +30%, both sides +50% (multiplicative) — rates from settings
  // - Rounded corners: $0.03 × totalCards
  // - Multi-name: (names-1) × oneNamePrice + file fees - $5/name discount
  const foilMultiplier = useMemo(() => {
    if (!config.steps.foilOptions) return 1;
    let m = 1;
    if (foilCoverage === "full") m *= foilSettings.foilFull;
    if (foilSides === "both") m *= foilSettings.foilBothSides;
    return m;
  }, [config.steps.foilOptions, foilCoverage, foilSides, foilSettings]);
  const foilSurcharge = Math.round(quote.rawSubtotalCents * (foilMultiplier - 1));

  const roundedSurcharge =
    rounded && config.roundedSurchargePerCard
      ? config.roundedSurchargePerCard * totalCards
      : 0;

  const multiNamePrintCost = hasMultiName ? extraNames * quote.rawSubtotalCents : 0;
  const multiNameFileFees = hasMultiName
    ? computeMultiNameFileFees(extraNames, config.multiName.fileFees)
    : 0;
  // $5 discount per name (all names including first) when multi-name
  const multiNameDiscount = hasMultiName
    ? names * (config.multiName.discountPerName || 0)
    : 0;

  const totalSurcharge = foilSurcharge + roundedSurcharge + multiNamePrintCost + multiNameFileFees - multiNameDiscount;
  useEffect(() => {
    quote.addSurcharge(totalSurcharge);
  }, [totalSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0;

  // ── Cart ──
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;

    const nameParts = [t(config.name)];
    if (config.steps.sides) nameParts.push(t(`bc.side.${sideId}`));
    if (config.steps.finishing && finishingId !== "none") {
      const opt = config.finishingOptions.find((o) => o.id === finishingId);
      if (opt) nameParts.push(t(opt.label));
    }
    if (config.steps.foilOptions) {
      nameParts.push(t(`bc.foil.coverage.${foilCoverage}`));
      nameParts.push(t(`bc.foil.sides.${foilSides}`));
    }
    if (config.steps.layers) nameParts.push(t(`bc.layer.${layerId}`));
    nameParts.push(config.size.label);
    if (rounded) nameParts.push(t("bc.addon.rounded"));
    if (hasMultiName) nameParts.push(`${names} ${t("bc.names")}`);

    return {
      id: config.slug,
      name: nameParts.join(" — "),
      slug: config.slug,
      price: quote.subtotalCents,
      quantity: 1,
      options: {
        cardType: config.id,
        sides: sideId,
        ...(config.steps.finishing && { finishing: finishingId }),
        ...(config.steps.foilOptions && { foilCoverage, foilSides }),
        ...(config.steps.layers && { layer: layerId }),
        rounded,
        printQuantity: activeQty,
        names,
        totalCards,
        sizeLabel: config.size.label,
        width: config.size.w,
        height: config.size.h,
        fileName: sideId === "double"
          ? (uploadedFiles.front?.name || uploadedFiles.back?.name
            ? { front: uploadedFiles.front?.name || null, back: uploadedFiles.back?.name || null }
            : uploadedFile?.name || null)
          : uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [
    quote.quoteData,
    quote.subtotalCents,
    activeQty,
    config,
    sideId,
    finishingId,
    foilCoverage,
    foilSides,
    layerId,
    rounded,
    names,
    totalCards,
    hasMultiName,
    uploadedFile,
    uploadedFiles,
    t,
  ]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("bc.addedToCart"),
  });

  // ── Summary lines ──
  const summaryLines = [];
  if (config.steps.sides) {
    summaryLines.push({ label: t("bc.sides"), value: t(`bc.side.${sideId}`) });
  } else {
    summaryLines.push({
      label: t("bc.sides"),
      value: t(`bc.side.${config.defaultSideId}`),
    });
  }
  if (config.steps.finishing) {
    const opt = config.finishingOptions.find((o) => o.id === finishingId);
    summaryLines.push({ label: t("bc.finishChoice"), value: opt ? t(opt.label) : "—" });
  }
  if (config.steps.foilOptions) {
    summaryLines.push({ label: t("bc.foil.coverageLabel"), value: t(`bc.foil.coverage.${foilCoverage}`) });
    summaryLines.push({ label: t("bc.foil.sidesLabel"), value: t(`bc.foil.sides.${foilSides}`) });
  }
  if (config.steps.layers) {
    summaryLines.push({ label: t("bc.layers"), value: t(`bc.layer.${layerId}`) });
  }
  summaryLines.push({
    label: t("bc.specs.corners"),
    value: rounded ? t("bc.addon.rounded") : t("bc.cornersStandard"),
  });
  summaryLines.push({ label: t("bc.specs.dimensions"), value: config.size.label });

  if (hasMultiName) {
    summaryLines.push({
      label: t("bc.names"),
      value: t("bc.totalCards", {
        names: String(names),
        qty: activeQty.toLocaleString(),
        total: totalCards.toLocaleString(),
      }),
    });
  } else {
    summaryLines.push({
      label: t("bc.quantity"),
      value: activeQty > 0 ? activeQty.toLocaleString() : "—",
    });
  }

  // Extra rows for price breakdown
  const extraRows = [];
  if (foilSurcharge > 0) {
    const parts = [];
    if (foilCoverage === "full") parts.push(t("bc.foil.coverage.full"));
    if (foilSides === "both") parts.push(t("bc.foil.sides.both"));
    extraRows.push({ label: parts.join(" + "), value: `+ ${formatCad(foilSurcharge)}` });
  }
  if (roundedSurcharge > 0) {
    extraRows.push({ label: t("bc.addon.rounded"), value: `+ ${formatCad(roundedSurcharge)}` });
  }
  if (multiNameDiscount > 0) {
    extraRows.push({ label: t("bc.multiName.discount"), value: `- ${formatCad(multiNameDiscount)}` });
  }
  if (multiNameFileFees > 0) {
    extraRows.push({ label: t("bc.multiName.fileFee"), value: `+ ${formatCad(multiNameFileFees)}` });
  }

  // ── Accordion state ──
  const [activeStepId, setActiveStepId] = useState(null);
  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "sides", vis: !!config.steps.sides },
      { id: "finishing", vis: !!config.steps.finishing && !!config.finishingOptions },
      { id: "foilCoverage", vis: !!config.steps.foilOptions },
      { id: "foilSides", vis: !!config.steps.foilOptions },
      { id: "layers", vis: !!config.steps.layers && !!config.layerOptions },
      { id: "addons", vis: !!config.steps.addons },
      { id: "quantity", vis: true },
      { id: "names", vis: !!config.multiName?.enabled },
      { id: "artwork", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [config]);
  const stepNumFn = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);
  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  const sidesSummary = t(`bc.side.${sideId}`);
  const finishingSummaryText = config.finishingOptions?.find((o) => o.id === finishingId) ? t(config.finishingOptions.find((o) => o.id === finishingId).label) : "—";
  const foilCoverageSummary = t(`bc.foil.coverage.${foilCoverage}`);
  const foilSidesSummary = t(`bc.foil.sides.${foilSides}`);
  const layersSummary = t(`bc.layer.${layerId}`);
  const addonsSummary = rounded ? t("bc.addon.rounded") : "None";
  const quantitySummaryText = `${activeQty.toLocaleString()} cards`;
  const namesSummary = names > 1 ? `${names} names` : "1 name";
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("bc.breadcrumb"), href: "/shop/marketing-business-print/business-cards" },
          { label: t(config.name) },
        ]}
        title={t(config.name) + " " + t("bc.breadcrumb")}
        subtitle={t(config.tagline)}
        badges={[t("bc.badge.fullColor"), t("bc.badge.shipping"), t("bc.badge.proof")]}
      />

      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN — Steps */}
          <div className="space-y-2 sm:space-y-3 lg:col-span-2">

            {/* Product Gallery */}
            {productImages?.length > 0 && (
              <ConfigProductGallery images={productImages} inline />
            )}

            {/* SIDES STEP */}
            {config.steps.sides && (
              <StepCard
                stepNumber={stepNumFn("sides")}
                title={t("bc.sides")}
                hint="Single or double sided printing"
                summaryText={sidesSummary}
                open={isStepOpen("sides")}
                onToggle={() => toggleStep("sides")}
                stepId="step-sides"
                alwaysOpen
                compact
              >
                <OptionGrid columns={2} label={t("bc.sides")}>
                  {SIDES.map((s) => (
                    <OptionCard
                      key={s.id}
                      label={t(s.label)}
                      selected={sideId === s.id}
                      onSelect={() => {
                        setSideId(s.id);
                        advanceStep("step-sides");
                      }}
                    />
                  ))}
                </OptionGrid>
              </StepCard>
            )}

            {/* FINISHING STEP (Classic only) */}
            {config.steps.finishing && config.finishingOptions && (
              <StepCard
                stepNumber={stepNumFn("finishing")}
                title={t("bc.finishChoice")}
                hint="Choose your card finish"
                summaryText={finishingSummaryText}
                open={isStepOpen("finishing")}
                onToggle={() => toggleStep("finishing")}
                stepId="step-finishing"
                alwaysOpen
                compact
              >
                <OptionGrid columns={4} label={t("bc.finishChoice")}>
                  {config.finishingOptions.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      label={t(opt.label)}
                      selected={finishingId === opt.id}
                      onSelect={() => {
                        setFinishingId(opt.id);
                        advanceStep("step-finishing");
                      }}
                    />
                  ))}
                </OptionGrid>
              </StepCard>
            )}

            {/* FOIL OPTIONS STEPS (Gold Foil only) */}
            {config.steps.foilOptions && (
              <>
                <StepCard
                  stepNumber={stepNumFn("foilCoverage")}
                  title={t("bc.foil.coverageLabel")}
                  hint="How much foil coverage?"
                  summaryText={foilCoverageSummary}
                  open={isStepOpen("foilCoverage")}
                  onToggle={() => toggleStep("foilCoverage")}
                  stepId="step-foilCoverage"
                >
                  <OptionGrid columns={2} label={t("bc.foil.coverageLabel")}>
                    {config.foilCoverageOptions.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        label={t(opt.label)}
                        selected={foilCoverage === opt.id}
                        onSelect={() => {
                          setFoilCoverage(opt.id);
                          advanceStep("step-foilCoverage");
                        }}
                      />
                    ))}
                  </OptionGrid>
                </StepCard>

                <StepCard
                  stepNumber={stepNumFn("foilSides")}
                  title={t("bc.foil.sidesLabel")}
                  hint="Foil on which sides?"
                  summaryText={foilSidesSummary}
                  open={isStepOpen("foilSides")}
                  onToggle={() => toggleStep("foilSides")}
                  stepId="step-foilSides"
                >
                  <OptionGrid columns={2} label={t("bc.foil.sidesLabel")}>
                    {config.foilSidesOptions.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        label={t(opt.label)}
                        selected={foilSides === opt.id}
                        onSelect={() => {
                          setFoilSides(opt.id);
                          advanceStep("step-foilSides");
                        }}
                      />
                    ))}
                  </OptionGrid>
                </StepCard>
              </>
            )}

            {/* LAYERS STEP (Thick only) */}
            {config.steps.layers && config.layerOptions && (
              <StepCard
                stepNumber={stepNumFn("layers")}
                title={t("bc.layers")}
                hint="Card thickness"
                summaryText={layersSummary}
                open={isStepOpen("layers")}
                onToggle={() => toggleStep("layers")}
                stepId="step-layers"
              >
                <OptionGrid columns={2} label={t("bc.layers")}>
                  {config.layerOptions.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      label={t(opt.label)}
                      selected={layerId === opt.id}
                      onSelect={() => {
                        setLayerId(opt.id);
                        advanceStep("step-layers");
                      }}
                    />
                  ))}
                </OptionGrid>
              </StepCard>
            )}

            {/* ADDONS STEP (Rounded Corners) */}
            {config.steps.addons && (
              <StepCard
                stepNumber={stepNumFn("addons")}
                title={t("bc.addons")}
                hint="Optional extras"
                summaryText={addonsSummary}
                open={isStepOpen("addons")}
                onToggle={() => toggleStep("addons")}
                stepId="step-addons"
              >
                <label className="flex items-center gap-3 cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-4 transition-colors hover:border-gray-400">
                  <input
                    type="checkbox"
                    checked={rounded}
                    onChange={(e) => setRounded(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{t("bc.addon.rounded")}</span>
                  <span className="ml-auto text-[11px] font-bold text-amber-600">+$0.03/ea</span>
                </label>
              </StepCard>
            )}

            {/* QUANTITY STEP */}
            <StepCard
              stepNumber={stepNumFn("quantity")}
              title={t("bc.quantity")}
              hint="More you order, more you save"
              summaryText={quantitySummaryText}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
              compact
            >
              <QuantityScroller
                quantities={config.quantities}
                selected={quantity}
                onSelect={(q) => {
                  setQuantity(q);
                  advanceStep("step-quantity");
                }}
                customQty={customQty}
                onCustomChange={setCustomQty}
                t={t}
                min={25}
                placeholder="e.g. 300"
              />
            </StepCard>

            {/* MULTI-NAME STEP */}
            {config.multiName?.enabled && (
              <StepCard
                stepNumber={stepNumFn("names")}
                title={t("bc.names")}
                hint={t("bc.namesHint")}
                summaryText={namesSummary}
                open={isStepOpen("names")}
                onToggle={() => toggleStep("names")}
                stepId="step-names"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl border-2 border-gray-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setNames((n) => Math.max(1, n - 1))}
                      className="px-4 py-3 text-lg font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      &minus;
                    </button>
                    <span className="min-w-[3rem] text-center text-xl font-black text-gray-900">
                      {names}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNames((n) => Math.min(config.multiName.maxNames, n + 1))}
                      className="px-4 py-3 text-lg font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {names > 1 && activeQty > 0 && (
                      <span className="font-medium text-gray-700">
                        {t("bc.totalCards", {
                          names: String(names),
                          qty: activeQty.toLocaleString(),
                          total: totalCards.toLocaleString(),
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* File fee info */}
                {names > 1 && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                    <p className="text-xs text-amber-800">
                      {t("bc.multiName.feeExplain", { fee: formatCad(multiNameFileFees) })}
                    </p>
                  </div>
                )}
              </StepCard>
            )}

            {/* ARTWORK UPLOAD STEP */}
            <StepCard
              stepNumber={stepNumFn("artwork")}
              title={t("bc.artwork")}
              hint={sideId === "double" ? (t("bc.artworkHintDouble") || "Upload front & back files separately, or send later") : "Upload now or send later — it's optional"}
              summaryText={artworkSummary}
              optional
              open={isStepOpen("artwork")}
              onToggle={() => toggleStep("artwork")}
              stepId="step-artwork"
            >
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                fileSlots={sideId === "double" ? [
                  { key: "front", label: t("bc.artwork.front") || "Front" },
                  { key: "back", label: t("bc.artwork.back") || "Back" },
                ] : undefined}
                uploadedFiles={uploadedFiles}
                onFileUploaded={(file, slotKey) => setUploadedFiles((prev) => ({ ...prev, [slotKey]: file }))}
                onFileRemove={(slotKey) => setUploadedFiles((prev) => { const next = { ...prev }; delete next[slotKey]; return next; })}
                t={t}
              />
            </StepCard>
          </div>

          {/* RIGHT COLUMN — Sticky Price Summary */}
          <PricingSidebar
            previewSlot={
              <BusinessCardPreview
                cardType={config.id}
                sides={sideId}
                rounded={rounded}
                imageUrl={uploadedFile?.url || null}
              />
            }
            summaryLines={summaryLines}
            quoteLoading={quote.quoteLoading}
            quoteError={quote.quoteError}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            taxCents={quote.taxCents}
            totalCents={quote.totalCents}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            extraRows={extraRows}
            badges={[t("bc.badge.fullColor"), t("bc.badge.shipping"), t("bc.badge.proof")]}
            t={t}
            categorySlug="marketing-business-print"
            locale={locale}
            productSlug={slug}
            onRetryPrice={quote.retry}
          />
        </div>
      </div>

      {/* Inline mobile delivery estimate */}
      {!!quote.quoteData && (
        <div className="mx-auto max-w-4xl px-4 pb-4 md:hidden">
          <DeliveryEstimate categorySlug="marketing-business-print" t={t} locale={locale} />
        </div>
      )}

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        summaryText={
          quote.quoteData
            ? hasMultiName
              ? `${names} × ${activeQty.toLocaleString()} = ${totalCards.toLocaleString()} cards`
              : `${formatCad(quote.unitCents)}/ea × ${activeQty.toLocaleString()}`
            : null
        }
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        categorySlug="marketing-business-print"
        locale={locale}
        onRetryPrice={quote.retry}
      />

      {/* FAQ Section */}
      {(() => {
        const faqItems = getConfiguratorFaqs(slug);
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
