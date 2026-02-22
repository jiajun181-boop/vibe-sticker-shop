"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  PRINT_TYPES,
  getMarketingPrintType,
  FINISHING_LABELS,
} from "@/lib/marketing-print-order-config";
import {
  ConfigStep,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  LetterheadTemplateBuilder,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const formatSurcharge = (cents) =>
  cents >= 100 ? `+${formatCad(cents)}/ea` : `+$0.${String(cents).padStart(2, "0")}/ea`;

export default function MarketingPrintOrderClient({
  defaultType,
  hideTypeSelector = false,
  productImages,
}) {
  const { t } = useTranslation();

  // --- State ---
  const [typeId, setTypeId] = useState(defaultType || "business-cards");
  const printType = useMemo(() => getMarketingPrintType(typeId), [typeId]);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [extraSizes, setExtraSizes] = useState([]); // [{w, h}]
  const [paperId, setPaperId] = useState(() => {
    const def = printType.papers.find((p) => p.default);
    return def ? def.id : printType.papers[0].id;
  });
  const [sides, setSides] = useState(printType.sides.includes("double") ? "double" : "single");
  const [finishing, setFinishing] = useState(() =>
    printType.finishings[0] === "none" ? "none" : printType.finishings[0],
  );
  const [quantity, setQuantity] = useState(printType.quantities[0] ?? 100);
  const [customQty, setCustomQty] = useState(printType.quantityMode === "input" ? "1" : "");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artworkMode, setArtworkMode] = useState("upload"); // "upload" | "template"
  const [templateData, setTemplateData] = useState(null);   // { logo, fields }

  // Extras state — keyed by extra key, stores selected option id
  const [extrasState, setExtrasState] = useState(() => {
    const init = {};
    for (const ex of printType.extras || []) {
      init[ex.key] = ex.default;
    }
    return init;
  });

  // Reset dependent state when type changes
  const handleTypeChange = useCallback((newTypeId) => {
    setTypeId(newTypeId);
    const newType = getMarketingPrintType(newTypeId);
    setSizeIdx(0);
    setIsCustomSize(false);
    setCustomW("");
    setCustomH("");
    setExtraSizes([]);
    const defPaper = newType.papers.find((p) => p.default);
    setPaperId(defPaper ? defPaper.id : newType.papers[0].id);
    setSides(newType.sides.includes("double") ? "double" : "single");
    setFinishing(newType.finishings[0] === "none" ? "none" : newType.finishings[0]);
    setQuantity(newType.quantities[0] ?? 100);
    setCustomQty(newType.quantityMode === "input" ? "1" : "");
    // Reset extras
    const init = {};
    for (const ex of newType.extras || []) {
      init[ex.key] = ex.default;
    }
    setExtrasState(init);
  }, []);

  const selectedSize = isCustomSize ? null : printType.sizes[sizeIdx];
  const widthIn = isCustomSize ? (parseFloat(customW) || 1) : (selectedSize?.w ?? 3.5);
  const heightIn = isCustomSize ? (parseFloat(customH) || 1) : (selectedSize?.h ?? 2);
  const effectiveQty = customQty ? Math.max(1, parseInt(customQty) || 0) : quantity;
  const sizeLabel = isCustomSize ? `${customW}" × ${customH}"` : selectedSize?.label;

  // --- Surcharges ---
  const selectedPaper = printType.papers.find((p) => p.id === paperId);
  const paperSurchargePerUnit = selectedPaper?.surcharge || 0;

  const extrasSurchargePerUnit = useMemo(() => {
    let total = 0;
    for (const ex of printType.extras || []) {
      const selected = extrasState[ex.key];
      const opt = ex.options.find((o) => o.id === selected);
      if (opt?.surcharge) total += opt.surcharge;
    }
    return total;
  }, [printType.extras, extrasState]);

  const totalSurchargePerUnit = paperSurchargePerUnit + extrasSurchargePerUnit;
  const totalSurchargeCents = totalSurchargePerUnit * effectiveQty;

  const isContactOnly = !!printType.contactOnly;

  // --- Quote ---
  const quote = useConfiguratorPrice({
    slug: typeId,
    quantity: effectiveQty,
    widthIn,
    heightIn,
    material: paperId,
    sizeLabel,
    options: {
      doubleSided: sides === "double",
    },
    enabled: effectiveQty > 0 && !isContactOnly,
  });

  // Apply surcharges to quote pricing
  useEffect(() => {
    quote.addSurcharge(totalSurchargeCents);
  }, [totalSurchargeCents]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && effectiveQty > 0;

  // --- Cart ---
  const buildCartItem = useCallback(() => {
    if (effectiveQty <= 0) return null;
    const extrasForCart = {};
    for (const ex of printType.extras || []) {
      extrasForCart[ex.key] = extrasState[ex.key];
    }
    return {
      id: typeId,
      slug: typeId,
      name: `${printType.label} — ${sizeLabel || "Custom"}`,
      price: quote.unitCents || 0,
      quantity: effectiveQty,
      image: null,
      options: {
        width: widthIn,
        height: heightIn,
        material: paperId,
        sizeLabel,
        sides,
        finishing,
        ...(extraSizes.length > 0 ? { extraSizes: extraSizes.filter(s => s.w && s.h) } : {}),
        ...extrasForCart,
        ...(artworkMode === "template" && templateData ? { templateData } : {}),
      },
    };
  }, [effectiveQty, typeId, printType, sizeLabel, quote.unitCents, widthIn, heightIn, paperId, sides, finishing, extrasState, extraSizes, artworkMode, templateData]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: `${printType.label} added to cart!`,
  });

  // --- Conditional visibility ---
  const hasSidesStep = printType.sides.length > 1;
  const hasFinishingStep =
    printType.finishings.length > 1 ||
    (printType.finishings.length === 1 && printType.finishings[0] !== "none");
  const hasPaperStep = printType.papers.length > 1;
  const hasExtras = (printType.extras || []).length > 0;

  // --- Summary lines ---
  const summaryLines = useMemo(() => {
    const lines = [];
    if (!hideTypeSelector) lines.push({ label: "Product", value: printType.label });
    lines.push({ label: "Size", value: sizeLabel || "Custom" });
    if (extraSizes.filter(s => s.w && s.h).length > 0) {
      lines.push({ label: "Extra Sizes", value: `+${extraSizes.filter(s => s.w && s.h).length} sizes` });
    }
    if (hasPaperStep) {
      const paperLabel = selectedPaper?.label || paperId;
      lines.push({
        label: "Paper",
        value: paperSurchargePerUnit > 0 ? `${paperLabel} (${formatSurcharge(paperSurchargePerUnit)})` : paperLabel,
      });
    }
    if (hasSidesStep) {
      lines.push({ label: "Sides", value: sides === "double" ? "Double-Sided" : "Single-Sided" });
    }
    if (hasFinishingStep && finishing !== "none") {
      lines.push({ label: "Finishing", value: FINISHING_LABELS[finishing] || finishing });
    }
    // Extras
    for (const ex of printType.extras || []) {
      const selected = extrasState[ex.key];
      const opt = ex.options.find((o) => o.id === selected);
      if (opt && opt.id !== "none") {
        lines.push({
          label: ex.label,
          value: opt.surcharge > 0 ? `${opt.label} (${formatSurcharge(opt.surcharge)})` : opt.label,
        });
      }
    }
    lines.push({ label: "Quantity", value: effectiveQty.toLocaleString() });
    return lines;
  }, [hideTypeSelector, printType, sizeLabel, selectedPaper, paperId, paperSurchargePerUnit, hasPaperStep, hasSidesStep, sides, hasFinishingStep, finishing, extrasState, effectiveQty, extraSizes]);

  // Extra pricing rows for PricingSidebar
  const extraRows = useMemo(() => {
    if (totalSurchargeCents <= 0) return [];
    return [{ label: "Options surcharge", value: formatCad(totalSurchargeCents) }];
  }, [totalSurchargeCents]);

  // --- Hero ---
  const heroTitle = hideTypeSelector
    ? `Custom ${printType.label}`
    : t("marketingPrint.title", "Marketing & Business Printing");
  const heroSubtitle = hideTypeSelector
    ? printType.subtitle || `Premium ${printType.label.toLowerCase()} with full colour printing`
    : t("marketingPrint.subtitle", "Business cards, flyers, postcards, brochures & more");
  const heroBreadcrumbLabel = hideTypeSelector ? printType.label : t("marketingPrint.order", "Order");

  // Dynamic step numbering
  let step = 0;

  // --- Render ---
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("marketingPrint.breadcrumb", "Marketing & Print"), href: "/shop/marketing-business-print" },
          { label: heroBreadcrumbLabel },
        ]}
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          t("marketingPrint.badgeFullColor", "Full colour printing"),
          t("marketingPrint.badgeShipping", "Fast shipping"),
          t("marketingPrint.badgeProof", "Free digital proof"),
        ]}
      />
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-2">

            {/* Product Gallery — inside grid so sidebar starts beside it */}
            {productImages?.length > 0 && (
              <ConfigProductGallery images={productImages} inline />
            )}

            {/* Step: Print Type (hidden when direct-entry) */}
            {!hideTypeSelector && (
              <ConfigStep number={++step} title={t("marketingPrint.type", "Product Type")}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {PRINT_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => handleTypeChange(pt.id)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-all duration-150 ${
                        typeId === pt.id
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </ConfigStep>
            )}

            {/* Step: Size */}
            <ConfigStep number={++step} title={t("marketingPrint.size", "Size")}>
              <div className="flex flex-wrap gap-2">
                {printType.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setSizeIdx(idx); setIsCustomSize(false); }}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                      sizeIdx === idx && !isCustomSize
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                {printType.customSize && (
                  <button
                    type="button"
                    onClick={() => setIsCustomSize(true)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                      isCustomSize
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    Custom Size
                  </button>
                )}
              </div>

              {/* Custom size inputs */}
              {isCustomSize && printType.customSize && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">W:</label>
                    <input
                      type="number"
                      min={1}
                      max={printType.customSize.maxW}
                      step="0.5"
                      placeholder={`max ${printType.customSize.maxW}"`}
                      value={customW}
                      onChange={(e) => setCustomW(e.target.value)}
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                    <span className="text-xs text-gray-400">in</span>
                  </div>
                  <span className="text-gray-400">×</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">H:</label>
                    <input
                      type="number"
                      min={1}
                      max={printType.customSize.maxH}
                      step="0.5"
                      placeholder={`max ${printType.customSize.maxH}"`}
                      value={customH}
                      onChange={(e) => setCustomH(e.target.value)}
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                    <span className="text-xs text-gray-400">in</span>
                  </div>
                  <span className="text-xs text-gray-400">(max {printType.customSize.maxW}&quot; × {printType.customSize.maxH}&quot;)</span>
                </div>
              )}

              {/* More Sizes */}
              {printType.moreSizes > 0 && (
                <div className="mt-4">
                  {extraSizes.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {extraSizes.map((es, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-500 w-6">#{i + 2}</span>
                          <input
                            type="number"
                            min={1}
                            max={printType.customSize?.maxW || 999}
                            step="0.5"
                            placeholder="W"
                            value={es.w}
                            onChange={(e) => {
                              const next = [...extraSizes];
                              next[i] = { ...next[i], w: e.target.value };
                              setExtraSizes(next);
                            }}
                            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                          />
                          <span className="text-gray-400">×</span>
                          <input
                            type="number"
                            min={1}
                            max={printType.customSize?.maxH || 999}
                            step="0.5"
                            placeholder="H"
                            value={es.h}
                            onChange={(e) => {
                              const next = [...extraSizes];
                              next[i] = { ...next[i], h: e.target.value };
                              setExtraSizes(next);
                            }}
                            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                          />
                          <span className="text-xs text-gray-400">in</span>
                          <button
                            type="button"
                            onClick={() => setExtraSizes(extraSizes.filter((_, j) => j !== i))}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {extraSizes.length < printType.moreSizes && (
                    <button
                      type="button"
                      onClick={() => setExtraSizes([...extraSizes, { w: "", h: "" }])}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      + Add More Sizes {extraSizes.length > 0 && `(${extraSizes.length}/${printType.moreSizes})`}
                    </button>
                  )}
                </div>
              )}
            </ConfigStep>

            {/* Step: Paper / Stock (hidden if single option) */}
            {hasPaperStep && (
              <ConfigStep number={++step} title={t("marketingPrint.paper", "Paper / Stock")}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {printType.papers.map((p) => {
                    const isActive = paperId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaperId(p.id)}
                        className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                          isActive
                            ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-800">{p.label}</span>
                        {p.surcharge > 0 && (
                          <span className="text-xs font-medium text-emerald-600">{formatSurcharge(p.surcharge)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ConfigStep>
            )}

            {/* Step: Sides (hidden if single option) */}
            {hasSidesStep && (
              <ConfigStep number={++step} title={t("marketingPrint.sides", "Print Sides")}>
                <div className="flex gap-2">
                  {["single", "double"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSides(s)}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                        sides === s
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {s === "single"
                        ? t("marketingPrint.singleSided", "Single-Sided")
                        : t("marketingPrint.doubleSided", "Double-Sided")}
                    </button>
                  ))}
                </div>
              </ConfigStep>
            )}

            {/* Step: Finishing (hidden if only "none") */}
            {hasFinishingStep && (
              <ConfigStep number={++step} title={t("marketingPrint.finishing", "Finishing")}>
                <div className="flex flex-wrap gap-2">
                  {printType.finishings.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFinishing(f)}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                        finishing === f
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {FINISHING_LABELS[f] || f}
                    </button>
                  ))}
                </div>
              </ConfigStep>
            )}

            {/* Steps: Extras (dynamic from printType.extras) */}
            {(printType.extras || []).map((ex) => (
              <ConfigStep key={ex.key} number={++step} title={ex.label}>
                <div className="flex flex-wrap gap-2">
                  {ex.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setExtrasState((prev) => ({ ...prev, [ex.key]: opt.id }))
                      }
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                        extrasState[ex.key] === opt.id
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {opt.label}
                      {opt.surcharge > 0 && (
                        <span className="ml-1.5 text-xs font-medium opacity-75">
                          {formatSurcharge(opt.surcharge)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </ConfigStep>
            ))}

            {/* Step: Quantity */}
            <ConfigStep number={++step} title={t("marketingPrint.quantity", "Quantity")}>
              {printType.quantityMode !== "input" && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {printType.quantities.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuantity(q); setCustomQty(""); }}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                        quantity === q && !customQty
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">{q.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className={`flex items-center gap-3 ${printType.quantityMode !== "input" ? "mt-3" : ""}`}>
                {printType.quantityMode !== "input" && (
                  <label className="text-xs font-medium text-gray-500">{t("marketingPrint.customQty", "Custom")}:</label>
                )}
                <input
                  type="number"
                  min={1}
                  placeholder={printType.quantityMode === "input" ? "Enter quantity" : "e.g. 200"}
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* Step: Artwork */}
            <ConfigStep number={++step} title={t("marketingPrint.artwork", "Artwork")} optional>
              {printType.templateBuilder ? (
                <>
                  {/* Toggle: Upload vs Template */}
                  <div className="mb-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setArtworkMode("upload")}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                        artworkMode === "upload"
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {t("marketingPrint.uploadDesign", "Upload Your Design")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setArtworkMode("template")}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                        artworkMode === "template"
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {t("marketingPrint.useTemplate", "Use Our Template")}
                    </button>
                  </div>
                  {artworkMode === "upload" ? (
                    <ArtworkUpload
                      uploadedFile={uploadedFile}
                      onUploaded={setUploadedFile}
                      onRemove={() => setUploadedFile(null)}
                      t={t}
                    />
                  ) : (
                    <LetterheadTemplateBuilder
                      onTemplateData={setTemplateData}
                      t={t}
                    />
                  )}
                </>
              ) : (
                <ArtworkUpload
                  uploadedFile={uploadedFile}
                  onUploaded={setUploadedFile}
                  onRemove={() => setUploadedFile(null)}
                  t={t}
                />
              )}
            </ConfigStep>
          </div>

          {/* RIGHT COLUMN */}
          {isContactOnly ? (
            <div className="sticky top-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
              <div className="space-y-2 text-sm">
                {summaryLines.map((line, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">{line.label}</span>
                    <span className="font-medium text-gray-900">{line.value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                <p className="text-sm font-bold text-amber-800 mb-1">Contact Us for Pricing</p>
                <p className="text-xs text-amber-700">This product requires a custom quote. Please contact our team.</p>
              </div>
              <a
                href="/contact"
                className="block w-full rounded-xl bg-gray-900 py-3 text-center text-sm font-bold text-white hover:bg-gray-800 transition"
              >
                Contact Us
              </a>
              <a
                href="tel:+16476990549"
                className="block w-full rounded-xl border-2 border-gray-200 py-3 text-center text-sm font-bold text-gray-700 hover:border-gray-400 transition"
              >
                Call (647) 699-0549
              </a>
            </div>
          ) : (
            <PricingSidebar
              summaryLines={summaryLines}
              quoteLoading={quote.quoteLoading}
              quoteError={quote.quoteError}
              unitCents={quote.unitCents}
              subtotalCents={quote.subtotalCents}
              taxCents={quote.taxCents}
              totalCents={quote.totalCents}
              canAddToCart={canAddToCart}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              buyNowLoading={buyNowLoading}
              extraRows={extraRows}
              badges={[
                t("marketingPrint.badgeFullColor", "Full colour"),
                t("marketingPrint.badgeShipping", "Fast shipping"),
              ]}
              t={t}
            />
          )}
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.totalCents}
        summaryText={quote.quoteData ? `${formatCad(quote.unitCents)}/ea × ${effectiveQty}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
      />
    </main>
  );
}
