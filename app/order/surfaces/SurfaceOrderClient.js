"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  SURFACE_TYPES,
  FINISHING_OPTIONS,
  getSurfaceType,
} from "@/lib/surface-order-config";
import {
  ConfigStep,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  CustomDimensions,
  TemplateDownloadButton,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";

const INCH_TO_CM = 2.54;
const APPLICATION_LABELS = { window: "Window", wall: "Wall", floor: "Floor" };

export default function SurfaceOrderClient({ defaultType, productSlug, productImages }) {
  const { t } = useTranslation();

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

  let stepNum = 1;

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
          <div className="space-y-6 lg:col-span-2">

            {/* Step 1: Type (grouped by application) */}
            <ConfigStep number={stepNum++} title={t("surface.type.label")} subtitle={t("surface.type.subtitle")}>
              {Object.entries(typesByApp).map(([app, types]) => (
                <div key={app} className="mb-4 last:mb-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    {APPLICATION_LABELS[app] || app}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {types.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setTypeId(st.id)}
                        className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3.5 text-center transition-all duration-200 ${
                          typeId === st.id
                            ? "border-gray-900 bg-gray-900 text-[#fff] shadow-lg shadow-gray-900/20 scale-[1.02]"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                        }`}
                      >
                        {typeId === st.id && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[#fff] shadow-sm">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </span>
                        )}
                        <span className="text-sm font-bold">{t(`surface.type.${st.id}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </ConfigStep>

            {/* Step 2: Size */}
            <ConfigStep number={stepNum++} title={t("surface.size")} subtitle={t("surface.sizeSubtitle")}>
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
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${sizeMode === "multi" ? "bg-gray-900 text-[#fff]" : "border border-gray-300 bg-white text-gray-700"}`}
                >
                  {sizeMode === "multi" ? "On" : "Off"}
                </button>
              </div>

              {sizeMode === "single" ? (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {surfaceType.sizes.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSizeIdx(i); setCustomW(""); setCustomH(""); }}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                          sizeIdx === i
                            ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span className="text-sm font-bold">{s.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSizeIdx(-1)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                        isCustomSize
                          ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                          : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-500"
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                      <span className="text-xs font-bold">{t("surface.customSize")}</span>
                    </button>
                  </div>
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
                          className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none"
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
                          className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none"
                        />
                        <span className="text-xs text-gray-400">&times;</span>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={row.qty}
                          onChange={(e) => setSizeRows((prev) => prev.map((r) => r.id === row.id ? { ...r, qty: e.target.value } : r))}
                          placeholder="Qty"
                          className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none"
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
            </ConfigStep>

            {/* Design template download */}
            {widthIn > 0 && heightIn > 0 && (
              <TemplateDownloadButton
                slug={typeId}
                width={widthIn}
                height={heightIn}
                product={t(`surface.type.${typeId}`)}
                dpi={300}
                t={t}
              />
            )}

            {/* Step 3: Material */}
            <ConfigStep number={stepNum++} title={t("surface.material")} subtitle={t("surface.materialSubtitle")}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {surfaceType.materials.map((mat) => {
                  const isActive = materialId === mat.id;
                  const _unused = mat.multiplier; // multiplier used in pricing only
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => setMaterialId(mat.id)}
                      className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                          <svg className="h-3 w-3 text-[#fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-800">{mat.label}</span>
                    </button>
                  );
                })}
              </div>
            </ConfigStep>

            {/* Step: Application Side (transparent types only) */}
            {surfaceType.transparent && (
              <ConfigStep number={stepNum++} title={t("surface.applicationSide")} subtitle={t("surface.applicationSideSubtitle")}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {[
                    { id: "outside", label: t("surface.outsideGlass"), desc: t("surface.outsideGlassDesc") },
                    { id: "inside", label: t("surface.insideGlass"), desc: t("surface.insideGlassDesc") },
                  ].map((opt) => {
                    const isActive = applicationSide === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setApplicationSide(opt.id)}
                        className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                          isActive
                            ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                            <svg className="h-3 w-3 text-[#fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                        <span className="text-[11px] text-gray-500">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </ConfigStep>
            )}

            {/* Step: Cut Type (if multiple options) */}
            {surfaceType.cutTypes && surfaceType.cutTypes.length > 1 && (
              <ConfigStep number={stepNum++} title="Cut Type" subtitle="Choose how your graphic will be trimmed">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {surfaceType.cutTypes.map((ct) => {
                    const isActive = cutType === ct;
                    const label = ct === "contour" ? "Contour Cut" : "Rectangular";
                    const desc = ct === "contour" ? "Cut around your design shape" : "Standard straight-edge cut";
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setCutType(ct)}
                        className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                          isActive
                            ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                            <svg className="h-3 w-3 text-[#fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-800">{label}</span>
                        <span className="text-[11px] text-gray-500">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </ConfigStep>
            )}

            {/* Step: Finishing (if available) */}
            {surfaceType.finishings.length > 0 && (
              <ConfigStep number={stepNum++} title={t("surface.finishing")} subtitle={t("surface.finishingSubtitle")}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setFinishing("none")}
                    className={`flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all ${
                      finishing === "none"
                        ? "border-gray-900 bg-gray-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <span className="text-sm font-bold text-gray-800">{t("surface.noFinishing")}</span>
                  </button>
                  {surfaceType.finishings.map((fId) => {
                    const opt = FINISHING_OPTIONS[fId];
                    const isActive = finishing === fId;
                    return (
                      <button
                        key={fId}
                        type="button"
                        onClick={() => setFinishing(fId)}
                        className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all ${
                          isActive
                            ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                            <svg className="h-3 w-3 text-[#fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-800">{opt?.label || fId}</span>
                        {opt?.surcharge > 0 && (
                          <span className="text-[11px] text-amber-600">+${(opt.surcharge / 100).toFixed(2)}/ea</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ConfigStep>
            )}

            {/* Quantity (hidden in multi-size mode — qty is per row) */}
            {sizeMode === "single" && (
            <ConfigStep number={stepNum++} title={t("surface.quantity")} subtitle={t("surface.quantitySubtitle")}>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                {surfaceType.quantities.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuantity(q); setCustomQty(""); }}
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 rounded-full border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
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
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>
            )}

            {/* Upload */}
            <ConfigStep number={stepNum++} title={t("surface.artwork")} subtitle={t("surface.artworkSubtitle")} optional>
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                t={t}
              />
            </ConfigStep>
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
      />
    </main>
  );
}
