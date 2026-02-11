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
import { GuaranteeBadge, PaymentBadges } from "@/components/TrustBadges";
import GuaranteeInfo from "@/components/product/GuaranteeInfo";
import ReviewsSection from "@/components/product/ReviewsSection";
import ImageGallery from "@/components/product/ImageGallery";
import SizeSelector from "@/components/product/SizeSelector";
import { trackAddToCart } from "@/lib/analytics";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useRecentlyViewedStore } from "@/lib/recently-viewed";
import Breadcrumbs from "@/components/Breadcrumbs";
import TemplateGallery from "@/components/product/TemplateGallery";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";

const HST_RATE = 0.13;
const PRESET_QUANTITIES = [50, 100, 250, 500, 1000];
const INCH_TO_CM = 2.54;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function applyAllowlist(items, allowIds) {
  if (!Array.isArray(items)) return [];
  if (!Array.isArray(allowIds)) return items;
  const allow = new Set(allowIds.map(String));
  return items.filter((x) => x && typeof x === "object" && allow.has(String(x.id)));
}

function parseMaterials(optionsConfig, presetConfig) {
  // Priority: pricingPreset materials > optionsConfig materials
  if (presetConfig && Array.isArray(presetConfig.materials) && presetConfig.materials.length > 0) {
    return presetConfig.materials
      .filter((m) => m && typeof m === "object" && m.id)
      .map((m) => ({
        id: m.id,
        name: m.name || m.id,
        multiplier: typeof m.multiplier === "number" ? m.multiplier : 1.0,
      }));
  }
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const direct = Array.isArray(optionsConfig.materials) ? optionsConfig.materials : [];
  return direct
    .map((item) => {
      if (typeof item === "string") return { id: item, name: item, multiplier: 1.0 };
      if (item && typeof item === "object" && typeof item.label === "string")
        return { id: item.id || item.label, name: item.label, multiplier: typeof item.multiplier === "number" ? item.multiplier : 1.0 };
      return null;
    })
    .filter(Boolean);
}

function parseFinishings(presetConfig) {
  if (!presetConfig || !Array.isArray(presetConfig.finishings)) return [];
  return presetConfig.finishings
    .filter((f) => f && typeof f === "object" && f.id)
    .map((f) => ({
      id: f.id,
      name: f.name || f.id,
      type: f.type || "flat",
      price: typeof f.price === "number" ? f.price : 0,
    }));
}

function parseAddons(optionsConfig, presetConfig) {
  // Priority: pricingPreset addons > optionsConfig addons
  if (presetConfig && Array.isArray(presetConfig.addons) && presetConfig.addons.length > 0) {
    return presetConfig.addons
      .filter((a) => a && typeof a === "object" && a.id)
      .map((a) => ({
        id: a.id,
        name: a.name || a.id,
        description: typeof a.description === "string" ? a.description : "",
        price: typeof a.price === "number" ? a.price : 0,
        type: a.type || "per_unit",
      }));
  }
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const list = Array.isArray(optionsConfig.addons) ? optionsConfig.addons : [];
  return list
    .filter((addon) => addon && typeof addon === "object" && typeof addon.id === "string")
    .map((addon) => ({
      id: addon.id,
      name: typeof addon.name === "string" ? addon.name : addon.id,
      description: typeof addon.description === "string" ? addon.description : "",
      price: typeof addon.price === "number" ? addon.price : 0,
      type: addon.type || "per_unit",
    }));
}

function parseScenes(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const scenes = Array.isArray(optionsConfig.scenes) ? optionsConfig.scenes : [];
  return scenes
    .filter((scene) => scene && typeof scene === "object" && typeof scene.id === "string")
    .map((scene) => ({
      id: scene.id,
      label: typeof scene.label === "string" ? scene.label : scene.id,
      description: typeof scene.description === "string" ? scene.description : "",
      defaultMaterial: typeof scene.defaultMaterial === "string" ? scene.defaultMaterial : null,
      defaultWidthIn: typeof scene.defaultWidthIn === "number" ? scene.defaultWidthIn : null,
      defaultHeightIn: typeof scene.defaultHeightIn === "number" ? scene.defaultHeightIn : null,
      defaultAddons: Array.isArray(scene.defaultAddons) ? scene.defaultAddons.filter((id) => typeof id === "string") : [],
    }));
}

