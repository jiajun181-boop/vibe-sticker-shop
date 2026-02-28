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
  MaterialSwatchGrid,
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

  // --- Purchase type support ---
  const hasPurchaseTypes = Array.isArray(signType.purchaseTypes) && signType.purchaseTypes.length > 0;
  const [purchaseType, setPurchaseType] = useState(signType.defaultPurchaseType || "full-kit");
  const isFrameOnly = hasPurchaseTypes && purchaseType === "frame-only";
  const isPanelOnly = hasPurchaseTypes && (purchaseType === "panel-only" || purchaseType === "print-only");

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

  // --- Frame accessory for purchase type ---
  const frameAccessoryId = useMemo(() => {
    if (!hasPurchaseTypes) return null;
    const pt = signType.purchaseTypes.find((p) => p.id === purchaseType);
    return pt?.frameAccessory || null;
  }, [hasPurchaseTypes, signType, purchaseType]);

  // --- Accessory surcharges ---
  const accessorySurcharge = useMemo(() => {
    if (isFrameOnly) return 0; // frame-only pricing handled separately
    // For panel-only, filter out the frame accessory
    const effectiveAccessories = isPanelOnly
      ? accessories.filter((aId) => aId !== frameAccessoryId)
      : accessories;
    return effectiveAccessories.reduce((sum, aId) => {
      return sum + (ACCESSORY_OPTIONS[aId]?.surcharge ?? 0) * activeQty;
    }, 0);
  }, [accessories, activeQty, isFrameOnly, isPanelOnly, frameAccessoryId]);

  // --- Frame-only pricing ---
  const frameOnlyTotalCents = useMemo(() => {
    if (!isFrameOnly || !frameAccessoryId) return 0;
    return (ACCESSORY_OPTIONS[frameAccessoryId]?.surcharge ?? 0) * activeQty;
  }, [isFrameOnly, frameAccessoryId, activeQty]);

  // --- Quote ---
  const quote = useConfiguratorPrice({
    slug: signType.defaultSlug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    options: { doubleSided },
    enabled: !isFrameOnly && widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  // Apply surcharges (accessories + double-sided)
  useEffect(() => {
    const dsExtra = doubleSided ? Math.round(quote.rawSubtotalCents * 0.5) : 0;
    quote.addSurcharge(accessorySurcharge + dsExtra);
  }, [accessorySurcharge, doubleSided, quote.rawSubtotalCents]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = isFrameOnly
    ? activeQty > 0 && frameOnlyTotalCents > 0
    : quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // --- Cart ---
  const buildCartItem = useCallback(() => {
    if (activeQty <= 0) return null;

    // Frame-only mode
    if (isFrameOnly && frameAccessoryId) {
      const frameOpt = ACCESSORY_OPTIONS[frameAccessoryId];
      return {
        id: `${signType.defaultSlug}-frame`,
        name: `${frameOpt?.label || "Frame"} × ${activeQty}`,
        slug: signType.defaultSlug,
        price: frameOpt?.surcharge ?? 0,
        quantity: activeQty,
        options: {
          signType: signTypeId,
          purchaseType: "frame-only",
          accessory: frameOpt?.label,
        },
        forceNewLine: true,
      };
    }

    if (!quote.quoteData) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(1)}" \u00d7 ${heightIn.toFixed(1)}"`
      : signType.sizes[sizeIdx]?.label;
    const accessoryLabels = accessories
      .filter((aId) => !isPanelOnly || aId !== frameAccessoryId)
      .map((aId) => ACCESSORY_OPTIONS[aId]?.label)
      .filter(Boolean);
    return {
      id: signType.defaultSlug,
      name: `${t(`sign.type.${signTypeId}`)} \u2014 ${sizeLabel}`,
      slug: signType.defaultSlug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        signType: signTypeId,
        purchaseType: purchaseType || undefined,
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
  }, [quote.quoteData, quote.subtotalCents, activeQty, signTypeId, widthIn, heightIn, isCustomSize, sizeIdx, signType, materialId, doubleSided, accessories, uploadedFile, t, isFrameOnly, isPanelOnly, frameAccessoryId, purchaseType]);

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
      {/* Purchase Type (A-Frame / Real Estate only) */}
      {hasPurchaseTypes && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            {t("sign.purchaseType")}
          </h3>
          <div className="flex gap-2">
            {signType.purchaseTypes.map((pt) => {
              const isActive = purchaseType === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setPurchaseType(pt.id)}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "border-gray-900 bg-gray-900 text-[#fff]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t(`sign.${pt.id}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Material, Size, Printing (hidden for frame-only) */}
      {!isFrameOnly && (<>
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Material
        </h3>
        <MaterialSwatchGrid
          materials={signType.materials.map((mat) => ({
            id: mat.id,
            label: mat.label,
            subtitle: MATERIAL_HINTS[mat.id] || undefined,
          }))}
          selectedId={materialId}
          onSelect={selectMaterial}
          columns={signType.materials.length <= 3 ? 3 : 4}
        />
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
                  ? "border-gray-900 bg-gray-900 text-[#fff]"
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
                  ? "border-gray-900 bg-gray-900 text-[#fff]"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              Double-Sided
            </button>
          </div>
        </div>
      )}
      </>)}

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
                    ? "border-gray-900 bg-gray-900 text-[#fff]"
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
            max="100"
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

      {/* Accessories (hidden for frame-only; filter frame accessories for panel-only) */}
      {!isFrameOnly && signType.accessories.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Accessories
          </h3>
          <div className="space-y-2">
            {signType.accessories
              .filter((aId) => !isPanelOnly || aId !== frameAccessoryId)
              .map((aId) => {
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

      {/* Upload Artwork (hidden for frame-only) */}
      {!isFrameOnly && <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Artwork <span className="font-normal normal-case text-gray-400">(optional)</span>
        </h3>
        <ArtworkUpload
          uploadedFile={uploadedFile}
          onUploaded={(file) => setUploadedFile(file)}
          onRemove={() => setUploadedFile(null)}
          t={t}
        />
      </div>}

      {/* Price Summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        {isFrameOnly ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>{ACCESSORY_OPTIONS[frameAccessoryId]?.label} × {activeQty}</span>
              <span className="font-medium text-gray-700">{formatCad(frameOnlyTotalCents)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(frameOnlyTotalCents)}</span>
            </div>
            <p className="text-right text-[10px] text-gray-400">Before tax</p>
          </div>
        ) : quote.quoteLoading ? (
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
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(quote.subtotalCents)}</span>
            </div>
            <p className="text-right text-[10px] text-gray-400">Before tax</p>
            {(() => {
              const hints = [];
              if (materialId !== signType.materials[0].id) hints.push(t("configurator.priceIncludesMaterial"));
              if (doubleSided) hints.push(t("configurator.priceIncludesDoubleSided"));
              if (accessorySurcharge > 0) hints.push(t("configurator.priceIncludesAccessories"));
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
