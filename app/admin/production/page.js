"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const statusOptions = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "assigned", label: "Assigned" },
  { value: "printing", label: "Printing" },
  { value: "quality_check", label: "Quality Check" },
  { value: "finished", label: "Finished" },
  { value: "shipped", label: "Shipped" },
  { value: "on_hold", label: "On Hold" },
];

const priorityOptions = [
  { value: "all", label: "All" },
  { value: "normal", label: "Normal" },
  { value: "rush", label: "Rush" },
  { value: "urgent", label: "Urgent" },
];

const statusColors = {
  queued: "bg-[#f5f5f5] text-black",
  assigned: "bg-blue-100 text-blue-700",
  printing: "bg-yellow-100 text-yellow-700",
  quality_check: "bg-purple-100 text-purple-700",
  finished: "bg-green-100 text-green-700",
  shipped: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-red-100 text-red-700",
};

const priorityColors = {
  normal: "bg-[#f5f5f5] text-[#666]",
  rush: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

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

export default function ProductionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          Loading...
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

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState([]);
  const [updatingJob, setUpdatingJob] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

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
      const data = await res.json();
      setFactories(data.factories || data || []);
    } catch (err) {
      console.error("Failed to load factories:", err);
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
      const data = await res.json();
      setJobs(data.jobs || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load production jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, factoryFilter, search]);

  useEffect(() => {
    fetchFactories();
  }, [fetchFactories]);

  useEffect(() => {
    fetchJobs();
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

  async function handleStatusChange(jobId, newStatus) {
    setUpdatingJob(jobId);
    try {
      const res = await fetch(`/api/admin/production/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        console.error("Failed to update status");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingJob(null);
    }
  }

  async function handleFactoryAssign(jobId, factoryId) {
    setUpdatingJob(jobId);
    try {
      const res = await fetch(`/api/admin/production/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factoryId: factoryId || null }),
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        console.error("Failed to assign factory");
      }
    } catch (err) {
      console.error("Failed to assign factory:", err);
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
    try {
      const res = await fetch('/api/admin/production/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: selectedJobs, updates })
      });
      if (res.ok) {
        setSelectedJobs([]);
        await fetchJobs();
      }
    } catch (err) {
      console.error('Bulk update failed:', err);
    } finally {
      setBulkUpdating(false);
    }
  }

  // Stats computed from current data
  const totalQueued = jobs.filter((j) => j.status === "queued").length;
  const inProduction = jobs.filter((j) => j.status === "printing").length;
  const qualityCheck = jobs.filter((j) => j.status === "quality_check").length;
  const today = new Date().toDateString();
  const completedToday = jobs.filter(
    (j) =>
      j.status === "finished" &&
      j.updatedAt &&
      new Date(j.updatedAt).toDateString() === today
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-black">
          Production Queue
        </h1>
        {pagination && (
          <span className="inline-flex items-center rounded-[2px] bg-black px-2.5 py-0.5 text-xs font-medium text-white">
            {pagination.total}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
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
        </div>
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
            className="w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999]">Total Queued</p>
          <p className="mt-1 text-2xl font-semibold text-black">
            {totalQueued}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999]">In Production</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {inProduction}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999]">Quality Check</p>
          <p className="mt-1 text-2xl font-semibold text-purple-600">
            {qualityCheck}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999]">Completed Today</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {completedToday}
          </p>
        </div>
      </div>

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
            Loading...
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

                      {/* Product */}
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate font-medium text-black">
                          {job.orderItem?.product?.name ||
                            job.productName ||
                            "Unknown"}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className="max-w-[180px] truncate text-[#666]">
                          {job.orderItem?.order?.customerEmail ||
                            job.customerEmail ||
                            "\u2014"}
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
                            statusColors[job.status] || "bg-[#f5f5f5]"
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
                            priorityColors[job.priority] || "bg-[#f5f5f5]"
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
                        {job.orderItem?.product?.name ||
                          job.productName ||
                          "Unknown"}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[#999]">
                        {job.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#999]">
                        {job.orderItem?.order?.customerEmail ||
                          job.customerEmail ||
                          "\u2014"}
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
                        statusColors[job.status] || "bg-[#f5f5f5]"
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
                        priorityColors[job.priority] || "bg-[#f5f5f5]"
                      }`}
                    >
                      {job.priority}
                    </span>

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
