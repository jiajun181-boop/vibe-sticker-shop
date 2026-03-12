"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";
import { ProductCenterBreadcrumb, ProductCenterViewStrip } from "@/components/admin/ProductCenterHeader";

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
  inactive: "bg-gray-100 text-[#999]",
};

export default function CouponsPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          {t("admin.common.loading")}
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
  const { t } = useTranslation();

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

  function getFilterTabs() {
    return [
      { value: "all", label: t("admin.coupons.all") },
      { value: "active", label: t("admin.coupons.active") },
      { value: "expired", label: t("admin.coupons.expired") },
    ];
  }

  function statusLabel(status) {
    const map = {
      active: t("admin.coupons.active"),
      expired: t("admin.coupons.expired"),
      inactive: t("admin.coupons.inactive"),
    };
    return map[status] || status;
  }

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
        showMsg(data.error || t("admin.coupons.createFailed"), true);
      } else {
        setShowForm(false);
        showMsg(t("admin.coupons.created"));
        fetchCoupons();
      }
    } catch {
      showMsg(t("admin.common.networkError", "Network error"), true);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(coupon) {
    if (!confirm(t("admin.coupons.deleteConfirm").replace("{code}", coupon.code)))
      return;

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || t("admin.coupons.deleteFailed"), true);
      } else if (data.deactivated) {
        showMsg(data.message);
        fetchCoupons();
      } else {
        showMsg(t("admin.coupons.deleted"));
        fetchCoupons();
      }
    } catch {
      showMsg(t("admin.common.networkError", "Network error"), true);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <ProductCenterBreadcrumb />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black">{t("admin.coupons.title")}</h1>
            <p className="mt-0.5 text-sm text-[#999]">{t("admin.coupons.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="self-start rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] sm:self-auto"
          >
            {t("admin.coupons.create")}
          </button>
        </div>
      </div>
      <ProductCenterViewStrip activeView="coupons" />

      {/* Toast */}
      {message && (
        <div
          className={`rounded-[3px] px-4 py-3 text-sm font-medium ${
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
        <div className="flex flex-wrap gap-1">
          {getFilterTabs().map((tab) => (
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
              className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === tab.value
                  ? "bg-black text-[#fff]"
                  : "bg-white text-[#666] hover:bg-[#fafafa]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.coupons.searchPlaceholder")}
            className="w-full sm:w-56 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
          >
            {t("admin.common.search")}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            {t("admin.common.loading")}
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-[#999]">
            <p>{t("admin.coupons.noCoupons")}</p>
            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  updateParams({ filter: null, page: "1" });
                }}
                className="text-xs text-black underline hover:no-underline"
              >
                {t("admin.coupons.clearFilters")}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      {t("admin.coupons.code")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      {t("admin.coupons.type")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      {t("admin.coupons.value")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      {t("admin.coupons.minAmount")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      {t("admin.coupons.uses")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      {t("admin.coupons.validPeriod")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      {t("admin.coupons.status")}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr key={coupon.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-semibold text-black">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                              coupon.type === "percentage"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {coupon.type === "percentage" ? t("admin.coupons.percentage") : t("admin.coupons.fixed")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-black">
                          {formatValue(coupon)}
                        </td>
                        <td className="px-4 py-3 text-[#666]">
                          {coupon.minAmount
                            ? formatCad(coupon.minAmount)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-[#666]">
                          {coupon.usedCount}
                          {coupon.maxUses
                            ? ` / ${coupon.maxUses}`
                            : ` / ${t("admin.coupons.unlimited")}`}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">
                          {formatDate(coupon.validFrom)} -{" "}
                          {formatDate(coupon.validTo)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium capitalize ${
                              statusStyles[status]
                            }`}
                          >
                            {statusLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/coupons/${coupon.id}`}
                              className="text-xs font-medium text-black underline hover:no-underline"
                            >
                              {t("admin.coupons.edit")}
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(coupon)}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              {t("admin.coupons.delete")}
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
            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <Link
                    key={coupon.id}
                    href={`/admin/coupons/${coupon.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-[#fafafa]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold text-black">
                          {coupon.code}
                        </p>
                        <p className="mt-0.5 text-xs text-[#999]">
                          {formatValue(coupon)} &middot;{" "}
                          {coupon.type === "percentage" ? t("admin.coupons.percentage") : t("admin.coupons.fixed")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          statusStyles[status]
                        }`}
                      >
                        {statusLabel(status)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#999]">
                      <span>
                        {coupon.usedCount}
                        {coupon.maxUses
                          ? ` / ${coupon.maxUses}`
                          : ""}{" "}
                        {t("admin.coupons.uses").toLowerCase()}
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
          <p className="text-xs text-[#999]">
            {t("admin.common.showing")} {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} {t("admin.common.of")}{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              {t("admin.common.previous")}
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              {t("admin.common.next")}
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[3px] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-semibold text-black">
              {t("admin.coupons.createTitle")}
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  {t("admin.coupons.code")} *
                </label>
                <input
                  name="code"
                  required
                  placeholder="e.g. SUMMER25"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 font-mono text-sm uppercase outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    {t("admin.coupons.type")} *
                  </label>
                  <select
                    name="type"
                    defaultValue="percentage"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    <option value="percentage">{t("admin.coupons.percentage")}</option>
                    <option value="fixed">{t("admin.coupons.fixed")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    {t("admin.coupons.valueLabel")} *
                  </label>
                  <input
                    name="value"
                    type="number"
                    min="1"
                    required
                    placeholder={t("admin.coupons.valuePlaceholder")}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    {t("admin.coupons.minOrderCents")}
                  </label>
                  <input
                    name="minAmount"
                    type="number"
                    min="0"
                    placeholder={t("admin.coupons.optional")}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    {t("admin.coupons.maxUses")}
                  </label>
                  <input
                    name="maxUses"
                    type="number"
                    min="1"
                    placeholder={t("admin.coupons.unlimited")}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    {t("admin.coupons.validFrom")} *
                  </label>
                  <input
                    name="validFrom"
                    type="date"
                    required
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    {t("admin.coupons.validTo")} *
                  </label>
                  <input
                    name="validTo"
                    type="date"
                    required
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  {t("admin.coupons.description")}
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder={t("admin.coupons.optionalNote")}
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-[3px] bg-black py-2.5 text-sm font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                >
                  {creating ? t("admin.coupons.creating") : t("admin.coupons.createTitle")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-[3px] border border-[#e0e0e0] py-2.5 text-sm font-medium text-black hover:bg-[#fafafa]"
                >
                  {t("admin.coupons.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
