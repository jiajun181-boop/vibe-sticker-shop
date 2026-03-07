"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  PRINT_TYPES,
  PRINT_TYPE_GROUPS,
  getMarketingPrintType,
  FINISHING_LABELS,
} from "@/lib/marketing-print-order-config";
import BrochureFoldPreview from "@/components/brochure/BrochureFoldPreview";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";

import {
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  DeliveryEstimate,
  EmailQuotePopover,
  ArtworkUpload,
  LetterheadTemplateBuilder,
  useConfiguratorPrice,
  useConfiguratorCart,
  StepCard,
  OptionCard,
  OptionGrid,
  useStepScroll,
} from "@/components/configurator";
import QuantityScroller from "@/components/configurator/QuantityScroller";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const formatSurcharge = (cents) =>
  cents >= 100 ? `+${formatCad(cents)}/ea` : `+$0.${String(cents).padStart(2, "0")}/ea`;

export default function MarketingPrintOrderClient({
  defaultType,
  hideTypeSelector = false,
  productImages,
}) {
  const { t, locale } = useTranslation();

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
    slug: printType.pricingSlug || typeId,
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

  // --- Accordion state ---
  const [activeStepId, setActiveStepId] = useState(hideTypeSelector ? "step-size" : "step-type");

  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "type",     vis: !hideTypeSelector },
      { id: "size",     vis: true },
      { id: "quantity", vis: true },
    ];
    if (hasPaperStep)     defs.push({ id: "paper",     vis: true });
    if (hasSidesStep)     defs.push({ id: "sides",     vis: true });
    if (hasFinishingStep) defs.push({ id: "finishing",  vis: true });
    for (const ex of printType.extras || []) {
      defs.push({ id: `extra-${ex.key}`, vis: true });
    }
    defs.push({ id: "artwork", vis: true });
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [hideTypeSelector, hasPaperStep, hasSidesStep, hasFinishingStep, printType.extras]);

  const stepNum = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);

  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // --- Summary texts ---
  const paperSummary = selectedPaper?.label || paperId;
  const sidesSummary = sides === "double" ? "Double-Sided" : "Single-Sided";
  const finishingSummary = FINISHING_LABELS[finishing] || finishing;

  // --- Summary lines for PricingSidebar ---
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
        <div className="md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-2 sm:space-y-3 md:col-span-2">

            {/* Product Gallery — inside grid so sidebar starts beside it */}
            {productImages?.length > 0 && (
              <ConfigProductGallery images={productImages} inline />
            )}

            {/* Step: Print Type (hidden when direct-entry) */}
            {!hideTypeSelector && (
              <StepCard
                stepNumber={stepNum("type")}
                title={t("marketingPrint.type", "Product Type")}
                summaryText={printType.label}
                open={isStepOpen("type")}
                onToggle={() => toggleStep("type")}
                stepId="step-type"
              >
                <div className="space-y-5">
                  {PRINT_TYPE_GROUPS.map((grp) => {
                    const items = PRINT_TYPES.filter((pt) => pt.group === grp.id);
                    if (items.length === 0) return null;
                    return (
                      <div key={grp.id}>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          {t(`marketingPrint.group.${grp.id}`, grp.label)}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {items.map((pt) => (
                            <OptionCard
                              key={pt.id}
                              label={pt.label}
                              selected={typeId === pt.id}
                              onSelect={() => { handleTypeChange(pt.id); advanceStep("step-type"); }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </StepCard>
            )}

            {/* Step: Size */}
            <StepCard
              stepNumber={stepNum("size")}
              title={t("marketingPrint.size", "Size")}
              hint={t("step.size.hint")}
              summaryText={sizeLabel || "Custom"}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
              alwaysOpen
              compact
            >
              <OptionGrid columns={printType.sizes.length <= 4 ? printType.sizes.length + (printType.customSize ? 1 : 0) : 4} label={t("step.size")}>
                {printType.sizes.map((s, idx) => (
                  <OptionCard
                    key={idx}
                    label={s.label}
                    selected={sizeIdx === idx && !isCustomSize}
                    onSelect={() => { setSizeIdx(idx); setIsCustomSize(false); advanceStep("step-size"); }}
                  />
                ))}
                {printType.customSize && (
                  <OptionCard
                    label="Custom Size"
                    selected={isCustomSize}
                    onSelect={() => setIsCustomSize(true)}
                    className={isCustomSize ? "" : "border-dashed"}
                  />
                )}
              </OptionGrid>

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
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                    />
                    <span className="text-xs text-gray-400">in</span>
                  </div>
                  <span className="text-gray-400">&times;</span>
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
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                    />
                    <span className="text-xs text-gray-400">in</span>
                  </div>
                  <span className="text-xs text-gray-400">(max {printType.customSize.maxW}&quot; &times; {printType.customSize.maxH}&quot;)</span>
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
                            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                          />
                          <span className="text-gray-400">&times;</span>
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
                            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
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
                      className="text-sm font-medium text-teal-600 hover:text-teal-800"
                    >
                      + Add More Sizes {extraSizes.length > 0 && `(${extraSizes.length}/${printType.moreSizes})`}
                    </button>
                  )}
                </div>
              )}
            </StepCard>

            {/* Step: Quantity */}
            <StepCard
              stepNumber={stepNum("quantity")}
              title={t("marketingPrint.quantity", "Quantity")}
              hint={t("step.quantity.hint")}
              summaryText={`${effectiveQty.toLocaleString()} pcs`}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
              compact
            >
              {printType.quantityMode === "input" ? (
                <input
                  type="number"
                  min={1}
                  placeholder="Enter quantity"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              ) : (
                <QuantityScroller
                  quantities={printType.quantities}
                  selected={quantity}
                  onSelect={(q) => { setQuantity(q); setCustomQty(""); advanceStep("step-quantity"); }}
                  customQty={customQty}
                  onCustomChange={setCustomQty}
                  t={t}
                  placeholder="e.g. 200"
                />
              )}
            </StepCard>

            {/* Step: Paper / Stock (hidden if single option) */}
                {hasPaperStep && (
                  <StepCard
                    stepNumber={stepNum("paper")}
                    title={t("marketingPrint.paper", "Paper / Stock")}
                    summaryText={paperSummary}
                    open={isStepOpen("paper")}
                    onToggle={() => toggleStep("paper")}
                    stepId="step-paper"
                    alwaysOpen
                    compact
                  >
                    <OptionGrid columns={printType.papers.length <= 3 ? printType.papers.length : 3} label={t("marketingPrint.paper", "Paper / Stock")}>
                      {printType.papers.map((p) => (
                        <OptionCard
                          key={p.id}
                          label={p.label}
                          selected={paperId === p.id}
                          onSelect={() => { setPaperId(p.id); advanceStep("step-paper"); }}
                          badge={p.surcharge > 0 ? (
                            <span className="text-[9px] font-bold text-emerald-600">{formatSurcharge(p.surcharge)}</span>
                          ) : null}
                        />
                      ))}
                    </OptionGrid>
                  </StepCard>
                )}

                {/* Step: Sides (hidden if single option) */}
                {hasSidesStep && (
                  <StepCard
                    stepNumber={stepNum("sides")}
                    title={t("marketingPrint.sides", "Print Sides")}
                    summaryText={sidesSummary}
                    open={isStepOpen("sides")}
                    onToggle={() => toggleStep("sides")}
                    stepId="step-sides"
                    alwaysOpen
                    compact
                  >
                    <OptionGrid columns={2} label={t("marketingPrint.sides", "Print Sides")}>
                      <OptionCard
                        label={t("marketingPrint.singleSided", "Single-Sided")}
                        selected={sides === "single"}
                        onSelect={() => { setSides("single"); advanceStep("step-sides"); }}
                      />
                      <OptionCard
                        label={t("marketingPrint.doubleSided", "Double-Sided")}
                        selected={sides === "double"}
                        onSelect={() => { setSides("double"); advanceStep("step-sides"); }}
                      />
                    </OptionGrid>
                  </StepCard>
                )}

                {/* Step: Finishing (hidden if only "none") */}
                {hasFinishingStep && (
                  <StepCard
                    stepNumber={stepNum("finishing")}
                    title={t("marketingPrint.finishing", "Finishing")}
                    summaryText={finishingSummary}
                    open={isStepOpen("finishing")}
                    onToggle={() => toggleStep("finishing")}
                    stepId="step-finishing"
                  >
                    <OptionGrid columns={printType.finishings.length <= 4 ? printType.finishings.length : 4} label={t("marketingPrint.finishing", "Finishing")}>
                      {printType.finishings.map((f) => (
                        <OptionCard
                          key={f}
                          label={FINISHING_LABELS[f] || f}
                          selected={finishing === f}
                          onSelect={() => { setFinishing(f); advanceStep("step-finishing"); }}
                        />
                      ))}
                    </OptionGrid>
                  </StepCard>
                )}

                {/* Steps: Extras (dynamic from printType.extras) */}
                {(printType.extras || []).map((ex) => {
                  const selectedOpt = ex.options.find((o) => o.id === extrasState[ex.key]);
                  return (
                    <StepCard
                      key={ex.key}
                      stepNumber={stepNum(`extra-${ex.key}`)}
                      title={ex.label}
                      summaryText={selectedOpt?.label || "None"}
                      open={isStepOpen(`extra-${ex.key}`)}
                      onToggle={() => toggleStep(`extra-${ex.key}`)}
                      stepId={`step-extra-${ex.key}`}
                    >
                      <OptionGrid columns={ex.options.length <= 4 ? ex.options.length : 4} label={ex.label}>
                        {ex.options.map((opt) => (
                          <OptionCard
                            key={opt.id}
                            label={opt.label}
                            selected={extrasState[ex.key] === opt.id}
                            onSelect={() => {
                              setExtrasState((prev) => ({ ...prev, [ex.key]: opt.id }));
                              advanceStep(`step-extra-${ex.key}`);
                            }}
                            badge={opt.surcharge > 0 ? (
                              <span className="text-[9px] font-bold text-amber-600">{formatSurcharge(opt.surcharge)}</span>
                            ) : null}
                          />
                        ))}
                      </OptionGrid>
                    </StepCard>
                  );
                })}

                {/* Step: Artwork */}
                <StepCard
                  stepNumber={stepNum("artwork")}
                  title={t("marketingPrint.artwork", "Artwork")}
                  hint={t("step.artwork.hint")}
                  summaryText={uploadedFile?.name || t("step.notUploaded")}
                  optional
                  open={isStepOpen("artwork")}
                  onToggle={() => toggleStep("artwork")}
                  stepId="step-artwork"
                >
                  {printType.templateBuilder ? (
                    <>
                      {/* Toggle: Upload vs Template */}
                      <div className="mb-4">
                        <OptionGrid columns={2} label={t("marketingPrint.artwork", "Artwork")}>
                          <OptionCard
                            label={t("marketingPrint.uploadDesign", "Upload Your Design")}
                            selected={artworkMode === "upload"}
                            onSelect={() => setArtworkMode("upload")}
                          />
                          <OptionCard
                            label={t("marketingPrint.useTemplate", "Use Our Template")}
                            selected={artworkMode === "template"}
                            onSelect={() => setArtworkMode("template")}
                          />
                        </OptionGrid>
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
                </StepCard>
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
                className="block w-full rounded-xl bg-gray-900 py-3 text-center text-sm font-bold text-[#fff] hover:bg-gray-800 transition"
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
              previewSlot={typeId.startsWith("brochures-") ? <BrochureFoldPreview typeId={typeId} /> : undefined}
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
              badges={[
                t("marketingPrint.badgeFullColor", "Full colour"),
                t("marketingPrint.badgeShipping", "Fast shipping"),
              ]}
              t={t}
              productName={printType.label}
              categorySlug="marketing-business-print"
              locale={locale}
              productSlug={typeId}
              onRetryPrice={quote.retry}
            />
          )}
        </div>
      </div>

      {/* FAQ Section */}
      {(() => {
        const faqItems = getConfiguratorFaqs(typeId);
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl pb-16 pt-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

      {/* Inline mobile delivery + email quote (scrolls with page, not fixed) */}
      {!!quote.quoteData && (
        <div className="mx-auto max-w-4xl px-4 pb-4 md:hidden space-y-3">
          <DeliveryEstimate categorySlug="marketing-business-print" t={t} locale={locale} />
          <EmailQuotePopover
            productName={printType.label}
            summaryLines={summaryLines || []}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            quantity={effectiveQty}
            t={t}
          />
        </div>
      )}

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
        onRetryPrice={quote.retry}
      />
    </main>
  );
}
