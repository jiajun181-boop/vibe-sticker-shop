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

// ─── Booklet Configuration ───

const BINDINGS = [
  {
    id: "saddle-stitch",
    slug: "booklets-saddle-stitch",
    icon: "staple",
    pageRule: "multiple-of-4",
    minPages: 8,
    maxPages: 32,
  },
  {
    id: "perfect-bound",
    slug: "booklets-perfect-bound",
    icon: "spine",
    pageRule: "any",
    minPages: 24,
    maxPages: 400,
  },
  {
    id: "wire-o",
    slug: "booklets-wire-o",
    icon: "coil",
    pageRule: "any",
    minPages: 12,
    maxPages: 100,
  },
];

const SIZES = [
  { id: "half-letter", label: '5.5" × 8.5" finished (flat 8.5" × 11")', w: 5.5, h: 8.5 },
  { id: "letter", label: '8.5" × 11" finished (flat 11" × 17")', w: 8.5, h: 11 },
  { id: "6x9", label: '6" × 9" finished (flat 9" × 12")', w: 6, h: 9 },
  { id: "letter-landscape", label: '8.5" × 5.5" finished (flat 8.5" × 11")', w: 8.5, h: 5.5 },
];

const PAGE_COUNTS_SADDLE = [8, 12, 16, 20, 24, 28, 32];
const PAGE_COUNTS_GENERAL = [12, 16, 20, 24, 28, 32, 36, 40, 48, 64, 80, 100, 120, 160, 200, 250, 300, 400];

const INTERIOR_PAPERS = [
  { id: "100lb-gloss-text", label: "100lb Gloss Text" },
  { id: "100lb-matte-text", label: "100lb Matte Text" },
  { id: "80lb-uncoated", label: "80lb Uncoated" },
  { id: "70lb-offset", label: "70lb Offset" },
];

const COVER_PAPERS = [
  { id: "self-cover", label: null },
  { id: "14pt-c2s", label: "14pt C2S" },
];

const COVER_COATINGS = [
  { id: "none", label: null },
  { id: "gloss-lam", label: null },
  { id: "matte-lam", label: null },
  { id: "soft-touch", label: null },
];

const QUANTITIES = [25, 50, 100, 250, 500, 1000];

// ─── Icons ───

function BindingIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "staple":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
          <path strokeLinecap="round" d="M8 8h0M8 16h0" strokeWidth={3} />
        </svg>
      );
    case "spine":
      return (
        <svg {...common}>
          <rect x="4" y="2" width="16" height="20" rx="1" />
          <path strokeLinecap="round" d="M4 2h2v20H4z" fill="currentColor" opacity="0.2" />
          <path strokeLinecap="round" d="M8 6h8M8 10h8M8 14h6" />
        </svg>
      );
    case "coil":
      return (
        <svg {...common}>
          <rect x="6" y="2" width="14" height="20" rx="1" />
          <path d="M6 5H4a1 1 0 000 2h2M6 9H4a1 1 0 000 2h2M6 13H4a1 1 0 000 2h2M6 17H4a1 1 0 000 2h2" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function BookletOrderClient({ defaultBinding, productImages }) {
  const { t } = useTranslation();

  const [bindingId, setBindingId] = useState(defaultBinding || "saddle-stitch");
  const [sizeIdx, setSizeIdx] = useState(1); // letter
  const [pageCount, setPageCount] = useState(16);
  const [interiorPaper, setInteriorPaper] = useState("100lb-gloss-text");
  const [coverPaper, setCoverPaper] = useState("14pt-c2s");
  const [coverCoating, setCoverCoating] = useState("none");
  const [quantity, setQuantity] = useState(100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const binding = useMemo(() => BINDINGS.find((b) => b.id === bindingId) || BINDINGS[0], [bindingId]);
  const size = SIZES[sizeIdx];
  const isSelfCover = coverPaper === "self-cover";

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Available page counts depend on binding
  const pageCounts = useMemo(() => {
    if (binding.pageRule === "multiple-of-4") {
      return PAGE_COUNTS_SADDLE.filter((p) => p >= binding.minPages && p <= binding.maxPages);
    }
    return PAGE_COUNTS_GENERAL.filter((p) => p >= binding.minPages && p <= binding.maxPages);
  }, [binding]);

  // Reset page count when binding changes if current is invalid
  useEffect(() => {
    if (binding.pageRule === "multiple-of-4" && pageCount % 4 !== 0) {
      setPageCount(pageCounts[0] || 16);
    } else if (pageCount < binding.minPages || pageCount > binding.maxPages) {
      setPageCount(pageCounts[0] || 16);
    }
  }, [bindingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disable cover coating for self-cover
  useEffect(() => {
    if (isSelfCover) setCoverCoating("none");
  }, [isSelfCover]);

  // ─── Quote ───
  const quote = useConfiguratorPrice({
    slug: binding.slug,
    quantity: activeQty,
    widthIn: size.w,
    heightIn: size.h,
    material: interiorPaper,
    enabled: activeQty > 0,
  });

  // Surcharges
  const extraPages = Math.max(0, pageCount - 16);
  const pageSurcharge = extraPages * 2 * activeQty;
  const coverUpgrade = coverPaper === "14pt-c2s" ? 15 : 0;
  const coverSurchargeTotal = coverUpgrade * activeQty;
  const coatingPrice = coverCoating === "gloss-lam" ? 8 : coverCoating === "matte-lam" ? 10 : coverCoating === "soft-touch" ? 18 : 0;
  const coatingSurchargeTotal = isSelfCover ? 0 : coatingPrice * activeQty;

  const totalSurcharges = pageSurcharge + coverSurchargeTotal + coatingSurchargeTotal;

  useEffect(() => {
    quote.addSurcharge(totalSurcharges);
  }, [totalSurcharges]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0;

  // ─── Cart ───
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;
    const nameParts = [
      t(`booklet.binding.${bindingId}`),
      size.label,
      `${pageCount}pp`,
    ];
    return {
      id: binding.slug,
      name: nameParts.join(" — "),
      slug: binding.slug,
      price: Math.round(quote.subtotalCents / activeQty),
      quantity: activeQty,
      options: {
        binding: bindingId,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        pageCount,
        interiorPaper,
        coverPaper,
        coverCoating: isSelfCover ? "none" : coverCoating,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, bindingId, binding, size, pageCount, interiorPaper, coverPaper, coverCoating, isSelfCover, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("booklet.addedToCart"),
  });

  // ─── Summary & Extra Rows ───
  const summaryLines = [
    { label: t("booklet.binding.label"), value: t(`booklet.binding.${bindingId}`) },
    { label: t("booklet.size"), value: size.label },
    { label: t("booklet.pageCount"), value: `${pageCount} pages` },
    { label: t("booklet.interiorPaper"), value: INTERIOR_PAPERS.find((p) => p.id === interiorPaper)?.label || interiorPaper },
    { label: t("booklet.coverPaper"), value: isSelfCover ? t("booklet.cover.self-cover") : COVER_PAPERS.find((p) => p.id === coverPaper)?.label || coverPaper },
    ...(!isSelfCover && coverCoating !== "none"
      ? [{ label: t("booklet.coverCoating"), value: t(`booklet.coating.${coverCoating}`) }]
      : []),
    { label: t("booklet.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
  ];

  const extraRows = [];
  if (pageSurcharge > 0) {
    extraRows.push({ label: `${extraPages} ${t("booklet.extraPages")}`, value: `+ ${formatCad(pageSurcharge)}` });
  }
  if (coverSurchargeTotal > 0) {
    extraRows.push({ label: t("booklet.coverUpgrade"), value: `+ ${formatCad(coverSurchargeTotal)}` });
  }
  if (coatingSurchargeTotal > 0) {
    extraRows.push({ label: t(`booklet.coating.${coverCoating}`), value: `+ ${formatCad(coatingSurchargeTotal)}` });
  }

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("booklet.breadcrumb"), href: "/shop/marketing-business-print/booklets" },
          { label: t("booklet.order") },
        ]}
        title={t("booklet.title")}
        subtitle={t("booklet.subtitle", "Custom booklets, catalogues & programs — saddle stitch, perfect bound or wire-o")}
        badges={[t("booklet.badge.fullColor"), t("booklet.badge.shipping"), t("booklet.badge.proof")]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT: Options */}
          <div className="space-y-6 lg:col-span-2">

            {/* Binding Type */}
            <ConfigStep number={1} title={t("booklet.binding.label")} subtitle={t("booklet.bindingSubtitle", "Choose your binding method")}>
              <div className="grid grid-cols-3 gap-3">
                {BINDINGS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBindingId(b.id)}
                    className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                      bindingId === b.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                    }`}
                  >
                    {bindingId === b.id && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </span>
                    )}
                    <BindingIcon type={b.icon} className="h-7 w-7" />
                    <span className="text-sm font-bold">{t(`booklet.binding.${b.id}`)}</span>
                    <span className={`text-[11px] leading-tight ${bindingId === b.id ? "text-gray-300" : "text-gray-400"}`}>
                      {t(`booklet.bindingDesc.${b.id}`)}
                    </span>
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* Size */}
            <ConfigStep number={2} title={t("booklet.size")}>
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

            {/* Page Count */}
            <ConfigStep number={3} title={t("booklet.pageCount")}>
              <div className="flex flex-wrap gap-2">
                {pageCounts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPageCount(p)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                      pageCount === p
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {binding.pageRule === "multiple-of-4" && (
                <p className="mt-2 text-[11px] text-gray-400">{t("booklet.pageRuleSaddle")}</p>
              )}
            </ConfigStep>

            {/* Interior Paper */}
            <ConfigStep number={4} title={t("booklet.interiorPaper")}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {INTERIOR_PAPERS.map((p) => {
                  const isActive = interiorPaper === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setInteriorPaper(p.id)}
                      className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      <span className="block text-sm font-bold text-gray-800">{p.label}</span>
                      {isActive && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ConfigStep>

            {/* Cover Paper */}
            <ConfigStep number={5} title={t("booklet.coverPaper")}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {COVER_PAPERS.map((p) => {
                  const displayLabel = p.label || t(`booklet.cover.${p.id}`);
                  const surcharge = p.id === "14pt-c2s" ? "+$0.15" : null;
                  const isActive = coverPaper === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCoverPaper(p.id)}
                      className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      <span className="block text-sm font-bold text-gray-800">{displayLabel}</span>
                      {surcharge && (
                        <span className="mt-0.5 block text-[11px] font-bold text-amber-600">{surcharge}/ea</span>
                      )}
                      {isActive && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ConfigStep>

            {/* Cover Coating */}
            <ConfigStep number={6} title={t("booklet.coverCoating")}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {COVER_COATINGS.map((c) => {
                  const disabled = isSelfCover && c.id !== "none";
                  const displayLabel = t(`booklet.coating.${c.id}`);
                  const surcharge = c.id === "gloss-lam" ? "+$0.08" : c.id === "matte-lam" ? "+$0.10" : c.id === "soft-touch" ? "+$0.18" : null;
                  const isActive = coverCoating === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => !disabled && setCoverCoating(c.id)}
                      disabled={disabled}
                      className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all duration-150 ${
                        disabled
                          ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                          : isActive
                            ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                            : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      <span className={`block text-sm font-bold ${disabled ? "text-gray-300" : "text-gray-800"}`}>
                        {displayLabel}
                      </span>
                      {surcharge && !disabled && (
                        <span className="mt-0.5 block text-[11px] font-bold text-amber-600">{surcharge}/ea</span>
                      )}
                      {isActive && !disabled && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {isSelfCover && (
                <p className="mt-2 text-[11px] text-gray-400">{t("booklet.selfCoverNoCoating")}</p>
              )}
            </ConfigStep>

            {/* Quantity */}
            <ConfigStep number={7} title={t("booklet.quantity")}>
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
                    <span className="text-base font-black">{q.toLocaleString()}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("booklet.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 75"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* File Upload */}
            <ConfigStep number={8} title={t("booklet.artwork")} optional>
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                t={t}
              />
            </ConfigStep>
          </div>

          {/* RIGHT: Summary */}
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
            badges={[t("booklet.badge.fullColor"), t("booklet.badge.shipping"), t("booklet.badge.proof")]}
            t={t}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.totalCents}
        summaryText={quote.quoteData ? `${activeQty.toLocaleString()} × ${pageCount}pp ${t(`booklet.binding.${bindingId}`)}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
      />
    </main>
  );
}
