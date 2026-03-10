"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/product-helpers";
import { CANVAS_TYPES, getCanvasType } from "@/lib/canvas-order-config";
import CanvasPreview from "@/components/canvas/CanvasPreview";
import SplitPanelPreview from "@/components/canvas/SplitPanelPreview";
import WallContextPreview from "@/components/canvas/WallContextPreview";
import QualityBadges from "@/components/canvas/QualityBadges";
import ImageCropper from "@/components/canvas/ImageCropper";
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

const INCH_TO_CM = 2.54;

const TYPE_GROUPS = {
  single: { ids: ["standard", "gallery-wrap", "framed", "panoramic"] },
  split: { ids: ["split-2", "split-3", "split-5"] },
};

export default function CanvasOrderClient({ defaultType, productImages }) {
  const { t, locale } = useTranslation();

  // --- State ---
  const [typeId, setTypeId] = useState(defaultType || "standard");
  const canvasType = useMemo(() => getCanvasType(typeId), [typeId]);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(canvasType.materials[0].id);
  const [edgeTreatment, setEdgeTreatment] = useState(canvasType.defaultEdge || null);
  const [frameColor, setFrameColor] = useState(canvasType.defaultFrame || "black");
  const [quantity, setQuantity] = useState(canvasType.quantities?.[0] ?? 1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artworkIntent, setArtworkIntent] = useState(null);
  const [cropData, setCropData] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);
  const [viewMode, setViewMode] = useState("closeup");

  const isCustomSize = sizeIdx === -1;

  const widthIn = useMemo(() => {
    if (!isCustomSize) return canvasType.sizes[sizeIdx]?.w ?? 16;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, canvasType, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return canvasType.sizes[sizeIdx]?.h ?? 20;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, canvasType, customH, unit]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Reset on type change
  useEffect(() => {
    setSizeIdx(0);
    setCustomW("");
    setCustomH("");
    setMaterialId(canvasType.materials[0].id);
    setEdgeTreatment(canvasType.defaultEdge || null);
    setFrameColor(canvasType.defaultFrame || "black");
    setQuantity(canvasType.quantities?.[0] ?? 1);
    setCustomQty("");
    setDimErrors([]);
  }, [typeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate dimensions
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) {
      setDimErrors([]);
      return;
    }
    const errs = [];
    if (widthIn < canvasType.minIn) errs.push(`Width must be at least ${canvasType.minIn}"`);
    if (heightIn < canvasType.minIn) errs.push(`Height must be at least ${canvasType.minIn}"`);
    if (widthIn > canvasType.maxW) errs.push(`Width cannot exceed ${canvasType.maxW}"`);
    if (heightIn > canvasType.maxH) errs.push(`Height cannot exceed ${canvasType.maxH}"`);
    setDimErrors(errs);
  }, [widthIn, heightIn, canvasType]);

  // Frame surcharge (framed type only)
  const frameSurcharge = useMemo(() => {
    if (!canvasType.frameOptions) return 0;
    const opt = canvasType.frameOptions.find((f) => f.id === frameColor);
    return (opt?.surcharge ?? 0) * activeQty;
  }, [canvasType, frameColor, activeQty]);

  // Resolve printMode from selected material
  const selectedMat = useMemo(
    () => canvasType.materials.find((m) => m.id === materialId),
    [canvasType, materialId]
  );

  // Quote — pass cutType + printMode
  const quoteExtra = useMemo(
    () => ({
      cutType: "rectangular",
      ...(selectedMat?.printMode ? { printMode: selectedMat.printMode } : {}),
    }),
    [selectedMat]
  );

  const quote = useConfiguratorPrice({
    slug: canvasType.defaultSlug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    options: quoteExtra,
    enabled: !isQuoteOnly && widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  // Add frame surcharge to quote
  useEffect(() => {
    quote.addSurcharge(frameSurcharge);
  }, [frameSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const isQuoteOnly = canvasType.quoteOnly === true;

  const canAddToCart =
    !isQuoteOnly && quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  const disabledReason = isQuoteOnly
    ? "This type requires a custom quote"
    : !quote.quoteData && !quote.quoteLoading
      ? "Select all options to see pricing"
      : quote.quoteLoading
        ? "Calculating price…"
        : activeQty <= 0
          ? "Select a quantity"
          : dimErrors.length > 0
            ? dimErrors[0]
            : null;

  // Cart
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
      : canvasType.sizes[sizeIdx]?.label;
    const materialObj = canvasType.materials.find((m) => m.id === materialId);
    const edgeObj = canvasType.edgeTreatments?.find((e) => e.id === edgeTreatment);
    const frameObj = canvasType.frameOptions?.find((f) => f.id === frameColor);
    const orientation = widthIn > heightIn ? "landscape" : widthIn < heightIn ? "portrait" : "square";
    return {
      id: canvasType.defaultSlug,
      name: `${canvasType.label} — ${sizeLabel}`,
      slug: canvasType.defaultSlug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        canvasType: typeId,
        canvasTypeLabel: canvasType.label,
        panels: canvasType.panels,
        barDepth: canvasType.barDepth || null,
        gapInches: canvasType.gapInches || null,
        printMode: selectedMat?.printMode || null,
        width: widthIn,
        height: heightIn,
        orientation,
        sizeLabel,
        material: materialId,
        materialLabel: materialObj?.label || materialId,
        edgeTreatment: edgeTreatment || null,
        edgeLabel: edgeObj?.label || edgeTreatment || null,
        frameColor: canvasType.frameOptions ? frameColor : null,
        frameLabel: frameObj?.label || (canvasType.frameOptions ? frameColor : null),
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
    typeId,
    widthIn,
    heightIn,
    isCustomSize,
    sizeIdx,
    canvasType,
    materialId,
    selectedMat,
    edgeTreatment,
    frameColor,
    uploadedFile,
    cropData,
  ]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("canvas.addedToCart"),
  });

  // --- Summary lines ---
  const sizeLabel = isCustomSize
    ? widthIn > 0 && heightIn > 0
      ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
      : "—"
    : canvasType.sizes[sizeIdx]?.label || "—";

  const summaryLines = [
    { label: t("canvas.type.label"), value: t(`canvas.type.${typeId}`) },
    { label: t("canvas.size"), value: sizeLabel },
    {
      label: t("canvas.material"),
      value: canvasType.materials.find((m) => m.id === materialId)?.label || materialId,
    },
    { label: t("canvas.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
    { label: t("canvas.artwork"), value: uploadedFile ? t("canvas.artworkUploaded") : t("canvas.artworkNotUploaded") },
    ...(uploadedFile ? [{ label: "Crop", value: cropData ? "Positioned" : "Default" }] : []),
  ];

  if (canvasType.panels > 1) {
    summaryLines.splice(1, 0, {
      label: t("canvas.panels"),
      value: `${canvasType.panels} ${t("canvas.panelsUnit")}`,
    });
  }

  if (canvasType.frameOptions) {
    const frameOpt = canvasType.frameOptions.find((f) => f.id === frameColor);
    summaryLines.push({
      label: t("canvas.frame"),
      value: frameOpt?.label || frameColor,
    });
  } else if (edgeTreatment) {
    const edgeOpt = canvasType.edgeTreatments?.find((e) => e.id === edgeTreatment);
    summaryLines.push({
      label: t("canvas.edge"),
      value: edgeOpt?.label || edgeTreatment,
    });
  }

  // Extra pricing rows
  const extraRows = [];
  if (quote.quoteData?.meta?.model === "COST_PLUS" && Array.isArray(quote.quoteData.breakdown)) {
    for (const line of quote.quoteData.breakdown) {
      extraRows.push({
        label: line.label,
        value: `$${(line.amount / 100).toFixed(2)}`,
      });
    }
  }
  if (frameSurcharge > 0) {
    extraRows.push({
      label: t("canvas.frameSurcharge"),
      value: `+ $${(frameSurcharge / 100).toFixed(2)}`,
    });
  }

  // --- Accordion state ---
  const [activeStepId, setActiveStepId] = useState("step-artwork");

  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "artwork",  vis: true },
      { id: "imageCrop", vis: !!uploadedFile && widthIn > 0 && heightIn > 0 },
      { id: "type",     vis: true },
      { id: "size",     vis: true },
      { id: "material", vis: true },
      { id: "edge",     vis: !!canvasType.frameOptions || !!canvasType.edgeTreatments },
      { id: "quantity", vis: true },
      { id: "quality",  vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [uploadedFile, widthIn, heightIn, canvasType]);

  const stepNum = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);

  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // --- Summary texts for StepCard ---
  const edgeSummaryText = useMemo(() => {
    if (canvasType.frameOptions) {
      const frameOpt = canvasType.frameOptions.find((f) => f.id === frameColor);
      return frameOpt?.label || frameColor;
    }
    if (canvasType.edgeTreatments) {
      const edgeOpt = canvasType.edgeTreatments.find((e) => e.id === edgeTreatment);
      return edgeOpt?.label || edgeTreatment;
    }
    return null;
  }, [canvasType, frameColor, edgeTreatment]);

  // Preview slot with close-up / room toggle
  const previewSlot = useMemo(() => {
    const imgUrl = uploadedFile?.url || null;
    const isSplit = canvasType.panels > 1;

    const closeupView = isSplit ? (
      <SplitPanelPreview
        imageUrl={imgUrl}
        widthIn={widthIn}
        heightIn={heightIn}
        panelCount={canvasType.panels}
        gapInches={canvasType.gapInches || 2}
        barDepth={canvasType.barDepth}
        edgeTreatment={edgeTreatment || "image-wrap"}
      />
    ) : (
      <CanvasPreview
        imageUrl={imgUrl}
        widthIn={widthIn}
        heightIn={heightIn}
        barDepth={canvasType.barDepth}
        edgeTreatment={edgeTreatment || "mirror"}
        frameColor={canvasType.frameOptions ? frameColor : null}
      />
    );

    const roomView = (
      <WallContextPreview
        imageUrl={imgUrl}
        widthIn={widthIn}
        heightIn={heightIn}
        barDepth={canvasType.barDepth}
        edgeTreatment={edgeTreatment || (isSplit ? "image-wrap" : "mirror")}
        frameColor={canvasType.frameOptions ? frameColor : null}
        panelCount={canvasType.panels}
        gapInches={canvasType.gapInches || 2}
      />
    );

    return (
      <div className="flex flex-col gap-3">
        {/* View toggle */}
        <div className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("closeup")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "closeup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
            {t("canvas.viewCloseup")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("room")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "room"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            {t("canvas.viewRoom")}
          </button>
        </div>
        {viewMode === "closeup" ? closeupView : roomView}
      </div>
    );
  }, [canvasType, uploadedFile, widthIn, heightIn, edgeTreatment, frameColor, viewMode, t]);

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("canvas.breadcrumb"), href: "/shop/canvas-prints" },
          { label: t("canvas.configure") },
        ]}
        title={t(`canvas.type.${typeId}`)}
        subtitle={t("canvas.subtitle")}
        badges={[t("canvas.badgeInk"), t("canvas.badgeShipping"), t("canvas.badgeProof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-3 lg:col-span-2">

            {/* Step: Upload Artwork (optional) */}
            <StepCard
              stepNumber={stepNum("artwork")}
              title={t("canvas.artwork")}
              hint={t("canvas.artworkSubtitle")}
              summaryText={uploadedFile?.name || "Not uploaded yet"}
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

            {/* Image Positioning (only shown when image uploaded) */}
            {uploadedFile && widthIn > 0 && heightIn > 0 && (
              <StepCard
                stepNumber={stepNum("imageCrop")}
                title={t("canvas.imagePosition")}
                hint={t("canvas.imagePositionSub")}
                summaryText="Positioned"
                optional
                open={isStepOpen("imageCrop")}
                onToggle={() => toggleStep("imageCrop")}
                stepId="step-imageCrop"
              >
                <ImageCropper
                  imageUrl={uploadedFile.url}
                  aspectRatio={widthIn / heightIn}
                  onChange={setCropData}
                />
              </StepCard>
            )}

            {/* Step: Canvas Type */}
            <StepCard
              stepNumber={stepNum("type")}
              title={t("canvas.type.label")}
              hint={t("canvas.type.subtitle")}
              summaryText={t(`canvas.type.${typeId}`)}
              open={isStepOpen("type")}
              onToggle={() => toggleStep("type")}
              stepId="step-type"
            >
              {Object.entries(TYPE_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey} className="mb-4 last:mb-0">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {t(`canvas.type.${groupKey}Group`)}
                  </p>
                  <OptionGrid columns={4}>
                    {group.ids.map((id) => {
                      const ct = CANVAS_TYPES.find((c) => c.id === id);
                      if (!ct) return null;
                      return (
                        <OptionCard
                          key={id}
                          label={t(`canvas.type.${id}`)}
                          description={t(`canvas.type.${id}.desc`)}
                          selected={typeId === id}
                          onSelect={() => { setTypeId(id); advanceStep("step-type"); }}
                        />
                      );
                    })}
                  </OptionGrid>
                </div>
              ))}
            </StepCard>

            {/* Step: Size */}
            <StepCard
              stepNumber={stepNum("size")}
              title={t("canvas.size")}
              hint={t("canvas.sizeSubtitle")}
              summaryText={sizeLabel}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
            >
              <OptionGrid columns={4}>
                {canvasType.sizes.map((s, i) => (
                  <OptionCard
                    key={i}
                    label={s.label}
                    selected={sizeIdx === i && !isCustomSize}
                    onSelect={() => {
                      setSizeIdx(i);
                      setCustomW("");
                      setCustomH("");
                      advanceStep("step-size");
                    }}
                  />
                ))}
                <OptionCard
                  label={t("canvas.customSize")}
                  selected={isCustomSize}
                  onSelect={() => setSizeIdx(-1)}
                  className={isCustomSize ? "" : "border-dashed"}
                />
              </OptionGrid>
              {isCustomSize && (
                <div className="mt-3">
                  <CustomDimensions
                    customW={customW}
                    customH={customH}
                    onChangeW={setCustomW}
                    onChangeH={setCustomH}
                    unit={unit}
                    onChangeUnit={setUnit}
                    minLabel={`${canvasType.minIn}" × ${canvasType.minIn}"`}
                    maxLabel={`${canvasType.maxW}" × ${canvasType.maxH}"`}
                    dimErrors={dimErrors}
                    t={t}
                  />
                </div>
              )}
            </StepCard>

            {/* Step: Material */}
            <StepCard
              stepNumber={stepNum("material")}
              title={t("canvas.material")}
              hint={t("canvas.materialSubtitle")}
              summaryText={canvasType.materials.find((m) => m.id === materialId)?.label || materialId}
              open={isStepOpen("material")}
              onToggle={() => toggleStep("material")}
              stepId="step-material"
            >
              <OptionGrid columns={3}>
                {canvasType.materials.map((mat) => (
                  <OptionCard
                    key={mat.id}
                    label={mat.label}
                    description={mat.desc}
                    selected={materialId === mat.id}
                    onSelect={() => { setMaterialId(mat.id); advanceStep("step-material"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Edge Treatment / Frame */}
            {canvasType.frameOptions ? (
              <StepCard
                stepNumber={stepNum("edge")}
                title={t("canvas.frame")}
                hint={t("canvas.frameSubtitle")}
                summaryText={edgeSummaryText}
                open={isStepOpen("edge")}
                onToggle={() => toggleStep("edge")}
                stepId="step-edge"
              >
                <OptionGrid columns={4}>
                  {canvasType.frameOptions.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      label={opt.label}
                      selected={frameColor === opt.id}
                      onSelect={() => { setFrameColor(opt.id); advanceStep("step-edge"); }}
                      icon={
                        <span
                          className="h-6 w-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: opt.hex || opt.id }}
                        />
                      }
                      badge={opt.surcharge > 0 ? (
                        <span className="text-[9px] font-bold text-amber-600">
                          +${(opt.surcharge / 100).toFixed(0)}
                        </span>
                      ) : null}
                    />
                  ))}
                </OptionGrid>
              </StepCard>
            ) : canvasType.edgeTreatments ? (
              <StepCard
                stepNumber={stepNum("edge")}
                title={t("canvas.edge")}
                hint={t("canvas.edgeSubtitle")}
                summaryText={edgeSummaryText}
                open={isStepOpen("edge")}
                onToggle={() => toggleStep("edge")}
                stepId="step-edge"
              >
                <OptionGrid columns={3}>
                  {canvasType.edgeTreatments.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      label={opt.label}
                      description={opt.desc}
                      selected={edgeTreatment === opt.id}
                      onSelect={() => { setEdgeTreatment(opt.id); advanceStep("step-edge"); }}
                    />
                  ))}
                </OptionGrid>
              </StepCard>
            ) : null}

            {/* Step: Quantity */}
            <StepCard
              stepNumber={stepNum("quantity")}
              title={t("canvas.quantity")}
              hint={t("canvas.quantitySubtitle")}
              summaryText={`${activeQty.toLocaleString()} pcs`}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
            >
              <div className="flex flex-wrap gap-2">
                {(canvasType.quantities || [1, 2, 3, 5, 10]).map((q) => {
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
                  {t("canvas.customQty")}:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
            </StepCard>

            {/* Step: Quality Badges */}
            <StepCard
              stepNumber={stepNum("quality")}
              title={t("canvas.quality")}
              hint={t("canvas.qualitySubtitle")}
              summaryText="Premium quality"
              open={isStepOpen("quality")}
              onToggle={() => toggleStep("quality")}
              stepId="step-quality"
            >
              <QualityBadges />
            </StepCard>
          </div>

          {isQuoteOnly ? (
            <div className="sticky top-24 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
              {previewSlot}
              <div className="space-y-1.5">
                {summaryLines.map((line, i) => (
                  <div key={i} className="flex items-baseline justify-between text-xs">
                    <span className="text-gray-500">{line.label}</span>
                    <span className="font-medium text-gray-700">{line.value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="text-sm font-bold text-amber-800">{t("canvas.quoteOnlyTitle")}</p>
                <p className="mt-1 text-xs text-amber-700">{t("canvas.quoteOnlyDesc")}</p>
              </div>
              <a
                href="/quote"
                className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-[#fff] shadow-lg transition-all hover:bg-gray-800 active:scale-[0.98]"
              >
                {t("canvas.requestQuote")}
              </a>
              <a
                href="tel:+14168889998"
                className="block w-full rounded-lg border-2 border-gray-900 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wider text-gray-900 transition-all hover:bg-gray-50 active:scale-[0.98]"
              >
                {t("canvas.callForQuote")}
              </a>
            </div>
          ) : (
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
              badges={[t("canvas.badgeInk"), t("canvas.badgeShipping")]}
              t={t}
              productName={t(`canvas.type.${typeId}`)}
              categorySlug="canvas-prints"
              locale={locale}
              productSlug={canvasType.defaultSlug}
              onRetryPrice={quote.retry}
              artworkMode="upload-optional"
              hasArtwork={!!uploadedFile}
              artworkIntent={artworkIntent}
              onArtworkIntentChange={setArtworkIntent}
            />
          )}
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
      {!!quote.quoteData && !isQuoteOnly && (
        <div className="mx-auto max-w-4xl px-4 pb-4 md:hidden">
          <DeliveryEstimate categorySlug="canvas-prints" t={t} locale={locale} />
        </div>
      )}

      {isQuoteOnly ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,.08)] lg:hidden">
          <a
            href="/quote"
            className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-[#fff] shadow-lg"
          >
            {t("canvas.requestQuote")}
          </a>
        </div>
      ) : (
        <MobileBottomBar
          quoteLoading={quote.quoteLoading}
          hasQuote={!!quote.quoteData}
          totalCents={quote.subtotalCents}
          quantity={activeQty}
          summaryText={
            quote.quoteData
              ? `${formatCad(quote.unitCents)}/ea × ${activeQty}`
              : null
          }
          canAddToCart={canAddToCart}
          disabledReason={disabledReason}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          buyNowLoading={buyNowLoading}
          t={t}
          productName={t(`canvas.type.${typeId}`)}
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
      )}
    </main>
  );
}
