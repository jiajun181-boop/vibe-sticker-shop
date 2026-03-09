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

const prodStatusColors = {
  not_started: "bg-gray-100 text-gray-600",
  preflight: "bg-blue-100 text-blue-700",
  in_production: "bg-yellow-100 text-yellow-700",
  ready_to_ship: "bg-emerald-100 text-emerald-700",
  shipped: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-red-100 text-red-700",
};

const prodStatusLabels = {
  not_started: "Not Started",
  preflight: "Preflight",
  in_production: "Producing",
  ready_to_ship: "Ready",
  shipped: "Shipped",
  completed: "Done",
  on_hold: "Hold",
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
function StatCard({ label, subtitle, value, change, sparkline, alert }) {
  return (
    <div className={`rounded-[3px] border bg-white p-5 ${alert ? "border-red-300" : "border-[#e0e0e0]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">{label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${alert ? "text-red-600" : "text-black"}`}>{value}</p>
          {change}
          {subtitle && <p className="mt-0.5 text-[10px] text-[#bbb]">{subtitle}</p>}
        </div>
        {sparkline && <Sparkline data={sparkline} />}
      </div>
    </div>
  );
}

/* ── Pipeline bar ── */
function PipelineBar({ pipeline }) {
  const stages = [
    { key: "preflight", label: "Preflight", color: "bg-blue-400" },
    { key: "in_production", label: "Producing", color: "bg-yellow-400" },
    { key: "ready_to_ship", label: "Ready to Ship", color: "bg-emerald-400" },
    { key: "shipped_today", label: "Shipped Today", color: "bg-green-500" },
  ];
  const total = stages.reduce((s, st) => s + (pipeline[st.key] || 0), 0);
  if (total === 0) return <p className="text-xs text-[#999]">No active orders in pipeline</p>;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
        {stages.map((st) => {
          const count = pipeline[st.key] || 0;
          if (count === 0) return null;
          return (
            <div
              key={st.key}
              className={`${st.color} transition-all`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${st.label}: ${count}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {stages.map((st) => (
          <div key={st.key} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${st.color}`} />
            <span className="text-[10px] text-[#777]">{st.label}</span>
            <span className="text-[10px] font-bold text-black tabular-nums">{pipeline[st.key] || 0}</span>
          </div>
        ))}
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
    contour: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    stamp: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42",
    workstation: "M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.007.66-1.862 1.571-2.147z",
    proof: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
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

  const pipeline = stats.pipeline || { preflight: 0, in_production: 0, ready_to_ship: 0, shipped_today: 0 };
  const pipelineTotal = pipeline.preflight + pipeline.in_production + pipeline.ready_to_ship + pipeline.shipped_today;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">{t("admin.dashboard.title")}</h1>
          <p className="text-[10px] text-[#999]">
            {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link
          href="/admin/workstation"
          className="flex items-center gap-2 rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          <QIcon name="workstation" className="h-4 w-4" />
          Open Workstation
        </Link>
      </div>

      {/* ── Row 1: Key Metrics ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.dashboard.todayOrders")}
          subtitle="vs yesterday"
          value={stats.todayOrders}
          change={<Change current={stats.todayOrders} previous={stats.yesterdayOrders} />}
          sparkline={stats.dailyOrders}
        />
        <StatCard
          label="Pending Production"
          subtitle="paid, not started"
          value={stats.pendingOrders}
          alert={stats.pendingOrders > 5}
        />
        <StatCard
          label={t("admin.dashboard.monthRevenue")}
          subtitle="this month"
          value={formatCad(stats.monthRevenue)}
          change={<Change current={stats.monthRevenue} previous={stats.prevMonthRevenue} />}
        />
        <StatCard
          label="Needs Attention"
          subtitle={`${stats.rushJobs || 0} rush · ${stats.overdueJobs || 0} overdue`}
          value={stats.needsAttention || 0}
          alert={(stats.needsAttention || 0) > 0 || (stats.overdueJobs || 0) > 0}
        />
      </div>

      {/* ── Row 2: Production Pipeline + Quick Lanes ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Pipeline */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#999]">Production Pipeline</h2>
            <span className="text-xs font-bold text-black tabular-nums">{pipelineTotal} active</span>
          </div>
          <PipelineBar pipeline={pipeline} />
        </div>

        {/* Role Quick Lanes */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 lg:col-span-2">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#999]">Quick Lanes</h2>
          <div className="space-y-2">
            <QuickLane
              icon="orders"
              label="Customer Service"
              desc="Orders, quotes, support"
              href="/admin/orders"
              badge={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : null}
              badgeColor="bg-yellow-100 text-yellow-700"
            />
            <QuickLane
              icon="board"
              label="Production"
              desc="Pipeline, files, preflight"
              href="/admin/workstation"
              badge={pipeline.preflight > 0 ? `${pipeline.preflight} in preflight` : null}
              badgeColor="bg-blue-100 text-blue-700"
            />
            <QuickLane
              icon="chart"
              label="Sales & Analytics"
              desc="Revenue, funnels, coupons"
              href="/admin/analytics"
            />
          </div>
        </div>
      </div>

      {/* ── Row 3: Quick Actions ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { label: "Orders", href: "/admin/orders", icon: "orders" },
          { label: "Workstation", href: "/admin/workstation", icon: "workstation" },
          { label: "Production Board", href: "/admin/production/board", icon: "board" },
          { label: "Contour Tool", href: "/admin/tools/contour", icon: "contour" },
          { label: "Stamp Studio", href: "/admin/tools/stamp-studio", icon: "stamp" },
          { label: "Proof Manager", href: "/admin/tools/proof", icon: "proof" },
          { label: "Products", href: "/admin/products", icon: "add" },
          { label: "Analytics", href: "/admin/analytics", icon: "chart" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex shrink-0 items-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-xs font-semibold text-black transition-all hover:border-black hover:shadow-sm"
          >
            <QIcon name={a.icon} className="h-4 w-4" />
            {a.label}
          </Link>
        ))}
      </div>

      {/* ── Row 4: Recent Orders ── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-black">{t("admin.dashboard.recentOrders")}</h2>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {[["pending", "Pending"], ["paid", "Paid"], ["canceled", "Canceled"], ["refunded", "Refunded"]].map(([key, label]) => (
                <span key={key} className="inline-flex items-center gap-1 text-[9px] text-[#999]">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${key === "pending" ? "bg-yellow-400" : key === "paid" ? "bg-green-500" : key === "canceled" ? "bg-red-400" : "bg-purple-400"}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
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
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">{order.customerName || order.customerEmail || "Guest"}</p>
                  <p className="text-xs text-[#999]">
                    {order._count.items} item{order._count.items !== 1 && "s"} &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {order.productionStatus && order.productionStatus !== "not_started" && (
                    <span className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold uppercase ${prodStatusColors[order.productionStatus] || "bg-gray-100 text-gray-600"}`}>
                      {prodStatusLabels[order.productionStatus] || order.productionStatus}
                    </span>
                  )}
                  <span className={`rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                    {order.status}
                  </span>
                  <span className="min-w-[70px] text-right text-sm font-semibold tabular-nums text-black">{formatCad(order.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Quick Lane Card ── */
function QuickLane({ icon, label, desc, href, badge, badgeColor }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[3px] border border-[#e0e0e0] px-3 py-2.5 transition-all hover:border-black hover:shadow-sm"
    >
      <QIcon name={icon} className="h-5 w-5 shrink-0 text-[#999] group-hover:text-black" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-black">{label}</p>
        <p className="text-[10px] text-[#999]">{desc}</p>
      </div>
      {badge && (
        <span className={`shrink-0 rounded-[2px] px-2 py-0.5 text-[9px] font-bold ${badgeColor || "bg-gray-100 text-gray-700"}`}>
          {badge}
        </span>
      )}
    </Link>
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
