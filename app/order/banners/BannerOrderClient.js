"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  BANNER_TYPES,
  FINISHING_OPTIONS,
  getBannerType,
} from "@/lib/banner-order-config";
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

export default function BannerOrderClient({ defaultType, productImages }) {
  const { t } = useTranslation();

  // --- State ---
  const [typeId, setTypeId] = useState(defaultType || "vinyl-banner");
  const bannerType = useMemo(() => getBannerType(typeId), [typeId]);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(bannerType.materials[0].id);
  const [finishings, setFinishings] = useState(bannerType.defaultFinishings);
  const [quantity, setQuantity] = useState(bannerType.quantities[0] ?? 1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);

  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return bannerType.sizes[sizeIdx]?.w ?? 24;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, bannerType, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return bannerType.sizes[sizeIdx]?.h ?? 48;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, bannerType, customH, unit]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Reset when type changes
  useEffect(() => {
    setSizeIdx(0);
    setCustomW("");
    setCustomH("");
    setMaterialId(bannerType.materials[0].id);
    setFinishings(bannerType.defaultFinishings);
    setQuantity(bannerType.quantities[0] ?? 1);
    setCustomQty("");
    setDimErrors([]);
  }, [typeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate dimensions
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
    const errs = [];
    if (widthIn < bannerType.minIn) errs.push(`Width must be at least ${bannerType.minIn}"`);
    if (heightIn < bannerType.minIn) errs.push(`Height must be at least ${bannerType.minIn}"`);
    if (widthIn > bannerType.maxW) errs.push(`Width cannot exceed ${bannerType.maxW}"`);
    if (heightIn > bannerType.maxH) errs.push(`Height cannot exceed ${bannerType.maxH}"`);
    setDimErrors(errs);
  }, [widthIn, heightIn, bannerType]);

  // Finishing surcharges
  const finishingSurcharge = useMemo(() => {
    return finishings.reduce((sum, fId) => {
      const opt = FINISHING_OPTIONS[fId];
      return sum + (opt?.surcharge ?? 0) * activeQty;
    }, 0);
  }, [finishings, activeQty]);

  // Quote
  const quote = useConfiguratorQuote({
    slug: bannerType.defaultSlug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    enabled: widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  // Add finishing surcharges
  useEffect(() => {
    quote.addSurcharge(finishingSurcharge);
  }, [finishingSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // Cart
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
      : bannerType.sizes[sizeIdx]?.label;
    return {
      id: bannerType.defaultSlug,
      name: `${t(`banner.type.${typeId}`)} — ${sizeLabel}`,
      slug: bannerType.defaultSlug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        bannerType: typeId,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        material: materialId,
        finishings: finishings.join(", "),
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, typeId, widthIn, heightIn, isCustomSize, sizeIdx, bannerType, materialId, finishings, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("banner.addedToCart"),
  });

  // Toggle finishing
  function toggleFinishing(fId) {
    setFinishings((prev) =>
      prev.includes(fId) ? prev.filter((f) => f !== fId) : [...prev, fId]
    );
  }

  // Summary lines
  const summaryLines = [
    { label: t("banner.type.label"), value: t(`banner.type.${typeId}`) },
    {
      label: t("banner.size"),
      value: isCustomSize
        ? widthIn > 0 && heightIn > 0 ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : "—"
        : bannerType.sizes[sizeIdx]?.label || "—",
    },
    { label: t("banner.material"), value: bannerType.materials.find((m) => m.id === materialId)?.label || materialId },
    { label: t("banner.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
  ];
  if (finishings.length > 0) {
    summaryLines.push({
      label: t("banner.finishing"),
      value: finishings.map((f) => FINISHING_OPTIONS[f]?.label || f).join(", "),
    });
  }

  const extraRows = [];
  if (finishingSurcharge > 0) {
    extraRows.push({ label: t("banner.finishingSurcharge"), value: `+ $${(finishingSurcharge / 100).toFixed(2)}` });
  }

  const formatCad = (cents) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("banner.breadcrumb"), href: "/shop/banners-displays" },
          { label: t("banner.order") },
        ]}
        title={t("banner.title")}
        subtitle={t("banner.subtitle")}
        badges={[t("banner.badgeWeatherproof"), t("banner.badgeShipping"), t("banner.badgeProof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-2">

            {/* Step 1: Banner Type */}
            <ConfigStep number={1} title={t("banner.type.label")} subtitle={t("banner.type.subtitle")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {BANNER_TYPES.map((bt) => (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => setTypeId(bt.id)}
                    className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                      typeId === bt.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                    }`}
                  >
                    {typeId === bt.id && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </span>
                    )}
                    <span className="text-sm font-bold">{t(`banner.type.${bt.id}`)}</span>
                    {bt.includesHardware && (
                      <span className={`text-[10px] font-bold ${typeId === bt.id ? "text-emerald-300" : "text-emerald-600"}`}>
                        Includes hardware
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Step 2: Size */}
            <ConfigStep number={2} title={t("banner.size")} subtitle={t("banner.sizeSubtitle")}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {bannerType.sizes.map((s, i) => (
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
                {bannerType.hasDimensions && (
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
                    <span className="text-xs font-bold">{t("banner.customSize")}</span>
                  </button>
                )}
              </div>
              {isCustomSize && (
                <CustomDimensions
                  customW={customW}
                  customH={customH}
                  onChangeW={setCustomW}
                  onChangeH={setCustomH}
                  unit={unit}
                  onChangeUnit={setUnit}
                  minLabel={`${bannerType.minIn}" × ${bannerType.minIn}"`}
                  maxLabel={`${bannerType.maxW}" × ${bannerType.maxH}"`}
                  dimErrors={dimErrors}
                  t={t}
                />
              )}
            </ConfigStep>

            {/* Step 3: Material */}
            {bannerType.materials.length > 1 && (
              <ConfigStep number={3} title={t("banner.material")} subtitle={t("banner.materialSubtitle")}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {bannerType.materials.map((mat) => {
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
            )}

            {/* Step 4: Finishing (multi-select) */}
            {bannerType.finishings.length > 0 && (
              <ConfigStep number={bannerType.materials.length > 1 ? 4 : 3} title={t("banner.finishing")} subtitle={t("banner.finishingSubtitle")}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {bannerType.finishings.map((fId) => {
                    const opt = FINISHING_OPTIONS[fId];
                    const isActive = finishings.includes(fId);
                    return (
                      <button
                        key={fId}
                        type="button"
                        onClick={() => toggleFinishing(fId)}
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

            {/* Step: Quantity */}
            <ConfigStep
              number={
                (bannerType.materials.length > 1 ? 3 : 2) +
                (bannerType.finishings.length > 0 ? 1 : 0) + 1
              }
              title={t("banner.quantity")}
              subtitle={t("banner.quantitySubtitle")}
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {bannerType.quantities.map((q) => {
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
                <label className="text-xs font-medium text-gray-500">{t("banner.customQty")}:</label>
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

            {/* Step: Upload Artwork */}
            <ConfigStep
              number={
                (bannerType.materials.length > 1 ? 3 : 2) +
                (bannerType.finishings.length > 0 ? 1 : 0) + 2
              }
              title={t("banner.artwork")}
              subtitle={t("banner.artworkSubtitle")}
              optional
            >
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
            badges={[t("banner.badgeWeatherproof"), t("banner.badgeShipping")]}
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
