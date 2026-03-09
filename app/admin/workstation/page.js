"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { detectProductFamily } from "@/lib/preflight";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-CA");
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getTodayString() {
  return new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ageLabel(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const hours = Math.floor((now - date) / (1000 * 60 * 60));
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getActionLabel(order) {
  const tags = order.tags || [];
  if (order.productionStatus === "on_hold") return "Review Hold";

  // Inspect all items for production readiness
  const items = order.items || [];
  let missingArtwork = false;
  let missingDimensions = false;
  let whiteInkPending = false;
  let proofPending = false;
  let missingStampPreview = false;
  let isDoubleSided = false;
  let missingVehicleInfo = false;
  let missingBookletInfo = false;
  let missingNcrInfo = false;
  let hasFoilJob = false;
  let isRush = false;

  for (const item of items) {
    const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};
    const family = detectProductFamily(item);
    const hasArt = !!(item.fileUrl || meta.artworkUrl || meta.fileUrl || meta.stampPreviewUrl);
    if (!hasArt) missingArtwork = true;
    const hasDims = item.widthIn || item.heightIn || meta.width || meta.height;
    if (!hasDims && family !== "stamp") missingDimensions = true;
    const whiteInkEnabled = !!(meta.whiteInkEnabled || (meta.whiteInkMode && meta.whiteInkMode !== "none"));
    if (whiteInkEnabled && !meta.whiteInkUrl) whiteInkPending = true;
    if ((family === "sticker" || family === "label") && !meta.proofConfirmed && (meta.contourSvg || meta.bleedMm)) proofPending = true;
    if (family === "stamp" && !meta.stampPreviewUrl) missingStampPreview = true;
    if (meta.sides === "double" || meta.sides === "2" || meta.doubleSided) isDoubleSided = true;
    if (family === "vehicle" && !meta.vehicleType) missingVehicleInfo = true;
    if (family === "booklet" && !meta.pageCount) missingBookletInfo = true;
    if (family === "ncr" && !meta.formType && !meta.parts) missingNcrInfo = true;
    if (meta.foilCoverage) hasFoilJob = true;
    if (meta.turnaround === "rush" || meta.turnaround === "express") isRush = true;
  }

  // Check for more family-specific conditions
  let missingMaterial = false;
  let hasLargeFormat = false;
  let hasComplianceJob = false;
  let hasNumbering = false;
  let hasCoating = false;
  let hasFold = false;

  for (const item of items) {
    const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};
    const family = detectProductFamily(item);
    if ((family === "sign" || family === "banner") && !item.material && !meta.material) missingMaterial = true;
    const w = item.widthIn || Number(meta.width) || 0;
    const h = item.heightIn || Number(meta.height) || 0;
    if (w > 48 || h > 48) hasLargeFormat = true;
    const typeId = (meta.vehicleType || "").toLowerCase();
    if (typeId.includes("dot") || typeId.includes("compliance") || typeId.includes("cvor")) hasComplianceJob = true;
    if (meta.numbering) hasNumbering = true;
    if (meta.coating && meta.coating !== "none") hasCoating = true;
    if (meta.fold && meta.fold !== "none") hasFold = true;
  }

  // Priority: blockers first
  if (isRush) return "Rush Order";
  if (missingArtwork || missingStampPreview) return "Request Artwork";
  if (missingDimensions || missingVehicleInfo) return "Confirm Specs";
  if (missingBookletInfo || missingNcrInfo) return "Confirm Specs";
  if (missingMaterial) return "Confirm Material";
  if (whiteInkPending) return "Check White Ink";
  if (proofPending) return "Await Proof";
  if (isDoubleSided) return "Check Double-Sided";
  if (hasComplianceJob) return "Compliance Job";

  // Tag-based
  if (tags.includes("white-ink") || tags.includes("transparent-material"))
    return "Check White Ink";
  if (tags.includes("floor-graphic")) return "Floor Graphic";
  if (tags.includes("vehicle")) return "Vehicle Graphics";
  if (order.productionStatus === "not_started") return "Start Production";
  if (order.productionStatus === "preflight") return "Review Files";
  if (hasFoilJob) return "Foil Press Job";
  if (hasLargeFormat) return "Large Format";
  if (hasNumbering) return "Numbering Job";
  if (hasCoating || hasFold) return "Finishing Job";
  if (tags.includes("bulk")) return "Plan Bulk Run";
  return "Review Order";
}

