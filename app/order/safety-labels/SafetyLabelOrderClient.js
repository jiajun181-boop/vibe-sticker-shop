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

// ─── Safety Label Configuration ───

const CATEGORIES = [
  { id: "fire-emergency" },
  { id: "hazard-warning" },
  { id: "ppe-equipment" },
  { id: "electrical-chemical" },
];

const SIZES = [
  { id: "2x3", label: '2" \u00d7 3"', w: 2, h: 3 },
  { id: "3x5", label: '3" \u00d7 5"', w: 3, h: 5 },
  { id: "4x6", label: '4" \u00d7 6"', w: 4, h: 6 },
  { id: "7x10", label: '7" \u00d7 10"', w: 7, h: 10 },
];

const MATERIALS = [
  { id: "vinyl", surcharge: 0 },
  { id: "polyester", surcharge: 5 },
  { id: "reflective", surcharge: 12 },
];

const ADHESIVES = [
  { id: "permanent", surcharge: 0 },
  { id: "removable", surcharge: 3 },
];

const QUANTITIES = [10, 25, 50, 100, 250, 500];

// ─── Icons ───

function CategoryIcon({ type, className = "h-8 w-8" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "fire-emergency":
      return (
        <svg {...common}>
          <path d="M12 2c1 4-2 6-2 10a4 4 0 008 0c0-3-1.5-5-2-7" />
          <path d="M12 18a2 2 0 01-2-2c0-1 .5-1.5 1-2.5.5 1 1 1.5 1 2.5a2 2 0 01-2 2z" opacity="0.3" fill="currentColor" />
        </svg>
      );
    case "hazard-warning":
      return (
        <svg {...common}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" />
        </svg>
      );
    case "ppe-equipment":
      return (
        <svg {...common}>
          <path d="M6 10c0-3.31 2.69-6 6-6s6 2.69 6 6" />
          <path d="M4 10h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
          <path d="M8 14v3M16 14v3" strokeLinecap="round" />
        </svg>
      );
    case "electrical-chemical":
      return (
        <svg {...common}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function SafetyLabelOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [category, setCategory] = useState("fire-emergency");
  const [sizeIdx, setSizeIdx] = useState(1); // 3×5 default
  const [material, setMaterial] = useState("vinyl");
  const [adhesive, setAdhesive] = useState("permanent");
  const [quantity, setQuantity] = useState(50);
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
        slug: "safety-labels",
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
  }, [activeQty, size.w, size.h]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const materialSurcharge = (MATERIALS.find((m) => m.id === material)?.surcharge ?? 0) * activeQty;
  const adhesiveSurcharge = (ADHESIVES.find((a) => a.id === adhesive)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + materialSurcharge + adhesiveSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
    return {
      id: "safety-labels",
      name: `${t(`sl.category.${category}`)} — ${size.label}`,
      slug: "safety-labels",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        category,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material,
        adhesive,
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
    showSuccessToast(t("sl.addedToCart"));
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
          { label: t("sl.breadcrumb"), href: "/shop/safety-labels" },
          { label: t("sl.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("sl.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Category */}
          <Section label={t("sl.category.label")}>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    category === c.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <CategoryIcon type={c.id} className="h-8 w-8" />
                  <span className="text-sm font-semibold">{t(`sl.category.${c.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${category === c.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`sl.categoryDesc.${c.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("sl.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("sl.material.label")}>
            <div className="grid grid-cols-3 gap-3">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaterial(m.id)}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition-all ${
                    material === m.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(`sl.material.${m.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${material === m.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`sl.materialDesc.${m.id}`)}
                  </span>
                  {m.surcharge > 0 && (
                    <span className={`text-[11px] ${material === m.id ? "text-gray-300" : "text-gray-400"}`}>
                      +{formatCad(m.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Adhesive */}
          <Section label={t("sl.adhesive.label")}>
            <div className="flex flex-wrap gap-2">
              {ADHESIVES.map((a) => (
                <Chip key={a.id} active={adhesive === a.id} onClick={() => setAdhesive(a.id)}>
                  {t(`sl.adhesive.${a.id}`)}
                  {a.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(a.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("sl.quantity")}>
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
              <label className="text-xs text-gray-500">{t("sl.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 200"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* Artwork Upload */}
          <Section label={t("sl.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("sl.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("sl.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("sl.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("sl.category.label")} value={t(`sl.category.${category}`)} />
              <Row label={t("sl.size")} value={size.label} />
              <Row label={t("sl.material.label")} value={t(`sl.material.${material}`)} />
              <Row label={t("sl.adhesive.label")} value={t(`sl.adhesive.${adhesive}`)} />
              <Row label={t("sl.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("sl.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`sl.material.${material}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {adhesiveSurcharge > 0 && (
                  <Row label={t(`sl.adhesive.${adhesive}`)} value={`+ ${formatCad(adhesiveSurcharge)}`} />
                )}
                <Row label={t("sl.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("sl.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("sl.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("sl.selectOptions")}</p>
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
                {t("sl.addToCart")}
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
                {buyNowLoading ? t("sl.processing") : t("sl.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("sl.badge.durable")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("sl.badge.shipping")}</span>
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
                  {activeQty} × {t(`sl.category.${category}`)} {size.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("sl.selectOptions")}</p>
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
            {t("sl.addToCart")}
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
