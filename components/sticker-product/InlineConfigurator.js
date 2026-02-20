"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validateDimensions } from "@/lib/materialLimits";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getCuttingType,
  resolveProductSlug,
} from "@/lib/sticker-order-config";
import {
  trackOptionChange,
  trackUploadStarted,
} from "@/lib/analytics";
import {
  ArtworkUpload,
  CustomDimensions,
  useConfiguratorQuote,
  useConfiguratorCart,
} from "@/components/configurator";

const INCH_TO_CM = 2.54;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const MATERIAL_HINTS = {
  "white-vinyl": "Durable, waterproof",
  matte: "Non-glare, premium",
  clear: "Transparent background",
  holographic: "Rainbow sparkle",
  reflective: "High visibility",
  "glossy-paper": "Bright, indoor",
};

/**
 * Compact inline configurator for the rich sticker product page right column.
 * No ConfigHero, no step numbers — streamlined for embedding.
 *
 * Props:
 *  - cuttingTypeId: locked cutting type (e.g. "die-cut")
 */
export default function InlineConfigurator({ cuttingTypeId }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const cutting = useMemo(() => getCuttingType(cuttingTypeId), [cuttingTypeId]);

  // --- URL param pre-selection ---
  const paramMaterial = searchParams.get("material");
  const paramQty = searchParams.get("qty");

  // --- State ---
  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(
    paramMaterial && cutting.materials.some((m) => m.id === paramMaterial)
      ? paramMaterial
      : cutting.materials[0].id
  );
  const [quantity, setQuantity] = useState(() => {
    if (paramQty) {
      const n = parseInt(paramQty, 10);
      if (n > 0 && cutting.quantities.includes(n)) return n;
    }
    return cutting.quantities[2] ?? 100;
  });
  const [customQty, setCustomQty] = useState(() => {
    if (paramQty) {
      const n = parseInt(paramQty, 10);
      if (n > 0 && !cutting.quantities.includes(n)) return paramQty;
    }
    return "";
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);
  const [finishingOptions, setFinishingOptions] = useState({ matte_laminate: false });

  // Derived dimensions
  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return cutting.sizes[sizeIdx]?.w ?? 2;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, cutting, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return cutting.sizes[sizeIdx]?.h ?? 2;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, cutting, customH, unit]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  const slug = useMemo(
    () => resolveProductSlug(cuttingTypeId, materialId),
    [cuttingTypeId, materialId]
  );

  // --- Validate dimensions ---
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
    const result = validateDimensions(widthIn, heightIn, "sticker", {
      minWidthIn: cutting.minIn,
      minHeightIn: cutting.minIn,
      maxWidthIn: cutting.maxW,
      maxHeightIn: cutting.maxH,
    });
    setDimErrors(result.errors);
  }, [widthIn, heightIn, cutting]);

  // --- Quote ---
  const quote = useConfiguratorQuote({
    slug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    enabled: widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // --- Cart ---
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(2)}" × ${heightIn.toFixed(2)}"`
      : cutting.sizes[sizeIdx]?.label;
    return {
      id: slug,
      name: `${t(`stickerOrder.type.${cuttingTypeId}`)} — ${sizeLabel}`,
      slug,
      price: quote.unitCents,
      quantity: activeQty,
      options: {
        cuttingType: cuttingTypeId,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        material: materialId,
        materialName: t(`stickerOrder.mat.${materialId}`),
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.unitCents, activeQty, cuttingTypeId, widthIn, heightIn, isCustomSize, sizeIdx, cutting, slug, materialId, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("stickerOrder.addedToCart"),
  });

  // --- Handlers ---
  function selectSize(idx) {
    setSizeIdx(idx);
    setCustomW("");
    setCustomH("");
    trackOptionChange({ slug, option: "size", value: idx === -1 ? "custom" : cutting.sizes[idx]?.label, quantity: activeQty });
  }
  function selectMaterial(id) {
    setMaterialId(id);
    trackOptionChange({ slug, option: "material", value: id, quantity: activeQty });
  }
  function selectQuantity(q) {
    setQuantity(q);
    setCustomQty("");
    trackOptionChange({ slug, option: "quantity", value: q, quantity: q });
  }

  // Unit price display
  const unitPriceLabel = quote.unitCents > 0 ? `${formatCad(quote.unitCents)}/ea` : null;

  return (
    <div className="space-y-5">
      {/* Material */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Material
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {cutting.materials.map((mat) => {
            const isActive = materialId === mat.id;
            const surcharge = mat.multiplier > 1 ? `+${Math.round((mat.multiplier - 1) * 100)}%` : null;
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => selectMaterial(mat.id)}
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
                <span className="text-xs font-bold text-gray-800">
                  {t(`stickerOrder.mat.${mat.id}`)}
                </span>
                <span className="text-[10px] text-gray-400">
                  {MATERIAL_HINTS[mat.id] || ""}
                </span>
                {surcharge && (
                  <span className="mt-0.5 inline-flex w-fit rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                    {surcharge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Size
        </h3>
        <div className="flex flex-wrap gap-2">
          {cutting.sizes.map((s, i) => {
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
              minLabel={`${cutting.minIn}" × ${cutting.minIn}"`}
              maxLabel={`${cutting.maxW}" × ${cutting.maxH}"`}
              dimErrors={dimErrors}
              t={t}
            />
          </div>
        )}
      </div>

      {/* Quantity */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Quantity
        </h3>
        <div className="flex flex-wrap gap-2">
          {cutting.quantities.map((q) => {
            const isActive = customQty === "" && quantity === q;
            const discount = q >= 1000 ? 18 : q >= 500 ? 12 : q >= 250 ? 7 : q >= 100 ? 3 : 0;
            return (
              <button
                key={q}
                type="button"
                onClick={() => selectQuantity(q)}
                className={`relative rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {q >= 1000 ? `${q / 1000}K` : q}
                {discount > 0 && (
                  <span className={`ml-1 text-[9px] ${isActive ? "text-emerald-300" : "text-emerald-600"}`}>
                    -{discount}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="999999"
            value={customQty}
            onChange={(e) => {
              setCustomQty(e.target.value);
              trackOptionChange({ slug, option: "quantity", value: e.target.value, quantity: parseInt(e.target.value, 10) || 0 });
            }}
            placeholder="Custom qty"
            className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
          />
          {unitPriceLabel && (
            <span className="text-xs font-medium text-gray-500">{unitPriceLabel}</span>
          )}
        </div>
      </div>

      {/* Finishing */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Finishing
        </h3>
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={finishingOptions.matte_laminate}
            onChange={(e) => setFinishingOptions((prev) => ({ ...prev, matte_laminate: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          Matte laminate overlay
        </label>
      </div>

      {/* Upload Artwork */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Artwork <span className="font-normal normal-case text-gray-400">(optional)</span>
        </h3>
        <ArtworkUpload
          uploadedFile={uploadedFile}
          onUploaded={(file) => setUploadedFile(file)}
          onRemove={() => setUploadedFile(null)}
          onBegin={() => trackUploadStarted({ slug })}
          t={t}
        />
      </div>

      {/* Price Summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        {quote.quoteLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        ) : quote.quoteError ? (
          <p className="text-xs font-medium text-red-500">{quote.quoteError}</p>
        ) : quote.quoteData ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>Subtotal ({activeQty.toLocaleString()} pcs)</span>
              <span className="font-medium text-gray-700">{formatCad(quote.subtotalCents)}</span>
            </div>
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>HST (13%)</span>
              <span>{formatCad(quote.taxCents)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(quote.totalCents)}</span>
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