const actionLabelColors = {
  "Review Hold": "bg-red-100 text-red-700 border-red-200",
  "Request Artwork": "bg-red-100 text-red-700 border-red-200",
  "Confirm Specs": "bg-red-100 text-red-700 border-red-200",
  "Confirm Material": "bg-red-100 text-red-700 border-red-200",
  "Check White Ink": "bg-amber-100 text-amber-700 border-amber-200",
  "Await Proof": "bg-amber-100 text-amber-700 border-amber-200",
  "Check Double-Sided": "bg-amber-100 text-amber-700 border-amber-200",
  "Rush Order": "bg-red-100 text-red-700 border-red-200",
  "Start Production": "bg-blue-100 text-blue-700 border-blue-200",
  "Review Files": "bg-violet-100 text-violet-700 border-violet-200",
  "Foil Press Job": "bg-purple-100 text-purple-700 border-purple-200",
  "Plan Bulk Run": "bg-teal-100 text-teal-700 border-teal-200",
  "Compliance Job": "bg-orange-100 text-orange-700 border-orange-200",
  "Large Format": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Numbering Job": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Floor Graphic": "bg-lime-100 text-lime-700 border-lime-200",
  "Vehicle Graphics": "bg-slate-100 text-slate-700 border-slate-200",
  "Finishing Job": "bg-sky-100 text-sky-700 border-sky-200",
  "Review Order": "bg-gray-100 text-gray-700 border-gray-200",
};

const productionStatusLabels = {
  not_started: "Not Started",
  preflight: "Preflight",
  in_production: "In Production",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  completed: "Completed",
  on_hold: "On Hold",
  canceled: "Canceled",
};

