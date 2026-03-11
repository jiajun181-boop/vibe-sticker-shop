"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { WRAP_UI_TYPES, WRAP_SLUG_MAP, getVehicleType } from "@/lib/vehicle-order-config";
import {
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  StepCard,
  OptionCard,
  OptionGrid,
  useStepScroll,
} from "@/components/configurator";
import QuantityScroller from "@/components/configurator/QuantityScroller";
import VehiclePreview from "@/components/vehicle/VehiclePreview";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";

// ─── Vehicle Wraps Configuration ───

const TYPES = WRAP_UI_TYPES;

const VEHICLES = [
  { id: "car", label: "Car / Sedan", icon: "sedan" },
  { id: "suv", label: "SUV / Crossover", icon: "suv" },
  { id: "van", label: "Van / Cargo Van", icon: "van" },
  { id: "pickup", label: "Pickup Truck", icon: "truck" },
  { id: "box-truck", label: "Box Truck", icon: "truck" },
  { id: "trailer", label: "53ft Trailer", icon: "truck" },
];

const MATERIALS = [
  { id: "cast-vinyl", label: "3M Cast Vinyl" },
  { id: "calendered", label: "Calendered Vinyl" },
];

const LAMINATIONS = [
  { id: "gloss", label: "Gloss" },
  { id: "matte", label: "Matte" },
  { id: "satin", label: "Satin" },
];

const QUANTITIES = [1, 2, 5];

// ─── Main Component ───

