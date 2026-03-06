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
import BookletPreview from "@/components/booklet/BookletPreview";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import {
  BINDINGS,
  SIZES,
  PAGE_COUNTS_SADDLE,
  PAGE_COUNTS_GENERAL,
  INTERIOR_PAPERS,
  COVER_PAPERS,
  COVER_COATINGS,
  QUANTITIES,
} from "@/lib/booklet-order-config";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

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
  const { t, locale } = useTranslation();

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

  // ─── Selection handlers with advanceStep ───
  const handleBindingSelect = (id) => {
    setBindingId(id);
    advanceStep("step-binding");
  };

  const handleSizeSelect = (i) => {
    setSizeIdx(i);
    advanceStep("step-size");
  };

  const handlePageCountSelect = (p) => {
    setPageCount(p);
    advanceStep("step-pageCount");
  };

  const handleInteriorPaperSelect = (id) => {
    setInteriorPaper(id);
    advanceStep("step-interiorPaper");
  };

  const handleCoverPaperSelect = (id) => {
    setCoverPaper(id);
    advanceStep("step-coverPaper");
  };

  const handleCoverCoatingSelect = (id, disabled) => {
    if (disabled) return;
    setCoverCoating(id);
    advanceStep("step-coverCoating");
  };

  const handleQuantitySelect = (q) => {
    setQuantity(q);
    setCustomQty("");
    advanceStep("step-quantity");
  };

  // --- Accordion state ---
  const [activeStepId, setActiveStepId] = useState("step-binding");

  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "binding",       vis: true },
      { id: "size",          vis: true },
      { id: "pageCount",     vis: true },
      { id: "interiorPaper", vis: true },
      { id: "coverPaper",    vis: true },
      { id: "coverCoating",  vis: true },
      { id: "quantity",      vis: true },
      { id: "artwork",       vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, []);

  const stepNumFn = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);

  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

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
          <div className="space-y-3 lg:col-span-2">

            {/* Binding Type */}
            <StepCard
              stepNumber={stepNumFn("binding")}
              title={t("booklet.binding.label")}
              hint={t("booklet.bindingSubtitle", "Choose your binding method")}
              summaryText={t(`booklet.binding.${bindingId}`)}
              open={isStepOpen("binding")}
              onToggle={() => toggleStep("binding")}
              stepId="step-binding"
            >
              <OptionGrid columns={3} label={t("booklet.binding.label")}>
                {BINDINGS.map((b) => (
                  <OptionCard
                    key={b.id}
                    label={t(`booklet.binding.${b.id}`)}
                    description={t(`booklet.bindingDesc.${b.id}`)}
                    selected={bindingId === b.id}
                    onSelect={() => handleBindingSelect(b.id)}
                    icon={<BindingIcon type={b.icon} className="h-7 w-7" />}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Size */}
            <StepCard
              stepNumber={stepNumFn("size")}
              title={t("booklet.size")}
              summaryText={size.label}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
            >
              <OptionGrid columns={4} label={t("booklet.size")}>
                {SIZES.map((s, i) => (
                  <OptionCard
                    key={s.id}
                    label={s.label}
                    selected={sizeIdx === i}
                    onSelect={() => handleSizeSelect(i)}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Page Count */}
            <StepCard
              stepNumber={stepNumFn("pageCount")}
              title={t("booklet.pageCount")}
              summaryText={`${pageCount} pages`}
              open={isStepOpen("pageCount")}
              onToggle={() => toggleStep("pageCount")}
              stepId="step-pageCount"
            >
              <OptionGrid columns={4} label={t("booklet.pageCount")}>
                {pageCounts.map((p) => (
                  <OptionCard
                    key={p}
                    label={`${p}`}
                    selected={pageCount === p}
                    onSelect={() => handlePageCountSelect(p)}
                  />
                ))}
              </OptionGrid>
              {binding.pageRule === "multiple-of-4" && (
                <p className="mt-2 text-[11px] text-gray-400">{t("booklet.pageRuleSaddle")}</p>
              )}
            </StepCard>

            {/* Interior Paper */}
            <StepCard
              stepNumber={stepNumFn("interiorPaper")}
              title={t("booklet.interiorPaper")}
              summaryText={INTERIOR_PAPERS.find((p) => p.id === interiorPaper)?.label || interiorPaper}
              open={isStepOpen("interiorPaper")}
              onToggle={() => toggleStep("interiorPaper")}
              stepId="step-interiorPaper"
            >
              <OptionGrid columns={4} label={t("booklet.interiorPaper")}>
                {INTERIOR_PAPERS.map((p) => (
                  <OptionCard
                    key={p.id}
                    label={p.label}
                    selected={interiorPaper === p.id}
                    onSelect={() => handleInteriorPaperSelect(p.id)}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* Cover Paper */}
            <StepCard
              stepNumber={stepNumFn("coverPaper")}
              title={t("booklet.coverPaper")}
              summaryText={isSelfCover ? t("booklet.cover.self-cover") : COVER_PAPERS.find((p) => p.id === coverPaper)?.label || coverPaper}
              open={isStepOpen("coverPaper")}
              onToggle={() => toggleStep("coverPaper")}
              stepId="step-coverPaper"
            >
              <OptionGrid columns={4} label={t("booklet.coverPaper")}>
                {COVER_PAPERS.map((p) => {
                  const displayLabel = p.label || t(`booklet.cover.${p.id}`);
                  const surcharge = p.id === "14pt-c2s" ? "+$0.15/ea" : null;
                  return (
                    <OptionCard
                      key={p.id}
                      label={displayLabel}
                      selected={coverPaper === p.id}
                      onSelect={() => handleCoverPaperSelect(p.id)}
                      badge={surcharge ? <span className="text-[11px] font-bold text-amber-600">{surcharge}</span> : null}
                    />
                  );
                })}
              </OptionGrid>
            </StepCard>

            {/* Cover Coating */}
            <StepCard
              stepNumber={stepNumFn("coverCoating")}
              title={t("booklet.coverCoating")}
              summaryText={coverCoating !== "none" ? t(`booklet.coating.${coverCoating}`) : "None"}
              open={isStepOpen("coverCoating")}
              onToggle={() => toggleStep("coverCoating")}
              stepId="step-coverCoating"
            >
              <OptionGrid columns={4} label={t("booklet.coverCoating")}>
                {COVER_COATINGS.map((c) => {
                  const disabled = isSelfCover && c.id !== "none";
                  const displayLabel = t(`booklet.coating.${c.id}`);
                  const surcharge = c.id === "gloss-lam" ? "+$0.08/ea" : c.id === "matte-lam" ? "+$0.10/ea" : c.id === "soft-touch" ? "+$0.18/ea" : null;
                  return (
                    <OptionCard
                      key={c.id}
                      label={displayLabel}
                      selected={coverCoating === c.id}
                      onSelect={() => handleCoverCoatingSelect(c.id, disabled)}
                      badge={surcharge && !disabled ? <span className="text-[11px] font-bold text-amber-600">{surcharge}</span> : null}
                      className={disabled ? "opacity-40 cursor-not-allowed" : ""}
                    />
                  );
                })}
              </OptionGrid>
              {isSelfCover && (
                <p className="mt-2 text-[11px] text-gray-400">{t("booklet.selfCoverNoCoating")}</p>
              )}
            </StepCard>

            {/* Quantity */}
            <StepCard
              stepNumber={stepNumFn("quantity")}
              title={t("booklet.quantity")}
              summaryText={`${activeQty.toLocaleString()} pcs`}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {QUANTITIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuantitySelect(q)}
                    className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                      customQty === "" && quantity === q
                        ? "border-teal-500 bg-teal-50 text-teal-700 shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
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
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </StepCard>

            {/* File Upload */}
            <StepCard
              stepNumber={stepNumFn("artwork")}
              title={t("booklet.artwork")}
              summaryText={uploadedFile?.name || "Not uploaded yet"}
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

          {/* RIGHT: Summary */}
          <PricingSidebar
            previewSlot={
              <BookletPreview
                binding={bindingId}
                pageCount={pageCount}
                coverPaper={coverPaper}
              />
            }
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
            badges={[t("booklet.badge.fullColor"), t("booklet.badge.shipping"), t("booklet.badge.proof")]}
            t={t}
            productName={`${t(`booklet.binding.${bindingId}`)} Booklet`}
            categorySlug="marketing-business-print"
            locale={locale}
            productSlug={binding.slug}
            onRetryPrice={quote.retry}
          />
        </div>
      </div>

      {/* FAQ Section */}
      {(() => {
        const faqItems = getConfiguratorFaqs("booklets");
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
        quantity={activeQty}
        summaryText={quote.quoteData ? `${activeQty.toLocaleString()} × ${pageCount}pp ${t(`booklet.binding.${bindingId}`)}` : null}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        t={t}
        productName={`${t(`booklet.binding.${bindingId}`)} Booklet`}
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
