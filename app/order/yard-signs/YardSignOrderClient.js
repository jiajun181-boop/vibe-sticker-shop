"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showErrorToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ACCESSORY_OPTIONS } from "@/lib/sign-order-config";
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

// ─── Yard Sign Configuration ───

const SIZES = [
  { id: "12x18", label: '12" × 18"', tag: "12×18", w: 12, h: 18 },
  { id: "18x24", label: '18" × 24"', tag: "18×24", w: 18, h: 24 },
  { id: "24x36", label: '24" × 36"', tag: "24×36", w: 24, h: 36 },
  { id: "36x48", label: '36" × 48"', tag: "36×48", w: 36, h: 48 },
];

const MATERIALS = [
  { id: "4mm-coroplast", surcharge: 0 },
  { id: "6mm-coroplast", surcharge: 50 },
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const HARDWARE = [
  { id: "none", surcharge: 0 },
  { id: "h-stake", surcharge: ACCESSORY_OPTIONS["h-stake"].surcharge },
  { id: "wire-stake", surcharge: ACCESSORY_OPTIONS["wire-stake"].surcharge },
];

const QUANTITIES = [1, 5, 10, 25, 50, 100];

// ─── Icons ───

function MaterialIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "4mm-coroplast":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h10" opacity="0.4" />
        </svg>
      );
    case "6mm-coroplast":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h10" />
          <path d="M3 4h18v3H3z" opacity="0.15" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function YardSignOrderClient({ productImages = [] }) {
  const { t, locale } = useTranslation();

  const [sizeIdx, setSizeIdx] = useState(1); // 18×24 default
  const [materialId, setMaterialId] = useState("4mm-coroplast");
  const [sidesId, setSidesId] = useState("single");
  const [hardwareId, setHardwareId] = useState("none");
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
        slug: "yard-signs",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
        material: materialId,
        options: { doubleSided: sidesId === "double" },
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
  }, [size.w, size.h, activeQty, sidesId, materialId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const hardwareSurcharge = (HARDWARE.find((h) => h.id === hardwareId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + materialSurcharge + hardwareSurcharge;
  const rushMultiplier = rushProduction ? RUSH_MULTIPLIER : 1;
  const rushSurchargeCents = rushProduction ? Math.round(adjustedSubtotal * (RUSH_MULTIPLIER - 1)) : 0;
  const designHelpCents = artworkIntent === "design-help" ? DESIGN_HELP_CENTS : 0;
  const displayTotal = Math.round(adjustedSubtotal * rushMultiplier) + designHelpCents;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  const disabledReason = !canAddToCart
    ? quoteLoading ? "Calculating price..."
    : !quoteData ? "Select your options for pricing"
    : "Complete all options to continue"
    : null;

  // ─── Cart ───

  const buildCartItem = useCallback(() => {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t("ys.title"),
      size.tag,
      t(`ys.sides.${sidesId}`),
    ];

    return {
      id: "yard-signs",
      name: nameParts.join(" — "),
      slug: "yard-signs",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material: materialId,
        sides: sidesId,
        hardware: hardwareId,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
        rushProduction: rushProduction,
        artworkIntent: artworkIntent || null,
        designHelp: artworkIntent === "design-help",
      },
      forceNewLine: true,
    };
  }, [quoteData, activeQty, adjustedSubtotal, size, sidesId, materialId, hardwareId, uploadedFile, rushProduction, artworkIntent, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("ys.addedToCart"),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("ys.breadcrumb"), href: "/shop/signs-rigid-boards" },
          { label: t("ys.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("ys.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">
          {/* Product Images */}
          {productImages.length > 0 && (
            <div className="mb-2">
              <ImageGallery images={productImages} productName={t("ys.title")} />
            </div>
          )}

          {/* Size */}
          <Section label={t("ys.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label} ({s.tag})
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("ys.material.label")}>
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
                  <span className="text-sm font-semibold">{t(`ys.material.${m.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${materialId === m.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`ys.materialDesc.${m.id}`)}
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

          {/* Sides */}
          <Section label={t("ys.sides.label")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sidesId === s.id} onClick={() => setSidesId(s.id)}>
                  {t(`ys.sides.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Hardware */}
          <Section label={t("ys.hardware.label")}>
            <div className="flex flex-wrap gap-2">
              {HARDWARE.map((h) => (
                <Chip key={h.id} active={hardwareId === h.id} onClick={() => setHardwareId(h.id)}>
                  {t(`ys.hardware.${h.id}`)}
                  {h.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(h.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("ys.quantity")}>
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
              <label className="text-xs text-gray-500">{t("ys.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 75"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("ys.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("ys.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("ys.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("ys.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("ys.size")} value={`${size.label} (${size.tag})`} />
              <Row label={t("ys.material.label")} value={t(`ys.material.${materialId}`)} />
              <Row label={t("ys.sides.label")} value={t(`ys.sides.${sidesId}`)} />
              {hardwareId !== "none" && (
                <Row label={t("ys.hardware.label")} value={t(`ys.hardware.${hardwareId}`)} />
              )}
              <Row label={t("ys.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("ys.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`ys.material.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {hardwareSurcharge > 0 && (
                  <Row label={t(`ys.hardware.${hardwareId}`)} value={`+ ${formatCad(hardwareSurcharge)}`} />
                )}
                <Row label={t("ys.subtotal")} value={formatCad(adjustedSubtotal)} />
                {rushSurchargeCents > 0 && (
                  <Row label={t("configurator.rushProduction") || "24-Hour Rush"} value={`+ ${formatCad(rushSurchargeCents)}`} />
                )}
                {designHelpCents > 0 && (
                  <Row label={t("configurator.designHelpFee") || "Design Help"} value={`+ ${formatCad(designHelpCents)}`} />
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("ys.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(displayTotal)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("ys.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("ys.selectOptions")}</p>
            )}

            {disabledReason && (
              <p className="text-center text-xs text-amber-600">{disabledReason}</p>
            )}

            {/* Delivery estimate */}
            {quoteData && !quoteLoading && (
              <DeliveryEstimate categorySlug="signs-rigid-boards" rushProduction={rushProduction} t={t} locale={locale} />
            )}

            {/* Rush toggle */}
            {quoteData && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
                <input
                  type="checkbox"
                  checked={rushProduction}
                  onChange={(e) => setRushProduction(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
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
                {t("ys.addToCart")}
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
                {buyNowLoading ? t("ys.processing") : t("ys.buyNow")}
              </button>
            </div>

            <InlineTrustSignals t={t} />
          </div>
        </aside>
      </div>

      {(() => {
        const faqItems = getConfiguratorFaqs("yard-signs");
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
                  {activeQty.toLocaleString()} × {size.tag} {t(`ys.sides.${sidesId}`)}
                  {rushProduction && <span className="ml-1 text-red-600 font-semibold">Rush</span>}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{disabledReason || t("ys.selectOptions")}</p>
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
            {t("ys.addToCart")}
          </button>
        </div>
      </div>

      {/* ── Product Content ── */}
      <div className="mt-16 space-y-12">
        <section>
          <h2 className="text-xl font-bold text-gray-900">About Custom Yard Signs</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            Our custom yard signs are printed on durable corrugated plastic (Coroplast) using
            UV-resistant inks for vibrant, weather-resistant signage. Perfect for real estate,
            elections, events, and business promotions. Each sign is precision-cut and ready for
            outdoor use with H-wire stakes or step stakes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">Specifications</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Material", "Corrugated plastic (Coroplast) — 4mm, 6mm, or 10mm"],
                  ["Printing", "Full colour CMYK, UV-resistant latex inks"],
                  ["Durability", "1–3 years outdoor depending on thickness"],
                  ["Sizes", '12×18", 18×24", 24×36", 36×48" — custom sizes available'],
                  ["Finish", "Matte, weather-resistant surface"],
                  ["Turnaround", "Same day production available (order before 12 PM)"],
                  ["Hardware", "H-wire stakes and step stakes sold separately"],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="whitespace-nowrap bg-gray-50 px-4 py-2.5 font-medium text-gray-700">{label}</td>
                    <td className="px-4 py-2.5 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">FAQ</h2>
          <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200">
            {[
              { q: "How long do yard signs last outdoors?", a: "4mm Coroplast signs typically last 1–2 years outdoors. For longer-lasting signs, choose 6mm or 10mm thickness. All our signs use UV-resistant inks that resist fading." },
              { q: "What size yard sign should I choose?", a: "18×24\" is the most popular size for real estate and election signs. 12×18\" works well for directional arrows and smaller yard signs. 24×36\" and larger are ideal for high-visibility locations." },
              { q: "How do I install yard signs?", a: "Simply slide the sign onto H-wire stakes (sold separately) and push the stakes into the ground. No tools required. For harder ground, use step stakes which have a flat base you can step on." },
              { q: "Can I print on both sides?", a: "Yes! Double-sided printing is available for all yard sign sizes. Both sides are printed in full colour with UV-resistant inks." },
              { q: "Do you offer same-day production?", a: "Yes, orders placed before 12 PM can be produced same day. Rush orders are available for pickup at our Scarborough location or next-day GTA delivery." },
              { q: "What file format should my artwork be?", a: "We accept PDF, AI, PSD, PNG, and JPG files. For best results, provide a high-resolution PDF with 0.125\" bleed on all sides. We offer a free digital proof before production." },
            ].map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
                  {faq.q}
                  <svg className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="px-4 pb-3 text-sm leading-relaxed text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
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
