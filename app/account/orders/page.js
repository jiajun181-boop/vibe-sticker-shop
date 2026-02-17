"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const STATUS_COLORS = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  canceled: "bg-red-100 text-red-700",
  refunded: "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]",
  draft: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
};

export default function AccountOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reordering, setReordering] = useState(null);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const pageSize = 10;

  async function handleReorder(e, orderId) {
    e.preventDefault();
    e.stopPropagation();
    setReordering(orderId);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reorder");
      for (const item of data.items || []) {
        addItem(item);
      }
      openCart();
      showSuccessToast(t("orders.reorderSuccess") || "Items added to cart!");
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setReordering(null);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/account/orders?page=${page}&limit=${pageSize}`)
      .then((r) => (r.ok ? r.json() : { orders: [], total: 0 }))
      .then((data) => {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h1 className="text-lg font-semibold tracking-[0.15em] text-[var(--color-gray-900)]">
        {t("account.orders.title")}
      </h1>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[var(--color-gray-200)] p-8 text-center">
          <p className="text-sm text-[var(--color-gray-500)]">{t("account.orders.empty")}</p>
          <Link
            href="/shop"
            className="mt-3 inline-block rounded-full border border-[var(--color-gray-300)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)]"
          >
            {t("cart.continueShopping")}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-gray-200)] p-4 transition-colors hover:bg-[var(--color-gray-50)]"
              >
                <Link href={`/account/orders/${order.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-gray-900)]">#{order.id.slice(0, 8)}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
                    {new Date(order.createdAt).toLocaleDateString("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {" · "}
                    {order._count?.items || 0} {t("account.orders.items")}
                  </p>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--color-gray-900)]">{formatCad(order.totalAmount)}</p>
                    <span
                      className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                        STATUS_COLORS[order.status] || "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  {order.status === "paid" && (
                    <button
                      type="button"
                      onClick={(e) => handleReorder(e, order.id)}
                      disabled={reordering === order.id}
                      className="shrink-0 rounded-full border border-[var(--color-gray-300)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)] disabled:opacity-50"
                    >
                      {reordering === order.id ? t("orders.reordering") : t("orders.reorder")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-[var(--color-gray-300)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gray-600)] disabled:opacity-40"
              >
                ←
              </button>
              <span className="text-xs text-[var(--color-gray-500)]">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-[var(--color-gray-300)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gray-600)] disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
