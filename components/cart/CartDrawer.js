"use client";

import { useEffect, useState, useRef } from "react";
import { useCartStore, SHIPPING_OPTIONS, FREE_SHIPPING_THRESHOLD } from "@/lib/store";

const cad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function getDeliveryEstimate() {
  const now = new Date();
  const addBiz = (date, days) => {
    const d = new Date(date);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d;
  };
  const fmt = (d) => d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  return `${fmt(addBiz(now, 2))} – ${fmt(addBiz(now, 4))}`;
}

function getSavingsBadge(qty) {
  if (qty >= 500) return { label: "SAVE 45%", color: "bg-green-500" };
  if (qty >= 250) return { label: "SAVE 30%", color: "bg-green-600" };
  if (qty >= 100) return { label: "SAVE 15%", color: "bg-emerald-600" };
  return null;
}

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const cart = useCartStore((s) => s.cart);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const shipping = useCartStore((s) => s.shipping);
  const setShipping = useCartStore((s) => s.setShipping);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTax = useCartStore((s) => s.getTax);
  const getShippingCost = useCartStore((s) => s.getShippingCost);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [checkingOut, setCheckingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const drawerRef = useRef(null);
  const touchStart = useRef(null);

  useEffect(() => setMounted(true), []);

  // Lock body scroll when open
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, mounted]);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") closeCart(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeCart]);

  if (!mounted) return null;

  const subtotal = getSubtotal();
  const shippingCost = getShippingCost();
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, shipping }),
      });
      const data = await res.json();
      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch {
      alert("Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  // Swipe-to-close on mobile
  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (diff > 80) closeCart(); // swiped right
    touchStart.current = null;
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCart} />

          {/* Drawer */}
          <div
            ref={drawerRef}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black italic tracking-tight">YOUR CART</h2>
                {cart.length > 0 && (
                  <span className="bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Close cart"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Free shipping progress bar */}
            {cart.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 border-b flex-shrink-0">
                {qualifiesForFreeShipping ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-xs font-bold">You&apos;ve unlocked FREE shipping!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] text-gray-500">
                        Add <span className="font-bold text-gray-700">{cad(freeShippingRemaining)}</span> more for <span className="font-bold text-green-600">FREE shipping</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Your cart is empty</p>
                  <p className="text-gray-300 text-xs mt-1">Browse our products and add items</p>
                  <button
                    onClick={closeCart}
                    className="mt-5 bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {cart.map((item) => {
                    const lineTotal = item.price * item.quantity;
                    const badge = getSavingsBadge(item.quantity);
                    const opts = item.options || {};

                    return (
                      <div key={item._cartId} className="bg-white border border-gray-100 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                              </svg>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                              <button
                                onClick={() => removeItem(item._cartId)}
                                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
                                aria-label={`Remove ${item.name}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 space-x-1">
                              {opts.width && opts.height && (
                                <span>{opts.width}&quot; &times; {opts.height}&quot;</span>
                              )}
                              {opts.pricingUnit === "per_sqft" && opts.sqft && (
                                <span>({opts.sqft.toFixed(1)} sqft)</span>
                              )}
                              {opts.material && <span>&middot; {opts.material}</span>}
                              {opts.fileName && <span>&middot; {opts.fileName}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Qty + price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(item._cartId, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
                              aria-label="Decrease quantity"
                            >
                              &minus;
                            </button>
                            <span className="w-9 text-center text-sm font-black tabular-nums">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._cartId, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                            {badge && (
                              <span className={`ml-1.5 text-[8px] font-bold text-white px-2 py-0.5 rounded-full ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-sm">{cad(lineTotal)}</p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-gray-400 font-mono">{cad(item.price)}/ea</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Clear cart */}
                  <div className="pt-1">
                    {confirmClear ? (
                      <div className="flex items-center justify-center gap-3 py-2">
                        <span className="text-xs text-gray-500">Clear all items?</span>
                        <button
                          onClick={() => { clearCart(); setConfirmClear(false); }}
                          className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                        >
                          Yes, clear
                        </button>
                        <button
                          onClick={() => setConfirmClear(false)}
                          className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClear(true)}
                        className="w-full text-center text-[11px] text-gray-400 hover:text-red-500 transition-colors py-2"
                      >
                        Clear cart
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t bg-white p-5 space-y-4 flex-shrink-0">
                {/* Shipping */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping</p>
                  <div className="space-y-1.5">
                    {SHIPPING_OPTIONS.map((opt) => {
                      const isFree = opt.id === "shipping" && qualifiesForFreeShipping;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            shipping === opt.id
                              ? "border-black bg-gray-50"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="shipping"
                              value={opt.id}
                              checked={shipping === opt.id}
                              onChange={() => setShipping(opt.id)}
                              className="accent-black w-3.5 h-3.5"
                            />
                            <div>
                              <span className="text-xs font-bold">{opt.label}</span>
                              <span className="text-[10px] text-gray-400 block">{opt.sublabel}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold">
                            {opt.price === 0 ? "FREE" : isFree ? (
                              <span className="flex items-center gap-1.5">
                                <span className="line-through text-gray-300">{cad(opt.price)}</span>
                                <span className="text-green-600">FREE</span>
                              </span>
                            ) : cad(opt.price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery estimate */}
                <div className="text-[11px] text-gray-500 bg-gray-50 rounded-xl px-3.5 py-2 border border-gray-100 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  Est. delivery: <span className="font-bold text-gray-700">{getDeliveryEstimate()}</span>
                </div>

                {/* Price breakdown */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-mono font-bold">{cad(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">HST (13%)</span>
                    <span className="font-mono text-gray-500">{cad(getTax())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-mono text-gray-500">
                      {shippingCost === 0 ? (
                        <span className="text-green-600 font-bold">FREE</span>
                      ) : cad(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                    <span className="font-bold">Total (CAD)</span>
                    <span className="text-xl font-black tracking-tight">{cad(getTotal())}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {checkingOut ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      `Checkout · ${cad(getTotal())}`
                    )}
                  </button>
                  <button
                    onClick={closeCart}
                    className="w-full text-center text-xs font-bold text-gray-400 hover:text-black transition-colors py-2"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
