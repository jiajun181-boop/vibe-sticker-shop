"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMN_ORDER = [
  "queued",
  "assigned",
  "printing",
  "quality_check",
  "finished",
  "shipped",
  "on_hold",
];

const COLUMN_LABELS = {
  queued: "Queued",
  assigned: "Assigned",
  printing: "Printing",
  quality_check: "Quality Check",
  finished: "Finished",
  shipped: "Shipped",
  on_hold: "On Hold",
};

const COLUMN_HEADER_COLORS = {
  queued: "text-black",
  assigned: "text-blue-700",
  printing: "text-yellow-700",
  quality_check: "text-purple-700",
  finished: "text-green-700",
  shipped: "text-emerald-700",
  on_hold: "text-red-700",
};

const COLUMN_COUNT_BADGE_COLORS = {
  queued: "bg-[#e0e0e0] text-black",
  assigned: "bg-blue-100 text-blue-700",
  printing: "bg-yellow-100 text-yellow-700",
  quality_check: "bg-purple-100 text-purple-700",
  finished: "bg-green-100 text-green-700",
  shipped: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-red-100 text-red-700",
};

const NEXT_STATUS = {
  queued: "assigned",
  assigned: "printing",
  printing: "quality_check",
  quality_check: "finished",
  finished: "shipped",
  on_hold: "queued",
};

const priorityOptions = [
  { value: "all", label: "All" },
  { value: "normal", label: "Normal" },
  { value: "rush", label: "Rush" },
  { value: "urgent", label: "Urgent" },
];

