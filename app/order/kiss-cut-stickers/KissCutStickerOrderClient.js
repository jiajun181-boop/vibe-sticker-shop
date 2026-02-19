"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ProofPreview } from "@/components/configurator";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Kiss-Cut Sticker Configuration ───

const MATERIALS = [
  { id: "white-vinyl", surcharge: 0, desc: "kc.mat.whiteVinylDesc" },
  { id: "clear-vinyl", surcharge: 3, desc: "kc.mat.clearVinylDesc" },
  { id: "holographic", surcharge: 8, desc: "kc.mat.holographicDesc" },
];

const SIZES = [
  { id: "2in", tag: '2"', w: 2, h: 2 },
  { id: "3in", tag: '3"', w: 3, h: 3 },
  { id: "4in", tag: '4"', w: 4, h: 4 },
  { id: "5in", tag: '5"', w: 5, h: 5 },
];

const BACKING_SHAPES = [
  { id: "square", surcharge: 0 },
  { id: "rounded-rect", surcharge: 0 },
];

const FINISHES = [
  { id: "gloss", surcharge: 0 },
  { id: "matte", surcharge: 0 },
];

const QUANTITIES = [25, 50, 100, 250, 500, 1000];

const DEFAULT_SIZE_IDX = 1; // 3"×3"

// ─── Main Component ───

