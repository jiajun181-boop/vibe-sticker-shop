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
} from "@/components/configurator";

const INCH_TO_CM = 2.54;
const HST_RATE = 0.13;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

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

  // --- State ---
  const [materialId, setMaterialId] = useState(
    isMultiMaterial ? product.materials[0].id : product.fixedMaterial
  );
  const [sizeIdx, setSizeIdx] = useState(0);
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
    taxCents,
    totalCents,
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

  return (
    <div className="space-y-5">
      {/* 1. Size */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Size
        </h3>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s, i) => {
            const isActive = sizeIdx === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectSize(i)}
                className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {s.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => selectSize(-1)}
            className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
              isCustomSize
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-dashed border-gray-300 text-gray-500 hover:border-gray-500"
            }`}
          >
            Custom
          </button>
        </div>
        {isCustomSize && (
          <div className="mt-2">
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
      </div>

      {/* 2. Cut Type (only if product supports multiple) */}
      {hasMultipleCutTypes && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Cut Type
          </h3>
          <div className="flex gap-2">
            {product.cutTypes.map((ct) => {
              const isActive = cutType === ct;
              const label = ct === "rectangular" ? "Rectangular" : "Contour (Die-Cut)";
              return (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setCutType(ct)}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Application Side (window products only) */}
      {isWindowProduct && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Application Side
          </h3>
          <div className="flex gap-2">
            {Object.values(WWF_APPLICATION_SIDES).map((side) => {
              const isActive = applicationSide === side.id;
              return (
                <button
                  key={side.id}
                  type="button"
                  onClick={() => setApplicationSide(side.id)}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {side.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Material (only for Glass Waistline / multi-material products) */}
      {isMultiMaterial && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Material
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {product.materials.map((mat) => {
              const isActive = materialId === mat.id;
              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => setMaterialId(mat.id)}
                  className={`relative flex flex-col gap-0.5 rounded-lg border-2 p-2.5 text-left transition-all ${
                    isActive
                      ? "border-gray-900 bg-gray-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  {isActive && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </span>
                  )}
                  <span className="text-xs font-bold text-gray-800">{mat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Finishing (if product has finishing options) */}
      {hasFinishings && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Finishing
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFinishing("none")}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                finishing === "none"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              No Laminate
            </button>
            {product.finishings.map((fId) => {
              const opt = WWF_FINISHING_OPTIONS[fId];
              if (!opt) return null;
              const isActive = finishing === fId;
              return (
                <button
                  key={fId}
                  type="button"
                  onClick={() => setFinishing(fId)}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                  {opt.surcharge > 0 && (
                    <span className={`ml-1 text-[9px] ${isActive ? "text-amber-300" : "text-amber-600"}`}>
                      +{formatCad(opt.surcharge)}/ea
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Quantity */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Quantity
        </h3>
        <div className="flex flex-wrap gap-2">
          {product.quantities.map((q) => {
            const isActive = customQty === "" && quantity === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => selectQuantity(q)}
                className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
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
            className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
          />
          {unitPriceLabel && (
            <span className="text-xs font-medium text-gray-500">{unitPriceLabel}</span>
          )}
        </div>
      </div>

      {/* 7. Artwork */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Artwork <span className="font-normal normal-case text-gray-400">(optional)</span>
        </h3>
        <ArtworkUpload
          uploadedFile={uploadedFile}
          onUploaded={(file) => setUploadedFile(file)}
          onRemove={() => setUploadedFile(null)}
          t={t}
        />
      </div>

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
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>HST (13%)</span>
              <span>{formatCad(taxCents)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(totalCents)}</span>
            </div>
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
              ? "bg-gray-900 text-white shadow-lg hover:bg-gray-800 active:scale-[0.98]"
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
              ? "border-gray-900 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
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
        <span>Free shipping $75+</span>
        <span className="text-gray-300">|</span>
        <span>Free proof</span>
      </div>
    </div>
  );
}
