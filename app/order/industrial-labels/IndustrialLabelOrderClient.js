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

// ─── Industrial Label Configuration ───

const TYPES = [
  { id: "asset-tag", icon: "asset" },
  { id: "pipe-marker", icon: "pipe" },
  { id: "warehouse", icon: "warehouse" },
  { id: "cable", icon: "cable" },
];

const SIZES_BY_TYPE = {
  "asset-tag": [
    { id: "1.5x3", label: '1.5" \u00d7 3"', w: 1.5, h: 3 },
    { id: "2x4", label: '2" \u00d7 4"', w: 2, h: 4 },
    { id: "3x5", label: '3" \u00d7 5"', w: 3, h: 5 },
  ],
  "pipe-marker": [
    { id: "1x8", label: '1" \u00d7 8"', w: 1, h: 8 },
    { id: "2x8", label: '2" \u00d7 8"', w: 2, h: 8 },
    { id: "4x24", label: '4" \u00d7 24"', w: 4, h: 24 },
  ],
  "warehouse": [
    { id: "2x4", label: '2" \u00d7 4"', w: 2, h: 4 },
    { id: "3x5", label: '3" \u00d7 5"', w: 3, h: 5 },
    { id: "4x6", label: '4" \u00d7 6"', w: 4, h: 6 },
  ],
  "cable": [
    { id: "0.5x1.5", label: '0.5" \u00d7 1.5"', w: 0.5, h: 1.5 },
    { id: "0.75x2", label: '0.75" \u00d7 2"', w: 0.75, h: 2 },
    { id: "1x3", label: '1" \u00d7 3"', w: 1, h: 3 },
  ],
};

const DEFAULT_SIZE_IDX = { "asset-tag": 1, "pipe-marker": 1, "warehouse": 0, "cable": 1 };

const MATERIALS = [
  { id: "vinyl", surcharge: 0 },
  { id: "polyester", surcharge: 5 },
  { id: "aluminum-foil", surcharge: 12 },
];

const LAMINATIONS = [
  { id: "gloss-lam", surcharge: 0 },
  { id: "matte-lam", surcharge: 2 },
  { id: "extra-durable", surcharge: 6 },
];

const QUANTITIES = [25, 50, 100, 250, 500, 1000];

// ─── Icons ───

function TypeIcon({ type, className = "h-8 w-8" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "asset":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path strokeLinecap="round" d="M7 9h4M7 12h10M7 15h6" />
          <circle cx="18" cy="8" r="1.5" opacity="0.3" fill="currentColor" />
        </svg>
      );
    case "pipe":
      return (
        <svg {...common}>
          <rect x="2" y="8" width="20" height="8" rx="1" />
          <path strokeLinecap="round" d="M2 12h20" strokeDasharray="3 2" />
          <path strokeLinecap="round" d="M6 10v4M18 10v4" />
        </svg>
      );
    case "warehouse":
      return (
        <svg {...common}>
          <path d="M4 20V8l8-4 8 4v12" />
          <path strokeLinecap="round" d="M4 12h16M4 16h16" />
          <rect x="8" y="12" width="8" height="4" strokeDasharray="3 2" />
        </svg>
      );
    case "cable":
      return (
        <svg {...common}>
          <path strokeLinecap="round" d="M8 4v6a4 4 0 008 0V4" />
          <rect x="7" y="12" width="10" height="5" rx="1" />
          <path strokeLinecap="round" d="M10 17v3M14 17v3" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function IndustrialLabelOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [typeId, setTypeId] = useState("asset-tag");
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE_IDX["asset-tag"]);
  const [material, setMaterial] = useState("vinyl");
  const [lamination, setLamination] = useState("gloss-lam");
  const [quantity, setQuantity] = useState(100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const sizes = useMemo(() => SIZES_BY_TYPE[typeId] || SIZES_BY_TYPE["asset-tag"], [typeId]);
  const size = sizes[sizeIdx] || sizes[0];

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Reset size index when type changes
  useEffect(() => {
    setSizeIdx(DEFAULT_SIZE_IDX[typeId] ?? 0);
  }, [typeId]);

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
        slug: "industrial-labels",
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
  const materialSurcharge = (MATERIALS.find((m) => m.id === material)?.surcharge ?? 0) * activeQty;
  const laminationSurcharge = (LAMINATIONS.find((l) => l.id === lamination)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + materialSurcharge + laminationSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    return {
      id: "industrial-labels",
      name: `${t(`il.type.${typeId}`)} — ${size.label}`,
      slug: "industrial-labels",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        type: typeId,
        material,
        lamination,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
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
    showSuccessToast(t("il.addedToCart"));
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
          { label: t("il.breadcrumb"), href: "/shop/stickers-labels-decals/industrial-labels" },
          { label: t("il.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("il.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Type */}
          <Section label={t("il.type.label")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                  <TypeIcon type={tp.icon} className="h-8 w-8" />
                  <span className="text-sm font-semibold">{t(`il.type.${tp.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${typeId === tp.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`il.typeDesc.${tp.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("il.size")}>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("il.material")}>
            <div className="grid grid-cols-3 gap-3">
              {MATERIALS.map((m) => {
                const surcharge = m.surcharge ? `+${formatCad(m.surcharge)}` : null;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMaterial(m.id)}
                    className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      material === m.id
                        ? "border-gray-900 bg-gray-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-800">{t(`il.mat.${m.id}`)}</span>
                    <span className={`mt-0.5 block text-[11px] leading-tight ${material === m.id ? "text-gray-500" : "text-gray-400"}`}>
                      {t(`il.matDesc.${m.id}`)}
                    </span>
                    {surcharge && (
                      <span className="mt-0.5 block text-[11px] font-medium text-amber-600">{surcharge}/ea</span>
                    )}
                    {material === m.id && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Lamination */}
          <Section label={t("il.lamination")}>
            <div className="flex flex-wrap gap-2">
              {LAMINATIONS.map((l) => (
                <Chip key={l.id} active={lamination === l.id} onClick={() => setLamination(l.id)}>
                  {t(`il.lam.${l.id}`)}
                  {l.surcharge > 0 && <span className="ml-1 text-[11px] opacity-70">+{formatCad(l.surcharge)}/ea</span>}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("il.quantity")}>
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
              <label className="text-xs text-gray-500">{t("il.customQty")}:</label>
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

          {/* File Upload */}
          <Section label={t("il.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("il.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("il.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("il.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("il.type.label")} value={t(`il.type.${typeId}`)} />
              <Row label={t("il.size")} value={size.label} />
              <Row label={t("il.material")} value={t(`il.mat.${material}`)} />
              <Row label={t("il.lamination")} value={t(`il.lam.${lamination}`)} />
              <Row label={t("il.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("il.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`il.mat.${material}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {laminationSurcharge > 0 && (
                  <Row label={t(`il.lam.${lamination}`)} value={`+ ${formatCad(laminationSurcharge)}`} />
                )}
                <Row label={t("il.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("il.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("il.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("il.selectOptions")}</p>
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
                {t("il.addToCart")}
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
                {buyNowLoading ? t("il.processing") : t("il.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("il.badge.durable")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("il.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {t(`il.type.${typeId}`)} {size.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("il.selectOptions")}</p>
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
            {t("il.addToCart")}
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
