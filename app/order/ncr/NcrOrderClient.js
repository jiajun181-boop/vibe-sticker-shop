"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
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
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import { FORM_TYPES, SIZES, QUANTITIES } from "@/lib/ncr-order-config";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Main Component ───

export default function NcrOrderClient({ defaultType, productImages }) {
  const { t, locale } = useTranslation();

  // Form state
  const [formTypeId, setFormTypeId] = useState(defaultType || "2-copy");
  const [sizeIdx, setSizeIdx] = useState(1); // default: letter
  const [quantity, setQuantity] = useState(500);

  // Print color
  const [printColor, setPrintColor] = useState("black"); // "black" | "color"

  // Binding
  const [binding, setBinding] = useState("loose"); // "loose" | "pad-25" | "pad-50"

  // Numbering
  const [numbering, setNumbering] = useState(false);
  const [numberStart, setNumberStart] = useState("1");
  const [numberColor, setNumberColor] = useState("black"); // "black" | "red"

  // File upload
  const [uploadedFile, setUploadedFile] = useState(null);

  const formType = useMemo(() => FORM_TYPES.find((f) => f.id === formTypeId) || FORM_TYPES[0], [formTypeId]);
  const size = SIZES[sizeIdx];
  const is4Copy = formType.parts === 4;

  // When switching to 4-copy, force binding to pad-25 or loose
  useEffect(() => {
    if (is4Copy && binding === "pad-50") {
      setBinding("pad-25");
    }
  }, [is4Copy, binding]);

  // When print color is black, force numbering color to black
  useEffect(() => {
    if (printColor === "black") {
      setNumberColor("black");
    }
  }, [printColor]);

  // Computed numbering range
  const numberStartInt = parseInt(numberStart, 10) || 1;
  const numberEnd = numberStartInt + quantity - 1;
  const numberingOverflow = numberEnd > 999999;

  // ─── Quote ───
  const quote = useConfiguratorPrice({
    slug: formType.slug,
    quantity,
    widthIn: size.w,
    heightIn: size.h,
    enabled: quantity > 0,
  });

  // Numbering surcharge: $0.03/form; padding surcharge: $0.02/form
  const numberingSurcharge = numbering ? quantity * 3 : 0;
  const paddingSurcharge = binding !== "loose" ? quantity * 2 : 0;
  const colorSurcharge = printColor === "color" ? quantity * 5 : 0;
  const totalSurcharges = numberingSurcharge + paddingSurcharge + colorSurcharge;

  useEffect(() => {
    quote.addSurcharge(totalSurcharges);
  }, [totalSurcharges]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && quantity > 0 && (!numbering || !numberingOverflow);

  // ─── Cart ───
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || quantity <= 0) return null;

    const nameParts = [
      `${formType.label} NCR`,
      size.label,
      `×${quantity.toLocaleString()}`,
    ];
    if (numbering) {
      nameParts.push(`#${numberStartInt}–${numberEnd}`);
    }

    return {
      id: formType.slug,
      name: nameParts.join(" — "),
      slug: formType.slug,
      price: Math.round(quote.subtotalCents / quantity),
      quantity,
      options: {
        formType: formTypeId,
        parts: formType.parts,
        colors: formType.colors,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        printColor,
        binding,
        numbering,
        ...(numbering ? { numberStart: numberStartInt, numberEnd, numberColor } : {}),
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, quantity, formTypeId, formType, size, printColor, binding, numbering, numberStartInt, numberEnd, numberColor, uploadedFile]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("ncr.addedToCart"),
  });

  // ─── Summary & Extra Rows ───
  const summaryLines = [
    { label: t("ncr.formType"), value: `${formType.label} (${formType.colors})` },
    { label: t("ncr.size"), value: size.label },
    { label: "Print Color", value: printColor === "color" ? "Full Color" : "Black" },
    { label: "Binding", value: binding === "loose" ? "Loose Sheets" : binding === "pad-25" ? "Padded (25/book)" : "Padded (50/book)" },
    { label: t("ncr.quantity"), value: quantity > 0 ? quantity.toLocaleString() : "—" },
    ...(numbering
      ? [{ label: t("ncr.numbering.label"), value: `#${numberStartInt.toLocaleString()} – ${numberEnd.toLocaleString()}${numberColor === "red" ? " (Red)" : ""}` }]
      : []),
  ];

  const extraRows = [];
  if (numberingSurcharge > 0) {
    extraRows.push({ label: t("ncr.numbering.surcharge"), value: `+ ${formatCad(numberingSurcharge)}` });
  }
  if (paddingSurcharge > 0) {
    extraRows.push({ label: "Padding", value: `+ ${formatCad(paddingSurcharge)}` });
  }
  if (colorSurcharge > 0) {
    extraRows.push({ label: "Full Color", value: `+ ${formatCad(colorSurcharge)}` });
  }

  // Accordion state
  const [activeStepId, setActiveStepId] = useState("step-formType");
  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "formType", vis: true },
      { id: "size", vis: true },
      { id: "printColor", vis: true },
      { id: "binding", vis: true },
      { id: "quantity", vis: true },
      { id: "numbering", vis: true },
      { id: "artwork", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, []);
  const stepNumFn = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);
  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  // Summary texts
  const formTypeSummary = `${formType.label} (${formType.colors})`;
  const sizeSummary = size.label;
  const printColorSummary = printColor === "color" ? "Full Color" : "Black";
  const bindingSummary = binding === "loose" ? "Loose Sheets" : binding === "pad-25" ? "Padded (25/book)" : "Padded (50/book)";
  const quantitySummary = `${quantity.toLocaleString()} pcs`;
  const numberingSummary = numbering ? `#${numberStartInt}–${numberEnd}` : "None";
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("ncr.breadcrumb"), href: "/shop/marketing-business-print/ncr-forms" },
          { label: t("ncr.order") },
        ]}
        title={t("ncr.title")}
        subtitle={t("ncr.subtitle", "2, 3 & 4-copy carbonless NCR forms — custom printing")}
        badges={[t("ncr.badge.carbonless"), t("ncr.badge.shipping")]}
      />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT: Options */}
          <div className="space-y-3 lg:col-span-2">

            {/* Product Gallery */}
            {productImages?.length > 0 && (
              <ConfigProductGallery images={productImages} inline />
            )}

            {/* Form Type (Copy Count) */}
            <StepCard
              stepNumber={stepNumFn("formType")}
              title={t("ncr.formType")}
              hint={t("ncr.formTypeSubtitle", "Select copy count")}
              summaryText={formTypeSummary}
              open={isStepOpen("formType")}
              onToggle={() => toggleStep("formType")}
              stepId="step-formType"
            >
              <OptionGrid columns={3} label={t("ncr.formType")}>
                {FORM_TYPES.map((ft) => (
                  <OptionCard
                    key={ft.id}
                    label={ft.label}
                    description={ft.colors}
                    selected={formTypeId === ft.id}
                    onSelect={() => {
                      setFormTypeId(ft.id);
                      advanceStep("step-formType");
                    }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Size */}
            <StepCard
              stepNumber={stepNumFn("size")}
              title={t("ncr.size")}
              summaryText={sizeSummary}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
            >
              <OptionGrid columns={3} label={t("ncr.size")}>
                {SIZES.map((s, i) => (
                  <OptionCard
                    key={s.id}
                    label={s.label}
                    selected={sizeIdx === i}
                    onSelect={() => {
                      setSizeIdx(i);
                      advanceStep("step-size");
                    }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Print Color */}
            <StepCard
              stepNumber={stepNumFn("printColor")}
              title="Print Color"
              summaryText={printColorSummary}
              open={isStepOpen("printColor")}
              onToggle={() => toggleStep("printColor")}
              stepId="step-printColor"
            >
              <OptionGrid columns={2} label="Print Color">
                {[
                  { id: "black", label: "Black" },
                  { id: "color", label: "Full Color" },
                ].map((c) => (
                  <OptionCard
                    key={c.id}
                    label={c.label}
                    selected={printColor === c.id}
                    onSelect={() => {
                      setPrintColor(c.id);
                      advanceStep("step-printColor");
                    }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Binding */}
            <StepCard
              stepNumber={stepNumFn("binding")}
              title="Binding"
              summaryText={bindingSummary}
              open={isStepOpen("binding")}
              onToggle={() => toggleStep("binding")}
              stepId="step-binding"
            >
              <OptionGrid columns={3} label="Binding">
                {[
                  { id: "loose", label: "Loose Sheets" },
                  { id: "pad-25", label: "Padded (25/book)" },
                  ...(!is4Copy ? [{ id: "pad-50", label: "Padded (50/book)" }] : []),
                ].map((b) => (
                  <OptionCard
                    key={b.id}
                    label={b.label}
                    selected={binding === b.id}
                    onSelect={() => {
                      setBinding(b.id);
                      advanceStep("step-binding");
                    }}
                  />
                ))}
              </OptionGrid>
              {is4Copy && (
                <p className="mt-2 text-[11px] text-gray-400">4-copy forms can only be padded in books of 25.</p>
              )}
            </StepCard>

            {/* Quantity */}
            <StepCard
              stepNumber={stepNumFn("quantity")}
              title={t("ncr.quantity")}
              summaryText={quantitySummary}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
            >
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {QUANTITIES.map((q) => (
                  <OptionCard
                    key={q}
                    label={q.toLocaleString()}
                    selected={quantity === q}
                    onSelect={() => {
                      setQuantity(q);
                      advanceStep("step-quantity");
                    }}
                  />
                ))}
              </div>
            </StepCard>

            {/* Numbering */}
            <StepCard
              stepNumber={stepNumFn("numbering")}
              title={t("ncr.numbering.label")}
              summaryText={numberingSummary}
              open={isStepOpen("numbering")}
              onToggle={() => toggleStep("numbering")}
              stepId="step-numbering"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={numbering}
                  onChange={(e) => setNumbering(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{t("ncr.numbering.addNumbering")}</span>
              </label>

              {numbering && (
                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1">
                        {t("ncr.numbering.startNumber")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999999"
                        value={numberStart}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.length <= 6) setNumberStart(val);
                        }}
                        className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                      />
                    </div>
                    <span className="pt-5 text-gray-400">&rarr;</span>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1">
                        {t("ncr.numbering.endNumber")}
                      </label>
                      <div className={`flex h-[38px] items-center rounded-lg border px-3 text-sm font-semibold ${
                        numberingOverflow
                          ? "border-red-300 bg-red-50 text-red-600"
                          : "border-gray-200 bg-white text-gray-900"
                      }`}>
                        {numberEnd.toLocaleString()}
                      </div>
                    </div>
                    <div className="pt-5">
                      <span className="rounded-xl bg-teal-600 px-3 py-1 text-[11px] font-semibold text-[#fff]">
                        {quantity.toLocaleString()} {t("ncr.numbering.forms")}
                      </span>
                    </div>
                  </div>
                  {numberingOverflow && (
                    <p className="text-xs text-red-500 font-medium">Number exceeds 6 digits (max 999,999). Lower start number or quantity.</p>
                  )}

                  {/* Numbering color — only when full color print */}
                  {printColor === "color" && (
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                        Number Color
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: "black", label: "Black" },
                          { id: "red", label: "Red" },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setNumberColor(c.id)}
                            className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all duration-150 ${
                              numberColor === c.id
                                ? "border-teal-500 bg-teal-50 text-gray-900"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-400">
                    Max 6 digits. {printColor === "black" ? "Numbering printed in black." : `Numbering printed in ${numberColor}.`}
                  </p>
                </div>
              )}
            </StepCard>

            {/* File Upload */}
            <StepCard
              stepNumber={stepNumFn("artwork")}
              title={t("ncr.artwork")}
              hint=""
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

          {/* RIGHT: Summary sidebar */}
          <PricingSidebar
            summaryLines={summaryLines}
            quoteLoading={quote.quoteLoading}
            quoteError={quote.quoteError}
            unitCents={quote.unitCents}
            subtotalCents={quote.subtotalCents}
            taxCents={quote.taxCents}
            totalCents={quote.subtotalCents}
            quantity={quantity}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            extraRows={extraRows}
            badges={[t("ncr.badge.carbonless"), t("ncr.badge.shipping")]}
            t={t}
            productName={`${formType.label} NCR Forms`}
            categorySlug="marketing-business-print"
            locale={locale}
            productSlug={formType.slug}
            onRetryPrice={quote.retry}
          />
        </div>
      </div>

      {/* FAQ Section */}
      {(() => {
        const faqItems = getConfiguratorFaqs("ncr-forms");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl pb-16 pt-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        quantity={quantity}
        summaryText={
          quote.quoteData
            ? `${quantity.toLocaleString()} ${t("ncr.numbering.forms")}${numbering ? ` \u2022 #${numberStartInt}\u2013${numberEnd}` : ""}`
            : null
        }
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        productName={`${formType.label} NCR Forms`}
        summaryLines={summaryLines}
        unitCents={quote.unitCents}
        subtotalCents={quote.subtotalCents}
        categorySlug="marketing-business-print"
        locale={locale}
        onRetryPrice={quote.retry}
      />
    </main>
  );
}
