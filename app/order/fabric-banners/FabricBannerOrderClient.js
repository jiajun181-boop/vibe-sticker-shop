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

// ─── Fabric Banner Configuration ───

const SIZES = [
  { id: "2x4", label: "2' × 4'", tag: "2×4", w: 24, h: 48 },
  { id: "3x5", label: "3' × 5'", tag: "3×5", w: 36, h: 60 },
  { id: "4x6", label: "4' × 6'", tag: "4×6", w: 48, h: 72 },
  { id: "4x8", label: "4' × 8'", tag: "4×8", w: 48, h: 96 },
  { id: "5x10", label: "5' × 10'", tag: "5×10", w: 60, h: 120 },
];

const MATERIALS = [
  { id: "polyester", surcharge: 0 },
  { id: "satin", surcharge: 200 },
];

const FINISHINGS = [
  { id: "pole-pocket-top", surcharge: 0 },
  { id: "pole-pockets-tb", surcharge: 100 },
  { id: "grommets", surcharge: 100 },
  { id: "sewn-edges", surcharge: 50 },
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const QUANTITIES = [1, 2, 5, 10];

// ─── Icons ───

function MaterialIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "polyester":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path strokeLinecap="round" d="M7 9h10M7 13h10" opacity="0.35" />
        </svg>
      );
    case "satin":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 8c4-2 8 2 12 0s5-1 6-1" opacity="0.4" />
          <path d="M3 14c4-2 8 2 12 0s5-1 6-1" opacity="0.25" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function FabricBannerOrderClient({ productImages = [] }) {
  const { t, locale } = useTranslation();

  const [sizeIdx, setSizeIdx] = useState(1); // 3×5 default
  const [materialId, setMaterialId] = useState("polyester");
  const [finishingId, setFinishingId] = useState("pole-pocket-top");
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

  const size = SIZES[sizeIdx];

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
    if (activeQty <= 0) {
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
        slug: "fabric-banner",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
        material: materialId,
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
  }, [size.w, size.h, activeQty, materialId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const finishingSurcharge = (FINISHINGS.find((f) => f.id === finishingId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + materialSurcharge + finishingSurcharge;
  const totalCents = adjustedSubtotal;

  const rushMultiplier = rushProduction ? RUSH_MULTIPLIER : 1;
  const rushSurchargeCents = rushProduction ? Math.round(adjustedSubtotal * (RUSH_MULTIPLIER - 1)) : 0;
  const designHelpCents = artworkIntent === "design-help" ? DESIGN_HELP_CENTS : 0;
  const displayTotal = Math.round(adjustedSubtotal * rushMultiplier) + designHelpCents;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  const buildCartItem = useCallback(() => {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t("fabr.title"),
      size.tag,
      t(`fabr.sides.${sidesId}`),
    ];

    return {
      id: "fabric-banner",
      name: nameParts.join(" — "),
      slug: "fabric-banner",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material: materialId,
        materialLabel: t(`fabr.material.${materialId}`),
        finishing: finishingId,
        finishingLabel: t(`fabr.finishing.${finishingId}`),
        sides: sidesId,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
      },
      forceNewLine: true,
    };
  }, [quoteData, activeQty, adjustedSubtotal, size, materialId, finishingId, sidesId, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("fabr.addedToCart"),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("fabr.breadcrumb"), href: "/shop/banners-displays" },
          { label: t("fabr.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("fabr.title")}
      </h1>

      {productImages.length > 0 && (
        <div className="mb-8">
          <ImageGallery images={productImages} productName={t("fabr.title")} />
        </div>
      )}

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Size */}
          <Section label={t("fabr.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label} ({s.tag})
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("fabr.material.label")}>
            <div className="grid grid-cols-2 gap-3">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaterialId(m.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    materialId === m.id
                      ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <MaterialIcon type={m.id} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`fabr.material.${m.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${materialId === m.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`fabr.materialDesc.${m.id}`)}
                  </span>
                  {m.surcharge > 0 && (
                    <span className={`text-[11px] font-medium ${materialId === m.id ? "text-amber-300" : "text-amber-600"}`}>
                      +{formatCad(m.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Finishing */}
          <Section label={t("fabr.finishing.label")}>
            <div className="flex flex-wrap gap-2">
              {FINISHINGS.map((f) => (
                <Chip key={f.id} active={finishingId === f.id} onClick={() => setFinishingId(f.id)}>
                  {t(`fabr.finishing.${f.id}`)}
                  {f.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(f.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Sides */}
          <Section label={t("fabr.sides.label")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sidesId === s.id} onClick={() => setSidesId(s.id)}>
                  {t(`fabr.sides.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("fabr.quantity")}>
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
              <label className="text-xs text-gray-500">{t("fabr.customQty")}:</label>
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
          <Section label={t("fabr.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("fabr.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("fabr.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("fabr.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("fabr.size")} value={`${size.label} (${size.tag})`} />
              <Row label={t("fabr.material.label")} value={t(`fabr.material.${materialId}`)} />
              <Row label={t("fabr.finishing.label")} value={t(`fabr.finishing.${finishingId}`)} />
              <Row label={t("fabr.sides.label")} value={t(`fabr.sides.${sidesId}`)} />
              <Row label={t("fabr.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("fabr.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`fabr.material.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {finishingSurcharge > 0 && (
                  <Row label={t(`fabr.finishing.${finishingId}`)} value={`+ ${formatCad(finishingSurcharge)}`} />
                )}
                <Row label={t("fabr.subtotal")} value={formatCad(adjustedSubtotal)} />
                {rushSurchargeCents > 0 && (
                  <Row label={t("configurator.rushProduction") || "24-Hour Rush"} value={`+ ${formatCad(rushSurchargeCents)}`} />
                )}
                {designHelpCents > 0 && (
                  <Row label={t("configurator.designHelp") || "Design Help"} value={`+ ${formatCad(designHelpCents)}`} />
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("fabr.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(displayTotal)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("fabr.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("fabr.selectOptions")}</p>
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
                {t("fabr.addToCart")}
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
                {buyNowLoading ? t("fabr.processing") : t("fabr.buyNow")}
              </button>
            </div>

            <InlineTrustSignals t={t} />
          </div>
        </aside>
      </div>

      {/* FAQ */}
      {(() => {
        const faqItems = getConfiguratorFaqs("fabric-banners");
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
                  {activeQty.toLocaleString()} × {size.tag} {t(`fabr.sides.${sidesId}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("fabr.selectOptions")}</p>
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
            {t("fabr.addToCart")}
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
