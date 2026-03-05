"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  SURFACE_TYPES,
  FINISHING_OPTIONS,
  getSurfaceType,
} from "@/lib/surface-order-config";
import {
  StepCard,
  OptionCard,
  OptionGrid,
  useStepScroll,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  CustomDimensions,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";

const INCH_TO_CM = 2.54;
const APPLICATION_LABELS = { window: "Window", wall: "Wall", floor: "Floor" };

export default function SurfaceOrderClient({ defaultType, productSlug, productImages }) {
  const { t, locale } = useTranslation();

  // --- State ---
  const [typeId, setTypeId] = useState(defaultType || "transparent-color");
  const surfaceType = useMemo(() => getSurfaceType(typeId), [typeId]);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(surfaceType.materials[0].id);
  const [cutType, setCutType] = useState(surfaceType.cutTypes?.[0] || "rectangular");
  const [finishing, setFinishing] = useState(surfaceType.defaultFinishing);
  const [quantity, setQuantity] = useState(surfaceType.quantities[0] ?? 1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);
  const [applicationSide, setApplicationSide] = useState("outside"); // "outside" | "inside"
  const [sizeMode, setSizeMode] = useState("single"); // "single" | "multi"
  const [sizeRows, setSizeRows] = useState(() => [
    { id: 1, w: "", h: "", qty: 1 },
  ]);
  const nextRowId = useRef(2);

  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return surfaceType.sizes[sizeIdx]?.w ?? 24;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, surfaceType, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return surfaceType.sizes[sizeIdx]?.h ?? 36;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, surfaceType, customH, unit]);

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
    setMaterialId(surfaceType.materials[0].id);
    setCutType(surfaceType.cutTypes?.[0] || "rectangular");
    setFinishing(surfaceType.defaultFinishing);
    setQuantity(surfaceType.quantities[0] ?? 1);
    setCustomQty("");
    setDimErrors([]);
    setApplicationSide("outside");
    setSizeMode("single");
    setSizeRows([{ id: 1, w: "", h: "", qty: 1 }]);
  }, [typeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate dimensions
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
    const errs = [];
    if (widthIn < surfaceType.minIn) errs.push(`Width must be at least ${surfaceType.minIn}"`);
    if (heightIn < surfaceType.minIn) errs.push(`Height must be at least ${surfaceType.minIn}"`);
    if (widthIn > surfaceType.maxW) errs.push(`Width cannot exceed ${surfaceType.maxW}"`);
    if (heightIn > surfaceType.maxH) errs.push(`Height cannot exceed ${surfaceType.maxH}"`);
    setDimErrors(errs);
  }, [widthIn, heightIn, surfaceType]);

  // Multi-size helpers
  const multiTotalQty = useMemo(
    () => sizeRows.reduce((sum, r) => sum + (Number(r.qty) > 0 ? Number(r.qty) : 0), 0),
    [sizeRows]
  );
  const multiTotalSqIn = useMemo(
    () => sizeRows.reduce((sum, r) => {
      const w = parseFloat(r.w), h = parseFloat(r.h), q = Number(r.qty);
      if (!w || !h || !q || w <= 0 || h <= 0 || q <= 0) return sum;
      return sum + w * h * q;
    }, 0),
    [sizeRows]
  );
  const multiValid = useMemo(() => {
    if (sizeMode !== "multi") return true;
    return sizeRows.every((r) => {
      const w = parseFloat(r.w), h = parseFloat(r.h), q = Number(r.qty);
      return w > 0 && h > 0 && q > 0 && w >= surfaceType.minIn && h >= surfaceType.minIn && w <= surfaceType.maxW && h <= surfaceType.maxH;
    }) && multiTotalQty > 0;
  }, [sizeMode, sizeRows, surfaceType, multiTotalQty]);

  // Effective dimensions/qty for pricing
  const effectiveQty = sizeMode === "multi" ? multiTotalQty : activeQty;
  const effectiveW = sizeMode === "multi" && multiTotalQty > 0
    ? Math.sqrt(multiTotalSqIn / multiTotalQty)
    : widthIn;
  const effectiveH = sizeMode === "multi" && multiTotalQty > 0
    ? Math.sqrt(multiTotalSqIn / multiTotalQty)
    : heightIn;

  // Finishing surcharge
  const finishingSurcharge = useMemo(() => {
    if (!finishing || finishing === "none") return 0;
    return (FINISHING_OPTIONS[finishing]?.surcharge ?? 0) * effectiveQty;
  }, [finishing, effectiveQty]);

  // Resolve printMode from selected material's config
  const selectedMat = useMemo(
    () => surfaceType.materials.find((m) => m.id === materialId),
    [surfaceType, materialId]
  );

  // Quote — pass cutType + printMode for COST_PLUS pricing
  const quoteExtra = useMemo(
    () => ({ cutType, ...(selectedMat?.printMode ? { printMode: selectedMat.printMode } : {}) }),
    [cutType, selectedMat]
  );
  const quoteEnabled = sizeMode === "multi"
    ? multiValid && effectiveQty > 0
    : widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0;
  const effectiveSlug = productSlug || surfaceType.defaultSlug;
  const quote = useConfiguratorPrice({
    slug: effectiveSlug,
    quantity: effectiveQty,
    widthIn: effectiveW,
    heightIn: effectiveH,
    material: materialId,
    options: quoteExtra,
    enabled: quoteEnabled,
  });

  useEffect(() => {
    quote.addSurcharge(finishingSurcharge);
  }, [finishingSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && effectiveQty > 0
    && (sizeMode === "multi" ? multiValid : dimErrors.length === 0);

  // Cart
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || effectiveQty <= 0) return null;
    const isMulti = sizeMode === "multi";
    const sizeLabel = isMulti
      ? `${sizeRows.length} sizes, ${multiTotalQty} pcs`
      : isCustomSize
        ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
        : surfaceType.sizes[sizeIdx]?.label;
    return {
      id: effectiveSlug,
      name: `${t(`surface.type.${typeId}`)} — ${sizeLabel}`,
      slug: effectiveSlug,
      price: Math.round(quote.subtotalCents / effectiveQty),
      quantity: effectiveQty,
      options: {
        surfaceType: typeId,
        application: surfaceType.application,
        ...(surfaceType.transparent ? { applicationSide } : {}),
        ...(isMulti ? {} : { width: widthIn, height: heightIn }),
        sizeLabel,
        sizeMode: isMulti ? "multi" : "single",
        ...(isMulti ? { sizeRows: JSON.stringify(sizeRows.map((r) => ({ width: parseFloat(r.w), height: parseFloat(r.h), quantity: Number(r.qty) }))) } : {}),
        material: materialId,
        cutType,
        finishing: finishing !== "none" ? finishing : null,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, effectiveQty, sizeMode, sizeRows, multiTotalQty, typeId, widthIn, heightIn, isCustomSize, sizeIdx, surfaceType, materialId, cutType, finishing, applicationSide, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("surface.addedToCart"),
  });

  // Group types by application
  const typesByApp = useMemo(() => {
    const groups = {};
    for (const st of SURFACE_TYPES) {
      if (!groups[st.application]) groups[st.application] = [];
      groups[st.application].push(st);
    }
    return groups;
  }, []);

  const summaryLines = [
    { label: t("surface.type.label"), value: t(`surface.type.${typeId}`) },
    { label: t("surface.application"), value: APPLICATION_LABELS[surfaceType.application] || surfaceType.application },
    {
      label: t("surface.size"),
      value: sizeMode === "multi"
        ? `${sizeRows.length} sizes`
        : isCustomSize
          ? widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "—"
          : surfaceType.sizes[sizeIdx]?.label || "—",
    },
    { label: t("surface.material"), value: surfaceType.materials.find((m) => m.id === materialId)?.label || materialId },
    { label: t("surface.quantity"), value: effectiveQty > 0 ? effectiveQty.toLocaleString() : "—" },
  ];
  if (surfaceType.transparent) {
    summaryLines.push({ label: t("surface.applicationSide"), value: applicationSide === "inside" ? t("surface.insideGlass") : t("surface.outsideGlass") });
  }
  if (surfaceType.cutTypes && surfaceType.cutTypes.length > 1) {
    summaryLines.push({ label: "Cut Type", value: cutType === "contour" ? "Contour Cut" : "Rectangular" });
  }
  if (finishing && finishing !== "none") {
    summaryLines.push({ label: t("surface.finishing"), value: FINISHING_OPTIONS[finishing]?.label || finishing });
  }

  const extraRows = [];
  // Show COST_PLUS breakdown lines from quote data
  if (quote.quoteData?.meta?.model === "COST_PLUS" && Array.isArray(quote.quoteData.breakdown)) {
    for (const line of quote.quoteData.breakdown) {
      extraRows.push({
        label: line.label,
        value: `$${(line.amount / 100).toFixed(2)}`,
      });
    }
  }
  if (finishingSurcharge > 0) {
    extraRows.push({ label: t("surface.finishingSurcharge"), value: `+ $${(finishingSurcharge / 100).toFixed(2)}` });
  }

  const formatCad = (cents) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  // --- Accordion state ---
  const [activeStepId, setActiveStepId] = useState(null);
  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "type", vis: true },
      { id: "size", vis: true },
      { id: "material", vis: true },
      { id: "applicationSide", vis: !!surfaceType.transparent },
      { id: "cutType", vis: surfaceType.cutTypes && surfaceType.cutTypes.length > 1 },
      { id: "finishing", vis: surfaceType.finishings.length > 0 },
      { id: "quantity", vis: sizeMode === "single" },
      { id: "artwork", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [surfaceType.transparent, surfaceType.cutTypes, surfaceType.finishings.length, sizeMode]);
  const stepNumFn = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);
  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  const typeSummary = t(`surface.type.${typeId}`);
  const sizeSumText = sizeMode === "multi"
    ? `${sizeRows.length} sizes`
    : isCustomSize
      ? widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "—"
      : surfaceType.sizes[sizeIdx]?.label || "—";
  const materialSummary = surfaceType.materials.find((m) => m.id === materialId)?.label || materialId;
  const appSideSummary = applicationSide === "inside" ? t("surface.insideGlass") : t("surface.outsideGlass");
  const cutTypeSummary = cutType === "contour" ? "Contour Cut" : "Rectangular";
  const finishingSummaryText = finishing && finishing !== "none" ? (FINISHING_OPTIONS[finishing]?.label || finishing) : "None";
  const quantitySummaryText = `${activeQty.toLocaleString()} pcs`;
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("surface.breadcrumb"), href: "/shop/windows-walls-floors" },
          { label: t("surface.order") },
        ]}
        title={t(`surface.type.${typeId}`)}
        subtitle={t("surface.subtitle")}
        badges={[t("surface.badgeDurable"), t("surface.badgeShipping"), t("surface.badgeProof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-3 lg:col-span-2">

            {/* Step: Type (grouped by application) */}
            <StepCard
              stepNumber={stepNumFn("type")}
              title={t("surface.type.label")}
              hint={t("surface.type.subtitle")}
              summaryText={typeSummary}
              open={isStepOpen("type")}
              onToggle={() => toggleStep("type")}
              stepId="step-type"
            >
              {Object.entries(typesByApp).map(([app, types]) => (
                <div key={app} className="mb-4 last:mb-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    {APPLICATION_LABELS[app] || app}
                  </p>
                  <OptionGrid columns={4} label={`${APPLICATION_LABELS[app] || app} surface types`}>
                    {types.map((st) => (
                      <OptionCard
                        key={st.id}
                        label={t(`surface.type.${st.id}`)}
                        selected={typeId === st.id}
                        onSelect={() => { setTypeId(st.id); advanceStep("step-type"); }}
                      />
                    ))}
                  </OptionGrid>
                </div>
              ))}
            </StepCard>

            {/* Step: Size */}
            <StepCard
              stepNumber={stepNumFn("size")}
              title={t("surface.size")}
              hint={t("surface.sizeSubtitle")}
              summaryText={sizeSumText}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
            >
              {/* Size mode toggle */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Multiple Sizes</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = sizeMode === "single" ? "multi" : "single";
                    setSizeMode(next);
                    if (next === "multi") {
                      setSizeRows([{ id: 1, w: String(widthIn || ""), h: String(heightIn || ""), qty: activeQty || 1 }]);
                      nextRowId.current = 2;
                    }
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${sizeMode === "multi" ? "bg-teal-600 text-white" : "border border-gray-300 bg-white text-gray-700"}`}
                >
                  {sizeMode === "multi" ? "On" : "Off"}
                </button>
              </div>

              {sizeMode === "single" ? (
                <>
                  <OptionGrid columns={4} label="Size options">
                    {surfaceType.sizes.map((s, i) => (
                      <OptionCard
                        key={i}
                        label={s.label}
                        selected={sizeIdx === i}
                        onSelect={() => { setSizeIdx(i); setCustomW(""); setCustomH(""); advanceStep("step-size"); }}
                      />
                    ))}
                    <OptionCard
                      label={t("surface.customSize")}
                      selected={isCustomSize}
                      onSelect={() => setSizeIdx(-1)}
                      className={!isCustomSize ? "border-dashed" : ""}
                      icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      }
                    />
                  </OptionGrid>
                  {isCustomSize && (
                    <CustomDimensions
                      customW={customW} customH={customH}
                      onChangeW={setCustomW} onChangeH={setCustomH}
                      unit={unit} onChangeUnit={setUnit}
                      minLabel={`${surfaceType.minIn}" × ${surfaceType.minIn}"`}
                      maxLabel={`${surfaceType.maxW}" × ${surfaceType.maxH}"`}
                      dimErrors={dimErrors} t={t}
                    />
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Min {surfaceType.minIn}&quot; &times; {surfaceType.minIn}&quot; &mdash; Max {surfaceType.maxW}&quot; &times; {surfaceType.maxH}&quot;
                  </p>
                  <div className="space-y-2">
                    {sizeRows.map((row, idx) => (
                      <div key={row.id} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-center text-xs font-bold text-gray-400">#{idx + 1}</span>
                        <input
                          type="number"
                          min={surfaceType.minIn}
                          max={surfaceType.maxW}
                          step="0.1"
                          value={row.w}
                          onChange={(e) => setSizeRows((prev) => prev.map((r) => r.id === row.id ? { ...r, w: e.target.value } : r))}
                          placeholder='W"'
                          className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-teal-500 focus:outline-none"
                        />
                        <span className="text-gray-400">&times;</span>
                        <input
                          type="number"
                          min={surfaceType.minIn}
                          max={surfaceType.maxH}
                          step="0.1"
                          value={row.h}
                          onChange={(e) => setSizeRows((prev) => prev.map((r) => r.id === row.id ? { ...r, h: e.target.value } : r))}
                          placeholder='H"'
                          className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-teal-500 focus:outline-none"
                        />
                        <span className="text-xs text-gray-400">&times;</span>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={row.qty}
                          onChange={(e) => setSizeRows((prev) => prev.map((r) => r.id === row.id ? { ...r, qty: e.target.value } : r))}
                          placeholder="Qty"
                          className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-teal-500 focus:outline-none"
                        />
                        {sizeRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSizeRows((prev) => prev.filter((r) => r.id !== row.id))}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const id = nextRowId.current++;
                      setSizeRows((prev) => [...prev, { id, w: "", h: "", qty: 1 }]);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-500 hover:text-gray-900"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Size
                  </button>
                  {multiTotalQty > 0 && (
                    <p className="text-xs font-medium text-gray-600">
                      Total: {multiTotalQty} pcs &mdash; {(multiTotalSqIn / 144).toFixed(1)} sq ft
                    </p>
                  )}
                </div>
              )}
            </StepCard>

            {/* Step: Material */}
            <StepCard
              stepNumber={stepNumFn("material")}
              title={t("surface.material")}
              hint={t("surface.materialSubtitle")}
              summaryText={materialSummary}
              open={isStepOpen("material")}
              onToggle={() => toggleStep("material")}
              stepId="step-material"
            >
              <OptionGrid columns={3} label="Material options">
                {surfaceType.materials.map((mat) => (
                  <OptionCard
                    key={mat.id}
                    label={mat.label}
                    selected={materialId === mat.id}
                    onSelect={() => { setMaterialId(mat.id); advanceStep("step-material"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Application Side (transparent types only) */}
            <StepCard
              stepNumber={stepNumFn("applicationSide")}
              title={t("surface.applicationSide")}
              hint={t("surface.applicationSideSubtitle")}
              summaryText={appSideSummary}
              visible={!!surfaceType.transparent}
              open={isStepOpen("applicationSide")}
              onToggle={() => toggleStep("applicationSide")}
              stepId="step-applicationSide"
            >
              <OptionGrid columns={2} label="Application side options">
                {[
                  { id: "outside", label: t("surface.outsideGlass"), desc: t("surface.outsideGlassDesc") },
                  { id: "inside", label: t("surface.insideGlass"), desc: t("surface.insideGlassDesc") },
                ].map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    description={opt.desc}
                    selected={applicationSide === opt.id}
                    onSelect={() => { setApplicationSide(opt.id); advanceStep("step-applicationSide"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Cut Type (if multiple options) */}
            <StepCard
              stepNumber={stepNumFn("cutType")}
              title="Cut Type"
              hint="Choose how your graphic will be trimmed"
              summaryText={cutTypeSummary}
              visible={!!(surfaceType.cutTypes && surfaceType.cutTypes.length > 1)}
              open={isStepOpen("cutType")}
              onToggle={() => toggleStep("cutType")}
              stepId="step-cutType"
            >
              <OptionGrid columns={2} label="Cut type options">
                {surfaceType.cutTypes.map((ct) => {
                  const label = ct === "contour" ? "Contour Cut" : "Rectangular";
                  const desc = ct === "contour" ? "Cut around your design shape" : "Standard straight-edge cut";
                  return (
                    <OptionCard
                      key={ct}
                      label={label}
                      description={desc}
                      selected={cutType === ct}
                      onSelect={() => { setCutType(ct); advanceStep("step-cutType"); }}
                    />
                  );
                })}
              </OptionGrid>
            </StepCard>

            {/* Step: Finishing (if available) */}
            <StepCard
              stepNumber={stepNumFn("finishing")}
              title={t("surface.finishing")}
              hint={t("surface.finishingSubtitle")}
              summaryText={finishingSummaryText}
              visible={surfaceType.finishings.length > 0}
              open={isStepOpen("finishing")}
              onToggle={() => toggleStep("finishing")}
              stepId="step-finishing"
            >
              <OptionGrid columns={3} label="Finishing options">
                <OptionCard
                  label={t("surface.noFinishing")}
                  selected={finishing === "none"}
                  onSelect={() => { setFinishing("none"); advanceStep("step-finishing"); }}
                />
                {surfaceType.finishings.map((fId) => {
                  const opt = FINISHING_OPTIONS[fId];
                  return (
                    <OptionCard
                      key={fId}
                      label={opt?.label || fId}
                      selected={finishing === fId}
                      onSelect={() => { setFinishing(fId); advanceStep("step-finishing"); }}
                      badge={opt?.surcharge > 0 ? (
                        <span className="text-[11px] font-medium text-amber-600">+${(opt.surcharge / 100).toFixed(2)}/ea</span>
                      ) : undefined}
                    />
                  );
                })}
              </OptionGrid>
            </StepCard>

            {/* Quantity (hidden in multi-size mode — qty is per row) */}
            <StepCard
              stepNumber={stepNumFn("quantity")}
              title={t("surface.quantity")}
              hint={t("surface.quantitySubtitle")}
              summaryText={quantitySummaryText}
              visible={sizeMode === "single"}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
            >
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                {surfaceType.quantities.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuantity(q); setCustomQty(""); advanceStep("step-quantity"); }}
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 rounded-full border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-teal-500 bg-teal-50 text-gray-900 shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">{q}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("surface.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
            </StepCard>

            {/* Upload */}
            <StepCard
              stepNumber={stepNumFn("artwork")}
              title={t("surface.artwork")}
              hint={t("surface.artworkSubtitle")}
              summaryText={artworkSummary}
              optional
              open={isStepOpen("artwork")}
              onToggle={() => toggleStep("artwork")}
              stepId="step-artwork"
            >
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                t={t}
              />
            </StepCard>
          </div>

          <PricingSidebar
            summaryLines={summaryLines}
            quoteLoading={quote.quoteLoading}
            quoteError={quote.quoteError}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            taxCents={quote.taxCents}
            totalCents={quote.subtotalCents}
            quantity={effectiveQty}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            extraRows={extraRows}
            badges={[t("surface.badgeDurable"), t("surface.badgeShipping")]}
            t={t}
            productName={t(`surface.type.${typeId}`)}
            categorySlug="windows-walls-floors"
            locale={locale}
            productSlug={surfaceType.defaultSlug}
            onRetryPrice={quote.retry}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        quantity={effectiveQty}
        summaryText={quote.quoteData ? `${formatCad(quote.unitCents)}/ea × ${effectiveQty}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        productName={t(`surface.type.${typeId}`)}
        summaryLines={summaryLines}
        unitCents={quote.unitCents}
        subtotalCents={quote.subtotalCents}
        categorySlug="windows-walls-floors"
        locale={locale}
        onRetryPrice={quote.retry}
      />
    </main>
  );
}
