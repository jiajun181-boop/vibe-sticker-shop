"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { timeAgo as sharedTimeAgo } from "@/lib/admin/time-ago";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";
import { statusColor, priorityColor } from "@/lib/admin/status-labels";
import { CostSignalInline } from "@/components/admin/CostSignalBadge";
import CostSignalBadge from "@/components/admin/CostSignalBadge";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "assigned", label: "Assigned" },
  { value: "printing", label: "Printing" },
  { value: "quality_check", label: "Quality Check" },
  { value: "finished", label: "Finished" },
  { value: "shipped", label: "Shipped" },
  { value: "on_hold", label: "On Hold" },
  { value: "canceled", label: "Canceled" },
];

const priorityOptions = [
  { value: "all", label: "All" },
  { value: "normal", label: "Normal" },
  { value: "rush", label: "Rush" },
  { value: "urgent", label: "Urgent" },
];

const AUTO_REFRESH_MS = 30_000;

export default function ProductionPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          {t("admin.common.loading")}
        </div>
      }
    >
      <ProductionContent />
    </Suspense>
  );
}

function ProductionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const timeAgo = (d) => sharedTimeAgo(d, t);
  const refreshTimer = useRef(null);

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState([]);
  const [updatingJob, setUpdatingJob] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [priorityFilter, setPriorityFilter] = useState(
    searchParams.get("priority") || "all"
  );
  const [factoryFilter, setFactoryFilter] = useState(
    searchParams.get("factory") || "all"
  );
  const page = parseInt(searchParams.get("page") || "1");

  const fetchFactories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/factories");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFactories(data.factories || data || []);
    } catch (err) {
      console.error("Failed to load factories:", err);
      showActionError("Failed to load factories");
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (factoryFilter !== "all") params.set("factory", factoryFilter);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/production?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load production jobs:", err);
      showActionError("Failed to load production jobs");
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [page, statusFilter, priorityFilter, factoryFilter, search]);

  useEffect(() => {
    fetchFactories();
  }, [fetchFactories]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh every 30s
  useEffect(() => {
    refreshTimer.current = setInterval(() => fetchJobs(), AUTO_REFRESH_MS);
    return () => clearInterval(refreshTimer.current);
  }, [fetchJobs]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/production?${params}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    updateParams({ search: search || null, page: "1" });
  }

  function showActionError(msg) {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  }

  async function handleStatusChange(jobId, newStatus) {
    setUpdatingJob(jobId);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/production/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        showActionError(data.error || `Failed to change status to ${newStatus}`);
      }
    } catch {
      showActionError("Network error — status change failed");
    } finally {
      setUpdatingJob(null);
    }
  }

  async function handleFactoryAssign(jobId, factoryId) {
    setUpdatingJob(jobId);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/production/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factoryId: factoryId || null }),
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        showActionError(data.error || "Failed to assign factory");
      }
    } catch {
      showActionError("Network error — factory assignment failed");
    } finally {
      setUpdatingJob(null);
    }
  }

  function toggleSelectJob(jobId) {
    setSelectedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  }

  function toggleSelectAll() {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(j => j.id));
    }
  }

  async function handleBulkUpdate(updates) {
    if (selectedJobs.length === 0) return;
    const key = Object.keys(updates)[0];
    const value = Object.values(updates)[0];
    if (!value) return;

    const confirmed = confirm(`Update ${selectedJobs.length} jobs: set ${key} to "${value}"?`);
    if (!confirmed) return;

    setBulkUpdating(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/production/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: selectedJobs, updates })
      });
      if (res.ok) {
        setSelectedJobs([]);
        await fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        showActionError(data.error || `Bulk update failed for ${selectedJobs.length} jobs`);
      }
    } catch {
      showActionError("Network error — bulk update failed");
    } finally {
      setBulkUpdating(false);
    }
  }

  // Stats computed from current data
  const totalQueued = jobs.filter((j) => j.status === "queued").length;
  const inProduction = jobs.filter((j) => j.status === "printing").length;
  const qualityCheck = jobs.filter((j) => j.status === "quality_check").length;
  const today = new Date().toDateString();
  const now = new Date();
  const completedToday = jobs.filter(
    (j) =>
      j.status === "finished" &&
      j.updatedAt &&
      new Date(j.updatedAt).toDateString() === today
  ).length;
  const overdue = jobs.filter(
    (j) =>
      j.dueAt &&
      new Date(j.dueAt) < now &&
      !["finished", "shipped"].includes(j.status)
  ).length;
  const dueToday = jobs.filter(
    (j) =>
      j.dueAt &&
      new Date(j.dueAt).toDateString() === today &&
      !["finished", "shipped"].includes(j.status)
  ).length;
  const onHold = jobs.filter((j) => j.status === "on_hold").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-black">
          Production Queue
        </h1>
        {pagination && (
          <span className="inline-flex items-center rounded-[2px] bg-black px-2.5 py-0.5 text-xs font-medium text-[#fff]">
            {pagination.total}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchJobs()}
            disabled={loading}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-50"
            title={lastRefresh ? `Last refresh: ${lastRefresh.toLocaleTimeString()}` : ""}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/admin/production/schedule"
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            Schedule
          </Link>
          <Link
            href="/admin/production/board"
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            Board View
          </Link>
          <Link
            href="/admin/production/rules"
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            Rules
          </Link>
          <Link
            href="/admin/reports/production"
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Queued", value: totalQueued, color: "text-gray-700 bg-gray-50 border-gray-200" },
          { label: "Printing", value: inProduction, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
          { label: "QC", value: qualityCheck, color: "text-purple-700 bg-purple-50 border-purple-200" },
          { label: "Done Today", value: completedToday, color: "text-green-700 bg-green-50 border-green-200" },
          { label: "Due Today", value: dueToday, color: dueToday > 0 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-gray-600 bg-gray-50 border-gray-200" },
          { label: "Overdue", value: overdue, color: overdue > 0 ? "text-red-700 bg-red-50 border-red-200" : "text-gray-600 bg-gray-50 border-gray-200" },
          { label: "On Hold", value: onHold, color: onHold > 0 ? "text-red-700 bg-red-50 border-red-200" : "text-gray-600 bg-gray-50 border-gray-200" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-[3px] border px-3 py-2 text-center ${stat.color}`}>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="status-filter"
            className="text-xs font-medium text-[#999]"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              updateParams({
                status: e.target.value === "all" ? null : e.target.value,
                page: "1",
              });
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="priority-filter"
            className="text-xs font-medium text-[#999]"
          >
            Priority
          </label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              updateParams({
                priority: e.target.value === "all" ? null : e.target.value,
                page: "1",
              });
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Factory filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="factory-filter"
            className="text-xs font-medium text-[#999]"
          >
            Factory
          </label>
          <select
            id="factory-filter"
            value={factoryFilter}
            onChange={(e) => {
              setFactoryFilter(e.target.value);
              updateParams({
                factory: e.target.value === "all" ? null : e.target.value,
                page: "1",
              });
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            <option value="all">All Factories</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex gap-2 sm:ml-auto"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or email..."
            className="w-full sm:w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-center justify-between rounded-[3px] border border-red-300 bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-800">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-xs font-medium text-red-600 hover:text-red-900">Dismiss</button>
        </div>
      )}

      {/* Readiness summary — loaded async */}
      <ReadinessSummary />

      {/* Bulk action bar */}
      {selectedJobs.length > 0 && (
        <div className="sticky top-0 z-10 rounded-[3px] border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedJobs.length} job{selectedJobs.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <select
                onChange={(e) => handleBulkUpdate({ status: e.target.value })}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black"
                defaultValue=""
              >
                <option value="" disabled>Change Status...</option>
                <option value="assigned">Mark as Assigned</option>
                <option value="printing">Mark as Printing</option>
                <option value="quality_check">Send to QC</option>
                <option value="finished">Mark as Finished</option>
                <option value="on_hold">Put on Hold</option>
              </select>
              <select
                onChange={(e) => handleBulkUpdate({ factoryId: e.target.value })}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black"
                defaultValue=""
              >
                <option value="" disabled>Assign Factory...</option>
                {factories.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <select
                onChange={(e) => handleBulkUpdate({ priority: e.target.value })}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black"
                defaultValue=""
              >
                <option value="" disabled>Set Priority...</option>
                <option value="normal">Normal</option>
                <option value="rush">Rush</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                onClick={() => setSelectedJobs([])}
                className="text-xs text-[#999] hover:text-black"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            {t("admin.common.loading")}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            No production jobs found
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedJobs.length === jobs.length && jobs.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-[#d0d0d0]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Job ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Factory
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Due
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className={`hover:bg-[#fafafa] ${
                        updatingJob === job.id ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={() => toggleSelectJob(job.id)}
                          className="h-4 w-4 rounded border-[#d0d0d0]"
                        />
                      </td>

                      {/* Job ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[#666]">
                          {job.id.slice(0, 8)}
                        </span>
                      </td>

                      {/* Product + Specs */}
                      <td className="px-4 py-3">
                        <p className="max-w-[220px] truncate font-medium text-black">
                          {job.productName || "Unknown"}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <Link
                            href={`/admin/production/${job.id}`}
                            className="text-[10px] font-medium text-black hover:underline"
                          >
                            Job #{job.id.slice(0, 8)}
                          </Link>
                          {job.orderId && (
                            <Link
                              href={`/admin/orders/${job.orderId}`}
                              className="text-[10px] text-blue-600 hover:underline"
                            >
                              Order #{job.orderId.slice(0, 8)}
                            </Link>
                          )}
                          {job.family && (
                            <span className="text-[10px] text-gray-400">{job.family}</span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#999]">
                          {job.quantity > 0 && <span>Qty {job.quantity}</span>}
                          {job.widthIn && job.heightIn && <span>{job.widthIn}&quot;×{job.heightIn}&quot;</span>}
                          {(job.materialLabel || job.material) && <span>{job.materialLabel || job.material}</span>}
                          {(job.finishingLabel || job.finishing) && <span>{job.finishingLabel || job.finishing}</span>}
                          {job.isTwoSided && <span>2-sided</span>}
                          {job.artworkUrl ? (
                            <a href={job.artworkUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Artwork ✓</a>
                          ) : (
                            <span className="text-amber-500">No artwork</span>
                          )}
                          <CostSignalInline signal={job.costSignal} />
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className="max-w-[180px] truncate text-[#666]">
                          {job.customerEmail || "\u2014"}
                        </p>
                      </td>

                      {/* Status (inline editable) */}
                      <td className="px-4 py-3">
                        <select
                          value={job.status}
                          onChange={(e) =>
                            handleStatusChange(job.id, e.target.value)
                          }
                          disabled={updatingJob === job.id}
                          className={`rounded-[2px] border-0 px-2.5 py-0.5 text-xs font-medium outline-none cursor-pointer ${
                            statusColor(job.status)
                          }`}
                        >
                          {statusOptions
                            .filter((opt) => opt.value !== "all")
                            .map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                            priorityColor(job.priority)
                          }`}
                        >
                          {job.priority}
                        </span>
                      </td>

                      {/* Factory (inline editable) */}
                      <td className="px-4 py-3">
                        <select
                          value={job.factoryId || ""}
                          onChange={(e) =>
                            handleFactoryAssign(job.id, e.target.value)
                          }
                          disabled={updatingJob === job.id}
                          className="rounded-[3px] border border-[#e0e0e0] bg-white px-2 py-1 text-xs text-black outline-none cursor-pointer focus:border-black"
                        >
                          <option value="">Unassigned</option>
                          {factories.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Due */}
                      <td className="px-4 py-3 text-xs">
                        {job.dueAt ? (() => {
                          const due = new Date(job.dueAt);
                          const now = new Date();
                          const isTerminal = ["finished", "shipped"].includes(job.status);
                          const isOverdue = !isTerminal && due < now;
                          const isDueToday = !isTerminal && due.toDateString() === now.toDateString();
                          return (
                            <span className={isOverdue ? "font-semibold text-red-600" : isDueToday ? "font-semibold text-amber-600" : "text-[#999]"}>
                              {due.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                            </span>
                          );
                        })() : <span className="text-[#ccc]">{"\u2014"}</span>}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-[#999]">
                        {timeAgo(job.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/production/${job.id}`}
                          className="text-xs font-medium text-black underline hover:no-underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <div className="divide-y divide-[#e0e0e0] xl:hidden">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`px-4 py-3 transition-colors hover:bg-[#fafafa] ${
                    updatingJob === job.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={() => toggleSelectJob(job.id)}
                      className="mr-3 mt-1 h-4 w-4 rounded border-[#d0d0d0]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-black">
                        {job.productName || "Unknown"}
                      </p>
                      {/* Specs row */}
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-[#999]">
                        {job.quantity > 0 && <span>Qty {job.quantity}</span>}
                        {job.widthIn && job.heightIn && <span>{job.widthIn}&quot;×{job.heightIn}&quot;</span>}
                        {(job.materialLabel || job.material) && <span>{job.materialLabel || job.material}</span>}
                        {job.artworkUrl ? (
                          <a href={job.artworkUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Artwork ✓</a>
                        ) : (
                          <span className="text-amber-500">No artwork</span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-[#999]">
                        {job.id.slice(0, 8)}
                        {job.orderId && (
                          <>
                            {" · "}
                            <Link
                              href={`/admin/orders/${job.orderId}`}
                              className="text-blue-600 hover:underline"
                            >
                              Order
                            </Link>
                          </>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#999]">
                        {job.customerEmail || "\u2014"}
                      </p>
                    </div>
                    <Link
                      href={`/admin/production/${job.id}`}
                      className="ml-3 text-xs font-medium text-black underline hover:no-underline"
                    >
                      View
                    </Link>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* Inline status select */}
                    <select
                      value={job.status}
                      onChange={(e) =>
                        handleStatusChange(job.id, e.target.value)
                      }
                      disabled={updatingJob === job.id}
                      className={`rounded-[2px] border-0 px-2 py-0.5 text-xs font-medium outline-none cursor-pointer ${
                        statusColor(job.status)
                      }`}
                    >
                      {statusOptions
                        .filter((opt) => opt.value !== "all")
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                    </select>

                    <span
                      className={`rounded-[2px] px-2 py-0.5 text-xs font-medium ${
                        priorityColor(job.priority)
                      }`}
                    >
                      {job.priority}
                    </span>

                    <CostSignalBadge signal={job.costSignal} size="md" />

                    {/* Inline factory select */}
                    <select
                      value={job.factoryId || ""}
                      onChange={(e) =>
                        handleFactoryAssign(job.id, e.target.value)
                      }
                      disabled={updatingJob === job.id}
                      className="rounded-[3px] border border-[#e0e0e0] bg-white px-2 py-0.5 text-xs text-black outline-none cursor-pointer focus:border-black"
                    >
                      <option value="">Unassigned</option>
                      {factories.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    {job.dueAt && (() => {
                      const due = new Date(job.dueAt);
                      const now = new Date();
                      const isTerminal = ["finished", "shipped"].includes(job.status);
                      const isOverdue = !isTerminal && due < now;
                      const isDueToday = !isTerminal && due.toDateString() === now.toDateString();
                      return (
                        <span className={`text-xs ${isOverdue ? "font-semibold text-red-600" : isDueToday ? "font-semibold text-amber-600" : "text-[#999]"}`}>
                          Due {due.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                        </span>
                      );
                    })()}

                    <span className="text-xs text-[#999]">
                      {timeAgo(job.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#999]">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Readiness Summary Widget ─── */
function ReadinessSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/production/readiness")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch((err) => {
        console.error("[Production Readiness] Load failed:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const { counts, topBlockers, totalItems } = data;
  const readyPct = totalItems > 0 ? Math.round(((counts.ready || 0) + (counts.done || 0)) / totalItems * 100) : 0;

  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-6">
        {/* Readiness bar */}
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-[#999] uppercase tracking-wide">Production Readiness</p>
            <p className="text-xs font-semibold text-black">{readyPct}% Ready</p>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
            {(counts.done || 0) > 0 && (
              <div className="bg-green-500" style={{ width: `${((counts.done || 0) / totalItems) * 100}%` }} title={`Done: ${counts.done}`} />
            )}
            {(counts.ready || 0) > 0 && (
              <div className="bg-green-300" style={{ width: `${((counts.ready || 0) / totalItems) * 100}%` }} title={`Ready: ${counts.ready}`} />
            )}
            {(counts["in-progress"] || 0) > 0 && (
              <div className="bg-blue-400" style={{ width: `${((counts["in-progress"] || 0) / totalItems) * 100}%` }} title={`In Progress: ${counts["in-progress"]}`} />
            )}
            {(counts["needs-info"] || 0) > 0 && (
              <div className="bg-amber-400" style={{ width: `${((counts["needs-info"] || 0) / totalItems) * 100}%` }} title={`Needs Info: ${counts["needs-info"]}`} />
            )}
            {(counts.blocked || 0) > 0 && (
              <div className="bg-red-500" style={{ width: `${((counts.blocked || 0) / totalItems) * 100}%` }} title={`Blocked: ${counts.blocked}`} />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" />Done {counts.done || 0}</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-300" />Ready {counts.ready || 0}</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-400" />In Progress {counts["in-progress"] || 0}</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" />Needs Info {counts["needs-info"] || 0}</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" />Blocked {counts.blocked || 0}</span>
          </div>
        </div>

        {/* Top blockers */}
        {topBlockers && topBlockers.length > 0 && (
          <div className="min-w-[200px]">
            <p className="text-xs font-medium text-[#999] uppercase tracking-wide mb-1.5">Top Blockers</p>
            <div className="space-y-1">
              {topBlockers.slice(0, 5).map((b) => (
                <div key={b.code} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-red-700 truncate">{b.code.replace(/_/g, " ")}</span>
                  <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
