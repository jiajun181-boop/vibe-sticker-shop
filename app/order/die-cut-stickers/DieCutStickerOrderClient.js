"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useConfiguratorCart } from "@/components/configurator";
import { showErrorToast } from "@/components/Toast";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ProofPreview } from "@/components/configurator";
import saveProofData from "@/lib/proof/saveProofData";
import WhiteInkStep, { needsWhiteInk } from "@/components/configurator/WhiteInkStep";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import { RUSH_MULTIPLIER, DESIGN_HELP_CENTS } from "@/lib/order-config";
import DeliveryEstimate from "@/components/configurator/DeliveryEstimate";
import InlineTrustSignals from "@/components/configurator/InlineTrustSignals";
import { formatCad } from "@/lib/product-helpers";
import useConfiguratorSave from "@/components/configurator/useConfiguratorSave";

const DEBOUNCE_MS = 300;

// ─── Die-Cut Sticker Configuration ───

const MATERIALS = [
  { id: "white-vinyl", desc: "dc.mat.whiteVinylDesc" },
  { id: "clear-vinyl", desc: "dc.mat.clearVinylDesc" },
  { id: "holographic-vinyl", desc: "dc.mat.holographicDesc" },
  { id: "kraft", desc: "dc.mat.kraftDesc" },
];

const SIZES = [
  { id: "2in", tag: '2"', w: 2, h: 2 },
  { id: "3in", tag: '3"', w: 3, h: 3 },
  { id: "4in", tag: '4"', w: 4, h: 4 },
  { id: "5in", tag: '5"', w: 5, h: 5 },
  { id: "6in", tag: '6"', w: 6, h: 6 },
];

const FINISHES = [
  { id: "gloss", surcharge: 0 },
  { id: "matte", surcharge: 0 },
  { id: "uncoated", surcharge: 0 },
];

const QUANTITIES = [25, 50, 100, 250, 500, 1000];

const DEFAULT_SIZE_IDX = 1; // 3"×3"

// ─── Main Component ───

