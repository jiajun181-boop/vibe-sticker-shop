"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  ConfigStep,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── NCR Configuration ───

const FORM_TYPES = [
  { id: "2-copy", parts: 2, slug: "ncr-forms-duplicate", label: "2 Copy", colors: "White / Yellow" },
  { id: "3-copy", parts: 3, slug: "ncr-forms-triplicate", label: "3 Copy", colors: "White / Yellow / Pink" },
  { id: "4-copy", parts: 4, slug: "ncr-invoices", label: "4 Copy", colors: "White / Yellow / Pink / Gold" },
];

const SIZES = [
  { id: "half-letter", label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
  { id: "letter", label: '8.5" × 11"', w: 8.5, h: 11 },
  { id: "legal", label: '8.5" × 14"', w: 8.5, h: 14 },
];

const QUANTITIES = [100, 250, 500, 1000, 2500, 5000, 7500, 10000];

// ─── Main Component ───

export default function NcrOrderClient({ defaultType, productImages }) {
  const { t } = useTranslation();

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

  let step = 0;

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
          <div className="space-y-6 lg:col-span-2">

            {/* Product Gallery */}
            {productImages?.length > 0 && (
              <ConfigProductGallery images={productImages} inline />
            )}

            {/* Form Type (Copy Count) */}
            <ConfigStep number={++step} title={t("ncr.formType")} subtitle={t("ncr.formTypeSubtitle", "Select copy count")}>
              <div className="grid grid-cols-3 gap-3">
                {FORM_TYPES.map((ft) => (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => setFormTypeId(ft.id)}
                    className={`group relative flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                      formTypeId === ft.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                    }`}
                  >
                    {formTypeId === ft.id && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </span>
                    )}
                    <span className="text-sm font-bold">{ft.label}</span>
                    <span className={`text-[11px] leading-tight ${formTypeId === ft.id ? "text-gray-300" : "text-gray-400"}`}>
                      {ft.colors}
                    </span>
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Size */}
            <ConfigStep number={++step} title={t("ncr.size")}>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeIdx(i)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                      sizeIdx === i
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Print Color */}
            <ConfigStep number={++step} title="Print Color">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "black", label: "Black" },
                  { id: "color", label: "Full Color" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPrintColor(c.id)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                      printColor === c.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Binding */}
            <ConfigStep number={++step} title="Binding">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "loose", label: "Loose Sheets" },
                  { id: "pad-25", label: "Padded (25/book)" },
                  ...(!is4Copy ? [{ id: "pad-50", label: "Padded (50/book)" }] : []),
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBinding(b.id)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                      binding === b.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {is4Copy && (
                <p className="mt-2 text-[11px] text-gray-400">4-copy forms can only be padded in books of 25.</p>
              )}
            </ConfigStep>

            {/* Quantity */}
            <ConfigStep number={++step} title={t("ncr.quantity")}>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {QUANTITIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                      quantity === q
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-base font-black">{q.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Numbering */}
            <ConfigStep number={++step} title={t("ncr.numbering.label")}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={numbering}
                  onChange={(e) => setNumbering(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
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
                        className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
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
                      <span className="rounded-xl bg-gray-900 px-3 py-1 text-[11px] font-semibold text-white">
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
                                ? "border-gray-900 bg-gray-900 text-white shadow-md"
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
            </ConfigStep>

            {/* File Upload */}
            <ConfigStep number={++step} title={t("ncr.artwork")} optional>
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                t={t}
              />
            </ConfigStep>
          </div>

          {/* RIGHT: Summary sidebar */}
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
            badges={[t("ncr.badge.carbonless"), t("ncr.badge.shipping")]}
            t={t}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.totalCents}
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
      />
    </main>
  );
}
