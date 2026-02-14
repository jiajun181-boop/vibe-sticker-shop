"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { showErrorToast } from "@/components/Toast";

const STEPS = 4;

const QUANTITY_PRESETS = [50, 100, 250, 500, 1000];

export default function QuoteFormClient({ preselectedProduct, categoryMeta = {} }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");

  const [form, setForm] = useState({
    productType: preselectedProduct || "",
    description: "",
    width: "",
    height: "",
    quantity: "",
    material: "",
    colorMode: "full",
    fileUrls: [],
    neededBy: "",
    isRush: false,
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canNext = () => {
    if (step === 1) return form.productType || form.description;
    if (step === 3) return form.name && form.email;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quote/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setReference(data.reference);
      setSubmitted(true);
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="rounded-3xl border border-gray-200 bg-white p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t("quote.success.title")}</h2>
          <p className="mt-2 text-sm text-gray-500">{t("quote.success.message")}</p>
          <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">{t("quote.success.reference")}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{reference}</p>
          </div>
          <a
            href="/shop"
            className="mt-6 inline-block rounded-full bg-gray-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-black"
          >
            {t("cart.continueShopping")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  s <= step
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s < step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < STEPS && (
                <div className={`mx-1 h-0.5 w-8 sm:w-16 md:w-20 ${s < step ? "bg-gray-900" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
        {/* Step 1: Product selection */}
        {step === 1 && <Step1 form={form} update={update} t={t} categoryMeta={categoryMeta} />}

        {/* Step 2: Specifications */}
        {step === 2 && <Step2 form={form} update={update} t={t} />}

        {/* Step 3: Timeline & Contact */}
        {step === 3 && <Step3 form={form} update={update} t={t} />}

        {/* Step 4: Review */}
        {step === 4 && <Step4 form={form} t={t} categoryMeta={categoryMeta} />}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
            >
              {t("quote.back")}
            </button>
          ) : (
            <div />
          )}

          {step < STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="rounded-full bg-gray-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("quote.next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.name || !form.email}
              className="rounded-full bg-gray-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? t("quote.step4.submitting") : t("quote.step4.submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: What do you need? ── */
function Step1({ form, update, t, categoryMeta }) {
  const categories = Object.entries(categoryMeta);
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">{t("quote.step1.title")}</h2>
      <p className="mt-1 text-sm text-gray-500">{t("quote.step1.subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {categories.map(([slug, meta]) => (
          <button
            key={slug}
            type="button"
            onClick={() => update("productType", slug === form.productType ? "" : slug)}
            className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
              form.productType === slug
                ? "border-gray-900 bg-gray-50 font-semibold text-gray-900"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            <span className="text-lg">{meta.icon}</span>
            <span className="ml-2 text-xs">{meta.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">{t("quote.or")}</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="mt-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
          {t("quote.step1.describe")}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder={t("quote.step1.describePlaceholder")}
          rows={3}
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
        />
      </div>
    </div>
  );
}

/* ── Step 2: Specifications ── */
function Step2({ form, update, t }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">{t("quote.step2.title")}</h2>
      <p className="mt-1 text-sm text-gray-500">{t("quote.step2.subtitle")}</p>

      <div className="mt-6 space-y-5">
        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("quote.step2.width")}
            </label>
            <input
              type="text"
              value={form.width}
              onChange={(e) => update("width", e.target.value)}
              placeholder='e.g. 24"'
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("quote.step2.height")}
            </label>
            <input
              type="text"
              value={form.height}
              onChange={(e) => update("height", e.target.value)}
              placeholder='e.g. 36"'
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            {t("quote.step2.quantity")}
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUANTITY_PRESETS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => update("quantity", String(q))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  form.quantity === String(q)
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {q}
              </button>
            ))}
            <input
              type="text"
              value={QUANTITY_PRESETS.includes(Number(form.quantity)) ? "" : form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              placeholder="Custom"
              className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Material */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            {t("quote.step2.material")}
          </label>
          <input
            type="text"
            value={form.material}
            onChange={(e) => update("material", e.target.value)}
            placeholder="e.g. Vinyl, Cardstock, Coroplast..."
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
          />
        </div>

        {/* Color mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            {t("quote.step2.colorMode")}
          </label>
          <div className="mt-2 flex gap-2">
            {[
              { value: "full", label: t("quote.step2.fullColor") },
              { value: "one", label: t("quote.step2.oneColor") },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("colorMode", opt.value)}
                className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                  form.colorMode === opt.value
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* File upload hint */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            {t("quote.step2.uploadArtwork")}
          </label>
          <p className="mt-1 text-xs text-gray-400">
            You can email artwork to orders@lalunar.com after submitting your quote request.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Step 3: Timeline & Contact ── */
function Step3({ form, update, t }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">{t("quote.step3.title")}</h2>
      <p className="mt-1 text-sm text-gray-500">{t("quote.step3.subtitle")}</p>

      <div className="mt-6 space-y-5">
        {/* Needed by */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            {t("quote.step3.neededBy")}
          </label>
          <input
            type="date"
            value={form.neededBy}
            onChange={(e) => update("neededBy", e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          />
        </div>

        {/* Rush toggle */}
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{t("quote.step3.rush")}</p>
            <p className="text-xs text-gray-400">{t("quote.step3.rushNote")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isRush}
            onClick={() => update("isRush", !form.isRush)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              form.isRush ? "bg-red-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                form.isRush ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>

        <div className="h-px bg-gray-100" />

        {/* Contact fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("quote.step3.name")} *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="John Doe"
              required
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("quote.step3.email")} *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="john@company.com"
              required
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("quote.step3.phone")}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+1 (416) 555-0000"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("quote.step3.company")}
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Your Company Inc."
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: Review & Submit ── */
function Step4({ form, t, categoryMeta }) {
  const catMeta = categoryMeta[form.productType];

  const sections = [
    {
      label: t("quote.step4.product"),
      value: catMeta ? `${catMeta.icon} ${catMeta.title}` : form.description || "—",
    },
    {
      label: t("quote.step4.specs"),
      value: [
        form.width || form.height ? `${form.width || "?"} × ${form.height || "?"}` : null,
        form.quantity ? `Qty: ${form.quantity}` : null,
        form.material || null,
        form.colorMode === "full" ? t("quote.step2.fullColor") : t("quote.step2.oneColor"),
      ]
        .filter(Boolean)
        .join(" · ") || "—",
    },
    {
      label: t("quote.step4.timeline"),
      value: [
        form.neededBy || null,
        form.isRush ? "⚡ Rush" : null,
      ]
        .filter(Boolean)
        .join(" · ") || "—",
    },
    {
      label: t("quote.step4.contact"),
      value: [form.name, form.email, form.phone, form.company].filter(Boolean).join(" · "),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">{t("quote.step4.title")}</h2>
      <p className="mt-1 text-sm text-gray-500">{t("quote.step4.subtitle")}</p>

      <div className="mt-6 space-y-4">
        {sections.map((s) => (
          <div key={s.label} className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">{s.label}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
