"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_OPTIONS,
  getVehicleType,
} from "@/lib/vehicle-order-config";
import {
  ConfigStep,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  CustomDimensions,
  useConfiguratorQuote,
  useConfiguratorCart,
} from "@/components/configurator";

const INCH_TO_CM = 2.54;

export default function VehicleOrderClient({ defaultType, productImages }) {
  const { t } = useTranslation();

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
  const quote = useConfiguratorQuote({
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

  // Request quote handler for wrap/fleet types
  function handleRequestQuote() {
    const subject = `Quote: ${t(`vehicle.type.${typeId}`)}`;
    const body = [
      `Type: ${t(`vehicle.type.${typeId}`)}`,
      vehicleBodyId ? `Vehicle: ${VEHICLE_TYPE_OPTIONS.find((v) => v.id === vehicleBodyId)?.label || vehicleBodyId}` : null,
      `Quantity: ${activeQty}`,
      textInput.trim() ? `Text: ${textInput.trim()}` : null,
    ].filter(Boolean).join("\n");
    window.location.href = `mailto:info@lunarprint.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

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

  let stepNum = 1;

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("vehicle.breadcrumb"), href: "/shop/vehicle-graphics-fleet" },
          { label: t("vehicle.order") },
        ]}
        title={t("vehicle.title")}
        subtitle={t("vehicle.subtitle")}
        badges={[t("vehicle.badgeDurable"), t("vehicle.badgeShipping"), t("vehicle.badgeProof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-2">

            {/* Step 1: Type */}
            <ConfigStep number={stepNum++} title={t("vehicle.type.label")} subtitle={t("vehicle.type.subtitle")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {VEHICLE_TYPES.map((vt) => (
                  <button
                    key={vt.id}
                    type="button"
                    onClick={() => setTypeId(vt.id)}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                      typeId === vt.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                    }`}
                  >
                    {typeId === vt.id && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </span>
                    )}
                    <span className="text-sm font-bold">{t(`vehicle.type.${vt.id}`)}</span>
                    {vt.quoteOnly && (
                      <span className={`text-[10px] font-bold ${typeId === vt.id ? "text-amber-300" : "text-amber-600"}`}>
                        Quote only
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Step: Vehicle Type (if applicable) */}
            {vehicleType.vehicleTypes.length > 0 && (
              <ConfigStep number={stepNum++} title={t("vehicle.vehicleBody")} subtitle={t("vehicle.vehicleBodySubtitle")}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {vehicleType.vehicleTypes.map((vtId) => {
                    const opt = VEHICLE_TYPE_OPTIONS.find((v) => v.id === vtId);
                    const isActive = vehicleBodyId === vtId;
                    return (
                      <button
                        key={vtId}
                        type="button"
                        onClick={() => setVehicleBodyId(vtId)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                          isActive
                            ? "border-gray-900 bg-gray-900 text-white shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span className="text-sm font-bold">{opt?.label || vtId}</span>
                      </button>
                    );
                  })}
                </div>
              </ConfigStep>
            )}

            {/* Step: Material */}
            <ConfigStep number={stepNum++} title={t("vehicle.material")} subtitle={t("vehicle.materialSubtitle")}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {vehicleType.materials.map((mat) => {
                  const isActive = materialId === mat.id;
                  const surcharge = mat.multiplier > 1 ? `+${Math.round((mat.multiplier - 1) * 100)}%` : null;
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
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-800">{mat.label}</span>
                      {surcharge && (
                        <span className="inline-flex w-fit rounded-xl bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {surcharge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ConfigStep>

            {/* Step: Size (if applicable) */}
            {vehicleType.sizes.length > 0 && (
              <ConfigStep number={stepNum++} title={t("vehicle.size")} subtitle={t("vehicle.sizeSubtitle")}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {vehicleType.sizes.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSizeIdx(i); setCustomW(""); setCustomH(""); }}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                        sizeIdx === i
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-sm font-bold">{s.label}</span>
                    </button>
                  ))}
                  {vehicleType.hasDimensions && (
                    <button
                      type="button"
                      onClick={() => setSizeIdx(-1)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                        isCustomSize
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-500"
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                      <span className="text-xs font-bold">{t("vehicle.customSize")}</span>
                    </button>
                  )}
                </div>
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
              </ConfigStep>
            )}

            {/* Step: Text Input (DOT/MC numbers, compliance) */}
            {vehicleType.hasTextInput && (
              <ConfigStep number={stepNum++} title={t("vehicle.textInput")} subtitle={t("vehicle.textInputSubtitle")}>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    {t("vehicle.enterText")}
                  </label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={typeId === "dot-numbers" ? "e.g. USDOT 1234567" : "e.g. Company Name, Phone"}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    {t("vehicle.textHint")}
                  </p>
                </div>
              </ConfigStep>
            )}

            {/* Quantity */}
            <ConfigStep number={stepNum++} title={t("vehicle.quantity")} subtitle={t("vehicle.quantitySubtitle")}>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {vehicleType.quantities.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuantity(q); setCustomQty(""); }}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">{q}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("vehicle.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* Upload */}
            <ConfigStep number={stepNum++} title={t("vehicle.artwork")} subtitle={t("vehicle.artworkSubtitle")} optional>
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
            totalCents={quote.totalCents}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            badges={[t("vehicle.badgeDurable"), t("vehicle.badgeShipping")]}
            t={t}
            quoteOnly={isQuoteOnly}
            onRequestQuote={handleRequestQuote}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={isQuoteOnly || !!quote.quoteData}
        totalCents={quote.totalCents}
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
      />
    </main>
  );
}
