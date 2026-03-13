"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";
import { statusColor, statusLabel } from "@/lib/admin/status-labels";

// ── Capabilities: tools (clickable) vs system features (info-only) ──────────

const TOOLS = [
  {
    title: "admin.dashboard.toolContour",
    desc: "admin.dashboard.toolContourDesc",
    href: "/admin/tools/contour",
    type: "tool",
  },
  {
    title: "admin.dashboard.toolProof",
    desc: "admin.dashboard.toolProofDesc",
    href: "/admin/tools/proof",
    type: "tool",
  },
  {
    title: "admin.dashboard.toolStamp",
    desc: "admin.dashboard.toolStampDesc",
    href: "/admin/tools/stamp-studio",
    type: "tool",
  },
  {
    title: "admin.dashboard.toolProduction",
    desc: "admin.dashboard.toolProductionDesc",
    href: "/admin/production/board",
    type: "tool",
  },
  {
    title: "admin.dashboard.toolPricing",
    desc: "admin.dashboard.toolPricingDesc",
    href: "/admin/pricing",
    type: "tool",
  },
  {
    title: "admin.dashboard.toolWorkstation",
    desc: "admin.dashboard.toolWorkstationDesc",
    href: "/admin/workstation",
    type: "tool",
  },
  {
    title: "admin.dashboard.toolQuickQuote",
    desc: "admin.dashboard.toolQuickQuoteDesc",
    href: "/admin/pricing?tab=quote",
    type: "tool",
  },
  {
    title: "admin.dashboard.toolCostEntry",
    desc: "admin.dashboard.toolCostEntryDesc",
    href: "/admin/pricing?tab=costs",
    type: "tool",
  },
  {
    title: "admin.dashboard.toolProfitAlerts",
    desc: "admin.dashboard.toolProfitAlertsDesc",
    href: "/admin/pricing?tab=ops&section=alerts",
    type: "tool",
  },
];

const SYSTEM_CAPABILITIES = [
  { title: "admin.dashboard.capShipping", desc: "admin.dashboard.capShippingDesc" },
  { title: "admin.dashboard.capBilingual", desc: "admin.dashboard.capBilingualDesc" },
  { title: "admin.dashboard.capLifecycle", desc: "admin.dashboard.capLifecycleDesc" },
  { title: "admin.dashboard.capCoupons", desc: "admin.dashboard.capCouponsDesc" },
];

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
function Change({ current, previous, t }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return (
      <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600">
        {t("admin.dashboard.changeNew")}
      </span>
    );
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    return <span className="mt-1 inline-block text-[10px] text-[#999]">{t("admin.dashboard.changeFlat")}</span>;
  }
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
function StatCard({ label, subtitle, value, change, sparkline }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-black tabular-nums">{value}</p>
          {change}
          {subtitle && <p className="mt-0.5 text-[10px] text-[#bbb]">{subtitle}</p>}
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
    workstation: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d[name] || d.orders} />
    </svg>
  );
}

const AUTO_REFRESH_MS = 30_000;
const DASHBOARD_TIMEOUT_MS = 8_000;

