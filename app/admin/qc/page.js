"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const resolutionOptions = [
  { value: "", label: "All Resolutions" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "reprint", label: "Reprint" },
  { value: "refund", label: "Refund" },
  { value: "discounted", label: "Discounted" },
];

const severityOptions = [
  { value: "", label: "All Severities" },
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
];

const defectTypeOptions = [
  { value: "color_mismatch", label: "Color Mismatch" },
  { value: "cut_error", label: "Cut Error" },
  { value: "print_defect", label: "Print Defect" },
  { value: "material_defect", label: "Material Defect" },
  { value: "damage", label: "Damage" },
  { value: "other", label: "Other" },
];

const severityColors = {
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const resolutionColors = {
  pending: "bg-[#f5f5f5] text-[#666]",
  accepted: "bg-green-100 text-green-700",
  reprint: "bg-blue-100 text-blue-700",
  refund: "bg-purple-100 text-purple-700",
  discounted: "bg-orange-100 text-orange-700",
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

export default function QCPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [resolutionFilter, setResolutionFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [page, setPage] = useState(1);

  // Report defect form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    orderId: "",
    defectType: "color_mismatch",
    severity: "minor",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Resolve inline
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveData, setResolveData] = useState({
    resolution: "accepted",
    resolutionNote: "",
  });
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (resolutionFilter) params.set("resolution", resolutionFilter);
    if (severityFilter) params.set("severity", severityFilter);

    try {
      const res = await fetch(`/api/admin/qc?${params}`);
      const data = await res.json();
      setReports(data.reports || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load QC reports:", err);
    } finally {
      setLoading(false);
    }
  }, [page, resolutionFilter, severityFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleCreateReport(e) {
    e.preventDefault();
    setFormError("");

    if (!formData.orderId.trim()) {
      setFormError("Order ID is required");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Description is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/qc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Failed to create report");
        return;
      }
      setFormData({
        orderId: "",
        defectType: "color_mismatch",
        severity: "minor",
        description: "",
      });
      setShowForm(false);
      await fetchReports();
    } catch (err) {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(reportId) {
    setResolveSubmitting(true);
    try {
      const res = await fetch(`/api/admin/qc/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resolveData),
      });
      if (res.ok) {
        setResolvingId(null);
        setResolveData({ resolution: "accepted", resolutionNote: "" });
        await fetchReports();
      } else {
        console.error("Failed to resolve report");
      }
    } catch (err) {
      console.error("Failed to resolve report:", err);
    } finally {
      setResolveSubmitting(false);
    }
  }

  // Stats from current page
  const pendingCount = reports.filter((r) => r.resolution === "pending").length;
  const criticalCount = reports.filter((r) => r.severity === "critical").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-black">
            Quality Control
          </h1>
          {pagination && (
            <span className="inline-flex items-center rounded-[2px] bg-black px-2.5 py-0.5 text-xs font-medium text-white">
              {pagination.total}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
        >
          {showForm ? "Cancel" : "Report Defect"}
        </button>
      </div>

      {/* Report Defect Form (inline) */}
      {showForm && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-black">
            New Defect Report
          </h2>
          <form onSubmit={handleCreateReport} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Order ID */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[#666]">
                  Order ID *
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, orderId: e.target.value }))
                  }
                  placeholder="e.g. cm4x7abc..."
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {/* Defect Type */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[#666]">
                  Defect Type
                </label>
                <select
                  value={formData.defectType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      defectType: e.target.value,
                    }))
                  }
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm text-black outline-none focus:border-gray-900"
                >
                  {defectTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[#666]">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      severity: e.target.value,
                    }))
                  }
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm text-black outline-none focus:border-gray-900"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[#666]">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Describe the defect..."
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>

            {formError && (
              <p className="text-xs font-medium text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-[3px] bg-black px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#222] disabled:bg-[#999]"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-[3px] border border-[#e0e0e0] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Resolution filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#999]">
            Resolution
          </label>
          <select
            value={resolutionFilter}
            onChange={(e) => {
              setResolutionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-gray-900"
          >
            {resolutionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#999]">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-gray-900"
          >
            {severityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick filter buttons */}
        <div className="flex gap-1 sm:ml-auto">
          <button
            type="button"
            onClick={() => {
              setResolutionFilter("pending");
              setSeverityFilter("");
              setPage(1);
            }}
            className={`rounded-[3px] border px-3 py-1.5 text-xs font-medium transition-colors ${
              resolutionFilter === "pending" && !severityFilter
                ? "border-gray-900 bg-black text-white"
                : "border-[#d0d0d0] text-black hover:bg-[#fafafa]"
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => {
              setSeverityFilter("critical");
              setResolutionFilter("");
              setPage(1);
            }}
            className={`rounded-[3px] border px-3 py-1.5 text-xs font-medium transition-colors ${
              severityFilter === "critical" && !resolutionFilter
                ? "border-red-600 bg-red-600 text-white"
                : "border-[#d0d0d0] text-black hover:bg-[#fafafa]"
            }`}
          >
            Critical
          </button>
          <button
            type="button"
            onClick={() => {
              setResolutionFilter("");
              setSeverityFilter("");
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          <p className="text-xs font-medium text-[#999]">Total Reports</p>
          <p className="mt-1 text-2xl font-semibold text-black">
            {pagination?.total || 0}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          <p className="text-xs font-medium text-[#999]">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          <p className="text-xs font-medium text-[#999]">Critical</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">
            {criticalCount}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          <p className="text-xs font-medium text-[#999]">This Page</p>
          <p className="mt-1 text-2xl font-semibold text-black">
            {reports.length}
          </p>
        </div>
      </div>

      {/* Reports table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            Loading QC reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            No QC reports found
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Defect Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Resolution
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Reported By
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
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-[#fafafa]">
                      {/* Order ID (linked) */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${report.orderId}`}
                          className="font-mono text-xs text-black underline hover:no-underline"
                        >
                          {report.orderId?.slice(0, 8)}...
                        </Link>
                      </td>

                      {/* Defect Type */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-black">
                          {report.defectType?.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Severity badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                            severityColors[report.severity] ||
                            "bg-[#f5f5f5] text-[#666]"
                          }`}
                        >
                          {report.severity}
                        </span>
                      </td>

                      {/* Description (truncated) */}
                      <td className="px-4 py-3">
                        <p
                          className="max-w-[240px] truncate text-sm text-[#666]"
                          title={report.description}
                        >
                          {report.description}
                        </p>
                      </td>

                      {/* Resolution badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                            resolutionColors[report.resolution] ||
                            "bg-[#f5f5f5] text-[#666]"
                          }`}
                        >
                          {report.resolution || "pending"}
                        </span>
                      </td>

                      {/* Reported By */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#666]">
                          {report.reportedBy || "\u2014"}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-[#999]">
                        {timeAgo(report.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {report.resolution === "pending" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setResolvingId(
                                resolvingId === report.id ? null : report.id
                              );
                              setResolveData({
                                resolution: "accepted",
                                resolutionNote: "",
                              });
                            }}
                            className="text-xs font-medium text-black underline hover:no-underline"
                          >
                            {resolvingId === report.id ? "Cancel" : "Resolve"}
                          </button>
                        ) : (
                          <span className="text-xs text-[#999]">
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="px-4 py-3 hover:bg-[#fafafa]"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${report.orderId}`}
                          className="font-mono text-xs text-black underline hover:no-underline"
                        >
                          {report.orderId?.slice(0, 8)}...
                        </Link>
                        <span
                          className={`inline-block rounded-[2px] px-2 py-0.5 text-xs font-medium ${
                            severityColors[report.severity] ||
                            "bg-[#f5f5f5] text-[#666]"
                          }`}
                        >
                          {report.severity}
                        </span>
                        <span
                          className={`inline-block rounded-[2px] px-2 py-0.5 text-xs font-medium ${
                            resolutionColors[report.resolution] ||
                            "bg-[#f5f5f5] text-[#666]"
                          }`}
                        >
                          {report.resolution || "pending"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-black">
                        {report.defectType?.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#999]">
                        {report.description}
                      </p>
                      <p className="mt-1 text-xs text-[#999]">
                        {report.reportedBy || "\u2014"} &middot;{" "}
                        {timeAgo(report.createdAt)}
                      </p>
                    </div>
                    {report.resolution === "pending" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingId(
                            resolvingId === report.id ? null : report.id
                          );
                          setResolveData({
                            resolution: "accepted",
                            resolutionNote: "",
                          });
                        }}
                        className="ml-3 text-xs font-medium text-black underline hover:no-underline"
                      >
                        {resolvingId === report.id ? "Cancel" : "Resolve"}
                      </button>
                    )}
                  </div>

                  {/* Inline resolve form (mobile) */}
                  {resolvingId === report.id && (
                    <div className="mt-3 rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
                      <div className="flex flex-col gap-2">
                        <select
                          value={resolveData.resolution}
                          onChange={(e) =>
                            setResolveData((prev) => ({
                              ...prev,
                              resolution: e.target.value,
                            }))
                          }
                          className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black outline-none focus:border-gray-900"
                        >
                          <option value="accepted">Accepted</option>
                          <option value="reprint">Reprint</option>
                          <option value="refund">Refund</option>
                          <option value="discounted">Discounted</option>
                        </select>
                        <input
                          type="text"
                          value={resolveData.resolutionNote}
                          onChange={(e) =>
                            setResolveData((prev) => ({
                              ...prev,
                              resolutionNote: e.target.value,
                            }))
                          }
                          placeholder="Resolution note..."
                          className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs outline-none focus:border-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleResolve(report.id)}
                          disabled={resolveSubmitting}
                          className="rounded-[3px] bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#222] disabled:bg-[#999]"
                        >
                          {resolveSubmitting ? "Saving..." : "Submit"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Inline resolve rows for desktop */}
            {resolvingId && (
              <div className="hidden lg:block">
                {reports.map((report) =>
                  resolvingId === report.id ? (
                    <div
                      key={`resolve-${report.id}`}
                      className="border-t border-[#e0e0e0] bg-[#fafafa] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-black">
                          Resolve {report.orderId?.slice(0, 8)}:
                        </span>
                        <select
                          value={resolveData.resolution}
                          onChange={(e) =>
                            setResolveData((prev) => ({
                              ...prev,
                              resolution: e.target.value,
                            }))
                          }
                          className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black outline-none focus:border-gray-900"
                        >
                          <option value="accepted">Accepted</option>
                          <option value="reprint">Reprint</option>
                          <option value="refund">Refund</option>
                          <option value="discounted">Discounted</option>
                        </select>
                        <input
                          type="text"
                          value={resolveData.resolutionNote}
                          onChange={(e) =>
                            setResolveData((prev) => ({
                              ...prev,
                              resolutionNote: e.target.value,
                            }))
                          }
                          placeholder="Resolution note..."
                          className="flex-1 rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs outline-none focus:border-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleResolve(report.id)}
                          disabled={resolveSubmitting}
                          className="rounded-[3px] bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#222] disabled:bg-[#999]"
                        >
                          {resolveSubmitting ? "Saving..." : "Submit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolvingId(null)}
                          className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Previous
            </button>
            {/* Page number indicators */}
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`rounded-[3px] border px-3 py-1.5 text-xs font-medium transition-colors ${
                    page === pageNum
                      ? "border-gray-900 bg-black text-white"
                      : "border-[#d0d0d0] text-black hover:bg-[#fafafa]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
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
