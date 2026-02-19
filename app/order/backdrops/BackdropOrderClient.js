"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Backdrop Configuration ───

const TYPES = [
  { id: "step-repeat" },
  { id: "popup" },
  { id: "tension-fabric" },
];

const SIZES_BY_TYPE = {
  "step-repeat": [
    { id: "6x4", label: "6' × 4'", w: 72, h: 48 },
    { id: "8x6", label: "8' × 6'", w: 96, h: 72 },
    { id: "8x8", label: "8' × 8'", w: 96, h: 96 },
    { id: "10x8", label: "10' × 8'", w: 120, h: 96 },
  ],
  popup: [
    { id: "6x3", label: "6' × 3'", w: 72, h: 36 },
    { id: "8x8", label: "8' × 8'", w: 96, h: 96 },
    { id: "10x8", label: "10' × 8'", w: 120, h: 96 },
  ],
  "tension-fabric": [
    { id: "3x7", label: "3' × 7'", w: 36, h: 84 },
    { id: "8x8", label: "8' × 8'", w: 96, h: 96 },
    { id: "10x8", label: "10' × 8'", w: 120, h: 96 },
  ],
};

const FRAMES = [
  { id: "included", surcharge: 0 },
  { id: "premium", surcharge: 5000 },
];

const CASES = [
  { id: "basic", surcharge: 0 },
  { id: "wheeled", surcharge: 2000 },
];

const QUANTITIES = [1, 2, 5];

// ─── Main Component ───

export default function BackdropOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [typeId, setTypeId] = useState("step-repeat");
  const [sizeId, setSizeId] = useState("8x6");
  const [frame, setFrame] = useState("included");
  const [carryCase, setCarryCase] = useState("basic");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const availableSizes = useMemo(() => SIZES_BY_TYPE[typeId] || [], [typeId]);
  const size = useMemo(() => availableSizes.find((s) => s.id === sizeId) || availableSizes[0], [availableSizes, sizeId]);

  // Reset size when type changes
  useEffect(() => {
    const defaults = { "step-repeat": "8x6", popup: "8x8", "tension-fabric": "8x8" };
    setSizeId(defaults[typeId] || SIZES_BY_TYPE[typeId]?.[0]?.id || "8x8");
  }, [typeId]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // ─── Quote ───

  const fetchQuote = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (activeQty <= 0 || !size) {
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
        slug: "backdrops",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
        sides: "single",
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
  }, [size?.w, size?.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const frameSurcharge = (FRAMES.find((f) => f.id === frame)?.surcharge ?? 0) * activeQty;
  const caseSurcharge = (CASES.find((c) => c.id === carryCase)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + frameSurcharge + caseSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0 || !size) return null;
    return {
      id: `backdrops-${typeId}-${size.id}`,
      name: `${t("bd.title")} — ${t(`bd.type.${typeId}`)} ${size.label}`,
      slug: "backdrops",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        type: typeId,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        frame,
        carryCase,
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
    showSuccessToast(t("bd.addedToCart"));
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
          { label: t("bd.breadcrumb"), href: "/shop/signage-displays/backdrops" },
          { label: t("bd.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("bd.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Type */}
          <Section label={t("bd.type.label")}>
            <div className="grid grid-cols-3 gap-3">
              {TYPES.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setTypeId(tp.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    typeId === tp.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(`bd.type.${tp.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${typeId === tp.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`bd.typeDesc.${tp.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("bd.size")}>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <Chip key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Frame */}
          <Section label={t("bd.frame.label")}>
            <div className="flex flex-wrap gap-2">
              {FRAMES.map((f) => (
                <Chip key={f.id} active={frame === f.id} onClick={() => setFrame(f.id)}>
                  {t(`bd.frame.${f.id}`)}
                  {f.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(f.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Carrying Case */}
          <Section label={t("bd.case.label")}>
            <div className="flex flex-wrap gap-2">
              {CASES.map((c) => (
                <Chip key={c.id} active={carryCase === c.id} onClick={() => setCarryCase(c.id)}>
                  {t(`bd.case.${c.id}`)}
                  {c.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("bd.quantity")}>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((q) => (
                <Chip
                  key={q}
                  active={customQty === "" && quantity === q}
                  onClick={() => { setQuantity(q); setCustomQty(""); }}
                >
                  {q.toLocaleString()}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("bd.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 3"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("bd.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("bd.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("bd.remove")}
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

        {/* ── RIGHT: Summary ── */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("bd.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("bd.type.label")} value={t(`bd.type.${typeId}`)} />
              <Row label={t("bd.size")} value={size?.label || "\u2014"} />
              <Row label={t("bd.frame.label")} value={t(`bd.frame.${frame}`)} />
              <Row label={t("bd.case.label")} value={t(`bd.case.${carryCase}`)} />
              <Row label={t("bd.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("bd.basePrice")} value={formatCad(subtotalCents)} />
                {frameSurcharge > 0 && (
                  <Row label={t(`bd.frame.${frame}`)} value={`+ ${formatCad(frameSurcharge)}`} />
                )}
                {caseSurcharge > 0 && (
                  <Row label={t(`bd.case.${carryCase}`)} value={`+ ${formatCad(caseSurcharge)}`} />
                )}
                <Row label={t("bd.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("bd.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("bd.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("bd.selectOptions")}</p>
            )}

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
                {t("bd.addToCart")}
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
                {buyNowLoading ? t("bd.processing") : t("bd.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("bd.badge.events")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("bd.badge.shipping")}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MOBILE: Bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {activeQty.toLocaleString()} × {t(`bd.type.${typeId}`)} {size?.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("bd.selectOptions")}</p>
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
            {t("bd.addToCart")}
          </button>
        </div>
      </div>

      <div className="h-20 lg:hidden" />
    </main>
  );
}

// ─── Helpers ───

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
