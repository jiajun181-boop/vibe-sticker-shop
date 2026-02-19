"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function ReorderStrip() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(null);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    fetch("/api/account/orders?page=1&limit=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders?.length) setOrders(data.orders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleReorder(orderId) {
    setReordering(orderId);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reorder");
      for (const item of data.items || []) addItem(item);
      openCart();
      showSuccessToast(t("orders.reorderSuccess") || "Items added to cart!");
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setReordering(null);
    }
  }

  if (loading || orders.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 py-10">
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 sm:p-5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-400)] mb-3">
        {t("account.recentOrders")}
      </h3>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex-none w-56 snap-start rounded-sm border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[var(--color-gray-900)]">#{order.id.slice(0, 8)}</p>
              <p className="text-xs text-[var(--color-gray-500)]">{formatCad(order.totalAmount)}</p>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-gray-400)]">
              {new Date(order.createdAt).toLocaleDateString("en-CA", {
                month: "short",
                day: "numeric",
              })}
              {" · "}
              {order._count?.items || 0} {t("account.orders.items")}
            </p>
            <button
              type="button"
              onClick={() => handleReorder(order.id)}
              disabled={reordering === order.id}
              className="mt-2 w-full rounded-full border border-[var(--color-gray-300)] py-1.5 text-[11px] font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)] disabled:opacity-50"
            >
              {reordering === order.id ? t("orders.reordering") : t("orders.reorder")}
            </button>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
