"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import { showErrorToast } from "@/components/Toast";
import Breadcrumbs from "@/components/Breadcrumbs";
import WhiteInkStep, { needsWhiteInk } from "@/components/configurator/WhiteInkStep";
import { useConfiguratorCart } from "@/components/configurator";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Sticker Roll Configuration ───

const SHAPES = [
  { id: "circle", tag: "Circle" },
  { id: "square", tag: "Square" },
  { id: "rectangle", tag: "Rectangle" },
  { id: "oval", tag: "Oval" },
];

const SIZES_BY_SHAPE = {
  circle: [
    { id: "1in", label: '1" × 1"', w: 1, h: 1 },
    { id: "1.5in", label: '1.5" × 1.5"', w: 1.5, h: 1.5 },
    { id: "2in", label: '2" × 2"', w: 2, h: 2 },
    { id: "2.5in", label: '2.5" × 2.5"', w: 2.5, h: 2.5 },
    { id: "3in", label: '3" × 3"', w: 3, h: 3 },
    { id: "4in", label: '4" × 4"', w: 4, h: 4 },
  ],
  square: [
    { id: "1in", label: '1" × 1"', w: 1, h: 1 },
    { id: "1.5in", label: '1.5" × 1.5"', w: 1.5, h: 1.5 },
    { id: "2in", label: '2" × 2"', w: 2, h: 2 },
    { id: "2.5in", label: '2.5" × 2.5"', w: 2.5, h: 2.5 },
    { id: "3in", label: '3" × 3"', w: 3, h: 3 },
    { id: "4in", label: '4" × 4"', w: 4, h: 4 },
  ],
  rectangle: [
    { id: "1x2", label: '1" × 2"', w: 1, h: 2 },
    { id: "1.5x3", label: '1.5" × 3"', w: 1.5, h: 3 },
    { id: "2x3", label: '2" × 3"', w: 2, h: 3 },
    { id: "2x4", label: '2" × 4"', w: 2, h: 4 },
    { id: "3x4", label: '3" × 4"', w: 3, h: 4 },
  ],
  oval: [
    { id: "1.5x2", label: '1.5" × 2"', w: 1.5, h: 2 },
    { id: "2x3", label: '2" × 3"', w: 2, h: 3 },
    { id: "2.5x3.5", label: '2.5" × 3.5"', w: 2.5, h: 3.5 },
  ],
};

const DEFAULT_SIZE_IDX = {
  circle: 2,    // 2"×2"
  square: 2,    // 2"×2"
  rectangle: 2, // 2"×3"
  oval: 1,      // 2"×3"
};

const MATERIALS = [
  { id: "white-bopp", surcharge: 0 },    // standard polypropylene
  { id: "clear-bopp", surcharge: 3 },     // +$0.03/label
  { id: "kraft", surcharge: 4 },          // +$0.04/label
  { id: "silver-foil", surcharge: 10 },   // +$0.10/label
];

const FINISHES = [
  { id: "gloss", surcharge: 0 },
  { id: "matte", surcharge: 0 },
];

const QUANTITIES = [250, 500, 1000, 2500, 5000];

const WIND_DIRECTIONS = [
  { id: "any", label: "Does Not Matter" },
  { id: "top", label: "Top" },
  { id: "right", label: "Right" },
  { id: "bottom", label: "Bottom" },
  { id: "left", label: "Left" },
];

// ─── Main Component ───

