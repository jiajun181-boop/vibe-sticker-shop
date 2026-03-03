"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { trackUploadStarted } from "@/lib/analytics";
import { ArtworkUpload, CustomDimensions, useConfiguratorCart, MaterialSwatchGrid, MobileBottomBar } from "@/components/configurator";
import {
  MIN_SIZE,
  calcPaperLabelPrice,
  stickersPerSheet,
  setupFee,
  CUSTOMER_SHEET_SIZES,
} from "@/lib/pricing/sticker-pricing";
import {
  getCuttingType,
  STICKER_SHAPES,
  LAMINATION_RULES,
  WHITE_INK_MATERIALS,
  TURNAROUND_OPTIONS,
  PRINT_MODES,
  MATERIAL_GROUP_LABELS,
} from "@/lib/sticker-order-config";

const INCH_TO_CM = 2.54;
const PROD_SHEET_W = 12;
const PROD_SHEET_H = 18;
const formatCad = (dollars) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(dollars);

const MATERIAL_HINTS = {
  "white-vinyl": "Durable, waterproof",
  "matte-vinyl": "Non-glare, premium",
  "clear-vinyl": "Transparent background",
  "frosted-vinyl": "Etched glass look",
  "holographic-vinyl": "Rainbow sparkle",
  "3m-reflective": "High visibility",
  "heavy-duty-vinyl": "Extra thick, industrial",
  "gloss-paper": "Bright, indoor",
  "matte-paper": "Smooth, indoor",
  "soft-touch-paper": "Velvety feel",
  "foil-stamping": "Metallic accent",
};

// SVG shape icons (consistent with InlineConfigurator)
function ShapeIcon({ shapeId, className = "h-4 w-4" }) {
  switch (shapeId) {
    case "circle":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg>;
    case "square":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="4" width="16" height="16" rx="1" /></svg>;
    case "rectangle":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="6" width="20" height="12" rx="1" /></svg>;
    case "oval":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><ellipse cx="12" cy="12" rx="10" ry="7" /></svg>;
    case "custom":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    default:
      return null;
  }
}

const SQUARE_PRESETS = [
  { w: 1, h: 1, label: '1" × 1"' },
  { w: 2, h: 2, label: '2" × 2"' },
  { w: 3, h: 3, label: '3" × 3"' },
  { w: 4, h: 4, label: '4" × 4"' },
];
const RECT_PRESETS = [
  { w: 2, h: 3.5, label: '2" × 3.5"' },
  { w: 3, h: 5, label: '3" × 5"' },
  { w: 4, h: 6, label: '4" × 6"' },
];

/**
 * Sticker Sheets configurator — Same Design or Multiple Designs mode.
 * Uses per-sheet pricing model on 12" × 18" sheets.
 *
 * @param {{ mode: "same" | "multiple" }} props
 *   - "same" = sticker-sheets (one repeated design per sheet)
 *   - "multiple" = kiss-cut-sticker-sheets (many different designs per sheet)
 */
