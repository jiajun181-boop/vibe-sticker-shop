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

// ─── Vinyl Lettering Configuration ───

const LETTER_HEIGHTS = [
  { id: "1in", value: 1, label: '1"' },
  { id: "2in", value: 2, label: '2"' },
  { id: "3in", value: 3, label: '3"' },
  { id: "4in", value: 4, label: '4"' },
  { id: "6in", value: 6, label: '6"' },
  { id: "8in", value: 8, label: '8"' },
  { id: "12in", value: 12, label: '12"' },
];

const COLORS = [
  { id: "black", hex: "#1a1a1a", surcharge: 0 },
  { id: "white", hex: "#ffffff", surcharge: 0 },
  { id: "red", hex: "#dc2626", surcharge: 0 },
  { id: "blue", hex: "#1d4ed8", surcharge: 0 },
  { id: "gold", hex: "#ca8a04", surcharge: 5 },
  { id: "silver", hex: "#9ca3af", surcharge: 5 },
];

const MATERIALS = [
  { id: "standard", surcharge: 0 },
  { id: "reflective", surcharge: 15 },
];

const APPLICATIONS = [
  { id: "outdoor", surcharge: 0 },
  { id: "indoor", surcharge: 0 },
];

const QUANTITIES = [1, 2, 5, 10, 25, 50];

// ─── Main Component ───

export default function VinylLetteringOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [heightId, setHeightId] = useState("2in");
  const [color, setColor] = useState("black");
  const [material, setMaterial] = useState("standard");
  const [application, setApplication] = useState("outdoor");
  const [quantity, setQuantity] = useState(5);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const letterHeight = useMemo(
    () => LETTER_HEIGHTS.find((h) => h.id === heightId) || LETTER_HEIGHTS[1],
    [heightId],
  );

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // For quote: widthIn = letterHeight * 4 (estimated width), heightIn = letterHeight value
  const widthIn = letterHeight.value * 4;
  const heightIn = letterHeight.value;

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
        slug: "vinyl-lettering",
        quantity: activeQty,
        widthIn,
        heightIn,
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
  }, [activeQty, widthIn, heightIn]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const colorSurcharge = (COLORS.find((c) => c.id === color)?.surcharge ?? 0) * activeQty;
  const materialSurcharge = (MATERIALS.find((m) => m.id === material)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + colorSurcharge + materialSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
    return {
      id: "vinyl-lettering",
      name: `${t("vl.title")} — ${letterHeight.label} ${t(`vl.color.${color}`)}`,
      slug: "vinyl-lettering",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        letterHeight: heightId,
        letterHeightLabel: letterHeight.label,
        color,
        material,
        application,
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
    showSuccessToast(t("vl.addedToCart"));
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
          { label: t("vl.breadcrumb"), href: "/shop/vinyl-lettering" },
          { label: t("vl.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("vl.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Letter Height */}
          <Section label={t("vl.letterHeight")}>
            <div className="flex flex-wrap gap-2">
              {LETTER_HEIGHTS.map((h) => (
                <Chip key={h.id} active={heightId === h.id} onClick={() => setHeightId(h.id)}>
                  {h.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Color */}
          <Section label={t("vl.color.label")}>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                    color === c.id
                      ? "border-gray-900 bg-gray-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: c.hex }}
                  />
                  {t(`vl.color.${c.id}`)}
                  {c.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("vl.material.label")}>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map((m) => (
                <Chip key={m.id} active={material === m.id} onClick={() => setMaterial(m.id)}>
                  {t(`vl.material.${m.id}`)}
                  {m.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(m.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Application */}
          <Section label={t("vl.application.label")}>
            <div className="flex flex-wrap gap-2">
              {APPLICATIONS.map((a) => (
                <Chip key={a.id} active={application === a.id} onClick={() => setApplication(a.id)}>
                  {t(`vl.application.${a.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("vl.quantity")}>
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
              <label className="text-xs text-gray-500">{t("vl.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 30"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* Artwork Upload */}
          <Section label={t("vl.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("vl.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("vl.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("vl.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("vl.letterHeight")} value={letterHeight.label} />
              <Row
                label={t("vl.color.label")}
                value={
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-gray-200"
                      style={{ backgroundColor: COLORS.find((c) => c.id === color)?.hex }}
                    />
                    {t(`vl.color.${color}`)}
                  </span>
                }
              />
              <Row label={t("vl.material.label")} value={t(`vl.material.${material}`)} />
              <Row label={t("vl.application.label")} value={t(`vl.application.${application}`)} />
              <Row label={t("vl.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("vl.basePrice")} value={formatCad(subtotalCents)} />
                {colorSurcharge > 0 && (
                  <Row label={t(`vl.color.${color}`)} value={`+ ${formatCad(colorSurcharge)}`} />
                )}
                {materialSurcharge > 0 && (
                  <Row label={t(`vl.material.${material}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                <Row label={t("vl.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("vl.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("vl.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("vl.selectOptions")}</p>
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
                {t("vl.addToCart")}
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
                {buyNowLoading ? t("vl.processing") : t("vl.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("vl.badge.outdoor")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("vl.badge.shipping")}</span>
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
                  {activeQty} × {letterHeight.label} {t(`vl.color.${color}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("vl.selectOptions")}</p>
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
            {t("vl.addToCart")}
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
