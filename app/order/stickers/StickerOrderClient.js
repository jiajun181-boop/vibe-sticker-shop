"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { validateDimensions } from "@/lib/materialLimits";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  CUTTING_TYPES,
  getCuttingType,
  resolveProductSlug,
} from "@/lib/sticker-order-config";
import {
  trackAddToCart,
  trackOptionChange,
  trackQuoteLoaded,
  trackBuyNow,
  trackUploadStarted,
  trackUploadCompleted,
} from "@/lib/analytics";

const HST_RATE = 0.13;
const INCH_TO_CM = 2.54;
const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);

// --- SVG icons for cutting types ---
function CutIcon({ type, className = "w-6 h-6" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "scissors": // die-cut
      return (
        <svg {...common}>
          <path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12l2.35 2.35" />
        </svg>
      );
    case "layers": // kiss-cut
      return (
        <svg {...common}>
          <path d="m12 2 10 6.5v7L12 22 2 15.5v-7L12 2zM12 22v-6.5" />
          <path d="m22 8.5-10 7-10-7" />
          <path d="m2 15.5 10-7 10 7" />
        </svg>
      );
    case "grid": // sheets
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "circle": // roll-labels
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case "type": // vinyl-lettering
      return (
        <svg {...common}>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case "square": // decals
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 12h18" />
        </svg>
      );
    default:
      return null;
  }
}

function normalizeCheckoutMeta(meta) {
  const input = meta && typeof meta === "object" ? meta : {};
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v == null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
      continue;
    }
    try { out[k] = JSON.stringify(v); } catch { /* skip */ }
  }
  return out;
}