function parseSizeOptions(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const sizes = Array.isArray(optionsConfig.sizes) ? optionsConfig.sizes : [];
  return sizes
    .filter((item) => item && typeof item === "object" && typeof item.label === "string")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : item.label,
      label: item.label,
      displayLabel: typeof item.displayLabel === "string" ? item.displayLabel : null,
      widthIn: typeof item.widthIn === "number" ? item.widthIn : null,
      heightIn: typeof item.heightIn === "number" ? item.heightIn : null,
      notes: typeof item.notes === "string" ? item.notes : "",
      quantityChoices: Array.isArray(item.quantityChoices)
        ? item.quantityChoices.map((q) => Number(q)).filter((q) => Number.isFinite(q) && q > 0)
        : [],
      priceByQty: item.priceByQty && typeof item.priceByQty === "object" ? item.priceByQty : null,
    }));
}

function parseQuantityRange(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return null;
  const q = optionsConfig.quantityRange;
  if (!q || typeof q !== "object") return null;
  const min = Number(q.min);
  const max = Number(q.max);
  const step = Number(q.step || 1);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) return null;
  return { min, max, step: Number.isFinite(step) && step > 0 ? step : 1 };
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
  const presetConfig = product.pricingPreset?.config || null;
  const uiConfig = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig.ui || null : null;
  const hideTierPricing = uiConfig?.hideTierPricing === true;
  const hideMaterials = uiConfig?.hideMaterials === true;
  const hideAddons = uiConfig?.hideAddons === true;
  const hideFinishings = uiConfig?.hideFinishings === true;

  const materials = applyAllowlist(parseMaterials(product.optionsConfig, presetConfig), uiConfig?.allowedMaterials);
  const finishings = applyAllowlist(parseFinishings(presetConfig), uiConfig?.allowedFinishings);
  const addons = applyAllowlist(parseAddons(product.optionsConfig, presetConfig), uiConfig?.allowedAddons);
  const scenes = parseScenes(product.optionsConfig);
  const sizeOptions = parseSizeOptions(product.optionsConfig);
  const quantityRange = parseQuantityRange(product.optionsConfig);
  const envelopeVariantConfig = useMemo(() => {
    const regex = /^(?<base>.+) - (?<color>Black Ink|Color)$/;
    const variants = sizeOptions
      .map((s) => {
        const m = typeof s.label === "string" ? s.label.match(regex) : null;
        if (!m?.groups?.base || !m?.groups?.color) return null;
        return { base: m.groups.base, color: m.groups.color, option: s };
      })
      .filter(Boolean);

    if (!variants.length) return { enabled: false, bases: [], byBase: {} };

    const byBase = {};
    for (const v of variants) {
      if (!byBase[v.base]) byBase[v.base] = {};
      byBase[v.base][v.color] = v.option;
    }
    const bases = Object.keys(byBase).sort((a, b) => a.localeCompare(b));
    return { enabled: true, bases, byBase };
  }, [sizeOptions]);
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

  const [quantity, setQuantity] = useState(quantityRange?.min || 100);
  const [material, setMaterial] = useState(() => {
    const candidate = typeof uiConfig?.defaultMaterialId === "string" ? uiConfig.defaultMaterialId : "";
    if (candidate && materials.some((m) => m.id === candidate)) return candidate;
    return materials[0]?.id || candidate || "";
  });
  const [sceneId, setSceneId] = useState(scenes[0]?.id || "");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedFinishings, setSelectedFinishings] = useState([]);
  const [selectedSizeLabel, setSelectedSizeLabel] = useState(sizeOptions[0]?.label || "");
  const [envelopeBaseLabel, setEnvelopeBaseLabel] = useState("");
  const [envelopeColor, setEnvelopeColor] = useState("");
  const [unit, setUnit] = useState("in");
  const [widthIn, setWidthIn] = useState(product.minWidthIn || 3);
  const [heightIn, setHeightIn] = useState(product.minHeightIn || 3);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [uploadedArtwork, setUploadedArtwork] = useState(null); // { url, key, name, mime, size }
  const [added, setAdded] = useState(false);

  // Business card state
  const optionsConfig = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig : {};
  const cardTypes = optionsConfig.cardTypes || [];
  const isBusinessCard = cardTypes.length > 0;
  const sidesOptions = optionsConfig.sidesOptions || [];
  const thickLayers = optionsConfig.thickLayers || [];
  const addonRules = optionsConfig.addonRules || {};
  const multiNameConfig = optionsConfig.multiName || null;
  const showMultiName = multiNameConfig?.enabled === true;
  const productSpecs = optionsConfig.specs && typeof optionsConfig.specs === "object" ? optionsConfig.specs : null;
  const templateGallery = Array.isArray(optionsConfig.templateGallery) ? optionsConfig.templateGallery : null;
  const [cardType, setCardType] = useState(cardTypes[0]?.id || "");
  const [sides, setSides] = useState("double");
  const [thickLayer, setThickLayer] = useState(thickLayers[0]?.id || "double-layer");
  const [names, setNames] = useState(1);

  const bcSizeLabel = useMemo(() => {
    if (!isBusinessCard) return null;
    return cardType === "thick" ? `thick-${thickLayer}` : `${cardType}-${sides}`;
  }, [isBusinessCard, cardType, sides, thickLayer]);

  const visibleAddons = useMemo(() => {
    if (!isBusinessCard) return addons;
    const allowed = addonRules[cardType];
    if (!Array.isArray(allowed)) return addons;
    const set = new Set(allowed);
    return addons.filter((a) => set.has(a.id));
  }, [isBusinessCard, addons, addonRules, cardType]);

  // Clear invalid addons when card type changes
  useEffect(() => {
    if (!isBusinessCard) return;
    const allowed = addonRules[cardType];
    if (!Array.isArray(allowed)) return;
    const validIds = new Set(allowed);
    setSelectedAddons((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBusinessCard, cardType]);

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
  const selectedScene = useMemo(
    () => scenes.find((scene) => scene.id === sceneId) || null,
    [scenes, sceneId]
  );
  const selectedSize = useMemo(
    () => sizeOptions.find((s) => s.label === selectedSizeLabel) || null,
    [sizeOptions, selectedSizeLabel]
  );
  const envelopeColorOptions = useMemo(() => {
    if (!envelopeVariantConfig.enabled) return [];
    const options = envelopeVariantConfig.byBase[envelopeBaseLabel] || {};
    return Object.keys(options).sort((a, b) => a.localeCompare(b));
  }, [envelopeVariantConfig, envelopeBaseLabel]);

  useEffect(() => {
    if (!envelopeVariantConfig.enabled) return;

    // Initialize base/color from current selected label when possible, else fallback to first available.
    const regex = /^(?<base>.+) - (?<color>Black Ink|Color)$/;
    const m = selectedSizeLabel ? selectedSizeLabel.match(regex) : null;
    const nextBase =
      m?.groups?.base && envelopeVariantConfig.byBase[m.groups.base]
        ? m.groups.base
        : envelopeVariantConfig.bases[0] || "";
    const availableColors = nextBase ? Object.keys(envelopeVariantConfig.byBase[nextBase] || {}) : [];
    const nextColor =
      m?.groups?.color && availableColors.includes(m.groups.color)
        ? m.groups.color
        : availableColors.includes("Black Ink")
          ? "Black Ink"
          : availableColors[0] || "";

    if (nextBase && envelopeBaseLabel !== nextBase) setEnvelopeBaseLabel(nextBase);
    if (nextColor && envelopeColor !== nextColor) setEnvelopeColor(nextColor);

    const resolved = nextBase && nextColor ? envelopeVariantConfig.byBase[nextBase]?.[nextColor]?.label : null;
    if (resolved && selectedSizeLabel !== resolved) setSelectedSizeLabel(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelopeVariantConfig.enabled, envelopeVariantConfig.bases.length]);

  useEffect(() => {
    if (!envelopeVariantConfig.enabled) return;
    if (!envelopeBaseLabel || !envelopeColor) return;
    const resolved = envelopeVariantConfig.byBase[envelopeBaseLabel]?.[envelopeColor]?.label || "";
    if (resolved && selectedSizeLabel !== resolved) setSelectedSizeLabel(resolved);
  }, [envelopeVariantConfig, envelopeBaseLabel, envelopeColor, selectedSizeLabel]);
  const activeQuantityChoices = useMemo(() => {
    const fromSize = selectedSize?.quantityChoices || [];
    if (Array.isArray(fromSize) && fromSize.length > 0) return [...new Set(fromSize)].sort((a, b) => a - b);

    const global = Array.isArray(product.optionsConfig?.quantityChoices)
      ? product.optionsConfig.quantityChoices.map((q) => Number(q)).filter((q) => Number.isFinite(q) && q > 0)
      : [];

    return [...new Set(global)].sort((a, b) => a - b);
  }, [product.optionsConfig, selectedSize]);

  useEffect(() => {
    if (!activeQuantityChoices.length) return;
    if (activeQuantityChoices.includes(quantity)) return;
    setQuantity(activeQuantityChoices[0]);
  }, [activeQuantityChoices, quantity]);

  // Server-driven pricing state
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const debounceRef = useRef(null);
  const addToCartRef = useRef(null);
  const [stickyVisible, setStickyVisible] = useState(false);

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

  // Apply product-level default material when switching products
  useEffect(() => {
    const candidate = typeof uiConfig?.defaultMaterialId === "string" ? uiConfig.defaultMaterialId : "";
    const next =
      candidate && materials.some((m) => m.id === candidate)
        ? candidate
        : materials[0]?.id || candidate || "";
    if (next && next !== material) setMaterial(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Sticky mobile ATC bar – show when original button scrolls out of view
  useEffect(() => {
    if (!addToCartRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(addToCartRef.current);
    return () => observer.disconnect();
  }, []);

  const widthDisplay = unit === "in" ? widthIn : Number((widthIn * INCH_TO_CM).toFixed(2));
  const heightDisplay = unit === "in" ? heightIn : Number((heightIn * INCH_TO_CM).toFixed(2));

  const sizeValidation = useMemo(() => {
    if (!dimensionsEnabled) return { valid: true, errors: [] };
    return validateDimensions(widthIn, heightIn, material, product);
  }, [widthIn, heightIn, material, product, dimensionsEnabled]);

  // Debounced /api/quote fetch (300ms)
  const fetchQuote = useCallback(
    async (slug, qty, w, h, mat, sizeLabel, addonIds, finishingIds, namesCount) => {
      const body = { slug, quantity: qty };
      if (dimensionsEnabled) {
        body.widthIn = w;
        body.heightIn = h;
      }
      if (mat) body.material = mat;
      if (sizeLabel) body.sizeLabel = sizeLabel;
      if (Array.isArray(addonIds) && addonIds.length > 0) body.addons = addonIds;
      if (Array.isArray(finishingIds) && finishingIds.length > 0) body.finishings = finishingIds;
      if (namesCount && namesCount > 1) body.names = namesCount;

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
      const sizeLabel = isBusinessCard
        ? bcSizeLabel
        : isTextEditor && editorMode === "box"
          ? editorSizeLabel
          : sizeOptions.length > 0
            ? selectedSizeLabel
            : null;
      fetchQuote(product.slug, quantity, widthIn, heightIn, material, sizeLabel, selectedAddons, selectedFinishings, showMultiName && names > 1 ? names : undefined);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [product.slug, quantity, widthIn, heightIn, material, selectedAddons, selectedFinishings, editorSizeLabel, selectedSizeLabel, sizeOptions.length, isTextEditor, editorMode, sizeValidation.valid, fetchQuote, isBusinessCard, bcSizeLabel, showMultiName, names]);

  // Scene presets for banner families (material + common size + addon defaults).
  useEffect(() => {
    if (!selectedScene) return;

    if (selectedScene.defaultMaterial) {
      setMaterial(selectedScene.defaultMaterial);
    }
    if (dimensionsEnabled && selectedScene.defaultWidthIn && selectedScene.defaultHeightIn) {
      setUnit("in");
      setWidthIn(selectedScene.defaultWidthIn);
      setHeightIn(selectedScene.defaultHeightIn);
    }
    if (selectedScene.defaultAddons.length > 0) {
      setSelectedAddons(selectedScene.defaultAddons);
    }
  }, [selectedScene, dimensionsEnabled]);

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

    // If no quote and basePrice is missing, avoid showing misleading $0.01 pricing.
    if (!product.basePrice || product.basePrice <= 0) {
      return { unitAmount: null, subtotal: null, tax: null, total: null, sqft: null, breakdown: null, unpriced: true };
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
  const estimateTierRows = useMemo(
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

  const bulkRows = useMemo(() => {
    const choices = selectedSize?.quantityChoices || [];
    const priceByQty = selectedSize?.priceByQty;
    if (priceByQty && typeof priceByQty === "object" && Array.isArray(choices) && choices.length > 0) {
      const rows = [...new Set(choices)]
        .filter((q) => Number.isFinite(q) && q > 0)
        .sort((a, b) => a - b)
        .map((qty) => {
          const total = priceByQty[String(qty)];
          const totalCents = typeof total === "number" && Number.isFinite(total) ? Math.round(total) : null;
          if (totalCents == null || totalCents <= 0) return null;
          return {
            qty,
            unitAmount: Math.round(totalCents / qty),
            totalAmount: totalCents,
            exact: true,
          };
        })
        .filter(Boolean);

      if (rows.length > 0) return rows;
    }

    return estimateTierRows.map((r) => ({ ...r, exact: false }));
  }, [selectedSize, estimateTierRows]);

  const bulkExample = useMemo(() => {
    if (!bulkRows.length) return null;
    const first = bulkRows[0];
    const last = bulkRows[bulkRows.length - 1];
    if (!first || !last || first.qty === last.qty) return null;
    return {
      minQty: first.qty,
      minUnit: formatCad(first.unitAmount),
      maxQty: last.qty,
      maxUnit: formatCad(last.unitAmount),
    };
  }, [bulkRows]);

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

  function setQuantityValue(next) {
    const choices = activeQuantityChoices;
    if (Array.isArray(choices) && choices.length > 0) {
      const numeric = Number(next);
      if (!Number.isFinite(numeric)) {
        setQuantity(choices[0]);
        return;
      }
      if (choices.includes(numeric)) {
        setQuantity(numeric);
        return;
      }
      let nearest = choices[0];
      let best = Math.abs(numeric - nearest);
      for (const q of choices) {
        const d = Math.abs(numeric - q);
        if (d < best) {
          best = d;
          nearest = q;
        }
      }
      setQuantity(nearest);
      return;
    }

    const range = quantityRange;
    if (!range) {
      setQuantity(Math.max(1, Number(next) || 1));
      return;
    }
    const numeric = Number(next) || range.min;
    const clamped = Math.min(range.max, Math.max(range.min, numeric));
    const stepped = Math.round(clamped / range.step) * range.step;
    setQuantity(Math.min(range.max, Math.max(range.min, stepped)));
  }

  const canAddToCart = sizeValidation.valid && !priceData.unpriced;

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

    const bcMeta = isBusinessCard
      ? {
          cardType,
          sides: cardType === "thick" ? null : sides,
          thickLayer: cardType === "thick" ? thickLayer : null,
          names,
          totalQty: names * Number(quantity),
          sizeLabel: bcSizeLabel,
        }
      : showMultiName && names > 1
        ? { names, totalQty: names * Number(quantity) }
        : {};

    const effectiveSizeLabel = isBusinessCard
      ? bcSizeLabel
      : selectedSize?.label || null;

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
        sizeLabel: effectiveSizeLabel,
        sceneId: selectedScene?.id || null,
        sceneLabel: selectedScene?.label || null,
        addons: selectedAddons,
        finishings: selectedFinishings,
        fileName: file?.name || null,
        pricingUnit: product.pricingUnit,
        ...artworkMeta,
        ...editorMeta,
        ...bcMeta,
      },
      id: product.id,
      price: priceData.unitAmount,
      options: {
        width: dimensionsEnabled ? widthIn : null,
        height: dimensionsEnabled ? heightIn : null,
        material,
        sizeLabel: effectiveSizeLabel,
        sceneId: selectedScene?.id || null,
        sceneLabel: selectedScene?.label || null,
        addons: selectedAddons,
        finishings: selectedFinishings,
        fileName: file?.name || null,
        pricingUnit: product.pricingUnit,
        ...artworkMeta,
        ...editorMeta,
        ...bcMeta,
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
        <Breadcrumbs items={[
          { label: t("product.shop"), href: "/shop" },
          { label: product.category.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), href: `/shop?category=${product.category}` },
          { label: product.name }
        ]} />

        {moved && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {movedFromLabel ? t("product.movedCategoryFrom", { from: movedFromLabel }) : t("product.movedCategory")}
          </div>
        )}

        <section className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <ImageGallery images={imageList} productName={product.name} />

            {templateGallery && <TemplateGallery templates={templateGallery} />}

            {productSpecs ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">{t("bc.specs")}</h3>
                <div className="mt-3 divide-y divide-gray-100">
                  {productSpecs.dimensions && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-500">{t("bc.specs.dimensions")}</span>
                      <span className="font-medium text-gray-900">{productSpecs.dimensions}</span>
                    </div>
                  )}
                  {productSpecs.paper && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-500">{t("bc.specs.paper")}</span>
                      <span className="font-medium text-gray-900">{productSpecs.paper}</span>
                    </div>
                  )}
                  {productSpecs.finish && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-500">{t("bc.specs.finish")}</span>
                      <span className="font-medium text-gray-900">{productSpecs.finish}</span>
                    </div>
                  )}
                  {productSpecs.corners && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-500">{t("bc.specs.corners")}</span>
                      <span className="font-medium text-gray-900">{productSpecs.corners}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <span>{t("bc.specs.customSize")}</span>
                  <a href="/quote" className="font-semibold text-gray-700 underline hover:text-gray-900">{t("bc.specs.contactUs")}</a>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          <div className="space-y-6 lg:col-span-5">
            <header>
              <h1 className="text-4xl font-semibold tracking-tight">{product.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(() => {
                  const tk = getTurnaround(product);
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${turnaroundColor(tk)}`}>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t(turnaroundI18nKey(tk))}
                    </span>
                  );
                })()}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {t("trust.madeToOrder")}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{product.description || t("product.defaultDescription")}</p>
            </header>

            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {t("product.realtimePricing")}
              {quoteLoading && <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />}
                </p>
                {priceData.unpriced ? (
                  <a
                    href={`/quote?product=${product.slug}&name=${encodeURIComponent(product.name)}`}
                    className="text-sm font-semibold text-gray-900 underline"
                  >
                    {t("product.priceOnRequest")}
                  </a>
                ) : (
                  <p className={`text-sm font-semibold ${quoteLoading ? "text-gray-400" : "text-gray-900"}`}>{formatCad(priceData.unitAmount)} {t("product.unit")}</p>
                )}
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

              {scenes.length > 0 && (
                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.scene")}</label>
                  <select value={sceneId} onChange={(e) => setSceneId(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
                    {scenes.map((scene) => (
                      <option key={scene.id} value={scene.id}>{scene.label}</option>
                    ))}
                  </select>
                  {selectedScene?.description && <p className="mt-2 text-xs text-gray-500">{selectedScene.description}</p>}
                </div>
              )}

              {isBusinessCard && (
                <div className="mt-5 space-y-5">
                  {/* Card Type Grid */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("bc.cardType")}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {cardTypes.map((ct) => (
                        <button
                          key={ct.id}
                          type="button"
                          onClick={() => setCardType(ct.id)}
                          className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                            cardType === ct.id
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 bg-white text-gray-900 hover:border-gray-400"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{t("bc.type." + ct.id) !== "bc.type." + ct.id ? t("bc.type." + ct.id) : ct.label}</span>
                          <span className={`block text-[11px] ${cardType === ct.id ? "text-gray-300" : "text-gray-500"}`}>{t("bc.desc." + ct.id) !== "bc.desc." + ct.id ? t("bc.desc." + ct.id) : ct.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sides Radio (hidden for "thick" type) */}
                  {cardType !== "thick" && sidesOptions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("bc.sides")}</p>
                      <div className="mt-2 flex gap-2">
                        {sidesOptions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSides(s.id)}
                            className={`flex-1 rounded-xl border-2 px-3 py-2 text-center text-sm font-semibold transition-all ${
                              sides === s.id
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {t("bc.side." + s.id) !== "bc.side." + s.id ? t("bc.side." + s.id) : s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Thick Layer Selector */}
                  {cardType === "thick" && thickLayers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("bc.layers")}</p>
                      <div className="mt-2 flex gap-2">
                        {thickLayers.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setThickLayer(l.id)}
                            className={`flex-1 rounded-xl border-2 px-3 py-2 text-center text-sm font-semibold transition-all ${
                              thickLayer === l.id
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {t("bc.layer." + l.id) !== "bc.layer." + l.id ? t("bc.layer." + l.id) : l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Names Stepper */}
                  {multiNameConfig?.enabled && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("bc.names")}</p>
                      <p className="mt-1 text-xs text-gray-500">{t("bc.namesHint")}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setNames((n) => Math.max(1, n - 1))}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={names}
                          min={1}
                          max={multiNameConfig.maxNames || 20}
                          onChange={(e) => {
                            const v = Math.max(1, Math.min(multiNameConfig.maxNames || 20, Math.floor(Number(e.target.value) || 1)));
                            setNames(v);
                          }}
                          className="w-16 rounded-xl border border-gray-300 px-2 py-2 text-center text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setNames((n) => Math.min(multiNameConfig.maxNames || 20, n + 1))}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold"
                        >
                          +
                        </button>
                      </div>

                      {names > 1 && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-sm font-semibold text-emerald-800">
                            {t("bc.totalCards", { names, qty: quantity, total: names * quantity })}
                          </p>
                          {quote?.meta?.savingsVsIndividual > 0 && (
                            <p className="mt-1 text-sm font-semibold text-emerald-600">
                              {t("bc.savings", { amount: formatCad(quote.meta.savingsVsIndividual) })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Multi-name stepper (for split products that have multiName but aren't the old combined card) */}
              {!isBusinessCard && showMultiName && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("bc.names")}</p>
                  <p className="mt-1 text-xs text-gray-500">{t("bc.namesHint")}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNames((n) => Math.max(1, n - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={names}
                      min={1}
                      max={multiNameConfig.maxNames || 20}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(multiNameConfig.maxNames || 20, Math.floor(Number(e.target.value) || 1)));
                        setNames(v);
                      }}
                      className="w-16 rounded-xl border border-gray-300 px-2 py-2 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setNames((n) => Math.min(multiNameConfig.maxNames || 20, n + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold"
                    >
                      +
                    </button>
                  </div>

                  {names > 1 && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-sm font-semibold text-emerald-800">
                        {t("bc.totalCards", { names, qty: quantity, total: names * quantity })}
                      </p>
                      {quote?.meta?.savingsVsIndividual > 0 && (
                        <p className="mt-1 text-sm font-semibold text-emerald-600">
                          {t("bc.savings", { amount: formatCad(quote.meta.savingsVsIndividual) })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isBusinessCard && !isTextEditor && sizeOptions.length > 0 && (
                <div className="mt-5 space-y-4">
                  {envelopeVariantConfig.enabled ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.size")}</label>
                        <select
                          value={envelopeBaseLabel}
                          onChange={(e) => setEnvelopeBaseLabel(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          {envelopeVariantConfig.bases.map((base) => (
                            <option key={base} value={base}>
                              {base}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.color")}</label>
                        <select
                          value={envelopeColor}
                          onChange={(e) => setEnvelopeColor(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        >
                          {envelopeColorOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <SizeSelector
                      label={uiConfig?.sizeToggleLabel || t("product.size")}
                      options={sizeOptions}
                      value={selectedSizeLabel}
                      onChange={setSelectedSizeLabel}
                      placeholder={uiConfig?.sizeToggleLabel || t("product.size")}
                    />
                  )}

                  {selectedSize?.notes && <p className="text-xs text-gray-500">{selectedSize.notes}</p>}
                </div>
              )}

              {!hideMaterials && materials.length > 0 && (
                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.material")}</label>
                  <select value={material} onChange={(e) => setMaterial(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.multiplier !== 1.0 ? ` (+${Math.round((m.multiplier - 1) * 100)}%)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!hideAddons && visibleAddons.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.addons")}</p>
                  <div className="space-y-2">
                    {visibleAddons.map((addon) => (
                      <label key={addon.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedAddons.includes(addon.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddons((prev) => (prev.includes(addon.id) ? prev : [...prev, addon.id]));
                            } else {
                              setSelectedAddons((prev) => prev.filter((id) => id !== addon.id));
                            }
                          }}
                          className="mt-0.5"
                        />
                        <span className="flex-1">
                          <span className="font-medium text-gray-900">{t("bc.addon." + addon.id) !== "bc.addon." + addon.id ? t("bc.addon." + addon.id) : addon.name}</span>
                          {addon.description && <span className="block text-xs text-gray-500">{addon.description}</span>}
                          {addon.price > 0 && (
                            <span className="block text-xs text-gray-500">
                              {addon.type === "flat" ? `$${addon.price.toFixed(2)} flat` : `$${addon.price.toFixed(2)}/unit`}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!hideFinishings && finishings.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.finishing")}</p>
                  <div className="space-y-2">
                    {finishings.map((f) => (
                      <label key={f.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedFinishings.includes(f.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFinishings((prev) => [...prev, f.id]);
                            } else {
                              setSelectedFinishings((prev) => prev.filter((id) => id !== f.id));
                            }
                          }}
                          className="mt-0.5"
                        />
                        <span className="flex-1">
                          <span className="font-medium text-gray-900">{f.name}</span>
                          <span className="block text-xs text-gray-500">
                            {f.type === "flat" ? `$${f.price.toFixed(2)} flat` : f.type === "per_unit" ? `$${f.price.toFixed(2)}/unit` : `$${f.price.toFixed(2)}/sqft`}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.quantity")}</p>
                {activeQuantityChoices.length > 0 ? (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const idx = activeQuantityChoices.indexOf(quantity);
                        const next = idx > 0 ? activeQuantityChoices[idx - 1] : activeQuantityChoices[0];
                        setQuantityValue(next);
                      }}
                      className="h-9 w-9 rounded-full border border-gray-300"
                    >
                      -
                    </button>
                    <select
                      value={String(quantity)}
                      onChange={(e) => setQuantityValue(Number(e.target.value))}
                      className="w-32 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm"
                    >
                      {activeQuantityChoices.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const idx = activeQuantityChoices.indexOf(quantity);
                        const next =
                          idx >= 0 && idx < activeQuantityChoices.length - 1
                            ? activeQuantityChoices[idx + 1]
                            : activeQuantityChoices[activeQuantityChoices.length - 1];
                        setQuantityValue(next);
                      }}
                      className="h-9 w-9 rounded-full border border-gray-300"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => setQuantityValue(quantity - (quantityRange?.step || 1))} className="h-9 w-9 rounded-full border border-gray-300">-</button>
                    <input type="number" value={quantity} onChange={(e) => setQuantityValue(e.target.value)} className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm" />
                    <button onClick={() => setQuantityValue(quantity + (quantityRange?.step || 1))} className="h-9 w-9 rounded-full border border-gray-300">+</button>
                  </div>
                )}
                {activeQuantityChoices.length > 0 ? (
                  <p className="mt-2 text-xs text-gray-500">
                    {t("product.qtyChoices", { list: activeQuantityChoices.join(", ") })}
                  </p>
                ) : quantityRange ? (
                  <p className="mt-2 text-xs text-gray-500">{t("product.qtyRange", { min: quantityRange.min, max: quantityRange.max })}</p>
                ) : null}
              </div>

              {!hideTierPricing && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{t("product.tierPricing")}</p>
                  <p className="mt-2 text-xs text-gray-600">{t("product.bulkDiscountHint")}</p>
                  {bulkExample && (
                    <p className="mt-1 text-xs text-gray-600">
                      {t("product.bulkDiscountExample", {
                        minQty: bulkExample.minQty,
                        minUnit: bulkExample.minUnit,
                        maxQty: bulkExample.maxQty,
                        maxUnit: bulkExample.maxUnit,
                      })}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {bulkRows.map((row) => (
                      <div
                        key={row.qty}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 ${row.qty === quantity ? "bg-gray-900 text-white" : "bg-white"}`}
                      >
                        <span>{row.qty}{t("product.pcs")}</span>
                        <span className="font-semibold">{formatCad(row.unitAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="text-right">
                    <span className="font-semibold">{formatCad(priceData.subtotal)}</span>
                    {priceData.unitAmount != null && Number(quantity) > 1 && (
                      <span className="ml-2 text-xs text-gray-400">{t("bc.unitPrice", { price: formatCad(priceData.unitAmount) })}</span>
                    )}
                  </div>
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

              <div ref={addToCartRef}>
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
                  {!canAddToCart
                    ? priceData.unpriced
                      ? t("product.priceOnRequest")
                      : t("product.fixSizeErrors")
                    : added
                      ? t("product.added")
                      : t("product.addToCart")}
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <GuaranteeBadge />
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                  <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{t("trust.ordersCompleted")}</span>
                </div>
                <PaymentBadges />
              </div>

              <Link
                href={`/quote?product=${product.slug}&name=${encodeURIComponent(product.name)}`}
                className="mt-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
              >
                <span className="text-xs text-gray-600">{t("quote.stickyLabel")}</span>
                <span className="rounded-full bg-gray-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                  {t("quote.stickyCta")}
                </span>
              </Link>
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

        {/* Sticky mobile Add to Cart bar */}
        {stickyVisible && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">{t("product.total")}</p>
                <p className="text-lg font-black">{formatCad(priceData.total)}</p>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`flex-1 max-w-[200px] rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-200 ${!canAddToCart ? "bg-gray-300 cursor-not-allowed" : added ? "bg-emerald-600" : "bg-gray-900 hover:bg-black"}`}
              >
                {!canAddToCart
                  ? priceData.unpriced
                    ? t("product.priceOnRequest")
                    : t("product.fixSizeErrors")
                  : added
                    ? t("product.added")
                    : t("product.addToCart")}
              </button>
            </div>
          </div>
        )}
    </main>
  );
}
