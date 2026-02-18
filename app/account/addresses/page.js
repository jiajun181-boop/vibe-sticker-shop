"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

const EMPTY_FORM = {
  label: "",
  name: "",
  phone: "",
  company: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "CA",
  isDefaultShipping: false,
};

const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

export default function AddressesPage() {
  const authLoading = useAuthStore((s) => s.loading);
  const { t } = useTranslation();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/account/addresses");
      const data = await res.json();
      if (res.ok) setAddresses(data.addresses || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    fetchAddresses();
  }, []);

  function handleEdit(addr) {
    setEditingId(addr.id);
    setForm({
      label: addr.label || "",
      name: addr.name || "",
      phone: addr.phone || "",
      company: addr.company || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "CA",
      isDefaultShipping: addr.isDefaultShipping || false,
    });
    setShowForm(true);
  }

  function handleAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.line1.trim() || !form.city.trim() || !form.postalCode.trim()) {
      showErrorToast(t("account.addresses.validation.required"));
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/account/addresses/${editingId}`
        : "/api/account/addresses";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      showSuccessToast(t(editingId ? "account.addresses.updated" : "account.addresses.added"));
      handleCancel();
      fetchAddresses();
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm(t("account.addresses.confirmDelete"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showSuccessToast(t("account.addresses.deleted"));
      fetchAddresses();
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id) {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefaultShipping: true }),
      });
      if (!res.ok) throw new Error("Failed to update");
      showSuccessToast(t("account.addresses.defaultSet"));
      fetchAddresses();
    } catch (err) {
      showErrorToast(err.message);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 animate-pulse rounded bg-[var(--color-gray-100)]" />
        {[1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-[0.14em] text-[var(--color-gray-900)]">
          {t("account.addresses.title")}
        </h1>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="rounded-xl border border-[var(--color-gray-900)] bg-[var(--color-gray-900)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--color-gray-800)]"
          >
            {t("account.addresses.add")}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-[var(--color-gray-200)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-gray-900)]">
            {editingId ? t("account.addresses.edit") : t("account.addresses.add")}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
                {t("account.addresses.label")}
              </label>
              <select
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
              >
                <option value="">—</option>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
                {t("account.addresses.fullName")}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
                {t("account.addresses.company")}
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
                {t("account.addresses.phone")}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
              {t("account.addresses.address1")}
            </label>
            <input
              type="text"
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              required
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
              {t("account.addresses.address2")}
            </label>
            <input
              type="text"
              value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
                {t("account.addresses.city")}
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
                {t("account.addresses.province")}
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
              >
                <option value="">—</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-1">
                {t("account.addresses.postalCode")}
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                required
                className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-400)]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isDefaultShipping}
              onChange={(e) => setForm({ ...form, isDefaultShipping: e.target.checked })}
              className="rounded border-[var(--color-gray-300)]"
            />
            <span className="text-sm text-[var(--color-gray-600)]">{t("account.addresses.setDefault")}</span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[var(--color-gray-900)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--color-gray-800)] disabled:opacity-50"
            >
              {saving ? t("account.profile.saving") : t("account.profile.save")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-[var(--color-gray-200)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)] transition-colors hover:bg-[var(--color-gray-50)]"
            >
              {t("account.addresses.cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Address cards */}
      {addresses.length === 0 && !showForm && (
        <div className="rounded-xl border border-[var(--color-gray-200)] p-8 text-center">
          <p className="text-sm text-[var(--color-gray-500)]">{t("account.addresses.empty")}</p>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`rounded-xl border p-4 ${
              addr.isDefaultShipping ? "border-[var(--color-gray-900)] bg-[var(--color-gray-50)]" : "border-[var(--color-gray-200)]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {addr.label && (
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                      {addr.label}
                    </span>
                  )}
                  {addr.isDefaultShipping && (
                    <span className="rounded-xl bg-[var(--color-gray-900)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      {t("account.addresses.default")}
                    </span>
                  )}
                </div>
                {addr.name && <p className="text-sm font-medium text-[var(--color-gray-900)]">{addr.name}</p>}
                {addr.company && <p className="text-xs text-[var(--color-gray-500)]">{addr.company}</p>}
                <p className="text-sm text-[var(--color-gray-700)]">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p className="text-sm text-[var(--color-gray-700)]">
                  {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
                </p>
                {addr.phone && <p className="text-xs text-[var(--color-gray-500)]">{addr.phone}</p>}
              </div>

              <div className="flex items-center gap-2">
                {!addr.isDefaultShipping && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs text-[var(--color-gray-400)] underline hover:text-[var(--color-gray-600)]"
                  >
                    {t("account.addresses.setDefault")}
                  </button>
                )}
                <button
                  onClick={() => handleEdit(addr)}
                  className="text-xs text-[var(--color-gray-500)] underline hover:text-[var(--color-gray-700)]"
                >
                  {t("account.addresses.edit")}
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="text-xs text-red-400 underline hover:text-red-600 disabled:opacity-50"
                >
                  {t("account.addresses.delete")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