export default function DieCutStickerOrderClient() {
  const { t, locale } = useTranslation();
  // useConfiguratorCart provides unified Add to Cart + Buy Now handlers

  const [materialId, setMaterialId] = useState("white-vinyl");
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE_IDX);
  const [finishId, setFinishId] = useState("gloss");
  const [quantity, setQuantity] = useState(100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [proofConfirmed, setProofConfirmed] = useState(false);
  const [contourData, setContourData] = useState(null);
  const [proofDataId, setProofDataId] = useState(null);
  const [whiteInk, setWhiteInk] = useState({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null });
  const [artworkIntent, setArtworkIntent] = useState(null);
  const [rushProduction, setRushProduction] = useState(false);

  // Persist selections to localStorage
  const saveState = useMemo(() => ({ materialId, sizeIdx, finishId, quantity, customQty, rushProduction }), [materialId, sizeIdx, finishId, quantity, customQty, rushProduction]);
  const { restore, clear: clearSaved } = useConfiguratorSave("die-cut-stickers", saveState);

  // Restore saved selections on mount
  useEffect(() => {
    const saved = restore();
    if (!saved) return;
    if (saved.materialId && MATERIALS.some((m) => m.id === saved.materialId)) setMaterialId(saved.materialId);
    if (typeof saved.sizeIdx === "number" && saved.sizeIdx >= 0 && saved.sizeIdx < SIZES.length) setSizeIdx(saved.sizeIdx);
    if (saved.finishId && FINISHES.some((f) => f.id === saved.finishId)) setFinishId(saved.finishId);
    if (typeof saved.quantity === "number" && saved.quantity > 0) setQuantity(saved.quantity);
    if (saved.customQty !== undefined) setCustomQty(saved.customQty);
    if (typeof saved.rushProduction === "boolean") setRushProduction(saved.rushProduction);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);
  // buyNowLoading provided by useConfiguratorCart hook below

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
    if (activeQty <= 0) { setQuoteData(null); return; }
    const ac = new AbortController();
    abortRef.current = ac;
    setQuoteLoading(true);
    setQuoteError(null);

    fetch("/api/pricing/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "die-cut-stickers", quantity: activeQty, widthIn: size.w, heightIn: size.h, material: materialId }),
      signal: ac.signal,
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => { if (!ok) throw new Error(data.error || "Quote failed"); setQuoteData(data); })
      .catch((err) => { if (err.name === "AbortError") return; setQuoteError(err.message); })
      .finally(() => setQuoteLoading(false));
  }, [size.w, size.h, activeQty, materialId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const finishSurcharge = (FINISHES.find((f) => f.id === finishId)?.surcharge ?? 0) * activeQty;
  const rushMultiplier = rushProduction ? RUSH_MULTIPLIER : 1;
  const baseTotalCents = subtotalCents + finishSurcharge;
  const rushSurchargeCents = rushProduction ? Math.round(baseTotalCents * (RUSH_MULTIPLIER - 1)) : 0;
  const designHelpCents = artworkIntent === "design-help" ? DESIGN_HELP_CENTS : 0;
  const totalCents = Math.round(baseTotalCents * rushMultiplier) + designHelpCents;

  const requiresProof = uploadedFile != null;
  // White ink enabled on transparent material → URL must be ready before checkout
  const whiteInkReady = !needsWhiteInk(materialId) || !proofConfirmed || !whiteInk.enabled || whiteInk.whiteInkUrl != null;
  const hasArtworkOrIntent = !!uploadedFile || !!artworkIntent;
  const canAddToCart = quoteData && !quoteLoading && activeQty > 0 && hasArtworkOrIntent && (!requiresProof || proofConfirmed) && whiteInkReady;
  const disabledReason = !canAddToCart
    ? quoteLoading ? "Calculating price..."
    : !quoteData ? "Select your options for pricing"
    : !hasArtworkOrIntent ? "Upload artwork or select an option below"
    : requiresProof && !proofConfirmed ? "Confirm your proof to continue"
    : !whiteInkReady ? "White ink layer is being generated..."
    : "Complete all options to continue"
    : null;

  const buildCartItem = useCallback(() => {
    if (!quoteData || activeQty <= 0) return null;
    return {
      id: "die-cut-stickers",
      name: `${t("dc.title")} — ${size.tag}`,
      slug: "die-cut-stickers",
      // Use baseTotalCents (no rush, no design help) — useConfiguratorCart applies these
      price: Math.round(baseTotalCents / activeQty),
      quantity: activeQty,
      options: {
        material: materialId,
        materialName: t(`dc.mat.${materialId}`),
        finish: finishId,
        finishName: t(`dc.finish.${finishId}`),
        sizeId: size.id,
        sizeLabel: size.tag,
        width: size.w,
        height: size.h,
        fileName: uploadedFile?.name || null,
        artworkUrl: uploadedFile?.url || null,
        artworkKey: uploadedFile?.key || null,
        proofConfirmed: proofConfirmed || false,
        proofDataId: proofDataId || null,
        contourSvg: contourData?.contourSvg || null,
        bleedMm: contourData?.bleedMm || null,
        processedImageUrl: contourData?.processedImageUrl || null,
        whiteInkEnabled: needsWhiteInk(materialId) && proofConfirmed && whiteInk.enabled,
        whiteInkMode: needsWhiteInk(materialId) && proofConfirmed && whiteInk.enabled ? (whiteInk.mode || "auto") : null,
        whiteInkUrl: needsWhiteInk(materialId) && proofConfirmed && whiteInk.enabled ? (whiteInk.whiteInkUrl || null) : null,
        whiteInkKey: needsWhiteInk(materialId) && proofConfirmed && whiteInk.enabled ? (whiteInk.whiteInkKey || null) : null,
        whiteInkWidth: needsWhiteInk(materialId) && proofConfirmed && whiteInk.enabled ? (whiteInk.whiteInkWidth || null) : null,
        whiteInkHeight: needsWhiteInk(materialId) && proofConfirmed && whiteInk.enabled ? (whiteInk.whiteInkHeight || null) : null,
        artworkIntent: artworkIntent || null,
      },
      forceNewLine: true,
    };
  }, [quoteData, activeQty, t, size, totalCents, materialId, finishId, uploadedFile, proofConfirmed, proofDataId, contourData, whiteInk, artworkIntent]);

  const { handleAddToCart: _addToCart, handleBuyNow: _buyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: t("dc.addedToCart"),
  });

  const handleAddToCart = useCallback((opts) => { _addToCart(opts); clearSaved(); }, [_addToCart, clearSaved]);
  const handleBuyNow = useCallback((opts) => { _buyNow(opts); clearSaved(); }, [_buyNow, clearSaved]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: t("nav.shop"), href: "/shop" },
        { label: t("dc.breadcrumb"), href: "/shop/stickers-labels-decals" },
        { label: t("dc.order") },
      ]} />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{t("dc.title")}</h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ─── LEFT: Config area (3/5) ─── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Material */}
          <Section label={t("dc.material")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MATERIALS.map((mat) => (
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
                  <span className="block text-sm font-medium text-gray-800">{t(`dc.mat.${mat.id}`)}</span>
                  <span className={`mt-0.5 block text-[11px] leading-tight ${materialId === mat.id ? "text-gray-500" : "text-gray-400"}`}>
                    {t(mat.desc)}
                  </span>
                  {materialId === mat.id && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-900" />
                  )}
                </button>
              ))}
            </div>
            {/* Transparent material explanation */}
            {needsWhiteInk(materialId) && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">
                  {materialId === "clear-vinyl" ? "Clear vinyl" : materialId === "holographic-vinyl" ? "Holographic vinyl" : "This material"} is transparent
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Without a white ink layer, colors will appear translucent on the sticker.
                  After uploading your artwork and confirming the proof, you can choose how to add a white base:
                  <strong> Automatic</strong> (full white under your design),
                  <strong> Match Design</strong> (white follows your artwork edges), or
                  <strong> Upload Your Own</strong> white layer.
                </p>
              </div>
            )}
          </Section>

          {/* Size */}
          <Section label={t("dc.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.tag}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Finish */}
          <Section label={t("dc.finish")}>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map((f) => (
                <Chip key={f.id} active={finishId === f.id} onClick={() => setFinishId(f.id)}>
                  {t(`dc.finish.${f.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("dc.quantity")}>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((q) => (
                <Chip key={q} active={customQty === "" && quantity === q} onClick={() => { setQuantity(q); setCustomQty(""); }}>
                  {q.toLocaleString()}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("dc.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 750"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* Artwork Upload */}
          <Section label={t("dc.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("dc.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button type="button" onClick={() => { setUploadedFile(null); setProofConfirmed(false); setContourData(null); setWhiteInk({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null }); }} className="text-xs text-red-500 hover:text-red-700">
                    {t("dc.remove")}
                  </button>
                </div>
              ) : (
                <>
                  <UploadButton
                    endpoint="artworkUploader"
                    onClientUploadComplete={(res) => {
                      const first = Array.isArray(res) ? res[0] : null;
                      if (!first) return;
                      setUploadedFile({ url: first.ufsUrl || first.url, key: first.key, name: first.name, size: first.size });
                      setProofConfirmed(false);
                      setContourData(null);
                      setProofDataId(null);
                      setArtworkIntent(null); // Clear intent since artwork was provided
                    }}
                    onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
                  />
                  {/* Artwork intent — shown when no file uploaded */}
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
                        {t("configurator.uploadLater") || "I'll Upload Later"}
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
                        {t("configurator.designHelpOption") || "Design Help (+$45)"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </Section>

          {/* Proof Preview */}
          {uploadedFile && (
            <ProofPreview
              uploadedFile={uploadedFile}
              widthIn={size.w}
              heightIn={size.h}
              cuttingId="die-cut"
              materialId={materialId}
              onConfirmProof={(data) => {
                setContourData(data);
                setProofConfirmed(true);
                saveProofData({ productSlug: "die-cut-stickers", uploadedFile, contourData: data })
                  .then((id) => { if (id) setProofDataId(id); });
              }}
              onRejectProof={() => {
                setUploadedFile(null);
                setProofConfirmed(false);
                setContourData(null);
                setProofDataId(null);
                setWhiteInk({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null });
              }}
              t={t}
            />
          )}

          {/* White Ink — shown after proof is confirmed, only for transparent materials */}
          {uploadedFile && proofConfirmed && (
            <WhiteInkStep
              key={materialId}
              materialId={materialId}
              artworkUrl={contourData?.processedImageUrl || uploadedFile?.url}
              onChange={setWhiteInk}
            />
          )}
        </div>

        {/* ─── RIGHT: Order summary sidebar (2/5) ─── */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("dc.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("dc.material")} value={t(`dc.mat.${materialId}`)} />
              <Row label={t("dc.size")} value={size.tag} />
              <Row label={t("dc.finish")} value={t(`dc.finish.${finishId}`)} />
              {needsWhiteInk(materialId) && whiteInk.enabled && (
                <Row label="White Ink" value={whiteInk.mode === "auto" ? "Automatic" : whiteInk.mode === "follow" ? "Match Design" : "Custom Upload"} />
              )}
              <Row label={t("dc.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
            </dl>

            <hr className="border-gray-100" />

            {quoteLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />)}</div>
            ) : quoteError ? (
              <p className="text-xs text-red-500">{quoteError}</p>
            ) : quoteData ? (
              <dl className="space-y-2 text-sm">
                <Row label={t("dc.basePrice")} value={formatCad(baseTotalCents)} />
                {finishSurcharge > 0 && <Row label={t(`dc.finish.${finishId}`)} value={`+ ${formatCad(finishSurcharge)}`} />}
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
                  <dt className="font-semibold text-gray-900">{t("dc.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">{formatCad(Math.round((totalCents - designHelpCents) / activeQty))}/{t("dc.each")}</p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("dc.selectOptions")}</p>
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
                  canAddToCart ? "bg-gray-900 text-[#fff] hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("dc.addToCart")}
              </button>
              <button
                type="button"
                onClick={() => handleBuyNow({ rushProduction, intakeMode: "upload-optional", artworkIntent })}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800" : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("dc.processing") : t("dc.buyNow")}
              </button>
            </div>

            <InlineTrustSignals t={t} />
          </div>
        </aside>
      </div>

      {/* ─── MOBILE: Fixed bottom bar ─── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {formatCad(Math.round(totalCents / activeQty))}/{t("dc.each")} &times; {activeQty.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{disabledReason || t("dc.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleAddToCart({ rushProduction, intakeMode: "upload-optional", artworkIntent })}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart ? "bg-gray-900 text-[#fff] hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("dc.addToCart")}
          </button>
          <button
            type="button"
            onClick={() => handleBuyNow({ rushProduction, intakeMode: "upload-optional", artworkIntent })}
            disabled={!canAddToCart || buyNowLoading}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart && !buyNowLoading ? "bg-gray-900 text-[#fff] shadow-lg hover:bg-gray-800" : "cursor-not-allowed bg-gray-100 text-gray-400"
            }`}
          >
            {buyNowLoading ? "..." : t("dc.buyNow")}
          </button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      {/* ── FAQ ── */}
      {(() => {
        const faqItems = getConfiguratorFaqs("die-cut-stickers");
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

// ─── Helper Components ───

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
        active ? "border-gray-900 bg-gray-900 text-[#fff]" : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
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
