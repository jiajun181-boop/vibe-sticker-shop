"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { trackUploadStarted } from "@/lib/analytics";
import { ArtworkUpload, CustomDimensions, useConfiguratorCart } from "@/components/configurator";
import {
  SHEET_QTY_PRESETS,
  MIN_SIZE,
  calcPaperLabelPrice,
  stickersPerSheet,
  setupFee,
} from "@/lib/pricing/sticker-pricing";

const INCH_TO_CM = 2.54;
const HST_RATE = 0.13;
const MAX_SHEET_SIZE = 12; // max sticker dimension on 13×19 sheet

const formatCad = (dollars) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(dollars);

const LAMINATION_OPTIONS = [
  { id: "gloss", label: "Gloss", surcharge: null },
  { id: "matte", label: "Matte", surcharge: null },
  { id: "soft_touch", label: "Soft Touch", surcharge: null },
  { id: "foil", label: "Foil Stamping", surcharge: null },
];

const SHEET_SIZES = [
  { w: 1, h: 1, label: '1"×1"' },
  { w: 2, h: 2, label: '2"×2"' },
  { w: 2, h: 3.5, label: '2"×3.5"' },
  { w: 3, h: 3, label: '3"×3"' },
  { w: 4, h: 4, label: '4"×4"' },
];

/**
 * Sticker Sheets configurator — uses per-sheet pricing model.
 * Shows stickers-per-sheet calculation and prices by total sticker quantity.
 */
