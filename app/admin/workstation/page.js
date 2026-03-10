"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { timeAgo } from "@/lib/admin/time-ago";
import StatusBadge from "@/components/admin/StatusBadge";

// ─── Single summary API fetch ────────────────────────────────────────────────

function useSummary() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/workstation/summary")
      .then((r) => {
        if (r.status === 401) { window.location.href = "/admin/login"; return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, error, loading, refetch };
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children, action }) {
  return (
    <section className="rounded-[3px] border border-[#e3e3e3] bg-white">
      <div className="flex items-center justify-between border-b border-[#ececec] px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-[#111]">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, loading, error, href, t }) {
  const inner = (
    <div className="rounded-[3px] border border-[#e3e3e3] bg-white p-4 transition-shadow hover:shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#999]">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-[#f0f0f0]" />
      ) : error ? (
        <p className="mt-2 text-xs text-red-500">{t?.("admin.common.error") || "Error"}</p>
      ) : (
        <p className="mt-1 text-2xl font-bold text-[#111]">{value ?? 0}</p>
      )}
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

// ─── Priority badge ──────────────────────────────────────────────────────────

function PriorityBadge({ priority, t }) {
  if (priority > 1) return null; // normal = 2, skip it
  const isUrgent = priority === 0;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
      isUrgent ? "bg-red-500 text-white" : "bg-orange-100 text-orange-800"
    }`}>
      {isUrgent ? t("admin.common.urgent") : t("admin.common.rush")}
    </span>
  );
}

// ─── Format helpers ──────────────────────────────────────────────────────────

function fmtMoney(cents) {
  if (cents == null) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Context-aware action label for needs-attention orders ───────────────────

function orderActionLabel(order, t) {
  if (order.status === "pending") return t("admin.workstation.actionReview");
  if (order.paymentStatus === "unpaid") return t("admin.workstation.actionCheckPayment");
  if (order.productionStatus === "preflight") return t("admin.workstation.actionPreflight");
  if (order.status === "paid" && order.productionStatus === "not_started") return t("admin.workstation.actionStartProd");
  return t("admin.workstation.actionOpen");
}

// ─── Quick Action Button ─────────────────────────────────────────────────────

function QuickAction({ href, icon, label, sub }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[3px] border border-[#e3e3e3] bg-white px-4 py-3 transition-all hover:border-[#111] hover:shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-[#f4f4f5] text-[#666]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#111]">{label}</span>
        {sub && <span className="block text-[11px] text-[#999]">{sub}</span>}
      </span>
    </Link>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const I = {
  plus: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  orders: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
  pricing: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  contour: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>,
  proof: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  stamp: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034l-.001.024" /></svg>,
  production: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0 3.75-1.5M17.25 7.5l3.75 1.5" /></svg>,
  refresh: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>,
  download: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  arrowRight: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WORKSTATION PAGE — single summary API, real server-side counts
// ═══════════════════════════════════════════════════════════════════════════════

export default function WorkstationPage() {
  const { t } = useTranslation();
  const { data, error, loading, refetch } = useSummary();

  const stats = data?.stats;
  const needsAttention = data?.needsAttention || [];
  const pendingProofs = data?.pendingProofs || [];
  const recentJobs = data?.recentJobs || [];
  const prodSummary = data?.productionSummary;

  const prodColumns = [
    { key: "queued", label: t("admin.workstation.prodQueued") },
    { key: "assigned", label: t("admin.workstation.prodAssigned") },
    { key: "printing", label: t("admin.workstation.prodPrinting") },
    { key: "quality_check", label: t("admin.workstation.prodQC") },
    { key: "on_hold", label: t("admin.workstation.prodOnHold") },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111]">{t("admin.workstation.title")}</h1>
          <p className="text-xs text-[#999]">{t("admin.workstation.subtitle")}</p>
          <p className="mt-1 text-[11px] text-[#bbb]">{t("admin.workstation.guidance")}</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="flex items-center gap-1.5 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-[#111] hover:text-[#111]"
        >
          {I.refresh}
          {t("admin.workstation.refresh")}
        </button>
      </div>

      {/* Global error */}
      {error && !data && (
        <div className="rounded-[3px] border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600">{t("admin.workstation.loadError")}: {error}</p>
          <button type="button" onClick={refetch} className="mt-2 text-xs font-medium text-red-700 underline">{t("admin.workstation.retry")}</button>
        </div>
      )}

      {/* ── 1. Stats Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label={t("admin.workstation.statOrders")} value={stats?.totalOrders} loading={loading} error={!stats && !loading} t={t} href="/admin/orders" />
        <StatCard label={t("admin.workstation.statAttention")} value={stats?.needsAttentionCount} loading={loading} error={!stats && !loading} t={t} href="/admin/orders" />
        <StatCard label={t("admin.workstation.statProofs")} value={stats?.pendingProofsCount} loading={loading} error={!stats && !loading} t={t} href="/admin/tools/proof" />
        <StatCard label={t("admin.workstation.statJobs")} value={stats?.recentJobsCount} loading={loading} error={!stats && !loading} t={t} href="/admin/tools" />
        <StatCard label={t("admin.workstation.statProduction")} value={stats?.inProductionCount} loading={loading} error={!stats && !loading} t={t} href="/admin/production/board" />
      </div>

      {/* ── 2. Quick Actions ──────────────────────────────────────────── */}
      <Section title={t("admin.workstation.quickActions")}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/admin/orders/create" icon={I.plus} label={t("admin.workstation.actionNewOrder")} sub={t("admin.workstation.actionNewOrderSub")} />
          <QuickAction href="/admin/orders" icon={I.orders} label={t("admin.workstation.actionOrders")} sub={t("admin.workstation.actionOrdersSub")} />
          <QuickAction href="/admin/pricing-dashboard" icon={I.pricing} label={t("admin.workstation.actionPricing")} sub={t("admin.workstation.actionPricingSub")} />
          <QuickAction href="/admin/tools/contour" icon={I.contour} label={t("admin.workstation.actionContour")} sub={t("admin.workstation.actionContourSub")} />
          <QuickAction href="/admin/tools/proof" icon={I.proof} label={t("admin.workstation.actionProof")} sub={t("admin.workstation.actionProofSub")} />
          <QuickAction href="/admin/tools/stamp-studio" icon={I.stamp} label={t("admin.workstation.actionStamp")} sub={t("admin.workstation.actionStampSub")} />
          <QuickAction href="/admin/production/board" icon={I.production} label={t("admin.workstation.actionProduction")} sub={t("admin.workstation.actionProductionSub")} />
        </div>
      </Section>

      {/* ── 3. Needs Attention (server-filtered, priority-sorted) ───── */}
      <Section
        title={`${t("admin.workstation.needsAttention")}${stats?.needsAttentionCount ? ` (${stats.needsAttentionCount})` : ""}`}
        action={<Link href="/admin/orders" className="text-xs font-medium text-[#4f46e5] hover:underline">{t("admin.workstation.viewAll")}</Link>}
      >
        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : needsAttention.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#999]">{t("admin.workstation.noAttention")}</p>
        ) : (
          <div className="space-y-2">
            {needsAttention.map((o) => (
              <div
                key={o.id}
                className="flex flex-col gap-2 rounded-[3px] border border-[#ececec] p-3 transition-colors hover:border-[#ccc] hover:bg-[#fafafa] sm:flex-row sm:items-center sm:justify-between"
              >
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                  <PriorityBadge priority={o.priority} t={t} />
                  <StatusBadge status={o.status} t={t} />
                  {o.productionStatus && o.productionStatus !== "not_started" && (
                    <StatusBadge status={o.productionStatus} t={t} />
                  )}
                  {o.paymentStatus === "unpaid" && (
                    <StatusBadge status="unpaid" t={t} />
                  )}
                  <span className="text-sm font-medium text-[#111] truncate">#{o.id.slice(-8)}</span>
                  <span className="hidden text-xs text-[#666] truncate sm:inline">
                    {o.customerName || o.customerEmail}
                  </span>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#999]">{t("admin.common.itemCount").replace("{count}", o._count?.items || 0)}</span>
                  <span className="text-xs font-medium text-[#111]">{fmtMoney(o.totalAmount)}</span>
                  <span className="text-xs text-[#999]">{timeAgo(o.createdAt, t)}</span>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="ml-1 inline-flex items-center gap-1 rounded-[3px] bg-black px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#222]"
                  >
                    {orderActionLabel(o, t)}
                    {I.arrowRight}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── 4 + 5. Proof Queue + Recent Jobs side-by-side ─────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Proof Queue */}
        <Section
          title={`${t("admin.workstation.proofQueue")}${stats?.pendingProofsCount ? ` (${stats.pendingProofsCount})` : ""}`}
          action={<Link href="/admin/tools/proof" className="text-xs font-medium text-[#4f46e5] hover:underline">{t("admin.workstation.viewAll")}</Link>}
        >
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : pendingProofs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#999]">{t("admin.workstation.noProofs")}</p>
          ) : (
            <div className="space-y-2">
              {pendingProofs.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-[3px] border border-[#ececec] p-3 transition-colors hover:border-[#ccc] hover:bg-[#fafafa]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={p.status} t={t} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111] truncate">#{p.orderId?.slice(-8)}</p>
                      <p className="text-[11px] text-[#999] truncate">{p.order?.customerName || p.order?.customerEmail || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[#999]">v{p.version}</span>
                    <span className="text-xs text-[#999]">{timeAgo(p.createdAt, t)}</span>
                    <Link
                      href={`/admin/tools/proof?proofId=${p.id}`}
                      className="inline-flex items-center gap-1 rounded-[3px] bg-black px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#222]"
                    >
                      {t("admin.workstation.openProof")}
                      {I.arrowRight}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Recent Tool Jobs */}
        <Section
          title={`${t("admin.workstation.recentJobs")}${stats?.recentJobsCount ? ` (${stats.recentJobsCount})` : ""}`}
          action={<Link href="/admin/tools" className="text-xs font-medium text-[#4f46e5] hover:underline">{t("admin.workstation.viewAll")}</Link>}
        >
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : recentJobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#999]">{t("admin.workstation.noJobs")}</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((j) => {
                const toolHrefs = { contour: "/admin/tools/contour", "stamp-studio": "/admin/tools/stamp-studio", proof: "/admin/tools/proof" };
                const toolHref = toolHrefs[j.toolType] || "/admin/tools";
                return (
                  <div key={j.id} className="flex items-center justify-between rounded-[3px] border border-[#ececec] p-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="inline-block rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-semibold text-[#666]">{t(`admin.tools.toolType_${j.toolType}`) || j.toolType}</span>
                      <span className="text-sm text-[#111] truncate">{j.operatorName || "—"}</span>
                      <StatusBadge status={j.status} t={t} />
                      <span className="text-xs text-[#999]">{timeAgo(j.createdAt, t)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {j.outputFileUrl && (
                        <a
                          href={j.outputFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-[3px] text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#111]"
                          title={t("admin.common.downloadTitle")}
                        >
                          {I.download}
                        </a>
                      )}
                      <Link
                        href={j.orderId ? `/admin/orders/${j.orderId}` : toolHref}
                        className="inline-flex items-center gap-1 rounded-[3px] border border-[#e0e0e0] px-2.5 py-1 text-[10px] font-semibold text-[#666] hover:border-black hover:text-black"
                      >
                        {j.orderId ? t("admin.workstation.openOrder") : t("admin.workstation.openTool")}
                        {I.arrowRight}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* ── 6. Production Summary ─────────────────────────────────────── */}
      <Section
        title={t("admin.workstation.productionSummary")}
        action={<Link href="/admin/production/board" className="text-xs font-medium text-[#4f46e5] hover:underline">{t("admin.workstation.openBoard")}</Link>}
      >
        {loading ? (
          <LoadingSkeleton rows={2} />
        ) : !prodSummary ? (
          <p className="py-6 text-center text-sm text-[#999]">{t("admin.workstation.loadError")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {prodColumns.map((col) => (
              <Link
                key={col.key}
                href="/admin/production/board"
                className="rounded-[3px] border border-[#ececec] p-4 text-center transition-colors hover:border-[#ccc] hover:bg-[#fafafa]"
              >
                <p className="text-2xl font-bold text-[#111]">{prodSummary[col.key] ?? 0}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#999]">{col.label}</p>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Loading / error ─────────────────────────────────────────────────────────

function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
      ))}
    </div>
  );
}
