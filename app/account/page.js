"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
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
          <div className="mt-4 rounded-xl border border-[var(--color-gray-200)] p-8 text-center">
            <p className="text-sm text-[var(--color-gray-500)]">{t("account.orders.empty")}</p>
            <Link
              href="/shop"
              className="mt-3 inline-block rounded-xl border border-[var(--color-gray-300)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)]"
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
                    <span
                      className={`inline-block mt-0.5 rounded-xl px-2 py-0.5 text-[11px] font-semibold uppercase ${
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

