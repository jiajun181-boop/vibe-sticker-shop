"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showErrorToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import ImageGallery from "@/components/product/ImageGallery";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import { useConfiguratorCart } from "@/components/configurator";
import { RUSH_MULTIPLIER, DESIGN_HELP_CENTS } from "@/lib/order-config";
import DeliveryEstimate from "@/components/configurator/DeliveryEstimate";
import InlineTrustSignals from "@/components/configurator/InlineTrustSignals";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Flag Configuration ───

const STYLES = [
  { id: "feather" },
  { id: "teardrop" },
  { id: "rectangle" },
];

const SIZES_BY_STYLE = {
  feather: [
    { id: "s", label: "7 ft", tag: "Small", w: 24, h: 84 },
    { id: "m", label: "10 ft", tag: "Medium", w: 24, h: 120 },
    { id: "l", label: "14 ft", tag: "Large", w: 30, h: 168 },
  ],
  teardrop: [
    { id: "s", label: "7 ft", tag: "Small", w: 24, h: 84 },
    { id: "m", label: "10 ft", tag: "Medium", w: 24, h: 120 },
    { id: "l", label: "12 ft", tag: "Large", w: 24, h: 144 },
  ],
  rectangle: [
    { id: "2x3", label: "2' × 3'", tag: "2×3", w: 24, h: 36 },
    { id: "3x5", label: "3' × 5'", tag: "3×5", w: 36, h: 60 },
    { id: "4x6", label: "4' × 6'", tag: "4×6", w: 48, h: 72 },
  ],
};

