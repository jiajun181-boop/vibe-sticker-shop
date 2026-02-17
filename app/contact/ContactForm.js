"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

export default function ContactForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      showSuccessToast(t("contact.form.success"));
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch {
      showErrorToast(t("contact.form.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">{t("contact.form.name")} *</span>
          <input
            required
            value={form.name}
            onChange={set("name")}
            placeholder={t("contact.form.namePlaceholder")}
            className="w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-500)]"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">{t("contact.form.email")} *</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder={t("contact.form.emailPlaceholder")}
            className="w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-500)]"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">{t("contact.form.phone")}</span>
          <input
            value={form.phone}
            onChange={set("phone")}
            placeholder={t("contact.form.phonePlaceholder")}
            className="w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-500)]"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">{t("contact.form.company")}</span>
          <input
            value={form.company}
            onChange={set("company")}
            placeholder={t("contact.form.companyPlaceholder")}
            className="w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-500)]"
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">{t("contact.form.message")} *</span>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={set("message")}
          placeholder={t("contact.form.messagePlaceholder")}
          className="w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gray-500)] resize-none"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[var(--color-gray-900)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black disabled:bg-[var(--color-gray-400)]"
      >
        {loading ? t("contact.form.sending") : t("contact.form.submit")}
      </button>
    </form>
  );
}
