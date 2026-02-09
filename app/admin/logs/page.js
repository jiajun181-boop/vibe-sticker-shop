"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ACTION_COLORS = {
  created: "bg-green-50 text-green-700",
  updated: "bg-blue-50 text-blue-700",
  deleted: "bg-red-50 text-red-700",
  exported: "bg-purple-50 text-purple-700",
  imported: "bg-cyan-50 text-cyan-700",
};

const ENTITY_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "order", label: "Order" },
  { value: "product", label: "Product" },
  { value: "coupon", label: "Coupon" },
  { value: "setting", label: "Setting" },
  { value: "media", label: "Media" },
];

export default function LogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          Loading...
        </div>
      }
    >
      <LogsContent />
    </Suspense>
  );
}

function LogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const [entity, setEntity] = useState(searchParams.get("entity") || "");
  const [action, setAction] = useState(searchParams.get("action") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (entity) params.set("entity", entity);
    if (action) params.set("action", action);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    try {
      const res = await fetch(`/api/admin/logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, entity, action, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/logs?${params}`);
  }

  function handleFilter() {
    updateParams({
      entity: entity || null,
      action: action || null,
      from: dateFrom || null,
      to: dateTo || null,
      page: "1",
    });
  }

  function handleClearFilters() {
    setEntity("");
    setAction("");
    setDateFrom("");
    setDateTo("");
    router.push("/admin/logs");
  }

  function getActionBadgeColor(actionName) {
    return ACTION_COLORS[actionName] || "bg-gray-100 text-gray-700";
  }

  function renderDetails(details) {
    if (!details) return null;

    if (typeof details === "object" && !Array.isArray(details)) {
      const entries = Object.entries(details);
      if (entries.length === 0) return null;

      return (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {entries.map(([key, value]) => (
            <span key={key} className="text-xs text-gray-500">
              <span className="font-medium text-gray-600">{key}:</span>{" "}
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </span>
          ))}
        </div>
      );
    }

    return <p className="text-xs text-gray-500">{String(details)}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Activity Log</h1>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-gray-900"
          >
            {ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Action..."
            className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-gray-900"
          />

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none focus:border-gray-900"
            />
          </div>

          <button
            type="button"
            onClick={handleFilter}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-black"
          >
            Filter
          </button>

          {(entity || action || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          Loading activity logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          No activity logs found
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {log.entity}
                  </span>
                  {log.entityId && (
                    <span className="text-xs font-mono text-gray-400">
                      {log.entityId}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{log.actor}</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {log.details && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  {renderDetails(log.details)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
