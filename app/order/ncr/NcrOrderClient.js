"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";

const HST_RATE = 0.13;
const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── NCR Configuration ───

const FORM_TYPES = [
  { id: "duplicate", parts: 2, slug: "ncr-forms-duplicate" },
  { id: "triplicate", parts: 3, slug: "ncr-forms-triplicate" },
  { id: "invoices", parts: 2, slug: "ncr-invoices" },
  { id: "invoice-books", parts: 2, slug: "ncr-invoice-books" },
];

const SIZES = [
  { id: "half-letter", label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
  { id: "letter", label: '8.5" × 11"', w: 8.5, h: 11 },
  { id: "legal", label: '8.5" × 14"', w: 8.5, h: 14 },
  { id: "a4", label: "A4", w: 8.27, h: 11.69 },
];

const QUANTITIES = [100, 250, 500, 1000, 2500, 5000];

// ─── Main Component ───

export default function NcrOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  // Form state
  const [formTypeId, setFormTypeId] = useState("duplicate");
  const [sizeIdx, setSizeIdx] = useState(1); // default: letter
  const [quantity, setQuantity] = useState(500);
  const [customQty, setCustomQty] = useState("");

  // Numbering
  const [numbering, setNumbering] = useState(false);
  const [numberStart, setNumberStart] = useState("1");
  const [showNumberModal, setShowNumberModal] = useState(false);

  // File upload
  const [uploadedFile, setUploadedFile] = useState(null);

  // Quote
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const formType = useMemo(() => FORM_TYPES.find((f) => f.id === formTypeId) || FORM_TYPES[0], [formTypeId]);
  const size = SIZES[sizeIdx];

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Computed numbering range
  const numberStartInt = parseInt(numberStart, 10) || 1;
  const numberEnd = numberStartInt + activeQty - 1;

  // ─── Quote fetch ───

  const fetchQuote = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (activeQty <= 0) {
      setQuoteData(null);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setQuoteLoading(true);
    setQuoteError(null);

    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: formType.slug,
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
      }),
      signal: ac.signal,
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Quote failed");
        setQuoteData(data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setQuoteError(err.message);
      })
      .finally(() => setQuoteLoading(false));
  }, [formType.slug, size.w, size.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const unitCents = quoteData?.unitCents ?? 0;
  const subtotalCents = quoteData?.totalCents ?? 0;
  // Numbering surcharge: $0.03/form
  const numberingSurcharge = numbering ? activeQty * 3 : 0;
  const adjustedSubtotal = subtotalCents + numberingSurcharge;
  const taxCents = Math.round(adjustedSubtotal * HST_RATE);
  const totalCents = adjustedSubtotal + taxCents;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Numbering modal handlers ───

  function handleToggleNumbering(checked) {
    if (checked) {
      setShowNumberModal(true);
    } else {
      setNumbering(false);
    }
  }

  function handleConfirmNumbering() {
    const start = parseInt(numberStart, 10);
    if (!start || start < 0) {
      showErrorToast(t("ncr.numbering.invalidStart"));
      return;
    }
    setNumbering(true);
    setShowNumberModal(false);
  }

  function handleCancelNumbering() {
    setShowNumberModal(false);
    setNumbering(false);
  }

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t(`ncr.type.${formTypeId}`),
      size.label,
      `×${activeQty.toLocaleString()}`,
    ];
    if (numbering) {
      nameParts.push(`#${numberStartInt}–${numberEnd}`);
    }

    return {
      id: formType.slug,
      name: nameParts.join(" — "),
      slug: formType.slug,
      price: unitCents,
      quantity: activeQty,
      options: {
        formType: formTypeId,
        parts: formType.parts,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        numbering,
        ...(numbering
          ? { numberStart: numberStartInt, numberEnd }
          : {}),
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }

  function handleAddToCart() {
    const item = buildCartItem();
    if (!item) return;
    addItem(item);
    openCart();
    showSuccessToast(t("ncr.addedToCart"));
  }

  async function handleBuyNow() {
    const item = buildCartItem();
    if (!item || buyNowLoading) return;
    setBuyNowLoading(true);
    try {
      const meta = {};
      for (const [k, v] of Object.entries(item.options)) {
        if (v == null) continue;
        meta[k] = typeof v === "object" ? JSON.stringify(v) : v;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            productId: String(item.id),
            slug: String(item.slug),
            name: item.name,
            unitAmount: item.price,
            quantity: item.quantity,
            meta,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBuyNowLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("ncr.breadcrumb"), href: "/shop/marketing-business-print/ncr-forms" },
          { label: t("ncr.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("ncr.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Form Type */}
          <Section label={t("ncr.formType")}>
            <div className="grid grid-cols-2 gap-3">
              {FORM_TYPES.map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => setFormTypeId(ft.id)}
                  className={`group flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all ${
                    formTypeId === ft.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(`ncr.type.${ft.id}`)}</span>
                  <span className={`text-[11px] ${formTypeId === ft.id ? "text-gray-300" : "text-gray-400"}`}>
                    {ft.parts} {t("ncr.parts")}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("ncr.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("ncr.quantity")}>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((q) => (
                <Chip
                  key={q}
                  active={customQty === "" && quantity === q}
                  onClick={() => {
                    setQuantity(q);
                    setCustomQty("");
                  }}
                >
                  {q.toLocaleString()}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("ncr.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 750"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* Numbering */}
          <Section label={t("ncr.numbering.label")}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={numbering}
                onChange={(e) => handleToggleNumbering(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">{t("ncr.numbering.addNumbering")}</span>
            </label>

            {numbering && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-1">
                      {t("ncr.numbering.startNumber")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={numberStart}
                      onChange={(e) => setNumberStart(e.target.value)}
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <span className="pt-5 text-gray-400">→</span>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-1">
                      {t("ncr.numbering.endNumber")}
                    </label>
                    <div className="flex h-[38px] items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900">
                      {numberEnd.toLocaleString()}
                    </div>
                  </div>
                  <div className="pt-5">
                    <span className="rounded-full bg-gray-900 px-3 py-1 text-[11px] font-semibold text-white">
                      {activeQty.toLocaleString()} {t("ncr.numbering.forms")}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  {t("ncr.numbering.hint", { qty: activeQty.toLocaleString() })}
                </p>
              </div>
            )}
          </Section>

          {/* File Upload */}
          <Section label={t("ncr.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("ncr.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("ncr.remove")}
                  </button>
                </div>
              ) : (
                <UploadButton
                  endpoint="artworkUploader"
                  onClientUploadComplete={(res) => {
                    const first = Array.isArray(res) ? res[0] : null;
                    if (!first) return;
                    setUploadedFile({
                      url: first.ufsUrl || first.url,
                      key: first.key,
                      name: first.name,
                      size: first.size,
                    });
                  }}
                  onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
                />
              )}
            </div>
          </Section>
        </div>

        {/* ── RIGHT: Summary sidebar ── */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("ncr.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("ncr.formType")} value={t(`ncr.type.${formTypeId}`)} />
              <Row label={t("ncr.size")} value={size.label} />
              <Row label={t("ncr.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "—"} />
              {numbering && (
                <Row
                  label={t("ncr.numbering.label")}
                  value={`#${numberStartInt.toLocaleString()} – ${numberEnd.toLocaleString()}`}
                />
              )}
            </dl>

            <hr className="border-gray-100" />

            {quoteLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : quoteError ? (
              <p className="text-xs text-red-500">{quoteError}</p>
            ) : quoteData ? (
              <dl className="space-y-2 text-sm">
                <Row label={t("ncr.unitPrice")} value={formatCad(unitCents)} />
                <Row label={t("ncr.subtotal")} value={formatCad(subtotalCents)} />
                {numbering && (
                  <Row
                    label={t("ncr.numbering.surcharge")}
                    value={`+ ${formatCad(numberingSurcharge)}`}
                  />
                )}
                <Row label={`HST (13%)`} value={formatCad(taxCents)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("ncr.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("ncr.selectOptions")}</p>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("ncr.addToCart")}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading
                    ? "border-gray-900 text-gray-900 hover:bg-gray-50"
                    : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("ncr.processing") : t("ncr.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("ncr.badge.carbonless")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("ncr.badge.shipping")}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MOBILE: Fixed bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {activeQty.toLocaleString()} {t("ncr.numbering.forms")}
                  {numbering ? ` • #${numberStartInt}–${numberEnd}` : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("ncr.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("ncr.addToCart")}
          </button>
        </div>
      </div>

      <div className="h-20 lg:hidden" />

      {/* ── Numbering Modal ── */}
      {showNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t("ncr.numbering.modalTitle")}</h3>
            <p className="text-sm text-gray-500 mb-5">
              {t("ncr.numbering.modalDesc", { qty: activeQty.toLocaleString() })}
            </p>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-1.5">
                  {t("ncr.numbering.startNumber")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={numberStart}
                  onChange={(e) => setNumberStart(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-semibold focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <span className="pb-3 text-lg text-gray-400">→</span>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-1.5">
                  {t("ncr.numbering.endNumber")}
                </label>
                <div className="flex h-[42px] items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900">
                  {numberEnd.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">
                {t("ncr.numbering.rangeExplain", {
                  start: numberStartInt.toLocaleString(),
                  end: numberEnd.toLocaleString(),
                  qty: activeQty.toLocaleString(),
                })}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelNumbering}
                className="rounded-full border border-gray-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-600 hover:bg-gray-50"
              >
                {t("ncr.numbering.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmNumbering}
                className="rounded-full bg-gray-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-gray-800"
              >
                {t("ncr.numbering.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Helper Components ───

function Section({ label, optional, children }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</h2>
        {optional && <span className="text-[10px] text-gray-400">(optional)</span>}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}
