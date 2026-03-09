"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { DECAL_UI_TYPES, DECAL_SLUG_MAP } from "@/lib/vehicle-order-config";
import {
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  StepCard,
  OptionCard,
  OptionGrid,
  useConfiguratorPrice,
  useConfiguratorCart,
  useStepScroll,
} from "@/components/configurator";
import QuantityScroller from "@/components/configurator/QuantityScroller";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import DeliveryEstimate from "@/components/configurator/DeliveryEstimate";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Vehicle Decal Configuration ───

const TYPES = DECAL_UI_TYPES;

const SIZES_BY_TYPE = {
  "company-lettering": [
    { id: "12x3", label: '12" \u00d7 3"', tag: "12\u00d73", w: 12, h: 3 },
    { id: "24x6", label: '24" \u00d7 6"', tag: "24\u00d76", w: 24, h: 6 },
    { id: "36x8", label: '36" \u00d7 8"', tag: "36\u00d78", w: 36, h: 8 },
    { id: "48x12", label: '48" \u00d7 12"', tag: "48\u00d712", w: 48, h: 12 },
  ],
  "dot-mc": [
    { id: "set-small", label: '12" \u00d7 3" pair', tag: "12\u00d73 pair", w: 12, h: 3 },
    { id: "set-large", label: '18" \u00d7 4" pair', tag: "18\u00d74 pair", w: 18, h: 4 },
  ],
  "unit-numbers": [
    { id: "6x2", label: '6" \u00d7 2"', tag: "6\u00d72", w: 6, h: 2 },
    { id: "12x3", label: '12" \u00d7 3"', tag: "12\u00d73", w: 12, h: 3 },
    { id: "18x4", label: '18" \u00d7 4"', tag: "18\u00d74", w: 18, h: 4 },
  ],
};

const DEFAULT_SIZE_IDX = {
  "company-lettering": 1, // 24x6
  "dot-mc": 1,            // set-large
  "unit-numbers": 1,      // 12x3
};

const MATERIALS = [
  { id: "vinyl", label: "Outdoor Vinyl", surcharge: 0 },
  { id: "reflective", label: "Reflective Vinyl", surcharge: 300 },
];

const COLORS = [
  { id: "white", label: "White", surcharge: 0 },
  { id: "black", label: "Black", surcharge: 0 },
  { id: "gold", label: "Gold", surcharge: 200 },
  { id: "silver", label: "Silver", surcharge: 200 },
];

const QUANTITIES = [1, 2, 5, 10, 25];

// ─── Main Component ───

