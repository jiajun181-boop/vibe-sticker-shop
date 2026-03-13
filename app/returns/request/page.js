"use client";

import { useState } from "react";
import Link from "next/link";

const ISSUE_TYPES = [
  { value: "quality_defect", label: "Quality Defect (print error, smudging, misalignment)" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "damaged_shipping", label: "Damaged in Shipping" },
  { value: "other", label: "Other" },
];

const RESOLUTIONS = [
  { value: "reprint", label: "Reprint" },
  { value: "refund", label: "Full Refund" },
  { value: "partial_refund", label: "Partial Refund" },
];

export default function ReturnRequestPage() {
  const [form, setForm] = useState({
    orderId: "",
    email: "",
    issueType: "",
    description: "",
    photoUrl: "",
    resolution: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!form.orderId.trim() || !form.email.trim() || !form.issueType || !form.description.trim() || !form.resolution) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/returns/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: form.orderId.trim(),
          email: form.email.trim(),
          issueType: form.issueType,
          description: form.description.trim(),
          photoUrl: form.photoUrl.trim() || null,
          resolution: form.resolution,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSuccess(data.ticketId);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-3 text-sm focus:border-[var(--color-gray-400)] focus:bg-white focus:outline-none";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)] mb-1";

  if (success) {
    return (
      <main className="min-h-screen bg-[var(--color-gray-50)] px-6 py-14 text-[var(--color-gray-900)]">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Request Submitted</h1>
            <p className="text-sm text-[var(--color-gray-600)]">
              Your return/reprint request has been received. Our quality team will review it within 1-2 business days.
            </p>
            <div className="rounded-xl bg-[var(--color-gray-50)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">Reference Number</p>
              <p className="mt-1 font-mono text-lg font-bold">#{success.slice(0, 8)}</p>
            </div>
            <p className="text-xs text-[var(--color-gray-500)]">
              A confirmation email has been sent. Please save your reference number for follow-up.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/track-order"
                className="inline-block rounded-xl bg-[var(--color-gray-900)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] hover:bg-black transition-colors text-center"
              >
                Track Your Order
              </Link>
              <Link
                href="/returns"
                className="inline-block rounded-xl border border-[var(--color-gray-300)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)] transition-colors text-center"
              >
                Back to Returns Policy
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)] px-6 py-14 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-lg">
        <header className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-500)]">Customer Service</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Return / Reprint Request</h1>
          <p className="mt-3 text-sm text-[var(--color-gray-600)]">
            If your order has a quality issue, wrong item, or shipping damage, submit a request below and our team will review it within 1-2 business days.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 space-y-4">
          {/* Order ID */}
          <div>
            <label htmlFor="orderId" className={labelClass}>Order ID / Reference *</label>
            <input
              id="orderId"
              type="text"
              value={form.orderId}
              onChange={(e) => update("orderId", e.target.value)}
              placeholder="e.g. cm1abc2de3fg4hi5"
              className={inputClass}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>Email Address *</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="The email used when placing your order"
              className={inputClass}
              required
            />
          </div>

          {/* Issue Type */}
          <div>
            <label htmlFor="issueType" className={labelClass}>Issue Type *</label>
            <select
              id="issueType"
              value={form.issueType}
              onChange={(e) => update("issueType", e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select an issue...</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className={labelClass}>Description *</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Please describe the issue in detail. Include specific product names, quantities affected, and where the defect is located."
              rows={4}
              className={inputClass + " resize-y"}
              required
            />
          </div>

          {/* Photo URL */}
          <div>
            <label htmlFor="photoUrl" className={labelClass}>Photo URL (optional)</label>
            <input
              id="photoUrl"
              type="url"
              value={form.photoUrl}
              onChange={(e) => update("photoUrl", e.target.value)}
              placeholder="https://... (link to photos showing the issue)"
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-[var(--color-gray-400)]">
              Upload your photos to any image host and paste the link here, or email them to orders@lunarprint.ca
            </p>
          </div>

          {/* Desired Resolution */}
          <div>
            <label className={labelClass}>Desired Resolution *</label>
            <div className="mt-1 space-y-2">
              {RESOLUTIONS.map((r) => (
                <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="resolution"
                    value={r.value}
                    checked={form.resolution === r.value}
                    onChange={(e) => update("resolution", e.target.value)}
                    className="h-4 w-4 accent-[var(--color-gray-900)]"
                  />
                  <span className="text-sm text-[var(--color-gray-700)] group-hover:text-[var(--color-gray-900)]">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-gray-900)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </form>

        {/* Info banner */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="font-semibold">Quality Guarantee: We stand behind every print.</span>
        </div>

        <div className="mt-4 text-center">
          <Link href="/returns" className="text-xs text-[var(--color-gray-500)] underline hover:text-[var(--color-gray-900)]">
            View full Return &amp; Refund Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
