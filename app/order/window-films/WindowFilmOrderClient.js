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

// ─── Window Film Configuration ───

const TYPES = [
  { id: "static-cling", icon: "cling" },
  { id: "adhesive-film", icon: "adhesive" },
  { id: "one-way-vision", icon: "oneway" },
  { id: "privacy-frost", icon: "frost" },
];

const SIZES = [
  { id: "12x18", label: '12" \u00d7 18"', w: 12, h: 18 },
  { id: "18x24", label: '18" \u00d7 24"', w: 18, h: 24 },
  { id: "24x36", label: '24" \u00d7 36"', w: 24, h: 36 },
  { id: "36x48", label: '36" \u00d7 48"', w: 36, h: 48 },
  { id: "48x72", label: "4' \u00d7 6'", tag: "Large", w: 48, h: 72 },
];

const FINISHES = [
  { id: "gloss", surcharge: 0 },
  { id: "matte", surcharge: 0 },
  { id: "frosted", surcharge: 300 },
];

const ADHESIVES = [
  { id: "permanent", surcharge: 0 },
  { id: "removable", surcharge: 300 },
];

const QUANTITIES = [1, 5, 10, 25, 50];

const TYPE_SLUG_MAP = {
  "static-cling": "static-cling",
  "adhesive-film": "opaque-window-graphics",
  "one-way-vision": "one-way-vision",
  "privacy-frost": "frosted-window-film",
};

// ─── Icons ───

function TypeIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "cling":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path strokeLinecap="round" d="M8 8h8M8 12h8" opacity="0.4" />
          <path strokeLinecap="round" d="M12 17v2" strokeDasharray="2 2" />
        </svg>
      );
    case "adhesive":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M4 17h16v4H4z" opacity="0.15" fill="currentColor" />
          <path strokeLinecap="round" d="M8 8h8M8 12h8" />
        </svg>
      );
    case "oneway":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="9" cy="10" r="1.5" opacity="0.4" />
          <circle cx="15" cy="10" r="1.5" opacity="0.4" />
          <circle cx="12" cy="15" r="1.5" opacity="0.4" />
          <path strokeLinecap="round" d="M8 8h8" />
        </svg>
      );
    case "frost":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M4 3h16v18H4z" opacity="0.08" fill="currentColor" />
          <path strokeLinecap="round" strokeDasharray="3 3" d="M8 9h8M8 13h8M8 17h8" opacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function WindowFilmOrderClient({ productImages = [] }) {
  const { t, locale } = useTranslation();

  const [typeId, setTypeId] = useState("static-cling");
  const [sizeIdx, setSizeIdx] = useState(2); // 24×36 default
  const [finishId, setFinishId] = useState("gloss");
  const [adhesiveId, setAdhesiveId] = useState("permanent");
  const [quantity, setQuantity] = useState(10);
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

  // Finish only applies to static-cling and adhesive-film
  const showFinish = typeId === "static-cling" || typeId === "adhesive-film";
  // Adhesive only applies to adhesive-film
  const showAdhesive = typeId === "adhesive-film";

  // Reset finish/adhesive when type changes and they are not applicable
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!showFinish) setFinishId("gloss");
    if (!showAdhesive) setAdhesiveId("permanent");
  }, [typeId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        slug: TYPE_SLUG_MAP[typeId] || "frosted-window-film",
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
  }, [typeId, size.w, size.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const finishSurcharge = showFinish ? (FINISHES.find((f) => f.id === finishId)?.surcharge ?? 0) * activeQty : 0;
  const adhesiveSurcharge = showAdhesive ? (ADHESIVES.find((a) => a.id === adhesiveId)?.surcharge ?? 0) * activeQty : 0;
  const adjustedSubtotal = subtotalCents + finishSurcharge + adhesiveSurcharge;
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
      t(`wf.type.${typeId}`),
      size.label,
    ];

    return {
      id: "window-films",
      name: nameParts.join(" — "),
      slug: "window-films",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        filmType: typeId,
        type: typeId,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        finish: showFinish ? finishId : null,
        adhesive: showAdhesive ? adhesiveId : null,
        orientation: "inside-facing",
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
      },
      forceNewLine: true,
    };
  }, [quoteData, activeQty, adjustedSubtotal, typeId, size, showFinish, finishId, showAdhesive, adhesiveId, uploadedFile, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("wf.addedToCart"),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("wf.breadcrumb"), href: "/shop/windows-walls-floors" },
          { label: t("wf.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("wf.title")}
      </h1>

      {productImages?.length > 0 && (
        <ImageGallery images={productImages} />
      )}

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Type */}
          <Section label={t("wf.type.label")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                  <TypeIcon type={tp.icon} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`wf.type.${tp.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${typeId === tp.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`wf.typeDesc.${tp.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("wf.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                  {s.tag && <span className="ml-1 text-[11px] opacity-70">{s.tag}</span>}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Finish (only for static-cling and adhesive-film) */}
          {showFinish && (
            <Section label={t("wf.finish.label")}>
              <div className="flex flex-wrap gap-2">
                {FINISHES.map((f) => (
                  <Chip key={f.id} active={finishId === f.id} onClick={() => setFinishId(f.id)}>
                    {t(`wf.finish.${f.id}`)}
                    {f.surcharge > 0 && (
                      <span className="ml-1 text-[11px] opacity-70">+{formatCad(f.surcharge)}/ea</span>
                    )}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {/* Adhesive (only for adhesive-film) */}
          {showAdhesive && (
            <Section label={t("wf.adhesive.label")}>
              <div className="flex flex-wrap gap-2">
                {ADHESIVES.map((a) => (
                  <Chip key={a.id} active={adhesiveId === a.id} onClick={() => setAdhesiveId(a.id)}>
                    {t(`wf.adhesive.${a.id}`)}
                    {a.surcharge > 0 && (
                      <span className="ml-1 text-[11px] opacity-70">+{formatCad(a.surcharge)}/ea</span>
                    )}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {/* Quantity */}
          <Section label={t("wf.quantity")}>
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
              <label className="text-xs text-gray-500">{t("wf.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 30"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("wf.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("wf.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("wf.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("wf.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("wf.type.label")} value={t(`wf.type.${typeId}`)} />
              <Row label={t("wf.size")} value={size.label} />
              {showFinish && (
                <Row label={t("wf.finish.label")} value={t(`wf.finish.${finishId}`)} />
              )}
              {showAdhesive && (
                <Row label={t("wf.adhesive.label")} value={t(`wf.adhesive.${adhesiveId}`)} />
              )}
              <Row label={t("wf.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("wf.basePrice")} value={formatCad(subtotalCents)} />
                {finishSurcharge > 0 && (
                  <Row label={t(`wf.finish.${finishId}`)} value={`+ ${formatCad(finishSurcharge)}`} />
                )}
                {adhesiveSurcharge > 0 && (
                  <Row label={t(`wf.adhesive.${adhesiveId}`)} value={`+ ${formatCad(adhesiveSurcharge)}`} />
                )}
                <Row label={t("wf.subtotal")} value={formatCad(adjustedSubtotal)} />
                {rushSurchargeCents > 0 && (
                  <Row label={t("configurator.rushProduction") || "24-Hour Rush"} value={`+ ${formatCad(rushSurchargeCents)}`} />
                )}
                {designHelpCents > 0 && (
                  <Row label={t("configurator.designHelp") || "Design Help"} value={`+ ${formatCad(designHelpCents)}`} />
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("wf.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(displayTotal)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("wf.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("wf.selectOptions")}</p>
            )}

            {/* Delivery estimate */}
            {quoteData && !quoteLoading && (
              <DeliveryEstimate categorySlug="windows-walls-floors" rushProduction={rushProduction} t={t} locale={locale} />
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
                {t("wf.addToCart")}
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
                {buyNowLoading ? t("wf.processing") : t("wf.buyNow")}
              </button>
            </div>

            <InlineTrustSignals t={t} />
          </div>
        </aside>
      </div>

      {(() => {
        const faqItems = getConfiguratorFaqs("window-films");
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
                  {activeQty.toLocaleString()} × {t(`wf.type.${typeId}`)} {size.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("wf.selectOptions")}</p>
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
            {t("wf.addToCart")}
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
