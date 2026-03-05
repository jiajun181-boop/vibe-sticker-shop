"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_GROUPS,
  VEHICLE_TYPE_OPTIONS,
  getVehicleType,
} from "@/lib/vehicle-order-config";
import {
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  CustomDimensions,
  useConfiguratorPrice,
  useConfiguratorCart,
  StepCard,
  OptionCard,
  OptionGrid,
  useStepScroll,
} from "@/components/configurator";
import QuantityScroller from "@/components/configurator/QuantityScroller";
import VehiclePreview from "@/components/vehicle/VehiclePreview";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";

const INCH_TO_CM = 2.54;

export default function VehicleOrderClient({ defaultType, productImages }) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  // --- State ---
  const [typeId, setTypeId] = useState(defaultType || "door-graphics");
  const vehicleType = useMemo(() => getVehicleType(typeId), [typeId]);

  const [vehicleBodyId, setVehicleBodyId] = useState("");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(vehicleType.materials[0].id);
  const [quantity, setQuantity] = useState(vehicleType.quantities[0] ?? 1);
  const [customQty, setCustomQty] = useState("");
  const [textInput, setTextInput] = useState(""); // for DOT/MC numbers
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);

  const isCustomSize = sizeIdx === -1;

  const widthIn = useMemo(() => {
    if (!vehicleType.hasDimensions && !isCustomSize && vehicleType.sizes.length > 0) {
      return vehicleType.sizes[sizeIdx]?.w ?? 0;
    }
    if (!isCustomSize && vehicleType.sizes.length > 0) return vehicleType.sizes[sizeIdx]?.w ?? 24;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, vehicleType, customW, unit]);

  const heightIn = useMemo(() => {
    if (!vehicleType.hasDimensions && !isCustomSize && vehicleType.sizes.length > 0) {
      return vehicleType.sizes[sizeIdx]?.h ?? 0;
    }
    if (!isCustomSize && vehicleType.sizes.length > 0) return vehicleType.sizes[sizeIdx]?.h ?? 24;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, vehicleType, customH, unit]);

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
    setMaterialId(vehicleType.materials[0].id);
    setQuantity(vehicleType.quantities[0] ?? 1);
    setCustomQty("");
    setTextInput("");
    setVehicleBodyId(vehicleType.vehicleTypes[0] || "");
    setDimErrors([]);
  }, [typeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate dimensions
  useEffect(() => {
    if (!vehicleType.hasDimensions) { setDimErrors([]); return; }
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
    const errs = [];
    if (widthIn < vehicleType.minIn) errs.push(`Width must be at least ${vehicleType.minIn}"`);
    if (heightIn < vehicleType.minIn) errs.push(`Height must be at least ${vehicleType.minIn}"`);
    if (widthIn > vehicleType.maxW) errs.push(`Width cannot exceed ${vehicleType.maxW}"`);
    if (heightIn > vehicleType.maxH) errs.push(`Height cannot exceed ${vehicleType.maxH}"`);
    setDimErrors(errs);
  }, [widthIn, heightIn, vehicleType]);

  const isQuoteOnly = vehicleType.quoteOnly;

  // Quote (skip for quote-only types)
  const quote = useConfiguratorPrice({
    slug: vehicleType.defaultSlug,
    quantity: activeQty,
    widthIn: widthIn || undefined,
    heightIn: heightIn || undefined,
    material: materialId,
    enabled: !isQuoteOnly && activeQty > 0 && dimErrors.length === 0 && (
      !vehicleType.hasDimensions || (widthIn > 0 && heightIn > 0)
    ),
  });

  const canAddToCart = !isQuoteOnly && quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // Cart
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = vehicleType.sizes.length > 0
      ? (isCustomSize
        ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
        : vehicleType.sizes[sizeIdx]?.label || "Standard")
      : "Standard";
    const nameParts = [t(`vehicle.type.${typeId}`)];
    if (sizeLabel !== "Standard") nameParts.push(sizeLabel);
    if (textInput.trim()) nameParts.push(textInput.trim());

    return {
      id: vehicleType.defaultSlug,
      name: nameParts.join(" — "),
      slug: vehicleType.defaultSlug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        vehicleType: typeId,
        vehicleBody: vehicleBodyId || null,
        width: widthIn || null,
        height: heightIn || null,
        sizeLabel,
        material: materialId,
        text: textInput.trim() || null,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, typeId, vehicleBodyId, widthIn, heightIn, isCustomSize, sizeIdx, vehicleType, materialId, textInput, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("vehicle.addedToCart"),
  });

  // Request quote handler for wrap/fleet types — redirects to /quote with prefill
  function handleRequestQuote() {
    const typeName = t(`vehicle.type.${typeId}`);
    const descParts = [
      `Inquiry for ${typeName}`,
      vehicleBodyId ? `Vehicle: ${VEHICLE_TYPE_OPTIONS.find((v) => v.id === vehicleBodyId)?.label || vehicleBodyId}` : null,
      `Quantity: ${activeQty}`,
      textInput.trim() ? `Text: ${textInput.trim()}` : null,
    ].filter(Boolean).join("\n");

    const params = new URLSearchParams({
      sku: "vehicle-graphics-fleet",
      name: typeName,
      context: descParts,
    });
    router.push(`/quote?${params.toString()}`);
  }

  // --- Accordion state ---
  const [activeStepId, setActiveStepId] = useState(null);

  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "type",        vis: true },
      { id: "vehicleBody", vis: vehicleType.vehicleTypes.length > 0 },
      { id: "material",    vis: true },
      { id: "size",        vis: vehicleType.sizes.length > 0 },
      { id: "textInput",   vis: !!vehicleType.hasTextInput },
      { id: "quantity",    vis: true },
      { id: "artwork",     vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [vehicleType]);

  const stepNumFn = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);

  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // --- Summary texts ---
  const typeSummary = t(`vehicle.type.${typeId}`);
  const vehicleBodySummary = VEHICLE_TYPE_OPTIONS.find((v) => v.id === vehicleBodyId)?.label || vehicleBodyId || "—";
  const materialSummary = vehicleType.materials.find((m) => m.id === materialId)?.label || materialId;
  const sizeSummary = vehicleType.sizes.length > 0
    ? (isCustomSize
      ? (widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "Custom")
      : vehicleType.sizes[sizeIdx]?.label || "—")
    : "—";
  const textInputSummary = textInput.trim() || "Not entered";
  const quantitySummary = `${activeQty.toLocaleString()} pcs`;
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

  // --- Summary lines for PricingSidebar ---
  const summaryLines = [
    { label: t("vehicle.type.label"), value: t(`vehicle.type.${typeId}`) },
  ];
  if (vehicleBodyId) {
    summaryLines.push({
      label: t("vehicle.vehicleBody"),
      value: VEHICLE_TYPE_OPTIONS.find((v) => v.id === vehicleBodyId)?.label || vehicleBodyId,
    });
  }
  if (vehicleType.sizes.length > 0) {
    summaryLines.push({
      label: t("vehicle.size"),
      value: isCustomSize
        ? widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "—"
        : vehicleType.sizes[sizeIdx]?.label || "—",
    });
  }
  summaryLines.push(
    { label: t("vehicle.material"), value: vehicleType.materials.find((m) => m.id === materialId)?.label || materialId },
    { label: t("vehicle.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
  );
  if (textInput.trim()) {
    summaryLines.push({ label: t("vehicle.text"), value: textInput.trim() });
  }

  const formatCad = (cents) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("vehicle.breadcrumb"), href: "/shop/vehicle-graphics-fleet" },
          { label: t("vehicle.order") },
        ]}
        title={t(`vehicle.type.${typeId}`)}
        subtitle={t("vehicle.subtitle")}
        badges={[t("vehicle.badgeDurable"), t("vehicle.badgeShipping"), t("vehicle.badgeProof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-3 lg:col-span-2">

            {/* Step 1: Type (grouped) */}
            <StepCard
              stepNumber={stepNumFn("type")}
              title={t("vehicle.type.label")}
              hint={t("vehicle.type.subtitle")}
              summaryText={typeSummary}
              open={isStepOpen("type")}
              onToggle={() => toggleStep("type")}
              stepId="step-type"
            >
              <div className="space-y-5">
                {VEHICLE_TYPE_GROUPS.map((grp) => {
                  const items = VEHICLE_TYPES.filter((vt) => vt.group === grp.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={grp.id}>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        {t(`vehicle.group.${grp.id}`, grp.label)}
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {items.map((vt) => (
                          <OptionCard
                            key={vt.id}
                            label={t(`vehicle.type.${vt.id}`)}
                            selected={typeId === vt.id}
                            onSelect={() => { setTypeId(vt.id); advanceStep("step-type"); }}
                            badge={vt.quoteOnly ? (
                              <span className="text-[10px] font-bold text-amber-600">Quote only</span>
                            ) : null}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </StepCard>

            {/* Step: Vehicle Type (if applicable) */}
            {vehicleType.vehicleTypes.length > 0 && (
              <StepCard
                stepNumber={stepNumFn("vehicleBody")}
                title={t("vehicle.vehicleBody")}
                hint={t("vehicle.vehicleBodySubtitle")}
                summaryText={vehicleBodySummary}
                open={isStepOpen("vehicleBody")}
                onToggle={() => toggleStep("vehicleBody")}
                stepId="step-vehicleBody"
              >
                <OptionGrid columns={3} label={t("vehicle.vehicleBody")}>
                  {vehicleType.vehicleTypes.map((vtId) => {
                    const opt = VEHICLE_TYPE_OPTIONS.find((v) => v.id === vtId);
                    return (
                      <OptionCard
                        key={vtId}
                        label={opt?.label || vtId}
                        selected={vehicleBodyId === vtId}
                        onSelect={() => { setVehicleBodyId(vtId); advanceStep("step-vehicleBody"); }}
                      />
                    );
                  })}
                </OptionGrid>
              </StepCard>
            )}

            {/* Step: Material */}
            <StepCard
              stepNumber={stepNumFn("material")}
              title={t("vehicle.material")}
              hint={t("vehicle.materialSubtitle")}
              summaryText={materialSummary}
              open={isStepOpen("material")}
              onToggle={() => toggleStep("material")}
              stepId="step-material"
            >
              <OptionGrid columns={3} label={t("vehicle.material")}>
                {vehicleType.materials.map((mat) => {
                  void mat.multiplier; // multiplier used in pricing only
                  return (
                    <OptionCard
                      key={mat.id}
                      label={mat.label}
                      selected={materialId === mat.id}
                      onSelect={() => { setMaterialId(mat.id); advanceStep("step-material"); }}
                    />
                  );
                })}
              </OptionGrid>
            </StepCard>

            {/* Step: Size (if applicable) */}
            {vehicleType.sizes.length > 0 && (
              <StepCard
                stepNumber={stepNumFn("size")}
                title={t("vehicle.size")}
                hint={t("vehicle.sizeSubtitle")}
                summaryText={sizeSummary}
                open={isStepOpen("size")}
                onToggle={() => toggleStep("size")}
                stepId="step-size"
              >
                <OptionGrid columns={4} label={t("vehicle.size")}>
                  {vehicleType.sizes.map((s, i) => (
                    <OptionCard
                      key={i}
                      label={s.label}
                      selected={sizeIdx === i && !isCustomSize}
                      onSelect={() => { setSizeIdx(i); setCustomW(""); setCustomH(""); advanceStep("step-size"); }}
                    />
                  ))}
                  {vehicleType.hasDimensions && (
                    <OptionCard
                      label={t("vehicle.customSize")}
                      selected={isCustomSize}
                      onSelect={() => setSizeIdx(-1)}
                      className={isCustomSize ? "" : "border-dashed"}
                      icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      }
                    />
                  )}
                </OptionGrid>
                {isCustomSize && vehicleType.hasDimensions && (
                  <CustomDimensions
                    customW={customW} customH={customH}
                    onChangeW={setCustomW} onChangeH={setCustomH}
                    unit={unit} onChangeUnit={setUnit}
                    minLabel={`${vehicleType.minIn}" × ${vehicleType.minIn}"`}
                    maxLabel={`${vehicleType.maxW}" × ${vehicleType.maxH}"`}
                    dimErrors={dimErrors} t={t}
                  />
                )}
              </StepCard>
            )}

            {/* Step: Text Input (DOT/MC numbers, compliance) */}
            {vehicleType.hasTextInput && (
              <StepCard
                stepNumber={stepNumFn("textInput")}
                title={t("vehicle.textInput")}
                hint={t("vehicle.textInputSubtitle")}
                summaryText={textInputSummary}
                open={isStepOpen("textInput")}
                onToggle={() => toggleStep("textInput")}
                stepId="step-textInput"
              >
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    {t("vehicle.enterText")}
                  </label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={typeId === "dot-numbers" ? "e.g. USDOT 1234567" : "e.g. Company Name, Phone"}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                  />
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    {t("vehicle.textHint")}
                  </p>
                </div>
              </StepCard>
            )}

            {/* Quantity */}
            <StepCard
              stepNumber={stepNumFn("quantity")}
              title={t("vehicle.quantity")}
              hint={t("vehicle.quantitySubtitle")}
              summaryText={quantitySummary}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
            >
              <QuantityScroller
                quantities={vehicleType.quantities}
                selected={quantity}
                onSelect={(q) => { setQuantity(q); setCustomQty(""); advanceStep("step-quantity"); }}
                customQty={customQty}
                onCustomChange={setCustomQty}
                t={t}
                placeholder="e.g. 3"
              />
            </StepCard>

            {/* Upload */}
            <StepCard
              stepNumber={stepNumFn("artwork")}
              title={t("vehicle.artwork")}
              hint={t("vehicle.artworkSubtitle")}
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
            previewSlot={
              <VehiclePreview
                vehicleBody={vehicleBodyId || vehicleType.vehicleTypes[0] || "car"}
                graphicType={typeId}
                text={textInput}
              />
            }
            summaryLines={summaryLines}
            quoteLoading={quote.quoteLoading}
            quoteError={quote.quoteError}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            taxCents={quote.taxCents}
            totalCents={quote.subtotalCents}
            quantity={activeQty}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            badges={[t("vehicle.badgeDurable"), t("vehicle.badgeShipping")]}
            t={t}
            quoteOnly={isQuoteOnly}
            onRequestQuote={handleRequestQuote}
            productName={t(`vehicle.type.${typeId}`)}
            categorySlug="vehicle-graphics-fleet"
            locale={locale}
            productSlug={vehicleType.defaultSlug}
            onRetryPrice={quote.retry}
          />
        </div>
      </div>

      {(() => {
        const faqItems = getConfiguratorFaqs(typeId);
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={isQuoteOnly || !!quote.quoteData}
        totalCents={quote.subtotalCents}
        quantity={activeQty}
        summaryText={
          isQuoteOnly
            ? "Custom pricing — request a quote"
            : quote.quoteData
              ? `${formatCad(quote.unitCents)}/ea × ${activeQty}`
              : null
        }
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        quoteOnly={isQuoteOnly}
        onRequestQuote={handleRequestQuote}
        productName={t(`vehicle.type.${typeId}`)}
        summaryLines={summaryLines}
        unitCents={quote.unitCents}
        subtotalCents={quote.subtotalCents}
        categorySlug="vehicle-graphics-fleet"
        locale={locale}
        onRetryPrice={quote.retry}
      />
    </main>
  );
}
