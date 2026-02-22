"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getSignType,
  ACCESSORY_OPTIONS,
} from "@/lib/sign-order-config";
import {
  ArtworkUpload,
  CustomDimensions,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";

const INCH_TO_CM = 2.54;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/**
 * Compact inline configurator for sign rich product pages.
 * Handles material, size, double-sided, shape, quantity, accessories, artwork, pricing.
 *
 * Props:
 *  - signTypeId: locked sign type (e.g. "real-estate")
 */
export default function SignInlineConfigurator({ signTypeId }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const signType = useMemo(() => getSignType(signTypeId), [signTypeId]);

  // --- URL param pre-selection ---
  const paramMaterial = searchParams.get("material");
  const paramQty = searchParams.get("qty");

  // --- State ---
  const [materialId, setMaterialId] = useState(
    paramMaterial && signType.materials.some((m) => m.id === paramMaterial)
      ? paramMaterial
      : signType.materials[0].id
  );
  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [doubleSided, setDoubleSided] = useState(signType.doubleSided ?? false);
  const [quantity, setQuantity] = useState(() => {
    if (paramQty) {
      const n = parseInt(paramQty, 10);
      if (n > 0 && signType.quantities.includes(n)) return n;
    }
    return signType.quantities[0] ?? 1;
  });
  const [customQty, setCustomQty] = useState(() => {
    if (paramQty) {
      const n = parseInt(paramQty, 10);
      if (n > 0 && !signType.quantities.includes(n)) return paramQty;
    }
    return "";
  });
  const [accessories, setAccessories] = useState(signType.defaultAccessories || []);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);

  // Derived dimensions
  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return signType.sizes[sizeIdx]?.w ?? 18;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, signType, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return signType.sizes[sizeIdx]?.h ?? 24;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, signType, customH, unit]);

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
    if (widthIn < signType.minIn) errs.push(`Width must be at least ${signType.minIn}"`);
    if (heightIn < signType.minIn) errs.push(`Height must be at least ${signType.minIn}"`);
    if (widthIn > signType.maxW) errs.push(`Width cannot exceed ${signType.maxW}"`);
    if (heightIn > signType.maxH) errs.push(`Height cannot exceed ${signType.maxH}"`);
    setDimErrors(errs);
  }, [widthIn, heightIn, signType]);

  // --- Accessory surcharges ---
  const accessorySurcharge = useMemo(() => {
    return accessories.reduce((sum, aId) => {
      return sum + (ACCESSORY_OPTIONS[aId]?.surcharge ?? 0) * activeQty;
    }, 0);
  }, [accessories, activeQty]);

  // --- Quote ---
  const quote = useConfiguratorPrice({
    slug: signType.defaultSlug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    options: { doubleSided },
    enabled: widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  // Apply surcharges (accessories + double-sided)
  useEffect(() => {
    const dsExtra = doubleSided ? Math.round(quote.rawSubtotalCents * 0.5) : 0;
    quote.addSurcharge(accessorySurcharge + dsExtra);
  }, [accessorySurcharge, doubleSided, quote.rawSubtotalCents]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // --- Cart ---
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(1)}" \u00d7 ${heightIn.toFixed(1)}"`
      : signType.sizes[sizeIdx]?.label;
    const accessoryLabels = accessories
      .map((aId) => ACCESSORY_OPTIONS[aId]?.label)
      .filter(Boolean);
    return {
      id: signType.defaultSlug,
      name: `Real Estate Sign \u2014 ${sizeLabel}`,
      slug: signType.defaultSlug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        signType: signTypeId,
        material: materialId,
        materialName: signType.materials.find((m) => m.id === materialId)?.label || materialId,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        doubleSided,
        accessories: accessoryLabels,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, signTypeId, widthIn, heightIn, isCustomSize, sizeIdx, signType, materialId, doubleSided, accessories, uploadedFile]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: "Sign added to cart!",
  });

  // --- Handlers ---
  function selectSize(idx) {
    setSizeIdx(idx);
    setCustomW("");
    setCustomH("");
  }
  function selectMaterial(id) {
    setMaterialId(id);
  }
  function selectQuantity(q) {
    setQuantity(q);
    setCustomQty("");
  }
  function toggleAccessory(aId) {
    setAccessories((prev) =>
      prev.includes(aId)
        ? prev.filter((id) => id !== aId)
        : [...prev, aId]
    );
  }

  const unitPriceLabel = quote.unitCents > 0 ? `${formatCad(quote.unitCents)}/ea` : null;

  const MATERIAL_HINTS = {
    "4mm-coroplast": "Lightweight, 1\u20132yr outdoor",
    "aluminum-040": "Rigid, premium, 5yr+",
  };

  return (
    <div className="space-y-5">
      {/* Material */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Material
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {signType.materials.map((mat) => {
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
                <span className="text-xs font-bold text-gray-800">{mat.label}</span>
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
          {signType.sizes.map((s, i) => {
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
              minLabel={`${signType.minIn}" \u00d7 ${signType.minIn}"`}
              maxLabel={`${signType.maxW}" \u00d7 ${signType.maxH}"`}
              dimErrors={dimErrors}
              t={t}
            />
          </div>
        )}
      </div>

      {/* Printing (single / double sided) */}
      {signType.doubleSided !== undefined && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Printing
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDoubleSided(false)}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                !doubleSided
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              Single-Sided
            </button>
            <button
              type="button"
              onClick={() => setDoubleSided(true)}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                doubleSided
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              Double-Sided
              <span className={`ml-1 text-[9px] ${doubleSided ? "text-amber-300" : "text-amber-600"}`}>+50%</span>
            </button>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Quantity
        </h3>
        <div className="flex flex-wrap gap-2">
          {signType.quantities.map((q) => {
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

      {/* Accessories */}
      {signType.accessories.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Accessories
          </h3>
          <div className="space-y-2">
            {signType.accessories.map((aId) => {
              const acc = ACCESSORY_OPTIONS[aId];
              if (!acc) return null;
              const checked = accessories.includes(aId);
              return (
                <label key={aId} className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAccessory(aId)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="font-medium">{acc.label}</span>
                  {acc.surcharge > 0 && (
                    <span className="text-gray-400">+{formatCad(acc.surcharge)}/ea</span>
                  )}
                  {acc.surcharge === 0 && (
                    <span className="text-emerald-600 text-[10px] font-bold">Included</span>
                  )}
                </label>
              );
            })}
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
              <span>Subtotal ({activeQty} {activeQty === 1 ? "sign" : "signs"})</span>
              <span className="font-medium text-gray-700">{formatCad(quote.subtotalCents)}</span>
            </div>
            {accessorySurcharge > 0 && (
              <div className="flex items-baseline justify-between text-xs text-gray-500">
                <span>Accessories</span>
                <span>{formatCad(accessorySurcharge)}</span>
              </div>
            )}
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
