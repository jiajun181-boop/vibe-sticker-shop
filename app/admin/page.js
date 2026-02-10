"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-gray-500">{t("admin.dashboard.loading")}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-red-500">{t("admin.dashboard.loadFailed")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">{t("admin.dashboard.title")}</h1>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.dashboard.todayOrders")}
          value={stats.todayOrders}
          color="blue"
        />
        <StatCard
          label={t("admin.dashboard.pendingOrders")}
          value={stats.pendingOrders}
          color="yellow"
        />
        <StatCard
          label={t("admin.dashboard.monthRevenue")}
          value={formatCad(stats.monthRevenue)}
          color="green"
        />
        <StatCard
          label={t("admin.dashboard.totalOrders")}
          value={stats.totalOrders}
          color="gray"
        />
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">{t("admin.dashboard.recentOrders")}</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            {t("admin.dashboard.viewAll")}
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            {t("admin.dashboard.noOrders")}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.customerEmail}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order._count.items} item{order._count.items !== 1 && "s"} &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[order.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCad(order.totalAmount)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = {
    blue: "border-blue-200 bg-blue-50",
    yellow: "border-yellow-200 bg-yellow-50",
    green: "border-green-200 bg-green-50",
    gray: "border-gray-200 bg-white",
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color] || colorMap.gray}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
