"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showErrorToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import WhiteInkStep, { needsWhiteInk } from "@/components/configurator/WhiteInkStep";
import { useConfiguratorCart } from "@/components/configurator";
import { RUSH_MULTIPLIER, DESIGN_HELP_CENTS } from "@/lib/order-config";
import DeliveryEstimate from "@/components/configurator/DeliveryEstimate";
import InlineTrustSignals from "@/components/configurator/InlineTrustSignals";
import { formatCad } from "@/lib/product-helpers";

const DEBOUNCE_MS = 300;

// ─── Sticker Sheet Configuration ───

const SHAPES = [
  { id: "circle", tag: "Circle" },
  { id: "square", tag: "Square" },
  { id: "rectangle", tag: "Rectangle" },
  { id: "oval", tag: "Oval" },
  { id: "custom", tag: "Custom" },
];

const STICKER_SIZES_BY_SHAPE = {
  circle: [
    { id: "1in", label: '1" × 1"', w: 1, h: 1 },
    { id: "2in", label: '2" × 2"', w: 2, h: 2 },
    { id: "3in", label: '3" × 3"', w: 3, h: 3 },
    { id: "4in", label: '4" × 4"', w: 4, h: 4 },
  ],
  square: [
    { id: "1in", label: '1" × 1"', w: 1, h: 1 },
    { id: "2in", label: '2" × 2"', w: 2, h: 2 },
    { id: "3in", label: '3" × 3"', w: 3, h: 3 },
    { id: "4in", label: '4" × 4"', w: 4, h: 4 },
  ],
  rectangle: [
    { id: "2x3.5", label: '2" × 3.5"', w: 2, h: 3.5 },
    { id: "3x5", label: '3" × 5"', w: 3, h: 5 },
    { id: "4x6", label: '4" × 6"', w: 4, h: 6 },
  ],
  oval: [
    { id: "1.5x2", label: '1.5" × 2"', w: 1.5, h: 2 },
    { id: "2x3", label: '2" × 3"', w: 2, h: 3 },
    { id: "3x4", label: '3" × 4"', w: 3, h: 4 },
  ],
  custom: [],
};

const DEFAULT_STICKER_SIZE_IDX = {
  circle: 1,    // 2"×2"
  square: 1,    // 2"×2"
  rectangle: 0, // 2"×3.5"
  oval: 1,      // 2"×3"
  custom: -1,
};

function ShapeIcon({ shapeId, className = "h-4 w-4" }) {
  switch (shapeId) {
    case "circle":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg>;
    case "square":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="4" width="16" height="16" rx="1" /></svg>;
    case "rectangle":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="6" width="20" height="12" rx="1" /></svg>;
    case "oval":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><ellipse cx="12" cy="12" rx="10" ry="7" /></svg>;
    case "custom":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    default:
      return null;
  }
}

const SHEET_SIZES = [
  { id: "letter", label: '8.5" × 11"', tag: "Letter", w: 8.5, h: 11 },
  { id: "tabloid", label: '11" × 17"', tag: "Tabloid", w: 11, h: 17 },
];

const MATERIALS = [
  { id: "white-vinyl", surcharge: 0 },
  { id: "clear-vinyl", surcharge: 5 },   // +$0.05/sheet
  { id: "kraft", surcharge: 3 },          // +$0.03/sheet
];

const CUT_STYLES = [
  { id: "kiss-cut", surcharge: 0 },       // individual stickers peel off
  { id: "micro-perf", surcharge: 3 },     // perforated tear-apart
];

const FINISHES = [
  { id: "gloss", surcharge: 0 },
  { id: "matte", surcharge: 0 },
];

const QUANTITIES = [10, 25, 50, 100, 250];

// ─── Main Component ───