export default function SheetsConfigurator({ mode: modeProp = "same" }) {
  const { t } = useTranslation();
  const cutting = useMemo(() => getCuttingType("sheets"), []);
  const mode = modeProp === "multiple" ? "multi" : "same";
  const [sheetSizeId, setSheetSizeId] = useState(CUSTOMER_SHEET_SIZES[0].id);
  const [shapeId, setShapeId] = useState("circle");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(cutting.materials[0].id);
  const [laminationId, setLaminationId] = useState("none");
  const [printMode, setPrintMode] = useState("white_color");
  const [turnaroundId, setTurnaroundId] = useState("standard");
  const [stickerQty, setStickerQty] = useState(100);
  const [customStickerQty, setCustomStickerQty] = useState("");
  const [numDesigns, setNumDesigns] = useState(1);
  const [multiMaxW, setMultiMaxW] = useState("2");
  const [multiMaxH, setMultiMaxH] = useState("2");
  const [uploadedFile, setUploadedFile] = useState(null);

  const customerSheet = useMemo(
    () => CUSTOMER_SHEET_SIZES.find((s) => s.id === sheetSizeId) || CUSTOMER_SHEET_SIZES[0],
    [sheetSizeId]
  );
  const MAX_SHEET_W = customerSheet.w;
  const MAX_SHEET_H = customerSheet.h;
  const MAX_STICKER_DIM = Math.max(MAX_SHEET_W, MAX_SHEET_H);

  // Shape-dependent preset sizes (like InlineConfigurator)
  const shapePresets = useMemo(() => {
    if (shapeId === "custom") return [];
    if (shapeId === "circle" || shapeId === "square") return SQUARE_PRESETS;
    return RECT_PRESETS;
  }, [shapeId]);

  // --- Derived dimensions ---
  const isCustomSize = sizeIdx === -1 || shapePresets.length === 0;
  const isSingleDim = shapeId === "circle" || shapeId === "square";

  function selectShape(id) {
    setShapeId(id);
    setSizeIdx(0);
    setCustomW("");
    setCustomH("");
  }

  const widthIn = useMemo(() => {
    if (mode === "multi") {
      return Math.min(MAX_STICKER_DIM, Math.max(0, parseFloat(multiMaxW) || 0));
    }
    if (!isCustomSize) return shapePresets[sizeIdx]?.w ?? 2;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [mode, isCustomSize, sizeIdx, customW, unit, multiMaxW, MAX_STICKER_DIM]);

  const heightIn = useMemo(() => {
    if (mode === "multi") {
      return Math.min(MAX_STICKER_DIM, Math.max(0, parseFloat(multiMaxH) || 0));
    }
    if (!isCustomSize) return shapePresets[sizeIdx]?.h ?? 2;
    if (isSingleDim) {
      const raw = parseFloat(customW);
      if (!raw || raw <= 0) return 0;
      return unit === "cm" ? raw / INCH_TO_CM : raw;
    }
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [mode, isCustomSize, sizeIdx, customW, customH, unit, isSingleDim, multiMaxH, MAX_STICKER_DIM]);

  const activeStickerQty = useMemo(() => {
    if (customStickerQty !== "") {
      const n = parseInt(customStickerQty, 10);
      return n > 0 ? n : 0;
    }
    return stickerQty;
  }, [stickerQty, customStickerQty]);

  // --- Conditional logic ---
  const isWhiteInkMaterial = WHITE_INK_MATERIALS.includes(materialId);
  const hideLamination = LAMINATION_RULES.hide.includes(materialId);
  const showPaperWarning = LAMINATION_RULES.paperWarning.includes(materialId) && laminationId === "none";

  useEffect(() => {
    if (hideLamination && laminationId !== "none") setLaminationId("none");
  }, [hideLamination, laminationId]);

  const availablePrintModes = useMemo(() => {
    if (!isWhiteInkMaterial) return [];
    return PRINT_MODES;
  }, [isWhiteInkMaterial]);

  // --- Dimension validation (sticker must fit on selected customer sheet) ---
  const dimErrors = useMemo(() => {
    const errs = [];
    if (widthIn > 0 && widthIn < MIN_SIZE) errs.push(`Min ${MIN_SIZE}"`);
    if (heightIn > 0 && heightIn < MIN_SIZE) errs.push(`Min ${MIN_SIZE}"`);
    const stickerMin = Math.min(widthIn, heightIn);
    const stickerMax = Math.max(widthIn, heightIn);
    const sheetMin = Math.min(MAX_SHEET_W, MAX_SHEET_H);
    const sheetMax = Math.max(MAX_SHEET_W, MAX_SHEET_H);
    if (stickerMin > 0 && stickerMax > 0 && (stickerMin > sheetMin || stickerMax > sheetMax)) {
      errs.push(`Sticker too large for ${customerSheet.label} sheet`);
    }
    return errs;
  }, [widthIn, heightIn, MAX_SHEET_W, MAX_SHEET_H, customerSheet.label]);

  // --- Stickers per customer sheet ---
  const perSheet = useMemo(() => {
    if (widthIn <= 0 || heightIn <= 0) return 0;
    return stickersPerSheet(widthIn, heightIn, "rect", customerSheet.w, customerSheet.h);
  }, [widthIn, heightIn, customerSheet]);

  // --- Pricing ---
  const lamType = laminationId === "none" ? "gloss" : laminationId === "matte-lam" ? "matte" : laminationId;
  const turnaround = TURNAROUND_OPTIONS.find((t) => t.id === turnaroundId) || TURNAROUND_OPTIONS[0];

  const pricing = useMemo(() => {
    if (widthIn <= 0 || heightIn <= 0 || activeStickerQty <= 0 || dimErrors.length > 0) {
      return null;
    }
    const matMult = cutting.materials.find((m) => m.id === materialId)?.multiplier || 1;
    const result = calcPaperLabelPrice(widthIn, heightIn, activeStickerQty, "rect", lamType, customerSheet);
    const designFee = mode === "multi" ? setupFee(numDesigns) : 0;
    let subtotal = (result.totalPrice * matMult) + designFee;
    if (turnaroundId === "rush") subtotal *= turnaround.multiplier;
    return {
      ...result,
      totalPrice: Math.round(result.totalPrice * matMult * 100) / 100,
      designFee,
      subtotal: Math.round(subtotal * 100) / 100,
      matMult,
    };
  }, [widthIn, heightIn, activeStickerQty, lamType, numDesigns, dimErrors, turnaroundId, turnaround, mode, customerSheet, materialId, cutting.materials]);

  const canAddToCart = pricing !== null && activeStickerQty > 0;

  // --- Cart ---
  const sizeLabel = useMemo(() => {
    if (mode === "multi") return `${widthIn}" × ${heightIn}"`;
    if (isCustomSize) return `${widthIn.toFixed(widthIn % 1 === 0 ? 0 : 2)}" × ${heightIn.toFixed(heightIn % 1 === 0 ? 0 : 2)}"`;
    return shapePresets[sizeIdx]?.label || "";
  }, [mode, isCustomSize, widthIn, heightIn, sizeIdx]);

  const buildCartItem = useCallback(() => {
    if (!pricing || activeStickerQty <= 0) return null;
    const unitCents = Math.round((pricing.subtotal / pricing.actualQty) * 100);
    return {
      id: `sticker-sheets-${materialId}-${sheetSizeId}-${widthIn}x${heightIn}`,
      name: `Sticker Sheets — ${sizeLabel}`,
      slug: "sticker-sheets",
      price: unitCents,
      quantity: pricing.actualQty,
      options: {
        type: "Sticker Sheets",
        mode: mode === "multi" ? "Multiple Designs" : "Same Design",
        stickerSize: sizeLabel,
        material: materialId,
        materialName: t(`stickerOrder.mat.${materialId}`),
        lamination: laminationId !== "none" ? laminationId : null,
        stickersPerSheet: pricing.perSheet,
        sheetsOrdered: pricing.sheetsNeeded,
        totalStickers: pricing.actualQty,
        sheetSize: customerSheet.label,
        ...(mode === "multi" && { designs: numDesigns }),
        ...(pricing.designFee > 0 && { setupFee: `$${pricing.designFee.toFixed(2)}` }),
        turnaround: turnaroundId,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [pricing, activeStickerQty, materialId, sheetSizeId, widthIn, heightIn, sizeLabel, numDesigns, mode, laminationId, turnaroundId, uploadedFile, t, customerSheet]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: "Sticker sheets added to cart!",
  });

  return (
    <div className="space-y-5">
      {/* Material */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Material</h3>
        {(() => {
          const groups = [];
          const seen = new Set();
          for (const mat of cutting.materials) {
            const g = mat.group || "other";
            if (!seen.has(g)) { seen.add(g); groups.push(g); }
          }
          const hasMultipleGroups = groups.length > 1;

          return groups.map((groupId) => {
            const groupMats = cutting.materials
              .filter((m) => (m.group || "other") === groupId)
              .map((mat) => ({
                id: mat.id,
                label: t(`stickerOrder.mat.${mat.id}`),
                subtitle: MATERIAL_HINTS[mat.id] || undefined,
              }));
            return (
              <div key={groupId} className={hasMultipleGroups ? "mb-3" : ""}>
                {hasMultipleGroups && (
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {MATERIAL_GROUP_LABELS[groupId] || groupId}
                  </p>
                )}
                <MaterialSwatchGrid
                  materials={groupMats}
                  selectedId={materialId}
                  onSelect={setMaterialId}
                  columns={groupMats.length <= 3 ? 3 : 4}
                />
              </div>
            );
          });
        })()}
      </div>

      {/* Sheet Size — customer delivery size */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          {t("stickerOrder.sheets.sheetSize") || "Sheet Size"}
        </h3>
        <p className="mb-2 text-[11px] text-gray-500">
          {t("stickerOrder.sheets.sheetSizeHint") || "Choose the sheet size you\u2019ll receive. Stickers are pre-cut and easy to peel."}
        </p>
        <div className="flex gap-2">
          {CUSTOMER_SHEET_SIZES.map((sz) => (
            <button
              key={sz.id}
              type="button"
              onClick={() => {
                setSheetSizeId(sz.id);
                // Reset sticker size if current size won't fit on new sheet
                if (!isCustomSize && shapePresets[sizeIdx]) {
                  const ps = shapePresets[sizeIdx];
                  const sMin = Math.min(ps.w, ps.h);
                  const sMax = Math.max(ps.w, ps.h);
                  const shMin = Math.min(sz.w, sz.h);
                  const shMax = Math.max(sz.w, sz.h);
                  if (sMin > shMin || sMax > shMax) setSizeIdx(0);
                }
              }}
              className={`flex-1 rounded-xl border-2 px-3 py-3 text-center transition-all ${
                sheetSizeId === sz.id
                  ? "border-gray-900 bg-gray-900 text-[#fff]"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              <span className="block text-sm font-bold">{sz.label}</span>
              <span className={`block text-[10px] ${sheetSizeId === sz.id ? "text-gray-300" : "text-gray-400"}`}>
                {sz.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Same Design: Shape + Size */}
      {mode === "same" && (
        <>
          {/* Shape */}
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{t("stickerOrder.shape")}</h3>
            <div className="flex flex-wrap gap-2">
              {(cutting.shapes || STICKER_SHAPES).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectShape(s.id)}
                  className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                    shapeId === s.id
                      ? "border-gray-900 bg-gray-900 text-[#fff]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <ShapeIcon shapeId={s.id} className={`h-3.5 w-3.5 ${shapeId === s.id ? "text-white" : "text-gray-500"}`} />
                  {t(s.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Size presets + custom */}
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Sticker Size</h3>
            <div className="flex flex-wrap gap-2">
              {shapePresets
                .map((s, idx) => ({ ...s, idx }))
                .filter((s) => {
                  const sMin = Math.min(s.w, s.h);
                  const sMax = Math.max(s.w, s.h);
                  const shMin = Math.min(MAX_SHEET_W, MAX_SHEET_H);
                  const shMax = Math.max(MAX_SHEET_W, MAX_SHEET_H);
                  return sMin <= shMin && sMax <= shMax;
                })
                .map((s) => (
                  <button
                    key={s.idx}
                    type="button"
                    onClick={() => { setSizeIdx(s.idx); setCustomW(""); setCustomH(""); }}
                    className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                      sizeIdx === s.idx
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
                {isSingleDim ? (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">
                      {shapeId === "circle" ? t("stickerOrder.shape.diameter") : t("stickerOrder.shape.sideLength")}
                    </label>
                    <input
                      type="number" min={MIN_SIZE} max={MAX_STICKER_DIM} step="0.25"
                      value={customW}
                      onChange={(e) => setCustomW(e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none"
                    />
                    <span className="text-xs text-gray-400">in</span>
                  </div>
                ) : (
                  <CustomDimensions
                    customW={customW} customH={customH}
                    onChangeW={setCustomW} onChangeH={setCustomH}
                    unit={unit} onChangeUnit={setUnit}
                    minLabel={`${MIN_SIZE}" × ${MIN_SIZE}"`} maxLabel={`${MAX_SHEET_W}" × ${MAX_SHEET_H}"`}
                    dimErrors={dimErrors} t={t}
                  />
                )}
              </div>
            )}
            {perSheet > 0 && (
              <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700">
                {perSheet} stickers per sheet ({customerSheet.label})
              </p>
            )}
          </div>
        </>
      )}

      {/* Multiple Designs: max sticker size + num designs */}
      {mode === "multi" && (
        <>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t("stickerOrder.sheets.maxStickerSize")}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-gray-500">Width</label>
                <input type="number" min="0.5" max={MAX_STICKER_DIM} step="0.25" value={multiMaxW}
                  onChange={(e) => setMultiMaxW(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none"
                />
              </div>
              <span className="mt-4 text-gray-400">×</span>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-gray-500">Height</label>
                <input type="number" min="0.5" max={MAX_STICKER_DIM} step="0.25" value={multiMaxH}
                  onChange={(e) => setMultiMaxH(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none"
                />
              </div>
              <span className="mt-4 text-xs text-gray-400">in</span>
            </div>
            {perSheet > 0 && (
              <p className="mt-2 text-[11px] text-gray-500">
                Each {customerSheet.label} sheet accommodates {perSheet} stickers of {widthIn}&quot;×{heightIn}&quot;
              </p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t("stickerOrder.sheets.numDesigns")}
            </h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => (
                <button
                  key={n} type="button" onClick={() => setNumDesigns(n)}
                  className={`h-7 min-w-[28px] rounded px-1.5 text-xs font-bold transition-all ${
                    numDesigns === n ? "bg-gray-900 text-[#fff]" : "border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {numDesigns > 1 && (
              <p className="mt-1 text-[10px] text-gray-400">+${setupFee(numDesigns)} setup fee</p>
            )}
            <p className="mt-2 text-[11px] text-gray-500">{t("stickerOrder.sheets.multiHint")}</p>
          </div>
        </>
      )}

      {/* White ink */}
      {isWhiteInkMaterial && availablePrintModes.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{t("stickerOrder.printMode.label")}</h3>
          <div className="flex flex-wrap gap-2">
            {availablePrintModes.map((m) => (
              <button key={m.id} type="button" onClick={() => setPrintMode(m.id)}
                className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                  printMode === m.id ? "border-gray-900 bg-gray-900 text-[#fff]" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {t(m.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lamination */}
      {!hideLamination && cutting.lamination && cutting.lamination.length > 1 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Lamination</h3>
          <div className="flex flex-wrap gap-2">
            {cutting.lamination.map((lam) => (
              <button key={lam.id} type="button" onClick={() => setLaminationId(lam.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  laminationId === lam.id
                    ? "border-gray-900 bg-gray-900 text-[#fff]"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                }`}
              >
                {lam.id === "none" ? "No Lamination" : lam.id === "gloss" ? "Gloss" : "Matte"}
              </button>
            ))}
          </div>
          {showPaperWarning && (
            <p className="mt-2 text-[11px] text-amber-600">{t("stickerOrder.lamination.paperWarning")}</p>
          )}
        </div>
      )}

      {/* Quantity (Stickers) */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Quantity
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          {cutting.quantities.map((q) => (
            <button key={q} type="button"
              onClick={() => { setStickerQty(q); setCustomStickerQty(""); }}
              className={`flex-shrink-0 rounded-full border-2 px-3 py-2 text-xs font-bold transition-all ${
                customStickerQty === "" && stickerQty === q
                  ? "border-gray-900 bg-gray-900 text-[#fff]"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {q.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input type="number" min="1" max="999999" value={customStickerQty}
            onChange={(e) => setCustomStickerQty(e.target.value)}
            placeholder="Custom qty"
            className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none"
          />
          <span className="text-[11px] text-gray-400">stickers</span>
        </div>
      </div>

      {/* Delivery Summary */}
      {pricing && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <div className="text-[11px] text-emerald-800">
              <p className="font-semibold">
                You&apos;ll receive {pricing.actualQty.toLocaleString()} stickers on {pricing.sheetsNeeded} sheet{pricing.sheetsNeeded !== 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-emerald-600">
                {pricing.perSheet} stickers/sheet &mdash; Sheet size: {customerSheet.label} &mdash; Pre-cut, easy to peel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Turnaround */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{t("stickerOrder.turnaround.label")}</h3>
        <div className="flex gap-2">
          {TURNAROUND_OPTIONS.map((opt) => {
            const isActive = turnaroundId === opt.id;
            return (
              <button key={opt.id} type="button" onClick={() => setTurnaroundId(opt.id)}
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-center transition-all ${
                  isActive ? "border-gray-900 bg-gray-900 text-[#fff]" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                <span className="block text-xs font-bold">{t(opt.label)}</span>
                <span className={`block text-[10px] ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                  {t(opt.desc)}
                  {opt.id === "rush" && <span className="ml-1 font-bold text-amber-400">+50%</span>}
                </span>
              </button>
            );
          })}
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
        <p className="mt-1.5 text-[10px] text-gray-400">{t("stickerOrder.uploadAfterCheckout")}</p>
      </div>

      {/* Price Summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        {pricing ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs text-gray-500">
              <span>{pricing.sheetsNeeded} sheets ({customerSheet.label})</span>
              <span className="font-medium text-gray-700">{formatCad(pricing.totalPrice)}</span>
            </div>
            <div className="flex items-baseline justify-between text-[11px] text-gray-400">
              <span>{pricing.actualQty.toLocaleString()} stickers ({pricing.perSheet}/sheet)</span>
              <span>{formatCad(pricing.subtotal / pricing.actualQty)}/sticker</span>
            </div>
            {pricing.cuttingFee > 0 && (
              <div className="flex items-baseline justify-between text-[11px] text-gray-400">
                <span>Cutting &amp; finishing</span>
                <span>included</span>
              </div>
            )}
            {pricing.designFee > 0 && (
              <div className="flex items-baseline justify-between text-xs text-gray-500">
                <span>Multi-design setup ({numDesigns} designs)</span>
                <span className="font-medium text-gray-700">{formatCad(pricing.designFee)}</span>
              </div>
            )}
            {turnaroundId === "rush" && (
              <div className="flex items-baseline justify-between text-xs text-amber-600">
                <span>Rush surcharge</span>
                <span className="font-medium">+50%</span>
              </div>
            )}
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(pricing.subtotal)}</span>
            </div>
            <p className="text-right text-[10px] text-gray-400">Before tax</p>
          </div>
        ) : (
          <p className="text-center text-xs text-gray-400">Select options for pricing</p>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-2">
        <button type="button" onClick={handleAddToCart} disabled={!canAddToCart}
          className={`w-full rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
            canAddToCart ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800 active:scale-[0.98]" : "cursor-not-allowed bg-gray-200 text-gray-400"
          }`}
        >
          Add to Cart
        </button>
        <button type="button" onClick={handleBuyNow} disabled={!canAddToCart || buyNowLoading}
          className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
            canAddToCart && !buyNowLoading ? "border-gray-900 bg-gray-900 text-[#fff] hover:bg-gray-800 active:scale-[0.98]" : "cursor-not-allowed border-gray-200 text-gray-400"
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

      {/* Mobile bottom bar with live price */}
      <MobileBottomBar
        quoteLoading={false}
        hasQuote={!!pricing}
        totalCents={pricing ? Math.round(pricing.subtotal * 100) : 0}
        quantity={pricing?.actualQty || 0}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
      />
    </div>
  );
}
