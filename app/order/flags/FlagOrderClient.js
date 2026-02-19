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

// ─── Flag Configuration ───

const STYLES = [
  { id: "feather" },
  { id: "teardrop" },
  { id: "rectangle" },
];

const SIZES_BY_STYLE = {
  feather: [
    { id: "s", label: "7 ft", tag: "Small", w: 24, h: 84 },
    { id: "m", label: "10 ft", tag: "Medium", w: 24, h: 120 },
    { id: "l", label: "14 ft", tag: "Large", w: 30, h: 168 },
  ],
  teardrop: [
    { id: "s", label: "7 ft", tag: "Small", w: 24, h: 84 },
    { id: "m", label: "10 ft", tag: "Medium", w: 24, h: 120 },
    { id: "l", label: "12 ft", tag: "Large", w: 24, h: 144 },
  ],
  rectangle: [
    { id: "2x3", label: "2' × 3'", tag: "2×3", w: 24, h: 36 },
    { id: "3x5", label: "3' × 5'", tag: "3×5", w: 36, h: 60 },
    { id: "4x6", label: "4' × 6'", tag: "4×6", w: 48, h: 72 },
  ],
};

const POLES = [
  { id: "ground-stake", surcharge: 0 },
  { id: "cross-base", surcharge: 500 },
  { id: "water-base", surcharge: 800 },
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const QUANTITIES = [1, 2, 5, 10, 25];

// ─── Main Component ───

export default function FlagOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [style, setStyle] = useState("feather");
  const [sizeId, setSizeId] = useState("m");
  const [pole, setPole] = useState("ground-stake");
  const [sidesId, setSidesId] = useState("single");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const availableSizes = useMemo(() => SIZES_BY_STYLE[style] || [], [style]);
  const size = useMemo(() => availableSizes.find((s) => s.id === sizeId) || availableSizes[0], [availableSizes, sizeId]);

  // Reset size when style changes
  useEffect(() => {
    const defaults = { feather: "m", teardrop: "m", rectangle: "3x5" };
    setSizeId(defaults[style] || SIZES_BY_STYLE[style]?.[0]?.id || "m");
  }, [style]);

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
        slug: "flags",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
        sides: sidesId,
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
  }, [size?.w, size?.h, activeQty, sidesId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const poleSurcharge = (POLES.find((p) => p.id === pole)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + poleSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0 || !size) return null;
    return {
      id: `flags-${style}-${size.id}`,
      name: `${t("fl.title")} — ${t(`fl.style.${style}`)} ${size.label}`,
      slug: "flags",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        style,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        pole,
        sides: sidesId,
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
    showSuccessToast(t("fl.addedToCart"));
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
          { label: t("fl.breadcrumb"), href: "/shop/signage-displays/flags" },
          { label: t("fl.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("fl.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Style */}
          <Section label={t("fl.style.label")}>
            <div className="grid grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    style === s.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(`fl.style.${s.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${style === s.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`fl.styleDesc.${s.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("fl.size")}>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <Chip key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                  {s.label}
                  {s.tag && <span className="ml-1 text-[11px] opacity-70">({s.tag})</span>}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Pole & Base */}
          <Section label={t("fl.pole.label")}>
            <div className="flex flex-wrap gap-2">
              {POLES.map((p) => (
                <Chip key={p.id} active={pole === p.id} onClick={() => setPole(p.id)}>
                  {t(`fl.pole.${p.id}`)}
                  {p.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(p.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Sides */}
          <Section label={t("fl.sides.label")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sidesId === s.id} onClick={() => setSidesId(s.id)}>
                  {t(`fl.sides.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("fl.quantity")}>
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
              <label className="text-xs text-gray-500">{t("fl.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 15"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("fl.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("fl.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("fl.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("fl.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("fl.style.label")} value={t(`fl.style.${style}`)} />
              <Row label={t("fl.size")} value={size?.label || "\u2014"} />
              <Row label={t("fl.pole.label")} value={t(`fl.pole.${pole}`)} />
              <Row label={t("fl.sides.label")} value={t(`fl.sides.${sidesId}`)} />
              <Row label={t("fl.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("fl.basePrice")} value={formatCad(subtotalCents)} />
                {poleSurcharge > 0 && (
                  <Row label={t(`fl.pole.${pole}`)} value={`+ ${formatCad(poleSurcharge)}`} />
                )}
                <Row label={t("fl.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("fl.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("fl.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("fl.selectOptions")}</p>
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
                {t("fl.addToCart")}
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
                {buyNowLoading ? t("fl.processing") : t("fl.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("fl.badge.outdoor")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("fl.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {t(`fl.style.${style}`)} {size?.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("fl.selectOptions")}</p>
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
            {t("fl.addToCart")}
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
