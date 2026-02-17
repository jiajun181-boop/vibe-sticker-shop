"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

/* ── Mini sparkline (7 bars) ── */
function Sparkline({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-[5px] bg-black transition-all duration-300"
          style={{ height: `${Math.max(10, (v / max) * 100)}%`, opacity: i === data.length - 1 ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}

/* ── % change badge ── */
function Change({ current, previous }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600">NEW</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span className="mt-1 inline-block text-[10px] text-[#999]">&mdash; vs prev</span>;
  const up = pct > 0;
  return (
    <span className={`mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider ${up ? "text-emerald-600" : "text-red-500"}`}>
      <svg className={`h-3 w-3 ${up ? "" : "rotate-180"}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
      </svg>
      {Math.abs(pct)}%
    </span>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, change, sparkline }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-black tabular-nums">{value}</p>
          {change}
        </div>
        {sparkline && <Sparkline data={sparkline} />}
      </div>
    </div>
  );
}

/* ── Quick-action icon ── */
function QIcon({ name, className }) {
  const d = {
    orders: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
    add: "M12 4.5v15m7.5-7.5h-15",
    board: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z",
    chart: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d[name] || d.orders} />
    </svg>
  );
}

/* ══════════════ MAIN DASHBOARD ══════════════ */
export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401 || r.status === 403) { window.location.href = "/admin/login"; return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { if (data) setStats(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-red-500">{t("admin.dashboard.loadFailed")}</p>
      </div>
    );
  }

  const actions = [
    { label: t("admin.quick.viewOrders"), href: "/admin/orders", icon: "orders" },
    { label: t("admin.quick.addProduct"), href: "/admin/products", icon: "add" },
    { label: t("admin.quick.production"), href: "/admin/production/board", icon: "board" },
    { label: t("admin.quick.analytics"), href: "/admin/analytics", icon: "chart" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-black">{t("admin.dashboard.title")}</h1>
        <p className="text-xs text-[#999]">
          {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.dashboard.todayOrders")}
          value={stats.todayOrders}
          change={<Change current={stats.todayOrders} previous={stats.yesterdayOrders} />}
          sparkline={stats.dailyOrders}
        />
        <StatCard label={t("admin.dashboard.pendingOrders")} value={stats.pendingOrders} />
        <StatCard
          label={t("admin.dashboard.monthRevenue")}
          value={formatCad(stats.monthRevenue)}
          change={<Change current={stats.monthRevenue} previous={stats.prevMonthRevenue} />}
        />
        <StatCard label={t("admin.dashboard.totalOrders")} value={stats.totalOrders} sparkline={stats.dailyOrders} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex shrink-0 items-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:border-black hover:shadow-sm"
          >
            <QIcon name={a.icon} className="h-4 w-4" />
            {a.label}
          </Link>
        ))}
      </div>

      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <h2 className="text-sm font-bold text-black">{t("admin.dashboard.recentOrders")}</h2>
          <Link href="/admin/orders" className="text-xs font-medium text-black underline hover:no-underline">
            {t("admin.dashboard.viewAll")}
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">{t("admin.dashboard.noOrders")}</div>
        ) : (
          <div className="divide-y divide-[#e0e0e0]">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-[#fafafa]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-black">{order.customerEmail}</p>
                  <p className="text-xs text-[#999]">
                    {order._count.items} item{order._count.items !== 1 && "s"} &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-black">{formatCad(order.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded-[3px] bg-[#e8e8e8]" />
        <div className="h-4 w-40 rounded-[3px] bg-[#e8e8e8]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <div className="h-3 w-20 rounded-[2px] bg-[#e8e8e8]" />
            <div className="mt-3 h-7 w-16 rounded-[2px] bg-[#e8e8e8]" />
            <div className="mt-2 h-3 w-12 rounded-[2px] bg-[#e8e8e8]" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-32 rounded-[3px] border border-[#e0e0e0] bg-white" />
        ))}
      </div>
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-4"><div className="h-4 w-28 rounded-[2px] bg-[#e8e8e8]" /></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5">
            <div><div className="h-4 w-44 rounded-[2px] bg-[#e8e8e8]" /><div className="mt-1.5 h-3 w-24 rounded-[2px] bg-[#e8e8e8]" /></div>
            <div className="flex items-center gap-3"><div className="h-5 w-14 rounded-[2px] bg-[#e8e8e8]" /><div className="h-5 w-16 rounded-[2px] bg-[#e8e8e8]" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
