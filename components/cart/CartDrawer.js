"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCartStore, FREE_SHIPPING_THRESHOLD } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Image from "next/image";
import { PaymentBadges } from "@/components/TrustBadges";
import { trackBeginCheckout } from "@/lib/analytics";
import useFocusTrap from "@/lib/useFocusTrap";
import CartUpsell from "@/components/cart/CartUpsell";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import { isOversizedProduct } from "@/lib/pickup-hints";

import { HST_RATE, SHIPPING_COST, CHECKOUT_COOLDOWN_MS } from "@/lib/order-config";

function parseSizeRows(meta) {
  if (!meta || typeof meta !== "object") return [];
  const raw = meta.sizeRows;
  let rows = raw;
  if (typeof raw === "string") {
    try {
      rows = JSON.parse(raw);
    } catch {
      rows = [];
    }
  }
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const width = Number(row?.width ?? row?.widthIn);
      const height = Number(row?.height ?? row?.heightIn);
      const quantity = Number(row?.quantity);
      if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(quantity)) return null;
      if (width <= 0 || height <= 0 || quantity <= 0) return null;
      return { width, height, quantity };
    })
    .filter(Boolean);
}

import { normalizeCheckoutMeta as normalizeMeta, formatCad } from "@/lib/product-helpers";

function getDeliveryWindow() {
  const d = new Date();
  const addBusinessDays = (date, days) => {
    const n = new Date(date);
    let count = 0;
    while (count < days) {
      n.setDate(n.getDate() + 1);
      if (n.getDay() !== 0 && n.getDay() !== 6) count += 1;
    }
    return n;
  };
  const start = addBusinessDays(d, 2).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  const end = addBusinessDays(d, 4).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  return `${start} - ${end}`;
}

// Keys that are internal/technical and should never be shown to the customer.
const HIDDEN_META_KEYS = new Set([
  "intakeMode",
  "artworkIntent",
  "rushProduction",
  "designHelp",
  "designHelpFee",
  "category",
  "sizeRows",
  "sizeMode",
  "fileName",
  "slug",
  "productType",
  "turnaround",
  "sizeLabel",        // already shown in product name
  "width",            // shown via sizeRows or product name
  "height",
  "windDirection",
]);

// Human-readable labels for common option keys.
const META_LABELS = {
  material: "Material",
  materialName: "Material",
  cuttingType: "Cut",
  lamination: "Lamination",
  shape: "Shape",
  foilColor: "Foil",
  printMode: "Print",
  sides: "Sides",
  finishing: "Finishing",
  paperType: "Paper",
  coating: "Coating",
  quantity: "Qty",
  size: "Size",
};

/**
 * Build an array of human-friendly {label,value} pairs from rawMeta,
 * plus special badges for rush, design help, and artwork intent.
 */
function buildDisplayMeta(rawMeta, t) {
  const tags = [];      // [{label, value, color?}]
  const options = [];   // [{label, value}]

  if (!rawMeta || typeof rawMeta !== "object") return { tags, options };

  // --- Special badges ---
  if (rawMeta.rushProduction === true || rawMeta.rushProduction === "true") {
    tags.push({ label: t("cart.rushProduction"), color: "amber" });
  }
  if (rawMeta.designHelp === true || rawMeta.designHelp === "true") {
    tags.push({ label: t("cart.designHelp"), color: "indigo" });
  } else if (rawMeta.artworkIntent === "upload-later") {
    tags.push({ label: t("cart.artworkUploadLater"), color: "gray" });
  } else if (rawMeta.artworkIntent === "design-help") {
    tags.push({ label: t("cart.artworkDesignHelp"), color: "indigo" });
  }

  // --- Regular options ---
  for (const [key, val] of Object.entries(rawMeta)) {
    if (HIDDEN_META_KEYS.has(key)) continue;
    if (val == null || val === "" || val === "null" || val === "none" || val === "undefined") continue;
    // Skip booleans that are just flags (already handled above or irrelevant)
    if (val === true || val === "true" || val === false || val === "false") continue;
    // Skip numeric-only values that don't mean much on their own
    if (typeof val === "number") continue;

    // Prefer materialName over material if both exist
    if (key === "material" && rawMeta.materialName) continue;

    const label = META_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
    const display = typeof val === "string" ? val : String(val);
    // Skip JSON blobs
    if (display.startsWith("[") || display.startsWith("{")) continue;
    options.push({ label, value: display });
  }

  return { tags, options };
}

