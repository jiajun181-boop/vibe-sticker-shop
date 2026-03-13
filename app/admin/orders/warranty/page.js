"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUS_VALUES = ["all", "submitted", "under_review", "approved", "denied", "fulfilled"];

const STATUS_COLORS = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  fulfilled: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABEL_KEYS = {
  submitted: "warranty.statusSubmitted",
  under_review: "warranty.statusUnderReview",
  approved: "warranty.statusApproved",
  denied: "warranty.statusDenied",
  fulfilled: "warranty.statusFulfilled",
};

const ISSUE_LABEL_KEYS = {
  defective: "warranty.issueDefective",
  damaged: "warranty.issueDamaged",
  wrong_item: "warranty.issueWrongItem",
  quality: "warranty.issueQuality",
  other: "warranty.issueOther",
};

const RESOLUTION_VALUES = ["", "replace", "refund", "repair", "credit"];

const RESOLUTION_LABEL_KEYS = {
  replace: "warranty.resolutionReplace",
  refund: "warranty.resolutionRefund",
  repair: "warranty.resolutionRepair",
  credit: "warranty.resolutionCredit",
};

function formatDate(dateStr, locale) {
  return new Date(dateStr).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA");
}

function getStatusLabel(t, value) {
  if (value === "all") return t("admin.common.all");
  return STATUS_LABEL_KEYS[value] ? t(STATUS_LABEL_KEYS[value]) : value.replace(/_/g, " ");
}

function getIssueLabel(t, value) {
  return ISSUE_LABEL_KEYS[value] ? t(ISSUE_LABEL_KEYS[value]) : value;
}

function getResolutionLabel(t, value) {
  if (!value) return t("admin.warranty.selectResolution");
  return RESOLUTION_LABEL_KEYS[value] ? t(RESOLUTION_LABEL_KEYS[value]) : value;
}

