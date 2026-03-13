"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/product-helpers";

export default function InteracCheckoutPage() {
  const { t } = useTranslation();
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
        <div className="mb-4 text-4xl font-semibold text-gray-900">{t("interac.orderConfirmed")}</div>
        <h1 className="mb-2 text-2xl font-bold">{t("interac.orderPlaced")}</h1>
        <p className="mb-4 text-gray-600">
          {t("interac.orderRef").replace("{id}", submitted.orderId?.slice(0, 8)).replace("{amount}", formatCad(submitted.totalAmount))}
        </p>
        <p className="mb-6 text-gray-600">
          {t("interac.successMsg")}
        </p>
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left text-sm text-blue-800 space-y-2">
          <p className="font-semibold">{t("interac.nextStepsTitle") || "What happens next:"}</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>{t("interac.nextStep1") || "Check your email for payment instructions"}</li>
            <li>{t("interac.nextStep2") || "Send Interac e-Transfer to the email provided"}</li>
            <li>{t("interac.nextStep3") || "We'll confirm receipt and start production"}</li>
          </ol>
        </div>
        <a
          href="/shop"
          className="inline-block rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#fff] transition-colors hover:bg-gray-800"
        >
          {t("interac.continueShopping")}
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-3 text-2xl font-bold">{t("interac.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("interac.howItWorks") || "Place your order below. We'll email you payment instructions. Production starts once we receive your Interac e-Transfer."}</p>

      {cart.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-gray-600">{t("interac.cartEmpty")}</p>
          <a href="/shop" className="text-sm font-semibold text-gray-900 underline">
            {t("interac.browseShop")}
          </a>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-gray-200 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{t("interac.orderSummary")}</h2>
            {cart.map((item) => (
              <div key={item._cartId} className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span>{formatCad(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>{t("interac.subtotal")}</span><span>{formatCad(getSubtotal())}</span></div>
              <div className="flex justify-between"><span>{t("interac.tax")}</span><span>{formatCad(getTax())}</span></div>
              <div className="flex justify-between text-base font-bold"><span>{t("interac.total")}</span><span>{formatCad(getTotal())}</span></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("interac.fullName")}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("interac.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#fff] transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? t("interac.placingOrder") : t("interac.placeOrder")}
            </button>
          </form>

          {/* Trust signals */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {t("interac.sslBadge")}
            </div>
            <div className="flex items-center justify-center gap-3 text-[11px] font-bold tracking-wider text-gray-300">
              <span>VISA</span><span>MC</span><span>AMEX</span><span>INTERAC</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="font-semibold">{t("interac.qualityGuarantee")}</span>
            </div>
            <p className="text-center text-[11px] text-gray-400">
              <a href="/returns" className="underline hover:text-gray-600">{t("interac.refundPolicy")}</a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
