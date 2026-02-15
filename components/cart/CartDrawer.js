"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { PaymentBadges } from "@/components/TrustBadges";
import { trackBeginCheckout } from "@/lib/analytics";
import useFocusTrap from "@/lib/useFocusTrap";
import CartUpsell from "@/components/cart/CartUpsell";
import { getProductImage } from "@/lib/product-image";

const FREE_SHIPPING_THRESHOLD = 15000;
const SHIPPING_COST = 1500;
const HST_RATE = 0.13;
const CHECKOUT_COOLDOWN_MS = 8000;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

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

function normalizeMeta(meta) {
  const input = meta && typeof meta === "object" ? meta : {};
  const out = {};

  for (const [k, v] of Object.entries(input)) {
    if (v == null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
      continue;
    }
    try {
      out[k] = JSON.stringify(v);
    } catch {
      out[k] = String(v);
    }
  }

  return out;
}

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

export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const cart = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [renderDrawer, setRenderDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(null);
  const checkoutInFlightRef = useRef(false);
  const lastCheckoutAtRef = useRef(0);
  const asideRef = useRef(null);
  useFocusTrap(asideRef, isOpen);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setRenderDrawer(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const ti = setTimeout(() => setRenderDrawer(false), 230);
      return () => clearTimeout(ti);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.unitAmount ?? item.price ?? 0) * item.quantity, 0),
    [cart]
  );

  const discountAmount = promoDiscount ? promoDiscount.discountAmount : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const shipping = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
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
        body: JSON.stringify({ items: cartItems, promoCode: promoDiscount?.code || null }),
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

  if (!mounted || !renderDrawer) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        onClick={closeCart}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-[230ms] ${isOpen ? "opacity-100" : "opacity-0"}`}
        aria-label={t("cart.close")}
      />

      <aside
        ref={asideRef}
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-[230ms] ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-[0.25em] text-gray-800">{t("cart.title")}</h2>
            {cart.length > 0 && (
              <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">{cart.length}</span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors duration-200 hover:text-gray-900"
            aria-label={t("cart.close")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {cart.length > 0 && (
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            {qualifiesForFreeShipping ? (
              <p className="text-sm font-medium text-emerald-700">{t("cart.freeShipping")}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  {t("cart.addMore", { amount: formatCad(freeShippingRemaining) })}
                </p>
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-gray-900 transition-all duration-300" style={{ width: `${freeShippingProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">{t("cart.empty")}</p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-1 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700"
                >
                  {t("cart.continueShopping")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => {
                  const unit = item.unitAmount ?? item.price ?? 0;
                  const lineTotal = unit * item.quantity;
                  const rawMeta = item.meta && typeof item.meta === "object"
                    ? item.meta
                    : item.options && typeof item.options === "object"
                      ? item.options
                      : {};
                  const category = rawMeta.category || item.category || "";
                  const imageSrc = getProductImage(item, category);
                  const sizeRows = parseSizeRows(rawMeta);
                  const isMultiSize = (rawMeta.sizeMode === "multi" || rawMeta.sizeMode === '"multi"') && sizeRows.length > 0;

                  return (
                    <article key={item._cartId} className="rounded-2xl border border-gray-200 p-4 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          <img src={imageSrc} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                              {item.slug && <p className="text-xs text-gray-500">{item.slug}</p>}
                              {isMultiSize && (
                                <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
                                  {sizeRows.map((row, idx) => (
                                    <p key={`${item._cartId}-size-${idx}`}>
                                      #{idx + 1}: {row.width}&quot; x {row.height}&quot; x {row.quantity}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item._cartId)}
                              className="rounded-full p-1 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
                              aria-label={`Remove ${item.name}`}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item._cartId, Math.max(1, item.quantity - 1))}
                                className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-100"
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="min-w-8 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item._cartId, item.quantity + 1)}
                                className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-100"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">{formatCad(lineTotal)}</p>
                              {item.quantity > 1 && <p className="text-[11px] text-gray-500">{t("cart.each", { price: formatCad(unit) })}</p>}
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
            <div className="space-y-3 border-t border-gray-200 px-5 py-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <label htmlFor="promo" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {t("cart.promoCode")}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={t("cart.enterCode")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-600 disabled:opacity-50"
                  >
                    {promoLoading ? "..." : t("cart.apply")}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                {t("cart.estimatedDelivery")} <span className="font-semibold text-gray-900">{getDeliveryWindow()}</span>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>{t("cart.subtotal")}</span>
                  <span className="font-semibold text-gray-900">{formatCad(subtotal)}</span>
                </div>
                {promoDiscount && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="flex items-center gap-1">
                      {t("cart.discount")} ({promoDiscount.code})
                      <button
                        type="button"
                        onClick={() => { setPromoDiscount(null); setPromoCode(""); }}
                        className="rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                        aria-label={t("cart.removePromo")}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                    <span className="font-semibold">-{formatCad(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>{t("cart.shipping")}</span>
                  <span className="font-semibold text-gray-900">{shipping === 0 ? t("cart.free") : formatCad(shipping)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("cart.tax")}</span>
                  <span className="font-semibold text-gray-900">{formatCad(tax)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                  <span>{t("cart.total")}</span>
                  <span>{formatCad(total)} CAD</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full rounded-full bg-gray-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-200 hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? t("cart.processing") : t("cart.checkout")}
              </button>

              <button
                type="button"
                onClick={closeCart}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700"
              >
                {t("cart.continueShopping")}
              </button>

              <PaymentBadges />

              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
