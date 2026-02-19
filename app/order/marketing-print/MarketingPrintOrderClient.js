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
  useConfiguratorQuote,
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
  const [paperId, setPaperId] = useState(() => {
    const def = printType.papers.find((p) => p.default);
    return def ? def.id : printType.papers[0].id;
  });
  const [sides, setSides] = useState(printType.sides.includes("double") ? "double" : "single");
  const [finishing, setFinishing] = useState(() =>
    printType.finishings[0] === "none" ? "none" : printType.finishings[0],
  );
  const [quantity, setQuantity] = useState(printType.quantities[0] ?? 100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

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
    const defPaper = newType.papers.find((p) => p.default);
    setPaperId(defPaper ? defPaper.id : newType.papers[0].id);
    setSides(newType.sides.includes("double") ? "double" : "single");
    setFinishing(newType.finishings[0] === "none" ? "none" : newType.finishings[0]);
    setQuantity(newType.quantities[0] ?? 100);
    setCustomQty("");
    // Reset extras
    const init = {};
    for (const ex of newType.extras || []) {
      init[ex.key] = ex.default;
    }
    setExtrasState(init);
  }, []);

  const selectedSize = printType.sizes[sizeIdx];
  const widthIn = selectedSize?.w ?? 3.5;
  const heightIn = selectedSize?.h ?? 2;
  const effectiveQty = customQty ? Math.max(1, parseInt(customQty) || 0) : quantity;

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

  // --- Quote ---
  const quote = useConfiguratorQuote({
    slug: typeId,
    quantity: effectiveQty,
    widthIn,
    heightIn,
    material: paperId,
    extra: {
      sizeLabel: selectedSize?.label,
      finishings: finishing !== "none" ? [finishing] : [],
      sides,
    },
    enabled: effectiveQty > 0,
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
      name: `${printType.label} — ${selectedSize?.label || "Custom"}`,
      price: quote.unitCents || 0,
      quantity: effectiveQty,
      image: null,
      options: {
        width: widthIn,
        height: heightIn,
        material: paperId,
        sizeLabel: selectedSize?.label,
        sides,
        finishing,
        ...extrasForCart,
      },
    };
  }, [effectiveQty, typeId, printType, selectedSize, quote.unitCents, widthIn, heightIn, paperId, sides, finishing, extrasState]);

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
    lines.push({ label: "Size", value: selectedSize?.label });
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
  }, [hideTypeSelector, printType, selectedSize, selectedPaper, paperId, paperSurchargePerUnit, hasPaperStep, hasSidesStep, sides, hasFinishingStep, finishing, extrasState, effectiveQty]);

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
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-2">

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
                    onClick={() => setSizeIdx(idx)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                      sizeIdx === idx
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
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
                    <span className="text-base font-black">{q >= 1000 ? `${q / 1000}K` : q}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("marketingPrint.customQty", "Custom")}:</label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 200"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* Step: Upload Artwork */}
            <ConfigStep number={++step} title={t("marketingPrint.artwork", "Upload Artwork")} optional>
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                t={t}
              />
            </ConfigStep>
          </div>

          {/* RIGHT COLUMN */}
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