async function fetchJsonWithTimeout(url, timeoutMs = DASHBOARD_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/* ══════════════ MAIN DASHBOARD ══════════════ */
export default function AdminDashboard() {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const refreshTimer = useRef(null);

  const [error, setError] = useState(null);
  const router = useRouter();
  const uiLocale = locale === "zh" ? "zh-CN" : "en-CA";

  const fetchStats = useCallback(() => {
    fetchJsonWithTimeout("/api/admin/stats")
      .then((r) => {
        if (r.status === 401 || r.status === 403) { router.push("/admin/login"); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { if (data) { setStats(data); setLastRefresh(new Date()); setError(null); } })
      .catch((err) => {
        console.error("[Dashboard] Failed to fetch stats:", err);
        setError(
          err?.name === "AbortError"
            ? t("admin.dashboard.timeoutError")
            : t("admin.common.loadError")
        );
      })
      .finally(() => setLoading(false));
  }, [router, t]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    refreshTimer.current = setInterval(fetchStats, AUTO_REFRESH_MS);
    return () => clearInterval(refreshTimer.current);
  }, [fetchStats]);

  if (loading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <DashboardUnavailable error={error || t("admin.dashboard.loadFailed")} onRetry={fetchStats} />
    );
  }

  const actions = [
    { label: t("admin.quick.viewOrders"), href: "/admin/orders", icon: "orders" },
    { label: t("admin.quick.workstation"), href: "/admin/workstation", icon: "workstation" },
    { label: t("admin.quick.production"), href: "/admin/production/board", icon: "board" },
    { label: t("admin.quick.analytics"), href: "/admin/analytics", icon: "chart" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-black">{t("admin.dashboard.title")}</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchStats}
            title={
              lastRefresh
                ? t("admin.dashboard.lastRefreshAt").replace("{time}", lastRefresh.toLocaleTimeString(uiLocale))
                : t("admin.dashboard.refresh")
            }
            className="rounded-[3px] border border-[#d0d0d0] p-1.5 text-[#999] hover:bg-gray-50 hover:text-black transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.757a.75.75 0 00-.75.75v3.475a.75.75 0 001.5 0v-1.836l.217.216a7 7 0 0011.712-3.138.75.75 0 00-1.124-.122zm-1.624-7.848a7 7 0 00-11.712 3.138.75.75 0 001.124.122 5.5 5.5 0 019.201-2.466l.312.311h-2.433a.75.75 0 000 1.5h3.475a.75.75 0 00.75-.75V2.88a.75.75 0 00-1.5 0v1.836l-.217-.216z" clipRule="evenodd" />
            </svg>
          </button>
          <p className="text-xs text-[#999]">
            {new Date().toLocaleDateString(uiLocale, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.dashboard.todayOrders")}
          subtitle={t("admin.dashboard.vsYesterday")}
          value={stats.todayOrders}
          change={<Change current={stats.todayOrders} previous={stats.yesterdayOrders} t={t} />}
          sparkline={stats.dailyOrders}
        />
        <StatCard
          label={t("admin.dashboard.todayRevenue")}
          subtitle={t("admin.dashboard.vsYesterday")}
          value={formatCad(stats.todayRevenue || 0)}
          change={<Change current={stats.todayRevenue || 0} previous={stats.yesterdayRevenue || 0} t={t} />}
        />
        <StatCard
          label={t("admin.dashboard.monthRevenue")}
          subtitle={t("admin.dashboard.thisMonth")}
          value={formatCad(stats.monthRevenue)}
          change={<Change current={stats.monthRevenue} previous={stats.prevMonthRevenue} t={t} />}
        />
        <StatCard label={t("admin.dashboard.pendingOrders")} subtitle={t("admin.dashboard.awaitingAction")} value={stats.pendingOrders} />
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

      {/* ── Production Pipeline ── */}
      {stats.pipeline && (
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            { key: "preflight", label: t("admin.dashboard.pipePreflight"), color: "bg-blue-500" },
            { key: "in_production", label: t("admin.dashboard.pipeProduction"), color: "bg-amber-500" },
            { key: "ready_to_ship", label: t("admin.dashboard.pipeReady"), color: "bg-emerald-500" },
            { key: "shipped_today", label: t("admin.dashboard.pipeShipped"), color: "bg-gray-400" },
          ].map(({ key, label, color }) => (
            <Link key={key} href={key === "shipped_today" ? "/admin/orders/shipping" : "/admin/production/board"} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 hover:bg-[#fafafa] transition-colors">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#999]">{label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-black tabular-nums">{stats.pipeline[key] || 0}</p>
            </Link>
          ))}
        </div>
      )}

      {/* ── Production Alerts ── */}
      <ProductionAlerts />

      {/* ── Internal Tools (clickable, real tools) ── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-4">
          <h2 className="text-sm font-bold text-black">{t("admin.dashboard.internalTools")}</h2>
          <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.dashboard.internalToolsDesc")}</p>
        </div>
        <div className="grid gap-px bg-[#e0e0e0] sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link key={tool.title} href={tool.href} className="group flex items-start gap-3 bg-white p-5 transition-colors hover:bg-[#fafafa]">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] bg-[#f0f0f0] text-[#666] transition-colors group-hover:bg-black group-hover:text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-black">{t(tool.title)}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[#777]">{t(tool.desc)}</p>
                <p className="mt-1.5 text-[10px] font-semibold text-[#4f46e5] transition-colors group-hover:text-black">{t("admin.dashboard.openTool")}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── System Capabilities (info-only, no separate tool page) ── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-4">
          <h2 className="text-sm font-bold text-black">{t("admin.dashboard.systemCaps")}</h2>
          <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.dashboard.systemCapsDesc")}</p>
        </div>
        <div className="grid gap-px bg-[#e0e0e0] sm:grid-cols-2">
          {SYSTEM_CAPABILITIES.map((cap) => (
            <div key={cap.title} className="bg-white p-5">
              <p className="text-xs font-bold text-black">{t(cap.title)}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-[#777]">{t(cap.desc)}</p>
              <p className="mt-1.5 text-[10px] font-semibold text-[#bbb]">{t("admin.dashboard.systemBuiltIn")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-black">{t("admin.dashboard.recentOrders")}</h2>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {["pending", "paid", "canceled", "refunded"].map((key) => (
                <span key={key} className="inline-flex items-center gap-1 text-[9px] text-[#999]">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${key === "pending" ? "bg-yellow-400" : key === "paid" ? "bg-green-500" : key === "canceled" ? "bg-red-400" : "bg-purple-400"}`} />
                  {t(`admin.dashboard.status_${key}`)}
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
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-black">{order.customerEmail}</p>
                  <p className="text-xs text-[#999]">
                    {t("admin.dashboard.itemCount").replace("{count}", order._count.items)} &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString(uiLocale)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(order.status)}`}>
                    {statusLabel(order.status, t)}
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

function ProductionAlerts() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  function loadAlerts() {
    setLoadError(false);
    Promise.all([
      fetchJsonWithTimeout("/api/admin/orders/missing-artwork?limit=5", 5000).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetchJsonWithTimeout("/api/admin/production/schedule", 5000).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([artwork, schedule]) => {
      if (!artwork && !schedule) {
        setLoadError(true);
      } else {
        setData({ artwork, schedule });
      }
    }).catch(() => setLoadError(true));
  }

  useEffect(() => { loadAlerts(); }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-between rounded-[3px] border border-amber-300 bg-amber-50 px-4 py-3">
        <span className="text-xs font-medium text-amber-800">{t("admin.dashboard.alertsLoadFailed")}</span>
        <button type="button" onClick={loadAlerts} className="rounded-[3px] border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">{t("admin.dashboard.alertRetry")}</button>
      </div>
    );
  }

  if (!data) return null;

  const artworkCount = data.artwork?.total || 0;
  const staleCount = data.artwork?.staleCount || 0;
  const overdueCount = data.schedule?.summary?.overdueCount || 0;
  const rushCount = data.schedule?.summary?.rushCount || 0;

  if (artworkCount === 0 && overdueCount === 0 && rushCount === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {artworkCount > 0 && (
        <Link href="/admin/orders/missing-artwork" className="rounded-[3px] border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors">
          <p className="text-2xl font-bold text-amber-700">{artworkCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{t("admin.dashboard.alertMissingArtwork")}</p>
          {staleCount > 0 && <p className="mt-0.5 text-[10px] text-red-600">{t("admin.dashboard.alertStale").replace("{count}", staleCount)}</p>}
        </Link>
      )}
      {overdueCount > 0 && (
        <Link href="/admin/production/schedule" className="rounded-[3px] border border-red-200 bg-red-50 p-4 hover:bg-red-100 transition-colors">
          <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">{t("admin.dashboard.alertOverdueJobs")}</p>
        </Link>
      )}
      {rushCount > 0 && (
        <Link href="/admin/production/schedule" className="rounded-[3px] border border-orange-200 bg-orange-50 p-4 hover:bg-orange-100 transition-colors">
          <p className="text-2xl font-bold text-orange-700">{rushCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">{t("admin.dashboard.alertRushJobs")}</p>
        </Link>
      )}
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

function DashboardUnavailable({ error, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="rounded-[3px] border border-amber-300 bg-amber-50 px-5 py-4">
        <p className="text-sm font-semibold text-amber-900">{t("admin.dashboard.unavailableTitle")}</p>
        <p className="mt-1 text-xs text-amber-800">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-[3px] border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          {t("admin.dashboard.retryDashboard")}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/orders" className="rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-[#fafafa]">
          {t("admin.quick.viewOrders")}
        </Link>
        <Link href="/admin/workstation" className="rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-[#fafafa]">
          {t("admin.quick.workstation")}
        </Link>
        <Link href="/admin/production/board" className="rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-[#fafafa]">
          {t("admin.quick.production")}
        </Link>
        <Link href="/admin/pricing" className="rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-[#fafafa]">
          {t("admin.quick.pricing")}
        </Link>
      </div>
    </div>
  );
}
