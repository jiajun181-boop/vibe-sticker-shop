"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { showErrorToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  ConfigStep,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  useConfiguratorQuote,
  useConfiguratorCart,
} from "@/components/configurator";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── NCR Configuration ───

const FORM_TYPES = [
  { id: "duplicate", parts: 2, slug: "ncr-forms-duplicate" },
  { id: "triplicate", parts: 3, slug: "ncr-forms-triplicate" },
  { id: "invoices", parts: 2, slug: "ncr-invoices" },
  { id: "invoice-books", parts: 2, slug: "ncr-invoice-books" },
];

const SIZES = [
  { id: "half-letter", label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
  { id: "letter", label: '8.5" × 11"', w: 8.5, h: 11 },
  { id: "legal", label: '8.5" × 14"', w: 8.5, h: 14 },
  { id: "a4", label: "A4", w: 8.27, h: 11.69 },
];

const QUANTITIES = [100, 250, 500, 1000, 2500, 5000];

// ─── Main Component ───

export default function NcrOrderClient({ defaultType, productImages }) {
  const { t } = useTranslation();

  // Form state
  const [formTypeId, setFormTypeId] = useState(defaultType || "duplicate");
  const [sizeIdx, setSizeIdx] = useState(1); // default: letter
  const [quantity, setQuantity] = useState(500);
  const [customQty, setCustomQty] = useState("");

  // Numbering
  const [numbering, setNumbering] = useState(false);
  const [numberStart, setNumberStart] = useState("1");
  const [showNumberModal, setShowNumberModal] = useState(false);

  // File upload
  const [uploadedFile, setUploadedFile] = useState(null);

  const formType = useMemo(() => FORM_TYPES.find((f) => f.id === formTypeId) || FORM_TYPES[0], [formTypeId]);
  const size = SIZES[sizeIdx];

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Computed numbering range
  const numberStartInt = parseInt(numberStart, 10) || 1;
  const numberEnd = numberStartInt + activeQty - 1;

  // ─── Quote ───
  const quote = useConfiguratorQuote({
    slug: formType.slug,
    quantity: activeQty,
    widthIn: size.w,
    heightIn: size.h,
    enabled: activeQty > 0,
  });

  // Numbering surcharge: $0.03/form
  const numberingSurcharge = numbering ? activeQty * 3 : 0;

  useEffect(() => {
    quote.addSurcharge(numberingSurcharge);
  }, [numberingSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0;

  // ─── Numbering modal handlers ───
  function handleToggleNumbering(checked) {
    if (checked) {
      setShowNumberModal(true);
    } else {
      setNumbering(false);
    }
  }

  function handleConfirmNumbering() {
    const start = parseInt(numberStart, 10);
    if (!start || start < 0) {
      showErrorToast(t("ncr.numbering.invalidStart"));
      return;
    }
    setNumbering(true);
    setShowNumberModal(false);
  }

  function handleCancelNumbering() {
    setShowNumberModal(false);
    setNumbering(false);
  }

  // ─── Cart ───
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;

    const nameParts = [
      t(`ncr.type.${formTypeId}`),
      size.label,
      `×${activeQty.toLocaleString()}`,
    ];
    if (numbering) {
      nameParts.push(`#${numberStartInt}–${numberEnd}`);
    }

    return {
      id: formType.slug,
      name: nameParts.join(" — "),
      slug: formType.slug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        formType: formTypeId,
        parts: formType.parts,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        numbering,
        ...(numbering ? { numberStart: numberStartInt, numberEnd } : {}),
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, formTypeId, formType, size, numbering, numberStartInt, numberEnd, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("ncr.addedToCart"),
  });

  // ─── Summary & Extra Rows ───
  const summaryLines = [
    { label: t("ncr.formType"), value: t(`ncr.type.${formTypeId}`) },
    { label: t("ncr.size"), value: size.label },
    { label: t("ncr.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
    ...(numbering
      ? [{ label: t("ncr.numbering.label"), value: `#${numberStartInt.toLocaleString()} – ${numberEnd.toLocaleString()}` }]
      : []),
  ];

  const extraRows = [];
  if (numberingSurcharge > 0) {
    extraRows.push({ label: t("ncr.numbering.surcharge"), value: `+ ${formatCad(numberingSurcharge)}` });
  }

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("ncr.breadcrumb"), href: "/shop/marketing-business-print/ncr-forms" },
          { label: t("ncr.order") },
        ]}
        title={t("ncr.title")}
        subtitle={t("ncr.subtitle", "Duplicate, triplicate & invoice forms — carbonless NCR printing")}
        badges={[t("ncr.badge.carbonless"), t("ncr.badge.shipping")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT: Options */}
          <div className="space-y-6 lg:col-span-2">

            {/* Form Type */}
            <ConfigStep number={1} title={t("ncr.formType")} subtitle={t("ncr.formTypeSubtitle", "Select your form type")}>
              <div className="grid grid-cols-2 gap-3">
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
                    <span className="text-sm font-bold">{t(`ncr.type.${ft.id}`)}</span>
                    <span className={`text-[11px] ${formTypeId === ft.id ? "text-gray-300" : "text-gray-400"}`}>
                      {ft.parts} {t("ncr.parts")}
                    </span>
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Size */}
            <ConfigStep number={2} title={t("ncr.size")}>
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

            {/* Quantity */}
            <ConfigStep number={3} title={t("ncr.quantity")}>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {QUANTITIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => { setQuantity(q); setCustomQty(""); }}
                    className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                      customQty === "" && quantity === q
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-base font-black">{q >= 1000 ? `${q / 1000}K` : q}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("ncr.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 750"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* Numbering */}
            <ConfigStep number={4} title={t("ncr.numbering.label")}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={numbering}
                  onChange={(e) => handleToggleNumbering(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">{t("ncr.numbering.addNumbering")}</span>
              </label>

              {numbering && (
                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1">
                        {t("ncr.numbering.startNumber")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={numberStart}
                        onChange={(e) => setNumberStart(e.target.value)}
                        className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      />
                    </div>
                    <span className="pt-5 text-gray-400">&rarr;</span>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1">
                        {t("ncr.numbering.endNumber")}
                      </label>
                      <div className="flex h-[38px] items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900">
                        {numberEnd.toLocaleString()}
                      </div>
                    </div>
                    <div className="pt-5">
                      <span className="rounded-xl bg-gray-900 px-3 py-1 text-[11px] font-semibold text-white">
                        {activeQty.toLocaleString()} {t("ncr.numbering.forms")}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">
                    {t("ncr.numbering.hint", { qty: activeQty.toLocaleString() })}
                  </p>
                </div>
              )}
            </ConfigStep>

            {/* File Upload */}
            <ConfigStep number={5} title={t("ncr.artwork")} optional>
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
            ? `${activeQty.toLocaleString()} ${t("ncr.numbering.forms")}${numbering ? ` \u2022 #${numberStartInt}\u2013${numberEnd}` : ""}`
            : null
        }
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
      />

      {/* Numbering Modal */}
      {showNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t("ncr.numbering.modalTitle")}</h3>
            <p className="text-sm text-gray-500 mb-5">
              {t("ncr.numbering.modalDesc", { qty: activeQty.toLocaleString() })}
            </p>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                  {t("ncr.numbering.startNumber")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={numberStart}
                  onChange={(e) => setNumberStart(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-semibold focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              <span className="pb-3 text-lg text-gray-400">&rarr;</span>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                  {t("ncr.numbering.endNumber")}
                </label>
                <div className="flex h-[42px] items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900">
                  {numberEnd.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">
                {t("ncr.numbering.rangeExplain", {
                  start: numberStartInt.toLocaleString(),
                  end: numberEnd.toLocaleString(),
                  qty: activeQty.toLocaleString(),
                })}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelNumbering}
                className="rounded-xl border border-gray-200 px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-600 hover:bg-gray-50"
              >
                {t("ncr.numbering.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmNumbering}
                className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-gray-800"
              >
                {t("ncr.numbering.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
