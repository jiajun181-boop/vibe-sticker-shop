"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function CouponDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const couponId = params.id;

  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form state
  const [form, setForm] = useState({});

  const fetchCoupon = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`);
      if (!res.ok) {
        router.push("/admin/coupons");
        return;
      }
      const data = await res.json();
      setCoupon(data);
      setForm({
        code: data.code,
        type: data.type,
        value: data.value,
        minAmount: data.minAmount ?? "",
        maxUses: data.maxUses ?? "",
        validFrom: toDateInputValue(data.validFrom),
        validTo: toDateInputValue(data.validTo),
        isActive: data.isActive,
        description: data.description || "",
      });
    } catch {
      router.push("/admin/coupons");
    } finally {
      setLoading(false);
    }
  }, [couponId, router]);

  useEffect(() => {
    fetchCoupon();
  }, [fetchCoupon]);

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      code: form.code,
      type: form.type,
      value: parseInt(form.value),
      minAmount: form.minAmount ? parseInt(form.minAmount) : null,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      validFrom: form.validFrom,
      validTo: form.validTo,
      isActive: form.isActive,
      description: form.description || null,
    };

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        showMsg(data.error || t("admin.couponDetail.saveFailed"), true);
      } else {
        const data = await res.json();
        setCoupon((prev) => ({ ...prev, ...data }));
        showMsg(t("admin.couponDetail.saved"));
      }
    } catch {
      showMsg(t("admin.couponDetail.networkError"), true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        t("admin.couponDetail.deleteConfirm", { code: coupon.code })
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || t("admin.couponDetail.deleteFailed"), true);
      } else if (data.deactivated) {
        showMsg(data.message);
        fetchCoupon();
      } else {
        showMsg(t("admin.couponDetail.deleted"));
        setTimeout(() => router.push("/admin/coupons"), 1000);
      }
    } catch {
      showMsg(t("admin.couponDetail.networkError"), true);
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#999]">
        {t("admin.common.loading")}
      </div>
    );
  }

  if (!coupon) return null;

  const status = !coupon.isActive
    ? "inactive"
    : new Date(coupon.validTo) < new Date()
    ? "expired"
    : "active";

  const statusStyles = {
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    inactive: "bg-[#f5f5f5] text-[#999]",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/coupons"
          className="rounded-[3px] p-1.5 text-[#999] transition-colors hover:bg-[#fafafa] hover:text-[#666]"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="font-mono text-xl font-semibold text-black">
            {coupon.code}
          </h1>
          <p className="text-xs text-[#999]">{coupon.id}</p>
        </div>
        <span
          className={`rounded-[2px] px-3 py-1 text-xs font-medium capitalize ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>

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

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-black">
            {t("admin.couponDetail.title")}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#999]">
                {t("admin.coupons.code")} *
              </label>
              <input
                type="text"
                value={form.code || ""}
                onChange={(e) => updateField("code", e.target.value)}
                required
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 font-mono text-sm uppercase outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  {t("admin.coupons.type")} *
                </label>
                <select
                  value={form.type || "percentage"}
                  onChange={(e) => updateField("type", e.target.value)}
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
                  type="number"
                  min="1"
                  value={form.value ?? ""}
                  onChange={(e) => updateField("value", e.target.value)}
                  required
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  {t("admin.coupons.minOrderCents")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minAmount ?? ""}
                  onChange={(e) => updateField("minAmount", e.target.value)}
                  placeholder={t("admin.couponDetail.noMinimum")}
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  {t("admin.coupons.maxUses")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses ?? ""}
                  onChange={(e) => updateField("maxUses", e.target.value)}
                  placeholder={t("admin.couponDetail.unlimited")}
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  {t("admin.coupons.validFrom")} *
                </label>
                <input
                  type="date"
                  value={form.validFrom || ""}
                  onChange={(e) => updateField("validFrom", e.target.value)}
                  required
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  {t("admin.coupons.validTo")} *
                </label>
                <input
                  type="date"
                  value={form.validTo || ""}
                  onChange={(e) => updateField("validTo", e.target.value)}
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
                rows={2}
                value={form.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder={t("admin.coupons.optionalNote")}
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[3px] bg-black px-6 py-2.5 text-sm font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
          >
            {saving ? t("admin.common.saving") : t("admin.couponDetail.saveChanges")}
          </button>
          <button
            type="button"
            onClick={() => updateField("isActive", !form.isActive)}
            className={`rounded-[3px] border px-4 py-2.5 text-sm font-medium ${
              form.isActive
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-600 hover:bg-green-50"
            }`}
          >
            {form.isActive ? t("admin.couponDetail.deactivate") : t("admin.couponDetail.activate")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-[3px] border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            {t("admin.common.delete")}
          </button>
        </div>
      </form>

      {/* Usage History */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-black">
          {t("admin.couponDetail.usageHistory")}
          <span className="ml-2 text-xs font-normal text-[#999]">
            ({coupon._count?.orders || 0} {t("admin.couponDetail.totalOrders")})
          </span>
        </h2>

        {coupon.orders && coupon.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                    {t("admin.couponDetail.orderId")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                    {t("admin.couponDetail.total")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                    {t("admin.couponDetail.date")}
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {coupon.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-[#666]">
                        {order.id.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="px-4 py-2 font-semibold text-black">
                      {formatCad(order.totalAmount)}
                    </td>
                    <td className="px-4 py-2 text-xs text-[#999]">
                      {new Date(order.createdAt).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-medium text-black underline hover:no-underline"
                      >
                        {t("admin.common.view")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-sm text-[#999]">
            {t("admin.couponDetail.noOrdersYet")}
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black">{t("admin.couponDetail.quickInfo")}</h2>
        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-[#999]">{t("admin.couponDetail.used")}</dt>
            <dd className="mt-0.5 font-semibold text-black">
              {coupon.usedCount}
              {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-[#999]">{t("admin.couponDetail.created")}</dt>
            <dd className="mt-0.5 text-black">
              {new Date(coupon.createdAt).toLocaleDateString("en-CA")}
            </dd>
          </div>
          <div>
            <dt className="text-[#999]">{t("admin.couponDetail.updated")}</dt>
            <dd className="mt-0.5 text-black">
              {new Date(coupon.updatedAt).toLocaleDateString("en-CA")}
            </dd>
          </div>
          <div>
            <dt className="text-[#999]">{t("admin.couponDetail.orders")}</dt>
            <dd className="mt-0.5 font-semibold text-black">
              {coupon._count?.orders || 0}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
