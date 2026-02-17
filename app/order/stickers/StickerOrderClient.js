"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

// Shape illustrations for the type cards
const SHAPE_ILLUSTRATIONS = {
  "die-cut": (
    <svg viewBox="0 0 80 80" fill="none" className="h-12 w-12">
      <path d="M40 8C25 8 14 20 12 32c-2 14 6 26 18 32 6 3 14 4 20 0 8-5 14-14 16-24 2-12-6-24-18-30a20 20 0 0 0-8-2z" fill="#FCD34D" stroke="#92400E" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M30 36l6 6 14-14" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "kiss-cut": (
    <svg viewBox="0 0 80 80" fill="none" className="h-12 w-12">
      <rect x="8" y="8" width="64" height="64" rx="6" fill="#E0E7FF" stroke="#4338CA" strokeWidth="1.5" />
      <rect x="18" y="18" width="44" height="44" rx="22" fill="#C7D2FE" stroke="#4338CA" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="40" cy="40" r="8" fill="#818CF8" />
    </svg>
  ),
  sheets: (
    <svg viewBox="0 0 80 80" fill="none" className="h-12 w-12">
      <rect x="8" y="8" width="64" height="64" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
      <rect x="14" y="14" width="22" height="22" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
      <rect x="44" y="14" width="22" height="22" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
      <rect x="14" y="44" width="22" height="22" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
      <rect x="44" y="44" width="22" height="22" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
    </svg>
  ),
  "roll-labels": (
    <svg viewBox="0 0 80 80" fill="none" className="h-12 w-12">
      <ellipse cx="40" cy="40" rx="32" ry="18" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
      <ellipse cx="40" cy="40" rx="12" ry="18" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
      <circle cx="40" cy="40" r="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
    </svg>
  ),
  "vinyl-lettering": (
    <svg viewBox="0 0 80 80" fill="none" className="h-12 w-12">
      <rect x="8" y="20" width="64" height="40" rx="4" fill="#F3E8FF" stroke="#7C3AED" strokeWidth="1.5" />
      <text x="40" y="48" textAnchor="middle" fill="#7C3AED" fontSize="22" fontWeight="bold" fontFamily="sans-serif">ABC</text>
    </svg>
  ),
  decals: (
    <svg viewBox="0 0 80 80" fill="none" className="h-12 w-12">
      <rect x="8" y="8" width="64" height="64" rx="8" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
      <rect x="16" y="16" width="48" height="48" rx="4" fill="#FECACA" stroke="#DC2626" strokeWidth="1" strokeDasharray="4 3" />
      <path d="M32 40h16M40 32v16" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

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

/* ============================================================================
   MAIN COMPONENT — StickerYou-style product configurator
   ============================================================================ */
export default function StickerOrderClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { addItem, openCart } = useCartStore();

  // --- State ---
  const [cuttingId, setCuttingId] = useState(searchParams.get("type") || "die-cut");
  const cutting = useMemo(() => getCuttingType(cuttingId), [cuttingId]);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [unit, setUnit] = useState("in");
  const [materialId, setMaterialId] = useState(cutting.materials[0].id);
  const [quantity, setQuantity] = useState(cutting.quantities[2] ?? 100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [dimErrors, setDimErrors] = useState([]);
  const [activeStep, setActiveStep] = useState(1);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Derived dimensions
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

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

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
    if (widthIn <= 0 || heightIn <= 0) { setDimErrors([]); return; }
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

  // --- Tier pricing rows ---
  const tierRows = useMemo(() => {
    return cutting.quantities.map((q) => {
      const discount =
        q >= 1000 ? 0.82 : q >= 500 ? 0.88 : q >= 250 ? 0.93 : q >= 100 ? 0.97 : 1.0;
      return { qty: q, discount };
    });
  }, [cutting]);

  // --- Build cart item ---
  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
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
    setActiveStep(2);
    trackOptionChange({ slug, option: "cuttingType", value: id, quantity: activeQty });
  }
  function selectSize(idx) {
    setSizeIdx(idx);
    setCustomW("");
    setCustomH("");
    setActiveStep(3);
    trackOptionChange({ slug, option: "size", value: idx === -1 ? "custom" : cutting.sizes[idx]?.label, quantity: activeQty });
  }
  function selectMaterial(id) {
    setMaterialId(id);
    setActiveStep(4);
    trackOptionChange({ slug, option: "material", value: id, quantity: activeQty });
  }
  function selectQuantity(q) {
    setQuantity(q);
    setCustomQty("");
    setActiveStep(5);
    trackOptionChange({ slug, option: "quantity", value: q, quantity: q });
  }

  // Summary line items
  const summaryLines = [
    { label: t("stickerOrder.type.label"), value: t(`stickerOrder.type.${cuttingId}`) },
    {
      label: t("stickerOrder.size"),
      value: isCustomSize
        ? widthIn > 0 && heightIn > 0
          ? `${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}"`
          : "—"
        : cutting.sizes[sizeIdx]?.label || "—",
    },
    { label: t("stickerOrder.material"), value: t(`stickerOrder.mat.${materialId}`) },
    { label: t("stickerOrder.quantity"), value: activeQty > 0 ? activeQty.toLocaleString() : "—" },
  ];

  // Material descriptions for more info
  const MATERIAL_HINTS = {
    "white-vinyl": "Durable, waterproof, outdoor-safe",
    matte: "Non-glare, premium feel",
    clear: "Transparent, shows background through",
    holographic: "Rainbow sparkle, eye-catching",
    "glossy-paper": "Bright colors, indoor use",
    "white-bopp": "Tear-proof, water-resistant",
    "clear-bopp": "See-through, water-resistant",
    "kraft-paper": "Natural, eco-friendly look",
    silver: "Metallic shine, premium",
    outdoor: "UV & weather resistant",
    indoor: "Smooth finish, repositionable",
    reflective: "High visibility, safety-grade",
    perforated: "One-way vision, see-through",
    "floor-nonslip": "Anti-slip laminate, safety-rated",
  };

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: t("nav.shop"), href: "/shop" },
              { label: t("stickerOrder.stickers"), href: "/shop/stickers-labels-decals" },
              { label: t("stickerOrder.order") },
            ]}
            dark
          />
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {t("stickerOrder.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-300 sm:text-base">
            Choose your type, size, material and quantity — get instant pricing and order online.
          </p>
          {/* Trust row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400 sm:gap-6 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t("stickerOrder.badgeWaterproof")}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
              {t("stickerOrder.badgeShipping")}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t("stickerOrder.badgeProof")}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* ================================================================
              LEFT COLUMN — Configurator Steps (2/3)
              ================================================================ */}
          <div className="space-y-6 lg:col-span-2">

            {/* ── STEP 1: Product Type ── */}
            <ConfigStep number={1} title={t("stickerOrder.cuttingType")} subtitle="What kind of sticker do you need?">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CUTTING_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => selectCutting(ct.id)}
                    className={`group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                      cuttingId === ct.id
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-md"
                    }`}
                  >
                    {/* Selected indicator */}
                    {cuttingId === ct.id && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </span>
                    )}
                    <div className={`transition-transform duration-200 ${cuttingId === ct.id ? "scale-110" : "group-hover:scale-105"}`}>
                      {SHAPE_ILLUSTRATIONS[ct.id]}
                    </div>
                    <span className="text-sm font-bold">{t(`stickerOrder.type.${ct.id}`)}</span>
                    <span className={`text-[11px] leading-snug ${cuttingId === ct.id ? "text-gray-300" : "text-gray-400"}`}>
                      {t(`stickerOrder.typeDesc.${ct.id}`)}
                    </span>
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* ── STEP 2: Size ── */}
            <ConfigStep number={2} title={t("stickerOrder.size")} subtitle="Select a recommended size or enter custom dimensions">
              {/* Recommended sizes */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {cutting.sizes.map((s, i) => {
                  const isActive = sizeIdx === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSize(i)}
                      className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm"
                      }`}
                    >
                      {/* Size visual */}
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isActive ? "bg-white/10" : "bg-gray-50"}`}>
                        <div
                          className={`rounded-sm border ${isActive ? "border-white/40 bg-white/20" : "border-gray-300 bg-gray-100"}`}
                          style={{
                            width: `${Math.min(32, Math.max(14, s.w * 4))}px`,
                            height: `${Math.min(32, Math.max(14, s.h * 4))}px`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold">{s.label}</span>
                    </button>
                  );
                })}
                {/* Custom size button */}
                <button
                  type="button"
                  onClick={() => selectSize(-1)}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all duration-150 ${
                    isCustomSize
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isCustomSize ? "bg-white/10" : "bg-gray-50"}`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold">{t("stickerOrder.custom")}</span>
                </button>
              </div>

              {/* Custom size inputs */}
              {isCustomSize && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-xs font-medium text-gray-500">{t("stickerOrder.width")}</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={customW}
                        onChange={(e) => setCustomW(e.target.value)}
                        placeholder={unit === "in" ? '3.0"' : "7.6cm"}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      />
                    </div>
                    <span className="pb-3 text-lg font-light text-gray-300">×</span>
                    <div className="flex-1">
                      <label className="mb-1.5 block text-xs font-medium text-gray-500">{t("stickerOrder.height")}</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={customH}
                        onChange={(e) => setCustomH(e.target.value)}
                        placeholder={unit === "in" ? '3.0"' : "7.6cm"}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      />
                    </div>
                    {/* Unit toggle */}
                    <div className="flex overflow-hidden rounded-lg border border-gray-300">
                      {["in", "cm"].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnit(u)}
                          className={`px-3.5 py-2.5 text-xs font-bold uppercase transition ${
                            unit === u
                              ? "bg-gray-900 text-white"
                              : "bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Size range hint */}
                  <p className="mt-2 text-[11px] text-gray-400">
                    Min: {cutting.minIn}" × {cutting.minIn}" &nbsp;|&nbsp; Max: {cutting.maxW}" × {cutting.maxH}"
                  </p>
                </div>
              )}

              {/* Dimension errors */}
              {dimErrors.length > 0 && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  {dimErrors.map((e, i) => (
                    <p key={i} className="text-xs font-medium text-red-600">{e}</p>
                  ))}
                </div>
              )}
            </ConfigStep>

            {/* ── STEP 3: Material ── */}
            <ConfigStep number={3} title={t("stickerOrder.material")} subtitle="Choose the right finish for your stickers">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {cutting.materials.map((mat) => {
                  const isActive = materialId === mat.id;
                  const surcharge = mat.multiplier > 1 ? `+${Math.round((mat.multiplier - 1) * 100)}%` : null;
                  const hint = MATERIAL_HINTS[mat.id] || "";
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => selectMaterial(mat.id)}
                      className={`relative flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900/5"
                          : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-800">
                        {t(`stickerOrder.mat.${mat.id}`)}
                      </span>
                      <span className="text-[11px] leading-snug text-gray-400">{hint}</span>
                      {surcharge && (
                        <span className="mt-0.5 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {surcharge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ConfigStep>

            {/* ── STEP 4: Quantity ── */}
            <ConfigStep number={4} title={t("stickerOrder.quantity")} subtitle="More you order, more you save">
              {/* Preset quantity grid */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {cutting.quantities.map((q) => {
                  const isActive = customQty === "" && quantity === q;
                  const discount =
                    q >= 1000 ? 18 : q >= 500 ? 12 : q >= 250 ? 7 : q >= 100 ? 3 : 0;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => selectQuantity(q)}
                      className={`relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-base font-black">{q >= 1000 ? `${q / 1000}K` : q}</span>
                      {discount > 0 && (
                        <span className={`text-[10px] font-bold ${isActive ? "text-emerald-300" : "text-emerald-600"}`}>
                          Save {discount}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Custom quantity */}
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">{t("stickerOrder.customQty")}:</label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={customQty}
                  onChange={(e) => {
                    setCustomQty(e.target.value);
                    setActiveStep(5);
                    trackOptionChange({ slug, option: "quantity", value: e.target.value, quantity: parseInt(e.target.value, 10) || 0 });
                  }}
                  placeholder="e.g. 750"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </ConfigStep>

            {/* ── STEP 5: Upload Artwork ── */}
            <ConfigStep number={5} title={t("stickerOrder.artwork")} subtitle="Upload now or send later — it's optional" optional>
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center transition-colors hover:border-gray-400">
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-400">File uploaded successfully</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="ml-2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Drag & drop or click to upload</p>
                      <p className="mt-1 text-xs text-gray-400">PDF, AI, PNG, JPG — Max 16 MB</p>
                    </div>
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
                      appearance={{
                        button: "ut-ready:bg-gray-900 ut-ready:hover:bg-gray-800 ut-uploading:bg-gray-600 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors",
                        allowedContent: "hidden",
                      }}
                    />
                  </div>
                )}
              </div>
            </ConfigStep>
          </div>

          {/* ================================================================
              RIGHT COLUMN — Sticky Price Summary (1/3)
              ================================================================ */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* Live preview area */}
              <div className="flex items-center justify-center rounded-xl bg-gray-50 p-6">
                <div className="transition-all duration-300">
                  {SHAPE_ILLUSTRATIONS[cuttingId] ? (
                    <div className="scale-[2] transform">
                      {SHAPE_ILLUSTRATIONS[cuttingId]}
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-gray-200" />
                  )}
                </div>
              </div>

              {/* Summary title */}
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">
                {t("stickerOrder.summary")}
              </h2>

              {/* Summary details */}
              <dl className="space-y-2.5">
                {summaryLines.map((r) => (
                  <div key={r.label} className="flex items-center justify-between text-sm">
                    <dt className="text-gray-500">{r.label}</dt>
                    <dd className="font-semibold text-gray-800">{r.value}</dd>
                  </div>
                ))}
              </dl>

              <hr className="border-gray-100" />

              {/* Pricing */}
              {quoteLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              ) : quoteError ? (
                <p className="text-xs font-medium text-red-500">{quoteError}</p>
              ) : unitCents > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">{t("stickerOrder.unitPrice")}</span>
                    <span className="text-sm font-bold text-gray-800">{formatCad(unitCents)} / ea</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">{t("stickerOrder.subtotal")}</span>
                    <span className="text-sm font-medium text-gray-700">{formatCad(subtotalCents)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">{t("stickerOrder.tax")}</span>
                    <span className="text-sm text-gray-500">{formatCad(taxCents)}</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-gray-900">Total</span>
                    <span className="text-2xl font-black text-gray-900">{formatCad(totalCents)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 px-4 py-6 text-center">
                  <p className="text-xs text-gray-400">{t("stickerOrder.selectOptions")}</p>
                </div>
              )}

              {/* Volume discounts */}
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    const panel = e.currentTarget.nextElementSibling;
                    panel.classList.toggle("hidden");
                  }}
                  className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-gray-600"
                >
                  <span>{t("stickerOrder.volumeDiscounts")}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>
                <div className="mt-2 space-y-1 hidden">
                  {tierRows.map((row) => (
                    <div
                      key={row.qty}
                      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
                        activeQty === row.qty
                          ? "bg-gray-100 font-bold text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{row.qty.toLocaleString()}+</span>
                      <span>{row.discount < 1 ? `-${Math.round((1 - row.discount) * 100)}%` : t("stickerOrder.basePrice")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className={`w-full rounded-full px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                    canAddToCart
                      ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
                      : "cursor-not-allowed bg-gray-200 text-gray-400"
                  }`}
                >
                  {t("stickerOrder.addToCart")}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!canAddToCart || buyNowLoading}
                  className={`w-full rounded-full border-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                    canAddToCart && !buyNowLoading
                      ? "border-gray-900 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
                      : "cursor-not-allowed border-gray-200 text-gray-400"
                  }`}
                >
                  {buyNowLoading ? t("stickerOrder.processing") : t("stickerOrder.buyNow")}
                </button>
              </div>

              {/* Payment / trust badges */}
              <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <span>Secure checkout</span>
                <span className="text-gray-300">|</span>
                <span>Visa / MC / Amex</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ================================================================
          MOBILE — Fixed bottom price bar
          ================================================================ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-black text-gray-900">{formatCad(totalCents)}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {formatCad(unitCents)}/ea × {activeQty.toLocaleString()}
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
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-gray-900 text-white shadow-lg hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("stickerOrder.addToCart")}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canAddToCart || buyNowLoading}
            className={`shrink-0 rounded-full border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
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

/* ============================================================================
   Helper: ConfigStep — numbered step section
   ============================================================================ */
function ConfigStep({ number, title, subtitle, optional, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-black text-white">
          {number}
        </span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {optional && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                Optional
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