export default function VehicleWrapOrderClient({ productImages = [] }) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [typeId, setTypeId] = useState("full-wrap");
  const [vehicleId, setVehicleId] = useState("car");
  const [materialId, setMaterialId] = useState("cast-vinyl");
  const [laminationId, setLaminationId] = useState("gloss");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artworkIntent, setArtworkIntent] = useState(null);

  const typeConfig = getVehicleType(typeId);
  const isQuoteOnly = typeConfig?.quoteOnly ?? true;
  const fromPrice = typeConfig?.fromPrice || 0;

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // ─── Request Quote handler ───
  const handleRequestQuote = useCallback(() => {
    const typeName = t(`vw.type.${typeId}`);
    const vehicleLabel = VEHICLES.find((v) => v.id === vehicleId)?.label || vehicleId;
    const materialLabel = MATERIALS.find((m) => m.id === materialId)?.label || materialId;
    const laminationLabel = LAMINATIONS.find((l) => l.id === laminationId)?.label || laminationId;
    const descParts = [
      `Inquiry for ${typeName}`,
      `Vehicle: ${vehicleLabel}`,
      `Material: ${materialLabel}`,
      `Lamination: ${laminationLabel}`,
      `Quantity: ${activeQty}`,
      uploadedFile ? `Artwork: ${uploadedFile.name}` : null,
    ].filter(Boolean).join("\n");

    const params = new URLSearchParams({
      sku: WRAP_SLUG_MAP[typeId] || "vehicle-wraps",
      name: typeName,
      context: descParts,
    });
    router.push(`/quote?${params.toString()}`);
  }, [typeId, vehicleId, materialId, laminationId, activeQty, uploadedFile, t, router]);

  // ─── Accordion state ───
  const [activeStepId, setActiveStepId] = useState("step-type");

  const stepIds = ["step-type", "step-vehicle", "step-material", "step-lamination", "step-quantity", "step-artwork"];
  const advanceStep = useStepScroll(stepIds, setActiveStepId);

  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // ─── Summary texts ───
  const typeSummary = t(`vw.type.${typeId}`);
  const vehicleSummary = VEHICLES.find((v) => v.id === vehicleId)?.label || vehicleId;
  const materialSummary = MATERIALS.find((m) => m.id === materialId)?.label || materialId;
  const laminationSummary = LAMINATIONS.find((l) => l.id === laminationId)?.label || laminationId;
  const quantitySummary = `${activeQty.toLocaleString()} pcs`;
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

  // ─── Summary lines for PricingSidebar ───
  const summaryLines = [
    { label: t("vw.type.label"), value: t(`vw.type.${typeId}`) },
    { label: t("vw.vehicle.label"), value: t(`vw.vehicle.${vehicleId}`) },
    { label: t("vw.material.label"), value: t(`vw.material.${materialId}`) },
    { label: t("vw.lamination.label"), value: t(`vw.lamination.${laminationId}`) },
    { label: t("vw.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "\u2014" },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("vw.breadcrumb"), href: "/shop/vehicle-graphics-fleet" },
          { label: t("vw.order") },
        ]}
        title={t("vw.title")}
        subtitle={t("vw.subtitle") || "Professional vehicle wraps for any vehicle"}
        badges={[t("vw.badge.professional"), t("vw.badge.shipping")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="space-y-3 lg:col-span-2">

            {/* Step 1: Type */}
            <StepCard
              stepNumber={1}
              title={t("vw.type.label")}
              hint={t("vw.typeHint") || "Choose wrap coverage"}
              summaryText={typeSummary}
              open={isStepOpen("type")}
              onToggle={() => toggleStep("type")}
              stepId="step-type"
            >
              <OptionGrid columns={3} label={t("vw.type.label")}>
                {TYPES.map((tp) => (
                  <OptionCard
                    key={tp.id}
                    label={t(`vw.type.${tp.id}`)}
                    description={t(`vw.typeDesc.${tp.id}`)}
                    selected={typeId === tp.id}
                    onSelect={() => { setTypeId(tp.id); advanceStep("step-type"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step 2: Vehicle */}
            <StepCard
              stepNumber={2}
              title={t("vw.vehicle.label")}
              hint={t("vw.vehicleHint") || "What are we wrapping?"}
              summaryText={vehicleSummary}
              open={isStepOpen("vehicle")}
              onToggle={() => toggleStep("vehicle")}
              stepId="step-vehicle"
            >
              <OptionGrid columns={3} label={t("vw.vehicle.label")}>
                {VEHICLES.map((v) => (
                  <OptionCard
                    key={v.id}
                    label={v.label}
                    selected={vehicleId === v.id}
                    onSelect={() => { setVehicleId(v.id); advanceStep("step-vehicle"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step 3: Material */}
            <StepCard
              stepNumber={3}
              title={t("vw.material.label")}
              hint={t("vw.materialHint") || "Select vinyl material"}
              summaryText={materialSummary}
              open={isStepOpen("material")}
              onToggle={() => toggleStep("material")}
              stepId="step-material"
            >
              <OptionGrid columns={2} label={t("vw.material.label")}>
                {MATERIALS.map((m) => (
                  <OptionCard
                    key={m.id}
                    label={m.label}
                    description={t(`vw.materialDesc.${m.id}`)}
                    selected={materialId === m.id}
                    onSelect={() => { setMaterialId(m.id); advanceStep("step-material"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step 4: Lamination */}
            <StepCard
              stepNumber={4}
              title={t("vw.lamination.label")}
              hint={t("vw.laminationHint") || "Protective finish"}
              summaryText={laminationSummary}
              open={isStepOpen("lamination")}
              onToggle={() => toggleStep("lamination")}
              stepId="step-lamination"
            >
              <OptionGrid columns={3} label={t("vw.lamination.label")}>
                {LAMINATIONS.map((l) => (
                  <OptionCard
                    key={l.id}
                    label={l.label}
                    selected={laminationId === l.id}
                    onSelect={() => { setLaminationId(l.id); advanceStep("step-lamination"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Step 5: Quantity */}
            <StepCard
              stepNumber={5}
              title={t("vw.quantity")}
              hint={t("vw.quantityHint") || "How many vehicles?"}
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
                placeholder="e.g. 3"
              />
            </StepCard>

            {/* Step 6: Artwork Upload */}
            <StepCard
              stepNumber={6}
              title={t("vw.artwork")}
              hint={t("vw.artworkHint") || "Upload design files"}
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
                vehicleBody={vehicleId}
                graphicType={typeId}
              />
            }
            summaryLines={summaryLines}
            quoteLoading={false}
            quoteError={null}
            unitCents={0}
            subtotalCents={0}
            taxCents={0}
            totalCents={0}
            quantity={activeQty}
            canAddToCart={false}
            onAddToCart={null}
            onBuyNow={null}
            buyNowLoading={false}
            badges={[t("vw.badge.professional"), t("vw.badge.shipping")]}
            t={t}
            quoteOnly={isQuoteOnly}
            fromPrice={fromPrice}
            onRequestQuote={handleRequestQuote}
            productName={t("vw.title")}
            categorySlug="vehicle-graphics-fleet"
            locale={locale}
            productSlug={WRAP_SLUG_MAP[typeId] || "vehicle-wraps"}
            disabledReason={null}
            artworkMode="upload-optional"
            hasArtwork={!!uploadedFile}
            artworkIntent={artworkIntent}
            onArtworkIntentChange={setArtworkIntent}
          />
        </div>
      </div>

      {(() => {
        const faqItems = getConfiguratorFaqs("vehicle-wraps");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

      <MobileBottomBar
        quoteLoading={false}
        hasQuote={true}
        totalCents={0}
        quantity={activeQty}
        summaryText="Custom pricing — request a quote"
        canAddToCart={false}
        onAddToCart={null}
        onBuyNow={null}
        buyNowLoading={false}
        t={t}
        quoteOnly={isQuoteOnly}
        fromPrice={fromPrice}
        onRequestQuote={handleRequestQuote}
        productName={t("vw.title")}
        summaryLines={summaryLines}
        unitCents={0}
        subtotalCents={0}
        categorySlug="vehicle-graphics-fleet"
        locale={locale}
        disabledReason={null}
        artworkMode="upload-optional"
        hasArtwork={!!uploadedFile}
        artworkIntent={artworkIntent}
        onArtworkIntentChange={setArtworkIntent}
      />
    </main>
  );
}
