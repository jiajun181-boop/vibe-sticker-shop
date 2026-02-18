"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { validateDimensions } from "@/lib/materialLimits";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { PaymentBadges } from "@/components/TrustBadges";
import { MobileBottomBar, ArtworkUpload } from "@/components/configurator";
import ImageGallery from "@/components/product/ImageGallery";
import { trackAddToCart, trackOptionChange, trackQuoteLoaded, trackBuyNow, trackUploadStarted } from "@/lib/analytics";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useRecentlyViewedStore } from "@/lib/recently-viewed";
import dynamic from "next/dynamic";
import Breadcrumbs from "@/components/Breadcrumbs";
import TemplateGallery from "@/components/product/TemplateGallery";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";

import { useFavoritesStore } from "@/lib/favorites";
import RelatedLinks from "@/components/product/RelatedLinks";
import RelatedProducts from "@/components/product/RelatedProducts";
import ProductSpecsSection from "@/components/product/ProductSpecsSection";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import { getSmartDefaults } from "@/lib/pricing/get-smart-defaults";
import {
  HST_RATE, PRESET_QUANTITIES, INCH_TO_CM,
  createSizeRowId, normalizeInches, formatCad,
  parseInventorySignal, applyAllowlist, getStartingUnitPrice,
  normalizeCheckoutMeta, parseMaterials, parseFinishings,
  parseAddons, parseScenes, parseSizeOptions, parseQuantityRange,
  buildVariantConfig,
} from "@/lib/product-helpers";

const StampEditor = dynamic(() => import("@/components/product/StampEditor"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-[var(--color-gray-100)] rounded-2xl h-64" />,
});

const MAX_SIZE_BOXES = 10;

function SizeGrid({ sizeOptions, selectedSizeLabel, onSelect, getStartingUnitPrice, formatCad, label, t }) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = sizeOptions.length > MAX_SIZE_BOXES;
  const visible = hasMore && !showAll ? sizeOptions.slice(0, MAX_SIZE_BOXES) : sizeOptions;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {visible.map((o) => {
          const dims = o.widthIn && o.heightIn ? `${o.widthIn}" x ${o.heightIn}"` : null;
          const subtitle = dims || o.notes || null;
          const unitPrice = getStartingUnitPrice(o);
          const selected = selectedSizeLabel === o.label;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => onSelect(o.label)}
              className={`relative rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                selected
                  ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                  : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-900)] hover:border-[var(--color-gray-400)]"
              }`}
            >
              {o.recommended && (
                <span className={`absolute -top-2 right-2 rounded-full px-1.5 py-0.5 label-xs font-bold uppercase tracking-wider ${
                  selected ? "bg-white text-[var(--color-ink-black)]" : "bg-[var(--color-ink-black)] text-white"
                }`}>{"\u2605"}</span>
              )}
              <span className="block text-sm font-semibold">{o.displayLabel || o.label}</span>
              {subtitle && <span className={`mt-0.5 block text-[11px] ${selected ? "text-[var(--color-gray-300)]" : "text-[var(--color-gray-500)]"}`}>{subtitle}</span>}
              {unitPrice && <span className={`mt-1 block text-xs font-bold ${selected ? "text-[var(--color-gray-200)]" : "text-[var(--color-gray-700)]"}`}>{t("product.from", { price: formatCad(unitPrice) })}/ea</span>}
            </button>
          );
        })}
      </div>
      {hasMore && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)] transition-colors"
        >
          {t("product.moreSizes", { count: sizeOptions.length - MAX_SIZE_BOXES })}
        </button>
      )}
    </div>
  );
}

