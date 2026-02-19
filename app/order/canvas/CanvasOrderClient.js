"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { CANVAS_TYPES, getCanvasType } from "@/lib/canvas-order-config";
import CanvasPreview from "@/components/canvas/CanvasPreview";
import SplitPanelPreview from "@/components/canvas/SplitPanelPreview";
import QualityBadges from "@/components/canvas/QualityBadges";
import ImageCropper from "@/components/canvas/ImageCropper";
import {
  ConfigStep,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  CustomDimensions,
  useConfiguratorQuote,
  useConfiguratorCart,
} from "@/components/configurator";

const INCH_TO_CM = 2.54;

const TYPE_GROUPS = {
  single: {
    label: "Single Canvas",
    ids: ["standard", "gallery-wrap", "framed", "panoramic"],
  },
  split: {
    label: "Split Panel Sets",
    ids: ["split-2", "split-3", "split-5"],
  },
};

const TYPE_DESCRIPTIONS = {
  standard: "Classic stretched canvas on wood frame",
  "gallery-wrap": "Image wraps around 1.5\" deep frame edges",
  framed: "Canvas mounted in a premium wood frame",
  panoramic: "Wide-format for landscapes and cityscapes",
  "split-2": "Your image across 2 panels",
  "split-3": "Triptych — image split across 3 panels",
  "split-5": "Pentaptych — image split across 5 panels",
};

