"use client";

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";

const FREE_SHIPPING_THRESHOLD = 15000;
const SHIPPING_COST = 1500;
const HST_RATE = 0.13;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

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

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxableBase = subtotal + shipping;
  const tax = Math.round(taxableBase * HST_RATE);
  const total = subtotal + shipping + tax;

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

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

  async function handleCheckout() {
    if (cartItems.length === 0) {
      showErrorToast(t("cart.emptyError"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (!data.url) {
        throw new Error("Checkout failed");
      }

      showSuccessToast(t("cart.redirecting"));
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : t("cart.networkError");
      setError(message);
      showErrorToast(message);
    } finally {
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
        className={`relative h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-[230ms] ease-out ${
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
            x
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

        <div className="flex h-[calc(100%-280px)] flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-50">Bag</div>
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

                  return (
                    <article key={item._cartId} className="rounded-2xl border border-gray-200 p-4 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Item</div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                              {item.slug && <p className="text-xs text-gray-500">{item.slug}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item._cartId)}
                              className="text-gray-400 transition-colors duration-200 hover:text-gray-900"
                              aria-label={`Remove ${item.name}`}
                            >
                              x
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
                  <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-600">
                    {t("cart.apply")}
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

              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
