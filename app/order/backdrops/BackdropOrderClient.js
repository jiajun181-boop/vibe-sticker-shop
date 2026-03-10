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
import { formatCad } from "@/lib/product-helpers";

const DEBOUNCE_MS = 300;

// ─── Backdrop Configuration ───

const TYPES = [
  { id: "step-repeat" },
  { id: "popup" },
  { id: "tension-fabric" },
];

const SIZES_BY_TYPE = {
  "step-repeat": [
    { id: "6x4", label: "6' × 4'", w: 72, h: 48 },
    { id: "8x6", label: "8' × 6'", w: 96, h: 72 },
    { id: "8x8", label: "8' × 8'", w: 96, h: 96 },
    { id: "10x8", label: "10' × 8'", w: 120, h: 96 },
  ],
  popup: [
    { id: "6x3", label: "6' × 3'", w: 72, h: 36 },
    { id: "8x8", label: "8' × 8'", w: 96, h: 96 },
    { id: "10x8", label: "10' × 8'", w: 120, h: 96 },
  ],
  "tension-fabric": [
    { id: "3x7", label: "3' × 7'", w: 36, h: 84 },
    { id: "8x8", label: "8' × 8'", w: 96, h: 96 },
    { id: "10x8", label: "10' × 8'", w: 120, h: 96 },
  ],
};

const FRAMES = [
  { id: "included", surcharge: 0 },
  { id: "premium", surcharge: 5000 },
];

const CASES = [
  { id: "basic", surcharge: 0 },
  { id: "wheeled", surcharge: 2000 },
];

const QUANTITIES = [1, 2, 5];

// ─── Main Component ───

export default function BackdropOrderClient({ productImages = [] }) {
  const { t, locale } = useTranslation();

  const [typeId, setTypeId] = useState("step-repeat");
  const [sizeId, setSizeId] = useState("8x6");
  const [frame, setFrame] = useState("included");
  const [carryCase, setCarryCase] = useState("basic");
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

  const availableSizes = useMemo(() => SIZES_BY_TYPE[typeId] || [], [typeId]);
  const size = useMemo(() => availableSizes.find((s) => s.id === sizeId) || availableSizes[0], [availableSizes, sizeId]);

  // Reset size when type changes
  useEffect(() => {
    const defaults = { "step-repeat": "8x6", popup: "8x8", "tension-fabric": "8x8" };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived reset on type change
    setSizeId(defaults[typeId] || SIZES_BY_TYPE[typeId]?.[0]?.id || "8x8");
  }, [typeId]);

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
        slug: "backdrops",
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
  const frameSurcharge = (FRAMES.find((f) => f.id === frame)?.surcharge ?? 0) * activeQty;
  const caseSurcharge = (CASES.find((c) => c.id === carryCase)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + frameSurcharge + caseSurcharge;
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
      id: `backdrops-${typeId}-${size.id}`,
      name: `${t("bk.title")} — ${t(`bk.type.${typeId}`)} ${size.label}`,
      slug: "backdrops",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        type: typeId,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        frame,
        carryCase,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
      },
      forceNewLine: true,
    };
  }, [quoteData, activeQty, adjustedSubtotal, size, typeId, frame, carryCase, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("bk.addedToCart"),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("bk.breadcrumb"), href: "/shop/banners-displays" },
          { label: t("bk.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("bk.title")}
      </h1>

      {productImages.length > 0 && (
        <div className="mb-8">
          <ImageGallery images={productImages} productName={t("bk.title")} />
        </div>
      )}

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Type */}
          <Section label={t("bk.type.label")}>
            <div className="grid grid-cols-3 gap-3">
              {TYPES.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setTypeId(tp.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    typeId === tp.id
                      ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(`bk.type.${tp.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${typeId === tp.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`bk.typeDesc.${tp.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("bk.size")}>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <Chip key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Frame */}
          <Section label={t("bk.frame.label")}>
            <div className="flex flex-wrap gap-2">
              {FRAMES.map((f) => (
                <Chip key={f.id} active={frame === f.id} onClick={() => setFrame(f.id)}>
                  {t(`bk.frame.${f.id}`)}
                  {f.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(f.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Carrying Case */}
          <Section label={t("bk.case.label")}>
            <div className="flex flex-wrap gap-2">
              {CASES.map((c) => (
                <Chip key={c.id} active={carryCase === c.id} onClick={() => setCarryCase(c.id)}>
                  {t(`bk.case.${c.id}`)}
                  {c.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("bk.quantity")}>
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
              <label className="text-xs text-gray-500">{t("bk.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 3"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("bk.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("bk.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("bk.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("bk.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("bk.type.label")} value={t(`bk.type.${typeId}`)} />
              <Row label={t("bk.size")} value={size?.label || "\u2014"} />
              <Row label={t("bk.frame.label")} value={t(`bk.frame.${frame}`)} />
              <Row label={t("bk.case.label")} value={t(`bk.case.${carryCase}`)} />
              <Row label={t("bk.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("bk.basePrice")} value={formatCad(subtotalCents)} />
                {frameSurcharge > 0 && (
                  <Row label={t(`bk.frame.${frame}`)} value={`+ ${formatCad(frameSurcharge)}`} />
                )}
                {caseSurcharge > 0 && (
                  <Row label={t(`bk.case.${carryCase}`)} value={`+ ${formatCad(caseSurcharge)}`} />
                )}
                <Row label={t("bk.subtotal")} value={formatCad(adjustedSubtotal)} />
                {rushSurchargeCents > 0 && (
                  <Row label={t("configurator.rushProduction") || "24-Hour Rush"} value={`+ ${formatCad(rushSurchargeCents)}`} />
                )}
                {designHelpCents > 0 && (
                  <Row label={t("configurator.designHelp") || "Design Help"} value={`+ ${formatCad(designHelpCents)}`} />
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("bk.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(displayTotal)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("bk.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("bk.selectOptions")}</p>
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
                {t("bk.addToCart")}
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
                {buyNowLoading ? t("bk.processing") : t("bk.buyNow")}
              </button>
            </div>

            <InlineTrustSignals t={t} />
          </div>
        </aside>
      </div>

      {(() => {
        const faqItems = getConfiguratorFaqs("backdrops");
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
                  {activeQty.toLocaleString()} × {t(`bk.type.${typeId}`)} {size?.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{disabledReason || t("bk.selectOptions")}</p>
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
            {t("bk.addToCart")}
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