export default function ProductClient({ product, relatedProducts, embedded = false, catalogConfig }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
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
  const variantConfig = useMemo(() => buildVariantConfig(sizeOptions), [sizeOptions]);
  const smartDefaults = useMemo(() => getSmartDefaults(product), [product]);
  const inventorySignal = useMemo(() => parseInventorySignal(product.optionsConfig), [product.optionsConfig]);
  const turnaroundKey = useMemo(() => getTurnaround(product), [product]);

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
        widthIn: normalizeInches(s.widthIn),
        heightIn: normalizeInches(s.heightIn),
        diameterIn: normalizeInches(s.diameterIn),
        mm: s.mm || null,
        details: s.details || null,
        type: s.type || null,
        replacementPad: s.replacementPad || null,
      }));
  }, [editorConfig, product.optionsConfig]);
  const [editorSizeLabel, setEditorSizeLabel] = useState(editorSizes[0]?.label || "");
  const dimensionsEnabled = isPerSqft || isTextEditor;
  const allowCustomSize = product.optionsConfig?.allowCustomSize === true;
  const [isCustomSize, setIsCustomSize] = useState(false);
  const costPlusDefaults = product.optionsConfig?.costPlusDefaults || null;

  const [quantity, setQuantity] = useState(quantityRange?.min || smartDefaults.minQuantity || 1);
  const [material, setMaterial] = useState(() => {
    const candidate = typeof uiConfig?.defaultMaterialId === "string" ? uiConfig.defaultMaterialId : "";
    if (candidate && materials.some((m) => m.id === candidate)) return candidate;
    if (smartDefaults.defaultMaterial && materials.some((m) => m.id === smartDefaults.defaultMaterial)) return smartDefaults.defaultMaterial;
    return materials[0]?.id || candidate || "";
  });
  const [sceneId, setSceneId] = useState(scenes[0]?.id || "");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedFinishings, setSelectedFinishings] = useState([]);
  const [wantsFinishing, setWantsFinishing] = useState(false);
  const [selectedSizeLabel, setSelectedSizeLabel] = useState(sizeOptions[0]?.label || "");
  const [variantBase, setVariantBase] = useState("");
  const [variantValue, setVariantValue] = useState("");
  const [unit, setUnit] = useState("in");
  const [widthIn, setWidthIn] = useState(product.minWidthIn || 3);
  const [heightIn, setHeightIn] = useState(product.minHeightIn || 3);
  const [useMultiSize, setUseMultiSize] = useState(false);
  const [sizeRows, setSizeRows] = useState(() => [
    {
      id: createSizeRowId(),
      widthIn: product.minWidthIn || 3,
      heightIn: product.minHeightIn || 3,
      quantity: quantityRange?.min || smartDefaults.minQuantity || 1,
    },
  ]);
  const [uploadedArtwork, setUploadedArtwork] = useState(null); // { url, key, name, mime, size }
  const [added, setAdded] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

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
  const editorExtrasRef = useRef({});
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
  const variantValueOptions = useMemo(() => {
    if (!variantConfig.enabled) return [];
    const options = variantConfig.byBase[variantBase] || {};
    return Object.keys(options);
  }, [variantConfig, variantBase]);

  useEffect(() => {
    if (!variantConfig.enabled) return;

    // Initialize base/variant from current selected label when possible, else fallback to first available.
    const regex = /^(.+)\s+-\s+(.+)$/;
    const m = selectedSizeLabel ? selectedSizeLabel.match(regex) : null;
    const nextBase =
      m?.[1] && variantConfig.byBase[m[1]]
        ? m[1]
        : variantConfig.bases[0] || "";
    const available = nextBase ? Object.keys(variantConfig.byBase[nextBase] || {}) : [];
    const nextVariant =
      m?.[2] && available.includes(m[2])
        ? m[2]
        : available[0] || "";

    if (nextBase && variantBase !== nextBase) setVariantBase(nextBase);
    if (nextVariant && variantValue !== nextVariant) setVariantValue(nextVariant);

    const resolved = nextBase && nextVariant ? variantConfig.byBase[nextBase]?.[nextVariant]?.label : null;
    if (resolved && selectedSizeLabel !== resolved) setSelectedSizeLabel(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantConfig.enabled, variantConfig.bases.length]);

  useEffect(() => {
    if (!variantConfig.enabled) return;
    if (!variantBase || !variantValue) return;
    const resolved = variantConfig.byBase[variantBase]?.[variantValue]?.label || "";
    if (resolved && selectedSizeLabel !== resolved) setSelectedSizeLabel(resolved);
  }, [variantConfig, variantBase, variantValue, selectedSizeLabel]);

  // Listen for landing page size selection (custom event from ProductLandingClient)
  useEffect(() => {
    const handler = (e) => {
      const size = e.detail?.size;
      if (!size) return;
      if (variantConfig.enabled) {
        const regex = /^(.+)\s+-\s+(.+)$/;
        const m = size.match(regex);
        if (m?.[1] && variantConfig.byBase[m[1]]) {
          setVariantBase(m[1]);
          if (m[2]) setVariantValue(m[2]);
        }
      } else {
        const match = sizeOptions.find((s) => s.label === size);
        if (match) setSelectedSizeLabel(size);
      }
    };
    window.addEventListener("landing-select-size", handler);
    return () => window.removeEventListener("landing-select-size", handler);
  }, [variantConfig, sizeOptions]);

  // Listen for landing page preset selection (flyers playbook cards)
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      const sizeHint = typeof detail.size === "string" ? detail.size.trim().toLowerCase() : "";
      const quantityHint = Number(detail.quantity);
      const materialHint = typeof detail.material === "string" ? detail.material.trim().toLowerCase() : "";

      if (sizeHint) {
        if (variantConfig.enabled) {
          const base = variantConfig.bases.find((b) => String(b).toLowerCase().includes(sizeHint));
          if (base) setVariantBase(base);
        } else {
          const exact = sizeOptions.find((s) => String(s.label).toLowerCase() === sizeHint);
          const fuzzy = sizeOptions.find((s) => String(s.label).toLowerCase().includes(sizeHint));
          const match = exact || fuzzy;
          if (match) setSelectedSizeLabel(match.label);
        }
      }

      if (Number.isFinite(quantityHint) && quantityHint > 0) {
        setQuantityValue(quantityHint);
      }

      if (materialHint) {
        const exact = materials.find((m) => String(m.id).toLowerCase() === materialHint);
        const byName = materials.find((m) => String(m.name).toLowerCase().includes(materialHint));
        const match = exact || byName;
        if (match) setMaterial(match.id);
      }
    };
    window.addEventListener("landing-apply-preset", handler);
    return () => window.removeEventListener("landing-apply-preset", handler);
  }, [materials, sizeOptions, variantConfig]);

  const activeQuantityChoices = useMemo(() => {
    // Custom size mode: no preset qty choices → free-form input
    if (isCustomSize) return [];

    const fromSize = selectedSize?.quantityChoices || [];
    if (Array.isArray(fromSize) && fromSize.length > 0) return [...new Set(fromSize)].sort((a, b) => a - b);

    const global = Array.isArray(product.optionsConfig?.quantityChoices)
      ? product.optionsConfig.quantityChoices.map((q) => Number(q)).filter((q) => Number.isFinite(q) && q > 0)
      : [];
    if (global.length > 0) return [...new Set(global)].sort((a, b) => a - b);

    // Fallback to preset tiers for products that rely on pricingPreset only.
    const presetModel = product.pricingPreset?.model;
    const presetConfig = product.pricingPreset?.config;

    if (presetModel === "QTY_TIERED" && Array.isArray(presetConfig?.tiers)) {
      const qtyFromTiers = presetConfig.tiers
        .map((tier) => Number(tier?.minQty))
        .filter((q) => Number.isFinite(q) && q > 0);
      if (qtyFromTiers.length > 0) return [...new Set(qtyFromTiers)].sort((a, b) => a - b);
    }

    if (presetModel === "QTY_OPTIONS" && Array.isArray(presetConfig?.sizes) && presetConfig.sizes.length > 0) {
      const firstSize = presetConfig.sizes[0];
      const qtyFromTiers = Array.isArray(firstSize?.tiers)
        ? firstSize.tiers
            .map((tier) => Number(tier?.qty ?? tier?.minQty))
            .filter((q) => Number.isFinite(q) && q > 0)
        : [];
      if (qtyFromTiers.length > 0) return [...new Set(qtyFromTiers)].sort((a, b) => a - b);
    }

    return [];
  }, [product.optionsConfig, product.pricingPreset, selectedSize]);

  useEffect(() => {
    if (!activeQuantityChoices.length) return;
    if (activeQuantityChoices.includes(quantity)) return;
    setQuantity(activeQuantityChoices[0]);
  }, [activeQuantityChoices, quantity]);

  // Keep selected size valid when switching between products/routes.
  useEffect(() => {
    if (!sizeOptions.length) return;
    const stillValid = sizeOptions.some((s) => s.label === selectedSizeLabel);
    if (!stillValid) {
      setSelectedSizeLabel(sizeOptions[0].label);
    }
  }, [product.slug, sizeOptions, selectedSizeLabel]);

  // Server-driven pricing state
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(false);
  const stableQuoteRef = useRef(null);
  const debounceRef = useRef(null);
  const lastQuoteRequestKeyRef = useRef("");
  const addToCartRef = useRef(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  // Prevent stale quote flash when navigating between different products.
  useEffect(() => {
    setQuote(null);
    setQuoteLoading(false);
    setQuoteError(false);
    stableQuoteRef.current = null;
    lastQuoteRequestKeyRef.current = "";
  }, [product.slug]);

  const primaryImage = getProductImage(product);
  const imageList = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    return [{ url: primaryImage, alt: product.name || "Product", mimeType: isSvgImage(primaryImage) ? "image/svg+xml" : undefined }];
  }, [product.images, product.name, primaryImage]);

  // Track recently viewed
  useEffect(() => {
    useRecentlyViewedStore.getState().addViewed({
      slug: product.slug,
      category: product.category,
      name: product.name,
      image: primaryImage,
      basePrice: product.basePrice,
    });
  }, [product.slug, product.category, product.name, product.basePrice, primaryImage]);

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

  // Sticky mobile ATC bar - show when original button scrolls out of view
  useEffect(() => {
    if (!addToCartRef.current) return;
    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") {
      setStickyVisible(false);
      return;
    }
    try {
      const observer = new IntersectionObserver(
        ([entry]) => setStickyVisible(!entry.isIntersecting),
        { threshold: 0 }
      );
      observer.observe(addToCartRef.current);
      return () => observer.disconnect();
    } catch {
      setStickyVisible(false);
      return undefined;
    }
  }, [product.slug]);

  const widthDisplay = unit === "in" ? widthIn : Number((widthIn * INCH_TO_CM).toFixed(2));
  const heightDisplay = unit === "in" ? heightIn : Number((heightIn * INCH_TO_CM).toFixed(2));
  const multiSizeEnabled = isPerSqft && !isTextEditor;
  const totalMultiQty = useMemo(
    () =>
      sizeRows.reduce((sum, row) => {
        const q = Number(row.quantity);
        return sum + (Number.isFinite(q) && q > 0 ? q : 0);
      }, 0),
    [sizeRows]
  );
  const multiSqftTotal = useMemo(
    () =>
      sizeRows.reduce((sum, row) => {
        const w = Number(row.widthIn);
        const h = Number(row.heightIn);
        const q = Number(row.quantity);
        if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(q) || w <= 0 || h <= 0 || q <= 0) return sum;
        return sum + (w * h) / 144 * q;
      }, 0),
    [sizeRows]
  );

  const sizeValidation = useMemo(() => {
    if (!dimensionsEnabled) return { valid: true, errors: [] };
    if (multiSizeEnabled && useMultiSize) {
      const errors = [];
      sizeRows.forEach((row, idx) => {
        const check = validateDimensions(Number(row.widthIn), Number(row.heightIn), material, product);
        if (!check.valid) {
          check.errors.forEach((err) => errors.push(`Size #${idx + 1}: ${err}`));
        }
        const q = Number(row.quantity);
        if (!Number.isFinite(q) || q <= 0) {
          errors.push(`Size #${idx + 1}: quantity must be greater than 0`);
        }
      });
      return { valid: errors.length === 0, errors };
    }
    return validateDimensions(widthIn, heightIn, material, product);
  }, [widthIn, heightIn, material, product, dimensionsEnabled, multiSizeEnabled, useMultiSize, sizeRows]);

  const localQuoteFallback = useMemo(() => {
    const qty = Number(quantity) || 1;
    if (qty <= 0) return null;

    // 1) Exact per-size total table
    if (
      selectedSize?.priceByQty &&
      typeof selectedSize.priceByQty === "object" &&
      Number.isFinite(selectedSize.priceByQty[String(qty)])
    ) {
      const subtotal = Math.round(Number(selectedSize.priceByQty[String(qty)]));
      const tax = Math.round(subtotal * HST_RATE);
      return {
        unitAmount: Math.max(1, Math.round(subtotal / qty)),
        subtotal,
        tax,
        total: subtotal + tax,
        sqft: null,
        breakdown: null,
      };
    }

    // Helper: apply fileFee + minimumPrice from preset config
    const presetCfg = product.pricingPreset?.config;
    const fileFeeCents = Math.round(Number(presetCfg?.fileFee || 0) * 100);
    const minimumCents = Math.round(Number(presetCfg?.minimumPrice || 0) * 100);

    // 2) Per-size tiers (estimate — excludes addons/finishings/surcharges)
    if (selectedSize && Array.isArray(selectedSize.tiers) && selectedSize.tiers.length > 0) {
      const tiers = [...selectedSize.tiers]
        .map((tier) => ({
          qty: Number(tier.qty ?? tier.minQty ?? 0),
          unitCents:
            typeof tier.unitCents === "number"
              ? Math.round(tier.unitCents)
              : typeof tier.unitPriceCents === "number"
                ? Math.round(tier.unitPriceCents)
                : typeof tier.unitPrice === "number"
                  ? Math.round(tier.unitPrice * 100)
                  : null,
        }))
        .filter((tier) => Number.isFinite(tier.qty) && tier.qty > 0 && Number.isFinite(tier.unitCents) && tier.unitCents > 0)
        .sort((a, b) => a.qty - b.qty);

      if (tiers.length > 0) {
        let picked = tiers[0];
        for (const tier of tiers) {
          if (qty >= tier.qty) picked = tier;
        }
        const rawSubtotal = picked.unitCents * qty + fileFeeCents;
        const subtotal = Math.max(rawSubtotal, minimumCents);
        const tax = Math.round(subtotal * HST_RATE);
        return {
          unitAmount: Math.max(1, Math.round(subtotal / qty)),
          subtotal,
          tax,
          total: subtotal + tax,
          sqft: null,
          breakdown: null,
          isEstimate: true,
        };
      }
    }

    // 3) Generic QTY_TIERED fallback from preset (estimate)
    if (product.pricingPreset?.model === "QTY_TIERED" && Array.isArray(product.pricingPreset?.config?.tiers)) {
      const tiers = [...product.pricingPreset.config.tiers]
        .map((tier) => ({
          minQty: Number(tier.minQty),
          unitPrice: Number(tier.unitPrice),
        }))
        .filter((tier) => Number.isFinite(tier.minQty) && tier.minQty > 0 && Number.isFinite(tier.unitPrice) && tier.unitPrice > 0)
        .sort((a, b) => a.minQty - b.minQty);

      if (tiers.length > 0) {
        let picked = tiers[0];
        for (const tier of tiers) {
          if (qty >= tier.minQty) picked = tier;
        }
        const billableQty = Math.max(qty, picked.minQty);
        const rawSubtotal = Math.round(picked.unitPrice * billableQty * 100) + fileFeeCents;
        const finalSubtotal = Math.max(rawSubtotal, minimumCents);
        const tax = Math.round(finalSubtotal * HST_RATE);
        return {
          unitAmount: Math.max(1, Math.round(finalSubtotal / qty)),
          subtotal: finalSubtotal,
          tax,
          total: finalSubtotal + tax,
          sqft: null,
          breakdown: null,
          isEstimate: true,
        };
      }
    }

    // 4) AREA_TIERED fallback from preset (estimate using current dimensions)
    if (product.pricingPreset?.model === "AREA_TIERED" && Array.isArray(product.pricingPreset?.config?.tiers)) {
      const w = Number(widthIn);
      const h = Number(heightIn);
      if (w > 0 && h > 0) {
        const sqft = (w * h) / 144;
        const tiers = [...product.pricingPreset.config.tiers]
          .filter((t) => t && typeof t === "object" && Number.isFinite(Number(t.upToSqft)) && Number.isFinite(Number(t.rate)))
          .sort((a, b) => Number(a.upToSqft) - Number(b.upToSqft));

        if (tiers.length > 0) {
          const tier = tiers.find((t) => sqft <= Number(t.upToSqft)) || tiers[tiers.length - 1];
          const rateDollars = Number(tier.rate);
          const lineTotal = rateDollars * sqft * qty;
          const rawSubtotal = Math.round((lineTotal + Number(presetCfg?.fileFee || 0)) * 100);
          const finalSubtotal = Math.max(rawSubtotal, minimumCents);
          const tax = Math.round(finalSubtotal * HST_RATE);
          return {
            unitAmount: Math.max(1, Math.round(finalSubtotal / qty)),
            subtotal: finalSubtotal,
            tax,
            total: finalSubtotal + tax,
            sqft,
            breakdown: null,
            isEstimate: true,
          };
        }
      }
    }

    // 5) QTY_OPTIONS fallback from preset sizes (estimate)
    if (product.pricingPreset?.model === "QTY_OPTIONS" && Array.isArray(product.pricingPreset?.config?.sizes)) {
      const sizes = product.pricingPreset.config.sizes;
      const sizeEntry = (selectedSizeLabel && sizes.find((s) => s.label === selectedSizeLabel)) || sizes[0];

      if (sizeEntry && Array.isArray(sizeEntry.tiers) && sizeEntry.tiers.length > 0) {
        const tiers = [...sizeEntry.tiers]
          .map((t) => ({
            qty: Number(t.qty ?? t.minQty ?? 0),
            unitPrice: Number(t.unitPrice ?? 0),
          }))
          .filter((t) => Number.isFinite(t.qty) && t.qty > 0 && Number.isFinite(t.unitPrice) && t.unitPrice > 0)
          .sort((a, b) => a.qty - b.qty);

        if (tiers.length > 0) {
          let picked = tiers[0];
          for (const t of tiers) {
            if (qty >= t.qty) picked = t;
          }
          const billableQty = Math.max(qty, picked.qty);
          const rawSubtotal = Math.round(picked.unitPrice * billableQty * 100) + fileFeeCents;
          const finalSubtotal = Math.max(rawSubtotal, minimumCents);
          const tax = Math.round(finalSubtotal * HST_RATE);
          return {
            unitAmount: Math.max(1, Math.round(finalSubtotal / qty)),
            subtotal: finalSubtotal,
            tax,
            total: finalSubtotal + tax,
            sqft: null,
            breakdown: null,
            isEstimate: true,
          };
        }
      }
    }

    return null;
  }, [quantity, widthIn, heightIn, selectedSize, selectedSizeLabel, product.pricingPreset]);

  // Debounced /api/quote fetch (300ms)
  const requestQuote = useCallback(
    async (slug, qty, w, h, mat, sizeLabel, addonIds, finishingIds, namesCount) => {
      const body = { slug, quantity: qty };
      if (dimensionsEnabled || isCustomSize) {
        body.widthIn = w;
        body.heightIn = h;
      }
      if (mat) body.material = mat;
      if (sizeLabel) body.sizeLabel = sizeLabel;
      if (Array.isArray(addonIds) && addonIds.length > 0) body.addons = addonIds;
      if (Array.isArray(finishingIds) && finishingIds.length > 0) body.finishings = finishingIds;
      if (namesCount && namesCount > 1) body.names = namesCount;

      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      return res.json();
    },
    [dimensionsEnabled, isCustomSize]
  );

  useEffect(() => {
    if (!sizeValidation.valid) {
      setQuoteLoading(false);
      return;
    }
    let cancelled = false;
    clearTimeout(debounceRef.current);
    const sizeLabel = isCustomSize
      ? null
      : isBusinessCard
        ? bcSizeLabel
        : isTextEditor && editorMode === "box"
          ? editorSizeLabel
          : sizeOptions.length > 0
            ? selectedSizeLabel
            : null;

    const isMulti = multiSizeEnabled && useMultiSize;
    const namesCount = showMultiName && names > 1 ? names : undefined;
    const selectedAddonDefs = visibleAddons.filter((addon) => selectedAddons.includes(addon.id));
    const selectedFinishingDefs = finishings.filter((finishing) => selectedFinishings.includes(finishing.id));
    const perUnitAddonIds = selectedAddonDefs.filter((addon) => addon.type !== "flat").map((addon) => addon.id).sort();
    const flatAddonIds = selectedAddonDefs.filter((addon) => addon.type === "flat").map((addon) => addon.id).sort();
    const perUnitFinishingIds = selectedFinishingDefs.filter((finishing) => finishing.type !== "flat").map((finishing) => finishing.id).sort();
    const flatFinishingIds = selectedFinishingDefs.filter((finishing) => finishing.type === "flat").map((finishing) => finishing.id).sort();
    const activeRows = isMulti
      ? sizeRows
          .filter((row) => Number(row.quantity) > 0)
          .map((row) => ({
            quantity: Number(row.quantity),
            widthIn: Number(row.widthIn),
            heightIn: Number(row.heightIn),
          }))
      : [];

    const requestKey = JSON.stringify({
      slug: product.slug,
      isMulti,
      isCustomSize,
      quantity: Number(quantity),
      widthIn: Number(widthIn),
      heightIn: Number(heightIn),
      material: material || "",
      sizeLabel: sizeLabel || "",
      names: namesCount || 1,
      selectedAddons: [...selectedAddons].sort(),
      selectedFinishings: [...selectedFinishings].sort(),
      perUnitAddonIds,
      flatAddonIds,
      perUnitFinishingIds,
      flatFinishingIds,
      rows: activeRows,
    });

    if (requestKey === lastQuoteRequestKeyRef.current) return;
    lastQuoteRequestKeyRef.current = requestKey;

    const canUseExactLocalOnly =
      !isMulti &&
      !isCustomSize &&
      !dimensionsEnabled &&
      selectedAddons.length === 0 &&
      selectedFinishings.length === 0 &&
      selectedSize?.priceByQty &&
      typeof selectedSize.priceByQty === "object" &&
      Number.isFinite(selectedSize.priceByQty[String(Number(quantity) || 0)]);

    if (canUseExactLocalOnly) {
      setQuoteLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setQuoteLoading(true);
        setQuoteError(false);
        if (isMulti) {
          if (activeRows.length === 0) {
            if (!cancelled) setQuote(null);
            return;
          }
          const rowQuotes = await Promise.all(
            activeRows.map((row, idx) =>
              requestQuote(
                product.slug,
                row.quantity,
                row.widthIn,
                row.heightIn,
                material,
                sizeLabel,
                idx === 0 ? [...perUnitAddonIds, ...flatAddonIds] : perUnitAddonIds,
                idx === 0 ? [...perUnitFinishingIds, ...flatFinishingIds] : perUnitFinishingIds,
                namesCount
              )
            )
          );
          const valid = rowQuotes.filter((r) => r && typeof r.totalCents === "number");
          if (valid.length === 0) {
            if (!cancelled) { setQuote(null); setQuoteError(true); }
            return;
          }
          const totalCents = valid.reduce((sum, r) => sum + Number(r.totalCents || 0), 0);
          const totalQty = activeRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
          const sqftTotal = activeRows.reduce(
            (sum, row) => sum + (Number(row.widthIn || 0) * Number(row.heightIn || 0)) / 144 * Number(row.quantity || 0),
            0
          );
          const breakdown = activeRows.map((row, idx) => ({
            label: `Size #${idx + 1} (${Number(row.widthIn).toFixed(2)}" x ${Number(row.heightIn).toFixed(2)}") x ${Number(row.quantity)}`,
            amount: Number(valid[idx]?.totalCents || 0),
          }));
          if (!cancelled) {
            const unitCents = totalQty > 0 ? Math.round(totalCents / totalQty) : totalCents;
            setQuote({
              totalCents,
              currency: "CAD",
              unitCents,
              _productSlug: product.slug,
              _requestKey: requestKey,
              breakdown,
              meta: {
                model: "MULTI_SIZE",
                rows: activeRows,
                totalQty,
                sqftTotal,
                sqftPerUnit: totalQty > 0 ? sqftTotal / totalQty : null,
              },
            });
            trackQuoteLoaded({ slug: product.slug, quantity: totalQty, pricingModel: "MULTI_SIZE", totalCents, unitCents });
          }
          return;
        }

        const data = await requestQuote(
          product.slug,
          quantity,
          widthIn,
          heightIn,
          material,
          sizeLabel,
          selectedAddons,
          selectedFinishings,
          namesCount
        );
        if (!cancelled && data) {
          setQuote({
            ...data,
            _productSlug: product.slug,
            _requestKey: requestKey,
          });
          trackQuoteLoaded({ slug: product.slug, quantity, pricingModel: data.meta?.model || product.pricingPreset?.model, totalCents: data.totalCents, unitCents: data.unitCents });
        } else if (!cancelled) {
          setQuoteError(true);
        }
      } catch {
        if (!cancelled) setQuoteError(true);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [product.slug, quantity, widthIn, heightIn, material, selectedAddons, selectedFinishings, visibleAddons, finishings, editorSizeLabel, selectedSizeLabel, sizeOptions.length, isTextEditor, editorMode, sizeValidation.valid, requestQuote, isBusinessCard, bcSizeLabel, showMultiName, names, multiSizeEnabled, useMultiSize, sizeRows, dimensionsEnabled, selectedSize, isCustomSize]);

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

  useEffect(() => {
    if (
      quote &&
      quote._productSlug === product.slug &&
      typeof quote.totalCents === "number" &&
      quote.totalCents > 0
    ) {
      stableQuoteRef.current = quote;
    }
  }, [quote, product.slug]);

  // Derive display prices from quote (fallback only when quote isn't required).
  const priceData = useMemo(() => {
    const liveQuote = quote && quote._productSlug === product.slug ? quote : null;
    const cachedQuote =
      stableQuoteRef.current && stableQuoteRef.current._productSlug === product.slug
        ? stableQuoteRef.current
        : null;
    const activeQuote = liveQuote || cachedQuote;
    const qty = multiSizeEnabled && useMultiSize ? totalMultiQty || 1 : Number(quantity) || 1;
    if (activeQuote) {
      let tierFloorCents = 0;
      const presetModel = product?.pricingPreset?.model;
      const presetConfig = product?.pricingPreset?.config;
      if (presetModel === "QTY_TIERED" && Array.isArray(presetConfig?.tiers) && presetConfig.tiers.length > 0) {
        const firstTier = [...presetConfig.tiers]
          .filter((t) => t && typeof t === "object")
          .sort((a, b) => Number(a.minQty || 0) - Number(b.minQty || 0))[0];
        const minQty = Math.max(1, Number(firstTier?.minQty || 1));
        const unitPrice = Number(firstTier?.unitPrice || 0);
        if (Number.isFinite(unitPrice) && unitPrice > 0) {
          tierFloorCents = Math.round(unitPrice * minQty * 100);
        }
      }

      const minimumCents = Number(product?.pricingPreset?.config?.minimumPrice || 0) > 0
        ? Math.round(Number(product.pricingPreset.config.minimumPrice) * 100)
        : 0;
      const subtotal = Math.max(Number(activeQuote.totalCents || 0), minimumCents, tierFloorCents);
      const tax = Math.round(subtotal * HST_RATE);
      const unitAmount = Math.max(Number(activeQuote.unitCents || 0), Math.round(subtotal / qty));
      const sqft = activeQuote.meta?.sqftPerUnit ?? null;
      return { unitAmount, subtotal, tax, total: subtotal + tax, sqft, breakdown: activeQuote.breakdown };
    }

    const quoteRequired =
      Boolean(product.pricingPreset?.id) &&
      (isTextEditor || dimensionsEnabled || sizeOptions.length > 0 || activeQuantityChoices.length > 0);
    if (quoteRequired && localQuoteFallback) return localQuoteFallback;
    if (quoteRequired) {
      // If the quote API already failed and there's no local fallback, show "Request a Quote" instead of hanging
      if (quoteError) {
        return { unitAmount: null, subtotal: null, tax: null, total: null, sqft: null, breakdown: null, unpriced: true };
      }
      return { unitAmount: null, subtotal: null, tax: null, total: null, sqft: null, breakdown: null, pending: true };
    }

    // If no quote and basePrice is missing, avoid showing misleading $0.01 pricing.
    if (!product.basePrice || product.basePrice <= 0) {
      return { unitAmount: null, subtotal: null, tax: null, total: null, sqft: null, breakdown: null, unpriced: true };
    }

    // Fallback while loading
    const baseUnitCents = product.basePrice;
    if (dimensionsEnabled && multiSizeEnabled && useMultiSize) {
      const subtotal = Math.max(1, Math.round(baseUnitCents * multiSqftTotal));
      const tax = Math.round(subtotal * HST_RATE);
      const unitAmount = Math.round(subtotal / qty);
      return { unitAmount, subtotal, tax, total: subtotal + tax, sqft: qty > 0 ? multiSqftTotal / qty : null, breakdown: null };
    }
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
  }, [quote, quantity, product.basePrice, product.slug, widthIn, heightIn, isPerSqft, dimensionsEnabled, multiSizeEnabled, useMultiSize, totalMultiQty, multiSqftTotal, product.pricingPreset?.id, product.pricingPreset?.model, product.pricingPreset?.config, product.pricingPreset?.config?.minimumPrice, isTextEditor, sizeOptions.length, activeQuantityChoices.length, localQuoteFallback, quoteError]);

  // Tier rows - quick client estimates for the tier table
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

  // Only include specs that have real values (not N/A)
  const specs = [
    product.type && [t("product.spec.productType"), product.type],
    product.minWidthIn && product.minHeightIn && [t("product.spec.minSize"), `${product.minWidthIn}" x ${product.minHeightIn}"`],
    product.maxWidthIn && product.maxHeightIn && [t("product.spec.maxSize"), `${product.maxWidthIn}" x ${product.maxHeightIn}"`],
    product.minDpi && [t("product.spec.minDpi"), String(product.minDpi)],
    product.requiresBleed && [t("product.spec.bleed"), t("product.spec.bleedRequired", { inches: product.bleedIn || 0.125 })],
  ].filter(Boolean);

  function setSizeValue(type, value) {
    const n = Math.max(0.5, Number(value) || 0.5);
    const inValue = unit === "in" ? n : n / INCH_TO_CM;
    if (type === "w") setWidthIn(Number(inValue.toFixed(2)));
    if (type === "h") setHeightIn(Number(inValue.toFixed(2)));
  }

  function setRowValue(rowId, field, value) {
    setSizeRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (field === "quantity") {
          const q = Math.max(1, Number(value) || 1);
          return { ...row, quantity: q };
        }
        const n = Math.max(0.5, Number(value) || 0.5);
        const inValue = unit === "in" ? n : n / INCH_TO_CM;
        return { ...row, [field]: Number(inValue.toFixed(2)) };
      })
    );
  }

  function addSizeRow() {
    setSizeRows((prev) => {
      const last = prev[prev.length - 1] || { widthIn, heightIn, quantity: 1 };
      return [
        ...prev,
        {
          id: createSizeRowId(),
          widthIn: Number(last.widthIn) || 3,
          heightIn: Number(last.heightIn) || 3,
          quantity: Number(last.quantity) || 1,
        },
      ];
    });
  }

  function removeSizeRow(rowId) {
    setSizeRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== rowId)));
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
    const final = Math.min(range.max, Math.max(range.min, stepped));
    setQuantity(final);
    trackOptionChange({ slug: product.slug, option: "quantity", value: String(final), quantity: final, pricingModel: product.pricingPreset?.model });
  }

  const canAddToCart = sizeValidation.valid && !priceData.unpriced && !priceData.pending;
  const hasResolvedQuote = Boolean(
    (quote &&
      quote._productSlug === product.slug &&
      typeof quote.totalCents === "number" &&
      quote.totalCents > 0) ||
      (stableQuoteRef.current &&
        stableQuoteRef.current._productSlug === product.slug &&
        typeof stableQuoteRef.current.totalCents === "number" &&
        stableQuoteRef.current.totalCents > 0)
  );
  const preTaxDisplay =
    priceData.pending
      ? "Calculating..."
      : !priceData.unpriced && typeof priceData.subtotal === "number"
      ? `${priceData.isEstimate ? "~\u2009" : ""}${formatCad(priceData.subtotal)}`
      : t("product.priceOnRequest");
  const quickSelection = useMemo(() => {
    const rows = [];
    rows.push({
      label: "Qty",
      value: multiSizeEnabled && useMultiSize ? `${totalMultiQty} pcs (${sizeRows.length} sizes)` : `${quantity} pcs`,
    });
    if ((dimensionsEnabled || isCustomSize) && !useMultiSize && widthIn && heightIn) {
      rows.push({ label: "Size", value: `${Number(widthIn).toFixed(2)} in x ${Number(heightIn).toFixed(2)} in${isCustomSize ? " (custom)" : ""}` });
    }
    if (material) rows.push({ label: "Material", value: material });
    if (selectedSize?.displayLabel || selectedSize?.label || bcSizeLabel) {
      rows.push({ label: "Option", value: selectedSize?.displayLabel || selectedSize?.label || bcSizeLabel });
    }
    if (selectedAddons.length > 0) rows.push({ label: "Add-ons", value: `${selectedAddons.length} selected` });
    if (selectedFinishings.length > 0) rows.push({ label: "Finish", value: `${selectedFinishings.length} selected` });
    return rows;
  }, [
    multiSizeEnabled,
    useMultiSize,
    totalMultiQty,
    sizeRows.length,
    quantity,
    dimensionsEnabled,
    widthIn,
    heightIn,
    material,
    selectedSize,
    bcSizeLabel,
    selectedAddons.length,
    selectedFinishings.length,
  ]);

  function buildCartItem() {
    if (!canAddToCart) return null;
    const effectiveQty = multiSizeEnabled && useMultiSize ? totalMultiQty : Number(quantity);
    const sizeRowsMeta = multiSizeEnabled && useMultiSize
      ? sizeRows.map((row) => ({
          width: Number(row.widthIn),
          height: Number(row.heightIn),
          quantity: Number(row.quantity),
          sqft: Number(((Number(row.widthIn) * Number(row.heightIn)) / 144).toFixed(4)),
        }))
      : null;

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

    const stampExtras = editorExtrasRef.current || {};
    const editorMeta = isTextEditor
      ? {
          editorType: "text",
          editorMode,
          editorSizeLabel: editorMode === "box" ? editorSizeLabel : null,
          editorText: String(editorText || "").trim(),
          editorFont: String(editorFont || ""),
          editorColor: String(editorColor || ""),
          ...(editorMode === "box" ? {
            stampLogoUrl: stampExtras.logoFile?.url || null,
            stampLogoKey: stampExtras.logoFile?.key || null,
            stampCurveAmount: stampExtras.curveAmount || 0,
            stampTemplate: stampExtras.template || null,
          } : {}),
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

    const effectiveSizeLabel = isCustomSize
      ? `${widthIn}" × ${heightIn}" (custom)`
      : isBusinessCard
        ? bcSizeLabel
        : selectedSize?.label || null;

    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitAmount: priceData.unitAmount,
      quantity: effectiveQty,
      image: primaryImage,
      meta: {
        width: (dimensionsEnabled || isCustomSize) ? widthIn : null,
        height: (dimensionsEnabled || isCustomSize) ? heightIn : null,
        sizeMode: sizeRowsMeta ? "multi" : "single",
        sizeRows: sizeRowsMeta,
        material,
        sizeLabel: effectiveSizeLabel,
        sceneId: selectedScene?.id || null,
        sceneLabel: selectedScene?.label || null,
        addons: selectedAddons,
        finishings: selectedFinishings,
        fileName: uploadedArtwork?.name || null,
        pricingUnit: product.pricingUnit,
        ...artworkMeta,
        ...editorMeta,
        ...bcMeta,
      },
      id: product.id,
      price: priceData.unitAmount,
      options: {
        width: (dimensionsEnabled || isCustomSize) ? widthIn : null,
        height: (dimensionsEnabled || isCustomSize) ? heightIn : null,
        sizeMode: sizeRowsMeta ? "multi" : "single",
        sizeRows: sizeRowsMeta,
        material,
        sizeLabel: effectiveSizeLabel,
        sceneId: selectedScene?.id || null,
        sceneLabel: selectedScene?.label || null,
        addons: selectedAddons,
        finishings: selectedFinishings,
        fileName: uploadedArtwork?.name || null,
        pricingUnit: product.pricingUnit,
        ...artworkMeta,
        ...editorMeta,
        ...bcMeta,
      },
    };
  }

  function handleDownloadQuotePdf() {
    const payload = {
      generatedAt: new Date().toISOString(),
      productName: product.name,
      productSlug: product.slug,
      category: product.category,
      quantity: multiSizeEnabled && useMultiSize ? totalMultiQty : quantity,
      unitAmount: priceData.unitAmount,
      subtotal: priceData.subtotal,
      tax: priceData.tax,
      total: priceData.total,
      currency: "CAD",
      turnaroundKey,
      selections: quickSelection.slice(0, 10),
    };
    const encoded = encodeURIComponent(JSON.stringify(payload));
    window.open(`/quote/print?data=${encoded}`, "_blank", "noopener,noreferrer");
  }

  function handleAddToCart() {
    const item = buildCartItem();
    if (!item) return;
    addItem(item);
    openCart();
    trackAddToCart({ name: product.name, value: priceData.subtotal, slug: product.slug, quantity, pricingModel: product.pricingPreset?.model });
    showSuccessToast(t("product.addedToCart"));
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
  }

  async function handleBuyNow() {
    const item = buildCartItem();
    if (!item || buyNowLoading) return;
    trackBuyNow({ name: product.name, value: priceData.subtotal });
    setBuyNowLoading(true);
    try {
      const checkoutItem = {
        productId: String(item.productId || item.id),
        slug: String(item.slug || "unknown"),
        name: item.name,
        unitAmount: item.unitAmount ?? item.price ?? 0,
        quantity: item.quantity,
        meta: normalizeCheckoutMeta(item.meta ?? item.options ?? {}),
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [checkoutItem] }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }
      window.location.href = data.url;
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBuyNowLoading(false);
    }
  }

  const Wrapper = embedded ? "section" : "main";

  return (
    <Wrapper className={embedded ? "text-[var(--color-gray-800)]" : "bg-[radial-gradient(circle_at_top,_var(--color-gray-50),_var(--color-gray-100)_45%,_var(--color-gray-50))] pb-20 pt-10 text-[var(--color-gray-800)]"}>
      <div className={embedded ? "mx-auto max-w-6xl space-y-6 lg:space-y-10 px-4 sm:px-6" : "mx-auto max-w-[1600px] space-y-6 lg:space-y-8 px-4 sm:px-6 2xl:px-4"}>
        {!embedded && (
          <Breadcrumbs items={[
            { label: t("product.shop"), href: "/shop" },
            { label: product.category.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), href: `/shop?category=${product.category}` },
            { label: product.name }
          ]} />
        )}

        {!embedded && moved && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {movedFromLabel ? t("product.movedCategoryFrom", { from: movedFromLabel }) : t("product.movedCategory")}
          </div>
        )}

        {/* Mobile-only header - shows title before gallery on small screens */}
        {!embedded && (
          <header className="lg:hidden">
            <div className="flex items-start gap-3">
              <h1 className="flex-1 text-3xl font-black tracking-tight text-gray-950">{product.name}</h1>
              <button
                type="button"
                onClick={() => {
                  const added = toggleFavorite({ slug: product.slug, category: product.category, name: product.name, image: getProductImage(product), basePrice: product.basePrice });
                  showSuccessToast(added ? t("favorites.added") : t("favorites.removed"));
                }}
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-gray-200)] transition-colors hover:bg-[var(--color-gray-50)]"
              >
                <svg className={`h-5 w-5 transition-colors ${isFavorite(product.slug) ? "fill-red-500 text-red-500" : "fill-none text-[var(--color-gray-400)]"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {(() => {
                const tk = getTurnaround(product);
                return (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${turnaroundColor(tk)}`}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t(turnaroundI18nKey(tk))}
                  </span>
                );
              })()}
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t("trust.madeToOrder")}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-gray-600)]">{product.description || t("product.defaultDescription")}</p>
          </header>
        )}

        <section className="grid gap-6 lg:gap-8 xl:gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <ImageGallery images={imageList} productName={product.name} />

            {templateGallery && <TemplateGallery templates={templateGallery} />}

            {productSpecs ? (
              <div className="rounded-3xl border border-[var(--color-gray-200)] bg-white/95 p-4 shadow-sm sm:p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">{t("bc.specs")}</h3>
                <div className="mt-3 divide-y divide-[var(--color-gray-100)]">
                  {productSpecs.dimensions && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-[var(--color-gray-500)]">{t("bc.specs.dimensions")}</span>
                      <span className="font-medium text-[var(--color-gray-900)]">{productSpecs.dimensions}</span>
                    </div>
                  )}
                  {productSpecs.paper && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-[var(--color-gray-500)]">{t("bc.specs.paper")}</span>
                      <span className="font-medium text-[var(--color-gray-900)]">{productSpecs.paper}</span>
                    </div>
                  )}
                  {productSpecs.finish && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-[var(--color-gray-500)]">{t("bc.specs.finish")}</span>
                      <span className="font-medium text-[var(--color-gray-900)]">{productSpecs.finish}</span>
                    </div>
                  )}
                  {productSpecs.corners && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-[var(--color-gray-500)]">{t("bc.specs.corners")}</span>
                      <span className="font-medium text-[var(--color-gray-900)]">{productSpecs.corners}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-gray-500)]">
                  <span>{t("bc.specs.customSize")}</span>
                  <a href="/quote" className="font-semibold text-[var(--color-gray-700)] underline hover:text-[var(--color-gray-900)]">{t("bc.specs.contactUs")}</a>
                </div>
              </div>
            ) : specs.length > 0 ? (
              <div className="hidden lg:block rounded-3xl border border-[var(--color-gray-200)] bg-white/95 p-4 shadow-sm sm:p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">{t("product.specifications")}</h3>
                <div className="mt-3 divide-y divide-[var(--color-gray-100)]">
                  {specs.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-[var(--color-gray-500)]">{k}</span>
                      <span className="font-medium text-[var(--color-gray-900)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6 lg:col-span-4 lg:self-start">
            {/* Desktop-only header - hidden on mobile where it appears above the grid */}
            {!embedded && (
              <header className="hidden lg:block">
                <div className="flex items-start gap-3">
                  <h1 className="flex-1 text-4xl font-black tracking-tight text-gray-950 xl:text-5xl">{product.name}</h1>
                  <button
                    type="button"
                    onClick={() => {
                      const added = toggleFavorite({ slug: product.slug, category: product.category, name: product.name, image: getProductImage(product), basePrice: product.basePrice });
                      showSuccessToast(added ? t("favorites.added") : t("favorites.removed"));
                    }}
                    className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-gray-200)] transition-colors hover:bg-[var(--color-gray-50)]"
                  >
                    <svg className={`h-5 w-5 transition-colors ${isFavorite(product.slug) ? "fill-red-500 text-red-500" : "fill-none text-[var(--color-gray-400)]"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${turnaroundColor(turnaroundKey)}`}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t(turnaroundI18nKey(turnaroundKey))}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t("trust.madeToOrder")}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-gray-900)]">{product.description || t("product.defaultDescription")}</p>
              </header>
            )}

            <div className="rounded-3xl border border-[var(--color-gray-200)] bg-white/95 p-4 shadow-sm ring-1 ring-white sm:p-6 lg:sticky lg:top-24 flex flex-col">
              {/* PRICE + QUANTITY + ATC (always visible, order-1) */}
              <div className="order-1 rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 sm:p-5">
                {inventorySignal && (
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        inventorySignal.tone === "green"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {inventorySignal.label}
                    </span>
                  </div>
                )}
                {/* Price display */}
                <div className="flex items-baseline justify-between">
                  {priceData.unpriced ? (
                    <a
                      href={`/quote?product=${product.slug}&name=${encodeURIComponent(product.name)}`}
                      className="text-lg font-bold text-[var(--color-gray-900)] underline"
                    >
                      {t("product.priceOnRequest")}
                    </a>
                  ) : priceData.pending ? (
                    <span className="text-2xl font-bold text-[var(--color-gray-900)]">Calculating...</span>
                  ) : (
                    <div>
                      <span className="text-2xl font-bold text-[var(--color-gray-900)]">
                        {priceData.isEstimate ? "~\u2009" : ""}{formatCad(priceData.subtotal)}
                      </span>
                      <span className="ml-1 text-xs text-[var(--color-gray-500)]">{t("product.cad")}</span>
                      {priceData.isEstimate && !quoteLoading && <span className="ml-2 text-[10px] text-[var(--color-gray-400)]">Est.</span>}
                      {quoteLoading && !hasResolvedQuote && <span className="ml-2 text-xs text-[var(--color-gray-400)]">updating...</span>}
                    </div>
                  )}
                  {!priceData.unpriced && priceData.unitAmount != null && (
                    <span className="text-xs text-[var(--color-gray-900)]">{priceData.isEstimate ? "~\u2009" : ""}{formatCad(priceData.unitAmount)} {t("product.unit")}</span>
                  )}
                </div>

                {/* Quantity */}
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.quantity")}</p>
                  {multiSizeEnabled && useMultiSize ? (
                    <p className="mt-2 text-sm text-[var(--color-gray-700)]">
                      {totalMultiQty} pcs across {sizeRows.length} sizes
                    </p>
                  ) : activeQuantityChoices.length > 0 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const idx = activeQuantityChoices.indexOf(quantity);
                          const next = idx > 0 ? activeQuantityChoices[idx - 1] : activeQuantityChoices[0];
                          setQuantityValue(next);
                        }}
                        className="h-10 w-10 rounded-xl border-2 border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)]"
                      >
                        -
                      </button>
                      <select
                        value={String(quantity)}
                        onChange={(e) => setQuantityValue(Number(e.target.value))}
                        className="min-w-[140px] flex-1 rounded-xl border-2 border-[var(--color-gray-200)] bg-white px-3 py-2.5 text-center text-sm font-semibold text-[var(--color-gray-900)] transition-colors hover:border-[var(--color-gray-400)] sm:w-36 sm:flex-none"
                      >
                        {activeQuantityChoices.map((q) => (
                          <option key={q} value={q}>{q}{q === smartDefaults.minQuantity ? " \u2605" : ""}</option>
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
                        className="h-10 w-10 rounded-xl border-2 border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)]"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button onClick={() => setQuantityValue(quantity - (quantityRange?.step || 1))} className="h-10 w-10 rounded-xl border-2 border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)]">-</button>
                      <input type="number" value={quantity} onChange={(e) => setQuantityValue(e.target.value)} className="min-w-[140px] flex-1 rounded-xl border-2 border-[var(--color-gray-200)] bg-white px-3 py-2.5 text-center text-sm font-semibold text-[var(--color-gray-900)] transition-colors hover:border-[var(--color-gray-400)] sm:w-36 sm:flex-none" />
                      <button onClick={() => setQuantityValue(quantity + (quantityRange?.step || 1))} className="h-10 w-10 rounded-xl border-2 border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)]">+</button>
                    </div>
                  )}
                </div>

                {/* Add to Cart button */}
                <div ref={addToCartRef} className="mt-5">
                  <button
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                    className={`btn-primary-pill w-full px-4 py-3.5 text-sm ${
                      !canAddToCart
                        ? "bg-[var(--color-gray-300)] cursor-not-allowed"
                        : added
                          ? "bg-emerald-600"
                          : ""
                    }`}
                  >
                    {!canAddToCart
                      ? priceData.pending
                        ? "Calculating..."
                        : priceData.unpriced
                          ? t("product.priceOnRequest")
                          : t("product.fixSizeErrors")
                      : added
                        ? t("product.added")
                        : t("product.addToCart")}
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!canAddToCart || buyNowLoading}
                    className={`btn-secondary-pill w-full px-4 py-3 text-xs transition-all ${
                      !canAddToCart || buyNowLoading
                        ? "cursor-not-allowed border-[var(--color-gray-200)] bg-[var(--color-gray-100)] text-[var(--color-gray-400)]"
                        : ""
                    }`}
                  >
                    {buyNowLoading ? "Processing..." : "Buy Now"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleDownloadQuotePdf}
                    disabled={priceData.unpriced}
                    className="rounded-lg border border-[var(--color-gray-200)] px-3 py-1.5 font-medium text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-300)] hover:text-[var(--color-gray-800)] disabled:opacity-40"
                  >
                    Save Quote
                  </button>
                  <Link href="/quote" className="rounded-lg border border-[var(--color-gray-200)] px-3 py-1.5 font-medium text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-300)] hover:text-[var(--color-gray-800)]">
                    Custom Quote
                  </Link>
                </div>
              </div>

              {/* OPTIONS (collapsed on mobile, order-2) */}
              <div className="order-2 mt-5 border-t border-[var(--color-gray-100)] pt-4">

                {isBusinessCard && (
                  <div className="mb-5 space-y-4 rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-xl border border-[var(--color-gray-300)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--color-gray-700)]">Step 1: {t("bc.cardType")}</span>
                      <span className="rounded-xl border border-[var(--color-gray-300)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--color-gray-700)]">
                        Step 2: {cardType === "thick" ? t("bc.layers") : t("bc.sides")}
                      </span>
                      {multiNameConfig?.enabled && (
                        <span className="rounded-xl border border-[var(--color-gray-300)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--color-gray-700)]">Step 3: {t("bc.names")}</span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("bc.cardType")}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {cardTypes.map((ct) => (
                          <button
                            key={ct.id}
                            type="button"
                            onClick={() => setCardType(ct.id)}
                            className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                              cardType === ct.id
                                ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                                : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-900)] hover:border-[var(--color-gray-400)]"
                            }`}
                          >
                            <span className="block text-sm font-semibold">{t("bc.type." + ct.id) !== "bc.type." + ct.id ? t("bc.type." + ct.id) : ct.label}</span>
                            <span className={`block text-[11px] ${cardType === ct.id ? "text-[var(--color-gray-300)]" : "text-[var(--color-gray-500)]"}`}>{t("bc.desc." + ct.id) !== "bc.desc." + ct.id ? t("bc.desc." + ct.id) : ct.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {cardType !== "thick" && sidesOptions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("bc.sides")}</p>
                        <div className="mt-2 flex gap-2">
                          {sidesOptions.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSides(s.id)}
                              className={`flex-1 rounded-xl border-2 px-3 py-2 text-center text-sm font-semibold transition-all ${
                                sides === s.id
                                  ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                                  : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                              }`}
                            >
                              {t("bc.side." + s.id) !== "bc.side." + s.id ? t("bc.side." + s.id) : s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {cardType === "thick" && thickLayers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("bc.layers")}</p>
                        <div className="mt-2 flex gap-2">
                          {thickLayers.map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => setThickLayer(l.id)}
                              className={`flex-1 rounded-xl border-2 px-3 py-2 text-center text-sm font-semibold transition-all ${
                                thickLayer === l.id
                                  ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                                  : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                              }`}
                            >
                              {t("bc.layer." + l.id) !== "bc.layer." + l.id ? t("bc.layer." + l.id) : l.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {multiNameConfig?.enabled && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("bc.names")}</p>
                        <p className="mt-1 text-xs text-[var(--color-gray-500)]">{t("bc.namesHint")}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setNames((n) => Math.max(1, n - 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--color-gray-200)] bg-white text-sm font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)]"
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
                            className="w-24 rounded-xl border-2 border-[var(--color-gray-200)] px-2 py-2 text-center text-sm font-semibold text-[var(--color-gray-900)]"
                          />
                          <button
                            type="button"
                            onClick={() => setNames((n) => Math.min(multiNameConfig.maxNames || 20, n + 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--color-gray-200)] bg-white text-sm font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)]"
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

                {isTextEditor && (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.textEditor")}</p>

                    {editorMode === "box" && editorSizes.length > 0 && (
                      <label className="text-xs text-[var(--color-gray-600)]">
                        {t("product.model")}
                        <select
                          value={editorSizeLabel}
                          onChange={(e) => setEditorSizeLabel(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm"
                        >
                          {editorSizes.map((s) => (
                            <option key={s.label} value={s.label}>{s.label}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    {editorMode === "box" && selectedEditorSize && (
                      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.modelDetails")}</p>
                          <p className="text-xs font-semibold text-[var(--color-gray-900)]">{selectedEditorSize.label}</p>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-[var(--color-gray-700)]">
                          {selectedEditorSize.type && (
                            <p>
                              <span className="font-semibold text-[var(--color-gray-900)]">{t("product.stampType")}: </span>
                              <span>{selectedEditorSize.type}</span>
                            </p>
                          )}
                          {selectedEditorSize.shape === "round" ? (
                            typeof selectedEditorSize.diameterIn === "number" && (
                              <p>
                                <span className="font-semibold text-[var(--color-gray-900)]">{t("product.size")}: </span>
                                <span>
                                  {t("product.diameter")}: {selectedEditorSize.diameterIn}&quot;{selectedEditorSize.mm?.d ? ` (${selectedEditorSize.mm.d}mm)` : ""}
                                </span>
                              </p>
                            )
                          ) : (
                            typeof selectedEditorSize.widthIn === "number" &&
                            typeof selectedEditorSize.heightIn === "number" && (
                              <p>
                                <span className="font-semibold text-[var(--color-gray-900)]">{t("product.size")}: </span>
                                <span>
                                  {selectedEditorSize.widthIn}&quot; x {selectedEditorSize.heightIn}&quot;{selectedEditorSize.mm?.w && selectedEditorSize.mm?.h ? ` (${selectedEditorSize.mm.w} x ${selectedEditorSize.mm.h}mm)` : ""}
                                </span>
                              </p>
                            )
                          )}
                          {selectedEditorSize.details && (
                            <p>
                              <span className="font-semibold text-[var(--color-gray-900)]">{t("product.details")}: </span>
                              <span>{selectedEditorSize.details}</span>
                            </p>
                          )}
                          {selectedEditorSize.replacementPad && (
                            <p>
                              <span className="font-semibold text-[var(--color-gray-900)]">{t("product.replacementPad")}: </span>
                              <span>{selectedEditorSize.replacementPad}</span>
                            </p>
                          )}
                        </div>
                        <p className="mt-3 text-[11px] text-[var(--color-gray-500)]">{t("product.previewNote")}</p>
                      </div>
                    )}

                    <label className="text-xs text-[var(--color-gray-600)]">
                      {t("product.text")}
                      <textarea
                        rows={editorMode === "box" ? 3 : 1}
                        value={editorText}
                        onChange={(e) => setEditorText(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm"
                        placeholder="ABC"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-[var(--color-gray-600)]">
                        {t("product.font")}
                        <select
                          value={editorFont}
                          onChange={(e) => setEditorFont(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm"
                        >
                          {editorFonts.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </label>

                      {editorMode !== "box" && <label className="text-xs text-[var(--color-gray-600)]">
                        {t("product.color")}
                        <input
                          type="color"
                          value={editorColor}
                          onChange={(e) => setEditorColor(e.target.value)}
                          className="mt-1 h-[42px] w-full rounded-xl border border-[var(--color-gray-300)] bg-white px-2 py-2"
                        />
                      </label>}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.sizeUnit")}</p>
                      <div className="flex rounded-xl border-2 border-[var(--color-gray-200)] bg-white p-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setUnit("in")}
                          className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${unit === "in" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)] hover:bg-[var(--color-gray-50)]"}`}
                        >
                          {t("product.inches")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnit("cm")}
                          className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${unit === "cm" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)] hover:bg-[var(--color-gray-50)]"}`}
                        >
                          {t("product.cm")}
                        </button>
                      </div>
                    </div>

                    {editorMode === "lettering" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs text-[var(--color-gray-600)]">
                          {t("product.letterHeight", { unit })}
                          <input
                            type="number"
                            value={heightDisplay}
                            onChange={(e) => setSizeValue("h", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-xs text-[var(--color-gray-600)]">
                          {t("product.width", { unit })}
                          <input
                            type="number"
                            value={widthDisplay}
                            readOnly
                            className="mt-1 w-full rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-2 text-sm text-[var(--color-gray-700)]"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs text-[var(--color-gray-600)]">
                          {t("product.width", { unit })}
                          <input
                            type="number"
                            value={widthDisplay}
                            readOnly
                            className="mt-1 w-full rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-2 text-sm text-[var(--color-gray-700)]"
                          />
                        </label>
                        <label className="text-xs text-[var(--color-gray-600)]">
                          {t("product.height", { unit })}
                          <input
                            type="number"
                            value={heightDisplay}
                            readOnly
                            className="mt-1 w-full rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-2 text-sm text-[var(--color-gray-700)]"
                          />
                        </label>
                      </div>
                    )}

                    <p className="text-xs text-[var(--color-gray-500)]">{t("product.estimatedSize", { w: widthIn?.toFixed(2), h: heightIn?.toFixed(2) })}</p>

                    {editorMode === "box" ? (
                      <StampEditor
                        shape={selectedEditorSize?.shape || "rect"}
                        widthIn={selectedEditorSize?.widthIn}
                        heightIn={selectedEditorSize?.heightIn}
                        diameterIn={selectedEditorSize?.diameterIn}
                        text={editorText}
                        font={editorFont}
                        color={editorColor}
                        onChange={(patch) => {
                          if (patch.color) setEditorColor(patch.color);
                          if (patch.text !== undefined) setEditorText(patch.text);
                          if (patch.font) setEditorFont(patch.font);
                          editorExtrasRef.current = {
                            curveAmount: patch.curveAmount,
                            logoFile: patch.logoFile,
                            template: patch.template,
                          };
                        }}
                      />
                    ) : (
                      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-3">
                        <div className="aspect-[3/1] w-full overflow-hidden rounded-xl bg-[var(--color-gray-50)]">
                          <svg viewBox="0 0 1000 300" className="h-full w-full">
                            <rect x="0" y="0" width="1000" height="300" fill="white" />
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
                          </svg>
                        </div>
                      </div>
                    )}

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
                  <div className="flex items-center justify-between rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">Multi-Size</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!useMultiSize) {
                          setSizeRows([
                            {
                              id: createSizeRowId(),
                              widthIn,
                              heightIn,
                              quantity: Number(quantity) || 1,
                            },
                          ]);
                        }
                        setUseMultiSize((prev) => !prev);
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${useMultiSize ? "bg-[var(--color-ink-black)] text-white" : "border border-[var(--color-gray-300)] bg-white text-[var(--color-gray-700)]"}`}
                    >
                      {useMultiSize ? "On" : "Off"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.sizeUnit")}</p>
                    <div className="flex rounded-xl border-2 border-[var(--color-gray-200)] bg-white p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setUnit("in")}
                        className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${unit === "in" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)] hover:bg-[var(--color-gray-50)]"}`}
                      >
                        {t("product.inches")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnit("cm")}
                        className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${unit === "cm" ? "bg-[var(--color-ink-black)] text-white" : "text-[var(--color-gray-600)] hover:bg-[var(--color-gray-50)]"}`}
                      >
                        {t("product.cm")}
                      </button>
                    </div>
                  </div>

                  {!useMultiSize ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs text-[var(--color-gray-600)]">
                          {t("product.width", { unit })}
                          <input
                            type="number"
                            value={widthDisplay}
                            onChange={(e) => setSizeValue("w", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-xs text-[var(--color-gray-600)]">
                          {t("product.height", { unit })}
                          <input
                            type="number"
                            value={heightDisplay}
                            onChange={(e) => setSizeValue("h", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-[var(--color-gray-500)]">{t("product.areaPerUnit", { sqft: priceData.sqft?.toFixed(3) })}</p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {sizeRows.map((row, idx) => {
                        const widthDisplayRow = unit === "in" ? Number(row.widthIn) : Number((Number(row.widthIn) * INCH_TO_CM).toFixed(2));
                        const heightDisplayRow = unit === "in" ? Number(row.heightIn) : Number((Number(row.heightIn) * INCH_TO_CM).toFixed(2));
                        return (
                          <div key={row.id} className="rounded-xl border border-[var(--color-gray-200)] p-3">
                            <p className="text-xs font-semibold text-[var(--color-gray-500)]">Size #{idx + 1}</p>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              <label className="text-xs text-[var(--color-gray-600)]">
                                W
                                <input
                                  type="number"
                                  value={widthDisplayRow}
                                  onChange={(e) => setRowValue(row.id, "widthIn", e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-[var(--color-gray-300)] px-2 py-1.5 text-sm"
                                />
                              </label>
                              <label className="text-xs text-[var(--color-gray-600)]">
                                H
                                <input
                                  type="number"
                                  value={heightDisplayRow}
                                  onChange={(e) => setRowValue(row.id, "heightIn", e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-[var(--color-gray-300)] px-2 py-1.5 text-sm"
                                />
                              </label>
                              <label className="text-xs text-[var(--color-gray-600)]">
                                Qty
                                <input
                                  type="number"
                                  min="1"
                                  value={row.quantity}
                                  onChange={(e) => setRowValue(row.id, "quantity", e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-[var(--color-gray-300)] px-2 py-1.5 text-sm"
                                />
                              </label>
                            </div>
                            {sizeRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSizeRow(row.id)}
                                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={addSizeRow}
                        className="w-full rounded-xl border border-dashed border-[var(--color-gray-400)] px-3 py-2 text-sm font-semibold text-[var(--color-gray-700)] hover:border-[var(--color-gray-600)]"
                      >
                        + Add Another Size
                      </button>
                      <p className="text-xs text-[var(--color-gray-500)]">
                        Total area: {multiSqftTotal.toFixed(3)} sq.ft | Total qty: {totalMultiQty}
                      </p>
                    </div>
                  )}
                  {!sizeValidation.valid && (
                    <div className="mt-1 space-y-1">
                      {sizeValidation.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-500">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 space-y-5">
                  {scenes.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.scene")}</label>
                      <select value={sceneId} onChange={(e) => setSceneId(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm">
                        {scenes.map((scene) => (
                          <option key={scene.id} value={scene.id}>{scene.label}</option>
                        ))}
                      </select>
                      {selectedScene?.description && <p className="mt-2 text-xs text-[var(--color-gray-500)]">{selectedScene.description}</p>}
                    </div>
                  )}

              {/* Multi-name stepper (for split products that have multiName but aren't the old combined card) */}
              {!isBusinessCard && showMultiName && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("bc.names")}</p>
                  <p className="mt-1 text-xs text-[var(--color-gray-500)]">{t("bc.namesHint")}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNames((n) => Math.max(1, n - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--color-gray-200)] bg-white text-sm font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)]"
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
                      className="w-24 rounded-xl border-2 border-[var(--color-gray-200)] px-2 py-2 text-center text-sm font-semibold text-[var(--color-gray-900)]"
                    />
                    <button
                      type="button"
                      onClick={() => setNames((n) => Math.min(multiNameConfig.maxNames || 20, n + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--color-gray-200)] bg-white text-sm font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-400)]"
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
                  {variantConfig.enabled ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.size")}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {variantConfig.bases.map((base) => {
                            const anyOpt = Object.values(variantConfig.byBase[base])[0];
                            const dims = anyOpt?.widthIn && anyOpt?.heightIn ? `${anyOpt.widthIn}" x ${anyOpt.heightIn}"` : (anyOpt?.notes || null);
                            let minPrice = Infinity;
                            for (const opt of Object.values(variantConfig.byBase[base])) {
                              const p = getStartingUnitPrice(opt);
                              if (p !== null) minPrice = Math.min(minPrice, p);
                            }
                            const isRec = variantConfig.recommendedBases.has(base);
                            const selected = variantBase === base;
                            return (
                              <button
                                key={base}
                                type="button"
                                onClick={() => setVariantBase(base)}
                                className={`relative rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                                  selected
                                    ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                                    : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-900)] hover:border-[var(--color-gray-400)]"
                                }`}
                              >
                                {isRec && (
                                  <span className={`absolute -top-2 right-2 rounded-full px-1.5 py-0.5 label-xs font-bold uppercase tracking-wider ${
                                    selected ? "bg-white text-[var(--color-ink-black)]" : "bg-[var(--color-ink-black)] text-white"
                                  }`}>{"\u2605"}</span>
                                )}
                                <span className="block text-sm font-semibold">{base}</span>
                                {dims && <span className={`mt-0.5 block text-[11px] ${selected ? "text-[var(--color-gray-300)]" : "text-[var(--color-gray-500)]"}`}>{dims}</span>}
                                {minPrice < Infinity && <span className={`mt-1 block text-xs font-bold ${selected ? "text-[var(--color-gray-200)]" : "text-[var(--color-gray-700)]"}`}>{t("product.from", { price: formatCad(minPrice) })}/ea</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{uiConfig?.variantLabel || t("product.color")}</p>
                        <div className="mt-2 flex gap-2">
                          {variantValueOptions.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setVariantValue(v)}
                              className={`flex-1 rounded-xl border-2 px-3 py-2 text-center text-sm font-semibold transition-all ${
                                variantValue === v
                                  ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                                  : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {!isCustomSize && (
                        <SizeGrid
                          sizeOptions={sizeOptions}
                          selectedSizeLabel={selectedSizeLabel}
                          onSelect={(label) => {
                            setIsCustomSize(false);
                            setSelectedSizeLabel(label);
                            trackOptionChange({ slug: product.slug, option: "size", value: label, quantity, pricingModel: product.pricingPreset?.model });
                          }}
                          getStartingUnitPrice={getStartingUnitPrice}
                          formatCad={formatCad}
                          label={uiConfig?.sizeToggleLabel || t("product.size")}
                          t={t}
                        />
                      )}

                      {allowCustomSize && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomSize(!isCustomSize);
                              if (!isCustomSize) {
                                const min = costPlusDefaults?.minDimensionIn || 1;
                                setWidthIn(Math.max(widthIn, min));
                                setHeightIn(Math.max(heightIn, min));
                              }
                            }}
                            className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                              isCustomSize
                                ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                                : "border-dashed border-[var(--color-gray-300)] text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
                            }`}
                          >
                            {isCustomSize ? "Custom Size" : "Custom Size..."}
                          </button>

                          {isCustomSize && (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <label className="text-xs font-medium text-[var(--color-gray-600)]">
                                  Width (in)
                                  <input
                                    type="number"
                                    min={costPlusDefaults?.minDimensionIn || 0.5}
                                    max={costPlusDefaults?.maxWidthIn || 53}
                                    step="0.25"
                                    value={widthIn}
                                    onChange={(e) => setSizeValue("w", e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm"
                                  />
                                </label>
                                <label className="text-xs font-medium text-[var(--color-gray-600)]">
                                  Height (in)
                                  <input
                                    type="number"
                                    min={costPlusDefaults?.minDimensionIn || 0.5}
                                    max={costPlusDefaults?.maxHeightIn || 53}
                                    step="0.25"
                                    value={heightIn}
                                    onChange={(e) => setSizeValue("h", e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm"
                                  />
                                </label>
                              </div>
                              {costPlusDefaults?.minDimensionIn && (
                                <p className="text-[11px] text-[var(--color-gray-500)]">
                                  Min {costPlusDefaults.minDimensionIn}" &times; {costPlusDefaults.minDimensionIn}" &mdash; Max {costPlusDefaults.maxWidthIn || 53}" &times; {costPlusDefaults.maxHeightIn || 53}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {selectedSize?.notes && !isCustomSize && <p className="text-xs text-[var(--color-gray-500)]">{selectedSize.notes}</p>}
                </div>
              )}

              {!hideMaterials && materials.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.material")}</p>
                  <div className="mt-2 space-y-1.5">
                    {materials.map((m) => {
                      const selected = material === m.id;
                      const isPopular = m.multiplier === 1.0;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMaterial(m.id)}
                          className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors text-left ${
                            selected
                              ? "border-[var(--color-ink-black)] bg-[var(--color-gray-50)] font-semibold"
                              : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                          }`}
                        >
                          <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${selected ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)]" : "border-[var(--color-gray-300)]"}`} />
                          <span className="flex-1">
                            {m.name}
                            {m.multiplier !== 1.0 && <span className="ml-1 text-xs text-[var(--color-gray-500)]">(+{Math.round((m.multiplier - 1) * 100)}%)</span>}
                          </span>
                          {isPopular && (
                            <span className="inline-block rounded-xl bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                              {t("product.popular")}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

                  {!hideAddons && visibleAddons.length > 0 && (
                    <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.addons")}</p>
                  <div className="space-y-2">
                    {visibleAddons.map((addon) => {
                      const addonChecked = selectedAddons.includes(addon.id);
                      return (
                      <label key={addon.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${addonChecked ? "border-[var(--color-ink-black)] bg-[var(--color-gray-50)]" : "border-[var(--color-gray-200)] bg-white"}`}>
                        <input
                          type="checkbox"
                          checked={addonChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddons((prev) => (prev.includes(addon.id) ? prev : [...prev, addon.id]));
                            } else {
                              setSelectedAddons((prev) => prev.filter((id) => id !== addon.id));
                            }
                            trackOptionChange({ slug: product.slug, option: "addon", value: addon.id, quantity, pricingModel: product.pricingPreset?.model });
                          }}
                          className="mt-0.5"
                        />
                        <span className="flex-1">
                          <span className="font-medium text-[var(--color-gray-900)]">
                            {t("bc.addon." + addon.id) !== "bc.addon." + addon.id ? t("bc.addon." + addon.id) : addon.name}
                            {addon.recommended && <span className="ml-1.5 inline-block rounded-xl bg-amber-100 px-1.5 py-0.5 label-xs font-bold uppercase tracking-wide text-amber-700">{t("product.popular")}</span>}
                          </span>
                          {addon.description && <span className="block text-xs text-[var(--color-gray-500)]">{addon.description}</span>}
                          {addon.price > 0 && (
                            <span className="block text-xs text-[var(--color-gray-500)]">
                              {addon.type === "flat" ? `$${addon.price.toFixed(2)} ${t("product.pricingFlat")}` : `$${addon.price.toFixed(2)}/${t("product.pricingUnit")}`}
                            </span>
                          )}
                        </span>
                      </label>
                      );
                    })}
                  </div>
                    </div>
                  )}

                  {!hideFinishings && finishings.length > 0 && (
                    <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.finishing")}</p>
                  <div className="flex gap-2">
                    {[false, true].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => {
                          setWantsFinishing(val);
                          if (!val) setSelectedFinishings([]);
                        }}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          wantsFinishing === val
                            ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                            : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:bg-[var(--color-gray-50)]"
                        }`}
                      >
                        {val ? t("product.finishingYes") : t("product.finishingNo")}
                      </button>
                    ))}
                  </div>
                  {wantsFinishing && (
                    <div className="space-y-2">
                      {finishings.map((f) => {
                        const isMulti = uiConfig?.finishingMode === "multi";
                        const checked = selectedFinishings.includes(f.id);
                        return (
                          <label key={f.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${checked ? "border-[var(--color-ink-black)] bg-[var(--color-gray-50)]" : "border-[var(--color-gray-200)] bg-white"}`}>
                            <input
                              type={isMulti ? "checkbox" : "radio"}
                              name="finishing"
                              checked={checked}
                              onChange={() => {
                                if (isMulti) {
                                  setSelectedFinishings((prev) => checked ? prev.filter((id) => id !== f.id) : [...prev, f.id]);
                                } else {
                                  setSelectedFinishings([f.id]);
                                }
                                trackOptionChange({ slug: product.slug, option: "finishing", value: f.id, quantity, pricingModel: product.pricingPreset?.model });
                              }}
                              className="mt-0.5"
                            />
                            <span className="flex-1">
                              <span className="font-medium text-[var(--color-gray-900)]">
                                {f.name}
                                {f.recommended && <span className="ml-1.5 inline-block rounded-xl bg-amber-100 px-1.5 py-0.5 label-xs font-bold uppercase tracking-wide text-amber-700">{t("product.popular")}</span>}
                              </span>
                              <span className="block text-xs text-[var(--color-gray-500)]">
                                {f.type === "flat" ? `$${f.price.toFixed(2)} ${t("product.pricingFlat")}` : f.type === "per_unit" ? `$${f.price.toFixed(2)}/${t("product.pricingUnit")}` : `$${f.price.toFixed(2)}/${t("product.pricingSqft")}`}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                    </div>
                  )}


                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("product.artworkUpload")}</p>
                    <ArtworkUpload
                      uploadedFile={uploadedArtwork}
                      onUploaded={(file) => setUploadedArtwork({ ...file, mime: null })}
                      onRemove={() => setUploadedArtwork(null)}
                      onBegin={() => trackUploadStarted({ slug: product.slug })}
                      t={t}
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>
          </div>
        </section>

        {!embedded && <ProductSpecsSection specs={specs} productSpecs={productSpecs} t={t} />}

        {!embedded && <RelatedProducts product={product} relatedProducts={relatedProducts} t={t} />}

        {!embedded && <RelatedLinks product={product} catalogConfig={catalogConfig} />}

        {!embedded && <RecentlyViewed excludeSlug={product.slug} />}
      </div>

        {/* Sticky mobile Add to Cart bar */}
        {stickyVisible && (
          <MobileBottomBar
            quoteLoading={!!priceData.pending}
            hasQuote={!priceData.unpriced && !priceData.pending && typeof priceData.total === "number"}
            totalCents={priceData.total || 0}
            summaryText={preTaxDisplay}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            t={t}
          />
        )}
    </Wrapper>
  );
}