const POLES = [
  { id: "ground-stake", surcharge: 0 },
  { id: "cross-base", surcharge: 500 },
  { id: "water-base", surcharge: 800 },
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const QUANTITIES = [1, 2, 5, 10, 25];

const PURCHASE_TYPES = [
  { id: "full-kit", labelKey: "fl.purchaseType.fullKit", descKey: "fl.purchaseType.fullKitDesc" },
  { id: "print-only", labelKey: "fl.purchaseType.printOnly", descKey: "fl.purchaseType.printOnlyDesc" },
  { id: "hardware-only", labelKey: "fl.purchaseType.hardwareOnly", descKey: "fl.purchaseType.hardwareOnlyDesc" },
];

// ─── Main Component ───

export default function FlagOrderClient({ productImages = [] }) {
  const { t, locale } = useTranslation();

  const [purchaseType, setPurchaseType] = useState("full-kit");
  const [style, setStyle] = useState("feather");
  const [sizeId, setSizeId] = useState("m");
  const [pole, setPole] = useState("ground-stake");
  const [sidesId, setSidesId] = useState("single");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artworkIntent, setArtworkIntent] = useState(null);
  const [rushProduction, setRushProduction] = useState(false);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const availableSizes = useMemo(() => SIZES_BY_STYLE[style] || [], [style]);
  const size = useMemo(() => availableSizes.find((s) => s.id === sizeId) || availableSizes[0], [availableSizes, sizeId]);

  // Reset size when style changes
  useEffect(() => {
    const defaults = { feather: "m", teardrop: "m", rectangle: "3x5" };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizeId(defaults[style] || SIZES_BY_STYLE[style]?.[0]?.id || "m");
  }, [style]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // ─── Quote ───

  const fetchQuote = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (activeQty <= 0 || !size) {
      setQuoteData(null);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setQuoteLoading(true);
    setQuoteError(null);

    fetch("/api/pricing/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "flags",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
      }),
      signal: ac.signal,
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Quote failed");
        setQuoteData(data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setQuoteError(err.message);
      })
      .finally(() => setQuoteLoading(false));
  }, [size, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const poleSurcharge = (POLES.find((p) => p.id === pole)?.surcharge ?? 0) * activeQty;
  const printCents = purchaseType === "hardware-only" ? 0 : subtotalCents;
  const hardwareCents = purchaseType === "print-only" ? 0 : poleSurcharge;
  const adjustedSubtotal = printCents + hardwareCents;
  const totalCents = adjustedSubtotal;

  const rushMultiplier = rushProduction ? RUSH_MULTIPLIER : 1;
  const rushSurchargeCents = rushProduction ? Math.round(adjustedSubtotal * (RUSH_MULTIPLIER - 1)) : 0;
  const designHelpCents = artworkIntent === "design-help" ? DESIGN_HELP_CENTS : 0;
  const displayTotal = Math.round(adjustedSubtotal * rushMultiplier) + designHelpCents;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  const disabledReason = !canAddToCart
    ? quoteLoading ? "Calculating price..."
    : !quoteData ? "Select your options for pricing"
    : "Complete all options to continue"
    : null;

  // ─── Cart ───

  const buildCartItem = useCallback(() => {
    if (!quoteData || activeQty <= 0 || !size) return null;
    return {
      id: `flags-${style}-${size.id}`,
      name: `${t("fl.title")} — ${t(`fl.style.${style}`)} ${size.label}`,
      slug: "flags",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        purchaseType,
        style,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        pole: purchaseType !== "print-only" ? pole : undefined,
        sides: sidesId,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
      },
      forceNewLine: true,
    };
  }, [quoteData, activeQty, adjustedSubtotal, size, style, purchaseType, pole, sidesId, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("fl.addedToCart"),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("fl.breadcrumb"), href: "/shop/banners-displays" },
          { label: t("fl.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("fl.title")}
      </h1>

      {productImages.length > 0 && (
        <div className="mb-8">
          <ImageGallery images={productImages} productName={t("fl.title")} />
        </div>
      )}

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Purchase Type */}
          <Section label={t("fl.purchaseType.label")}>
            <div className="grid grid-cols-3 gap-3">
              {PURCHASE_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setPurchaseType(pt.id)}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition-all ${
                    purchaseType === pt.id
                      ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(pt.labelKey)}</span>
                  <span className={`text-[11px] leading-tight ${purchaseType === pt.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(pt.descKey)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Style */}
          <Section label={t("fl.style.label")}>
            <div className="grid grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    style === s.id
                      ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(`fl.style.${s.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${style === s.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`fl.styleDesc.${s.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("fl.size")}>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <Chip key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                  {s.label}
                  {s.tag && <span className="ml-1 text-[11px] opacity-70">({s.tag})</span>}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Pole & Base */}
          <Section label={t("fl.pole.label")}>
            <div className="flex flex-wrap gap-2">
              {POLES.map((p) => (
                <Chip key={p.id} active={pole === p.id} onClick={() => setPole(p.id)}>
                  {t(`fl.pole.${p.id}`)}
                  {p.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(p.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Sides */}
          <Section label={t("fl.sides.label")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sidesId === s.id} onClick={() => setSidesId(s.id)}>
                  {t(`fl.sides.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("fl.quantity")}>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((q) => (
                <Chip
                  key={q}
                  active={customQty === "" && quantity === q}
                  onClick={() => { setQuantity(q); setCustomQty(""); }}
                >
                  {q.toLocaleString()}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("fl.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 15"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("fl.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("fl.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("fl.remove")}
                  </button>
                </div>
              ) : (
                <UploadButton
                  endpoint="artworkUploader"
                  onClientUploadComplete={(res) => {
                    const first = Array.isArray(res) ? res[0] : null;
                    if (!first) return;
                    setUploadedFile({
                      url: first.ufsUrl || first.url,
                      key: first.key,
                      name: first.name,
                      size: first.size,
                    });
                    setArtworkIntent(null);
                  }}
                  onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
                />
              )}
              {!uploadedFile && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setArtworkIntent(artworkIntent === "upload-later" ? null : "upload-later")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      artworkIntent === "upload-later"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    I&apos;ll Upload Later
                  </button>
                  <button
                    type="button"
                    onClick={() => setArtworkIntent(artworkIntent === "design-help" ? null : "design-help")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      artworkIntent === "design-help"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400"
                    }`}
                  >
                    Design Help (+$45)
                  </button>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── RIGHT: Summary ── */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("fl.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("fl.purchaseType.label")} value={t(`fl.purchaseType.${purchaseType === "full-kit" ? "fullKit" : purchaseType === "print-only" ? "printOnly" : "hardwareOnly"}`)} />
              <Row label={t("fl.style.label")} value={t(`fl.style.${style}`)} />
              <Row label={t("fl.size")} value={size?.label || "\u2014"} />
              {purchaseType !== "print-only" && <Row label={t("fl.pole.label")} value={t(`fl.pole.${pole}`)} />}
              <Row label={t("fl.sides.label")} value={t(`fl.sides.${sidesId}`)} />
              <Row label={t("fl.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
            </dl>

            <hr className="border-gray-100" />

            {quoteLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : quoteError ? (
              <p className="text-xs text-red-500">{quoteError}</p>
            ) : quoteData ? (
              <dl className="space-y-2 text-sm">
                <Row label={t("fl.basePrice")} value={formatCad(subtotalCents)} />
                {poleSurcharge > 0 && (
                  <Row label={t(`fl.pole.${pole}`)} value={`+ ${formatCad(poleSurcharge)}`} />
                )}
                <Row label={t("fl.subtotal")} value={formatCad(adjustedSubtotal)} />
                {rushSurchargeCents > 0 && (
                  <Row label={t("configurator.rushProduction") || "24-Hour Rush"} value={`+ ${formatCad(rushSurchargeCents)}`} />
                )}
                {designHelpCents > 0 && (
                  <Row label={t("configurator.designHelp") || "Design Help"} value={`+ ${formatCad(designHelpCents)}`} />
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("fl.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(displayTotal)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("fl.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("fl.selectOptions")}</p>
            )}

            {disabledReason && (
              <p className="text-center text-xs text-amber-600">{disabledReason}</p>
            )}

            {/* Delivery estimate */}
            {quoteData && !quoteLoading && (
              <DeliveryEstimate categorySlug="banners-displays" rushProduction={rushProduction} t={t} locale={locale} />
            )}

            {quoteData && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
                <input type="checkbox" checked={rushProduction} onChange={(e) => setRushProduction(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                <div>
                  <span className="text-sm font-semibold text-gray-800">{t("configurator.rushProduction") || "24-Hour Rush Production"}</span>
                  {rushProduction && <span className="ml-2 text-xs text-red-600 font-medium">+30%</span>}
                </div>
              </label>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleAddToCart({ artworkIntent, rushProduction })}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart
                    ? "bg-gray-900 text-[#fff] hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("fl.addToCart")}
              </button>
              <button
                type="button"
                onClick={() => handleBuyNow({ artworkIntent, rushProduction })}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading
                    ? "border-gray-900 bg-gray-900 text-[#fff] hover:bg-gray-800"
                    : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("fl.processing") : t("fl.buyNow")}
              </button>
            </div>

            <InlineTrustSignals t={t} />
          </div>
        </aside>
      </div>

      {(() => {
        const faqItems = getConfiguratorFaqs("flags");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl pb-16 pt-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

      {/* ── MOBILE: Bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-bold text-gray-900">{formatCad(displayTotal)}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {activeQty.toLocaleString()} × {t(`fl.style.${style}`)} {size?.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{disabledReason || t("fl.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleAddToCart({ artworkIntent, rushProduction })}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-gray-900 text-[#fff] hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("fl.addToCart")}
          </button>
        </div>
      </div>

      <div className="h-20 lg:hidden" />
    </main>
  );
}

// ─── Helpers ───

function Section({ label, optional, children }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</h2>
        {optional && <span className="text-[10px] text-gray-400">(optional)</span>}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-gray-900 bg-gray-900 text-[#fff]"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}