export default function AdminWarrantyPage() {
  const { t, locale } = useTranslation();
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
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setClaims(data.claims || []);
      setPagination(data.pagination || null);
    } catch {
      setClaims([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

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

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
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
        if (!Number.isNaN(cents) && cents > 0) body.refundAmount = cents;
      }

      const res = await fetch("/api/admin/warranty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setUpdateError(data.error || t("admin.warranty.updateFailed"));
        return;
      }

      setClaims((prev) => prev.map((claim) => (claim.id === claimId ? data.claim : claim)));
      setUpdateSuccess(t("admin.warranty.updatedSuccess"));
    } catch {
      setUpdateError(t("admin.warranty.updateFailed"));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black">{t("admin.warranty.title")}</h1>
          <p className="mt-0.5 text-xs text-[#999]">{t("admin.warranty.subtitle")}</p>
        </div>
        <Link
          href="/admin/orders"
          className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
        >
          {t("admin.warranty.backToOrders")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setStatusFilter(value);
              setPage(1);
            }}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === value
                ? "bg-black text-white"
                : "border border-[#e0e0e0] bg-white text-[#666] hover:border-black hover:text-black"
            }`}
          >
            {getStatusLabel(t, value)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("admin.warranty.searchPlaceholder")}
          className="w-full max-w-md rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
        />
        <button
          type="submit"
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
        >
          {t("admin.common.search")}
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
            {t("admin.common.clear")}
          </button>
        )}
      </form>

      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            {t("admin.common.loading")}
          </div>
        ) : claims.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            {t("admin.warranty.empty")}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("warranty.claimNumber")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.customer")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.warranty.order")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("warranty.issueType")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.status")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.date")}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {claims.map((claim) => (
                    <Fragment key={claim.id}>
                      <tr
                        className={`cursor-pointer hover:bg-[#fafafa] ${
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
                          <p className="font-medium text-black">{claim.customerEmail}</p>
                          {claim.customerName && (
                            <p className="text-xs text-[#999]">{claim.customerName}</p>
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
                          {getIssueLabel(t, claim.issueType)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              STATUS_COLORS[claim.status] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {getStatusLabel(t, claim.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">
                          {formatDate(claim.createdAt, locale)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-[#999]">
                            {expandedId === claim.id
                              ? t("admin.warranty.collapse")
                              : t("admin.warranty.expand")}
                          </span>
                        </td>
                      </tr>

                      {expandedId === claim.id && (
                        <tr>
                          <td colSpan={7} className="bg-[#fafafa] px-6 py-5">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#999]">
                                  {t("admin.warranty.claimDetails")}
                                </h3>

                                {claim.productName && (
                                  <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                      {t("admin.warranty.product")}
                                    </p>
                                    <p className="text-sm text-black">
                                      {t("admin.warranty.productQuantity", {
                                        product: claim.productName,
                                        quantity: claim.quantity,
                                      })}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    {t("warranty.description")}
                                  </p>
                                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#333]">
                                    {claim.description}
                                  </p>
                                </div>

                                {claim.photoUrls?.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                      {t("admin.warranty.photos", {
                                        count: claim.photoUrls.length,
                                      })}
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                      {claim.photoUrls.map((url, index) => (
                                        <a
                                          key={index}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="rounded border border-[#d0d0d0] px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                                        >
                                          {t("admin.warranty.photo", { index: index + 1 })}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {claim.resolvedBy && (
                                  <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                      {t("admin.warranty.resolvedBy")}
                                    </p>
                                    <p className="text-sm text-[#333]">
                                      {claim.resolvedBy}
                                      {claim.resolvedAt ? ` - ${formatDate(claim.resolvedAt, locale)}` : ""}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3 rounded-[3px] border border-[#e0e0e0] bg-white p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#999]">
                                  {t("admin.warranty.updateClaim")}
                                </h3>

                                {updateError && <p className="text-xs text-red-600">{updateError}</p>}
                                {updateSuccess && (
                                  <p className="text-xs text-green-600">{updateSuccess}</p>
                                )}

                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    {t("admin.orders.status")}
                                  </label>
                                  <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                                  >
                                    {STATUS_VALUES.filter((value) => value !== "all").map((value) => (
                                      <option key={value} value={value}>
                                        {getStatusLabel(t, value)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    {t("warranty.resolution")}
                                  </label>
                                  <select
                                    value={editResolution}
                                    onChange={(e) => setEditResolution(e.target.value)}
                                    className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                                  >
                                    {RESOLUTION_VALUES.map((value) => (
                                      <option key={value || "none"} value={value}>
                                        {getResolutionLabel(t, value)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    {t("admin.warranty.refundAmount")}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editRefundAmount}
                                    onChange={(e) => setEditRefundAmount(e.target.value)}
                                    placeholder={t("admin.warranty.refundPlaceholder")}
                                    className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#999]">
                                    {t("admin.warranty.notes")}
                                  </label>
                                  <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    rows={3}
                                    placeholder={t("admin.warranty.notesPlaceholder")}
                                    className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleUpdate(claim.id)}
                                  disabled={updating}
                                  className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                                >
                                  {updating ? t("admin.warranty.updating") : t("admin.warranty.updateClaim")}
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

            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {claims.map((claim) => (
                <div key={claim.id}>
                  <div
                    className={`cursor-pointer px-4 py-3 transition-colors hover:bg-[#fafafa] ${
                      expandedId === claim.id ? "bg-[#fafafa]" : ""
                    }`}
                    onClick={() => handleExpand(claim)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold text-black">
                          {claim.claimNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-[#666]">{claim.customerEmail}</p>
                        <p className="mt-0.5 text-xs text-[#999]">
                          {getIssueLabel(t, claim.issueType)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-block rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_COLORS[claim.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getStatusLabel(t, claim.status)}
                        </span>
                        <span className="text-[10px] text-[#999]">
                          {formatDate(claim.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {expandedId === claim.id && (
                    <div className="space-y-4 bg-[#fafafa] px-4 py-4">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">
                          {t("warranty.description")}
                        </p>
                        <p className="mt-1 text-sm text-[#333]">{claim.description}</p>
                      </div>

                      {claim.productName && (
                        <p className="text-xs text-[#666]">
                          {t("admin.warranty.productQuantity", {
                            product: claim.productName,
                            quantity: claim.quantity,
                          })}
                        </p>
                      )}

                      <Link
                        href={`/admin/orders/${claim.orderId}`}
                        className="inline-flex text-xs font-medium text-black underline"
                      >
                        {t("admin.warranty.viewOrder", {
                          id: claim.orderId?.slice(0, 8),
                        })}
                      </Link>

                      {claim.photoUrls?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {claim.photoUrls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded border border-[#d0d0d0] px-2 py-1 text-xs text-blue-600"
                            >
                              {t("admin.warranty.photo", { index: index + 1 })}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2 rounded-[3px] border border-[#e0e0e0] bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#999]">
                          {t("admin.warranty.updateClaim")}
                        </p>
                        {updateError && <p className="text-xs text-red-600">{updateError}</p>}
                        {updateSuccess && <p className="text-xs text-green-600">{updateSuccess}</p>}

                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                        >
                          {STATUS_VALUES.filter((value) => value !== "all").map((value) => (
                            <option key={value} value={value}>
                              {getStatusLabel(t, value)}
                            </option>
                          ))}
                        </select>

                        <select
                          value={editResolution}
                          onChange={(e) => setEditResolution(e.target.value)}
                          className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                        >
                          {RESOLUTION_VALUES.map((value) => (
                            <option key={value || "none"} value={value}>
                              {getResolutionLabel(t, value)}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRefundAmount}
                          onChange={(e) => setEditRefundAmount(e.target.value)}
                          placeholder={t("admin.warranty.refundPlaceholder")}
                          className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                        />

                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          rows={2}
                          placeholder={t("admin.warranty.notesPlaceholder")}
                          className="w-full rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-black"
                        />

                        <button
                          type="button"
                          onClick={() => handleUpdate(claim.id)}
                          disabled={updating}
                          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                        >
                          {updating ? t("admin.warranty.updating") : t("admin.warranty.updateClaim")}
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#999]">
          <span>
            {t("admin.warranty.showingRange", {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded border border-[#d0d0d0] px-3 py-1 disabled:opacity-40"
            >
              {t("admin.common.previous")}
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded border border-[#d0d0d0] px-3 py-1 disabled:opacity-40"
            >
              {t("admin.common.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