export default function SheetsConfigurator() {
  const { t } = useTranslation();

  // --- State ---
  const [sizeIdx, setSizeIdx] = useState(1); // default 2×2
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [lamination, setLamination] = useState("gloss");
  const [quantity, setQuantity] = useState(100);
  const [customQty, setCustomQty] = useState("");
  const [numDesigns, setNumDesigns] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);

  // --- Derived dimensions ---
  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return SHEET_SIZES[sizeIdx]?.w ?? 2;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return SHEET_SIZES[sizeIdx]?.h ?? 2;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, customH, unit]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // --- Dimension validation ---
  const dimErrors = useMemo(() => {
    const errs = [];
    if (widthIn > 0 && widthIn < MIN_SIZE) errs.push(`Min ${MIN_SIZE}"`);
    if (heightIn > 0 && heightIn < MIN_SIZE) errs.push(`Min ${MIN_SIZE}"`);
    if (widthIn > MAX_SHEET_SIZE) errs.push(`Max ${MAX_SHEET_SIZE}"`);
    if (heightIn > MAX_SHEET_SIZE) errs.push(`Max ${MAX_SHEET_SIZE}"`);
    return errs;
  }, [widthIn, heightIn]);

  // --- Stickers per sheet ---
  const perSheet = useMemo(() => {
    if (widthIn <= 0 || heightIn <= 0) return 0;
    return stickersPerSheet(widthIn, heightIn, "rect");
  }, [widthIn, heightIn]);

  // --- Pricing ---
  const pricing = useMemo(() => {
    if (widthIn <= 0 || heightIn <= 0 || activeQty <= 0 || dimErrors.length > 0) {
      return null;
    }
    const result = calcPaperLabelPrice(widthIn, heightIn, activeQty, "rect", lamination);
    const designFee = setupFee(numDesigns);
    const subtotal = result.totalPrice + designFee;
    const tax = subtotal * HST_RATE;
    return {
      ...result,
      designFee,
      subtotal,
      tax,
      total: subtotal + tax,
    };
  }, [widthIn, heightIn, activeQty, lamination, numDesigns, dimErrors]);

  const canAddToCart = pricing !== null && activeQty > 0;

  // --- Cart ---
  const sizeLabel = useMemo(() => {
    if (isCustomSize) {
      return `${widthIn.toFixed(widthIn % 1 === 0 ? 0 : 2)}" × ${heightIn.toFixed(heightIn % 1 === 0 ? 0 : 2)}"`;
    }
    return SHEET_SIZES[sizeIdx]?.label || "";
  }, [isCustomSize, widthIn, heightIn, sizeIdx]);

  const lamLabel = LAMINATION_OPTIONS.find((l) => l.id === lamination)?.label || lamination;

  const buildCartItem = useCallback(() => {
    if (!pricing || activeQty <= 0) return null;
    const unitCents = Math.round((pricing.totalPrice / pricing.actualQty) * 100);
    return {
      id: `sticker-sheets-${lamination}-${widthIn}x${heightIn}`,
      name: `Sticker Sheets — ${sizeLabel} (${lamLabel})`,
      slug: "sticker-sheets",
      price: unitCents,
      quantity: pricing.actualQty,
      options: {
        type: "Sticker Sheets",
        stickerSize: sizeLabel,
        lamination: lamLabel,
        stickersPerSheet: perSheet,
        sheetsOrdered: pricing.sheetsNeeded,
        totalStickers: pricing.actualQty,
        designs: numDesigns,
        ...(numDesigns > 1 && { setupFee: `$${setupFee(numDesigns).toFixed(2)}` }),
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [pricing, activeQty, lamination, widthIn, heightIn, sizeLabel, lamLabel, perSheet, numDesigns, uploadedFile]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: "Sticker sheets added to cart!",
  });

  return (
    <div className="space-y-5">
      {/* ── Step 1: Sticker Size ── */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          1. Sticker Size
        </h3>
        <div className="flex flex-wrap gap-2">
          {SHEET_SIZES.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setSizeIdx(i); setCustomW(""); setCustomH(""); }}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                sizeIdx === i
                  ? "border-gray-900 bg-gray-900 text-[#fff]"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setSizeIdx(-1); setCustomW(""); setCustomH(""); }}
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
              minLabel={`${MIN_SIZE}" × ${MIN_SIZE}"`}
              maxLabel={`${MAX_SHEET_SIZE}" × ${MAX_SHEET_SIZE}"`}
              dimErrors={dimErrors}
              t={t}
            />
          </div>
        )}
        {/* Stickers per sheet info */}
        {perSheet > 0 && (
          <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700">
            {perSheet} stickers per sheet (13&quot; × 19&quot; sheet)
          </p>
        )}
      </div>

      {/* ── Step 2: Lamination ── */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          2. Lamination
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {LAMINATION_OPTIONS.map((lam) => {
            const isActive = lamination === lam.id;
            return (
              <button
                key={lam.id}
                type="button"
                onClick={() => setLamination(lam.id)}
                className={`relative flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all ${
                  isActive
                    ? "border-gray-900 bg-gray-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                {isActive && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900">
                    <svg className="h-2.5 w-2.5 text-[#fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
                <span className="text-xs font-bold text-gray-800">{lam.label}</span>
                {lam.surcharge && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                    {lam.surcharge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 3: Quantity (total stickers) ── */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          3. Total Stickers
        </h3>
        <div className="flex flex-wrap gap-2">
          {SHEET_QTY_PRESETS.retail.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => { setQuantity(q); setCustomQty(""); }}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                customQty === "" && quantity === q
                  ? "border-gray-900 bg-gray-900 text-[#fff]"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SHEET_QTY_PRESETS.wholesale.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => { setQuantity(q); setCustomQty(""); }}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                customQty === "" && quantity === q
                  ? "border-gray-900 bg-gray-900 text-[#fff]"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {q >= 1000 ? `${q / 1000}K` : q}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="999999"
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            placeholder="Custom qty"
            className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
          />
          {pricing && (
            <span className="text-[11px] text-gray-500">
              = {pricing.sheetsNeeded} sheet{pricing.sheetsNeeded !== 1 ? "s" : ""} ({pricing.actualQty} stickers)
            </span>
          )}
        </div>
        {/* Multi-design */}
        <div className="mt-3 flex items-center gap-2">
          <label className="text-[11px] font-medium text-gray-500">Designs:</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNumDesigns(n)}
                className={`h-7 w-7 rounded text-xs font-bold transition-all ${
                  numDesigns === n
                    ? "bg-gray-900 text-[#fff]"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {numDesigns > 1 && (
            <span className="text-[10px] text-gray-400">+${setupFee(numDesigns)} setup</span>
          )}
        </div>
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
          onBegin={() => trackUploadStarted({ slug: "sticker-sheets" })}
          t={t}
        />
      </div>

      {/* ── Price Summary ── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        {pricing ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>{pricing.sheetsNeeded} sheets × {formatCad(pricing.totalPrice / pricing.sheetsNeeded)}/sheet</span>
              <span className="font-medium text-gray-700">{formatCad(pricing.totalPrice)}</span>
            </div>
            <div className="flex items-baseline justify-between text-[11px] text-gray-400">
              <span>{pricing.actualQty} stickers total ({perSheet}/sheet)</span>
              <span>{formatCad(pricing.unitPrice)}/sticker</span>
            </div>
            {pricing.designFee > 0 && (
              <div className="flex items-baseline justify-between text-xs text-gray-500">
                <span>Multi-design setup ({numDesigns} designs)</span>
                <span className="font-medium text-gray-700">{formatCad(pricing.designFee)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-700">{formatCad(pricing.subtotal)}</span>
            </div>
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>HST (13%)</span>
              <span>{formatCad(pricing.tax)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(pricing.total)}</span>
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
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <span>Secure checkout</span>
        <span className="text-gray-300">|</span>
        <span>Free shipping $99+</span>
        <span className="text-gray-300">|</span>
        <span>Free proof</span>
      </div>
    </div>
  );
}
