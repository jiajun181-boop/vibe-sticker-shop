"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

// ─── Data fetching helpers ───────────────────────────────────────────────────

function useFetchJSON(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

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

function StatCard({ label, value, loading, error, href }) {
  const inner = (
    <div className="rounded-[3px] border border-[#e3e3e3] bg-white p-4 transition-shadow hover:shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#999]">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-[#f0f0f0]" />
      ) : error ? (
        <p className="mt-2 text-xs text-red-500">Error</p>
      ) : (
        <p className="mt-1 text-2xl font-bold text-[#111]">{value ?? 0}</p>
      )}
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  pending_payment: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  awaiting_files: "bg-orange-100 text-orange-800",
  awaiting_proof: "bg-purple-100 text-purple-800",
  proof_sent: "bg-indigo-100 text-indigo-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  revised: "bg-amber-100 text-amber-800",
  in_production: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  shipped: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  queued: "bg-slate-100 text-slate-700",
  assigned: "bg-blue-100 text-blue-700",
  printing: "bg-cyan-100 text-cyan-800",
  quality_check: "bg-amber-100 text-amber-800",
  on_hold: "bg-red-100 text-red-700",
  finished: "bg-green-100 text-green-700",
};

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${colors}`}>
      {(status || "unknown").replace(/_/g, " ")}
    </span>
  );
}

// ─── Format helpers ──────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function fmtMoney(cents) {
  if (cents == null) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
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

// ─── Icons (inline SVG, consistent with admin layout) ────────────────────────

const Icons = {
  plus: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  orders: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  pricing: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  contour: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
    </svg>
  ),
  proof: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  stamp: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034l-.001.024" />
    </svg>
  ),
  production: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0 3.75-1.5M17.25 7.5l3.75 1.5" />
    </svg>
  ),
  arrow: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  refresh: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WORKSTATION PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function WorkstationPage() {
  const { t } = useTranslation();

  // Fetch all data in parallel from existing APIs
  const orders = useFetchJSON("/api/admin/orders?limit=20&sort=createdAt&order=desc");
  const proofs = useFetchJSON("/api/admin/proofs?status=all&limit=20");
  const jobs = useFetchJSON("/api/admin/tools/jobs?limit=15");
  const board = useFetchJSON("/api/admin/production/board");

  // Derived stats
  const pendingOrderCount = orders.data?.pagination?.total ?? null;
  const pendingProofCount = proofs.data?.proofs?.filter((p) => p.status === "pending" || p.status === "revised").length ?? null;
  const recentJobCount = jobs.data?.jobs?.length ?? null;

  const boardData = board.data || {};
  const productionTotal =
    (boardData.queued?.length || 0) +
    (boardData.assigned?.length || 0) +
    (boardData.printing?.length || 0) +
    (boardData.quality_check?.length || 0) +
    (boardData.on_hold?.length || 0);

  // Needs-attention orders: filter for actionable statuses
  const needsAttention = (orders.data?.orders || []).filter((o) => {
    const s = o.status;
    return (
      s === "pending" ||
      s === "pending_payment" ||
      s === "awaiting_files" ||
      s === "awaiting_proof" ||
      s === "processing"
    );
  });

  // Pending proofs (pending or revised)
  const pendingProofs = (proofs.data?.proofs || []).filter(
    (p) => p.status === "pending" || p.status === "revised"
  );

  // Recent tool jobs
  const recentJobs = jobs.data?.jobs || [];

  // Production summary columns
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
        </div>
        <button
          type="button"
          onClick={() => {
            orders.refetch();
            proofs.refetch();
            jobs.refetch();
            board.refetch();
          }}
          className="flex items-center gap-1.5 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-[#111] hover:text-[#111]"
        >
          {Icons.refresh}
          {t("admin.workstation.refresh")}
        </button>
      </div>

      {/* ── 1. Stats Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("admin.workstation.statOrders")}
          value={pendingOrderCount}
          loading={orders.loading}
          error={orders.error}
          href="/admin/orders"
        />
        <StatCard
          label={t("admin.workstation.statProofs")}
          value={pendingProofCount}
          loading={proofs.loading}
          error={proofs.error}
          href="/admin/tools/proof"
        />
        <StatCard
          label={t("admin.workstation.statJobs")}
          value={recentJobCount}
          loading={jobs.loading}
          error={jobs.error}
          href="/admin/tools"
        />
        <StatCard
          label={t("admin.workstation.statProduction")}
          value={productionTotal}
          loading={board.loading}
          error={board.error}
          href="/admin/production/board"
        />
      </div>

      {/* ── 2. Quick Actions ──────────────────────────────────────────── */}
      <Section title={t("admin.workstation.quickActions")}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/admin/orders/create" icon={Icons.plus} label={t("admin.workstation.actionNewOrder")} sub={t("admin.workstation.actionNewOrderSub")} />
          <QuickAction href="/admin/orders" icon={Icons.orders} label={t("admin.workstation.actionOrders")} sub={t("admin.workstation.actionOrdersSub")} />
          <QuickAction href="/admin/pricing-dashboard" icon={Icons.pricing} label={t("admin.workstation.actionPricing")} sub={t("admin.workstation.actionPricingSub")} />
          <QuickAction href="/admin/tools/contour" icon={Icons.contour} label={t("admin.workstation.actionContour")} sub={t("admin.workstation.actionContourSub")} />
          <QuickAction href="/admin/tools/proof" icon={Icons.proof} label={t("admin.workstation.actionProof")} sub={t("admin.workstation.actionProofSub")} />
          <QuickAction href="/admin/tools/stamp-studio" icon={Icons.stamp} label={t("admin.workstation.actionStamp")} sub={t("admin.workstation.actionStampSub")} />
          <QuickAction href="/admin/production/board" icon={Icons.production} label={t("admin.workstation.actionProduction")} sub={t("admin.workstation.actionProductionSub")} />
        </div>
      </Section>

      {/* ── 3. Needs Attention ────────────────────────────────────────── */}
      <Section
        title={t("admin.workstation.needsAttention")}
        action={
          <Link href="/admin/orders" className="text-xs font-medium text-[#4f46e5] hover:underline">
            {t("admin.workstation.viewAll")}
          </Link>
        }
      >
        {orders.loading ? (
          <LoadingSkeleton rows={4} />
        ) : orders.error ? (
          <ErrorBlock message={orders.error} onRetry={orders.refetch} t={t} />
        ) : needsAttention.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#999]">{t("admin.workstation.noAttention")}</p>
        ) : (
          <div className="space-y-2">
            {needsAttention.slice(0, 10).map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex flex-col gap-2 rounded-[3px] border border-[#ececec] p-3 transition-colors hover:border-[#ccc] hover:bg-[#fafafa] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-medium text-[#111] truncate">
                    #{o.id.slice(-8)}
                  </span>
                  <span className="hidden text-xs text-[#666] truncate sm:inline">
                    {o.customerName || o.customerEmail}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#999]">
                  <span className="font-medium text-[#111]">{fmtMoney(o.totalAmount)}</span>
                  <span>{timeAgo(o.createdAt)}</span>
                  <span className="text-[#4f46e5]">{Icons.arrow}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ── 4. Proof Queue + 5. Recent Jobs (side by side on desktop) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Proof Queue */}
        <Section
          title={t("admin.workstation.proofQueue")}
          action={
            <Link href="/admin/tools/proof" className="text-xs font-medium text-[#4f46e5] hover:underline">
              {t("admin.workstation.viewAll")}
            </Link>
          }
        >
          {proofs.loading ? (
            <LoadingSkeleton rows={3} />
          ) : proofs.error ? (
            <ErrorBlock message={proofs.error} onRetry={proofs.refetch} t={t} />
          ) : pendingProofs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#999]">{t("admin.workstation.noProofs")}</p>
          ) : (
            <div className="space-y-2">
              {pendingProofs.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/orders/${p.orderId}`}
                  className="flex items-center justify-between rounded-[3px] border border-[#ececec] p-3 transition-colors hover:border-[#ccc] hover:bg-[#fafafa]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={p.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111] truncate">
                        #{p.orderId?.slice(-8)}
                      </p>
                      <p className="text-[11px] text-[#999] truncate">
                        {p.order?.customerName || p.order?.customerEmail || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#999] shrink-0">
                    <span>v{p.version}</span>
                    <span>{timeAgo(p.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* Recent Tool Jobs */}
        <Section
          title={t("admin.workstation.recentJobs")}
          action={
            <Link href="/admin/tools" className="text-xs font-medium text-[#4f46e5] hover:underline">
              {t("admin.workstation.viewAll")}
            </Link>
          }
        >
          {jobs.loading ? (
            <LoadingSkeleton rows={3} />
          ) : jobs.error ? (
            <ErrorBlock message={jobs.error} onRetry={jobs.refetch} t={t} />
          ) : recentJobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#999]">{t("admin.workstation.noJobs")}</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.slice(0, 8).map((j) => {
                const toolHrefs = {
                  contour: "/admin/tools/contour",
                  "stamp-studio": "/admin/tools/stamp-studio",
                  proof: "/admin/tools/proof",
                };
                const href = j.orderId
                  ? `/admin/orders/${j.orderId}`
                  : toolHrefs[j.toolType] || "/admin/tools";

                return (
                  <Link
                    key={j.id}
                    href={href}
                    className="flex items-center justify-between rounded-[3px] border border-[#ececec] p-3 transition-colors hover:border-[#ccc] hover:bg-[#fafafa]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-block rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#666]">
                        {j.toolType}
                      </span>
                      <span className="text-sm text-[#111] truncate">
                        {j.operatorName || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#999] shrink-0">
                      <StatusBadge status={j.status} />
                      <span>{timeAgo(j.createdAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* ── 6. Production Summary ─────────────────────────────────────── */}
      <Section
        title={t("admin.workstation.productionSummary")}
        action={
          <Link href="/admin/production/board" className="text-xs font-medium text-[#4f46e5] hover:underline">
            {t("admin.workstation.openBoard")}
          </Link>
        }
      >
        {board.loading ? (
          <LoadingSkeleton rows={2} />
        ) : board.error ? (
          <ErrorBlock message={board.error} onRetry={board.refetch} t={t} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {prodColumns.map((col) => {
              const items = boardData[col.key] || [];
              return (
                <Link
                  key={col.key}
                  href="/admin/production/board"
                  className="rounded-[3px] border border-[#ececec] p-4 text-center transition-colors hover:border-[#ccc] hover:bg-[#fafafa]"
                >
                  <p className="text-2xl font-bold text-[#111]">{items.length}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#999]">
                    {col.label}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Shared loading / error components ───────────────────────────────────────

function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
      ))}
    </div>
  );
}

function ErrorBlock({ message, onRetry, t }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <p className="text-xs text-red-500">{t("admin.workstation.loadError")}: {message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[3px] border border-[#e0e0e0] px-3 py-1 text-xs font-medium text-[#666] hover:border-[#111] hover:text-[#111]"
      >
        {t("admin.workstation.retry")}
      </button>
    </div>
  );
}
