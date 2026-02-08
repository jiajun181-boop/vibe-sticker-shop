"use client";

import { useEffect, useState } from "react";
import { useCartStore, SHIPPING_OPTIONS } from "@/lib/store";

const cad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function getDeliveryEstimate() {
  const now = new Date();
  const addBusinessDays = (date, days) => {
    const d = new Date(date);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d;
  };
  const fmt = (d) => d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  return `${fmt(addBusinessDays(now, 2))} - ${fmt(addBusinessDays(now, 4))}`;
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

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

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

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCart} />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-black italic tracking-tight">YOUR CART</h2>
              <button onClick={closeCart} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-colors">
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="text-5xl mb-4 opacity-20">🛒</div>
                  <p className="text-gray-400 text-sm">Your cart is empty</p>
                  <button onClick={closeCart} className="mt-4 text-xs font-bold underline text-gray-500 hover:text-black">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-5">
                  {cart.map((item) => {
                    const lineTotal = item.price * item.quantity;
                    const badge = getSavingsBadge(item.quantity);
                    const opts = item.options || {};

                    return (
                      <div key={item._cartId} className="border border-gray-100 rounded-2xl p-4 space-y-3">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300 text-xs font-bold overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              "IMG"
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                              <button
                                onClick={() => removeItem(item._cartId)}
                                className="text-gray-300 hover:text-red-500 transition-colors text-sm flex-shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {opts.width && opts.height && `${opts.width}" x ${opts.height}" `}
                              {opts.pricingUnit === "per_sqft" && opts.sqft && `(${opts.sqft.toFixed(2)} sqft) `}
                              {opts.fileName && `• ${opts.fileName}`}
                            </p>
                          </div>
                        </div>

                        {/* Qty controls + price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item._cartId, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._cartId, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
                            >
                              +
                            </button>
                            {badge && (
                              <span className={`ml-2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-sm">{cad(lineTotal)}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{cad(item.price)}/ea</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer: Summary + Checkout */}
            {cart.length > 0 && (
              <div className="border-t bg-gray-50 p-6 space-y-4 flex-shrink-0">
                {/* Shipping selection */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping</p>
                  <div className="space-y-1.5">
                    {SHIPPING_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          shipping === opt.id
                            ? "border-black bg-white shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                          {opt.price === 0 ? "FREE" : cad(opt.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Delivery estimate */}
                <div className="text-xs text-gray-500 bg-white rounded-xl px-4 py-2.5 border border-gray-100">
                  📦 Est. delivery: <span className="font-bold text-gray-700">{getDeliveryEstimate()}</span>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-mono font-bold">{cad(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">HST (13%)</span>
                    <span className="font-mono text-gray-500">{cad(getTax())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-mono text-gray-500">
                      {getShippingCost() === 0 ? "FREE" : cad(getShippingCost())}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="font-bold">Total (CAD)</span>
                    <span className="text-xl font-black tracking-tight">{cad(getTotal())}</span>
                  </div>
                </div>

                {/* Checkout button */}
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                  {checkingOut ? "Processing..." : `Checkout · ${cad(getTotal())}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
