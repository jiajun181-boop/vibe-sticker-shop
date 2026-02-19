"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validateDimensions } from "@/lib/materialLimits";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ShapeIcon } from "@/components/stickers/ShapeIcon";
import {
  CUTTING_TYPES,
  getCuttingType,
  resolveProductSlug,
} from "@/lib/sticker-order-config";
import {
  trackOptionChange,
  trackUploadStarted,
} from "@/lib/analytics";
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

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function StickerOrderClient({ defaultType, lockedType = false, productImages }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // When lockedType is true, only show the single cutting type matching defaultType
  const visibleCuttingTypes = useMemo(() => {
    if (lockedType && defaultType) {
      const match = CUTTING_TYPES.filter((ct) => ct.id === defaultType);
      return match.length > 0 ? match : CUTTING_TYPES;
    }
    return CUTTING_TYPES;
  }, [lockedType, defaultType]);

  // --- State ---
  const [cuttingId, setCuttingId] = useState(defaultType || searchParams.get("type") || "die-cut");
  const cutting = useMemo(() => getCuttingType(cuttingId), [cuttingId]);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(cutting.materials[0].id);
  const [quantity, setQuantity] = useState(cutting.quantities[2] ?? 100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dimErrors, setDimErrors] = useState([]);

  // Derived dimensions
  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return cutting.sizes[sizeIdx]?.w ?? 2;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, cutting, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return cutting.sizes[sizeIdx]?.h ?? 2;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, cutting, customH, unit]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  const slug = useMemo(
    () => resolveProductSlug(cuttingId, materialId),
    [cuttingId, materialId]
  );

  // --- Reset when cutting type changes ---
  useEffect(() => {
    setSizeIdx(0);
    setCustomW("");
    setCustomH("");
    setMaterialId(cutting.materials[0].id);
    setQuantity(cutting.quantities[2] ?? cutting.quantities[0]);
    setCustomQty("");
    setDimErrors([]);
  }, [cuttingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Validate dimensions ---
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
    const result = validateDimensions(widthIn, heightIn, "sticker", {
      minWidthIn: cutting.minIn,
      minHeightIn: cutting.minIn,
      maxWidthIn: cutting.maxW,
      maxHeightIn: cutting.maxH,
    });
    setDimErrors(result.errors);
  }, [widthIn, heightIn, cutting]);

  // --- Quote ---
  const quote = useConfiguratorQuote({
    slug,
    quantity: activeQty,
    widthIn,
    heightIn,
    material: materialId,
    enabled: widthIn > 0 && heightIn > 0 && activeQty > 0 && dimErrors.length === 0,
  });

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // --- Tier pricing rows ---
  const tierRows = useMemo(() => {
    return cutting.quantities.map((q) => {
      const discount =
        q >= 1000 ? 0.82 : q >= 500 ? 0.88 : q >= 250 ? 0.93 : q >= 100 ? 0.97 : 1.0;
      return { qty: q, discount };
    });
  }, [cutting]);

  // --- Cart ---
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(2)}" × ${heightIn.toFixed(2)}"`
      : cutting.sizes[sizeIdx]?.label;
    return {
      id: slug,
      name: `${t(`stickerOrder.type.${cuttingId}`)} — ${sizeLabel}`,
      slug,
      price: quote.unitCents,
      quantity: activeQty,
      options: {
        cuttingType: cuttingId,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        material: materialId,
        materialName: t(`stickerOrder.mat.${materialId}`),
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.unitCents, activeQty, cuttingId, widthIn, heightIn, isCustomSize, sizeIdx, cutting, slug, materialId, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("stickerOrder.addedToCart"),
  });

  // --- Handlers ---
  function selectCutting(id) {
    setCuttingId(id);
    trackOptionChange({ slug, option: "cuttingType", value: id, quantity: activeQty });
  }
  function selectSize(idx) {
    setSizeIdx(idx);
    setCustomW("");
    setCustomH("");
    trackOptionChange({ slug, option: "size", value: idx === -1 ? "custom" : cutting.sizes[idx]?.label, quantity: activeQty });
  }
  function selectMaterial(id) {
    setMaterialId(id);
    trackOptionChange({ slug, option: "material", value: id, quantity: activeQty });
  }
  function selectQuantity(q) {
    setQuantity(q);
    setCustomQty("");
    trackOptionChange({ slug, option: "quantity", value: q, quantity: q });
  }

  // Summary line items
  const summaryLines = [
    { label: t("stickerOrder.type.label"), value: t(`stickerOrder.type.${cuttingId}`) },
    {
      label: t("stickerOrder.size"),
      value: isCustomSize
        ? widthIn > 0 && heightIn > 0
          ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
          : "—"
        : cutting.sizes[sizeIdx]?.label || "—",
    },
    { label: t("stickerOrder.material"), value: t(`stickerOrder.mat.${materialId}`) },
    { label: t("stickerOrder.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
  ];

  // Material descriptions for more info
  const MATERIAL_HINTS = {
    "white-vinyl": "Durable, waterproof, outdoor-safe",
    matte: "Non-glare, premium feel",
    clear: "Transparent, shows background through",
    holographic: "Rainbow sparkle, eye-catching",
    "glossy-paper": "Bright colors, indoor use",
    "white-bopp": "Tear-proof, water-resistant",
    "clear-bopp": "See-through, water-resistant",
    "kraft-paper": "Natural, eco-friendly look",
    silver: "Metallic shine, premium",
    outdoor: "UV & weather resistant",
    indoor: "Smooth finish, repositionable",
    reflective: "High visibility, safety-grade",
    perforated: "One-way vision, see-through",
    "floor-nonslip": "Anti-slip laminate, safety-rated",
  };

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Hero header */}
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("stickerOrder.stickers"), href: "/shop/stickers-labels-decals" },
          { label: t("stickerOrder.order") },
        ]}
        title={t("stickerOrder.title")}
        subtitle="Choose your type, size, material and quantity — get instant pricing and order online."
        badges={[t("stickerOrder.badgeWaterproof"), t("stickerOrder.badgeShipping"), t("stickerOrder.badgeProof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN — Configurator Steps (2/3) */}
          <div className="space-y-6 lg:col-span-2">

            {/* STEP 1: Product Type */}
            {visibleCuttingTypes.length > 1 ? (
              <ConfigStep number={1} title={t("stickerOrder.cuttingType")} subtitle="What kind of sticker do you need?">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visibleCuttingTypes.map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => selectCutting(ct.id)}
                      className={`group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                        cuttingId === ct.id
                          ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                      }`}
                    >
                      {cuttingId === ct.id && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                      <div className={`transition-transform duration-200 ${cuttingId === ct.id ? "scale-110" : "group-hover:scale-105"}`}>
                        <ShapeIcon type={ct.id} className="h-12 w-12" />
                      </div>
                      <span className="text-sm font-bold">{t(`stickerOrder.type.${ct.id}`)}</span>
                      <span className={`text-[11px] leading-snug ${cuttingId === ct.id ? "text-gray-300" : "text-gray-400"}`}>
                        {t(`stickerOrder.typeDesc.${ct.id}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </ConfigStep>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                <div className="shrink-0"><ShapeIcon type={cuttingId} className="h-12 w-12" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t(`stickerOrder.type.${cuttingId}`)}</p>
                  <p className="text-xs text-gray-500">{t(`stickerOrder.typeDesc.${cuttingId}`)}</p>
                </div>
              </div>
            )}

            {/* STEP 2: Size */}
            <ConfigStep number={2} title={t("stickerOrder.size")} subtitle="Select a recommended size or enter custom dimensions">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {cutting.sizes.map((s, i) => {
                  const isActive = sizeIdx === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSize(i)}
                      className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm"
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isActive ? "bg-white/10" : "bg-gray-50"}`}>
                        <div
                          className={`rounded-sm border ${isActive ? "border-white/40 bg-white/20" : "border-gray-300 bg-gray-100"}`}
                          style={{
                            width: `${Math.min(32, Math.max(14, s.w * 4))}px`,
                            height: `${Math.min(32, Math.max(14, s.h * 4))}px`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold">{s.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => selectSize(-1)}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                    isCustomSize
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isCustomSize ? "bg-white/10" : "bg-gray-50"}`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold">{t("stickerOrder.custom")}</span>
                </button>
              </div>

              {isCustomSize && (
                <CustomDimensions
                  customW={customW}
                  customH={customH}
                  onChangeW={setCustomW}
                  onChangeH={setCustomH}
                  unit={unit}
                  onChangeUnit={setUnit}
                  minLabel={`${cutting.minIn}" × ${cutting.minIn}"`}
                  maxLabel={`${cutting.maxW}" × ${cutting.maxH}"`}
                  dimErrors={dimErrors}
                  t={t}
                />
              )}

              {/* Dimension errors (when not custom — custom shows them inside CustomDimensions) */}
              {!isCustomSize && dimErrors.length > 0 && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  {dimErrors.map((e, i) => (
                    <p key={i} className="text-xs font-medium text-red-600">{e}</p>
                  ))}
                </div>
              )}
            </ConfigStep>

            {/* STEP 3: Material */}
            <ConfigStep number={3} title={t("stickerOrder.material")} subtitle="Choose the right finish for your stickers">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {cutting.materials.map((mat) => {
                  const isActive = materialId === mat.id;
                  const surcharge = mat.multiplier > 1 ? `+${Math.round((mat.multiplier - 1) * 100)}%` : null;
                  const hint = MATERIAL_HINTS[mat.id] || "";
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => selectMaterial(mat.id)}
                      className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                          : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-800">
                        {t(`stickerOrder.mat.${mat.id}`)}
                      </span>
                      <span className="text-[11px] leading-snug text-gray-400">{hint}</span>
                      {surcharge && (
                        <span className="mt-0.5 inline-flex w-fit rounded-xl bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {surcharge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ConfigStep>

            {/* STEP 4: Quantity */}
            <ConfigStep number={4} title={t("stickerOrder.quantity")} subtitle="More you order, more you save">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {cutting.quantities.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  const discount =
                    q >= 1000 ? 18 : q >= 500 ? 12 : q >= 250 ? 7 : q >= 100 ? 3 : 0;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => selectQuantity(q)}
                      className={`relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">{q >= 1000 ? `${q / 1000}K` : q}</span>
                      {discount > 0 && (
                        <span className={`text-[10px] font-bold ${isActive ? "text-emerald-300" : "text-emerald-600"}`}>
                          Save {discount}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("stickerOrder.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={customQty}
                  onChange={(e) => {
                    setCustomQty(e.target.value);
                    trackOptionChange({ slug, option: "quantity", value: e.target.value, quantity: parseInt(e.target.value, 10) || 0 });
                  }}
                  placeholder="e.g. 750"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* STEP 5: Upload Artwork */}
            <ConfigStep number={5} title={t("stickerOrder.artwork")} subtitle="Upload now or send later — it's optional" optional>
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                onBegin={() => trackUploadStarted({ slug })}
                t={t}
              />
            </ConfigStep>
          </div>

          {/* RIGHT COLUMN — Sticky Price Summary (1/3) */}
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
            previewSlot={<ShapeIcon type={cuttingId} className="h-24 w-24" />}
            volumeRows={tierRows}
            activeQty={activeQty}
            badges={[t("stickerOrder.badgeWaterproof"), t("stickerOrder.badgeShipping")]}
            t={t}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.totalCents}
        summaryText={quote.quoteData ? `${formatCad(quote.unitCents)}/ea × ${activeQty.toLocaleString()}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
      />
    </main>
  );
}
