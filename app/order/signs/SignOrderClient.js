"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  ACCESSORY_OPTIONS,
  getSignType,
} from "@/lib/sign-order-config";
import {
  ConfigStep,
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

/* Small inline icons for accessory options */
const ACCESSORY_ICONS = {
  "h-stake": (
    <svg className="h-8 w-8 text-gray-500" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* H-stake: two vertical prongs connected by horizontal bar */}
      <line x1="14" y1="6" x2="14" y2="36" strokeLinecap="round"/>
      <line x1="26" y1="6" x2="26" y2="36" strokeLinecap="round"/>
      <line x1="14" y1="16" x2="26" y2="16" strokeLinecap="round"/>
      {/* sign panel */}
      <rect x="10" y="4" width="20" height="12" rx="1" strokeDasharray="2 2" className="text-gray-400" stroke="currentColor" fill="none"/>
    </svg>
  ),
  "wire-stake": (
    <svg className="h-8 w-8 text-gray-500" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Wire stake: single thin rod bent at bottom */}
      <line x1="20" y1="8" x2="20" y2="30" strokeLinecap="round"/>
      <path d="M20 30 L16 38" strokeLinecap="round"/>
      <path d="M20 30 L24 38" strokeLinecap="round"/>
      {/* sign panel */}
      <rect x="10" y="4" width="20" height="10" rx="1" strokeDasharray="2 2" className="text-gray-400" stroke="currentColor" fill="none"/>
    </svg>
  ),
  "easel-back": (
    <svg className="h-8 w-8 text-gray-500" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Easel: board with stand behind */}
      <rect x="10" y="6" width="20" height="24" rx="1" fill="none"/>
      <line x1="20" y1="30" x2="28" y2="38" strokeLinecap="round"/>
    </svg>
  ),
  "standoffs": (
    <svg className="h-8 w-8 text-gray-500" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Wall-mounted with standoffs */}
      <rect x="8" y="8" width="24" height="18" rx="1" fill="none"/>
      <circle cx="12" cy="12" r="2.5"/>
      <circle cx="28" cy="12" r="2.5"/>
      <circle cx="12" cy="22" r="2.5"/>
      <circle cx="28" cy="22" r="2.5"/>
    </svg>
  ),
  "a-frame-stand": (
    <svg className="h-8 w-8 text-gray-500" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* A-frame shape */}
      <path d="M10 36 L20 6 L30 36" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="14" y1="24" x2="26" y2="24" strokeLinecap="round"/>
    </svg>
  ),
  "real-estate-frame": (
    <svg className="h-8 w-8 text-gray-500" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Post with sign on top */}
      <rect x="12" y="4" width="16" height="14" rx="1" fill="none"/>
      <line x1="20" y1="18" x2="20" y2="38" strokeLinecap="round"/>
    </svg>
  ),
};

export default function SignOrderClient({ defaultType, productImages }) {
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

  // Oversized warning (>48" on any side)
  const isOversized = widthIn > 48 || heightIn > 48;

  // Accessory surcharges
  const accessorySurcharge = useMemo(() => {
    return accessories.reduce((sum, aId) => {
      return sum + (ACCESSORY_OPTIONS[aId]?.surcharge ?? 0) * activeQty;
    }, 0);
  }, [accessories, activeQty]);

  // Double-sided surcharge (50% more)
  const doubleSidedMultiplier = doubleSided ? 1.5 : 1.0;

  // Quote
  const quote = useConfiguratorPrice({
    slug: signType.defaultSlug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    options: { doubleSided },
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
    extraRows.push({ label: t("sign.doubleSided"), value: t("sign.doubleSidedIncluded") });
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
        title={t(`sign.type.${typeId}`)}
        subtitle={t("sign.subtitle")}
        badges={[t("sign.badgeWeatherproof"), t("sign.badgeShipping"), t("sign.badgeProof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-2">

            {/* Step 1: Material */}
            <ConfigStep number={stepNum++} title={t("sign.material")} subtitle={t("sign.materialSubtitle")}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {signType.materials.map((mat) => {
                  const isActive = materialId === mat.id;
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

              {/* Oversized warning */}
              {isOversized && dimErrors.length === 0 && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Oversized Sign</p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      Signs larger than 48" may require special handling, additional shipping charges, and longer production times.
                      Contact us for bulk oversized orders.
                    </p>
                  </div>
                </div>
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
                          ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {ds ? t("sign.doubleSided") : t("sign.singleSided")}
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
                    const icon = ACCESSORY_ICONS[aId];
                    return (
                      <button
                        key={aId}
                        type="button"
                        onClick={() => toggleAccessory(aId)}
                        className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3.5 text-center transition-all duration-150 ${
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
                        {icon && <div className="mb-0.5">{icon}</div>}
                        <span className="text-sm font-bold text-gray-800">{opt?.label || aId}</span>
                        {opt?.surcharge > 0 && (
                          <span className="text-[11px] text-gray-500">${(opt.surcharge / 100).toFixed(2)}/{t("sign.perUnit")}</span>
                        )}
                        {opt?.surcharge === 0 && (
                          <span className="text-[11px] text-emerald-600">{t("sign.included")}</span>
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
                <label className="text-xs font-medium text-gray-500">{t("sign.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customQty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (v > 1000) { setCustomQty("1000"); return; }
                    setCustomQty(e.target.value);
                  }}
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
            totalCents={quote.subtotalCents}
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
        totalCents={quote.subtotalCents}
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