export default function StickerOrderClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { addItem, openCart } = useCartStore();

  // --- State ---
  const [cuttingId, setCuttingId] = useState(searchParams.get("type") || "die-cut");
  const cutting = useMemo(() => getCuttingType(cuttingId), [cuttingId]);

  const [sizeIdx, setSizeIdx] = useState(0); // index in cutting.sizes, or -1 for custom
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in"); // "in" | "cm"
  const [materialId, setMaterialId] = useState(cutting.materials[0].id);
  const [quantity, setQuantity] = useState(cutting.quantities[2] ?? 100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [dimErrors, setDimErrors] = useState([]);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Derived dimensions in inches
  const isCustomSize = sizeIdx === -1;
  const widthIn = useMemo(() => {
    if (!isCustomSize) return cutting.sizes[sizeIdx]?.w ?? 2;
    const raw = parseFloat(customW);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, cutting, customW, unit]);

  const heightIn = useMemo(() => {
    if (!isCustomSize) return cutting.sizes[sizeIdx]?.h ?? 2;
    const raw = parseFloat(customH);
    if (!raw || raw <= 0) return 0;
    return unit === "cm" ? raw / INCH_TO_CM : raw;
  }, [isCustomSize, sizeIdx, cutting, customH, unit]);

  // Active quantity (preset or custom)
  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Product slug for quote API
  const slug = useMemo(
    () => resolveProductSlug(cuttingId, materialId),
    [cuttingId, materialId]
  );

  // --- Reset when cutting type changes ---
  useEffect(() => {
    setSizeIdx(0);
    setCustomW("");
    setCustomH("");
    setMaterialId(cutting.materials[0].id);
    setQuantity(cutting.quantities[2] ?? cutting.quantities[0]);
    setCustomQty("");
    setQuoteData(null);
    setQuoteError(null);
    setDimErrors([]);
  }, [cuttingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Validate dimensions ---
  useEffect(() => {
    if (widthIn <= 0 || heightIn <= 0) {
      setDimErrors([]);
      return;
    }
    const result = validateDimensions(widthIn, heightIn, "sticker", {
      minWidthIn: cutting.minIn,
      minHeightIn: cutting.minIn,
      maxWidthIn: cutting.maxW,
      maxHeightIn: cutting.maxH,
    });
    setDimErrors(result.errors);
  }, [widthIn, heightIn, cutting]);

  // --- Fetch quote (debounced) ---
  const fetchQuote = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (widthIn <= 0 || heightIn <= 0 || activeQty <= 0 || dimErrors.length > 0) {
      setQuoteData(null);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setQuoteLoading(true);
    setQuoteError(null);

    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        quantity: activeQty,
        widthIn,
        heightIn,
        material: materialId,
      }),
      signal: ac.signal,
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Quote failed");
        setQuoteData(data);
        trackQuoteLoaded({
          slug,
          quantity: activeQty,
          pricingModel: data.meta?.model,
          totalCents: data.totalCents,
          unitCents: data.unitCents,
        });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setQuoteError(err.message);
      })
      .finally(() => setQuoteLoading(false));
  }, [slug, widthIn, heightIn, activeQty, materialId, dimErrors]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // --- Price display ---
  const unitCents = quoteData?.unitCents ?? 0;
  const subtotalCents = quoteData?.totalCents ?? 0;
  const taxCents = Math.round(subtotalCents * HST_RATE);
  const totalCents = subtotalCents + taxCents;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0 && dimErrors.length === 0;

  // --- Tier pricing table ---
  const tierRows = useMemo(() => {
    return cutting.quantities.map((q) => {
      // Rough estimate: base price * discount
      const discount =
        q >= 1000 ? 0.82 : q >= 500 ? 0.88 : q >= 250 ? 0.93 : q >= 100 ? 0.97 : 1.0;
      return { qty: q, discount };
    });
  }, [cutting]);

  // --- Build cart item ---
  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
    const mat = cutting.materials.find((m) => m.id === materialId);
    const sizeLabel = isCustomSize
      ? `${widthIn.toFixed(2)}" × ${heightIn.toFixed(2)}"`
      : cutting.sizes[sizeIdx]?.label;

    return {
      id: slug,
      name: `${t(`stickerOrder.type.${cuttingId}`)} — ${sizeLabel}`,
      slug,
      price: unitCents,
      quantity: activeQty,
      options: {
        cuttingType: cuttingId,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        material: materialId,
        materialName: t(`stickerOrder.mat.${materialId}`),
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }

  function handleAddToCart() {
    const item = buildCartItem();
    if (!item) return;
    addItem(item);
    openCart();
    trackAddToCart({
      name: item.name,
      value: subtotalCents,
      slug,
      quantity: activeQty,
      pricingModel: quoteData?.meta?.model,
    });
    showSuccessToast(t("stickerOrder.addedToCart"));
  }

  async function handleBuyNow() {
    const item = buildCartItem();
    if (!item || buyNowLoading) return;
    trackBuyNow({ name: item.name, value: subtotalCents });
    setBuyNowLoading(true);
    try {
      const checkoutItem = {
        productId: String(item.id),
        slug: String(item.slug),
        name: item.name,
        unitAmount: item.price,
        quantity: item.quantity,
        meta: normalizeCheckoutMeta(item.options),
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [checkoutItem] }),
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

  // --- Handlers ---
  function selectCutting(id) {
    setCuttingId(id);
    trackOptionChange({ slug, option: "cuttingType", value: id, quantity: activeQty });
  }

  function selectSize(idx) {
    setSizeIdx(idx);
    setCustomW("");
    setCustomH("");
    trackOptionChange({ slug, option: "size", value: idx === -1 ? "custom" : cutting.sizes[idx]?.label, quantity: activeQty });
  }

  function selectMaterial(id) {
    setMaterialId(id);
    trackOptionChange({ slug, option: "material", value: id, quantity: activeQty });
  }

  function selectQuantity(q) {
    setQuantity(q);
    setCustomQty("");
    trackOptionChange({ slug, option: "quantity", value: q, quantity: q });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("stickerOrder.stickers"), href: "/shop/stickers-labels-decals" },
          { label: t("stickerOrder.order") },
        ]}
      />

      {/* Page title */}
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("stickerOrder.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ===================== LEFT: Config area (3/5) ===================== */}
        <div className="space-y-8 lg:col-span-3">
          {/* -------- Cutting Type -------- */}
          <Section label={t("stickerOrder.cuttingType")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CUTTING_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => selectCutting(ct.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    cuttingId === ct.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <CutIcon type={ct.icon} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`stickerOrder.type.${ct.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${cuttingId === ct.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`stickerOrder.typeDesc.${ct.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* -------- Size -------- */}
          <Section label={t("stickerOrder.size")}>
            <div className="flex flex-wrap gap-2">
              {cutting.sizes.map((s, i) => (
                <Chip
                  key={i}
                  active={sizeIdx === i}
                  onClick={() => selectSize(i)}
                >
                  {s.label}
                </Chip>
              ))}
              <Chip active={isCustomSize} onClick={() => selectSize(-1)}>
                {t("stickerOrder.custom")}
              </Chip>
            </div>

            {isCustomSize && (
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">{t("stickerOrder.width")}</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={customW}
                    onChange={(e) => setCustomW(e.target.value)}
                    placeholder={unit === "in" ? '3.0"' : "7.6cm"}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <span className="pb-2 text-gray-400">×</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">{t("stickerOrder.height")}</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={customH}
                    onChange={(e) => setCustomH(e.target.value)}
                    placeholder={unit === "in" ? '3.0"' : "7.6cm"}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setUnit("in")}
                    className={`px-3 py-2 text-xs font-medium transition ${unit === "in" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    in
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("cm")}
                    className={`px-3 py-2 text-xs font-medium transition ${unit === "cm" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    cm
                  </button>
                </div>
              </div>
            )}

            {dimErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {dimErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            )}
          </Section>

          {/* -------- Material -------- */}
          <Section label={t("stickerOrder.material")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {cutting.materials.map((mat) => {
                const surcharge = mat.multiplier > 1 ? `+${Math.round((mat.multiplier - 1) * 100)}%` : null;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => selectMaterial(mat.id)}
                    className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      materialId === mat.id
                        ? "border-gray-900 bg-gray-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-800">
                      {t(`stickerOrder.mat.${mat.id}`)}
                    </span>
                    {surcharge && (
                      <span className="mt-0.5 block text-[11px] text-amber-600 font-medium">{surcharge}</span>
                    )}
                    {materialId === mat.id && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* -------- Quantity -------- */}
          <Section label={t("stickerOrder.quantity")}>
            <div className="flex flex-wrap gap-2">
              {cutting.quantities.map((q) => (
                <Chip
                  key={q}
                  active={customQty === "" && quantity === q}
                  onClick={() => selectQuantity(q)}
                >
                  {q.toLocaleString()}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("stickerOrder.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => {
                  setCustomQty(e.target.value);
                  trackOptionChange({ slug, option: "quantity", value: e.target.value, quantity: parseInt(e.target.value, 10) || 0 });
                }}
                placeholder="e.g. 750"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* -------- File Upload (optional) -------- */}
          <Section label={t("stickerOrder.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("stickerOrder.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("stickerOrder.remove")}
                  </button>
                </div>
              ) : (
                <UploadButton
                  endpoint="artworkUploader"
                  onUploadBegin={() => trackUploadStarted({ slug })}
                  onClientUploadComplete={(res) => {
                    const first = Array.isArray(res) ? res[0] : null;
                    if (!first) return;
                    setUploadedFile({
                      url: first.ufsUrl || first.url,
                      key: first.key,
                      name: first.name,
                      size: first.size,
                    });
                    trackUploadCompleted({ slug, fileName: first.name, fileSize: first.size });
                  }}
                  onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
                />
              )}
            </div>
          </Section>
        </div>

        {/* ===================== RIGHT: Order summary sidebar (2/5) ===================== */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("stickerOrder.summary")}</h2>

            <SummaryRows
              t={t}
              cuttingId={cuttingId}
              sizeLabel={isCustomSize ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"` : cutting.sizes[sizeIdx]?.label}
              materialId={materialId}
              quantity={activeQty}
              unitCents={unitCents}
              subtotalCents={subtotalCents}
              taxCents={taxCents}
              totalCents={totalCents}
              quoteLoading={quoteLoading}
              quoteError={quoteError}
            />

            {/* Tier pricing table */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                {t("stickerOrder.volumeDiscounts")}
              </h3>
              <div className="space-y-1">
                {tierRows.map((row) => (
                  <div
                    key={row.qty}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                      activeQty === row.qty ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <span>{row.qty.toLocaleString()}+</span>
                    <span>{row.discount < 1 ? `-${Math.round((1 - row.discount) * 100)}%` : t("stickerOrder.basePrice")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("stickerOrder.addToCart")}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading
                    ? "border-gray-900 text-gray-900 hover:bg-gray-50"
                    : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("stickerOrder.processing") : t("stickerOrder.buyNow")}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("stickerOrder.badgeWaterproof")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("stickerOrder.badgeShipping")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("stickerOrder.badgeProof")}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ===================== MOBILE: Fixed bottom bar ===================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1 min-w-0">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {formatCad(unitCents)}/{t("stickerOrder.ea")} × {activeQty.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("stickerOrder.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("stickerOrder.addToCart")}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canAddToCart || buyNowLoading}
            className={`shrink-0 rounded-full border-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart && !buyNowLoading
                ? "border-gray-900 text-gray-900"
                : "cursor-not-allowed border-gray-200 text-gray-400"
            }`}
          >
            {buyNowLoading ? "..." : t("stickerOrder.buyNow")}
          </button>
        </div>
      </div>

      {/* Bottom spacing for mobile bar */}
      <div className="h-20 lg:hidden" />
    </main>
  );
}

// --- Helper components ---

function Section({ label, optional, children }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</h2>
        {optional && <span className="text-[10px] text-gray-400">({useTranslation().t("stickerOrder.optional")})</span>}
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
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryRows({
  t,
  cuttingId,
  sizeLabel,
  materialId,
  quantity,
  unitCents,
  subtotalCents,
  taxCents,
  totalCents,
  quoteLoading,
  quoteError,
}) {
  const rows = [
    { label: t("stickerOrder.type.label"), value: t(`stickerOrder.type.${cuttingId}`) },
    { label: t("stickerOrder.size"), value: sizeLabel || "—" },
    { label: t("stickerOrder.material"), value: t(`stickerOrder.mat.${materialId}`) },
    { label: t("stickerOrder.quantity"), value: quantity > 0 ? quantity.toLocaleString() : "—" },
  ];

  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <dt className="text-gray-500">{r.label}</dt>
            <dd className="font-medium text-gray-800">{r.value}</dd>
          </div>
        ))}
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
      ) : unitCents > 0 ? (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">{t("stickerOrder.unitPrice")}</dt>
            <dd className="font-medium text-gray-800">{formatCad(unitCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">{t("stickerOrder.subtotal")}</dt>
            <dd className="font-medium text-gray-800">{formatCad(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">{t("stickerOrder.tax")}</dt>
            <dd className="text-gray-600">{formatCad(taxCents)}</dd>
          </div>
          <hr className="border-gray-100" />
          <div className="flex justify-between text-base font-bold">
            <dt>{t("stickerOrder.total")}</dt>
            <dd>{formatCad(totalCents)}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-center text-xs text-gray-400">{t("stickerOrder.selectOptions")}</p>
      )}
    </div>
  );
}