const dateRangeOptions = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProductionBoardPage() {
  // Board data keyed by status
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState([]);

  // Filters
  const [factoryFilter, setFactoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Drag and drop
  const [draggedJob, setDraggedJob] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // In-flight updates
  const [updatingJob, setUpdatingJob] = useState(null);

  // -----------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (factoryFilter !== "all") params.set("factory", factoryFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (dateRange !== "all") params.set("dateRange", dateRange);

    try {
      const res = await fetch(`/api/admin/production/board?${params}`);
      const data = await res.json();
      setColumns(data);
    } catch (err) {
      console.error("Failed to load board data:", err);
    } finally {
      setLoading(false);
    }
  }, [factoryFilter, priorityFilter, dateRange]);

  const fetchFactories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/factories");
      const data = await res.json();
      setFactories(data.factories || data || []);
    } catch (err) {
      console.error("Failed to load factories:", err);
    }
  }, []);

  useEffect(() => {
    fetchFactories();
  }, [fetchFactories]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // -----------------------------------------------------------
  // Actions
  // -----------------------------------------------------------

  async function handleMoveJob(jobId, newStatus) {
    setUpdatingJob(jobId);
    try {
      const res = await fetch(`/api/admin/production/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchBoard();
      } else {
        console.error("Failed to update job status");
      }
    } catch (err) {
      console.error("Failed to update job status:", err);
    } finally {
      setUpdatingJob(null);
    }
  }

  function handleMoveToNext(job) {
    const next = NEXT_STATUS[job.status];
    if (next) {
      handleMoveJob(job.id, next);
    }
  }

  // -----------------------------------------------------------
  // Determine which columns to show
  // -----------------------------------------------------------

  // Always show queued through finished, plus any column that has data
  const coreStatuses = ["queued", "assigned", "printing", "quality_check", "finished"];
  const visibleColumns = COLUMN_ORDER.filter(
    (status) =>
      coreStatuses.includes(status) ||
      (columns[status] && columns[status].length > 0)
  );

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col gap-3 rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        {/* Title */}
        <h1 className="text-lg font-semibold text-black">
          Production Board
        </h1>

        {/* Refresh button */}
        <button
          type="button"
          onClick={() => fetchBoard()}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-[3px] border border-[#d0d0d0] p-2 text-[#666] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
          aria-label="Refresh board"
        >
          <svg
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
            />
          </svg>
        </button>

        {/* Factory filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="board-factory-filter"
            className="text-xs font-medium text-[#999]"
          >
            Factory
          </label>
          <select
            id="board-factory-filter"
            value={factoryFilter}
            onChange={(e) => setFactoryFilter(e.target.value)}
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

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="board-priority-filter"
            className="text-xs font-medium text-[#999]"
          >
            Priority
          </label>
          <select
            id="board-priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="board-date-filter"
            className="text-xs font-medium text-[#999]"
          >
            Date
          </label>
          <select
            id="board-date-filter"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            {dateRangeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 sm:ml-auto">
          <span className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-semibold text-white">
            Board
          </span>
          <Link
            href="/admin/production"
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[#fafafa]"
          >
            List
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {loading && Object.keys(columns).length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-[#999]">
          Loading board...
        </div>
      ) : (
        /* Kanban columns - horizontal scroll container */
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 280px)" }}>
          {visibleColumns.map((status) => {
            const jobs = columns[status] || [];

            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(status);
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedJob && draggedJob.status !== status) {
                    handleMoveJob(draggedJob.id, status);
                  }
                  setDraggedJob(null);
                  setDragOverColumn(null);
                }}
                className={`min-w-[300px] max-w-[300px] flex-shrink-0 rounded-[3px] bg-[#fafafa] border ${
                  dragOverColumn === status
                    ? "border-blue-400 border-2 border-dashed bg-blue-50/50"
                    : "border-[#e0e0e0]"
                }`}
              >
                {/* Column header */}
                <div className="p-3 border-b border-[#e0e0e0] font-medium text-sm flex items-center justify-between">
                  <span className={COLUMN_HEADER_COLORS[status] || "text-black"}>
                    {COLUMN_LABELS[status] || status}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center rounded-[2px] px-2 py-0.5 text-xs font-semibold ${
                      COLUMN_COUNT_BADGE_COLORS[status] || "bg-[#e0e0e0] text-black"
                    }`}
                  >
                    {jobs.length}
                  </span>
                </div>

                {/* Scrollable card list */}
                <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {jobs.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#999]">
                      No jobs
                    </p>
                  ) : (
                    jobs.map((job) => (
                      <div
                        key={job.id}
                        draggable="true"
                        onDragStart={(e) => {
                          setDraggedJob({ ...job, status });
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDraggedJob(null);
                          setDragOverColumn(null);
                        }}
                        className={`rounded-[3px] bg-white border border-[#e0e0e0] p-3 shadow-sm hover:shadow-md transition-shadow cursor-move ${
                          draggedJob?.id === job.id ? "opacity-50" : ""
                        } ${updatingJob === job.id ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {/* Product name */}
                        <p className="font-semibold text-sm text-black truncate">
                          {job.productName || "Unknown Product"}
                        </p>

                        {/* Customer email */}
                        <p className="text-xs text-[#999] truncate mt-0.5">
                          {job.customerEmail || "\u2014"}
                        </p>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {/* Quantity badge */}
                          <span className="inline-block rounded-[2px] bg-[#f5f5f5] px-2 py-0.5 text-xs font-medium text-[#666]">
                            Qty: {job.quantity}
                          </span>

                          {/* Priority badge */}
                          {job.priority === "urgent" && (
                            <span className="inline-block rounded-[2px] bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              Urgent
                            </span>
                          )}
                          {job.priority === "rush" && (
                            <span className="inline-block rounded-[2px] bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                              Rush
                            </span>
                          )}
                        </div>

                        {/* Footer row: factory, time, actions */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e0e0e0]">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#999] truncate">
                              {job.factoryName || "Unassigned"}
                            </p>
                            <p className="text-xs text-[#999] mt-0.5">
                              {timeAgo(job.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            {/* Move to next status button */}
                            {NEXT_STATUS[status] && (
                              <button
                                type="button"
                                onClick={() => handleMoveToNext({ ...job, status })}
                                disabled={updatingJob === job.id}
                                className="inline-flex items-center justify-center rounded-md border border-[#e0e0e0] bg-white p-1.5 text-[#999] transition-colors hover:bg-[#fafafa] hover:text-black disabled:opacity-40"
                                title={`Move to ${COLUMN_LABELS[NEXT_STATUS[status]]}`}
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                  />
                                </svg>
                              </button>
                            )}

                            {/* View detail link */}
                            <Link
                              href={`/admin/production/${job.id}`}
                              className="inline-flex items-center justify-center rounded-md border border-[#e0e0e0] bg-white p-1.5 text-[#999] transition-colors hover:bg-[#fafafa] hover:text-black"
                              title="View details"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
