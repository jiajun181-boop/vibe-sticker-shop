"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getCuttingType, resolveProductSlug } from "@/lib/sticker-order-config";
import { ShapeIcon } from "./ShapeIcon";
import { showSuccessToast } from "@/components/Toast";

const HST_RATE = 0.13;
const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const MATERIAL_HINTS = {
  "white-vinyl": "Durable, waterproof",
  matte: "Non-glare, premium",
  clear: "Transparent",
  holographic: "Rainbow sparkle",
  "glossy-paper": "Bright, indoor use",
  "white-bopp": "Tear-proof",
  "clear-bopp": "See-through",
  "kraft-paper": "Eco-friendly",
  silver: "Metallic shine",
  outdoor: "UV resistant",
  indoor: "Repositionable",
  reflective: "High visibility",
  perforated: "One-way vision",
  "floor-nonslip": "Anti-slip",
  "magnetic-vinyl": "Magnetic",
  "white-cling": "Static cling",
  "clear-cling": "Clear static",
  "transfer-vinyl": "Transfer vinyl",
};

export default function MiniConfigurator({ cuttingTypeId, onClose }) {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();
  const cutting = useMemo(() => getCuttingType(cuttingTypeId), [cuttingTypeId]);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [materialId, setMaterialId] = useState(cutting.materials[0]?.id);
  const [quantity, setQuantity] = useState(cutting.quantities[2] ?? cutting.quantities[0] ?? 100);
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const size = cutting.sizes[sizeIdx];
  const widthIn = size?.w ?? 0;
  const heightIn = size?.h ?? 0;
  const slug = useMemo(() => resolveProductSlug(cuttingTypeId, materialId), [cuttingTypeId, materialId]);

  // --- Fetch quote (debounced) ---
  const fetchQuote = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (widthIn <= 0 || heightIn <= 0 || quantity <= 0) {
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
        quantity,
        widthIn,
        heightIn,
        material: materialId,
        sizeLabel: size?.label,
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
  }, [slug, widthIn, heightIn, quantity, materialId, size]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => {
      clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchQuote]);

  // Escape key closes
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // --- Price ---
  const unitCents = quoteData?.unitCents ?? 0;
  const subtotalCents = quoteData?.totalCents ?? 0;
  const taxCents = Math.round(subtotalCents * HST_RATE);
  const totalCents = subtotalCents + taxCents;
  const canAdd = quoteData && !quoteLoading && quantity > 0;

  function handleAddToCart() {
    if (!canAdd) return;
    const sizeLabel = size?.label || `${widthIn}" × ${heightIn}"`;
    addItem({
      id: slug,
      name: `${t(`stickerOrder.type.${cuttingTypeId}`)} — ${sizeLabel}`,
      slug,
      price: unitCents,
      quantity,
      options: {
        cuttingType: cuttingTypeId,
        width: widthIn,
        height: heightIn,
        sizeLabel,
        material: materialId,
        materialName: t(`stickerOrder.mat.${materialId}`),
      },
      forceNewLine: true,
    });
    openCart();
    showSuccessToast(t("stickerOrder.addedToCart"));
  }

  const typeLabel = t(`stickerOrder.type.${cuttingTypeId}`) || cuttingTypeId;

  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 shadow-lg sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <ShapeIcon type={cuttingTypeId} className="h-8 w-8" />
          <h3 className="text-base font-bold text-[var(--color-gray-900)]">{typeLabel}</h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-gray-400)] transition-colors hover:bg-[var(--color-gray-100)] hover:text-[var(--color-gray-700)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {/* SIZE */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-gray-500)]">
            Size
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {cutting.sizes.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSizeIdx(i)}
                className={`rounded-lg border-2 px-2 py-2 text-center transition-all ${
                  sizeIdx === i
                    ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-white"
                    : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                }`}
              >
                <span className="block text-xs font-bold">{s.label}</span>
              </button>
            ))}
          </div>
          <Link
            href={`/order/stickers?type=${cuttingTypeId}`}
            className="mt-2 inline-block text-[11px] text-[var(--color-gray-400)] underline decoration-dotted hover:text-[var(--color-gray-700)]"
          >
            Need custom size?
          </Link>
        </div>

        {/* MATERIAL */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-gray-500)]">
            Material
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {cutting.materials.map((mat) => {
              const isActive = materialId === mat.id;
              const surcharge = mat.multiplier > 1 ? Math.round((mat.multiplier - 1) * 100) : 0;
              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => setMaterialId(mat.id)}
                  className={`rounded-lg border-2 px-2 py-2 text-left transition-all ${
                    isActive
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-white"
                      : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                  }`}
                >
                  <span className="block text-xs font-bold leading-tight">
                    {t(`stickerOrder.mat.${mat.id}`) || mat.id}
                  </span>
                  <span className={`text-[10px] ${isActive ? "text-gray-300" : "text-[var(--color-gray-400)]"}`}>
                    {MATERIAL_HINTS[mat.id] || ""}
                    {surcharge > 0 && (
                      <span className={`ml-1 font-bold ${isActive ? "text-amber-300" : "text-amber-600"}`}>
                        +{surcharge}%
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* QUANTITY */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-gray-500)]">
            Quantity
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {cutting.quantities.map((q) => {
              const isActive = quantity === q;
              const discount = q >= 1000 ? 18 : q >= 500 ? 12 : q >= 250 ? 7 : q >= 100 ? 3 : 0;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`flex flex-col items-center rounded-lg border-2 px-2 py-2 transition-all ${
                    isActive
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-white"
                      : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                  }`}
                >
                  <span className="text-xs font-black">{q >= 1000 ? `${q / 1000}K` : q}</span>
                  {discount > 0 && (
                    <span className={`text-[9px] font-bold ${isActive ? "text-emerald-300" : "text-emerald-600"}`}>
                      -{discount}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRICE + ACTIONS */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl bg-[var(--color-gray-50)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {quoteLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-gray-300)] border-t-[var(--color-gray-700)]" />
              <span className="text-xs text-[var(--color-gray-400)]">Calculating...</span>
            </div>
          ) : quoteError ? (
            <p className="text-xs text-red-500">
              Price unavailable &mdash;{" "}
              <Link href={`/order/stickers?type=${cuttingTypeId}`} className="underline">
                try full configurator
              </Link>
            </p>
          ) : quoteData ? (
            <div>
              <p className="text-lg font-black text-[var(--color-gray-900)]">{formatCad(totalCents)}</p>
              <p className="text-[11px] text-[var(--color-gray-500)]">
                {formatCad(unitCents)}/ea &times; {quantity.toLocaleString()} + {formatCad(taxCents)} HST
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-gray-400)]">Select options to see price</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/order/stickers?type=${cuttingTypeId}`}
            className="rounded-lg border border-[var(--color-gray-300)] px-3 py-2 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-500)] hover:text-[var(--color-gray-900)]"
          >
            Full options
          </Link>
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleAddToCart}
            className="rounded-lg bg-[var(--color-gray-900)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
