"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const POPULAR_SLUGS = [
  "business-cards-standard",
  "custom-diecut-stickers",
  "vinyl-banners",
  "coroplast-signs",
  "custom-printed-vehicle-logo-decals",
  "self-inking-stamp-standard",
];

export default function QuickOrderSheet({ open, onClose }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const authUser = useAuthStore((s) => s.user);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reordering, setReordering] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open || loaded) return;

    // Fetch popular products
    fetch(`/api/search?q=&limit=6`)
      .then((r) => r.json())
      .then((data) => setProducts(data.results || []))
      .catch(() => {});

    // Fetch recent orders if logged in
    if (authUser) {
      fetch("/api/account/orders?page=1&limit=3")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data?.orders?.length) setOrders(data.orders); })
        .catch(() => {});
    }

    setLoaded(true);
  }, [open, loaded, authUser]);

  async function handleReorder(orderId) {
    setReordering(orderId);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reorder");
      for (const item of data.items || []) addItem(item);
      openCart();
      onClose();
      showSuccessToast(t("orders.reorderSuccess") || "Items added to cart!");
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setReordering(null);
    }
  }

  function handleQuickAdd(product) {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: product.price,
      quantity: 1,
      image: product.image || null,
    });
    openCart();
    onClose();
    showSuccessToast(t("shop.addedToCart"));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[61] max-h-[70vh] rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--color-gray-300)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-gray-900)]">
            Quick Order
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--color-gray-400)] hover:bg-[var(--color-gray-100)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-20" style={{ maxHeight: "calc(70vh - 80px)" }}>
          {/* Reorder Recent (if logged in) */}
          {orders.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-400)] mb-2">
                {t("account.recentOrders")}
              </p>
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl bg-[var(--color-gray-50)] px-3 py-2.5">
                    <div>
                      <p className="text-xs font-bold text-[var(--color-gray-900)]">#{order.id.slice(0, 8)}</p>
                      <p className="text-[11px] text-[var(--color-gray-400)]">
                        {order._count?.items || 0} {t("account.orders.items")} · {formatCad(order.totalAmount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReorder(order.id)}
                      disabled={reordering === order.id}
                      className="rounded-xl bg-[var(--color-moon-blue-deep)] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      {reordering === order.id ? t("orders.reordering") : t("orders.reorder")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Products */}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-400)] mb-2">
            {t("home.popularProducts")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-[var(--color-gray-100)] bg-white p-2.5">
                <Link href={`/shop/${p.category}/${p.slug}`} onClick={onClose}>
                  <div className="aspect-square rounded-lg bg-[var(--color-gray-50)] overflow-hidden mb-2">
                    {p.image ? (
                      <Image src={p.image} alt={p.imageAlt || p.name} width={120} height={120} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl opacity-30">🧩</div>
                    )}
                  </div>
                </Link>
                <p className="text-xs font-semibold text-[var(--color-gray-900)] truncate">{p.name}</p>
                {p.price > 0 && (
                  <p className="text-[11px] text-[var(--color-gray-500)] mt-0.5">{t("home.from")} {formatCad(p.price)}</p>
                )}
                <button
                  type="button"
                  onClick={() => handleQuickAdd(p)}
                  className="mt-1.5 w-full rounded-full bg-[var(--color-moon-blue-deep)] py-1.5 text-[11px] font-semibold text-white"
                >
                  {t("shop.quickAdd")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
