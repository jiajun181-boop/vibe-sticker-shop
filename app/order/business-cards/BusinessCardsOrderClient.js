"use client";

import { useCallback, useMemo, useState } from "react";
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

// ─── Business Card Configuration ───

const CARD_TYPES = [
  { id: "classic", slug: "business-cards-classic" },
  { id: "gloss", slug: "business-cards-gloss" },
  { id: "matte", slug: "business-cards-matte" },
  { id: "soft-touch", slug: "business-cards-soft-touch" },
  { id: "gold-foil", slug: "business-cards-gold-foil" },
  { id: "linen", slug: "business-cards-linen" },
  { id: "pearl", slug: "business-cards-pearl" },
  { id: "thick", slug: "business-cards-thick" },
  { id: "magnet", slug: "magnets-business-card" },
];

const SIZE = { w: 3.5, h: 2, label: '3.5" × 2"' };

const SIDES = [
  { id: "single", multiplier: 1 },
  { id: "double", multiplier: 1 },
];

const QUANTITIES = [50, 100, 250, 500, 1000, 2500, 5000];

// Rounded corners surcharge: $0.02/card
const ROUNDED_SURCHARGE_PER_CARD = 2;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Main Component ───

export default function BusinessCardsOrderClient() {
  const { t } = useTranslation();

  const [cardTypeId, setCardTypeId] = useState("classic");
  const [sideId, setSideId] = useState("double");
  const [rounded, setRounded] = useState(false);
  const [quantity, setQuantity] = useState(250);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const cardType = useMemo(
    () => CARD_TYPES.find((c) => c.id === cardTypeId) || CARD_TYPES[0],
    [cardTypeId]
  );

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // ─── Quote ───

  const sideLabel = sideId === "single" ? "Single Sided" : "Double Sided";

  const quote = useConfiguratorPrice({
    slug: cardType.slug,
    quantity: activeQty,
    widthIn: SIZE.w,
    heightIn: SIZE.h,
    material: cardTypeId,
    sizeLabel: `${SIZE.label} - ${sideLabel}`,
    options: { doubleSided: sideId === "double" },
    enabled: activeQty > 0,
  });

  // Apply rounded corners surcharge
  const roundedSurcharge = rounded ? ROUNDED_SURCHARGE_PER_CARD * activeQty : 0;
  quote.addSurcharge(roundedSurcharge);

  const canAddToCart = quote.quoteData && !quote.quoteLoading && activeQty > 0;

  // ─── Cart ───

  const buildCartItem = useCallback(() => {
    if (!quote.quoteData || activeQty <= 0) return null;

    const nameParts = [
      t(`bc.type.${cardTypeId}`),
      t(`bc.side.${sideId}`),
      SIZE.label,
    ];
    if (rounded) nameParts.push(t("bc.addon.rounded"));

    return {
      id: cardType.slug,
      name: nameParts.join(" — "),
      slug: cardType.slug,
      // Fixed-price product: use subtotalCents as line total to avoid
      // per-unit rounding errors (e.g. $68/500 = 13.6¢ not integer).
      price: quote.subtotalCents,
      quantity: 1,
      options: {
        cardType: cardTypeId,
        sides: sideId,
        rounded,
        printQuantity: activeQty,
        sizeLabel: SIZE.label,
        width: SIZE.w,
        height: SIZE.h,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }, [quote.quoteData, quote.subtotalCents, activeQty, cardTypeId, sideId, rounded, cardType.slug, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("bc.addedToCart"),
  });

  // ─── Summary lines ───

  const summaryLines = [
    { label: t("bc.cardType"), value: t(`bc.type.${cardTypeId}`) },
    { label: t("bc.sides"), value: t(`bc.side.${sideId}`) },
    { label: t("bc.specs.corners"), value: rounded ? t("bc.addon.rounded") : t("bc.cornersStandard") },
    { label: t("bc.specs.dimensions"), value: SIZE.label },
    { label: t("bc.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
  ];

  const extraRows = roundedSurcharge > 0
    ? [{ label: t("bc.addon.rounded"), value: `+ ${formatCad(roundedSurcharge)}` }]
    : [];

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Hero header */}
      <ConfigHero
        breadcrumbs={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("bc.breadcrumb"), href: "/shop/marketing-business-print/business-cards" },
          { label: t("bc.order") },
        ]}
        title={t("bc.title")}
        subtitle={`Standard ${SIZE.label} — Premium finishes, single or double sided`}
        badges={[t("bc.badge.fullColor"), t("bc.badge.shipping"), t("bc.badge.proof")]}
      />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN — Steps */}
          <div className="space-y-6 lg:col-span-2">

            {/* STEP 1: Card Type */}
            <ConfigStep number={1} title={t("bc.cardType")} subtitle="Choose your card finish">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CARD_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setCardTypeId(ct.id)}
                    className={`group relative flex flex-col items-start gap-1.5 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                      cardTypeId === ct.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                    }`}
                  >
                    {cardTypeId === ct.id && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    )}
                    <span className="text-sm font-bold">{t(`bc.type.${ct.id}`)}</span>
                    <span className={`text-[11px] leading-snug ${cardTypeId === ct.id ? "text-gray-300" : "text-gray-400"}`}>
                      {t(`bc.desc.${ct.id}`)}
                    </span>
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* STEP 2: Print Sides */}
            <ConfigStep number={2} title={t("bc.sides")} subtitle="Single or double sided printing">
              <div className="flex gap-3">
                {SIDES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSideId(s.id)}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-150 ${
                      sideId === s.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {t(`bc.side.${s.id}`)}
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* STEP 3: Add-ons */}
            <ConfigStep number={3} title={t("bc.addons")} subtitle="Optional extras">
              <label className="flex items-center gap-3 cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-4 transition-colors hover:border-gray-400">
                <input
                  type="checkbox"
                  checked={rounded}
                  onChange={(e) => setRounded(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm font-medium text-gray-700">{t("bc.addon.rounded")}</span>
                <span className="ml-auto text-[11px] font-bold text-amber-600">+$0.02/ea</span>
              </label>
            </ConfigStep>

            {/* STEP 4: Quantity */}
            <ConfigStep number={4} title={t("bc.quantity")} subtitle="More you order, more you save">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {QUANTITIES.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuantity(q); setCustomQty(""); }}
                      className={`relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">
                        {q >= 1000 ? `${q / 1000}K` : q}
                      </span>
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

            {/* STEP 5: Upload Artwork */}
            <ConfigStep number={5} title={t("bc.artwork")} subtitle="Upload now or send later — it's optional" optional>
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
        totalCents={quote.totalCents}
        summaryText={
          quote.quoteData
            ? `${formatCad(quote.unitCents)}/ea × ${activeQty.toLocaleString()}`
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
