"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
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

export default function AccountDashboard() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, spent: 0 });
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(null);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

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
    fetch("/api/account/orders?limit=5")
      .then((r) => (r.ok ? r.json() : { orders: [], total: 0, totalSpent: 0 }))
      .then((data) => {
        setOrders(data.orders || []);
        setStats({ total: data.total || 0, spent: data.totalSpent || 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
          <div className="h-20 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-[0.14em] text-[var(--color-gray-900)]">
        {t("account.welcome", { name: user?.name || "" })}
      </h1>

      {/* Email verification banner */}
      {user && !user.emailVerified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t("account.verifyBanner")}
        </div>
      )}

      {/* B2B pending banner */}
      {user?.accountType === "B2B" && !user.b2bApproved && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {t("account.b2bPending")}
        </div>
      )}

      {/* B2B approved banner */}
      {user?.accountType === "B2B" && user.b2bApproved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("account.b2bApproved")}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--color-gray-200)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
            {t("account.stats.totalOrders")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-gray-900)]">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-gray-200)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
            {t("account.stats.totalSpent")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-gray-900)]">{formatCad(stats.spent)}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-[var(--color-gray-900)]">
            {t("account.recentOrders")}
          </h2>
          {orders.length > 0 && (
            <Link href="/account/orders" className="text-xs font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)]">
              {t("account.nav.orders")} &rarr;
            </Link>
          )}
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--color-gray-300)] p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gray-100)]">
              <svg className="h-6 w-6 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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
          <div className="mt-4 space-y-3">
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
        )}
      </div>
    </div>
  );
}

