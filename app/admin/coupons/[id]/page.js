"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function CouponDetailPage() {
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
        showMsg(data.error || "Failed to save", true);
      } else {
        const data = await res.json();
        setCoupon((prev) => ({ ...prev, ...data }));
        showMsg("Coupon saved!");
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete coupon "${coupon.code}"? If it has linked orders, it will be deactivated instead.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to delete coupon", true);
      } else if (data.deactivated) {
        showMsg(data.message);
        fetchCoupon();
      } else {
        showMsg("Coupon deleted");
        setTimeout(() => router.push("/admin/coupons"), 1000);
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        Loading...
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
    inactive: "bg-gray-100 text-gray-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/coupons"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
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
          <h1 className="font-mono text-xl font-semibold text-gray-900">
            {coupon.code}
          </h1>
          <p className="text-xs text-gray-400">{coupon.id}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[status]}`}
        >
          {status}
        </span>
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

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Coupon Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Code *
              </label>
              <input
                type="text"
                value={form.code || ""}
                onChange={(e) => updateField("code", e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Type *
                </label>
                <select
                  value={form.type || "percentage"}
                  onChange={(e) => updateField("type", e.target.value)}
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
                  type="number"
                  min="1"
                  value={form.value ?? ""}
                  onChange={(e) => updateField("value", e.target.value)}
                  required
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
                  type="number"
                  min="0"
                  value={form.minAmount ?? ""}
                  onChange={(e) => updateField("minAmount", e.target.value)}
                  placeholder="No minimum"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Max Uses
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses ?? ""}
                  onChange={(e) => updateField("maxUses", e.target.value)}
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
                  type="date"
                  value={form.validFrom || ""}
                  onChange={(e) => updateField("validFrom", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Valid To *
                </label>
                <input
                  type="date"
                  value={form.validTo || ""}
                  onChange={(e) => updateField("validTo", e.target.value)}
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
                rows={2}
                value={form.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Optional internal note"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => updateField("isActive", !form.isActive)}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
              form.isActive
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-600 hover:bg-green-50"
            }`}
          >
            {form.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </form>

      {/* Usage History */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Usage History
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({coupon._count?.orders || 0} total orders)
          </span>
        </h2>

        {coupon.orders && coupon.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Order ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupon.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-gray-600">
                        {order.id.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="px-4 py-2 font-semibold text-gray-900">
                      {formatCad(order.totalAmount)}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-sm text-gray-400">
            No orders have used this coupon yet.
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Quick Info</h2>
        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-gray-500">Used</dt>
            <dd className="mt-0.5 font-semibold text-gray-900">
              {coupon.usedCount}
              {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd className="mt-0.5 text-gray-900">
              {new Date(coupon.createdAt).toLocaleDateString("en-CA")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Updated</dt>
            <dd className="mt-0.5 text-gray-900">
              {new Date(coupon.updatedAt).toLocaleDateString("en-CA")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Orders</dt>
            <dd className="mt-0.5 font-semibold text-gray-900">
              {coupon._count?.orders || 0}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
