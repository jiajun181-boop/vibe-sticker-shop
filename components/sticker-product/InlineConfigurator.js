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
  useConfiguratorPrice,
  useConfiguratorCart,
  MaterialSwatchGrid,
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

// Map frontend material IDs → API material alias + implicit lamination
const MATERIAL_API_MAP = {
  "white-vinyl": { alias: "white-vinyl", lam: null },
  matte: { alias: "matte", lam: "matte" },
  clear: { alias: "clear", lam: null },
  holographic: { alias: "holographic", lam: null },
  reflective: { alias: "reflective", lam: null },
  "glossy-paper": { alias: "glossy-paper", lam: null },
  "white-bopp": { alias: "white-bopp", lam: null },
  "clear-bopp": { alias: "clear-bopp", lam: null },
  "kraft-paper": { alias: "kraft-paper", lam: null },
  silver: { alias: "silver", lam: null },
  outdoor: { alias: "outdoor", lam: null },
  indoor: { alias: "indoor", lam: null },
  "floor-nonslip": { alias: "floor-nonslip", lam: null },
  "transfer-vinyl": { alias: "transfer-vinyl", lam: null },
  "white-cling": { alias: "white-cling", lam: null },
  "clear-cling": { alias: "clear-cling", lam: null },
  "magnetic-vinyl": { alias: "magnetic-vinyl", lam: null },
  perforated: { alias: "perforated", lam: null },
};

// Map frontend cutting type IDs → API cutType option
const CUT_TYPE_MAP = {
  "die-cut": "die_cut",
  "kiss-cut": "kiss_cut",
  sheets: "sheet",
  "roll-labels": "die_cut",
  "vinyl-lettering": "die_cut",
  decals: "die_cut",
  transfer: "die_cut",
  "static-cling": "die_cut",
  magnets: "die_cut",
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
  const [laminationId, setLaminationId] = useState("none");
  const [shapeId, setShapeId] = useState("custom");

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

  // --- Pricing ---
  const matApi = MATERIAL_API_MAP[materialId] || { alias: materialId, lam: null };
  const lamination = matApi.lam || (laminationId === "matte-lam" ? "matte" : laminationId === "gloss" ? "gloss" : "none");

  const quote = useConfiguratorPrice({
    slug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: matApi.alias,
    options: {
      cutType: CUT_TYPE_MAP[cuttingTypeId] || "die_cut",
      isSticker: true,
      lamination,
    },
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
        lamination: lamination !== "none" ? lamination : null,
        shape: cutting.shapes ? shapeId : undefined,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.unitCents, activeQty, cuttingTypeId, widthIn, heightIn, isCustomSize, sizeIdx, cutting, slug, materialId, lamination, shapeId, uploadedFile, t]);

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
  function selectShape(id) {
    setShapeId(id);
    trackOptionChange({ slug, option: "shape", value: id, quantity: activeQty });
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
        <MaterialSwatchGrid
          materials={cutting.materials.map((mat) => ({
            id: mat.id,
            label: t(`stickerOrder.mat.${mat.id}`),
            subtitle: MATERIAL_HINTS[mat.id] || undefined,
          }))}
          selectedId={materialId}
          onSelect={selectMaterial}
          columns={cutting.materials.length <= 3 ? 3 : 4}
        />
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
                    ? "border-gray-900 bg-gray-900 text-[#fff]"
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
                ? "border-gray-900 bg-gray-900 text-[#fff]"
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

      {/* Shape */}
      {cutting.shapes && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            {t("stickerOrder.shape")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {cutting.shapes.map((s) => {
              const isActive = shapeId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectShape(s.id)}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "border-gray-900 bg-gray-900 text-[#fff]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t(s.label)}
                </button>
              );
            })}
          </div>
          {shapeId === "custom" && (
            <p className="mt-2 text-xs text-amber-600">
              {t("stickerOrder.shape.customHint")}
            </p>
          )}
        </div>
      )}

      {/* Quantity */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Quantity
        </h3>
        <div className="flex flex-wrap gap-2">
          {cutting.quantities.map((q) => {
            const isActive = customQty === "" && quantity === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => selectQuantity(q)}
                className={`relative rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "border-gray-900 bg-gray-900 text-[#fff]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {q.toLocaleString()}
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

      {/* Lamination */}
      {cutting.lamination && cutting.lamination.length > 1 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Lamination
          </h3>
          <div className="flex flex-wrap gap-2">
            {cutting.lamination.map((lam) => (
              <button
                key={lam.id}
                type="button"
                onClick={() => setLaminationId(lam.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  laminationId === lam.id
                    ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-[#fff]"
                    : "border-[var(--color-gray-300)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-500)]"
                }`}
              >
                {lam.id === "none" ? "No Lamination" : lam.id === "gloss" ? "Gloss Lamination" : "Matte Lamination"}
              </button>
            ))}
          </div>
        </div>
      )}

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
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(quote.subtotalCents)}</span>
            </div>
            <p className="text-right text-[10px] text-gray-400">Before tax</p>
            {(() => {
              const hints = [];
              if (materialId !== cutting.materials[0].id) hints.push(t("configurator.priceIncludesMaterial"));
              if (laminationId !== "none") hints.push(t("configurator.priceIncludesFinishing"));
              if (hints.length === 0 && activeQty > 0) return null;
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
        <span>Free shipping $99+</span>
        <span className="text-gray-300">|</span>
        <span>Free proof</span>
      </div>
    </div>
  );
}
