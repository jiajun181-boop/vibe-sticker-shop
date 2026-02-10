"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";
import { validateDimensions } from "@/lib/materialLimits";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import { GuaranteeBadge } from "@/components/TrustBadges";
import GuaranteeInfo from "@/components/product/GuaranteeInfo";
import ReviewsSection from "@/components/product/ReviewsSection";
import { trackAddToCart } from "@/lib/analytics";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useRecentlyViewedStore } from "@/lib/recently-viewed";

const HST_RATE = 0.13;
const PRESET_QUANTITIES = [50, 100, 250, 500, 1000];
const INCH_TO_CM = 2.54;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function parseMaterials(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const direct = Array.isArray(optionsConfig.materials) ? optionsConfig.materials : [];
  const flattened = direct
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && typeof item.label === "string") return item.label;
      return null;
    })
    .filter(Boolean);
  return flattened;
}

export default function ProductClient({ product, relatedProducts }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const moved = searchParams?.get("moved") === "1";
  const movedFrom = searchParams?.get("from") || "";
  const movedFromLabel = useMemo(() => {
    if (!movedFrom) return "";
    try {
      return decodeURIComponent(movedFrom);
    } catch {
      return movedFrom;
    }
  }, [movedFrom]);

  const isPerSqft = product.pricingUnit === "per_sqft";
  const materials = parseMaterials(product.optionsConfig);
  const editorConfig = product.optionsConfig?.editor || null;
  const isTextEditor = editorConfig?.type === "text";
  const editorMode = editorConfig?.mode || "lettering"; // "lettering" | "box"
  const editorSizes = useMemo(() => {
    const sizes = Array.isArray(editorConfig?.sizes)
      ? editorConfig.sizes
      : Array.isArray(product.optionsConfig?.sizes)
        ? product.optionsConfig.sizes
        : [];

    return sizes
      .filter((s) => s && typeof s === "object" && typeof s.label === "string")
      .map((s) => ({
        label: s.label,
        shape: s.shape || "rect", // rect | round
        widthIn: typeof s.widthIn === "number" ? s.widthIn : null,
        heightIn: typeof s.heightIn === "number" ? s.heightIn : null,
        diameterIn: typeof s.diameterIn === "number" ? s.diameterIn : null,
        mm: s.mm || null,
        details: s.details || null,
        type: s.type || null,
        replacementPad: s.replacementPad || null,
      }));
  }, [editorConfig, product.optionsConfig]);
  const [editorSizeLabel, setEditorSizeLabel] = useState(editorSizes[0]?.label || "");
  const dimensionsEnabled = isPerSqft || isTextEditor;

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [material, setMaterial] = useState(materials[0] || "Standard Vinyl");
  const [unit, setUnit] = useState("in");
  const [widthIn, setWidthIn] = useState(product.minWidthIn || 3);
  const [heightIn, setHeightIn] = useState(product.minHeightIn || 3);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [uploadedArtwork, setUploadedArtwork] = useState(null); // { url, key, name, mime, size }
  const [added, setAdded] = useState(false);

  // Text editor state (vinyl lettering etc.)
  const editorFonts = useMemo(() => {
    const fonts = Array.isArray(editorConfig?.fonts) ? editorConfig.fonts : null;
    return fonts && fonts.length ? fonts : ["Montserrat", "Helvetica", "Arial", "sans-serif"];
  }, [editorConfig]);
  const [editorText, setEditorText] = useState(editorConfig?.defaultText || "YOUR TEXT");
  const [editorFont, setEditorFont] = useState(editorFonts[0] || "sans-serif");
  const [editorColor, setEditorColor] = useState(editorConfig?.defaultColor || "#111111");
  const selectedEditorSize = useMemo(
    () => editorSizes.find((s) => s.label === editorSizeLabel) || null,
    [editorSizes, editorSizeLabel]
  );

  // Server-driven pricing state
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const debounceRef = useRef(null);

  const imageList = product.images?.length ? product.images : [];

  // Track recently viewed
  useEffect(() => {
    useRecentlyViewedStore.getState().addViewed({
      slug: product.slug,
      category: product.category,
      name: product.name,
      image: product.images?.[0]?.url || null,
      basePrice: product.basePrice,
    });
  }, [product.slug]);

  const widthDisplay = unit === "in" ? widthIn : Number((widthIn * INCH_TO_CM).toFixed(2));
  const heightDisplay = unit === "in" ? heightIn : Number((heightIn * INCH_TO_CM).toFixed(2));

  const sizeValidation = useMemo(() => {
    if (!dimensionsEnabled) return { valid: true, errors: [] };
    return validateDimensions(widthIn, heightIn, material, product);
  }, [widthIn, heightIn, material, product, dimensionsEnabled]);

  // Debounced /api/quote fetch (300ms)
  const fetchQuote = useCallback(
    async (slug, qty, w, h, mat, sizeLabel) => {
      const body = { slug, quantity: qty };
      if (dimensionsEnabled) {
        body.widthIn = w;
        body.heightIn = h;
      }
      if (mat) body.material = mat;
      if (sizeLabel) body.sizeLabel = sizeLabel;

      try {
        setQuoteLoading(true);
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return; // silently fail — sizeValidation shows dimension errors
        const data = await res.json();
        setQuote(data);
      } catch {
        // network error — keep previous quote
      } finally {
        setQuoteLoading(false);
      }
    },
    [dimensionsEnabled]
  );

  useEffect(() => {
    if (!sizeValidation.valid) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const sizeLabel = isTextEditor && editorMode === "box" ? editorSizeLabel : null;
      fetchQuote(product.slug, quantity, widthIn, heightIn, material, sizeLabel);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [product.slug, quantity, widthIn, heightIn, material, editorSizeLabel, isTextEditor, editorMode, sizeValidation.valid, fetchQuote]);

  // If the product uses a text editor, derive width from text + letter height.
  useEffect(() => {
    if (!isTextEditor) return;
    if (editorMode !== "lettering") return;
    const text = String(editorText || "").trim();
    if (!text) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const basePx = 200;
      ctx.font = `${basePx}px ${editorFont}`;
      const pxWidth = ctx.measureText(text).width;
      const ratio = pxWidth / basePx;

      const nextWidth = Math.max(0.5, Number((ratio * Number(heightIn || 1)).toFixed(2)));
      setWidthIn(nextWidth);
    } catch {
      // keep previous widthIn
    }
  }, [isTextEditor, editorText, editorFont, heightIn]);

  // If "box" mode (stamps), dimensions come from a fixed size selection.
  useEffect(() => {
    if (!isTextEditor) return;
    if (editorMode !== "box") return;
    if (!editorSizeLabel) return;

    const size = editorSizes.find((s) => s.label === editorSizeLabel) || null;
    if (!size) return;

    const w = size.shape === "round" ? size.diameterIn : size.widthIn;
    const h = size.shape === "round" ? size.diameterIn : size.heightIn;
    if (typeof w === "number" && typeof h === "number") {
      setUnit("in");
      setWidthIn(Number(w.toFixed(3)));
      setHeightIn(Number(h.toFixed(3)));
    }
  }, [isTextEditor, editorMode, editorSizeLabel, editorSizes]);

  // Derive display prices from quote (fallback to basePrice estimate)
  const priceData = useMemo(() => {
    const qty = Number(quantity) || 1;
    if (quote) {
      const subtotal = quote.totalCents;
      const tax = Math.round(subtotal * HST_RATE);
      const unitAmount = quote.unitCents || Math.round(subtotal / qty);
      const sqft = quote.meta?.sqftPerUnit ?? null;
      return { unitAmount, subtotal, tax, total: subtotal + tax, sqft, breakdown: quote.breakdown };
    }
    // Fallback while loading
    const baseUnitCents = product.basePrice;
    if (dimensionsEnabled) {
      const sqft = (Number(widthIn) * Number(heightIn)) / 144;
      const unitAmount = Math.max(1, Math.round(baseUnitCents * sqft));
      const subtotal = unitAmount * qty;
      const tax = Math.round(subtotal * HST_RATE);
      return { unitAmount, subtotal, tax, total: subtotal + tax, sqft, breakdown: null };
    }
    const unitAmount = Math.max(1, baseUnitCents);
    const subtotal = unitAmount * qty;
    const tax = Math.round(subtotal * HST_RATE);
    return { unitAmount, subtotal, tax, total: subtotal + tax, sqft: null, breakdown: null };
  }, [quote, quantity, product.basePrice, widthIn, heightIn, isPerSqft]);

  // Tier rows — quick client estimates for the tier table
  const tierRows = useMemo(
    () =>
      PRESET_QUANTITIES.map((q) => {
        const base = dimensionsEnabled
          ? product.basePrice * ((widthIn * heightIn) / 144 || 1)
          : product.basePrice;
        // Simple volume discount estimate
        let disc = 1;
        if (q >= 1000) disc = 0.82;
        else if (q >= 500) disc = 0.88;
        else if (q >= 250) disc = 0.93;
        else if (q >= 100) disc = 0.97;
        return { qty: q, unitAmount: Math.max(1, Math.round(base * disc)) };
      }),
    [product.basePrice, dimensionsEnabled, widthIn, heightIn]
  );

  const specs = [
    [t("product.spec.productType"), product.type],
    [t("product.spec.pricingUnit"), product.pricingUnit === "per_sqft" ? t("product.spec.perSqft") : t("product.spec.perPiece")],
    [t("product.spec.minSize"), product.minWidthIn && product.minHeightIn ? `${product.minWidthIn}" x ${product.minHeightIn}"` : t("product.spec.na")],
    [t("product.spec.maxSize"), product.maxWidthIn && product.maxHeightIn ? `${product.maxWidthIn}" x ${product.maxHeightIn}"` : t("product.spec.na")],
    [t("product.spec.minDpi"), product.minDpi ? String(product.minDpi) : t("product.spec.na")],
    [t("product.spec.bleed"), product.requiresBleed ? t("product.spec.bleedRequired", { inches: product.bleedIn || 0.125 }) : t("product.spec.bleedNotRequired")],
  ];

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview("");
    }
  }

  function setSizeValue(type, value) {
    const n = Math.max(0.5, Number(value) || 0.5);
    const inValue = unit === "in" ? n : n / INCH_TO_CM;
    if (type === "w") setWidthIn(Number(inValue.toFixed(2)));
    if (type === "h") setHeightIn(Number(inValue.toFixed(2)));
  }

  const canAddToCart = sizeValidation.valid;

  function handleAddToCart() {
    if (!canAddToCart) return;

    const artworkMeta = uploadedArtwork
      ? {
          artworkUrl: uploadedArtwork.url,
          artworkKey: uploadedArtwork.key,
          artworkName: uploadedArtwork.name,
          artworkMime: uploadedArtwork.mime,
          artworkSize: uploadedArtwork.size,
        }
      : {
          artworkUrl: null,
          artworkKey: null,
          artworkName: null,
          artworkMime: null,
          artworkSize: null,
        };

    const editorMeta = isTextEditor
      ? {
          editorType: "text",
          editorMode,
          editorSizeLabel: editorMode === "box" ? editorSizeLabel : null,
          editorText: String(editorText || "").trim(),
          editorFont: String(editorFont || ""),
          editorColor: String(editorColor || ""),
        }
      : {
          editorType: null,
          editorMode: null,
          editorSizeLabel: null,
          editorText: null,
          editorFont: null,
          editorColor: null,
        };

    const item = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitAmount: priceData.unitAmount,
      quantity: Number(quantity),
      image: imageList[0]?.url || null,
      meta: {
        width: dimensionsEnabled ? widthIn : null,
        height: dimensionsEnabled ? heightIn : null,
        material,
        fileName: file?.name || null,
        pricingUnit: product.pricingUnit,
        ...artworkMeta,
        ...editorMeta,
      },
      id: product.id,
      price: priceData.unitAmount,
      options: {
        width: dimensionsEnabled ? widthIn : null,
        height: dimensionsEnabled ? heightIn : null,
        material,
        fileName: file?.name || null,
        pricingUnit: product.pricingUnit,
        ...artworkMeta,
        ...editorMeta,
      },
    };

    addItem(item);
    openCart();
    trackAddToCart({ name: product.name, value: priceData.subtotal });
    showSuccessToast(t("product.addedToCart"));
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
  }

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
          <Link href="/shop" className="hover:text-gray-900">{t("product.shop")}</Link> /{" "}
          <Link href={`/shop?category=${product.category}`} className="hover:text-gray-900">{product.category}</Link> /{" "}
          <span className="text-gray-900">{product.name}</span>
        </div>

        {moved && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {movedFromLabel ? t("product.movedCategoryFrom", { from: movedFromLabel }) : t("product.movedCategory")}
          </div>
        )}

        <section className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-gray-200 bg-white">
              {imageList[activeImage]?.url ? (
                <Image
                  src={imageList[activeImage].url}
                  alt={imageList[activeImage].alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">{t("product.noImage")}</div>
              )}
            </div>

            {imageList.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {imageList.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square overflow-hidden rounded-xl border ${activeImage === idx ? "border-gray-900" : "border-gray-200"}`}
                  >
                    <Image src={img.url} alt={img.alt || product.name} fill className="object-cover" sizes="20vw" />
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">{t("product.specifications")}</h3>
              <div className="mt-3 divide-y divide-gray-100">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
              {product.templateUrl && (
                <a href={product.templateUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 hover:text-gray-900">
                  {t("product.installationGuide")}
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <header>
              <h1 className="text-4xl font-semibold tracking-tight">{product.name}</h1>
              <p className="mt-3 text-sm text-gray-600">{product.description || t("product.defaultDescription")}</p>
            </header>

            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {t("product.realtimePricing")}
              {quoteLoading && <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />}
                </p>
                <p className={`text-sm font-semibold ${quoteLoading ? "text-gray-400" : "text-gray-900"}`}>{formatCad(priceData.unitAmount)} {t("product.unit")}</p>
              </div>

                {isTextEditor && (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.textEditor")}</p>

                    {editorMode === "box" && editorSizes.length > 0 && (
                      <label className="text-xs text-gray-600">
                        {t("product.model")}
                        <select
                          value={editorSizeLabel}
                          onChange={(e) => setEditorSizeLabel(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          {editorSizes.map((s) => (
                            <option key={s.label} value={s.label}>{s.label}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    {editorMode === "box" && selectedEditorSize && (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.modelDetails")}</p>
                          <p className="text-xs font-semibold text-gray-900">{selectedEditorSize.label}</p>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-gray-700">
                          {selectedEditorSize.type && (
                            <p>
                              <span className="font-semibold text-gray-900">{t("product.stampType")}: </span>
                              <span>{selectedEditorSize.type}</span>
                            </p>
                          )}
                          {selectedEditorSize.shape === "round" ? (
                            typeof selectedEditorSize.diameterIn === "number" && (
                              <p>
                                <span className="font-semibold text-gray-900">{t("product.size")}: </span>
                                <span>
                                  {t("product.diameter")}: {selectedEditorSize.diameterIn}"{selectedEditorSize.mm?.d ? ` (${selectedEditorSize.mm.d}mm)` : ""}
                                </span>
                              </p>
                            )
                          ) : (
                            typeof selectedEditorSize.widthIn === "number" &&
                            typeof selectedEditorSize.heightIn === "number" && (
                              <p>
                                <span className="font-semibold text-gray-900">{t("product.size")}: </span>
                                <span>
                                  {selectedEditorSize.widthIn}" x {selectedEditorSize.heightIn}"{selectedEditorSize.mm?.w && selectedEditorSize.mm?.h ? ` (${selectedEditorSize.mm.w} x ${selectedEditorSize.mm.h}mm)` : ""}
                                </span>
                              </p>
                            )
                          )}
                          {selectedEditorSize.details && (
                            <p>
                              <span className="font-semibold text-gray-900">{t("product.details")}: </span>
                              <span>{selectedEditorSize.details}</span>
                            </p>
                          )}
                          {selectedEditorSize.replacementPad && (
                            <p>
                              <span className="font-semibold text-gray-900">{t("product.replacementPad")}: </span>
                              <span>{selectedEditorSize.replacementPad}</span>
                            </p>
                          )}
                        </div>
                        <p className="mt-3 text-[11px] text-gray-500">{t("product.previewNote")}</p>
                      </div>
                    )}

                    <label className="text-xs text-gray-600">
                      {t("product.text")}
                      <textarea
                        rows={editorMode === "box" ? 3 : 1}
                        value={editorText}
                        onChange={(e) => setEditorText(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        placeholder="ABC"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-gray-600">
                        {t("product.font")}
                        <select
                          value={editorFont}
                          onChange={(e) => setEditorFont(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          {editorFonts.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs text-gray-600">
                        {t("product.color")}
                        <input
                          type="color"
                          value={editorColor}
                          onChange={(e) => setEditorColor(e.target.value)}
                          className="mt-1 h-[42px] w-full rounded-xl border border-gray-300 bg-white px-2 py-2"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.sizeUnit")}</p>
                      <div className="rounded-full border border-gray-300 p-1 text-xs">
                        <button onClick={() => setUnit("in")} className={`rounded-full px-3 py-1 ${unit === "in" ? "bg-gray-900 text-white" : "text-gray-600"}`}>{t("product.inches")}</button>
                        <button onClick={() => setUnit("cm")} className={`rounded-full px-3 py-1 ${unit === "cm" ? "bg-gray-900 text-white" : "text-gray-600"}`}>{t("product.cm")}</button>
                      </div>
                    </div>

                    {editorMode === "lettering" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs text-gray-600">
                          {t("product.letterHeight", { unit })}
                          <input
                            type="number"
                            value={heightDisplay}
                            onChange={(e) => setSizeValue("h", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-xs text-gray-600">
                          {t("product.width", { unit })}
                          <input
                            type="number"
                            value={widthDisplay}
                            readOnly
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs text-gray-600">
                          {t("product.width", { unit })}
                          <input
                            type="number"
                            value={widthDisplay}
                            readOnly
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                          />
                        </label>
                        <label className="text-xs text-gray-600">
                          {t("product.height", { unit })}
                          <input
                            type="number"
                            value={heightDisplay}
                            readOnly
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                          />
                        </label>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">{t("product.estimatedSize", { w: widthIn?.toFixed(2), h: heightIn?.toFixed(2) })}</p>

                    <div className="rounded-2xl border border-gray-200 bg-white p-3">
                      <div className="aspect-[3/1] w-full overflow-hidden rounded-xl bg-gray-50">
                        <svg viewBox="0 0 1000 300" className="h-full w-full">
                          <rect x="0" y="0" width="1000" height="300" fill="white" />
                          {editorMode === "box" ? (
                            <>
                              <rect x="60" y="40" width="880" height="220" rx="26" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                              <text
                                x="500"
                                y="150"
                                fill={editorColor}
                                fontFamily={editorFont}
                                fontSize="92"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {(String(editorText || "").trim() || " ").split("\n")[0]}
                              </text>
                              <text
                                x="500"
                                y="210"
                                fill={editorColor}
                                fontFamily={editorFont}
                                fontSize="72"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {(String(editorText || "").trim() || " ").split("\n")[1] || " "}
                              </text>
                            </>
                          ) : (
                            <text
                              x="40"
                              y="200"
                              fill={editorColor}
                              fontFamily={editorFont}
                              fontSize="160"
                              style={{ letterSpacing: "2px" }}
                            >
                              {String(editorText || "").trim() || " "}
                            </text>
                          )}
                        </svg>
                      </div>
                    </div>

                    {!sizeValidation.valid && (
                      <div className="mt-1 space-y-1">
                        {sizeValidation.errors.map((err, i) => (
                          <p key={i} className="text-xs text-red-500">{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              {isPerSqft && !isTextEditor && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.sizeUnit")}</p>
                    <div className="rounded-full border border-gray-300 p-1 text-xs">
                      <button onClick={() => setUnit("in")} className={`rounded-full px-3 py-1 ${unit === "in" ? "bg-gray-900 text-white" : "text-gray-600"}`}>{t("product.inches")}</button>
                      <button onClick={() => setUnit("cm")} className={`rounded-full px-3 py-1 ${unit === "cm" ? "bg-gray-900 text-white" : "text-gray-600"}`}>{t("product.cm")}</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-gray-600">
                      {t("product.width", { unit })}
                      <input
                        type="number"
                        value={widthDisplay}
                        onChange={(e) => setSizeValue("w", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs text-gray-600">
                      {t("product.height", { unit })}
                      <input
                        type="number"
                        value={heightDisplay}
                        onChange={(e) => setSizeValue("h", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">{t("product.areaPerUnit", { sqft: priceData.sqft?.toFixed(3) })}</p>
                  {!sizeValidation.valid && (
                    <div className="mt-1 space-y-1">
                      {sizeValidation.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-500">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {materials.length > 0 && (
                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.material")}</label>
                  <select value={material} onChange={(e) => setMaterial(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
                    {materials.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.quantity")}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-full border border-gray-300">-</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm" />
                  <button onClick={() => setQuantity((q) => q + 1)} className="h-9 w-9 rounded-full border border-gray-300">+</button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.tierPricing")}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {tierRows.map((row) => (
                    <div key={row.qty} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                      <span>{row.qty}{t("product.pcs")}</span>
                      <span className="font-semibold">{formatCad(row.unitAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.artworkUpload")}</label>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-2 text-xs text-gray-600">{t("product.uploadHint")}</p>
                  <UploadButton
                    endpoint="artworkUploader"
                    onClientUploadComplete={(res) => {
                      const first = Array.isArray(res) ? res[0] : null;
                      if (!first) return;
                      setUploadedArtwork({
                        url: first.url || null,
                        key: first.key || null,
                        name: first.name || null,
                        mime: first.type || first.mime || null,
                        size: first.size || null,
                      });
                    }}
                    onUploadError={(e) => {
                      console.error("[uploadthing]", e);
                    }}
                  />

                  {uploadedArtwork?.url && (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900">{t("product.uploaded", { name: uploadedArtwork.name || "File" })}</p>
                        <a href={uploadedArtwork.url} target="_blank" rel="noreferrer" className="truncate text-[11px] text-gray-500 underline">
                          {uploadedArtwork.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedArtwork(null)}
                        className="rounded-full border border-gray-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-700"
                      >
                        {t("product.removeUpload")}
                      </button>
                    </div>
                  )}
                </div>

                <input type="file" onChange={onFileChange} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm" />
                {filePreview && (
                  <div className="relative mt-2 aspect-video overflow-hidden rounded-xl border border-gray-200">
                    <Image src={filePreview} alt="Upload preview" fill className="object-contain" sizes="50vw" />
                  </div>
                )}
                {file && !filePreview && <p className="text-xs text-gray-600">{t("product.fileAttached", { name: file.name })}</p>}
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 p-4">
                {priceData.breakdown && priceData.breakdown.length > 0 && (
                  <div className="mb-3 space-y-1 border-b border-gray-100 pb-3">
                    {priceData.breakdown.map((line, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                        <span>{line.label}</span>
                        <span>{formatCad(line.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span>{t("product.subtotal")}</span>
                  <span className="font-semibold">{formatCad(priceData.subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>{t("product.tax")}</span>
                  <span className="font-semibold">{formatCad(priceData.tax)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold">
                  <span>{t("product.total")}</span>
                  <span>{formatCad(priceData.total)} {t("product.cad")}</span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`mt-6 w-full rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-200 ${
                  !canAddToCart
                    ? "bg-gray-300 cursor-not-allowed"
                    : added
                      ? "bg-emerald-600"
                      : "bg-gray-900 hover:bg-black"
                }`}
              >
                {!canAddToCart ? t("product.fixSizeErrors") : added ? t("product.added") : t("product.addToCart")}
              </button>

              <div className="mt-4">
                <GuaranteeBadge />
              </div>
            </div>

            <GuaranteeInfo />
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("product.relatedProducts")}</h2>
            <Link href={`/shop?category=${product.category}`} className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 hover:text-gray-900">{t("product.viewCategory")}</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/shop/${item.category}/${item.slug}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {item.images[0]?.url ? (
                    <Image src={item.images[0].url} alt={item.images[0].alt || item.name} fill className="object-cover" sizes="25vw" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">{t("product.noImageSmall")}</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-gray-600">{t("product.from", { price: formatCad(item.basePrice) })}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <ReviewsSection />
        <RecentlyViewed excludeSlug={product.slug} />
      </div>
    </main>
  );
}