export default function KissCutStickerOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [materialId, setMaterialId] = useState("white-vinyl");
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE_IDX);
  const [backingId, setBackingId] = useState("square");
  const [finishId, setFinishId] = useState("gloss");
  const [quantity, setQuantity] = useState(100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [proofConfirmed, setProofConfirmed] = useState(false);
  const [contourData, setContourData] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

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

    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "kiss-cut-stickers", quantity: activeQty, widthIn: size.w, heightIn: size.h, sides: "single" }),
      signal: ac.signal,
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => { if (!ok) throw new Error(data.error || "Quote failed"); setQuoteData(data); })
      .catch((err) => { if (err.name === "AbortError") return; setQuoteError(err.message); })
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
  const backingSurcharge = (BACKING_SHAPES.find((b) => b.id === backingId)?.surcharge ?? 0) * activeQty;
  const finishSurcharge = (FINISHES.find((f) => f.id === finishId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + materialSurcharge + backingSurcharge + finishSurcharge;
  const totalCents = adjustedSubtotal;

  const requiresProof = uploadedFile != null;
  const canAddToCart = quoteData && !quoteLoading && activeQty > 0 && (!requiresProof || proofConfirmed);

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
    return {
      id: "kiss-cut-stickers",
      name: `${t("kc.title")} — ${size.tag}`,
      slug: "kiss-cut-stickers",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        material: materialId,
        materialName: t(`kc.mat.${materialId}`),
        backing: backingId,
        backingName: t(`kc.backing.${backingId}`),
        finish: finishId,
        finishName: t(`kc.finish.${finishId}`),
        sizeId: size.id,
        sizeLabel: size.tag,
        width: size.w,
        height: size.h,
        fileName: uploadedFile?.name || null,
        proofConfirmed: proofConfirmed || false,
        contourSvg: contourData?.contourSvg || null,
        bleedMm: contourData?.bleedMm || null,
        processedImageUrl: contourData?.processedImageUrl || null,
      },
      forceNewLine: true,
    };
  }

  function handleAddToCart() {
    const item = buildCartItem();
    if (!item) return;
    addItem(item);
    openCart();
    showSuccessToast(t("kc.addedToCart"));
  }

  async function handleBuyNow() {
    const item = buildCartItem();
    if (!item || buyNowLoading) return;
    setBuyNowLoading(true);
    try {
      const meta = {};
      for (const [k, v] of Object.entries(item.options)) {
        if (v == null) continue;
        meta[k] = typeof v === "object" ? JSON.stringify(v) : v;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: String(item.id), slug: String(item.slug), name: item.name, unitAmount: item.price, quantity: item.quantity, meta }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBuyNowLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: t("nav.shop"), href: "/shop" },
        { label: t("kc.breadcrumb"), href: "/shop/stickers-labels-decals/kiss-cut-stickers" },
        { label: t("kc.order") },
      ]} />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{t("kc.title")}</h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ─── LEFT: Config area (3/5) ─── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Material */}
          <Section label={t("kc.material")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => setMaterialId(mat.id)}
                  className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    materialId === mat.id
                      ? "border-gray-900 bg-gray-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-800">{t(`kc.mat.${mat.id}`)}</span>
                  <span className={`mt-0.5 block text-[11px] leading-tight ${materialId === mat.id ? "text-gray-500" : "text-gray-400"}`}>
                    {t(mat.desc)}
                  </span>
                  {mat.surcharge > 0 && (
                    <span className="mt-1 block text-[11px] font-medium text-amber-600">+{formatCad(mat.surcharge)}/ea</span>
                  )}
                  {materialId === mat.id && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-900" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("kc.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.tag}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Backing Shape */}
          <Section label={t("kc.backing.label")}>
            <div className="flex flex-wrap gap-2">
              {BACKING_SHAPES.map((b) => (
                <Chip key={b.id} active={backingId === b.id} onClick={() => setBackingId(b.id)}>
                  {t(`kc.backing.${b.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Finish */}
          <Section label={t("kc.finish")}>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map((f) => (
                <Chip key={f.id} active={finishId === f.id} onClick={() => setFinishId(f.id)}>
                  {t(`kc.finish.${f.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("kc.quantity")}>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((q) => (
                <Chip key={q} active={customQty === "" && quantity === q} onClick={() => { setQuantity(q); setCustomQty(""); }}>
                  {q.toLocaleString()}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("kc.customQty")}:</label>
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
          <Section label={t("kc.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("kc.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button type="button" onClick={() => { setUploadedFile(null); setProofConfirmed(false); setContourData(null); }} className="text-xs text-red-500 hover:text-red-700">
                    {t("kc.remove")}
                  </button>
                </div>
              ) : (
                <UploadButton
                  endpoint="artworkUploader"
                  onClientUploadComplete={(res) => {
                    const first = Array.isArray(res) ? res[0] : null;
                    if (!first) return;
                    setUploadedFile({ url: first.ufsUrl || first.url, key: first.key, name: first.name, size: first.size });
                    setProofConfirmed(false);
                    setContourData(null);
                  }}
                  onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
                />
              )}
            </div>
          </Section>

          {/* Proof Preview */}
          {uploadedFile && (
            <ProofPreview
              uploadedFile={uploadedFile}
              widthIn={size.w}
              heightIn={size.h}
              cuttingId="kiss-cut"
              materialId={materialId}
              onConfirmProof={(data) => {
                setContourData(data);
                setProofConfirmed(true);
              }}
              onRejectProof={() => {
                setUploadedFile(null);
                setProofConfirmed(false);
                setContourData(null);
              }}
              t={t}
            />
          )}
        </div>

        {/* ─── RIGHT: Order summary sidebar (2/5) ─── */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("kc.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("kc.material")} value={t(`kc.mat.${materialId}`)} />
              <Row label={t("kc.size")} value={size.tag} />
              <Row label={t("kc.backing.label")} value={t(`kc.backing.${backingId}`)} />
              <Row label={t("kc.finish")} value={t(`kc.finish.${finishId}`)} />
              <Row label={t("kc.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
            </dl>

            <hr className="border-gray-100" />

            {quoteLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />)}</div>
            ) : quoteError ? (
              <p className="text-xs text-red-500">{quoteError}</p>
            ) : quoteData ? (
              <dl className="space-y-2 text-sm">
                <Row label={t("kc.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && <Row label={t(`kc.mat.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />}
                {backingSurcharge > 0 && <Row label={t(`kc.backing.${backingId}`)} value={`+ ${formatCad(backingSurcharge)}`} />}
                {finishSurcharge > 0 && <Row label={t(`kc.finish.${finishId}`)} value={`+ ${formatCad(finishSurcharge)}`} />}
                <Row label={t("kc.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("kc.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">{formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("kc.each")}</p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("kc.selectOptions")}</p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("kc.addToCart")}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading ? "border-gray-900 text-gray-900 hover:bg-gray-50" : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("kc.processing") : t("kc.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("kc.badge.easyPeel")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("kc.badge.shipping")}</span>
            </div>
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
                  {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("kc.each")} &times; {activeQty.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("kc.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("kc.addToCart")}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canAddToCart || buyNowLoading}
            className={`shrink-0 rounded-full border-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart && !buyNowLoading ? "border-gray-900 text-gray-900" : "cursor-not-allowed border-gray-200 text-gray-400"
            }`}
          >
            {buyNowLoading ? "..." : t("kc.buyNow")}
          </button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
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
        active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
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
