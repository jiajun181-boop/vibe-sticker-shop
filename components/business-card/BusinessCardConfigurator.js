"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  ConfigStep,
  ConfigHero,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  useConfiguratorPrice,
  useConfiguratorCart,
} from "@/components/configurator";
import BusinessCardPreview from "@/components/business-card/BusinessCardPreview";
import { getBusinessCardConfig, computeMultiNameFileFees } from "@/lib/business-card-configs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SIDES = [
  { id: "single", label: "bc.side.single" },
  { id: "double", label: "bc.side.double" },
];

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BusinessCardConfigurator({ slug }) {
  const config = getBusinessCardConfig(slug);
  const { t } = useTranslation();

  // ── State ──
  const [sideId, setSideId] = useState(config.defaultSideId || "double");
  const [finishingId, setFinishingId] = useState(
    config.finishingOptions?.[0]?.id || "none"
  );
  const [foilCoverage, setFoilCoverage] = useState(
    config.foilCoverageOptions?.[0]?.id || "logo"
  );
  const [foilSides, setFoilSides] = useState(
    config.foilSidesOptions?.[0]?.id || "front"
  );
  const [layerId, setLayerId] = useState(config.defaultLayerId || "double-layer");
  const [rounded, setRounded] = useState(false);
  const [quantity, setQuantity] = useState(config.quantities[2] || 250);
  const [customQty, setCustomQty] = useState("");
  const [names, setNames] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  const hasMultiName = config.multiName?.enabled && names > 1;
  const extraNames = Math.max(0, names - 1);
  const totalCards = activeQty * names;

  // ── Size label for pricing ──
  const sizeLabel = useMemo(
    () => config.buildSizeLabel({ sideId, layerId, foilCoverage, foilSides, finishingId }),
    [config, sideId, layerId, foilCoverage, foilSides, finishingId]
  );

  // ── Pricing ──
  // API returns price for activeQty (per-name quantity)
  const quote = useConfiguratorPrice({
    slug: config.slug,
    quantity: activeQty,
    widthIn: config.size.w,
    heightIn: config.size.h,
    sizeLabel,
    enabled: activeQty > 0,
  });

  // Build surcharges:
  // - Rounded corners: $0.03 × totalCards
  // - Multi-name: (names-1) × oneNamePrice + file fees - $5/name discount
  const roundedSurcharge =
    rounded && config.roundedSurchargePerCard
      ? config.roundedSurchargePerCard * totalCards
      : 0;

  const multiNamePrintCost = hasMultiName ? extraNames * quote.rawSubtotalCents : 0;
  const multiNameFileFees = hasMultiName
    ? computeMultiNameFileFees(extraNames, config.multiName.fileFees)
    : 0;
  // $5 discount per name (all names including first) when multi-name
  const multiNameDiscount = hasMultiName
    ? names * (config.multiName.discountPerName || 0)
    : 0;

  const totalSurcharge = roundedSurcharge + multiNamePrintCost + multiNameFileFees - multiNameDiscount;
  useEffect(() => {
    quote.addSurcharge(totalSurcharge);
  }, [totalSurcharge]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0;

  // ── Cart ──
  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;

    const nameParts = [t(config.name)];
    if (config.steps.sides) nameParts.push(t(`bc.side.${sideId}`));
    if (config.steps.finishing && finishingId !== "none") {
      const opt = config.finishingOptions.find((o) => o.id === finishingId);
      if (opt) nameParts.push(t(opt.label));
    }
    if (config.steps.foilOptions) {
      nameParts.push(t(`bc.foil.coverage.${foilCoverage}`));
      nameParts.push(t(`bc.foil.sides.${foilSides}`));
    }
    if (config.steps.layers) nameParts.push(t(`bc.layer.${layerId}`));
    nameParts.push(config.size.label);
    if (rounded) nameParts.push(t("bc.addon.rounded"));
    if (hasMultiName) nameParts.push(`${names} ${t("bc.names")}`);

    return {
      id: config.slug,
      name: nameParts.join(" — "),
      slug: config.slug,
      price: quote.subtotalCents,
      quantity: 1,
      options: {
        cardType: config.id,
        sides: sideId,
        ...(config.steps.finishing && { finishing: finishingId }),
        ...(config.steps.foilOptions && { foilCoverage, foilSides }),
        ...(config.steps.layers && { layer: layerId }),
        rounded,
        printQuantity: activeQty,
        names,
        totalCards,
        sizeLabel: config.size.label,
        width: config.size.w,
        height: config.size.h,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [
    quote.quoteData,
    quote.subtotalCents,
    activeQty,
    config,
    sideId,
    finishingId,
    foilCoverage,
    foilSides,
    layerId,
    rounded,
    names,
    totalCards,
    hasMultiName,
    uploadedFile,
    t,
  ]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("bc.addedToCart"),
  });

  // ── Summary lines ──
  const summaryLines = [];
  if (config.steps.sides) {
    summaryLines.push({ label: t("bc.sides"), value: t(`bc.side.${sideId}`) });
  } else {
    summaryLines.push({
      label: t("bc.sides"),
      value: t(`bc.side.${config.defaultSideId}`),
    });
  }
  if (config.steps.finishing) {
    const opt = config.finishingOptions.find((o) => o.id === finishingId);
    summaryLines.push({ label: t("bc.finishChoice"), value: opt ? t(opt.label) : "—" });
  }
  if (config.steps.foilOptions) {
    summaryLines.push({ label: t("bc.foil.coverageLabel"), value: t(`bc.foil.coverage.${foilCoverage}`) });
    summaryLines.push({ label: t("bc.foil.sidesLabel"), value: t(`bc.foil.sides.${foilSides}`) });
  }
  if (config.steps.layers) {
    summaryLines.push({ label: t("bc.layers"), value: t(`bc.layer.${layerId}`) });
  }
  summaryLines.push({
    label: t("bc.specs.corners"),
    value: rounded ? t("bc.addon.rounded") : t("bc.cornersStandard"),
  });
  summaryLines.push({ label: t("bc.specs.dimensions"), value: config.size.label });

  if (hasMultiName) {
    summaryLines.push({
      label: t("bc.names"),
      value: t("bc.totalCards", {
        names: String(names),
        qty: activeQty.toLocaleString(),
        total: totalCards.toLocaleString(),
      }),
    });
  } else {
    summaryLines.push({
      label: t("bc.quantity"),
      value: activeQty > 0 ? activeQty.toLocaleString() : "—",
    });
  }

  // Extra rows for price breakdown
  const extraRows = [];
  if (roundedSurcharge > 0) {
    extraRows.push({ label: t("bc.addon.rounded"), value: `+ ${formatCad(roundedSurcharge)}` });
  }
  if (multiNameDiscount > 0) {
    extraRows.push({ label: t("bc.multiName.discount"), value: `- ${formatCad(multiNameDiscount)}` });
  }
  if (multiNameFileFees > 0) {
    extraRows.push({ label: t("bc.multiName.fileFee"), value: `+ ${formatCad(multiNameFileFees)}` });
  }

  // ── Step numbering ──
  let stepNum = 0;

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("bc.breadcrumb"), href: "/shop/marketing-business-print/business-cards" },
          { label: t(config.name) },
        ]}
        title={t(config.name) + " " + t("bc.breadcrumb")}
        subtitle={t(config.tagline)}
        badges={[t("bc.badge.fullColor"), t("bc.badge.shipping"), t("bc.badge.proof")]}
      />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN — Steps */}
          <div className="space-y-6 lg:col-span-2">

            {/* SIDES STEP */}
            {config.steps.sides && (
              <ConfigStep number={++stepNum} title={t("bc.sides")} subtitle="Single or double sided printing">
                <div className="flex gap-3">
                  {SIDES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSideId(s.id)}
                      className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-150 ${
                        sideId === s.id
                          ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {t(s.label)}
                    </button>
                  ))}
                </div>
              </ConfigStep>
            )}

            {/* FINISHING STEP (Classic only) */}
            {config.steps.finishing && config.finishingOptions && (
              <ConfigStep number={++stepNum} title={t("bc.finishChoice")} subtitle="Choose your card finish">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {config.finishingOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFinishingId(opt.id)}
                      className={`group relative flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        finishingId === opt.id
                          ? "border-gray-900 bg-gray-900 text-[#fff] shadow-lg shadow-gray-900/20 scale-[1.02]"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                      }`}
                    >
                      {finishingId === opt.id && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[#fff] shadow-sm">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      )}
                      <span className="text-sm font-bold">{t(opt.label)}</span>
                    </button>
                  ))}
                </div>
              </ConfigStep>
            )}

            {/* FOIL OPTIONS STEP (Gold Foil only) */}
            {config.steps.foilOptions && (
              <>
                <ConfigStep number={++stepNum} title={t("bc.foil.coverageLabel")} subtitle="How much foil coverage?">
                  <div className="flex gap-3">
                    {config.foilCoverageOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFoilCoverage(opt.id)}
                        className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-150 ${
                          foilCoverage === opt.id
                            ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {t(opt.label)}
                      </button>
                    ))}
                  </div>
                </ConfigStep>

                <ConfigStep number={++stepNum} title={t("bc.foil.sidesLabel")} subtitle="Foil on which sides?">
                  <div className="flex gap-3">
                    {config.foilSidesOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFoilSides(opt.id)}
                        className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-150 ${
                          foilSides === opt.id
                            ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {t(opt.label)}
                      </button>
                    ))}
                  </div>
                </ConfigStep>
              </>
            )}

            {/* LAYERS STEP (Thick only) */}
            {config.steps.layers && config.layerOptions && (
              <ConfigStep number={++stepNum} title={t("bc.layers")} subtitle="Card thickness">
                <div className="flex gap-3">
                  {config.layerOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLayerId(opt.id)}
                      className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-150 ${
                        layerId === opt.id
                          ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {t(opt.label)}
                    </button>
                  ))}
                </div>
              </ConfigStep>
            )}

            {/* ADDONS STEP (Rounded Corners) */}
            {config.steps.addons && (
              <ConfigStep number={++stepNum} title={t("bc.addons")} subtitle="Optional extras">
                <label className="flex items-center gap-3 cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-4 transition-colors hover:border-gray-400">
                  <input
                    type="checkbox"
                    checked={rounded}
                    onChange={(e) => setRounded(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-700">{t("bc.addon.rounded")}</span>
                  <span className="ml-auto text-[11px] font-bold text-amber-600">+$0.03/ea</span>
                </label>
              </ConfigStep>
            )}

            {/* QUANTITY STEP */}
            <ConfigStep number={++stepNum} title={t("bc.quantity")} subtitle="More you order, more you save">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {config.quantities.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuantity(q); setCustomQty(""); }}
                      className={`relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">{q.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("bc.customQty")}:</label>
                <input
                  type="number"
                  min="25"
                  max="999999"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* MULTI-NAME STEP */}
            {config.multiName?.enabled && (
              <ConfigStep
                number={++stepNum}
                title={t("bc.names")}
                subtitle={t("bc.namesHint")}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl border-2 border-gray-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setNames((n) => Math.max(1, n - 1))}
                      className="px-4 py-3 text-lg font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      &minus;
                    </button>
                    <span className="min-w-[3rem] text-center text-xl font-black text-gray-900">
                      {names}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNames((n) => Math.min(config.multiName.maxNames, n + 1))}
                      className="px-4 py-3 text-lg font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {names > 1 && activeQty > 0 && (
                      <span className="font-medium text-gray-700">
                        {t("bc.totalCards", {
                          names: String(names),
                          qty: activeQty.toLocaleString(),
                          total: totalCards.toLocaleString(),
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* File fee info */}
                {names > 1 && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                    <p className="text-xs text-amber-800">
                      {t("bc.multiName.feeExplain", { fee: formatCad(multiNameFileFees) })}
                    </p>
                  </div>
                )}
              </ConfigStep>
            )}

            {/* ARTWORK UPLOAD STEP */}
            <ConfigStep number={++stepNum} title={t("bc.artwork")} subtitle="Upload now or send later — it's optional" optional>
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onUploaded={setUploadedFile}
                onRemove={() => setUploadedFile(null)}
                t={t}
              />
            </ConfigStep>
          </div>

          {/* RIGHT COLUMN — Sticky Price Summary */}
          <PricingSidebar
            previewSlot={
              <BusinessCardPreview
                cardType={config.id}
                sides={sideId}
                rounded={rounded}
                imageUrl={uploadedFile?.url || null}
              />
            }
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
            badges={[t("bc.badge.fullColor"), t("bc.badge.shipping"), t("bc.badge.proof")]}
            t={t}
          />
        </div>
      </div>

      <MobileBottomBar
        quoteLoading={quote.quoteLoading}
        hasQuote={!!quote.quoteData}
        totalCents={quote.subtotalCents}
        summaryText={
          quote.quoteData
            ? hasMultiName
              ? `${names} × ${activeQty.toLocaleString()} = ${totalCards.toLocaleString()} cards`
              : `${formatCad(quote.unitCents)}/ea × ${activeQty.toLocaleString()}`
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
