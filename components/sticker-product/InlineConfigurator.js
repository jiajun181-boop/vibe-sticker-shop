"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validateDimensions } from "@/lib/materialLimits";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getCuttingType,
  resolveProductSlug,
  LAMINATION_RULES,
  WHITE_INK_MATERIALS,
  FOIL_SUB_OPTIONS,
  TURNAROUND_OPTIONS,
  PRINT_MODES,
  CUSTOM_SHAPE_SURCHARGE,
  MATERIAL_GROUP_LABELS,
  RECOMMENDED,
  MATERIAL_DETAILS,
  LAMINATION_DETAILS,
  PRINT_MODE_DETAILS,
  TURNAROUND_DETAILS,
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
  MobileBottomBar,
  StepCard,
  OptionCard,
  OptionGrid,
  InfoPopover,
  useStepScroll,
} from "@/components/configurator";

const INCH_TO_CM = 2.54;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

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
  "clear-static-cling": "No adhesive, reusable",
  "frosted-static-cling": "No adhesive, frosted",
  "white-static-cling": "No adhesive, opaque",
};

// Map frontend material IDs → API material alias + implicit lamination
const MATERIAL_API_MAP = {
  "white-vinyl": { alias: "white-vinyl", lam: null },
  "matte-vinyl": { alias: "matte-vinyl", lam: "matte" },
  "clear-vinyl": { alias: "clear-vinyl", lam: null },
  "frosted-vinyl": { alias: "frosted-vinyl", lam: null },
  "holographic-vinyl": { alias: "holographic-vinyl", lam: null },
  "3m-reflective": { alias: "3m-reflective", lam: null },
  "heavy-duty-vinyl": { alias: "heavy-duty-vinyl", lam: null },
  "gloss-paper": { alias: "gloss-paper", lam: null },
  "matte-paper": { alias: "matte-paper", lam: null },
  "soft-touch-paper": { alias: "soft-touch-paper", lam: null },
  "foil-stamping": { alias: "foil-stamping", lam: null },
  "clear-static-cling": { alias: "clear-static-cling", lam: null },
  "frosted-static-cling": { alias: "frosted-static-cling", lam: null },
  "white-static-cling": { alias: "white-static-cling", lam: null },
  // Legacy / other cutting types
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

// SVG shape icons
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

/** Summary row for the OrderSummaryCard */
function SummaryRow({ label, value, isRecommended, priceKey, t }) {
  const isBase = !priceKey || priceKey === "base" || priceKey === "minus15";
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="flex items-center gap-1.5 font-medium text-gray-900">
        {value}
        {isRecommended ? (
          <span className="rounded-full bg-green-100 px-1.5 py-px text-[9px] font-bold text-green-700">
            {t("option.summary.recommended")}
          </span>
        ) : !isBase ? (
          <span className="rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-bold text-amber-700">
            {t(`option.priceDiff.${priceKey}`)}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** Confirmation card showing all selected options with recommended/premium badges */
function OrderSummaryCard({ materialId, laminationId, printMode, turnaroundId, isWhiteInkMaterial, hideLamination, cutting, showPaperWarning, t }) {
  const matDet = MATERIAL_DETAILS[materialId];
  const lamDet = LAMINATION_DETAILS[laminationId];
  const pmDet = PRINT_MODE_DETAILS[printMode];
  const taDet = TURNAROUND_DETAILS[turnaroundId];

  // Collect non-base price impacts
  const impacts = [];
  if (matDet && matDet.priceKey !== "base" && matDet.priceKey !== "minus15") {
    impacts.push({ step: t("step.material"), diff: t(`option.priceDiff.${matDet.priceKey}`) });
  }
  if (!hideLamination && cutting.lamination?.length > 1 && lamDet && lamDet.priceKey !== "base") {
    impacts.push({ step: t("step.lamination"), diff: t(`option.priceDiff.${lamDet.priceKey}`) });
  }
  if (isWhiteInkMaterial && pmDet && pmDet.priceKey !== "base") {
    impacts.push({ step: t("step.printMode"), diff: t(`option.priceDiff.${pmDet.priceKey}`) });
  }
  if (taDet && taDet.priceKey !== "base") {
    impacts.push({ step: t("step.turnaround"), diff: t(`option.priceDiff.${taDet.priceKey}`) });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
      <h3 className="text-sm font-bold text-gray-900">{t("option.summary.title")}</h3>

      <SummaryRow
        label={t("step.material")}
        value={t(`stickerOrder.mat.${materialId}`)}
        isRecommended={materialId === RECOMMENDED.material}
        priceKey={matDet?.priceKey}
        t={t}
      />

      {!hideLamination && cutting.lamination?.length > 1 && (
        <SummaryRow
          label={t("step.lamination")}
          value={laminationId === "none" ? t("stickerOrder.lam.none.desc") : laminationId === "gloss" ? "Gloss" : "Matte"}
          isRecommended={laminationId === RECOMMENDED.lamination}
          priceKey={lamDet?.priceKey}
          t={t}
        />
      )}

      {isWhiteInkMaterial && (
        <SummaryRow
          label={t("step.printMode")}
          value={t(`stickerOrder.printMode.${printMode === "color_only" ? "colorOnly" : printMode === "white_only" ? "whiteOnly" : printMode === "color_white_color" ? "colorWhiteColor" : "whiteColor"}`)}
          isRecommended={printMode === RECOMMENDED.printMode}
          priceKey={pmDet?.priceKey}
          t={t}
        />
      )}

      <SummaryRow
        label={t("step.turnaround")}
        value={t(`stickerOrder.turnaround.${turnaroundId}`)}
        isRecommended={turnaroundId === RECOMMENDED.turnaround}
        priceKey={taDet?.priceKey}
        t={t}
      />

      {showPaperWarning && (
        <p className="flex items-center gap-1 text-[10px] text-amber-600">
          <span>{"\u26A0\uFE0F"}</span> {t("option.conflict.paperNoLam")}
        </p>
      )}

      {/* Price impact sources */}
      <div className="border-t border-gray-100 pt-2 mt-2">
        <p className="text-[10px] font-semibold text-gray-500">{t("option.summary.priceImpact")}</p>
        {impacts.length === 0 ? (
          <p className="text-[10px] text-green-600">{t("option.summary.noSurcharge")}</p>
        ) : (
          <div className="mt-1 space-y-0.5">
            {impacts.map((imp, i) => (
              <p key={i} className="flex justify-between text-[10px]">
                <span className="text-gray-500">{imp.step}</span>
                <span className="font-bold text-amber-700">{imp.diff}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline configurator for the rich sticker product page right column.
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
  const [shapeId, setShapeId] = useState("circle");
  const [foilColor, setFoilColor] = useState("gold");
  const [printMode, setPrintMode] = useState("white_color");
  const [turnaroundId, setTurnaroundId] = useState("standard");
  const [windId, setWindId] = useState("any");

  // --- Shape-dependent preset sizes ---
  const SQUARE_PRESETS = useMemo(() => [
    { label: '2" × 2"', w: 2, h: 2 },
    { label: '3" × 3"', w: 3, h: 3 },
    { label: '4" × 4"', w: 4, h: 4 },
  ], []);
  const RECT_PRESETS = useMemo(() => [
    { label: '2" × 3.5"', w: 2, h: 3.5 },
    { label: '3" × 5"', w: 3, h: 5 },
    { label: '4" × 6"', w: 4, h: 6 },
  ], []);

  const shapePresets = useMemo(() => {
    if (!cutting.shapes) return cutting.sizes; // No shapes? Use default sizes
    if (shapeId === "custom") return []; // Custom shape: no presets
    if (shapeId === "circle" || shapeId === "square") return SQUARE_PRESETS;
    return RECT_PRESETS; // rectangle, oval
  }, [shapeId, cutting.shapes, cutting.sizes, SQUARE_PRESETS, RECT_PRESETS]);

  // --- Derived: shape-dependent dimensions ---
  const isCustomSize = sizeIdx === -1 || shapePresets.length === 0;
  const isSingleDimShape = shapeId === "circle" || shapeId === "square";

  const widthIn = useMemo(() => {
    if (!isCustomSize && shapePresets[sizeIdx]) return shapePresets[sizeIdx].w;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    const inches = unit === "cm" ? raw / INCH_TO_CM : raw;
    return inches;
  }, [isCustomSize, sizeIdx, shapePresets, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize && shapePresets[sizeIdx]) return shapePresets[sizeIdx].h;
    // For circle/square, height = width
    if (isSingleDimShape) {
      const raw = parseFloat(customW);
      if (!raw || raw <= 0) return 0;
      return unit === "cm" ? raw / INCH_TO_CM : raw;
    }
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, shapePresets, customW, customH, unit, isSingleDimShape]);

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

  // --- Conditional logic ---
  const isStaticCling = materialId.includes("static-cling") || materialId.includes("cling");
  const isFoil = materialId === "foil-stamping";
  const isWhiteInkMaterial = WHITE_INK_MATERIALS.includes(materialId);
  const isHolographic = materialId === "holographic-vinyl";
  const hideLamination = LAMINATION_RULES.hide.includes(materialId);
  const showPaperWarning = LAMINATION_RULES.paperWarning.includes(materialId) && laminationId === "none";
  const isCustomShape = shapeId === "custom";

  // Reset lamination when it should be hidden
  useEffect(() => {
    if (hideLamination && laminationId !== "none") {
      setLaminationId("none");
    }
  }, [hideLamination, laminationId]);

  // Available print modes (holographic: no C+W+C)
  const availablePrintModes = useMemo(() => {
    if (!isWhiteInkMaterial) return [];
    if (isHolographic) return PRINT_MODES.filter((m) => m.id !== "color_white_color");
    return PRINT_MODES;
  }, [isWhiteInkMaterial, isHolographic]);

  // Reset print mode when material changes
  useEffect(() => {
    if (!isWhiteInkMaterial) {
      setPrintMode("white_color");
    } else if (isHolographic && printMode === "color_white_color") {
      setPrintMode("white_color");
    }
  }, [isWhiteInkMaterial, isHolographic, printMode]);

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
  const turnaround = TURNAROUND_OPTIONS.find((t) => t.id === turnaroundId) || TURNAROUND_OPTIONS[0];

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
      ...(isCustomShape && { shapeSurcharge: CUSTOM_SHAPE_SURCHARGE }),
      ...(isWhiteInkMaterial && { printMode }),
      ...(turnaroundId === "rush" && { turnaroundMultiplier: turnaround.multiplier }),
      ...(isFoil && { foilColor }),
    },
    enabled: widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  // --- Wind direction surcharge (roll-labels only) ---
  const windMultiplier = cutting.windDirections
    ? (cutting.windDirections.find((w) => w.id === windId)?.surchargeMultiplier ?? 1.0)
    : 1.0;
  const adjustedSubtotalCents = Math.round((quote.subtotalCents || 0) * windMultiplier);
  const adjustedUnitCents = Math.round((quote.unitCents || 0) * windMultiplier);

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // --- Cart ---
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(2)}" × ${heightIn.toFixed(2)}"`
      : shapePresets[sizeIdx]?.label || `${widthIn}" × ${heightIn}"`;
    return {
      id: slug,
      name: `${t(`stickerOrder.type.${cuttingTypeId}`)} — ${sizeLabel}`,
      slug,
      price: adjustedUnitCents,
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
        ...(isFoil && { foilColor }),
        ...(isWhiteInkMaterial && { printMode }),
        turnaround: turnaroundId,
        windDirection: cutting.windDirections ? windId : undefined,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, adjustedUnitCents, activeQty, cuttingTypeId, widthIn, heightIn, isCustomSize, sizeIdx, shapePresets, slug, materialId, lamination, shapeId, windId, uploadedFile, t, isFoil, foilColor, isWhiteInkMaterial, printMode, turnaroundId, cutting]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("stickerOrder.addedToCart"),
  });

  // --- Handlers ---
  function selectSize(idx) {
    setSizeIdx(idx);
    setCustomW("");
    setCustomH("");
    trackOptionChange({ slug, option: "size", value: idx === -1 ? "custom" : shapePresets[idx]?.label, quantity: activeQty });
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
    // Reset size to first preset (or custom mode for custom shape)
    if (id === "custom") {
      setSizeIdx(-1);
    } else {
      setSizeIdx(0);
      setCustomW("");
      setCustomH("");
    }
    trackOptionChange({ slug, option: "shape", value: id, quantity: activeQty });
  }
  function selectWind(id) {
    setWindId(id);
    trackOptionChange({ slug, option: "windDirection", value: id, quantity: activeQty });
  }

  // Unit price display
  const unitPriceLabel = adjustedUnitCents > 0 ? `${formatCad(adjustedUnitCents)}/ea` : null;

  // --- Dynamic step numbering: hidden steps don't count ---
  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "material", vis: true },
      { id: "foil", vis: isFoil },
      { id: "shape", vis: !!cutting.shapes },
      { id: "size", vis: true },
      { id: "printMode", vis: isWhiteInkMaterial && availablePrintModes.length > 0 },
      { id: "wind", vis: !!cutting.windDirections },
      { id: "quantity", vis: true },
      { id: "lamination", vis: !hideLamination && cutting.lamination?.length > 1 },
      { id: "turnaround", vis: true },
      { id: "artwork", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [isFoil, cutting, isWhiteInkMaterial, availablePrintModes.length, hideLamination]);

  const stepNum = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);

  // --- Accordion: only one step open at a time, default all collapsed ---
  const [activeStepId, setActiveStepId] = useState(null);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);
  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => prev === "step-" + id ? null : "step-" + id);

  // Quantity dropdown threshold: > 6 items → <select>, otherwise pill buttons
  const useQtyDropdown = cutting.quantities.length > 6;

  // --- summaryText helpers ---
  const sizeSummary = isCustomSize
    ? (customW && customH ? `${customW}" × ${customH}"` : customW ? `${customW}"` : "")
    : shapePresets[sizeIdx]?.label || "";

  return (
    <div className="space-y-4">
      {/* 1. Material */}
      <StepCard
        stepNumber={stepNum("material")}
        title={t("step.material")}
        hint={t("step.material.hint")}
        summaryText={t(`stickerOrder.mat.${materialId}`)}
        stepId="step-material"
        open={isStepOpen("material")}
        onToggle={() => toggleStep("material")}
        alwaysOpen
      >
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
                  onSelect={(id) => { selectMaterial(id); advanceStep("step-material"); }}
                  columns={groupMats.length <= 3 ? 3 : 4}
                  recommendedId={RECOMMENDED.material}
                  getDetailRows={(matId) => {
                    const det = MATERIAL_DETAILS[matId];
                    if (!det) return undefined;
                    return [
                      { label: t("option.price"), text: t(`option.priceDiff.${det.priceKey}`) },
                      { label: t("option.useCase"), text: t(`option.useCase.${det.useKey}`) },
                      { label: t("option.durability"), text: t(`option.durability.${det.durKey}`) },
                    ];
                  }}
                />
              </div>
            );
          });
        })()}
        {isStaticCling && (
          <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700">
            {t("stickerOrder.staticClingHint")}
          </p>
        )}
      </StepCard>

      {/* 2. Foil Color */}
      <StepCard
        stepNumber={stepNum("foil")}
        title={t("step.foilColor")}
        hint={t("step.foilColor.hint")}
        summaryText={t(`stickerOrder.foil.${foilColor}`)}
        visible={isFoil}
        stepId="step-foil"
        open={isStepOpen("foil")}
        onToggle={() => toggleStep("foil")}
      >
        <OptionGrid columns={3} label={t("step.foilColor")}>
          {FOIL_SUB_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              label={t(opt.label)}
              selected={foilColor === opt.id}
              onSelect={() => { setFoilColor(opt.id); advanceStep("step-foil"); }}
            />
          ))}
        </OptionGrid>
      </StepCard>

      {/* 3. Shape */}
      <StepCard
        stepNumber={stepNum("shape")}
        title={t("step.shape")}
        hint={t("step.shape.hint")}
        summaryText={cutting.shapes ? t(`stickerOrder.shape.${shapeId}`) : undefined}
        visible={!!cutting.shapes}
        stepId="step-shape"
        open={isStepOpen("shape")}
        onToggle={() => toggleStep("shape")}
        alwaysOpen
      >
        <OptionGrid columns={3} label={t("step.shape")}>
          {cutting.shapes?.map((s) => (
            <OptionCard
              key={s.id}
              label={t(s.label)}
              selected={shapeId === s.id}
              onSelect={() => { selectShape(s.id); advanceStep("step-shape"); }}
              icon={<ShapeIcon shapeId={s.id} className={`h-4 w-4 ${shapeId === s.id ? "text-teal-600" : "text-gray-500"}`} />}
            />
          ))}
        </OptionGrid>
        {isCustomShape && (
          <div className="mt-2 space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">+15%</span>
              {t("stickerOrder.shape.customHint")}
            </p>
          </div>
        )}
      </StepCard>

      {/* 4. Size */}
      <StepCard
        stepNumber={stepNum("size")}
        title={t("step.size")}
        hint={t("step.size.hint")}
        summaryText={sizeSummary}
        stepId="step-size"
        open={isStepOpen("size")}
        onToggle={() => toggleStep("size")}
        alwaysOpen
      >
        <OptionGrid columns={3} label={t("step.size")}>
          {shapePresets.map((s, i) => (
            <OptionCard
              key={i}
              label={s.label}
              selected={!isCustomSize && sizeIdx === i}
              onSelect={() => { selectSize(i); advanceStep("step-size"); }}
            />
          ))}
          {shapePresets.length > 0 && (
            <OptionCard
              label={t("stickerOrder.custom")}
              selected={isCustomSize}
              onSelect={() => selectSize(-1)}
              className={!isCustomSize ? "border-dashed" : ""}
            />
          )}
        </OptionGrid>
        {isCustomSize && (
          <div className="mt-3">
            {isSingleDimShape ? (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">
                  {shapeId === "circle" ? t("stickerOrder.shape.diameter") : t("stickerOrder.shape.sideLength")}
                </label>
                <input
                  type="number"
                  min={cutting.minIn}
                  max={cutting.maxW}
                  step="0.25"
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                  className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                  placeholder={`${cutting.minIn}" – ${cutting.maxW}"`}
                />
                <span className="text-xs text-gray-400">in</span>
                {dimErrors.length > 0 && (
                  <span className="text-[11px] text-red-500">{dimErrors[0]}</span>
                )}
              </div>
            ) : (
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
            )}
          </div>
        )}
      </StepCard>

      {/* 5. Print Mode */}
      <StepCard
        stepNumber={stepNum("printMode")}
        title={t("step.printMode")}
        hint={t("step.printMode.hint")}
        summaryText={t(`stickerOrder.printMode.${printMode === "color_only" ? "colorOnly" : printMode === "white_only" ? "whiteOnly" : printMode === "color_white_color" ? "colorWhiteColor" : "whiteColor"}`)}
        visible={isWhiteInkMaterial && availablePrintModes.length > 0}
        stepId="step-printMode"
        open={isStepOpen("printMode")}
        onToggle={() => toggleStep("printMode")}
      >
        <OptionGrid columns={2} label={t("step.printMode")}>
          {availablePrintModes.map((mode) => {
            const det = PRINT_MODE_DETAILS[mode.id];
            return (
              <OptionCard
                key={mode.id}
                label={t(mode.label)}
                description={t(`option.explain.pm.${mode.id}`)}
                selected={printMode === mode.id}
                onSelect={() => { setPrintMode(mode.id); advanceStep("step-printMode"); }}
                recommended={mode.id === RECOMMENDED.printMode}
                detailRows={det ? [
                  { label: t("option.price"), text: t(`option.priceDiff.${det.priceKey}`) },
                  { label: t("option.useCase"), text: t(`option.useCase.${det.useKey}`) },
                ] : undefined}
              />
            );
          })}
        </OptionGrid>
      </StepCard>

      {/* 6. Wind Direction (roll-labels only) */}
      <StepCard
        stepNumber={stepNum("wind")}
        title={<>{t("stickerOrder.wind")} <InfoPopover text={t("stickerOrder.wind.tooltipFee")} className="ml-1" /></>}
        hint={t("stickerOrder.wind.hint")}
        summaryText={t(`stickerOrder.wind.${windId}`)}
        visible={!!cutting.windDirections}
        stepId="step-wind"
        open={isStepOpen("wind")}
        onToggle={() => toggleStep("wind")}
      >
        {/* "Doesn't Matter" — full-width default */}
        {(() => {
          const anyOpt = cutting.windDirections?.find((w) => w.id === "any");
          if (!anyOpt) return null;
          const isActive = windId === "any";
          return (
            <OptionCard
              fullWidth
              label={t(anyOpt.label)}
              description={t(anyOpt.desc)}
              selected={isActive}
              onSelect={() => { selectWind("any"); advanceStep("step-wind"); }}
              icon={
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
                  <circle cx="18" cy="18" r="14" stroke={isActive ? "#14b8a6" : "#9ca3af"} strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="18" y="22" textAnchor="middle" fontSize="12" fontWeight="bold" fill={isActive ? "#14b8a6" : "#6b7280"}>?</text>
                </svg>
              }
              className="mb-3"
            />
          );
        })()}

        {/* 4 directional options — 2 cols mobile, 4 cols md+ */}
        <OptionGrid columns={4} label={t("stickerOrder.wind")}>
          {cutting.windDirections?.filter((w) => w.id !== "any").map((w) => {
            const isActive = windId === w.id;
            const rotation = w.id === "top" ? 0 : w.id === "right" ? 90 : w.id === "bottom" ? 180 : 270;
            return (
              <OptionCard
                key={w.id}
                label={t(w.label)}
                selected={isActive}
                onSelect={() => { selectWind(w.id); advanceStep("step-wind"); }}
                badge={<span className="text-[9px] font-bold text-amber-600">+10%</span>}
                icon={
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
                    <circle cx="18" cy="18" r="6" stroke={isActive ? "#14b8a6" : "#9ca3af"} strokeWidth="1.5" fill="none" />
                    <circle cx="18" cy="18" r="2.5" fill={isActive ? "#14b8a6" : "#d1d5db"} />
                    <circle cx="18" cy="18" r="13" stroke={isActive ? "#14b8a6" : "#6b7280"} strokeWidth="2" fill="none" />
                    <g transform={`rotate(${rotation} 18 18)`}>
                      <line x1="18" y1="5" x2="18" y2="0" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                      <polygon points="18,0 15,5 21,5" fill="#f59e0b" />
                      <text x="18" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill={isActive ? "#14b8a6" : "#374151"}>R</text>
                    </g>
                  </svg>
                }
                className="flex-col items-center text-center"
              />
            );
          })}
        </OptionGrid>
      </StepCard>

      {/* 7. Quantity — dropdown for >6 items, pill buttons for ≤6 */}
      <StepCard
        stepNumber={stepNum("quantity")}
        title={t("step.quantity")}
        hint={t("step.quantity.hint")}
        summaryText={`${activeQty.toLocaleString()} pcs`}
        stepId="step-quantity"
        open={isStepOpen("quantity")}
        onToggle={() => toggleStep("quantity")}
        alwaysOpen
      >
        {useQtyDropdown ? (
          /* Dropdown for long quantity lists (>6 items) */
          <select
            value={customQty !== "" ? "custom" : quantity}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") return;
              selectQuantity(Number(val));
              advanceStep("step-quantity");
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
          >
            {cutting.quantities.map((q) => (
              <option key={q} value={q}>{q.toLocaleString()} pcs</option>
            ))}
          </select>
        ) : (
          /* Pill buttons for short lists (≤6 items) */
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {cutting.quantities.map((q) => {
              const isActive = customQty === "" && quantity === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => { selectQuantity(q); advanceStep("step-quantity"); }}
                  className={`flex-shrink-0 rounded-full border-2 px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {q.toLocaleString()}
                </button>
              );
            })}
          </div>
        )}
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
      </StepCard>

      {/* 8. Lamination */}
      <StepCard
        stepNumber={stepNum("lamination")}
        title={t("step.lamination")}
        hint={t("step.lamination.hint")}
        summaryText={laminationId === "none" ? t("stickerOrder.lam.none.desc") : laminationId === "gloss" ? t("stickerOrder.lam.gloss.desc") : t("stickerOrder.lam.matte-lam.desc")}
        visible={!hideLamination && cutting.lamination?.length > 1}
        stepId="step-lamination"
        open={isStepOpen("lamination")}
        onToggle={() => toggleStep("lamination")}
      >
        <OptionGrid columns={3} label={t("step.lamination")}>
          {cutting.lamination?.map((lam) => {
            const det = LAMINATION_DETAILS[lam.id];
            return (
              <OptionCard
                key={lam.id}
                label={lam.id === "none" ? "No Lamination" : lam.id === "gloss" ? "Gloss" : "Matte"}
                description={t(`option.explain.lam.${lam.id}`)}
                selected={laminationId === lam.id}
                onSelect={() => { setLaminationId(lam.id); advanceStep("step-lamination"); }}
                recommended={lam.id === RECOMMENDED.lamination}
                detailRows={det ? [
                  { label: t("option.price"), text: t(`option.priceDiff.${det.priceKey}`) },
                  { label: t("option.useCase"), text: t(`option.useCase.${det.useKey}`) },
                  { label: t("option.durability"), text: t(`option.durability.${det.durKey}`) },
                ] : undefined}
              />
            );
          })}
        </OptionGrid>
        {showPaperWarning && (
          <p className="mt-2 text-[11px] text-amber-600">
            {t("stickerOrder.lamination.paperWarning")}
          </p>
        )}
      </StepCard>

      {/* 9. Turnaround */}
      <StepCard
        stepNumber={stepNum("turnaround")}
        title={t("step.turnaround")}
        hint={t("step.turnaround.hint")}
        summaryText={t(`stickerOrder.turnaround.${turnaroundId}`)}
        stepId="step-turnaround"
        open={isStepOpen("turnaround")}
        onToggle={() => toggleStep("turnaround")}
        alwaysOpen
      >
        <OptionGrid columns={2} label={t("step.turnaround")}>
          {TURNAROUND_OPTIONS.map((opt) => {
            const det = TURNAROUND_DETAILS[opt.id];
            return (
              <OptionCard
                key={opt.id}
                label={t(opt.label)}
                description={t(`option.explain.ta.${opt.id}`)}
                selected={turnaroundId === opt.id}
                onSelect={() => { setTurnaroundId(opt.id); advanceStep("step-turnaround"); }}
                recommended={opt.id === RECOMMENDED.turnaround}
                badge={opt.id === "rush" ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">+50%</span> : undefined}
                detailRows={det ? [
                  { label: t("option.price"), text: t(`option.priceDiff.${det.priceKey}`) },
                  { label: t("option.useCase"), text: t(`option.useCase.${det.useKey}`) },
                  { label: t("option.delivery"), text: t(`option.delivery.${det.deliveryKey}`) },
                ] : undefined}
              />
            );
          })}
        </OptionGrid>
      </StepCard>

      {/* 10. Artwork */}
      <StepCard
        stepNumber={stepNum("artwork")}
        title={t("step.artwork")}
        hint={t("step.artwork.hint")}
        summaryText={uploadedFile?.name || t("step.notUploaded")}
        optional
        stepId="step-artwork"
        open={isStepOpen("artwork")}
        onToggle={() => toggleStep("artwork")}
      >
        <ArtworkUpload
          uploadedFile={uploadedFile}
          onUploaded={(file) => setUploadedFile(file)}
          onRemove={() => setUploadedFile(null)}
          onBegin={() => trackUploadStarted({ slug })}
          t={t}
        />
        <p className="mt-1.5 text-[10px] text-gray-400">{t("stickerOrder.uploadAfterCheckout")}</p>
      </StepCard>

      {/* Order Summary Card — what you selected + why */}
      {quote.quoteData && (
        <OrderSummaryCard
          materialId={materialId}
          laminationId={laminationId}
          printMode={printMode}
          turnaroundId={turnaroundId}
          isWhiteInkMaterial={isWhiteInkMaterial}
          hideLamination={hideLamination}
          cutting={cutting}
          showPaperWarning={showPaperWarning}
          t={t}
        />
      )}

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
              <span className="font-medium text-gray-700">{formatCad(adjustedSubtotalCents)}</span>
            </div>
            {turnaroundId === "rush" && (
              <div className="flex items-baseline justify-between text-xs text-amber-600">
                <span>Rush surcharge</span>
                <span className="font-medium">+50%</span>
              </div>
            )}
            <hr className="border-gray-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCad(adjustedSubtotalCents)}</span>
            </div>
            <p className="text-right text-[10px] text-gray-400">Before tax</p>
            {(() => {
              const hints = [];
              if (materialId !== cutting.materials[0].id) hints.push(t("configurator.priceIncludesMaterial"));
              if (laminationId !== "none") hints.push(t("configurator.priceIncludesFinishing"));
              if (windMultiplier > 1) hints.push(t("stickerOrder.wind.surcharge"));
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

      {/* Mobile bottom bar with live price */}
      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        quoteError={quote.quoteError}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents || 0}
        quantity={activeQty}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
      />
    </div>
  );
}
