"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUS_FLOW = ["queued", "assigned", "printing", "quality_check", "finished", "shipped"];

const STATUS_COLORS = {
  queued: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  assigned: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
  printing: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300" },
  quality_check: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300" },
  finished: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300" },
  shipped: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300" },
  on_hold: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
};

const STATUS_LABEL_KEYS = {
  queued: "admin.production.statusQueued",
  assigned: "admin.production.statusAssigned",
  printing: "admin.production.statusPrinting",
  quality_check: "admin.production.statusQC",
  finished: "admin.production.statusFinished",
  shipped: "admin.production.statusShipped",
  on_hold: "admin.production.statusOnHold",
};

const AUTO_REFRESH_MS = 15_000;

export default function MobileProductionPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [filter, setFilter] = useState("active");
  const [updating, setUpdating] = useState(null);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/production/board");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);
  useEffect(() => {
    const timer = setInterval(fetchBoard, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchBoard]);

  function showActionError(msg) {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  }

  const advanceJob = async (jobId, currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1];

    setUpdating(jobId);
    try {
      const res = await fetch(`/api/admin/production/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showActionError(err.error || t("admin.production.mobile.updateFailed"));
        return;
      }
      await fetchBoard();
    } catch {
      showActionError(t("admin.production.mobile.networkError"));
    } finally {
      setUpdating(null);
    }
  };

  const allJobs = data
    ? Object.entries(data.columns).flatMap(([status, jobs]) =>
        jobs.map((j) => ({ ...j, status }))
      )
    : [];

  const filteredJobs = allJobs.filter((j) => {
    if (filter === "active") return !["finished", "shipped", "canceled", "on_hold"].includes(j.status);
    if (filter === "queued") return j.status === "queued";
    if (filter === "printing") return j.status === "printing" || j.status === "assigned";
    return true;
  });

  filteredJobs.sort((a, b) => {
    const pMap = { urgent: 0, rush: 1, normal: 2 };
    const pDiff = (pMap[a.priority] ?? 2) - (pMap[b.priority] ?? 2);
    if (pDiff !== 0) return pDiff;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const counts = {};
  for (const j of allJobs) {
    counts[j.status] = (counts[j.status] || 0) + 1;
  }

  const activeCount = (counts.queued || 0) + (counts.assigned || 0) + (counts.printing || 0) + (counts.quality_check || 0);

  return (
    <div className="min-h-screen bg-[#f6f6f7] pb-24">
      {/* Header — sticky */}
      <header className="sticky top-0 z-10 border-b border-[#e0e0e0] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#111]">
              {t("admin.production.mobile.title")}
            </h1>
            <p className="text-xs text-[#888]">
              {t("admin.production.mobile.jobs").replace("{count}", filteredJobs.length)}
              {data && ` · ${t("admin.systemHealth.lastChecked")}: ${new Date().toLocaleTimeString()}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setLoading(true); fetchBoard(); }}
            className="rounded-lg border border-[#d0d0d0] px-4 py-2 text-sm font-medium text-[#333] active:bg-[#eee]"
          >
            {loading ? "..." : t("admin.production.mobile.refreshBtn")}
          </button>
        </div>

        {/* Filter tabs — large touch targets */}
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {[
            { key: "active", label: t("admin.production.mobile.tabActive").replace("{count}", activeCount) },
            { key: "queued", label: t("admin.production.mobile.tabQueued").replace("{count}", counts.queued || 0) },
            { key: "printing", label: t("admin.production.mobile.tabPrinting").replace("{count}", (counts.assigned || 0) + (counts.printing || 0)) },
            { key: "all", label: t("admin.production.mobile.tabAll") },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === tab.key
                  ? "bg-black text-white"
                  : "bg-[#f0f0f0] text-[#666] active:bg-[#ddd]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Action error banner */}
      {actionError && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
          <span className="text-sm font-medium text-red-800">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-xs font-medium text-red-600">
            {t("admin.production.dismiss")}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      )}

      {/* Job Cards */}
      <div className="p-4 space-y-3">
        {filteredJobs.length === 0 && !loading && (
          <div className="py-16 text-center">
            <p className="text-base text-[#999]">{t("admin.production.mobile.noJobs")}</p>
          </div>
        )}

        {filteredJobs.map((job) => {
          const colors = STATUS_COLORS[job.status] || STATUS_COLORS.queued;
          const isUrgent = job.priority === "urgent";
          const isRush = job.priority === "rush";
          const nextIdx = STATUS_FLOW.indexOf(job.status);
          const nextStatusKey = nextIdx >= 0 && nextIdx < STATUS_FLOW.length - 1
            ? STATUS_FLOW[nextIdx + 1]
            : null;
          const nextStatusLabel = nextStatusKey ? t(STATUS_LABEL_KEYS[nextStatusKey]) : null;
          const isUpdating = updating === job.id;
          const isOverdue = job.dueAt && new Date(job.dueAt) < new Date();

          return (
            <div
              key={job.id}
              className={`rounded-xl border-2 bg-white p-4 shadow-sm ${colors.border} ${isOverdue ? "border-red-400" : ""}`}
            >
              {/* Top row: product name + priority */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[#111] leading-tight">
                    {job.productName || t("admin.production.mobile.unknownProduct")}
                  </h3>
                  <p className="mt-0.5 text-sm text-[#666]">
                    {job.customerName || job.customerEmail || "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isUrgent && (
                    <span className="rounded-full px-3 py-1 text-xs font-bold bg-red-500 text-white">
                      {t("admin.production.priorityUrgent")}
                    </span>
                  )}
                  {isRush && (
                    <span className="rounded-full px-3 py-1 text-xs font-bold bg-orange-100 text-orange-800">
                      {t("admin.production.priorityRush")}
                    </span>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                    {t(STATUS_LABEL_KEYS[job.status] || "") || job.status}
                  </span>
                </div>
              </div>

              {/* Details row */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#555]">
                <span>{t("admin.production.mobile.quantity")}: <strong>{job.quantity}</strong></span>
                {job.widthIn && job.heightIn && (
                  <span>{t("admin.production.mobile.size")}: <strong>{job.widthIn}"×{job.heightIn}"</strong></span>
                )}
                {job.material && <span>{t("admin.production.mobile.material")}: <strong>{job.materialLabel || job.material}</strong></span>}
                {job.isTwoSided && <span className="font-semibold text-blue-600">{t("admin.production.mobile.twoSided")}</span>}
                {job.finishing && <span>{t("admin.production.mobile.finishing")}: <strong>{job.finishing}</strong></span>}
              </div>

              {/* Due date */}
              {job.dueAt && (
                <p className={`mt-2 text-sm font-medium ${isOverdue ? "text-red-600" : "text-[#888]"}`}>
                  {isOverdue ? `⚠ ${t("admin.production.mobile.overdue")}` : t("admin.production.mobile.dueDate")}: {new Date(job.dueAt).toLocaleDateString(undefined)}
                </p>
              )}

              {/* Factory */}
              {job.factoryName && (
                <p className="mt-1 text-xs text-[#aaa]">{t("admin.production.mobile.factoryLabel")}: {job.factoryName}</p>
              )}

              {/* Action button — large touch target */}
              {nextStatusLabel && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => advanceJob(job.id, job.status)}
                  className="mt-4 w-full rounded-xl bg-black py-4 text-center text-base font-bold text-white active:bg-[#333] disabled:opacity-50"
                >
                  {isUpdating
                    ? t("admin.production.mobile.updating")
                    : t("admin.production.mobile.advanceTo").replace("{status}", nextStatusLabel)}
                </button>
              )}

              {/* View artwork link */}
              {job.artworkUrl && (
                <a
                  href={job.artworkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block w-full rounded-xl border-2 border-[#e0e0e0] py-3 text-center text-sm font-semibold text-[#555] active:bg-[#f5f5f5]"
                >
                  {t("admin.production.mobile.viewArtwork")}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