export default function VehicleDecalOrderClient({ productImages = [] }) {
  const { t, locale } = useTranslation();

  const [typeId, setTypeId] = useState("company-lettering");
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE_IDX["company-lettering"]);
  const [materialId, setMaterialId] = useState("vinyl");
  const [colorId, setColorId] = useState("white");
  const [quantity, setQuantity] = useState(2);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artworkIntent, setArtworkIntent] = useState(null);
  const [textInput, setTextInput] = useState(""); // for DOT/MC or company text

  const sizes = SIZES_BY_TYPE[typeId];
  const size = sizes[sizeIdx] || sizes[0];

  // Reset size index when type changes
  useEffect(() => {
    setSizeIdx(DEFAULT_SIZE_IDX[typeId] ?? 0);
    setTextInput("");
  }, [typeId]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // ─── Quote ───

  const quote = useConfiguratorPrice({
    slug: DECAL_SLUG_MAP[typeId] || "vehicle-decals",
    quantity: activeQty,
    widthIn: size.w,
    heightIn: size.h,
    enabled: activeQty > 0,
  });

  // ─── Surcharges ───

  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const colorSurcharge = (COLORS.find((c) => c.id === colorId)?.surcharge ?? 0) * activeQty;
  const totalSurcharge = materialSurcharge + colorSurcharge;

  // Update surcharges in the hook
  useEffect(() => {
    quote.addSurcharge(totalSurcharge);
  }, [totalSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0;

  const disabledReason = !canAddToCart
    ? quote.quoteLoading ? "Calculating price..."
    : !quote.quoteData ? "Select your options for pricing"
    : "Complete all options to continue"
    : null;

  // ─── Cart ───

  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;

    const materialLabel = MATERIALS.find((m) => m.id === materialId)?.label || materialId;
    const colorLabel = COLORS.find((c) => c.id === colorId)?.label || colorId;

    return {
      id: DECAL_SLUG_MAP[typeId] || "vehicle-decals",
      name: `${t("vd.title")} \u2014 ${t(`vd.type.${typeId}`)} ${size.tag}`,
      slug: DECAL_SLUG_MAP[typeId] || "vehicle-decals",
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        vehicleType: typeId,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material: materialId,
        materialLabel,
        color: colorId,
        colorLabel,
        lamination: "gloss-overlaminate",
        outdoor: true,
        text: textInput.trim() || null,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, typeId, size, materialId, colorId, textInput, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("vd.addedToCart"),
  });

  // ─── Accordion state ───
  const [activeStepId, setActiveStepId] = useState("step-type");

  const needsTextInput = typeId === "dot-mc" || typeId === "unit-numbers";
  const stepIds = useMemo(() => {
    const ids = ["step-type", "step-size", "step-material", "step-color"];
    if (needsTextInput) ids.push("step-text");
    ids.push("step-quantity", "step-artwork");
    return ids;
  }, [needsTextInput]);

  const advanceStep = useStepScroll(stepIds, setActiveStepId);

  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // ─── Summary texts ───
  const typeSummary = t(`vd.type.${typeId}`);
  const sizeSummary = size.label;
  const materialSummary = MATERIALS.find((m) => m.id === materialId)?.label || materialId;
  const colorSummary = COLORS.find((c) => c.id === colorId)?.label || colorId;
  const textSummary = textInput.trim() || "Not entered";
  const quantitySummary = `${activeQty.toLocaleString()} pcs`;
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

  // ─── Summary lines for PricingSidebar ───
  const summaryLines = [
    { label: t("vd.type.label"), value: t(`vd.type.${typeId}`) },
    { label: t("vd.size"), value: size.label },
    { label: t("vd.material.label"), value: t(`vd.material.${materialId}`) },
    { label: t("vd.color.label"), value: t(`vd.color.${colorId}`) },
    { label: t("vd.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "\u2014" },
  ];
  if (textInput.trim()) {
    summaryLines.push({ label: "Text", value: textInput.trim() });
  }

  // ─── Extra pricing rows for surcharges ───
  const extraRows = [];
  if (materialSurcharge > 0) {
    extraRows.push({ label: t(`vd.material.${materialId}`), value: `+ ${formatCad(materialSurcharge)}` });
  }
  if (colorSurcharge > 0) {
    extraRows.push({ label: t(`vd.color.${colorId}`), value: `+ ${formatCad(colorSurcharge)}` });
  }

  // ─── Step numbering ───
  let stepNum = 0;
  const nextStep = () => ++stepNum;

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("vd.breadcrumb"), href: "/shop/vehicle-graphics-fleet" },
          { label: t("vd.order") },
        ]}
        title={t("vd.title")}
        subtitle={t("vd.subtitle") || "Cut vinyl lettering & compliance decals"}
        badges={[t("vd.badge.outdoor"), t("vd.badge.shipping")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-3 lg:col-span-2">

            {/* Step: Type */}
            <StepCard
              stepNumber={nextStep()}
              title={t("vd.type.label")}
              hint={t("vd.typeHint") || "Choose decal type"}
              summaryText={typeSummary}
              open={isStepOpen("type")}
              onToggle={() => toggleStep("type")}
              stepId="step-type"
            >
              <OptionGrid columns={3} label={t("vd.type.label")}>
                {TYPES.map((tp) => (
                  <OptionCard
                    key={tp.id}
                    label={t(`vd.type.${tp.id}`)}
                    description={t(`vd.typeDesc.${tp.id}`)}
                    selected={typeId === tp.id}
                    onSelect={() => { setTypeId(tp.id); advanceStep("step-type"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Size */}
            <StepCard
              stepNumber={nextStep()}
              title={t("vd.size")}
              hint={t("vd.sizeHint") || "Select size"}
              summaryText={sizeSummary}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
            >
              <OptionGrid columns={4} label={t("vd.size")}>
                {sizes.map((s, i) => (
                  <OptionCard
                    key={s.id}
                    label={s.label}
                    selected={sizeIdx === i}
                    onSelect={() => { setSizeIdx(i); advanceStep("step-size"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Material */}
            <StepCard
              stepNumber={nextStep()}
              title={t("vd.material.label")}
              hint={t("vd.materialHint") || "Select vinyl material"}
              summaryText={materialSummary}
              open={isStepOpen("material")}
              onToggle={() => toggleStep("material")}
              stepId="step-material"
            >
              <OptionGrid columns={2} label={t("vd.material.label")}>
                {MATERIALS.map((m) => (
                  <OptionCard
                    key={m.id}
                    label={m.label}
                    description={t(`vd.materialDesc.${m.id}`)}
                    selected={materialId === m.id}
                    onSelect={() => { setMaterialId(m.id); advanceStep("step-material"); }}
                    badge={m.surcharge > 0 ? (
                      <span className="text-[10px] font-bold text-amber-600">+{formatCad(m.surcharge)}/ea</span>
                    ) : null}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Color */}
            <StepCard
              stepNumber={nextStep()}
              title={t("vd.color.label")}
              hint={t("vd.colorHint") || "Choose vinyl color"}
              summaryText={colorSummary}
              open={isStepOpen("color")}
              onToggle={() => toggleStep("color")}
              stepId="step-color"
            >
              <OptionGrid columns={4} label={t("vd.color.label")}>
                {COLORS.map((c) => (
                  <OptionCard
                    key={c.id}
                    label={c.label}
                    selected={colorId === c.id}
                    onSelect={() => { setColorId(c.id); advanceStep("step-color"); }}
                    badge={c.surcharge > 0 ? (
                      <span className="text-[10px] font-bold text-amber-600">+{formatCad(c.surcharge)}/ea</span>
                    ) : null}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step: Text Input (for DOT/MC and unit numbers) */}
            {needsTextInput && (
              <StepCard
                stepNumber={nextStep()}
                title={typeId === "dot-mc" ? "DOT / MC Numbers" : "Unit Numbers"}
                hint={typeId === "dot-mc" ? "Enter your DOT and MC numbers" : "Enter your unit numbers"}
                summaryText={textSummary}
                open={isStepOpen("text")}
                onToggle={() => toggleStep("text")}
                stepId="step-text"
              >
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    {typeId === "dot-mc" ? "Enter DOT / MC numbers" : "Enter unit numbers"}
                  </label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={typeId === "dot-mc" ? "e.g. USDOT 1234567 MC 987654" : "e.g. Unit 001, Unit 002"}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                  />
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    This text will be printed exactly as entered
                  </p>
                </div>
              </StepCard>
            )}

            {/* Step: Quantity */}
            <StepCard
              stepNumber={nextStep()}
              title={t("vd.quantity")}
              hint={t("vd.quantityHint") || "How many decals?"}
              summaryText={quantitySummary}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
            >
              <QuantityScroller
                quantities={QUANTITIES}
                selected={quantity}
                onSelect={(q) => { setQuantity(q); setCustomQty(""); advanceStep("step-quantity"); }}
                customQty={customQty}
                onCustomChange={setCustomQty}
                t={t}
                placeholder="e.g. 15"
              />
            </StepCard>

            {/* Step: Artwork Upload */}
            <StepCard
              stepNumber={nextStep()}
              title={t("vd.artwork")}
              hint={t("vd.artworkHint") || "Upload your design or logo"}
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
            badges={[t("vd.badge.outdoor"), t("vd.badge.shipping")]}
            t={t}
            productName={t("vd.title")}
            categorySlug="vehicle-graphics-fleet"
            locale={locale}
            productSlug={DECAL_SLUG_MAP[typeId] || "vehicle-decals"}
            onRetryPrice={quote.retry}
            disabledReason={disabledReason}
            artworkMode="upload-optional"
            hasArtwork={!!uploadedFile}
            artworkIntent={artworkIntent}
            onArtworkIntentChange={setArtworkIntent}
          />
        </div>
      </div>

      {(() => {
        const faqItems = getConfiguratorFaqs("vehicle-decals");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

      {/* Inline mobile delivery estimate */}
      {!!quote.quoteData && (
        <div className="mx-auto max-w-4xl px-4 pb-4 md:hidden">
          <DeliveryEstimate categorySlug="vehicle-graphics-fleet" t={t} locale={locale} />
        </div>
      )}

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        quantity={activeQty}
        summaryText={
          quote.quoteData
            ? `${formatCad(quote.unitCents)}/ea \u00d7 ${activeQty}`
            : null
        }
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        productName={t("vd.title")}
        summaryLines={summaryLines}
        unitCents={quote.unitCents}
        subtotalCents={quote.subtotalCents}
        categorySlug="vehicle-graphics-fleet"
        locale={locale}
        onRetryPrice={quote.retry}
        disabledReason={disabledReason}
        artworkMode="upload-optional"
        hasArtwork={!!uploadedFile}
        artworkIntent={artworkIntent}
        onArtworkIntentChange={setArtworkIntent}
      />
    </main>
  );
}
