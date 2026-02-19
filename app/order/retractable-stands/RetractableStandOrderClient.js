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

// ─── Retractable Stand Configuration ───

const SIZES = [
  { id: "24x80", label: '24" × 80"', tag: "Economy", w: 24, h: 80 },
  { id: "33x81", label: '33" × 81"', tag: "Standard", w: 33, h: 81 },
  { id: "36x92", label: '36" × 92"', tag: "Wide", w: 36, h: 92 },
  { id: "48x92", label: '48" × 92"', tag: "XL", w: 48, h: 92 },
];

const BASE_QUALITIES = [
  { id: "economy", surcharge: 0 },
  { id: "standard", surcharge: 1500 },
  { id: "premium", surcharge: 3000 },
];

const BANNER_MATERIALS = [
  { id: "vinyl", surcharge: 0 },
  { id: "fabric", surcharge: 500 },
];

const CARRYING_CASES = [
  { id: "included", surcharge: 0 },
  { id: "padded-case", surcharge: 500 },
];

const QUANTITIES = [1, 2, 5, 10];

// ─── Icons ───

function BaseIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "economy":
      return (
        <svg {...common}>
          <rect x="6" y="18" width="12" height="3" rx="0.5" />
          <line x1="12" y1="18" x2="12" y2="4" />
          <rect x="9" y="4" width="6" height="14" rx="0.5" opacity="0.3" />
        </svg>
      );
    case "standard":
      return (
        <svg {...common}>
          <rect x="5" y="18" width="14" height="3" rx="1" />
          <line x1="12" y1="18" x2="12" y2="4" strokeWidth="2" />
          <rect x="8" y="4" width="8" height="14" rx="1" opacity="0.3" />
          <circle cx="12" cy="21" r="0.5" fill="currentColor" />
        </svg>
      );
    case "premium":
      return (
        <svg {...common}>
          <rect x="4" y="17" width="16" height="4" rx="1" strokeWidth="2" />
          <line x1="12" y1="17" x2="12" y2="3" strokeWidth="2" />
          <rect x="7" y="3" width="10" height="14" rx="1" opacity="0.3" />
          <circle cx="6" cy="21" r="1" fill="currentColor" opacity="0.5" />
          <circle cx="18" cy="21" r="1" fill="currentColor" opacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function RetractableStandOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeIdx, setSizeIdx] = useState(1); // 33×81 Standard default
  const [baseId, setBaseId] = useState("economy");
  const [bannerId, setBannerId] = useState("vinyl");
  const [caseId, setCaseId] = useState("included");
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
        slug: "retractable-stands",
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
  const baseSurcharge = (BASE_QUALITIES.find((b) => b.id === baseId)?.surcharge ?? 0) * activeQty;
  const bannerSurcharge = (BANNER_MATERIALS.find((b) => b.id === bannerId)?.surcharge ?? 0) * activeQty;
  const caseSurcharge = (CARRYING_CASES.find((c) => c.id === caseId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + baseSurcharge + bannerSurcharge + caseSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t("rs.title"),
      `${size.label} (${size.tag})`,
    ];

    return {
      id: "retractable-stands",
      name: nameParts.join(" — "),
      slug: "retractable-stands",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        base: baseId,
        bannerMaterial: bannerId,
        carryingCase: caseId,
        sides: "single",
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
    showSuccessToast(t("rs.addedToCart"));
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
          { label: t("rs.breadcrumb"), href: "/shop/banners-displays/retractable-stands" },
          { label: t("rs.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("rs.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Size */}
          <Section label={t("rs.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label} <span className="ml-1 text-[11px] opacity-70">({s.tag})</span>
                </Chip>
              ))}
            </div>
          </Section>

          {/* Base Quality */}
          <Section label={t("rs.base.label")}>
            <div className="grid grid-cols-3 gap-3">
              {BASE_QUALITIES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBaseId(b.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    baseId === b.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <BaseIcon type={b.id} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`rs.base.${b.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${baseId === b.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`rs.baseDesc.${b.id}`)}
                  </span>
                  {b.surcharge > 0 && (
                    <span className={`text-[11px] font-medium ${baseId === b.id ? "text-amber-300" : "text-amber-600"}`}>
                      +{formatCad(b.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Banner Material */}
          <Section label={t("rs.banner.label")}>
            <div className="flex flex-wrap gap-2">
              {BANNER_MATERIALS.map((b) => (
                <Chip key={b.id} active={bannerId === b.id} onClick={() => setBannerId(b.id)}>
                  {t(`rs.banner.${b.id}`)}
                  {b.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(b.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Carrying Case */}
          <Section label={t("rs.case.label")}>
            <div className="flex flex-wrap gap-2">
              {CARRYING_CASES.map((c) => (
                <Chip key={c.id} active={caseId === c.id} onClick={() => setCaseId(c.id)}>
                  {t(`rs.case.${c.id}`)}
                  {c.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("rs.quantity")}>
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
              <label className="text-xs text-gray-500">{t("rs.customQty")}:</label>
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
          <Section label={t("rs.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("rs.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("rs.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("rs.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("rs.size")} value={`${size.label} (${size.tag})`} />
              <Row label={t("rs.base.label")} value={t(`rs.base.${baseId}`)} />
              <Row label={t("rs.banner.label")} value={t(`rs.banner.${bannerId}`)} />
              <Row label={t("rs.case.label")} value={t(`rs.case.${caseId}`)} />
              <Row label={t("rs.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("rs.basePrice")} value={formatCad(subtotalCents)} />
                {baseSurcharge > 0 && (
                  <Row label={t(`rs.base.${baseId}`)} value={`+ ${formatCad(baseSurcharge)}`} />
                )}
                {bannerSurcharge > 0 && (
                  <Row label={t(`rs.banner.${bannerId}`)} value={`+ ${formatCad(bannerSurcharge)}`} />
                )}
                {caseSurcharge > 0 && (
                  <Row label={t(`rs.case.${caseId}`)} value={`+ ${formatCad(caseSurcharge)}`} />
                )}
                <Row label={t("rs.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("rs.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("rs.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("rs.selectOptions")}</p>
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
                {t("rs.addToCart")}
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
                {buyNowLoading ? t("rs.processing") : t("rs.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("rs.badge.portable")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("rs.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {size.label} ({size.tag})
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("rs.selectOptions")}</p>
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
            {t("rs.addToCart")}
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
