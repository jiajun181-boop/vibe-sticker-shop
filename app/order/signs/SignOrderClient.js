"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  ACCESSORY_OPTIONS,
  getSignType,
} from "@/lib/sign-order-config";
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
  const { t, locale } = useTranslation();

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

  // Add surcharges (double-sided is already priced by the API template)
  useEffect(() => {
    quote.addSurcharge(accessorySurcharge);
  }, [accessorySurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // --- Accordion state ---
  const [activeStepId, setActiveStepId] = useState(null);
  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "material", vis: true },
      { id: "size", vis: true },
      { id: "sides", vis: signType.doubleSided !== undefined },
      { id: "accessories", vis: signType.accessories.length > 0 },
      { id: "quantity", vis: true },
      { id: "artwork", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [signType.doubleSided, signType.accessories.length]);
  const stepNumFn = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);
  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  const materialSummary = signType.materials.find((m) => m.id === materialId)?.label || materialId;
  const sizeTextSummary = isCustomSize
    ? widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "—"
    : signType.sizes[sizeIdx]?.label || "—";
  const sidesSummary = doubleSided ? "Double-sided" : "Single-sided";
  const accessoriesSummary = accessories.length > 0 ? accessories.map((a) => ACCESSORY_OPTIONS[a]?.label || a).join(", ") : "None";
  const quantitySummary = `${activeQty.toLocaleString()} pcs`;
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

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
          <div className="space-y-3 lg:col-span-2">

            {/* Step: Material */}
            <StepCard
              stepNumber={stepNumFn("material")}
              title={t("sign.material")}
              hint={t("sign.materialSubtitle")}
              summaryText={materialSummary}
              open={isStepOpen("material")}
              onToggle={() => toggleStep("material")}
              stepId="step-material"
            >
              <OptionGrid columns={3}>
                {signType.materials.map((mat) => (
                  <OptionCard
                    key={mat.id}
                    label={mat.label}
                    selected={materialId === mat.id}
                    onSelect={() => { setMaterialId(mat.id); advanceStep("step-material"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Size */}
            <StepCard
              stepNumber={stepNumFn("size")}
              title={t("sign.size")}
              hint={t("sign.sizeSubtitle")}
              summaryText={sizeTextSummary}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
            >
              <OptionGrid columns={4}>
                {signType.sizes.map((s, i) => (
                  <OptionCard
                    key={i}
                    label={s.label}
                    selected={sizeIdx === i}
                    onSelect={() => { setSizeIdx(i); setCustomW(""); setCustomH(""); advanceStep("step-size"); }}
                  />
                ))}
                <OptionCard
                  label={t("sign.customSize")}
                  selected={isCustomSize}
                  onSelect={() => setSizeIdx(-1)}
                  className="border-dashed"
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
                      Signs larger than 48&quot; may require special handling, additional shipping charges, and longer production times.
                      Contact us for bulk oversized orders.
                    </p>
                  </div>
                </div>
              )}
            </StepCard>

            {/* Step: Double-sided toggle (if applicable) */}
            <StepCard
              stepNumber={stepNumFn("sides")}
              title={t("sign.sides")}
              hint={t("sign.sidesSubtitle")}
              summaryText={sidesSummary}
              visible={signType.doubleSided !== undefined}
              open={isStepOpen("sides")}
              onToggle={() => toggleStep("sides")}
              stepId="step-sides"
            >
              <OptionGrid columns={2}>
                {[false, true].map((ds) => (
                  <OptionCard
                    key={ds ? "double" : "single"}
                    label={ds ? t("sign.doubleSided") : t("sign.singleSided")}
                    selected={doubleSided === ds}
                    onSelect={() => { setDoubleSided(ds); advanceStep("step-sides"); }}
                    fullWidth
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Accessories (multi-select) */}
            <StepCard
              stepNumber={stepNumFn("accessories")}
              title={t("sign.accessories")}
              hint={t("sign.accessoriesSubtitle")}
              summaryText={accessoriesSummary}
              visible={signType.accessories.length > 0}
              open={isStepOpen("accessories")}
              onToggle={() => toggleStep("accessories")}
              stepId="step-accessories"
            >
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
                          ? "border-teal-500 bg-teal-50 shadow-md ring-1 ring-teal-500/10"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
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
            </StepCard>

            {/* Quantity */}
            <StepCard
              stepNumber={stepNumFn("quantity")}
              title={t("sign.quantity")}
              hint={t("sign.quantitySubtitle")}
              summaryText={quantitySummary}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
            >
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                {signType.quantities.map((q) => {
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
                <label className="text-xs font-medium text-gray-500">{t("sign.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customQty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (v > 1000) { setCustomQty("1000"); return; }
                    setCustomQty(e.target.value);
                  }}
                  placeholder="e.g. 15"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
            </StepCard>

            {/* Upload */}
            <StepCard
              stepNumber={stepNumFn("artwork")}
              title={t("sign.artwork")}
              hint={t("sign.artworkSubtitle")}
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
            quantity={activeQty}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            extraRows={extraRows}
            badges={[t("sign.badgeWeatherproof"), t("sign.badgeShipping")]}
            t={t}
            productName={t(`sign.type.${typeId}`)}
            categorySlug="signs-rigid-boards"
            locale={locale}
            productSlug={signType.defaultSlug}
            onRetryPrice={quote.retry}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        quantity={activeQty}
        summaryText={quote.quoteData ? `${formatCad(quote.unitCents)}/ea × ${activeQty}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        productName={t(`sign.type.${typeId}`)}
        summaryLines={summaryLines}
        unitCents={quote.unitCents}
        subtotalCents={quote.subtotalCents}
        categorySlug="signs-rigid-boards"
        locale={locale}
        onRetryPrice={quote.retry}
      />
    </main>
  );
}
