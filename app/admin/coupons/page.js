"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const filterTabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-CA");
}

function formatValue(coupon) {
  if (coupon.type === "percentage") {
    return `${(coupon.value / 100).toFixed(coupon.value % 100 === 0 ? 0 : 2)}%`;
  }
  return formatCad(coupon.value);
}

function getCouponStatus(coupon) {
  if (!coupon.isActive) return "inactive";
  if (new Date(coupon.validTo) < new Date()) return "expired";
  return "active";
}

const statusStyles = {
  active: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  inactive: "bg-gray-100 text-gray-400",
};

export default function CouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          Loading...
        </div>
      }
    >
      <CouponsContent />
    </Suspense>
  );
}

function CouponsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("filter") || "all"
  );
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [creating, setCreating] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");

    if (activeFilter === "active") {
      params.set("active", "true");
    } else if (activeFilter === "expired") {
      params.set("active", "false");
    }

    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/coupons?${params}`);
      const data = await res.json();
      setCoupons(data.coupons || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/coupons?${params}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    updateParams({ search: search || null, page: "1" });
  }

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);

    const fd = new FormData(e.target);
    const payload = {
      code: fd.get("code"),
      type: fd.get("type"),
      value: parseInt(fd.get("value")),
      minAmount: fd.get("minAmount") ? parseInt(fd.get("minAmount")) : null,
      maxUses: fd.get("maxUses") ? parseInt(fd.get("maxUses")) : null,
      validFrom: fd.get("validFrom"),
      validTo: fd.get("validTo"),
      description: fd.get("description") || null,
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to create coupon", true);
      } else {
        setShowForm(false);
        showMsg("Coupon created!");
        fetchCoupons();
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`))
      return;

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to delete coupon", true);
      } else if (data.deactivated) {
        showMsg(data.message);
        fetchCoupons();
      } else {
        showMsg("Coupon deleted");
        fetchCoupons();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Coupons</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
        >
          + Create Coupon
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.isError
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveFilter(tab.value);
                updateParams({
                  filter: tab.value === "all" ? null : tab.value,
                  page: "1",
                });
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === tab.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or description..."
            className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            Loading...
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>No coupons found</p>
            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  updateParams({ filter: null, page: "1" });
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Min Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Uses
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Valid Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              coupon.type === "percentage"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {coupon.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {formatValue(coupon)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {coupon.minAmount
                            ? formatCad(coupon.minAmount)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {coupon.usedCount}
                          {coupon.maxUses
                            ? ` / ${coupon.maxUses}`
                            : " / unlimited"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDate(coupon.validFrom)} -{" "}
                          {formatDate(coupon.validTo)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                              statusStyles[status]
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/coupons/${coupon.id}`}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(coupon)}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 lg:hidden">
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <Link
                    key={coupon.id}
                    href={`/admin/coupons/${coupon.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold text-gray-900">
                          {coupon.code}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatValue(coupon)} &middot;{" "}
                          {coupon.type === "percentage" ? "%" : "fixed"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          statusStyles[status]
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span>
                        {coupon.usedCount}
                        {coupon.maxUses
                          ? ` / ${coupon.maxUses} uses`
                          : " uses"}
                      </span>
                      <span>&middot;</span>
                      <span>
                        {formatDate(coupon.validFrom)} -{" "}
                        {formatDate(coupon.validTo)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

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

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Create Coupon
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Code *
                </label>
                <input
                  name="code"
                  required
                  placeholder="e.g. SUMMER25"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Type *
                  </label>
                  <select
                    name="type"
                    defaultValue="percentage"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Value * (cents or % x 100)
                  </label>
                  <input
                    name="value"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 1000 = 10% or $10.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Min Order Amount (cents)
                  </label>
                  <input
                    name="minAmount"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Max Uses
                  </label>
                  <input
                    name="maxUses"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Valid From *
                  </label>
                  <input
                    name="validFrom"
                    type="date"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Valid To *
                  </label>
                  <input
                    name="validTo"
                    type="date"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Optional internal note"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Coupon"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
