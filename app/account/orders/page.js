"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const STATUS_STYLES = {
  paid: { bg: "bg-emerald-100 text-emerald-700", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  pending: { bg: "bg-amber-100 text-amber-700", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
  canceled: { bg: "bg-red-100 text-red-700", icon: "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  refunded: { bg: "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]", icon: "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" },
  draft: { bg: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
};

function StatusBadge({ status, t }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center gap-1 mt-0.5 rounded-xl px-2 py-0.5 text-[11px] font-semibold uppercase ${style.bg}`}>
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
      </svg>
      {t(`orders.status.${status}`) || status}
    </span>
  );
}

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
      <h1 className="text-lg font-semibold tracking-[0.14em] text-[var(--color-gray-900)]">
        {t("account.orders.title")}
      </h1>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-gray-300)] p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gray-100)]">
            <svg className="h-6 w-6 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--color-gray-700)]">{t("account.orders.empty")}</p>
          <p className="mt-1 text-xs text-[var(--color-gray-400)]">{t("account.orders.emptyHint")}</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-xl bg-[var(--color-gray-900)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-black"
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
                    {" | "}
                    {order._count?.items || 0} {t("account.orders.items")}
                  </p>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--color-gray-900)]">{formatCad(order.totalAmount)}</p>
                    <StatusBadge status={order.status} t={t} />
                  </div>
                  {order.status === "paid" && (
                    <button
                      type="button"
                      onClick={(e) => handleReorder(e, order.id)}
                      disabled={reordering === order.id}
                      className="shrink-0 rounded-xl border border-[var(--color-gray-300)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)] disabled:opacity-50"
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
                className="rounded-xl border border-[var(--color-gray-200)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-400)] hover:text-[var(--color-gray-900)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("orders.prev")}
              </button>
              <span className="text-xs text-[var(--color-gray-500)]">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-xl border border-[var(--color-gray-200)] px-3 py-1.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-400)] hover:text-[var(--color-gray-900)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("orders.next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