const productionStatusColors = {
  not_started: "bg-gray-100 text-gray-700",
  preflight: "bg-blue-100 text-blue-700",
  in_production: "bg-yellow-100 text-yellow-800",
  ready_to_ship: "bg-emerald-100 text-emerald-700",
  shipped: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-red-100 text-red-700",
  canceled: "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid dependencies)
// ---------------------------------------------------------------------------

function IconAlert({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconPackage({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconProof({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconShield({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconTicket({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  );
}

function IconArrowRight({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconPlus({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconBoard({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
    </svg>
  );
}

function IconScissors({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm9.304 0l-1.536.887M17.152 8.25a3 3 0 105.196-3 3 3 0 00-5.196 3zM12 17.25l-1.5-2.625M12 17.25l1.5-2.625M12 17.25V14.25M9.384 11.113l.884 1.512m3.464-1.512l-.884 1.512" />
    </svg>
  );
}

function IconClock({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconRefresh({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UrgentCard({ label, count, icon, href, color }) {
  const isUrgent = count > 0;
  const borderColor = isUrgent
    ? color === "red"
      ? "border-red-300"
      : "border-amber-300"
    : "border-[#e0e0e0]";
  const bgColor = isUrgent
    ? color === "red"
      ? "bg-red-50"
      : "bg-amber-50"
    : "bg-white";
  const countColor = isUrgent
    ? color === "red"
      ? "text-red-600"
      : "text-amber-600"
    : "text-[#999]";
  const iconBg = isUrgent
    ? color === "red"
      ? "bg-red-100"
      : "bg-amber-100"
    : "bg-[#f5f5f5]";
  const iconColor = isUrgent
    ? color === "red"
      ? "text-red-600"
      : "text-amber-600"
    : "text-[#999]";

  const inner = (
    <>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] ${iconBg}`}>
        {icon({ className: `h-4.5 w-4.5 ${iconColor}` })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
          {label}
        </p>
        <p className={`mt-0.5 text-2xl font-bold tabular-nums ${countColor}`}>
          {count}
        </p>
      </div>
    </>
  );

  // If no href, render as a static card (count-only display)
  if (!href) {
    return (
      <div
        className={`flex items-start gap-3 rounded-[3px] border p-4 ${borderColor} ${bgColor}`}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-[3px] border p-4 transition-all hover:shadow-sm ${borderColor} ${bgColor}`}
    >
      {inner}
      <svg
        className="mt-1 h-4 w-4 shrink-0 text-[#ccc] transition-colors group-hover:text-black"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

function PipelineStage({ label, count, color, isLast, href }) {
  const inner = (
    <>
      <span className="text-2xl font-bold tabular-nums">{count}</span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </span>
    </>
  );

  return (
    <div className="flex flex-1 items-center">
      {href ? (
        <Link
          href={href}
          className={`flex flex-1 flex-col items-center rounded-[3px] border border-[#e0e0e0] p-3 transition-all hover:shadow-sm hover:border-black/20 ${color}`}
        >
          {inner}
        </Link>
      ) : (
        <div className={`flex flex-1 flex-col items-center rounded-[3px] border border-[#e0e0e0] p-3 ${color}`}>
          {inner}
        </div>
      )}
      {!isLast && (
        <div className="flex shrink-0 items-center px-1.5">
          <IconArrowRight className="h-4 w-4 text-[#ccc]" />
        </div>
      )}
    </div>
  );
}

function QuickActionButton({ label, href, icon: Icon }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:border-black hover:shadow-sm"
    >
      <Icon className="h-5 w-5 text-[#666]" />
      <span>{label}</span>
    </Link>
  );
}

function ActivityEntry({ log }) {
  // Format the action into a human-readable string
  const actionText = (() => {
    const actor = log.actor || "System";
    const action = log.action || "";
    const entity = log.entity || "";
    const entityId = log.entityId ? ` #${log.entityId.slice(-6)}` : "";

    return `${actor} ${action} ${entity}${entityId}`;
  })();

  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5]">
        <IconClock className="h-3 w-3 text-[#999]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#333] truncate">{actionText}</p>
        <p className="mt-0.5 text-[10px] text-[#999]">{timeAgo(log.createdAt)}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function WorkstationSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-48 rounded-[3px] bg-[#e8e8e8]" />
        <div className="mt-1.5 h-4 w-56 rounded-[3px] bg-[#e8e8e8]" />
      </div>

      {/* Urgent cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-[3px] bg-[#e8e8e8]" />
              <div>
                <div className="h-3 w-20 rounded-[2px] bg-[#e8e8e8]" />
                <div className="mt-2 h-7 w-10 rounded-[2px] bg-[#e8e8e8]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <div className="h-4 w-36 rounded-[2px] bg-[#e8e8e8]" />
        <div className="mt-4 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-[3px] border border-[#e0e0e0] p-4 text-center">
              <div className="mx-auto h-7 w-10 rounded-[2px] bg-[#e8e8e8]" />
              <div className="mx-auto mt-2 h-3 w-16 rounded-[2px] bg-[#e8e8e8]" />
            </div>
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-[3px] border border-[#e0e0e0] bg-white">
          <div className="border-b border-[#e0e0e0] px-5 py-4">
            <div className="h-4 w-28 rounded-[2px] bg-[#e8e8e8]" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="h-4 w-36 rounded-[2px] bg-[#e8e8e8]" />
                <div className="mt-1 h-3 w-20 rounded-[2px] bg-[#e8e8e8]" />
              </div>
              <div className="h-5 w-16 rounded-[2px] bg-[#e8e8e8]" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-[3px] border border-[#e0e0e0] bg-white" />
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-4">
          <div className="h-4 w-32 rounded-[2px] bg-[#e8e8e8]" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3">
            <div className="h-6 w-6 rounded-full bg-[#e8e8e8]" />
            <div>
              <div className="h-4 w-52 rounded-[2px] bg-[#e8e8e8]" />
              <div className="mt-1 h-3 w-16 rounded-[2px] bg-[#e8e8e8]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function WorkstationPage() {
  const [data, setData] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wsRes, sessionRes] = await Promise.all([
        fetch("/api/admin/workstation"),
        fetch("/api/admin/session"),
      ]);

      if (wsRes.status === 401 || wsRes.status === 403) {
        window.location.href = "/admin/login";
        return;
      }

      if (!wsRes.ok) throw new Error(`Workstation API: HTTP ${wsRes.status}`);

      const [wsData, sessionData] = await Promise.all([
        wsRes.json(),
        sessionRes.ok ? sessionRes.json() : { user: null },
      ]);

      setData(wsData.data);
      setSession(sessionData.user);
    } catch (err) {
      console.error("[Workstation] Load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) return <WorkstationSkeleton />;

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">
            Failed to load workstation data
          </p>
          {error && (
            <p className="mt-1 text-xs text-[#999]">{error}</p>
          )}
          <button
            onClick={fetchAll}
            className="mt-3 rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#fafafa]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const userName = session?.name || "Operator";
  const pipelineTotal =
    data.pipeline.preflight +
    data.pipeline.in_production +
    data.pipeline.ready_to_ship +
    data.pipeline.shipped_today;

  return (
    <div className="space-y-6">
      {/* ── Header: Greeting + Date ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">
            {getGreeting()}, {userName}
          </h1>
          <p className="mt-0.5 text-xs text-[#999]">{getTodayString()}</p>
        </div>
        <button
          onClick={fetchAll}
          className="inline-flex items-center gap-2 rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:bg-[#fafafa] hover:text-black"
        >
          <IconRefresh className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Row 1: Urgent Action Cards + Today's Revenue ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <UrgentCard
          label="Pending Orders"
          count={data.pendingOrders}
          icon={IconPackage}
          href="/admin/orders?status=paid&production=not_started"
          color="red"
        />
        <UrgentCard
          label="Pending Proofs"
          count={data.pendingProofs}
          icon={IconProof}
          href="/admin/tools/proof"
          color="amber"
        />
        <UrgentCard
          label="Open QC"
          count={data.openQC}
          icon={IconShield}
          href="/admin/orders?production=on_hold"
          color="red"
        />
        <UrgentCard
          label="Open Tickets"
          count={data.openTickets}
          icon={IconTicket}
          href="/admin/orders?status=pending"
          color="amber"
        />
        {/* Today's revenue — operational KPI */}
        <div className="flex items-start gap-3 rounded-[3px] border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-emerald-100">
            <span className="text-sm font-bold text-emerald-700">$</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">Today&apos;s Revenue</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-700">{formatCad(data.todayRevenue?.amount || 0)}</p>
            <p className="text-[10px] text-emerald-600">{data.todayRevenue?.count || 0} orders</p>
            {data.weekRevenue && (
              <p className="text-[9px] text-[#999] mt-0.5">7-day: {formatCad(data.weekRevenue.amount || 0)} ({data.weekRevenue.count || 0} orders)</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Aging Alert ── */}
      {data.agingOrders > 0 && (
        <div className="flex items-center gap-3 rounded-[3px] border border-orange-300 bg-orange-50 px-5 py-3">
          <IconAlert className="h-5 w-5 shrink-0 text-orange-600" />
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-800">
              {data.agingOrders} order{data.agingOrders !== 1 ? "s" : ""} stuck for 24+ hours
            </p>
            <p className="text-[10px] text-orange-600">
              Paid orders in &quot;Not Started&quot; or &quot;Preflight&quot; unchanged for over 24 hours — investigate delays
            </p>
          </div>
          <Link
            href="/admin/orders?status=paid&production=not_started"
            className="shrink-0 rounded-[3px] border border-orange-400 bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-800 hover:bg-orange-200"
          >
            View Orders
          </Link>
        </div>
      )}

      {/* ── Row 2: Production Pipeline ── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-black">Production Pipeline</h2>
            <p className="mt-0.5 text-[10px] text-[#999]">
              {pipelineTotal} active job{pipelineTotal !== 1 ? "s" : ""} across all stages
            </p>
          </div>
          <Link
            href="/admin/production/board"
            className="text-xs font-medium text-black underline hover:no-underline"
          >
            Open Board
          </Link>
        </div>

        <div className="flex items-stretch gap-0">
          <PipelineStage
            label="Preflight"
            count={data.pipeline.preflight}
            color="bg-blue-50 text-blue-700"
            href="/admin/orders?production=preflight"
          />
          <PipelineStage
            label="In Production"
            count={data.pipeline.in_production}
            color="bg-yellow-50 text-yellow-700"
            href="/admin/orders?production=in_production"
          />
          <PipelineStage
            label="Ready to Ship"
            count={data.pipeline.ready_to_ship}
            color="bg-emerald-50 text-emerald-700"
            href="/admin/orders?production=ready_to_ship"
          />
          <PipelineStage
            label="Shipped Today"
            count={data.pipeline.shipped_today}
            color="bg-green-50 text-green-700"
            href="/admin/orders?production=shipped"
            isLast
          />
        </div>

        {/* Pipeline Progress Bar */}
        {pipelineTotal > 0 && (
          <div className="mt-4">
            <div className="flex h-6 w-full overflow-hidden rounded-[3px] border border-[#e0e0e0]">
              {data.pipeline.preflight > 0 && (
                <div
                  className="flex items-center justify-center bg-blue-400 text-[10px] font-bold text-white"
                  style={{ width: `${(data.pipeline.preflight / pipelineTotal) * 100}%`, minWidth: data.pipeline.preflight > 0 ? "2rem" : 0 }}
                  title={`Preflight: ${data.pipeline.preflight}`}
                >
                  {data.pipeline.preflight}
                </div>
              )}
              {data.pipeline.in_production > 0 && (
                <div
                  className="flex items-center justify-center bg-yellow-400 text-[10px] font-bold text-yellow-900"
                  style={{ width: `${(data.pipeline.in_production / pipelineTotal) * 100}%`, minWidth: data.pipeline.in_production > 0 ? "2rem" : 0 }}
                  title={`In Production: ${data.pipeline.in_production}`}
                >
                  {data.pipeline.in_production}
                </div>
              )}
              {data.pipeline.ready_to_ship > 0 && (
                <div
                  className="flex items-center justify-center bg-emerald-400 text-[10px] font-bold text-white"
                  style={{ width: `${(data.pipeline.ready_to_ship / pipelineTotal) * 100}%`, minWidth: data.pipeline.ready_to_ship > 0 ? "2rem" : 0 }}
                  title={`Ready to Ship: ${data.pipeline.ready_to_ship}`}
                >
                  {data.pipeline.ready_to_ship}
                </div>
              )}
              {data.pipeline.shipped_today > 0 && (
                <div
                  className="flex items-center justify-center bg-green-500 text-[10px] font-bold text-white"
                  style={{ width: `${(data.pipeline.shipped_today / pipelineTotal) * 100}%`, minWidth: data.pipeline.shipped_today > 0 ? "2rem" : 0 }}
                  title={`Shipped Today: ${data.pipeline.shipped_today}`}
                >
                  {data.pipeline.shipped_today}
                </div>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#999]">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-blue-400" />Preflight</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-yellow-400" />In Production</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" />Ready to Ship</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-green-500" />Shipped Today</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Row 2.5: Priority Task Queue ── */}
      {data.exceptionOrders && data.exceptionOrders.length > 0 && (
        <div className="rounded-[3px] border border-red-200 bg-white">
          <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-center gap-2">
              <IconAlert className="h-4 w-4 text-red-600" />
              <div>
                <h2 className="text-sm font-bold text-red-800">Priority Task Queue ({data.exceptionOrders.length})</h2>
                <p className="mt-0.5 text-[10px] text-red-600">Orders requiring action — sorted by priority then age</p>
              </div>
            </div>
            <Link
              href="/admin/orders?production=on_hold"
              className="text-xs font-medium text-red-800 underline hover:no-underline"
            >
              View All
            </Link>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[5rem_1fr_1.2fr_4rem_8rem_6rem] items-center gap-2 border-b border-[#e0e0e0] bg-[#fafafa] px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#999]">
            <span>Order</span>
            <span>Customer</span>
            <span>Product</span>
            <span>Age</span>
            <span>Tags</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-[#e0e0e0]">
            {data.exceptionOrders.map((order) => {
              const action = getActionLabel(order);
              const actionColor = actionLabelColors[action] || "bg-gray-100 text-gray-700 border-gray-200";
              const firstItem = order.items?.[0];
              const firstProduct = firstItem?.productName || "—";
              const family = firstItem ? detectProductFamily(firstItem) : "other";
              const familyBadge = { sticker: "STK", label: "LBL", stamp: "STP", canvas: "CVS", banner: "BNR", sign: "SGN", booklet: "BKL", ncr: "NCR", "business-card": "BCD", vehicle: "VEH", "standard-print": "PRT", other: "—" }[family] || "—";
              const productSummary = order._count.items > 1
                ? `${firstProduct} +${order._count.items - 1} more`
                : firstProduct;
              // Quick specs for production staff
              const meta = firstItem?.meta && typeof firstItem.meta === "object" ? firstItem.meta : {};
              const quickSpecs = [];
              const w = firstItem?.widthIn || meta.width;
              const h = firstItem?.heightIn || meta.height;
              if (w && h) quickSpecs.push(`${w}"×${h}"`);
              else if (meta.sizeLabel) quickSpecs.push(meta.sizeLabel);
              if (firstItem?.material || meta.material) quickSpecs.push((firstItem?.material || meta.material).replace(/-/g, " "));
              if (meta.sides === "double" || meta.doubleSided) quickSpecs.push("2-sided");

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="group flex flex-col gap-1 px-5 py-3 transition-colors hover:bg-[#fafafa] sm:grid sm:grid-cols-[5rem_1fr_1.2fr_4rem_8rem_6rem] sm:items-center sm:gap-2"
                >
                  {/* Order ID */}
                  <span className="font-mono text-xs font-medium text-[#666]">
                    #{order.id.slice(-6)}
                    {order.priority > 0 && (
                      <span className="ml-1.5 rounded-[2px] bg-red-200 px-1 py-0.5 text-[9px] font-bold text-red-800">RUSH</span>
                    )}
                  </span>

                  {/* Customer */}
                  <span className="truncate text-sm font-medium text-black">
                    {order.customerName || order.customerEmail}
                  </span>

                  {/* Product summary + family badge + quick specs */}
                  <div className="flex items-center gap-1.5 truncate" title={productSummary}>
                    <span className="shrink-0 rounded bg-gray-200 px-1 py-0.5 text-[8px] font-bold text-gray-600">{familyBadge}</span>
                    <span className="truncate text-xs text-[#666]">{productSummary}</span>
                    {quickSpecs.length > 0 && (
                      <span className="hidden sm:inline shrink-0 text-[9px] text-[#999]">
                        ({quickSpecs.join(", ")})
                      </span>
                    )}
                  </div>

                  {/* Age */}
                  <span className="text-xs font-medium tabular-nums text-[#999]">
                    {ageLabel(order.createdAt)}
                  </span>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    <span className={`shrink-0 rounded-[2px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      productionStatusColors[order.productionStatus] || "bg-gray-100 text-gray-700"
                    }`}>
                      {productionStatusLabels[order.productionStatus] || order.productionStatus}
                    </span>
                    {(order.tags || []).map((tag) => (
                      <span key={tag} className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[9px] text-[#666]">{tag}</span>
                    ))}
                  </div>

                  {/* Action label */}
                  <span className={`inline-flex items-center justify-center rounded-[3px] border px-2 py-1 text-[10px] font-bold sm:ml-auto ${actionColor}`}>
                    {action}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Row 3: Two columns ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: Today's Orders */}
        <div className="lg:col-span-3 rounded-[3px] border border-[#e0e0e0] bg-white">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-black">Recent Paid Orders</h2>
              <p className="mt-0.5 text-[10px] text-[#999]">Latest 10 paid orders</p>
            </div>
            <Link
              href="/admin/orders?status=paid"
              className="text-xs font-medium text-black underline hover:no-underline"
            >
              View All
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#999]">
              No paid orders yet
            </div>
          ) : (
            <div className="divide-y divide-[#e0e0e0]">
              {data.recentOrders.map((order) => {
                const firstItem = order.items?.[0];
                const firstProduct = firstItem?.productName || "";
                const family = firstItem ? detectProductFamily(firstItem) : "other";
                const familyBadge = { sticker: "STK", label: "LBL", stamp: "STP", canvas: "CVS", banner: "BNR", sign: "SGN", booklet: "BKL", ncr: "NCR", "business-card": "BCD", vehicle: "VEH", "standard-print": "PRT", other: "—" }[family] || "—";
                const productSummary = order._count.items > 1
                  ? `${firstProduct} +${order._count.items - 1} more`
                  : firstProduct;
                const action = getActionLabel(order);
                const actionColor = actionLabelColors[action] || "bg-gray-100 text-gray-700 border-gray-200";
                const meta = firstItem?.meta && typeof firstItem.meta === "object" ? firstItem.meta : {};
                const isRush = meta.turnaround === "rush" || meta.turnaround === "express" || meta.turnaround === "same-day" || order.priority > 0;
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-[#fafafa]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-black">
                          {order.customerName || order.customerEmail}
                        </p>
                        <span className="shrink-0 rounded bg-gray-200 px-1 py-0.5 text-[8px] font-bold text-gray-600">{familyBadge}</span>
                        <span
                          className={`shrink-0 rounded-[2px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            productionStatusColors[order.productionStatus] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {productionStatusLabels[order.productionStatus] || order.productionStatus}
                        </span>
                        {isRush && <span className="shrink-0 rounded-[2px] bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">RUSH</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-[#999]">
                        {productSummary ? `${productSummary} · ` : ""}{order._count.items} item{order._count.items !== 1 ? "s" : ""} &middot;{" "}
                        {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`hidden sm:inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[9px] font-bold ${actionColor}`}>{action}</span>
                      <span className="text-sm font-semibold tabular-nums text-black">
                        {formatCad(order.totalAmount)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-black">Quick Actions</h2>
          <QuickActionButton
            label="Create Order"
            href="/admin/orders/create"
            icon={IconPlus}
          />
          <QuickActionButton
            label="Production Board"
            href="/admin/production/board"
            icon={IconBoard}
          />
          <QuickActionButton
            label="Generate Proof"
            href="/admin/tools/proof"
            icon={IconProof}
          />
          <QuickActionButton
            label="Contour Tool"
            href="/admin/tools/contour"
            icon={IconScissors}
          />
          <QuickActionButton
            label="Stamp Studio"
            href="/admin/tools/stamp-studio"
            icon={IconPackage}
          />
        </div>
      </div>

      {/* ── Row 4: Recent Activity Feed ── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-black">Recent Activity</h2>
            <p className="mt-0.5 text-[10px] text-[#999]">Last 10 actions</p>
          </div>
          <Link
            href="/admin/logs"
            className="text-xs font-medium text-black underline hover:no-underline"
          >
            Full Log
          </Link>
        </div>
        {data.recentActivity.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">
            No recent activity
          </div>
        ) : (
          <div className="divide-y divide-[#e0e0e0]">
            {data.recentActivity.map((log) => (
              <ActivityEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