export default function StickerSheetOrderClient() {
  const { t, locale } = useTranslation();

  const [shapeId, setShapeId] = useState("circle");
  const [stickerSizeIdx, setStickerSizeIdx] = useState(DEFAULT_STICKER_SIZE_IDX["circle"]);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [sheetSizeId, setSheetSizeId] = useState("letter");
  const [materialId, setMaterialId] = useState("white-vinyl");
  const [cutStyleId, setCutStyleId] = useState("kiss-cut");
  const [finishId, setFinishId] = useState("gloss");
  const [quantity, setQuantity] = useState(50);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [whiteInk, setWhiteInk] = useState({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null });
  const [artworkIntent, setArtworkIntent] = useState(null);
  const [rushProduction, setRushProduction] = useState(false);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const sheetSize = useMemo(
    () => SHEET_SIZES.find((s) => s.id === sheetSizeId) || SHEET_SIZES[0],
    [sheetSizeId]
  );

  const stickerSizes = useMemo(() => STICKER_SIZES_BY_SHAPE[shapeId] || [], [shapeId]);
  const stickerSize = stickerSizes[stickerSizeIdx] || null;
  const isCustomStickerSize = stickerSizeIdx === -1 || stickerSizes.length === 0;
  const isSingleDim = shapeId === "circle" || shapeId === "square";

  const stickerW = useMemo(() => {
    if (!isCustomStickerSize && stickerSize) return stickerSize.w;
    const raw = parseFloat(customW);
    return raw > 0 ? raw : 0;
  }, [isCustomStickerSize, stickerSize, customW]);

  const stickerH = useMemo(() => {
    if (!isCustomStickerSize && stickerSize) return stickerSize.h;
    if (isSingleDim) {
      const raw = parseFloat(customW);
      return raw > 0 ? raw : 0;
    }
    const raw = parseFloat(customH);
    return raw > 0 ? raw : 0;
  }, [isCustomStickerSize, stickerSize, isSingleDim, customW, customH]);

  const stickerSizeLabel = useMemo(() => {
    if (!isCustomStickerSize && stickerSize) return stickerSize.label;
    if (stickerW > 0 && stickerH > 0) return `${stickerW}" × ${stickerH}"`;
    return "\u2014";
  }, [isCustomStickerSize, stickerSize, stickerW, stickerH]);

  function selectShape(id) {
    setShapeId(id);
    setStickerSizeIdx(DEFAULT_STICKER_SIZE_IDX[id] ?? 0);
    setCustomW("");
    setCustomH("");
  }

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
        slug: "sticker-sheets",
        quantity: activeQty,
        widthIn: sheetSize.w,
        heightIn: sheetSize.h,
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
  }, [sheetSize.w, sheetSize.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const cutStyleSurcharge = (CUT_STYLES.find((c) => c.id === cutStyleId)?.surcharge ?? 0) * activeQty;
  const finishSurcharge = (FINISHES.find((f) => f.id === finishId)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + materialSurcharge + cutStyleSurcharge + finishSurcharge;
  const rushMultiplier = rushProduction ? RUSH_MULTIPLIER : 1;
  const baseTotalCents = adjustedSubtotal;
  const rushSurchargeCents = rushProduction ? Math.round(baseTotalCents * 0.3) : 0;
  const designHelpCents = artworkIntent === "design-help" ? DESIGN_HELP_CENTS : 0;
  const totalCents = Math.round(baseTotalCents * rushMultiplier) + designHelpCents;

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
      t("ss.title"),
      shape?.tag || shapeId,
      stickerSizeLabel,
      sheetSize.tag,
    ];

    return {
      id: "sticker-sheets",
      name: nameParts.join(" — "),
      slug: "sticker-sheets",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        shape: shapeId,
        stickerSize: stickerSizeLabel,
        stickerWidth: stickerW,
        stickerHeight: stickerH,
        sheetSize: sheetSizeId,
        sizeLabel: sheetSize.label,
        width: sheetSize.w,
        height: sheetSize.h,
        material: materialId,
        cutStyle: cutStyleId,
        finish: finishId,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
        artworkIntent: artworkIntent || null,
        whiteInkEnabled: needsWhiteInk(materialId) && whiteInk.enabled,
        whiteInkMode: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.mode || "auto") : null,
        whiteInkUrl: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.whiteInkUrl || null) : null,
        whiteInkKey: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.whiteInkKey || null) : null,
        whiteInkWidth: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.whiteInkWidth || null) : null,
        whiteInkHeight: needsWhiteInk(materialId) && whiteInk.enabled ? (whiteInk.whiteInkHeight || null) : null,
      },
      forceNewLine: true,
    };
  }, [quoteData, activeQty, shapeId, stickerSizeLabel, sheetSize, adjustedSubtotal, stickerW, stickerH, sheetSizeId, materialId, cutStyleId, finishId, uploadedFile, artworkIntent, whiteInk, t]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("ss.addedToCart"),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("ss.breadcrumb"), href: "/shop/stickers-labels-decals/sticker-sheets" },
          { label: t("ss.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("ss.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Shape */}
          <Section label={t("ss.shape") || "Sticker Shape"}>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectShape(s.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    shapeId === s.id
                      ? "border-gray-900 bg-gray-900 text-[#fff]"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                  }`}
                >
                  <ShapeIcon shapeId={s.id} className={`h-3.5 w-3.5 ${shapeId === s.id ? "text-white" : "text-gray-500"}`} />
                  {t(`ss.shape.${s.id}`) || s.tag}
                </button>
              ))}
            </div>
          </Section>

          {/* Sticker Size */}
          <Section label={t("ss.stickerSize") || "Sticker Size"}>
            {stickerSizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stickerSizes.map((s, i) => (
                  <Chip key={s.id} active={!isCustomStickerSize && stickerSizeIdx === i} onClick={() => { setStickerSizeIdx(i); setCustomW(""); setCustomH(""); }}>
                    {s.label}
                  </Chip>
                ))}
                <Chip active={isCustomStickerSize} onClick={() => { setStickerSizeIdx(-1); setCustomW(""); setCustomH(""); }}>
                  {t("ss.customSize") || "Custom"}
                </Chip>
              </div>
            )}
            {isCustomStickerSize && (
              <div className="mt-3 flex items-center gap-2">
                {isSingleDim ? (
                  <>
                    <label className="text-xs text-gray-500">
                      {shapeId === "circle" ? (t("ss.diameter") || "Diameter") : (t("ss.sideLength") || "Side")}:
                    </label>
                    <input
                      type="number" min="0.5" max="12" step="0.25"
                      value={customW}
                      onChange={(e) => setCustomW(e.target.value)}
                      placeholder='e.g. 2'
                      className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <span className="text-xs text-gray-400">in</span>
                  </>
                ) : (
                  <>
                    <label className="text-xs text-gray-500">{t("ss.width") || "W"}:</label>
                    <input
                      type="number" min="0.5" max="12" step="0.25"
                      value={customW}
                      onChange={(e) => setCustomW(e.target.value)}
                      placeholder='2'
                      className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <span className="text-xs text-gray-400">×</span>
                    <label className="text-xs text-gray-500">{t("ss.height") || "H"}:</label>
                    <input
                      type="number" min="0.5" max="12" step="0.25"
                      value={customH}
                      onChange={(e) => setCustomH(e.target.value)}
                      placeholder='3'
                      className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <span className="text-xs text-gray-400">in</span>
                  </>
                )}
              </div>
            )}
          </Section>

          {/* Sheet Size */}
          <Section label={t("ss.sheetSize")}>
            <div className="flex flex-wrap gap-2">
              {SHEET_SIZES.map((s) => (
                <Chip key={s.id} active={sheetSizeId === s.id} onClick={() => setSheetSizeId(s.id)}>
                  {s.label} <span className="ml-1 text-[11px] opacity-70">({s.tag})</span>
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("ss.material.label")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                      {t(`ss.material.${mat.id}`)}
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
                  <strong> Automatic</strong>, <strong>Match Design</strong>, or <strong>Upload Your Own</strong>.
                </p>
              </div>
            )}
          </Section>

          {/* Cut Style */}
          <Section label={t("ss.cutStyle.label")}>
            <div className="flex flex-wrap gap-2">
              {CUT_STYLES.map((c) => (
                <Chip key={c.id} active={cutStyleId === c.id} onClick={() => setCutStyleId(c.id)}>
                  {t(`ss.cutStyle.${c.id}`)}
                  {c.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              {t(`ss.cutStyleHint.${cutStyleId}`)}
            </p>
          </Section>

          {/* Finish */}
          <Section label={t("ss.finish.label")}>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map((f) => (
                <Chip key={f.id} active={finishId === f.id} onClick={() => setFinishId(f.id)}>
                  {t(`ss.finish.${f.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("ss.quantity")}>
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
              <label className="text-xs text-gray-500">{t("ss.customQty")}:</label>
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
          <Section label={t("ss.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("ss.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setUploadedFile(null); setWhiteInk({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null }); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("ss.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("ss.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("ss.shape") || "Shape"} value={t(`ss.shape.${shapeId}`) || SHAPES.find((s) => s.id === shapeId)?.tag || shapeId} />
              <Row label={t("ss.stickerSize") || "Sticker Size"} value={stickerSizeLabel} />
              <Row label={t("ss.sheetSize")} value={sheetSize.label} />
              <Row label={t("ss.material.label")} value={t(`ss.material.${materialId}`)} />
              <Row label={t("ss.cutStyle.label")} value={t(`ss.cutStyle.${cutStyleId}`)} />
              <Row label={t("ss.finish.label")} value={t(`ss.finish.${finishId}`)} />
              {needsWhiteInk(materialId) && whiteInk.enabled && (
                <Row label="White Ink" value={whiteInk.mode === "auto" ? "Automatic" : whiteInk.mode === "follow" ? "Match Design" : "Custom Upload"} />
              )}
              <Row label={t("ss.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("ss.basePrice")} value={formatCad(baseTotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`ss.material.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {cutStyleSurcharge > 0 && (
                  <Row label={t(`ss.cutStyle.${cutStyleId}`)} value={`+ ${formatCad(cutStyleSurcharge)}`} />
                )}
                {rushSurchargeCents > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <dt>{t?.("configurator.rushSurcharge") || "Rush surcharge"}</dt>
                    <dd className="font-medium">+ {formatCad(rushSurchargeCents)}</dd>
                  </div>
                )}
                {designHelpCents > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <dt>{t?.("configurator.designHelp") || "Design help"}</dt>
                    <dd className="font-medium">+ {formatCad(designHelpCents)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("ss.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round((totalCents - designHelpCents) / activeQty))}/{t("ss.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("ss.selectOptions")}</p>
            )}

            {disabledReason && (
              <p className="text-center text-xs text-amber-600">{disabledReason}</p>
            )}

            {/* Delivery estimate */}
            {quoteData && !quoteLoading && (
              <DeliveryEstimate categorySlug="stickers-labels-decals" rushProduction={rushProduction} t={t} locale={locale} />
            )}

            {/* Rush Production */}
            {quoteData && !quoteLoading && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={rushProduction}
                  onChange={(e) => setRushProduction(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-800">{t?.("configurator.rushProduction") || "24-Hour Rush Production"}</span>
                </div>
              </label>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleAddToCart({ rushProduction, intakeMode: "upload-optional", artworkIntent })}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart
                    ? "bg-gray-900 text-[#fff] hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("ss.addToCart")}
              </button>
              <button
                type="button"
                onClick={() => handleBuyNow({ rushProduction, intakeMode: "upload-optional", artworkIntent })}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading
                    ? "border-gray-900 bg-gray-900 text-[#fff] hover:bg-gray-800"
                    : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("ss.processing") : t("ss.buyNow")}
              </button>
            </div>

            <InlineTrustSignals t={t} />
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
                  {activeQty.toLocaleString()} × {sheetSize.tag} {t(`ss.material.${materialId}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{disabledReason || t("ss.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleAddToCart({ rushProduction, intakeMode: "upload-optional", artworkIntent })}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-gray-900 text-[#fff] hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("ss.addToCart")}
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
