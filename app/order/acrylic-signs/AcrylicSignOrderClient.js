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

// ─── Acrylic Sign Configuration ───

const SIZES = [
  { id: "8x10", label: '8" × 10"', tag: "Small", w: 8, h: 10 },
  { id: "12x18", label: '12" × 18"', tag: "Medium", w: 12, h: 18 },
  { id: "18x24", label: '18" × 24"', tag: "Large", w: 18, h: 24 },
  { id: "24x36", label: '24" × 36"', tag: "XL", w: 24, h: 36 },
];

const THICKNESSES = [
  { id: "3mm", surcharge: 0 },
  { id: "5mm", surcharge: 200 },    // +$2.00/ea
  { id: "6mm", surcharge: 400 },    // +$4.00/ea — premium
];

const COLORS = [
  { id: "clear", surcharge: 0 },
  { id: "frosted", surcharge: 100 },   // +$1.00/ea
  { id: "black", surcharge: 100 },     // +$1.00/ea
  { id: "white", surcharge: 0 },
];

const MOUNTINGS = [
  { id: "none", surcharge: 0 },
  { id: "standoffs", surcharge: 500 },     // +$5.00/ea — chrome standoff mounts, 4 included
  { id: "hanging-kit", surcharge: 300 },   // +$3.00/ea
];

const QUANTITIES = [1, 2, 5, 10, 25];

// ─── Main Component ───

export default function AcrylicSignOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeIdx, setSizeIdx] = useState(1); // 12x18 default
  const [thickness, setThickness] = useState("3mm");
  const [color, setColor] = useState("clear");
  const [mounting, setMounting] = useState("none");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const size = SIZES[sizeIdx];

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
        slug: "acrylic-signs",
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
  }, [size.w, size.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const thicknessSurcharge = (THICKNESSES.find((th) => th.id === thickness)?.surcharge ?? 0) * activeQty;
  const colorSurcharge = (COLORS.find((c) => c.id === color)?.surcharge ?? 0) * activeQty;
  const mountingSurcharge = (MOUNTINGS.find((m) => m.id === mounting)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + thicknessSurcharge + colorSurcharge + mountingSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
    return {
      id: "acrylic-signs",
      name: `${t("ac.title")} — ${size.label} ${t(`ac.color.${color}`)}`,
      slug: "acrylic-signs",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        thickness,
        color,
        mounting,
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
    showSuccessToast(t("ac.addedToCart"));
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
          { label: t("ac.breadcrumb"), href: "/shop/signage-displays/acrylic-signs" },
          { label: t("ac.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("ac.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Size */}
          <Section label={t("ac.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label} <span className="ml-1 text-[11px] opacity-70">({s.tag})</span>
                </Chip>
              ))}
            </div>
          </Section>

          {/* Thickness */}
          <Section label={t("ac.thickness")}>
            <div className="grid grid-cols-3 gap-2">
              {THICKNESSES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setThickness(th.id)}
                  className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    thickness === th.id
                      ? "border-gray-900 bg-gray-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-800">{t(`ac.thickness.${th.id}`)}</span>
                  <span className={`mt-0.5 block text-[11px] leading-tight ${thickness === th.id ? "text-gray-500" : "text-gray-400"}`}>
                    {t(`ac.thicknessDesc.${th.id}`)}
                  </span>
                  {th.surcharge > 0 && (
                    <span className="mt-1 block text-[11px] font-medium text-amber-600">+{formatCad(th.surcharge)}/ea</span>
                  )}
                  {thickness === th.id && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-900" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Color */}
          <Section label={t("ac.color")}>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <Chip key={c.id} active={color === c.id} onClick={() => setColor(c.id)}>
                  {t(`ac.color.${c.id}`)}
                  {c.surcharge > 0 && <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Mounting */}
          <Section label={t("ac.mounting")}>
            <div className="flex flex-wrap gap-2">
              {MOUNTINGS.map((m) => (
                <Chip key={m.id} active={mounting === m.id} onClick={() => setMounting(m.id)}>
                  {t(`ac.mounting.${m.id}`)}
                  {m.surcharge > 0 && <span className="ml-1 text-[11px] opacity-70">+{formatCad(m.surcharge)}/ea</span>}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("ac.quantity")}>
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
              <label className="text-xs text-gray-500">{t("ac.customQty")}:</label>
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

          {/* Upload */}
          <Section label={t("ac.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("ac.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("ac.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("ac.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("ac.size")} value={`${size.label} (${size.tag})`} />
              <Row label={t("ac.thickness")} value={t(`ac.thickness.${thickness}`)} />
              <Row label={t("ac.color")} value={t(`ac.color.${color}`)} />
              {mounting !== "none" && <Row label={t("ac.mounting")} value={t(`ac.mounting.${mounting}`)} />}
              <Row label={t("ac.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("ac.basePrice")} value={formatCad(subtotalCents)} />
                {thicknessSurcharge > 0 && <Row label={t(`ac.thickness.${thickness}`)} value={`+ ${formatCad(thicknessSurcharge)}`} />}
                {colorSurcharge > 0 && <Row label={t(`ac.color.${color}`)} value={`+ ${formatCad(colorSurcharge)}`} />}
                {mountingSurcharge > 0 && <Row label={t(`ac.mounting.${mounting}`)} value={`+ ${formatCad(mountingSurcharge)}`} />}
                <Row label={t("ac.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("ac.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("ac.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("ac.selectOptions")}</p>
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
                {t("ac.addToCart")}
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
                {buyNowLoading ? t("ac.processing") : t("ac.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("ac.badge.premium")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("ac.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {t("ac.title")} {size.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("ac.selectOptions")}</p>
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
            {t("ac.addToCart")}
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
