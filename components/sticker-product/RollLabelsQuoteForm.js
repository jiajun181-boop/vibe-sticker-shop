"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { trackUploadStarted } from "@/lib/analytics";
import { ArtworkUpload } from "@/components/configurator";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

const ROLL_MATERIALS = [
  { id: "white-bopp", label: "White BOPP" },
  { id: "clear-bopp", label: "Clear BOPP" },
  { id: "kraft-paper", label: "Kraft Paper" },
  { id: "silver-metallic", label: "Silver Metallic" },
];

const ROLL_SHAPES = [
  { id: "circle", label: "Circle" },
  { id: "rectangle", label: "Rectangle" },
  { id: "oval", label: "Oval" },
  { id: "custom", label: "Custom Shape" },
];

const ROLL_QTY_PRESETS = [500, 1000, 2500, 5000, 10000];

/**
 * Roll Labels quote form — no live pricing, submits a quote request.
 */
export default function RollLabelsQuoteForm() {
  const { t } = useTranslation();

  const [material, setMaterial] = useState("white-bopp");
  const [shape, setShape] = useState("rectangle");
  const [width, setWidth] = useState("2");
  const [height, setHeight] = useState("2");
  const [quantity, setQuantity] = useState(1000);
  const [customQty, setCustomQty] = useState("");
  const [finish, setFinish] = useState("gloss");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeQty = customQty !== "" ? parseInt(customQty, 10) || 0 : quantity;
  const isValid = activeQty >= 500 && parseFloat(width) > 0 && parseFloat(height) > 0 && email.includes("@");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);

    try {
      const body = {
        type: "roll-labels",
        material: ROLL_MATERIALS.find((m) => m.id === material)?.label || material,
        shape: ROLL_SHAPES.find((s) => s.id === shape)?.label || shape,
        width: parseFloat(width),
        height: parseFloat(height),
        quantity: activeQty,
        finish,
        notes,
        email,
        fileName: uploadedFile?.name || null,
      };

      const res = await fetch("/api/quote/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Quote request failed");
      }

      setSubmitted(true);
      showSuccessToast("Quote request submitted! We'll email you within 1 business day.");
    } catch (err) {
      showErrorToast(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <svg className="mx-auto h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-bold text-green-900">Quote Request Submitted</h3>
        <p className="text-sm text-green-700">
          We&apos;ll review your specifications and send a detailed quote to <strong>{email}</strong> within 1 business day.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-2 text-xs font-medium text-green-700 underline hover:text-green-900"
        >
          Submit another quote
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Material */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          1. Material
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ROLL_MATERIALS.map((mat) => {
            const isActive = material === mat.id;
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => setMaterial(mat.id)}
                className={`relative rounded-lg border-2 p-2.5 text-left text-xs font-bold transition-all ${
                  isActive
                    ? "border-gray-900 bg-gray-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                {isActive && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900">
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
                {mat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shape */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          2. Shape
        </h3>
        <div className="flex flex-wrap gap-2">
          {ROLL_SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setShape(s.id)}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                shape === s.id
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          3. Label Size (inches)
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.25"
            min="0.5"
            max="12"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
            placeholder="W"
          />
          <span className="text-xs text-gray-400">×</span>
          <input
            type="number"
            step="0.25"
            min="0.5"
            max="12"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
            placeholder="H"
          />
          <span className="text-[10px] text-gray-400">inches</span>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          4. Quantity <span className="font-normal normal-case text-gray-400">(min 500)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {ROLL_QTY_PRESETS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => { setQuantity(q); setCustomQty(""); }}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                customQty === "" && quantity === q
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {q >= 1000 ? `${q / 1000}K` : q}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="500"
          max="1000000"
          value={customQty}
          onChange={(e) => setCustomQty(e.target.value)}
          placeholder="Custom qty (min 500)"
          className="mt-2 w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
        />
      </div>

      {/* Finish */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          5. Finish
        </h3>
        <div className="flex gap-2">
          {["gloss", "matte", "uncoated"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFinish(f)}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-bold capitalize transition-all ${
                finish === f
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Artwork */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Artwork <span className="font-normal normal-case text-gray-400">(optional)</span>
        </h3>
        <ArtworkUpload
          uploadedFile={uploadedFile}
          onUploaded={(file) => setUploadedFile(file)}
          onRemove={() => setUploadedFile(null)}
          onBegin={() => trackUploadStarted({ slug: "roll-labels" })}
          t={t}
        />
      </div>

      {/* Notes */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Notes <span className="font-normal normal-case text-gray-400">(optional)</span>
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Special requirements, Pantone colors, adhesive preferences..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
        />
      </div>

      {/* Email */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Email for Quote
        </h3>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
        />
      </div>

      {/* Quote info */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-medium text-amber-800">
          Roll labels require custom pricing based on your exact specifications.
          We&apos;ll send a detailed quote to your email within <strong>1 business day</strong>.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || submitting}
        className={`w-full rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
          isValid && !submitting
            ? "bg-gray-900 text-white shadow-lg hover:bg-gray-800 active:scale-[0.98]"
            : "cursor-not-allowed bg-gray-200 text-gray-400"
        }`}
      >
        {submitting ? "Submitting..." : "Request a Quote"}
      </button>

      {/* Trust */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
        <span>Free quotes</span>
        <span className="text-gray-300">|</span>
        <span>No obligation</span>
        <span className="text-gray-300">|</span>
        <span>Reply within 1 business day</span>
      </div>
    </form>
  );
}