export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const cart = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [renderDrawer, setRenderDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(null);
  const [checkoutMode, setCheckoutMode] = useState("stripe");
  const [shippingMethod, setShippingMethod] = useState("delivery");
  const [promoOpen, setPromoOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    poNumber: "",
    paymentTerms: "net30",
    notes: "",
  });
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const checkoutInFlightRef = useRef(false);
  const lastCheckoutAtRef = useRef(0);
  const asideRef = useRef(null);
  useFocusTrap(asideRef, isOpen);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setRenderDrawer(true);
      document.body.style.overflow = "hidden";
      setCheckoutMode("stripe");
    } else {
      document.body.style.overflow = "";
      const ti = setTimeout(() => setRenderDrawer(false), 300);
      return () => clearTimeout(ti);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => {
      const lineTotal = (item.unitAmount ?? item.price ?? 0) * item.quantity;
      // Design help is a flat fee per line item, not per unit
      const opts = item.options || item.meta || {};
      const dhFee = (opts.designHelp === true || opts.designHelp === "true") ? (Number(opts.designHelpFee) || 4500) : 0;
      return sum + lineTotal + dhFee;
    }, 0),
    [cart]
  );

  const discountAmount = promoDiscount ? promoDiscount.discountAmount : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const shipping = shippingMethod === "pickup" ? 0 : afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxableBase = afterDiscount + shipping;
  const tax = Math.round(taxableBase * HST_RATE);
  const total = afterDiscount + shipping + tax;

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - afterDiscount);
  const freeShippingProgress = Math.min(100, (afterDiscount / FREE_SHIPPING_THRESHOLD) * 100);
  const qualifiesForFreeShipping = afterDiscount >= FREE_SHIPPING_THRESHOLD;

  const cartItems = useMemo(
    () =>
      cart.map((item) => {
        const unit = item.unitAmount ?? item.price ?? 0;
        const meta = normalizeMeta(item.meta ?? item.options ?? {});
        return {
          productId: String(item.productId ?? item.id ?? item._cartId),
          slug: String(item.slug ?? "unknown"),
          name: item.name,
          unitAmount: unit,
          quantity: item.quantity,
          meta,
          productName: item.name,
          productType: item.productType ?? "sticker",
          unitPrice: unit,
        };
      }),
    [cart]
  );

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        showErrorToast(data.error || t("cart.promoInvalid"));
        setPromoDiscount(null);
        return;
      }
      setPromoDiscount(data);
      showSuccessToast(t("cart.promoApplied", { code: data.code }));
    } catch {
      showErrorToast(t("cart.networkError"));
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      showErrorToast(t("cart.emptyError"));
      return;
    }

    if (checkoutInFlightRef.current || loading) {
      return;
    }

    const now = Date.now();
    if (now - lastCheckoutAtRef.current < CHECKOUT_COOLDOWN_MS) {
      showErrorToast(t("cart.checkoutCooldown"));
      return;
    }

    checkoutInFlightRef.current = true;
    lastCheckoutAtRef.current = now;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems, promoCode: promoDiscount?.code || null, shippingMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data?.code === "RATE_LIMIT") {
          throw new Error(t("cart.tooManyAttempts"));
        }
        if (data?.code === "EMPTY_CART") {
          throw new Error(t("cart.emptyError"));
        }
        if (data?.code === "VALIDATION_ERROR") {
          throw new Error(t("cart.invalidCheckout"));
        }
        if (response.status >= 500) {
          throw new Error(t("cart.serverError"));
        }
        throw new Error(data?.error || t("cart.networkError"));
      }

      if (!data.url) {
        throw new Error(t("cart.serverError"));
      }

      trackBeginCheckout({ value: total });
      showSuccessToast(t("cart.redirecting"));
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : t("cart.networkError");
      setError(message);
      showErrorToast(message);
    } finally {
      checkoutInFlightRef.current = false;
      setLoading(false);
    }
  }

  async function handleInvoiceCheckout() {
    if (cartItems.length === 0) {
      showErrorToast(t("cart.emptyError"));
      return;
    }
    if (!invoiceForm.contactName.trim() || !invoiceForm.email.trim()) {
      showErrorToast(t("cart.invoiceMissingFields"));
      return;
    }

    try {
      setInvoiceSubmitting(true);
      const res = await fetch("/api/checkout/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          companyName: invoiceForm.companyName.trim() || null,
          contactName: invoiceForm.contactName.trim(),
          email: invoiceForm.email.trim(),
          poNumber: invoiceForm.poNumber.trim() || null,
          paymentTerms: invoiceForm.paymentTerms,
          notes: invoiceForm.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t("cart.serverError"));
      }

      clearCart();
      closeCart();
      showSuccessToast(t("cart.invoiceRequested", { orderId: data.orderId }));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("cart.networkError");
      showErrorToast(message);
    } finally {
      setInvoiceSubmitting(false);
    }
  }

  if (!mounted || !renderDrawer) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        onClick={closeCart}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        aria-label={t("cart.close")}
      />

      <aside
        ref={asideRef}
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-gray-200)] px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-[0.16em] text-[var(--color-gray-800)]">{t("cart.title")}</h2>
            {cart.length > 0 && (
              <span className="rounded-sm bg-[var(--color-moon-blue-deep)] px-2 py-0.5 text-[10px] font-semibold text-[#fff]">{cart.length}</span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-sm border border-[var(--color-gray-200)] p-2 text-[var(--color-gray-500)] transition-colors duration-200 hover:bg-[var(--color-gray-50)] hover:text-[var(--color-gray-900)]"
            aria-label={t("cart.close")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {cart.length > 0 && shippingMethod === "delivery" && (
          <div className="border-b border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-5 py-4">
            {qualifiesForFreeShipping ? (
              <p className="text-sm font-medium text-emerald-700">{t("cart.freeShipping")}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[var(--color-gray-600)]">
                  {t("cart.addMore", { amount: formatCad(freeShippingRemaining) })}
                </p>
                <div className="h-1.5 w-full rounded-full bg-[var(--color-gray-200)]">
                  <div className="h-full rounded-full bg-[var(--color-moon-gold)] transition-all duration-300" style={{ width: `${freeShippingProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[var(--color-gray-500)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-[var(--color-gray-200)] bg-[var(--color-gray-50)]">
                  <svg className="h-6 w-6 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">{t("cart.empty")}</p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-1 rounded-sm border border-[var(--color-gray-300)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)]"
                >
                  {t("cart.continueShopping")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => {
                  const unit = item.unitAmount ?? item.price ?? 0;
                  const lineTotal = unit * item.quantity;
                  const opts = item.options || item.meta || {};
                  const itemDesignHelp = (opts.designHelp === true || opts.designHelp === "true") ? (Number(opts.designHelpFee) || 4500) : 0;
                  const rawMeta = item.meta && typeof item.meta === "object"
                    ? item.meta
                    : item.options && typeof item.options === "object"
                      ? item.options
                      : {};
                  const category = rawMeta.category || item.category || "";
                  const imageSrc = getProductImage(item, category);
                  const sizeRows = parseSizeRows(rawMeta);
                  const isMultiSize = (rawMeta.sizeMode === "multi" || rawMeta.sizeMode === '"multi"') && sizeRows.length > 0;

                  const { tags: itemTags, options: itemOptions } = buildDisplayMeta(rawMeta, t);

                  return (
                    <article key={item._cartId} className="rounded border border-[var(--color-gray-200)] p-4 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-[var(--color-gray-100)]">
                          <Image src={imageSrc} alt={item.name} fill className="object-cover" sizes="56px" unoptimized={isSvgImage(imageSrc)} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="truncate text-sm font-semibold text-[var(--color-gray-900)]">{item.name}</p>
                              {isMultiSize && (
                                <div className="mt-1 space-y-0.5 text-[11px] text-[var(--color-gray-500)]">
                                  {sizeRows.map((row, idx) => (
                                    <p key={`${item._cartId}-size-${idx}`}>
                                      #{idx + 1}: {row.width}&quot; x {row.height}&quot; x {row.quantity}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {/* Product options (material, lamination, etc.) */}
                              {itemOptions.length > 0 && (
                                <p className="mt-1 text-[11px] text-[var(--color-gray-500)] leading-relaxed">
                                  {itemOptions.map((o) => o.value).join(" · ")}
                                </p>
                              )}
                              {/* Rush / design-help / artwork badges */}
                              {itemTags.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {itemTags.map((tag) => (
                                    <span
                                      key={tag.label}
                                      className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${
                                        tag.color === "amber"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : tag.color === "indigo"
                                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                          : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)] border border-[var(--color-gray-200)]"
                                      }`}
                                    >
                                      {tag.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item._cartId)}
                              className="rounded-sm p-1 text-[var(--color-gray-400)] transition-colors duration-200 hover:bg-[var(--color-gray-100)] hover:text-[var(--color-gray-900)]"
                              aria-label={`Remove ${item.name}`}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                addItem({
                                  ...item,
                                  quantity: item.quantity,
                                  forceNewLine: true,
                                })
                              }
                              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)] transition-colors hover:text-[var(--color-gray-900)]"
                            >
                              {t("cart.duplicate")}
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item._cartId, Math.max(1, item.quantity - 1))}
                                className="h-11 w-11 rounded-sm border border-[var(--color-gray-200)] text-sm font-semibold text-[var(--color-gray-700)] transition-colors duration-200 hover:border-[var(--color-gray-400)] hover:bg-[var(--color-gray-100)]"
                                aria-label={t("cart.decreaseQty")}
                              >
                                -
                              </button>
                              <span className="min-w-8 text-center text-sm font-semibold text-[var(--color-gray-900)]">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item._cartId, item.quantity + 1)}
                                disabled={item.quantity >= 999}
                                className="h-11 w-11 rounded-sm border border-[var(--color-gray-200)] text-sm font-semibold text-[var(--color-gray-700)] transition-colors duration-200 hover:border-[var(--color-gray-400)] hover:bg-[var(--color-gray-100)] disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label={t("cart.increaseQty")}
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[var(--color-gray-900)]">{formatCad(lineTotal + itemDesignHelp)}</p>
                              {item.quantity > 1 && <p className="text-[11px] text-[var(--color-gray-500)]">{t("cart.each", { price: formatCad(unit) })}</p>}
                              {itemDesignHelp > 0 && <p className="text-[11px] text-indigo-600">{t("cart.designHelp")} +{formatCad(itemDesignHelp)}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {cart.length > 0 && <CartUpsell />}

          {cart.length > 0 && (
            <div className="space-y-3 border-t border-[var(--color-gray-200)] px-5 py-4">
              {/* Shipping method toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShippingMethod("delivery")}
                  className={`rounded-sm border px-3 py-2.5 text-left text-xs transition-colors ${
                    shippingMethod === "delivery"
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-[#fff]"
                      : "border-[var(--color-gray-300)] text-[var(--color-gray-600)] hover:border-[var(--color-gray-500)]"
                  }`}
                >
                  <span className="block font-semibold uppercase tracking-[0.14em]">{t("cart.delivery")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingMethod("pickup")}
                  className={`rounded-sm border px-3 py-2.5 text-left text-xs transition-colors ${
                    shippingMethod === "pickup"
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-[#fff]"
                      : "border-[var(--color-gray-300)] text-[var(--color-gray-600)] hover:border-[var(--color-gray-500)]"
                  }`}
                >
                  <span className="block font-semibold uppercase tracking-[0.14em]">{t("cart.pickup")}</span>
                </button>
              </div>

              {shippingMethod === "pickup" ? (
                <div className="rounded-sm border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3 text-xs text-[var(--color-gray-600)]">
                  <p className="font-semibold text-[var(--color-gray-900)]">{t("cart.pickupAddress")}</p>
                  <p className="mt-1">{t("cart.pickupNote")}</p>
                </div>
              ) : (
                <>
                  <div className="rounded-sm border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3 text-xs text-[var(--color-gray-600)]">
                    {t("cart.estimatedDelivery")} <span className="font-semibold text-[var(--color-gray-900)]">{getDeliveryWindow()}</span>
                  </div>
                  {cart.some((item) => isOversizedProduct(item.slug, item.category)) && (
                    <div className="flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {t("cart.pickupRecommended")}
                    </div>
                  )}
                </>
              )}

              {/* Collapsible promo code */}
              {promoDiscount ? (
                <div className="flex items-center justify-between rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <span className="font-semibold">{promoDiscount.code} &mdash; -{formatCad(promoDiscount.discountAmount)}</span>
                  <button
                    type="button"
                    onClick={() => { setPromoDiscount(null); setPromoCode(""); }}
                    className="rounded-sm p-0.5 text-emerald-500 hover:text-emerald-800"
                    aria-label={t("cart.removePromo")}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setPromoOpen(!promoOpen)}
                    className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)]"
                  >
                    {t("cart.promoCode")}
                    <svg className={`h-3.5 w-3.5 transition-transform ${promoOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {promoOpen && (
                    <div className="mt-2 flex gap-2">
                      <input
                        id="promo"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder={t("cart.enterCode")}
                        className="w-full rounded-sm border-2 border-[var(--color-gray-200)] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-gray-500)]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="rounded-sm border-2 border-[var(--color-gray-200)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-400)] disabled:opacity-50"
                      >
                        {promoLoading ? "..." : t("cart.apply")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 text-sm text-[var(--color-gray-700)]">
                <div className="flex items-center justify-between">
                  <span>{t("cart.subtotal")}</span>
                  <span className="font-semibold text-[var(--color-gray-900)]">{formatCad(subtotal)}</span>
                </div>
                {promoDiscount && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>{t("cart.discount")} ({promoDiscount.code})</span>
                    <span className="font-semibold">-{formatCad(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>{t("cart.shipping")}</span>
                  <span className="font-semibold text-[var(--color-gray-900)]">
                    {shippingMethod === "pickup" ? t("cart.pickup") : shipping === 0 ? t("cart.free") : formatCad(shipping)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("cart.tax")}</span>
                  <span className="font-semibold text-[var(--color-gray-900)]">{formatCad(tax)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--color-gray-200)] pt-3 text-base font-semibold text-[var(--color-gray-900)]">
                  <span>{t("cart.total")}</span>
                  <span>{formatCad(total)} CAD</span>
                </div>
                <p className="mt-1 text-[10px] text-[var(--color-gray-400)]">{t("cart.priceVerified")}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutMode("stripe")}
                  className={`rounded-sm border-2 px-3 py-2 text-left transition-colors ${
                    checkoutMode === "stripe"
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-[#fff]"
                      : "border-[var(--color-gray-300)] text-[var(--color-gray-600)] hover:border-[var(--color-gray-500)]"
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em]">{t("cart.payNow")}</span>
                  <span className={`block text-[9px] mt-0.5 ${checkoutMode === "stripe" ? "text-gray-300" : "text-[var(--color-gray-400)]"}`}>
                    {t("cart.payNowDesc")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMode("invoice")}
                  className={`rounded-sm border-2 px-3 py-2 text-left transition-colors ${
                    checkoutMode === "invoice"
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-[#fff]"
                      : "border-[var(--color-gray-300)] text-[var(--color-gray-600)] hover:border-[var(--color-gray-500)]"
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em]">{t("cart.invoiceCheckout")}</span>
                  <span className={`block text-[9px] mt-0.5 ${checkoutMode === "invoice" ? "text-gray-300" : "text-[var(--color-gray-400)]"}`}>
                    {t("cart.invoiceDesc")}
                  </span>
                </button>
              </div>

            {checkoutMode === "invoice" && (
              <div className="space-y-2 rounded-sm border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("cart.invoiceDetails")}</p>
                <input
                  value={invoiceForm.companyName}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  placeholder={t("cart.companyName")}
                  className="w-full rounded-sm border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-500)]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={invoiceForm.contactName}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, contactName: e.target.value }))}
                    placeholder={t("cart.contactName")}
                    className="w-full rounded-sm border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-500)]"
                  />
                  <input
                    value={invoiceForm.email}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder={t("cart.contactEmail")}
                    className="w-full rounded-sm border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-500)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={invoiceForm.poNumber}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, poNumber: e.target.value }))}
                    placeholder={t("cart.poNumber")}
                    className="w-full rounded-sm border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-500)]"
                  />
                  <select
                    value={invoiceForm.paymentTerms}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full rounded-sm border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-500)]"
                  >
                    <option value="net15">Net 15</option>
                    <option value="net30">Net 30</option>
                    <option value="net45">Net 45</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder={t("cart.invoiceNotes")}
                  className="w-full rounded-sm border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-500)]"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading || checkoutMode !== "stripe"}
              className="btn-primary-pill w-full px-4 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:shadow-none"
            >
              {loading ? t("cart.processing") : t("cart.checkout")}
            </button>

            {checkoutMode === "invoice" && (
              <button
                type="button"
                onClick={handleInvoiceCheckout}
                disabled={invoiceSubmitting}
                className="w-full rounded-sm border border-[var(--color-gray-900)] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-900)] transition-colors hover:bg-[var(--color-gray-100)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {invoiceSubmitting ? t("cart.processing") : t("cart.submitInvoiceOrder")}
              </button>
            )}

              <button
                type="button"
                onClick={closeCart}
                className="w-full rounded-sm border border-[var(--color-gray-300)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)]"
              >
                {t("cart.continueShopping")}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                <span className="font-medium">{t("cart.guarantee")}</span>
              </div>

              <PaymentBadges />

              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