export default function CanvasOrderClient({ defaultType, productImages }) {
  const { t } = useTranslation();

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
  const [cropData, setCropData] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);

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

  const quote = useConfiguratorQuote({
    slug: canvasType.defaultSlug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    extra: quoteExtra,
    enabled: widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  // Add frame surcharge to quote
  useEffect(() => {
    quote.addSurcharge(frameSurcharge);
  }, [frameSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart =
    quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // Cart
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
      : canvasType.sizes[sizeIdx]?.label;
    return {
      id: canvasType.defaultSlug,
      name: `${canvasType.label} — ${sizeLabel}`,
      slug: canvasType.defaultSlug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        canvasType: typeId,
        panels: canvasType.panels,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        material: materialId,
        edgeTreatment: edgeTreatment || null,
        frameColor: canvasType.frameOptions ? frameColor : null,
        fileName: uploadedFile?.name || null,
        cropData: cropData || null,
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
    edgeTreatment,
    frameColor,
    uploadedFile,
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
  ];

  if (canvasType.panels > 1) {
    summaryLines.splice(1, 0, {
      label: t("canvas.panels"),
      value: `${canvasType.panels} Panels`,
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

  const formatCad = (cents) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  // Preview slot
  const previewSlot = useMemo(() => {
    if (canvasType.panels > 1) {
      return (
        <SplitPanelPreview
          imageUrl={uploadedFile?.url || null}
          widthIn={widthIn}
          heightIn={heightIn}
          panelCount={canvasType.panels}
          gapInches={canvasType.gapInches || 2}
          barDepth={canvasType.barDepth}
          edgeTreatment={edgeTreatment || "image-wrap"}
        />
      );
    }
    return (
      <CanvasPreview
        imageUrl={uploadedFile?.url || null}
        widthIn={widthIn}
        heightIn={heightIn}
        barDepth={canvasType.barDepth}
        edgeTreatment={edgeTreatment || "mirror"}
        frameColor={canvasType.frameOptions ? frameColor : null}
      />
    );
  }, [canvasType, uploadedFile, widthIn, heightIn, edgeTreatment, frameColor]);

  let stepNum = 1;

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("canvas.breadcrumb"), href: "/shop/canvas-prints" },
          { label: t("canvas.configure") },
        ]}
        title={t("canvas.title")}
        subtitle={t("canvas.subtitle")}
        badges={["Epson Pigment Ink", "Free Shipping $99+", "Digital Proof"]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-2">

            {/* Step 1: Upload Artwork (optional) */}
            <ConfigStep
              number={stepNum++}
              title={t("canvas.artwork")}
              subtitle={t("canvas.artworkSubtitle")}
              optional
            >
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                t={t}
              />
            </ConfigStep>

            {/* Image Positioning (only shown when image uploaded) */}
            {uploadedFile && widthIn > 0 && heightIn > 0 && (
              <ConfigStep number={stepNum++} title="Image Position" subtitle="Drag to reposition, scroll to zoom" optional>
                <ImageCropper
                  imageUrl={uploadedFile.url}
                  aspectRatio={widthIn / heightIn}
                  onChange={setCropData}
                />
              </ConfigStep>
            )}

            {/* Step 2: Canvas Type */}
            <ConfigStep
              number={stepNum++}
              title={t("canvas.type.label")}
              subtitle={t("canvas.type.subtitle")}
            >
              {Object.entries(TYPE_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey} className="mb-4 last:mb-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {group.ids.map((id) => {
                      const ct = CANVAS_TYPES.find((c) => c.id === id);
                      if (!ct) return null;
                      const isActive = typeId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTypeId(id)}
                          className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3.5 text-center transition-all duration-200 ${
                            isActive
                              ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.5 12.75l6 6 9-13.5"
                                />
                              </svg>
                            </span>
                          )}
                          <span className="text-sm font-bold">
                            {t(`canvas.type.${id}`)}
                          </span>
                          <span
                            className={`text-[11px] leading-tight ${
                              isActive ? "text-gray-300" : "text-gray-500"
                            }`}
                          >
                            {TYPE_DESCRIPTIONS[id] || ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ConfigStep>

            {/* Step 3: Size */}
            <ConfigStep
              number={stepNum++}
              title={t("canvas.size")}
              subtitle={t("canvas.sizeSubtitle")}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {canvasType.sizes.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSizeIdx(i);
                      setCustomW("");
                      setCustomH("");
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                      sizeIdx === i
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-sm font-bold">{s.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSizeIdx(-1)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                    isCustomSize
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-500"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                    />
                  </svg>
                  <span className="text-xs font-bold">{t("canvas.customSize")}</span>
                </button>
              </div>
              {isCustomSize && (
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
              )}
            </ConfigStep>

            {/* Step 4: Material */}
            <ConfigStep
              number={stepNum++}
              title={t("canvas.material")}
              subtitle={t("canvas.materialSubtitle")}
            >
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {canvasType.materials.map((mat) => {
                  const isActive = materialId === mat.id;
                  const surcharge =
                    mat.multiplier > 1
                      ? `+${Math.round((mat.multiplier - 1) * 100)}%`
                      : null;
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => setMaterialId(mat.id)}
                      className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-800">{mat.label}</span>
                      {mat.desc && (
                        <span className="text-[11px] text-gray-500">{mat.desc}</span>
                      )}
                      {surcharge && (
                        <span className="inline-flex w-fit rounded-xl bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {surcharge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ConfigStep>

            {/* Step 5: Edge Treatment / Frame */}
            {canvasType.frameOptions ? (
              <ConfigStep
                number={stepNum++}
                title={t("canvas.frame")}
                subtitle={t("canvas.frameSubtitle")}
              >
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {canvasType.frameOptions.map((opt) => {
                    const isActive = frameColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFrameColor(opt.id)}
                        className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                          isActive
                            ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          </span>
                        )}
                        {/* Color swatch */}
                        <span
                          className="h-6 w-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: opt.hex || opt.id }}
                        />
                        <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                        {opt.surcharge > 0 && (
                          <span className="inline-flex w-fit rounded-xl bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            +${(opt.surcharge / 100).toFixed(0)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ConfigStep>
            ) : canvasType.edgeTreatments ? (
              <ConfigStep
                number={stepNum++}
                title={t("canvas.edge")}
                subtitle={t("canvas.edgeSubtitle")}
              >
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {canvasType.edgeTreatments.map((opt) => {
                    const isActive = edgeTreatment === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEdgeTreatment(opt.id)}
                        className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                          isActive
                            ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                        {opt.desc && (
                          <span className="text-[11px] text-gray-500">{opt.desc}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ConfigStep>
            ) : null}

            {/* Step 6: Quantity */}
            <ConfigStep
              number={stepNum++}
              title={t("canvas.quantity")}
              subtitle={t("canvas.quantitySubtitle")}
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {(canvasType.quantities || [1, 2, 3, 5, 10]).map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setQuantity(q);
                        setCustomQty("");
                      }}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">{q}</span>
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
                  max="999999"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* Step 7: Quality Badges */}
            <ConfigStep
              number={stepNum++}
              title={t("canvas.quality")}
              subtitle={t("canvas.qualitySubtitle")}
            >
              <QualityBadges />
            </ConfigStep>
          </div>

          <PricingSidebar
            previewSlot={previewSlot}
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
            badges={["Epson Pigment Ink", "Free Shipping $99+"]}
            t={t}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.totalCents}
        summaryText={
          quote.quoteData
            ? `${formatCad(quote.unitCents)}/ea × ${activeQty}`
            : null
        }
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
      />
    </main>
  );
}
