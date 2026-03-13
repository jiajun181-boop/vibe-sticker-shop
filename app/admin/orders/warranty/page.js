"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "fulfilled", label: "Fulfilled" },
];

const STATUS_COLORS = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  fulfilled: "bg-emerald-100 text-emerald-800",
};

const ISSUE_LABELS = {
  defective: "Defective",
  damaged: "Damaged in Shipping",
  wrong_item: "Wrong Item",
  quality: "Quality Issue",
  other: "Other",
};

const RESOLUTION_OPTIONS = [
  { value: "", label: "Select resolution..." },
  { value: "replace", label: "Replace" },
  { value: "refund", label: "Refund" },
  { value: "repair", label: "Repair" },
  { value: "credit", label: "Store Credit" },
];

function formatStatus(status) {
  return (status || "").replace(/_/g, " ");
}

export default function AdminWarrantyPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // Resolution form state (per expanded claim)
  const [editStatus, setEditStatus] = useState("");
  const [editResolution, setEditResolution] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editRefundAmount, setEditRefundAmount] = useState("");

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/warranty?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setClaims(data.claims || []);
      setPagination(data.pagination || null);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  function handleTabChange(tab) {
    setStatusFilter(tab);
    setPage(1);
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleExpand(claim) {
    if (expandedId === claim.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(claim.id);
    setEditStatus(claim.status);
    setEditResolution(claim.resolution || "");
    setEditNote(claim.resolutionNote || "");
    setEditRefundAmount(
      claim.refundAmount != null ? (claim.refundAmount / 100).toFixed(2) : ""
    );
    setUpdateError("");
    setUpdateSuccess("");
  }

  async function handleUpdate(claimId) {
    setUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const body = { claimId, status: editStatus };

      if (editResolution) body.resolution = editResolution;
      if (editNote.trim()) body.resolutionNote = editNote.trim();
      if (editRefundAmount) {
        const cents = Math.round(parseFloat(editRefundAmount) * 100);
        if (!isNaN(cents) && cents > 0) body.refundAmount = cents;
      }

      const res = await fetch("/api/admin/warranty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setUpdateError(data.error || "Update failed");
        return;
      }

      // Update the claim in the list
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? data.claim : c))
      );
      setUpdateSuccess("Claim updated successfully.");
    } catch {
      setUpdateError("Failed to update claim. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black">Warranty Claims</h1>
          <p className="mt-0.5 text-xs text-[#999]">
            Manage customer warranty and quality claims
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
        >
          Back to Orders
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-black text-white"
                : "bg-white text-[#666] border border-[#e0e0e0] hover:border-black hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by claim #, email, name, or order ID..."
          className="w-full max-w-md rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
        />
        <button
          type="submit"
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
            }}
            className="text-xs text-[#999] hover:text-black"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            Loading...
          </div>
        ) : claims.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            No warranty claims found.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Claim #
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Issue
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Date
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {claims.map((claim) => (
                    <Fragment key={claim.id}>
                      <tr
                        className={`hover:bg-[#fafafa] cursor-pointer ${
                          expandedId === claim.id ? "bg-[#fafafa]" : ""
                        }`}
                        onClick={() => handleExpand(claim)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-black">
                            {claim.claimNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-black">
                            {claim.customerEmail}
                          </p>
                          {claim.customerName && (
                            <p className="text-xs text-[#999]">
                              {claim.customerName}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/orders/${claim.orderId}`}
                            className="font-mono text-xs text-black underline hover:no-underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {claim.orderId?.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#666]">
                          {ISSUE_LABELS[claim.issueType] || claim.issueType}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              STATUS_COLORS[claim.status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {formatStatus(claim.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">
                          {new Date(claim.createdAt).toLocaleDateString(
                            "en-CA"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-[#999]">
                            {expandedId === claim.id ? "Collapse" : "Expand"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expandedId === claim.id && (
                        <tr key={`${claim.id}-detail`}>
                          <td colSpan={7} className="bg-[#fafafa] px-6 py-5">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              {/* Left: Claim Details */}
                              <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#999]">
                                  Claim Details
                                </h3>

                                {claim.productName && (
                                  <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                      Product
                                    </p>
                                    <p className="text-sm text-black">
                                      {claim.productName} (qty: {claim.quantity})
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    Description
                                  </p>
                                  <p className="mt-0.5 text-sm text-[#333] whitespace-pre-wrap">
                                    {claim.description}
                                  </p>
                                </div>

                                {claim.photoUrls?.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                      Photos ({claim.photoUrls.length})
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                      {claim.photoUrls.map((url, i) => (
                                        <a
                                          key={i}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="rounded border border-[#d0d0d0] px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                                        >
                                          Photo {i + 1}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {claim.resolvedBy && (
                                  <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                      Resolved By
                                    </p>
                                    <p className="text-sm text-[#333]">
                                      {claim.resolvedBy} &mdash;{" "}
                                      {claim.resolvedAt
                                        ? new Date(
                                            claim.resolvedAt
                                          ).toLocaleDateString("en-CA")
                                        : ""}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Right: Update Form */}
                              <div className="space-y-3 rounded-[3px] border border-[#e0e0e0] bg-white p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#999]">
                                  Update Claim
                                </h3>

                                {updateError && (
                                  <p className="text-xs text-red-600">
                                    {updateError}
                                  </p>
                                )}
                                {updateSuccess && (
                                  <p className="text-xs text-green-600">
                                    {updateSuccess}
                                  </p>
                                )}

                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    Status
                                  </label>
                                  <select
                                    value={editStatus}
                                    onChange={(e) =>
                                      setEditStatus(e.target.value)
                                    }
                                    className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                                  >
                                    {STATUS_TABS.filter(
                                      (t) => t.value !== "all"
                                    ).map((t) => (
                                      <option key={t.value} value={t.value}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    Resolution
                                  </label>
                                  <select
                                    value={editResolution}
                                    onChange={(e) =>
                                      setEditResolution(e.target.value)
                                    }
                                    className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                                  >
                                    {RESOLUTION_OPTIONS.map((opt) => (
                                      <option
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    Refund Amount (CAD, optional)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editRefundAmount}
                                    onChange={(e) =>
                                      setEditRefundAmount(e.target.value)
                                    }
                                    placeholder="0.00"
                                    className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    Notes
                                  </label>
                                  <textarea
                                    value={editNote}
                                    onChange={(e) =>
                                      setEditNote(e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Internal resolution notes..."
                                    className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleUpdate(claim.id)}
                                  disabled={updating}
                                  className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                                >
                                  {updating
                                    ? "Updating..."
                                    : "Update Claim"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {claims.map((claim) => (
                <div key={claim.id}>
                  <div
                    className={`px-4 py-3 cursor-pointer transition-colors hover:bg-[#fafafa] ${
                      expandedId === claim.id ? "bg-[#fafafa]" : ""
                    }`}
                    onClick={() => handleExpand(claim)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold text-black">
                          {claim.claimNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-[#666]">
                          {claim.customerEmail}
                        </p>
                        <p className="mt-0.5 text-xs text-[#999]">
                          {ISSUE_LABELS[claim.issueType] || claim.issueType}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_COLORS[claim.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {formatStatus(claim.status)}
                        </span>
                        <span className="text-[10px] text-[#999]">
                          {new Date(claim.createdAt).toLocaleDateString(
                            "en-CA"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Mobile Detail */}
                  {expandedId === claim.id && (
                    <div className="border-t border-[#e0e0e0] bg-[#fafafa] px-4 py-4 space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                          Description
                        </p>
                        <p className="text-sm text-[#333] whitespace-pre-wrap">
                          {claim.description}
                        </p>

                        {claim.productName && (
                          <p className="text-xs text-[#666]">
                            Product: {claim.productName} (qty: {claim.quantity})
                          </p>
                        )}

                        <Link
                          href={`/admin/orders/${claim.orderId}`}
                          className="inline-block text-xs text-black underline hover:no-underline"
                        >
                          View Order #{claim.orderId?.slice(0, 8)}
                        </Link>

                        {claim.photoUrls?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {claim.photoUrls.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border border-[#d0d0d0] px-2 py-0.5 text-xs text-blue-600"
                              >
                                Photo {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mobile Update Form */}
                      <div className="space-y-3 rounded-[3px] border border-[#e0e0e0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                          Update Claim
                        </p>

                        {updateError && (
                          <p className="text-xs text-red-600">{updateError}</p>
                        )}
                        {updateSuccess && (
                          <p className="text-xs text-green-600">
                            {updateSuccess}
                          </p>
                        )}

                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                        >
                          {STATUS_TABS.filter((t) => t.value !== "all").map(
                            (t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            )
                          )}
                        </select>

                        <select
                          value={editResolution}
                          onChange={(e) => setEditResolution(e.target.value)}
                          className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                        >
                          {RESOLUTION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRefundAmount}
                          onChange={(e) =>
                            setEditRefundAmount(e.target.value)
                          }
                          placeholder="Refund amount (CAD)"
                          className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                        />

                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          rows={2}
                          placeholder="Resolution notes..."
                          className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                        />

                        <button
                          type="button"
                          onClick={() => handleUpdate(claim.id)}
                          disabled={updating}
                          className="w-full rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                        >
                          {updating ? "Updating..." : "Update Claim"}
                        </button>
                      </div>
                    </div>
                  )}
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
              onClick={() => setPage((p) => p - 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
