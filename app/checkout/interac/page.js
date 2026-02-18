"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function InteracCheckoutPage() {
  const cart = useCartStore((s) => s.cart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTax = useCartStore((s) => s.getTax);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { orderId, totalAmount }
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);
    setError("");

    try {
      const items = cart.map((item) => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitAmount: item.price,
        meta: item.options || {},
      }));

      const res = await fetch("/api/checkout/interac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, email, name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      setSubmitted(data);
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="mb-2 text-2xl font-bold">Order Placed!</h1>
        <p className="mb-4 text-gray-600">
          Order #{submitted.orderId?.slice(0, 8)} — {formatCad(submitted.totalAmount)}
        </p>
        <p className="mb-6 text-gray-600">
          We've sent Interac e-Transfer instructions to your email. Your order will be processed once payment is received.
        </p>
        <a
          href="/shop"
          className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Pay with Interac e-Transfer</h1>

      {cart.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-gray-600">Your cart is empty.</p>
          <a href="/shop" className="text-sm font-semibold text-gray-900 underline">
            Browse Shop
          </a>
        </div>
      ) : (
        <>
          {/* Order summary */}
          <div className="mb-6 rounded-xl border border-gray-200 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Order Summary</h2>
            {cart.map((item) => (
              <div key={item._cartId} className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatCad(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCad(getSubtotal())}</span></div>
              <div className="flex justify-between"><span>Tax (HST 13%)</span><span>{formatCad(getTax())}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatCad(getTotal())}</span></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Placing Order..." : "Place Order with Interac e-Transfer"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
