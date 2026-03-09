"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  BANNER_TYPES,
  BANNER_TYPE_GROUPS,
  FINISHING_OPTIONS,
  getBannerType,
} from "@/lib/banner-order-config";
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
  CustomDimensions,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import DeliveryEstimate from "@/components/configurator/DeliveryEstimate";
import { MATERIAL_META } from "@/components/configurator/MaterialSwatchGrid";

const INCH_TO_CM = 2.54;

const PURCHASE_TYPES = [
  { id: "full-kit", label: "banner.purchaseType.fullKit", multiplier: 1.0 },
  { id: "print-only", label: "banner.purchaseType.printOnly", multiplier: 0.6 },
  { id: "hardware-only", label: "banner.purchaseType.hardwareOnly", multiplier: 0.4 },
];

export default function BannerOrderClient({ defaultType, productImages }) {
  const { t, locale } = useTranslation();

  // --- State ---
  const [typeId, setTypeId] = useState(defaultType || "vinyl-banner");
  const bannerType = useMemo(() => getBannerType(typeId), [typeId]);

  const [purchaseType, setPurchaseType] = useState("full-kit");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(bannerType.materials[0].id);
  const [finishings, setFinishings] = useState(bannerType.defaultFinishings);
  const [quantity, setQuantity] = useState(bannerType.quantities[0] ?? 1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artworkIntent, setArtworkIntent] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);

  const isHardwareType = !!bannerType.includesHardware;

  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return bannerType.sizes[sizeIdx]?.w ?? 24;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, bannerType, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return bannerType.sizes[sizeIdx]?.h ?? 48;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, bannerType, customH, unit]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Reset when type changes
  useEffect(() => {
    setPurchaseType("full-kit");
    setSizeIdx(0);
    setCustomW("");
    setCustomH("");
    setMaterialId(bannerType.materials[0].id);
    setFinishings(bannerType.defaultFinishings);
    setQuantity(bannerType.quantities[0] ?? 1);
    setCustomQty("");
    setDimErrors([]);
  }, [typeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate dimensions
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
    const errs = [];
    if (widthIn < bannerType.minIn) errs.push(`Width must be at least ${bannerType.minIn}"`);
    if (heightIn < bannerType.minIn) errs.push(`Height must be at least ${bannerType.minIn}"`);
    if (widthIn > bannerType.maxW) errs.push(`Width cannot exceed ${bannerType.maxW}"`);
    if (heightIn > bannerType.maxH) errs.push(`Height cannot exceed ${bannerType.maxH}"`);
    setDimErrors(errs);
  }, [widthIn, heightIn, bannerType]);

  // Finishing surcharges
  const finishingSurcharge = useMemo(() => {
    return finishings.reduce((sum, fId) => {
      const opt = FINISHING_OPTIONS[fId];
      return sum + (opt?.surcharge ?? 0) * activeQty;
    }, 0);
  }, [finishings, activeQty]);

  // Quote
  const quote = useConfiguratorPrice({
    slug: bannerType.defaultSlug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    enabled: widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  // Purchase type discount (print-only = -40%, hardware-only = -60%)
  const purchaseDiscount = useMemo(() => {
    if (!isHardwareType || purchaseType === "full-kit") return 0;
    const mult = PURCHASE_TYPES.find((p) => p.id === purchaseType)?.multiplier ?? 1;
    return Math.round(quote.rawSubtotalCents * (mult - 1));
  }, [isHardwareType, purchaseType, quote.rawSubtotalCents]);

  // Add finishing surcharges + purchase type discount
  useEffect(() => {
    quote.addSurcharge(finishingSurcharge + purchaseDiscount);
  }, [finishingSurcharge, purchaseDiscount]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  const disabledReason = !canAddToCart
    ? quote.quoteLoading ? "Calculating price..."
    : !quote.quoteData ? "Select your options for pricing"
    : "Complete all options to continue"
    : null;

  // Cart
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
      : bannerType.sizes[sizeIdx]?.label;
    return {
      id: bannerType.defaultSlug,
      name: `${t(`banner.type.${typeId}`)} — ${sizeLabel}`,
      slug: bannerType.defaultSlug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        bannerType: typeId,
        ...(isHardwareType && { purchaseType }),
        width: widthIn,
        height: heightIn,
        sizeLabel,
        material: materialId,
        finishing: finishings.join(", ") || "none",
        finishingList: JSON.stringify(finishings),
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, typeId, widthIn, heightIn, isCustomSize, sizeIdx, bannerType, materialId, finishings, uploadedFile, t, isHardwareType, purchaseType]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("banner.addedToCart"),
  });

  // Toggle finishing
  function toggleFinishing(fId) {
    setFinishings((prev) =>
      prev.includes(fId) ? prev.filter((f) => f !== fId) : [...prev, fId]
    );
  }

  // --- Accordion state ---
  const [activeStepId, setActiveStepId] = useState("step-type");
  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "type", vis: true },
      { id: "purchaseType", vis: isHardwareType },
      { id: "size", vis: true },
      { id: "material", vis: bannerType.materials.length > 1 },
      { id: "finishing", vis: bannerType.finishings.length > 0 },
      { id: "quantity", vis: true },
      { id: "artwork", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [isHardwareType, bannerType.materials.length, bannerType.finishings.length]);
  const stepNumFn = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);
  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  const typeSummary = t(`banner.type.${typeId}`);
  const purchaseTypeSummary = t(PURCHASE_TYPES.find((p) => p.id === purchaseType)?.label || purchaseType);
  const sizeSummary = isCustomSize
    ? widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "—"
    : bannerType.sizes[sizeIdx]?.label || "—";
  const materialSummary = bannerType.materials.find((m) => m.id === materialId)?.label || materialId;
  const finishingSummary = finishings.length > 0 ? finishings.map((f) => FINISHING_OPTIONS[f]?.label || f).join(", ") : "None";
  const quantitySummary = `${activeQty.toLocaleString()} pcs`;
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

  // Summary lines
  const summaryLines = [
    { label: t("banner.type.label"), value: t(`banner.type.${typeId}`) },
  ];
  if (isHardwareType) {
    summaryLines.push({
      label: t("banner.purchaseType"),
      value: t(PURCHASE_TYPES.find((p) => p.id === purchaseType)?.label || purchaseType),
    });
  }
  summaryLines.push(
    {
      label: t("banner.size"),
      value: isCustomSize
        ? widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "—"
        : bannerType.sizes[sizeIdx]?.label || "—",
    },
    { label: t("banner.material"), value: bannerType.materials.find((m) => m.id === materialId)?.label || materialId },
    { label: t("banner.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
  );
  if (finishings.length > 0) {
    summaryLines.push({
      label: t("banner.finishing"),
      value: finishings.map((f) => FINISHING_OPTIONS[f]?.label || f).join(", "),
    });
  }

  const extraRows = [];
  if (purchaseDiscount !== 0) {
    const pctOff = purchaseType === "print-only" ? "-40%" : "-60%";
    extraRows.push({ label: t(PURCHASE_TYPES.find((p) => p.id === purchaseType)?.label || purchaseType), value: pctOff });
  }
  if (finishingSurcharge > 0) {
    extraRows.push({ label: t("banner.finishingSurcharge"), value: `+ $${(finishingSurcharge / 100).toFixed(2)}` });
  }

  const formatCad = (cents) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("banner.breadcrumb"), href: "/shop/banners-displays" },
          { label: t("banner.order") },
        ]}
        title={t(`banner.type.${typeId}`)}
        subtitle={t("banner.subtitle")}
        badges={[t("banner.badgeWeatherproof"), t("banner.badgeShipping"), t("banner.badgeProof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-3 lg:col-span-2">

            {/* Step: Banner Type (grouped) */}
            <StepCard
              stepNumber={stepNumFn("type")}
              title={t("banner.type.label")}
              hint={t("banner.type.subtitle")}
              summaryText={typeSummary}
              open={isStepOpen("type")}
              onToggle={() => toggleStep("type")}
              stepId="step-type"
            >
              <div className="space-y-5">
                {BANNER_TYPE_GROUPS.map((grp) => {
                  const groupItems = BANNER_TYPES.filter((bt) => bt.group === grp.id);
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={grp.id}>
                      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">{t(`banner.group.${grp.id}`) || grp.label}</h3>
                      <OptionGrid columns={4} label={grp.label}>
                        {groupItems.map((bt) => (
                          <OptionCard
                            key={bt.id}
                            label={t(`banner.type.${bt.id}`)}
                            selected={typeId === bt.id}
                            onSelect={() => { setTypeId(bt.id); advanceStep("step-type"); }}
                            badge={bt.includesHardware ? (
                              <span className={`text-[10px] font-bold ${typeId === bt.id ? "text-teal-700" : "text-emerald-600"}`}>
                                {t("banner.includesHardware")}
                              </span>
                            ) : undefined}
                          />
                        ))}
                      </OptionGrid>
                    </div>
                  );
                })}
              </div>
            </StepCard>

            {/* Step: Purchase Type (hardware products only) */}
            <StepCard
              stepNumber={stepNumFn("purchaseType")}
              title={t("banner.purchaseType")}
              hint={t("banner.purchaseType.subtitle")}
              summaryText={purchaseTypeSummary}
              visible={isHardwareType}
              open={isStepOpen("purchaseType")}
              onToggle={() => toggleStep("purchaseType")}
              stepId="step-purchaseType"
            >
              <OptionGrid columns={3} label={t("banner.purchaseType")}>
                {PURCHASE_TYPES.map((pt) => {
                  const isActive = purchaseType === pt.id;
                  return (
                    <OptionCard
                      key={pt.id}
                      label={t(pt.label)}
                      selected={isActive}
                      onSelect={() => { setPurchaseType(pt.id); advanceStep("step-purchaseType"); }}
                      description={pt.multiplier < 1
                        ? t("banner.purchaseType.lessPercent", { pct: String(Math.round((1 - pt.multiplier) * 100)) })
                        : undefined
                      }
                    />
                  );
                })}
              </OptionGrid>
            </StepCard>

            {/* Step: Size */}
            <StepCard
              stepNumber={stepNumFn("size")}
              title={t("banner.size")}
              hint={t("banner.sizeSubtitle")}
              summaryText={sizeSummary}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
            >
              <OptionGrid columns={4} label={t("banner.size")}>
                {bannerType.sizes.map((s, i) => (
                  <OptionCard
                    key={i}
                    label={s.label}
                    selected={sizeIdx === i}
                    onSelect={() => { setSizeIdx(i); setCustomW(""); setCustomH(""); advanceStep("step-size"); }}
                  />
                ))}
                {bannerType.hasDimensions && (
                  <OptionCard
                    label={t("banner.customSize")}
                    selected={isCustomSize}
                    onSelect={() => setSizeIdx(-1)}
                    className="border-dashed"
                    icon={
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    }
                  />
                )}
              </OptionGrid>
              {isCustomSize && (
                <CustomDimensions
                  customW={customW}
                  customH={customH}
                  onChangeW={setCustomW}
                  onChangeH={setCustomH}
                  unit={unit}
                  onChangeUnit={setUnit}
                  minLabel={`${bannerType.minIn}" × ${bannerType.minIn}"`}
                  maxLabel={`${bannerType.maxW}" × ${bannerType.maxH}"`}
                  dimErrors={dimErrors}
                  t={t}
                />
              )}
            </StepCard>

            {/* Step: Material */}
            <StepCard
              stepNumber={stepNumFn("material")}
              title={t("banner.material")}
              hint={t("banner.materialSubtitle")}
              summaryText={materialSummary}
              visible={bannerType.materials.length > 1}
              open={isStepOpen("material")}
              onToggle={() => toggleStep("material")}
              stepId="step-material"
            >
              <OptionGrid columns={3} label={t("banner.material")}>
                {bannerType.materials.map((mat) => {
                  const isActive = materialId === mat.id;
                  void mat.multiplier; // multiplier used in pricing only
                  return (
                    <OptionCard
                      key={mat.id}
                      label={mat.label}
                      description={MATERIAL_META[mat.id]?.description}
                      selected={isActive}
                      onSelect={() => { setMaterialId(mat.id); advanceStep("step-material"); }}
                    />
                  );
                })}
              </OptionGrid>
            </StepCard>

            {/* Step: Finishing (multi-select) */}
            <StepCard
              stepNumber={stepNumFn("finishing")}
              title={t("banner.finishing")}
              hint={t("banner.finishingSubtitle")}
              summaryText={finishingSummary}
              visible={bannerType.finishings.length > 0}
              open={isStepOpen("finishing")}
              onToggle={() => toggleStep("finishing")}
              stepId="step-finishing"
            >
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {bannerType.finishings.map((fId) => {
                  const opt = FINISHING_OPTIONS[fId];
                  const isActive = finishings.includes(fId);
                  return (
                    <button
                      key={fId}
                      type="button"
                      onClick={() => toggleFinishing(fId)}
                      className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                        isActive
                          ? "border-teal-500 bg-teal-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                          <svg className="h-3 w-3 text-[#fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-800">{opt?.label || fId}</span>
                      {opt?.desc && (
                        <span className={`text-[10px] ${isActive ? "text-teal-700" : "text-gray-400"}`}>{opt.desc}</span>
                      )}
                      {opt?.surcharge > 0 && (
                        <span className="text-[11px] text-amber-600">+${(opt.surcharge / 100).toFixed(2)}/ea</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </StepCard>

            {/* Step: Quantity */}
            <StepCard
              stepNumber={stepNumFn("quantity")}
              title={t("banner.quantity")}
              hint={t("banner.quantitySubtitle")}
              summaryText={quantitySummary}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
            >
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                {bannerType.quantities.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuantity(q); setCustomQty(""); advanceStep("step-quantity"); }}
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 rounded-full border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-teal-500 bg-teal-50 text-gray-900 shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">{q}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("banner.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
            </StepCard>

            {/* Step: Upload Artwork */}
            <StepCard
              stepNumber={stepNumFn("artwork")}
              title={t("banner.artwork")}
              hint={t("banner.artworkSubtitle")}
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
                t={t}
              />
            </StepCard>

          </div>

          {/* RIGHT COLUMN */}
          <PricingSidebar
            summaryLines={summaryLines}
            quoteLoading={quote.quoteLoading}
            quoteError={quote.quoteError}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            taxCents={quote.taxCents}
            totalCents={quote.subtotalCents}
            quantity={activeQty}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            extraRows={extraRows}
            badges={[t("banner.badgeWeatherproof"), t("banner.badgeShipping")]}
            t={t}
            productName={t(`banner.type.${typeId}`)}
            categorySlug="banners-displays"
            locale={locale}
            productSlug={bannerType.defaultSlug}
            onRetryPrice={quote.retry}
            disabledReason={disabledReason}
            artworkMode="upload-optional"
            hasArtwork={!!uploadedFile}
            artworkIntent={artworkIntent}
            onArtworkIntentChange={setArtworkIntent}
          />
        </div>
      </div>

      {/* FAQ Section */}
      {(() => {
        const faqItems = getConfiguratorFaqs(typeId);
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
          <DeliveryEstimate categorySlug="banners-displays" t={t} locale={locale} />
        </div>
      )}

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        quantity={activeQty}
        summaryText={quote.quoteData ? `${formatCad(quote.unitCents)}/ea × ${activeQty}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        productName={t(`banner.type.${typeId}`)}
        summaryLines={summaryLines}
        unitCents={quote.unitCents}
        subtotalCents={quote.subtotalCents}
        categorySlug="banners-displays"
        locale={locale}
        onRetryPrice={quote.retry}
        disabledReason={disabledReason}
        artworkMode="upload-optional"
        hasArtwork={!!uploadedFile}
        artworkIntent={artworkIntent}
        onArtworkIntentChange={setArtworkIntent}
      />
    </main>
  );
}
