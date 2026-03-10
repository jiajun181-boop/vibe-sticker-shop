"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getWwfProduct,
  WWF_APPLICATION_SIDES,
  WWF_FINISHING_OPTIONS,
} from "@/lib/wwf-product-config";
import {
  ArtworkUpload,
  CustomDimensions,
  useConfiguratorPrice,
  useConfiguratorCart,
  MaterialSwatchGrid,
  StepCard,
  OptionCard,
  OptionGrid,
  useStepScroll,
} from "@/components/configurator";
import { formatCad } from "@/lib/product-helpers";

const INCH_TO_CM = 2.54;

/**
 * Inline configurator for Windows, Walls & Floors product pages.
 * Uses Phase 3 pricing engine via useConfiguratorPrice.
 *
 * Props:
 *  - wwfProductId: product id from wwf-product-config (e.g. "frosted-window-film")
 */
export default function WwfInlineConfigurator({ wwfProductId }) {
  const { t } = useTranslation();
  const product = useMemo(() => getWwfProduct(wwfProductId), [wwfProductId]);

  const isMultiMaterial = !product.fixedMaterial && product.materials?.length > 0;
  const isWindowProduct = product.application === "window";
  const hasMultipleCutTypes = product.cutTypes.length > 1;
  const hasFinishings = product.finishings.length > 0;
  const isCustomSizeOnly = product.customSizeOnly === true;

  // --- State ---
  const [materialId, setMaterialId] = useState(
    isMultiMaterial ? product.materials[0].id : product.fixedMaterial
  );
  const [sizeIdx, setSizeIdx] = useState(isCustomSizeOnly ? -1 : 0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [cutType, setCutType] = useState(product.cutTypes[0]);
  const [applicationSide, setApplicationSide] = useState(
    isWindowProduct ? "outside" : null
  );
  const [finishing, setFinishing] = useState(product.defaultFinishing || "none");
  const [quantity, setQuantity] = useState(product.quantities[0] ?? 1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);

  // Derived dimensions
  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return product.sizes[sizeIdx]?.w ?? 24;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, product, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return product.sizes[sizeIdx]?.h ?? 36;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, product, customH, unit]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // --- Validate dimensions ---
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
    const errs = [];
    if (widthIn < product.minIn) errs.push(`Width must be at least ${product.minIn}"`);
    if (heightIn < product.minIn) errs.push(`Height must be at least ${product.minIn}"`);
    if (widthIn > product.maxW) errs.push(`Width cannot exceed ${product.maxW}"`);
    if (heightIn > product.maxH) errs.push(`Height cannot exceed ${product.maxH}"`);
    setDimErrors(errs);
  }, [widthIn, heightIn, product]);

  // --- API pricing via COST_PLUS ---
  const quoteEnabled = widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0;
  const {
    quoteData,
    quoteLoading,
    quoteError,
    unitCents,
    subtotalCents,
    addSurcharge,
  } = useConfiguratorPrice({
    slug: product.slug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    options: { cutType, printMode: "cmyk" },
    enabled: quoteEnabled,
  });

  // --- Finishing surcharges ---
  const finishingSurchargeCents = useMemo(() => {
    if (finishing === "none" || !WWF_FINISHING_OPTIONS[finishing]) return 0;
    return WWF_FINISHING_OPTIONS[finishing].surcharge * activeQty;
  }, [finishing, activeQty]);

  useEffect(() => {
    addSurcharge(finishingSurchargeCents);
  }, [finishingSurchargeCents, addSurcharge]);

  const canAddToCart = quoteData && activeQty > 0 && dimErrors.length === 0;

  // --- Cart ---
  const buildCartItem = useCallback(() => {
    if (!quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(1)}" \u00d7 ${heightIn.toFixed(1)}"`
      : product.sizes[sizeIdx]?.label;
    return {
      id: product.slug,
      name: `${product.name} \u2014 ${sizeLabel}`,
      slug: product.slug,
      price: Math.round(subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        wwfProduct: wwfProductId,
        material: materialId,
        materialName: isMultiMaterial
          ? product.materials.find((m) => m.id === materialId)?.label || materialId
          : materialId,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        cutType,
        applicationSide,
        finishing: finishing !== "none" ? WWF_FINISHING_OPTIONS[finishing]?.label : null,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quoteData, subtotalCents, activeQty, wwfProductId, widthIn, heightIn, isCustomSize, sizeIdx, product, materialId, isMultiMaterial, cutType, applicationSide, finishing, uploadedFile]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: `${product.name} added to cart!`,
  });

  // --- Handlers ---
  function selectSize(idx) {
    setSizeIdx(idx);
    setCustomW("");
    setCustomH("");
  }
  function selectQuantity(q) {
    setQuantity(q);
    setCustomQty("");
  }

  const unitPriceLabel = unitCents > 0 ? `${formatCad(unitCents)}/ea` : null;

  // --- Accordion state ---
  const [activeStepId, setActiveStepId] = useState(null);

  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "size",            vis: true },
      { id: "cutType",         vis: hasMultipleCutTypes },
      { id: "applicationSide", vis: isWindowProduct },
      { id: "material",        vis: isMultiMaterial },
      { id: "finishing",       vis: hasFinishings },
      { id: "quantity",        vis: true },
      { id: "artwork",         vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [hasMultipleCutTypes, isWindowProduct, isMultiMaterial, hasFinishings]);

  const stepNum = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);

  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // --- Summary texts ---
  const sizeSummary = isCustomSize
    ? `${widthIn.toFixed(1)}" \u00d7 ${heightIn.toFixed(1)}"`
    : product.sizes[sizeIdx]?.label || "Custom";
  const cutTypeSummary = cutType === "rectangular" ? "Rectangular" : "Custom Shape";
  const applicationSideSummary = applicationSide
    ? WWF_APPLICATION_SIDES[applicationSide]?.label || applicationSide
    : "";
  const materialSummary = isMultiMaterial
    ? product.materials.find((m) => m.id === materialId)?.label || materialId
    : "";
  const finishingSummary = finishing === "none"
    ? "No Laminate"
    : WWF_FINISHING_OPTIONS[finishing]?.label || finishing;

  return (
    <div className="space-y-3">
      {/* 1. Size */}
      <StepCard
        stepNumber={stepNum("size")}
        title={t("step.size")}
        hint={t("step.size.hint")}
        summaryText={sizeSummary}
        open={isStepOpen("size")}
        onToggle={() => toggleStep("size")}
        stepId="step-size"
      >
        {!isCustomSizeOnly && (
          <OptionGrid columns={product.sizes.length <= 4 ? product.sizes.length : 4} label={t("step.size")}>
            {product.sizes.map((s, i) => (
              <OptionCard
                key={i}
                label={s.label}
                selected={sizeIdx === i}
                onSelect={() => { selectSize(i); advanceStep("step-size"); }}
              />
            ))}
            <OptionCard
              label="Custom"
              selected={isCustomSize}
              onSelect={() => selectSize(-1)}
              className={isCustomSize ? "" : "border-dashed"}
            />
          </OptionGrid>
        )}
        {(isCustomSize || isCustomSizeOnly) && (
          <div className={isCustomSizeOnly ? "" : "mt-2"}>
            <CustomDimensions
              customW={customW}
              customH={customH}
              onChangeW={setCustomW}
              onChangeH={setCustomH}
              unit={unit}
              onChangeUnit={setUnit}
              minLabel={`${product.minIn}" \u00d7 ${product.minIn}"`}
              maxLabel={`${product.maxW}" \u00d7 ${product.maxH}"`}
              dimErrors={dimErrors}
              t={t}
            />
          </div>
        )}
      </StepCard>

      {/* 2. Cut Type (only if product supports multiple) */}
      <StepCard
        stepNumber={stepNum("cutType")}
        title={t("step.cutType")}
        hint={t("step.cutType.hint")}
        summaryText={cutTypeSummary}
        visible={hasMultipleCutTypes}
        open={isStepOpen("cutType")}
        onToggle={() => toggleStep("cutType")}
        stepId="step-cutType"
      >
        <OptionGrid columns={2} label={t("step.cutType")}>
          {product.cutTypes.map((ct) => (
            <OptionCard
              key={ct}
              label={ct === "rectangular" ? "Rectangular" : "Custom Shape"}
              selected={cutType === ct}
              onSelect={() => { setCutType(ct); advanceStep("step-cutType"); }}
            />
          ))}
        </OptionGrid>
      </StepCard>

      {/* 3. Application Side (window products only) */}
      <StepCard
        stepNumber={stepNum("applicationSide")}
        title={t("step.applicationSide")}
        hint={t("step.applicationSide.hint")}
        summaryText={applicationSideSummary}
        visible={isWindowProduct}
        open={isStepOpen("applicationSide")}
        onToggle={() => toggleStep("applicationSide")}
        stepId="step-applicationSide"
      >
        <OptionGrid columns={2} label={t("step.applicationSide")}>
          {Object.values(WWF_APPLICATION_SIDES).map((side) => (
            <OptionCard
              key={side.id}
              label={side.label}
              selected={applicationSide === side.id}
              onSelect={() => { setApplicationSide(side.id); advanceStep("step-applicationSide"); }}
            />
          ))}
        </OptionGrid>
      </StepCard>

      {/* 4. Material (only for multi-material products) */}
      <StepCard
        stepNumber={stepNum("material")}
        title={t("step.material")}
        hint={t("step.material.hint")}
        summaryText={materialSummary}
        visible={isMultiMaterial}
        open={isStepOpen("material")}
        onToggle={() => toggleStep("material")}
        stepId="step-material"
      >
        <MaterialSwatchGrid
          materials={product.materials}
          selectedId={materialId}
          onSelect={(id) => { setMaterialId(id); advanceStep("step-material"); }}
          columns={product.materials.length <= 3 ? 3 : 4}
        />
      </StepCard>

      {/* 5. Finishing (if product has finishing options) */}
      <StepCard
        stepNumber={stepNum("finishing")}
        title={t("step.finishing")}
        hint={t("step.finishing.hint")}
        summaryText={finishingSummary}
        visible={hasFinishings}
        open={isStepOpen("finishing")}
        onToggle={() => toggleStep("finishing")}
        stepId="step-finishing"
      >
        <OptionGrid columns={product.finishings.length + 1 <= 4 ? product.finishings.length + 1 : 4} label={t("step.finishing")}>
          <OptionCard
            label="No Laminate"
            selected={finishing === "none"}
            onSelect={() => { setFinishing("none"); advanceStep("step-finishing"); }}
          />
          {product.finishings.map((fId) => {
            const opt = WWF_FINISHING_OPTIONS[fId];
            if (!opt) return null;
            return (
              <OptionCard
                key={fId}
                label={opt.label}
                selected={finishing === fId}
                onSelect={() => { setFinishing(fId); advanceStep("step-finishing"); }}
                badge={opt.surcharge > 0 ? (
                  <span className="text-[9px] font-bold text-amber-600">+{formatCad(opt.surcharge)}/ea</span>
                ) : null}
              />
            );
          })}
        </OptionGrid>
      </StepCard>

      {/* 6. Quantity */}
      <StepCard
        stepNumber={stepNum("quantity")}
        title={t("step.quantity")}
        hint={t("step.quantity.hint")}
        summaryText={`${activeQty.toLocaleString()} pcs`}
        open={isStepOpen("quantity")}
        onToggle={() => toggleStep("quantity")}
        stepId="step-quantity"
        alwaysOpen
      >
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          {product.quantities.map((q) => {
            const isActive = customQty === "" && quantity === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => { selectQuantity(q); advanceStep("step-quantity"); }}
                className={`flex-shrink-0 rounded-full border-2 px-3 py-2 text-xs font-bold transition-all ${
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
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="999"
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            placeholder="Custom qty"
            className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
          />
          {unitPriceLabel && (
            <span className="text-xs font-medium text-gray-500">{unitPriceLabel}</span>
          )}
        </div>
      </StepCard>

      {/* 7. Artwork */}
      <StepCard
        stepNumber={stepNum("artwork")}
        title={t("step.artwork")}
        hint={t("step.artwork.hint")}
        summaryText={uploadedFile?.name || t("step.notUploaded")}
        optional
        open={isStepOpen("artwork")}
        onToggle={() => toggleStep("artwork")}
        stepId="step-artwork"
      >
        <ArtworkUpload
          uploadedFile={uploadedFile}
          onUploaded={(file) => setUploadedFile(file)}
          onRemove={() => setUploadedFile(null)}
          t={t}
        />
      </StepCard>

      {/* Price Summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        {quoteLoading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <span className="text-xs text-gray-500">Calculating...</span>
          </div>
        ) : quoteError ? (
          <p className="text-center text-xs text-red-500">{quoteError}</p>
        ) : quoteData ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>Subtotal ({activeQty} {activeQty === 1 ? "piece" : "pieces"})</span>
              <span className="font-medium text-gray-700">{formatCad(subtotalCents)}</span>
            </div>
            {finishingSurchargeCents > 0 && (
              <div className="flex items-baseline justify-between text-xs text-gray-500">
                <span>Finishing</span>
                <span>{formatCad(finishingSurchargeCents)}</span>
              </div>
            )}
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(subtotalCents)}</span>
            </div>
            <p className="text-right text-[10px] text-gray-400">Before tax</p>
            {(() => {
              const hints = [];
              if (isMultiMaterial && materialId !== product.materials[0].id) hints.push(t("configurator.priceIncludesMaterial"));
              if (finishingSurchargeCents > 0) hints.push(t("configurator.priceIncludesFinishing"));
              return hints.length > 0 ? (
                <p className="mt-1 text-xs text-gray-400">{hints.join(". ")}.</p>
              ) : null;
            })()}
          </div>
        ) : (
          <p className="text-center text-xs text-gray-400">Select options for pricing</p>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`w-full rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
            canAddToCart
              ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800 active:scale-[0.98]"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          }`}
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!canAddToCart || buyNowLoading}
          className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
            canAddToCart && !buyNowLoading
              ? "border-gray-900 bg-gray-900 text-[#fff] hover:bg-gray-800 active:scale-[0.98]"
              : "cursor-not-allowed border-gray-200 text-gray-400"
          }`}
        >
          {buyNowLoading ? "Processing..." : "Buy Now"}
        </button>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        <span>Secure checkout</span>
        <span className="text-gray-300">|</span>
        <span>Free shipping $99+</span>
        <span className="text-gray-300">|</span>
        <span>Free proof</span>
      </div>
    </div>
  );
}