export default function StickerRollOrderClient() {
  const { t } = useTranslation();

  const [shapeId, setShapeId] = useState("circle");
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE_IDX["circle"]);
  const [materialId, setMaterialId] = useState("white-bopp");
  const [finishId, setFinishId] = useState("gloss");
  const [windId, setWindId] = useState("any");
  const [quantity, setQuantity] = useState(1000);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artworkIntent, setArtworkIntent] = useState(null);
  const [whiteInk, setWhiteInk] = useState({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null });

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const sizes = useMemo(() => SIZES_BY_SHAPE[shapeId] || SIZES_BY_SHAPE["circle"], [shapeId]);
  const size = sizes[sizeIdx] || sizes[0];

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Reset size when shape changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizeIdx(DEFAULT_SIZE_IDX[shapeId] ?? 0);
  }, [shapeId]);

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
        slug: "sticker-rolls",
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
  }, [size.w, size.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const finishSurcharge = (FINISHES.find((f) => f.id === finishId)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + materialSurcharge + finishSurcharge;
  const totalCents = adjustedSubtotal;

  // White ink enabled on transparent material → URL must be ready before checkout
  const whiteInkReady = !needsWhiteInk(materialId) || !whiteInk.enabled || whiteInk.whiteInkUrl != null;
  const canAddToCart = quoteData && !quoteLoading && activeQty > 0 && whiteInkReady;
  const disabledReason = !canAddToCart
    ? quoteLoading ? "Calculating price..."
    : !quoteData ? "Select your options for pricing"
    : !whiteInkReady ? "White ink layer is being generated..."
    : "Complete all options to continue"
    : null;

  // ─── Cart ───

  const buildCartItem = useCallback(() => {
    if (!quoteData || activeQty <= 0) return null;

    const shape = SHAPES.find((s) => s.id === shapeId);
    const nameParts = [
      t("sr.title"),
      shape?.tag || shapeId,
      size.label,
    ];

    return {
      id: "sticker-rolls",
      name: nameParts.join(" — "),
      slug: "sticker-rolls",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        shape: shapeId,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material: materialId,
        materialLabel: t(`sr.material.${materialId}`),
        finish: finishId,
        finishLabel: t(`sr.finish.${finishId}`),
        wind: windId,
        coreSize: "3-inch",
        stickersPerRoll: activeQty,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
        whiteInkEnabled: needsWhiteInk(materialId) && whiteInk.enabled,
        whiteInkMode: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.mode || "auto") : null,
        whiteInkUrl: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.whiteInkUrl || null) : null,
        whiteInkKey: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.whiteInkKey || null) : null,
        whiteInkWidth: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.whiteInkWidth || null) : null,
        whiteInkHeight: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.whiteInkHeight || null) : null,
      },
      forceNewLine: true,
    };
  }, [quoteData, activeQty, shapeId, materialId, finishId, windId, size, adjustedSubtotal, uploadedFile, whiteInk, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("sr.addedToCart"),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("sr.breadcrumb"), href: "/shop/stickers-labels-decals" },
          { label: t("sr.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("sr.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Shape */}
          <Section label={t("sr.shape.label")}>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((s) => (
                <Chip key={s.id} active={shapeId === s.id} onClick={() => setShapeId(s.id)}>
                  {t(`sr.shape.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("sr.size")}>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("sr.material.label")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MATERIALS.map((mat) => {
                const surchargeLabel = mat.surcharge > 0 ? `+${formatCad(mat.surcharge)}/ea` : null;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => { setMaterialId(mat.id); setWhiteInk({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null }); }}
                    className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      materialId === mat.id
                        ? "border-gray-900 bg-gray-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-800">
                      {t(`sr.material.${mat.id}`)}
                    </span>
                    {surchargeLabel && (
                      <span className="mt-0.5 block text-[11px] font-medium text-amber-600">
                        {surchargeLabel}
                      </span>
                    )}
                    {materialId === mat.id && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-900" />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Transparent material explanation */}
            {needsWhiteInk(materialId) && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">This material is transparent</p>
                <p className="mt-1 text-xs text-blue-700">
                  Without a white ink layer, colors will appear translucent on the sticker.
                  After uploading your artwork, you can choose how to add a white base:
                  <strong> Automatic</strong> (full white under your design),
                  <strong> Match Design</strong> (white follows your artwork edges), or
                  <strong> Upload Your Own</strong> white layer.
                </p>
              </div>
            )}
          </Section>

          {/* Finish */}
          <Section label={t("sr.finish.label")}>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map((f) => (
                <Chip key={f.id} active={finishId === f.id} onClick={() => setFinishId(f.id)}>
                  {t(`sr.finish.${f.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Unwind Direction */}
          <Section label={t("sr.wind") || "Unwind Direction"}>
            <p className="mb-3 text-[11px] text-gray-400">
              {t("sr.windHint") || "Select how stickers unwind from the roll. This affects how labels feed into your applicator."}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {WIND_DIRECTIONS.map((wd) => (
                <button
                  key={wd.id}
                  type="button"
                  onClick={() => setWindId(wd.id)}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                    windId === wd.id
                      ? "border-gray-900 bg-gray-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
                    {/* Roll body */}
                    <circle cx="24" cy="24" r="10" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-300"} strokeWidth="1.5" />
                    <circle cx="24" cy="24" r="4" className={windId === wd.id ? "fill-gray-100 stroke-gray-900" : "fill-gray-50 stroke-gray-300"} strokeWidth="1" />
                    {/* Label square */}
                    <rect x="17" y="17" width="14" height="14" rx="1"
                      className={windId === wd.id ? "fill-gray-100 stroke-gray-900" : "fill-gray-50 stroke-gray-400"}
                      strokeWidth="1.5"
                    />
                    {/* Direction arrow */}
                    {wd.id === "top" && (
                      <path d="M24 14 L24 4 M24 4 L20 8 M24 4 L28 8" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-400"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {wd.id === "bottom" && (
                      <path d="M24 34 L24 44 M24 44 L20 40 M24 44 L28 40" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-400"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {wd.id === "right" && (
                      <path d="M34 24 L44 24 M44 24 L40 20 M44 24 L40 28" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-400"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {wd.id === "left" && (
                      <path d="M14 24 L4 24 M4 24 L8 20 M4 24 L8 28" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-400"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {wd.id === "any" && (
                      <>
                        <path d="M24 14 L24 8 M24 8 L22 10 M24 8 L26 10" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-400"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M24 34 L24 40 M24 40 L22 38 M24 40 L26 38" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-400"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M34 24 L40 24 M40 24 L38 22 M40 24 L38 26" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-400"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 24 L8 24 M8 24 L10 22 M8 24 L10 26" className={windId === wd.id ? "stroke-gray-900" : "stroke-gray-400"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    )}
                  </svg>
                  <span className={`text-[11px] font-semibold leading-tight text-center ${windId === wd.id ? "text-gray-900" : "text-gray-500"}`}>
                    {t(`sr.wind.${wd.id}`) || wd.label}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("sr.quantity")}>
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
              <label className="text-xs text-gray-500">{t("sr.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 3000"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("sr.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("sr.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setUploadedFile(null); setWhiteInk({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null }); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("sr.remove")}
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

          {/* White Ink — shown when artwork uploaded on transparent material */}
          {uploadedFile && (
            <WhiteInkStep
              key={materialId}
              materialId={materialId}
              artworkUrl={uploadedFile?.url}
              onChange={setWhiteInk}
            />
          )}
        </div>

        {/* ── RIGHT: Summary ── */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("sr.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("sr.shape.label")} value={t(`sr.shape.${shapeId}`)} />
              <Row label={t("sr.size")} value={size.label} />
              <Row label={t("sr.material.label")} value={t(`sr.material.${materialId}`)} />
              <Row label={t("sr.finish.label")} value={t(`sr.finish.${finishId}`)} />
              <Row label={t("sr.wind") || "Unwind"} value={t(`sr.wind.${windId}`) || WIND_DIRECTIONS.find((w) => w.id === windId)?.label || windId} />
              {needsWhiteInk(materialId) && whiteInk.enabled && (
                <Row label="White Ink" value={whiteInk.mode === "auto" ? "Automatic" : whiteInk.mode === "follow" ? "Match Design" : "Custom Upload"} />
              )}
              <Row label={t("sr.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("sr.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`sr.material.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                <Row label={t("sr.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("sr.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("sr.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("sr.selectOptions")}</p>
            )}

            {disabledReason && (
              <p className="text-center text-xs text-amber-600">{disabledReason}</p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleAddToCart({ artworkIntent })}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart
                    ? "bg-gray-900 text-[#fff] hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("sr.addToCart")}
              </button>
              <button
                type="button"
                onClick={() => handleBuyNow({ artworkIntent })}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading
                    ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("sr.processing") : t("sr.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("sr.badge.waterproof")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("sr.badge.shipping")}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MOBILE: Bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {activeQty.toLocaleString()} × {t(`sr.shape.${shapeId}`)} {size.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{disabledReason || t("sr.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleAddToCart({ artworkIntent })}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-gray-900 text-[#fff] hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("sr.addToCart")}
          </button>
        </div>
      </div>

      <div className="h-20 lg:hidden" />

      {/* ── FAQ ── */}
      {(() => {
        const faqItems = getConfiguratorFaqs("sticker-rolls");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl pb-16 pt-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}
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
