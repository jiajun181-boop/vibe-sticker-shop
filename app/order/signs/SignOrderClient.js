"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  SIGN_TYPES,
  ACCESSORY_OPTIONS,
  getSignType,
} from "@/lib/sign-order-config";
import {
  ConfigStep,
  ConfigHero,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  CustomDimensions,
  useConfiguratorQuote,
  useConfiguratorCart,
} from "@/components/configurator";

const INCH_TO_CM = 2.54;

export default function SignOrderClient({ defaultType }) {
  const { t } = useTranslation();

  // --- State ---
  const [typeId, setTypeId] = useState(defaultType || "yard-sign");
  const signType = useMemo(() => getSignType(typeId), [typeId]);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(signType.materials[0].id);
  const [accessories, setAccessories] = useState(signType.defaultAccessories);
  const [quantity, setQuantity] = useState(signType.quantities[0] ?? 1);
  const [customQty, setCustomQty] = useState("");
  const [doubleSided, setDoubleSided] = useState(signType.doubleSided);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);

  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return signType.sizes[sizeIdx]?.w ?? 18;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, signType, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return signType.sizes[sizeIdx]?.h ?? 24;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, signType, customH, unit]);

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
    setMaterialId(signType.materials[0].id);
    setAccessories(signType.defaultAccessories);
    setQuantity(signType.quantities[0] ?? 1);
    setCustomQty("");
    setDoubleSided(signType.doubleSided);
    setDimErrors([]);
  }, [typeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate dimensions
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
    const errs = [];
    if (widthIn < signType.minIn) errs.push(`Width must be at least ${signType.minIn}"`);
    if (heightIn < signType.minIn) errs.push(`Height must be at least ${signType.minIn}"`);
    if (widthIn > signType.maxW) errs.push(`Width cannot exceed ${signType.maxW}"`);
    if (heightIn > signType.maxH) errs.push(`Height cannot exceed ${signType.maxH}"`);
    setDimErrors(errs);
  }, [widthIn, heightIn, signType]);

  // Accessory surcharges
  const accessorySurcharge = useMemo(() => {
    return accessories.reduce((sum, aId) => {
      return sum + (ACCESSORY_OPTIONS[aId]?.surcharge ?? 0) * activeQty;
    }, 0);
  }, [accessories, activeQty]);

  // Double-sided surcharge (50% more)
  const doubleSidedMultiplier = doubleSided ? 1.5 : 1.0;

  // Quote
  const quote = useConfiguratorQuote({
    slug: signType.defaultSlug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    enabled: widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  // Add surcharges
  useEffect(() => {
    // For double-sided, add the raw subtotal * 0.5 as surcharge
    const dsExtra = doubleSided ? Math.round(quote.rawSubtotalCents * 0.5) : 0;
    quote.addSurcharge(accessorySurcharge + dsExtra);
  }, [accessorySurcharge, doubleSided, quote.rawSubtotalCents]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // Cart
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
      : signType.sizes[sizeIdx]?.label;
    return {
      id: signType.defaultSlug,
      name: `${t(`sign.type.${typeId}`)} — ${sizeLabel}`,
      slug: signType.defaultSlug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        signType: typeId,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        material: materialId,
        doubleSided,
        accessories: accessories.join(", ") || "None",
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, typeId, widthIn, heightIn, isCustomSize, sizeIdx, signType, materialId, doubleSided, accessories, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("sign.addedToCart"),
  });

  function toggleAccessory(aId) {
    setAccessories((prev) =>
      prev.includes(aId) ? prev.filter((a) => a !== aId) : [...prev, aId]
    );
  }

  const summaryLines = [
    { label: t("sign.type.label"), value: t(`sign.type.${typeId}`) },
    {
      label: t("sign.size"),
      value: isCustomSize
        ? widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "—"
        : signType.sizes[sizeIdx]?.label || "—",
    },
    { label: t("sign.material"), value: signType.materials.find((m) => m.id === materialId)?.label || materialId },
    { label: t("sign.sides"), value: doubleSided ? "Double-sided" : "Single-sided" },
    { label: t("sign.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
  ];
  if (accessories.length > 0) {
    summaryLines.push({
      label: t("sign.accessories"),
      value: accessories.map((a) => ACCESSORY_OPTIONS[a]?.label || a).join(", "),
    });
  }

  const extraRows = [];
  if (doubleSided) {
    extraRows.push({ label: "Double-sided", value: "+50%" });
  }
  if (accessorySurcharge > 0) {
    extraRows.push({ label: t("sign.accessorySurcharge"), value: `+ $${(accessorySurcharge / 100).toFixed(2)}` });
  }

  const formatCad = (cents) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  let stepNum = 1;

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("sign.breadcrumb"), href: "/shop/signs-rigid-boards" },
          { label: t("sign.order") },
        ]}
        title={t("sign.title")}
        subtitle={t("sign.subtitle")}
        badges={[t("sign.badgeWeatherproof"), t("sign.badgeShipping"), t("sign.badgeProof")]}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-2">

            {/* Step 1: Sign Type */}
            <ConfigStep number={stepNum++} title={t("sign.type.label")} subtitle={t("sign.type.subtitle")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {SIGN_TYPES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTypeId(st.id)}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                      typeId === st.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                    }`}
                  >
                    {typeId === st.id && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </span>
                    )}
                    <span className="text-sm font-bold">{t(`sign.type.${st.id}`)}</span>
                    {st.includesHardware && (
                      <span className={`text-[10px] font-bold ${typeId === st.id ? "text-emerald-300" : "text-emerald-600"}`}>
                        Includes hardware
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Step 2: Material */}
            <ConfigStep number={stepNum++} title={t("sign.material")} subtitle={t("sign.materialSubtitle")}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {signType.materials.map((mat) => {
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
                        <span className="inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {surcharge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ConfigStep>

            {/* Step 3: Size */}
            <ConfigStep number={stepNum++} title={t("sign.size")} subtitle={t("sign.sizeSubtitle")}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {signType.sizes.map((s, i) => (
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
                  <span className="text-xs font-bold">{t("sign.customSize")}</span>
                </button>
              </div>
              {isCustomSize && (
                <CustomDimensions
                  customW={customW} customH={customH}
                  onChangeW={setCustomW} onChangeH={setCustomH}
                  unit={unit} onChangeUnit={setUnit}
                  minLabel={`${signType.minIn}" × ${signType.minIn}"`}
                  maxLabel={`${signType.maxW}" × ${signType.maxH}"`}
                  dimErrors={dimErrors} t={t}
                />
              )}
            </ConfigStep>

            {/* Step: Double-sided toggle (if applicable) */}
            {signType.doubleSided !== undefined && (
              <ConfigStep number={stepNum++} title={t("sign.sides")} subtitle={t("sign.sidesSubtitle")}>
                <div className="flex gap-3">
                  {[false, true].map((ds) => (
                    <button
                      key={ds ? "double" : "single"}
                      type="button"
                      onClick={() => setDoubleSided(ds)}
                      className={`flex-1 rounded-xl border-2 px-4 py-3 text-center font-bold transition-all ${
                        doubleSided === ds
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {ds ? "Double-Sided (+50%)" : "Single-Sided"}
                    </button>
                  ))}
                </div>
              </ConfigStep>
            )}

            {/* Step: Accessories (multi-select) */}
            {signType.accessories.length > 0 && (
              <ConfigStep number={stepNum++} title={t("sign.accessories")} subtitle={t("sign.accessoriesSubtitle")}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {signType.accessories.map((aId) => {
                    const opt = ACCESSORY_OPTIONS[aId];
                    const isActive = accessories.includes(aId);
                    return (
                      <button
                        key={aId}
                        type="button"
                        onClick={() => toggleAccessory(aId)}
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
                        <span className="text-sm font-bold text-gray-800">{opt?.label || aId}</span>
                        {opt?.surcharge > 0 && (
                          <span className="text-[11px] text-amber-600">+${(opt.surcharge / 100).toFixed(2)}/ea</span>
                        )}
                        {opt?.surcharge === 0 && (
                          <span className="text-[11px] text-emerald-600">Included</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ConfigStep>
            )}

            {/* Quantity */}
            <ConfigStep number={stepNum++} title={t("sign.quantity")} subtitle={t("sign.quantitySubtitle")}>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {signType.quantities.map((q) => {
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
                <label className="text-xs font-medium text-gray-500">{t("sign.customQty")}:</label>
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

            {/* Upload */}
            <ConfigStep number={stepNum++} title={t("sign.artwork")} subtitle={t("sign.artworkSubtitle")} optional>
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
            extraRows={extraRows}
            badges={[t("sign.badgeWeatherproof"), t("sign.badgeShipping")]}
            t={t}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.totalCents}
        summaryText={quote.quoteData ? `${formatCad(quote.unitCents)}/ea × ${activeQty}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
      />
    </main>
  );
}
