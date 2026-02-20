"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import RollUpStandSections from "@/components/banners/RollUpStandSections";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Stand Tier Configuration ───

const STAND_TIERS = [
  { id: "economy", label: 'Economy 33"\u00d780"', w: 33, h: 80, priceCents: 5900 },
  { id: "standard", label: 'Standard 33"\u00d781"', w: 33, h: 81, priceCents: 8900 },
  { id: "premium", label: 'Premium 36"\u00d792"', w: 36, h: 92, priceCents: 12900 },
  { id: "deluxe", label: 'Deluxe 48"\u00d792"', w: 48, h: 92, priceCents: 16900 },
];

const ORDER_TYPES = [
  { id: "complete-kit", surcharge: 0 },
  { id: "print-only", surcharge: 0 },
];

const BANNER_MATERIALS = [
  { id: "vinyl", surcharge: 0 },
  { id: "fabric", surcharge: 500 },
];

const QUANTITIES = [1, 2, 5, 10];

// ─── Icons ───

function TierIcon({ tier, className = "h-10 w-10" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  const opacity = tier === "economy" ? "0.3" : tier === "standard" ? "0.4" : tier === "premium" ? "0.5" : "0.6";
  return (
    <svg {...common}>
      <rect x="5" y="17" width="14" height="4" rx="1" />
      <line x1="12" y1="17" x2="12" y2="3" strokeWidth={tier === "economy" ? 1 : 2} />
      <rect x="8" y="3" width="8" height="14" rx="1" opacity={opacity} />
    </svg>
  );
}

// ─── Main Component ───

export default function RetractableStandOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [tierIdx, setTierIdx] = useState(1); // Standard default
  const [orderType, setOrderType] = useState("complete-kit");
  const [bannerId, setBannerId] = useState("vinyl");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const tier = STAND_TIERS[tierIdx];

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
        widthIn: tier.w,
        heightIn: tier.h,
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
  }, [tier.w, tier.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const bannerSurcharge = (BANNER_MATERIALS.find((b) => b.id === bannerId)?.surcharge ?? 0) * activeQty;
  // Print-only: deduct stand hardware cost (~40% discount estimate)
  const printOnlyDiscount = orderType === "print-only" ? Math.round(subtotalCents * 0.35) : 0;
  const adjustedSubtotal = subtotalCents + bannerSurcharge - printOnlyDiscount;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const typeLabel = orderType === "print-only" ? "Print Only" : "Complete Kit";
    return {
      id: "retractable-stands",
      name: `${t("rs.title")} \u2014 ${tier.label} (${typeLabel})`,
      slug: "retractable-stands",
      price: Math.round(totalCents / activeQty),
      quantity: activeQty,
      options: {
        tier: tier.id,
        sizeLabel: tier.label,
        width: tier.w,
        height: tier.h,
        orderType,
        bannerMaterial: bannerId,
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
          { label: t("rs.breadcrumb"), href: "/shop/banners-displays" },
          { label: t("rs.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("rs.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Order Type Toggle */}
          <Section label={t("banner.orderType.label")}>
            <div className="grid grid-cols-2 gap-3">
              {ORDER_TYPES.map((ot) => (
                <button
                  key={ot.id}
                  type="button"
                  onClick={() => setOrderType(ot.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    orderType === ot.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(`banner.orderType.${ot.id}`)}</span>
                  <p className={`mt-0.5 text-[11px] ${orderType === ot.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`banner.orderType.${ot.id}Desc`)}
                  </p>
                </button>
              ))}
            </div>
            {orderType === "print-only" && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <svg className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-[11px] text-amber-800">{t("banner.orderType.printOnlyWarning")}</p>
              </div>
            )}
          </Section>

          {/* Stand Tier Selection */}
          <Section label={t("rs.size")}>
            <div className="grid grid-cols-2 gap-3">
              {STAND_TIERS.map((st, i) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setTierIdx(i)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    tierIdx === i
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <TierIcon tier={st.id} className="h-10 w-10" />
                  <span className="text-sm font-semibold capitalize">{t(`banner.tier.${st.id}`)}</span>
                  <span className={`text-[11px] ${tierIdx === i ? "text-gray-300" : "text-gray-400"}`}>
                    {st.label.split(" ").slice(1).join(" ")}
                  </span>
                  <span className={`text-sm font-bold ${tierIdx === i ? "text-white" : "text-gray-900"}`}>
                    {formatCad(st.priceCents)}
                  </span>
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
                type="number" min="1" max="999999"
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
                  <button type="button" onClick={() => setUploadedFile(null)} className="text-xs text-red-500 hover:text-red-700">{t("rs.remove")}</button>
                </div>
              ) : (
                <UploadButton
                  endpoint="artworkUploader"
                  onClientUploadComplete={(res) => {
                    const first = Array.isArray(res) ? res[0] : null;
                    if (!first) return;
                    setUploadedFile({ url: first.ufsUrl || first.url, key: first.key, name: first.name, size: first.size });
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
              <Row label={t("banner.orderType.label")} value={t(`banner.orderType.${orderType}`)} />
              <Row label={t("rs.size")} value={tier.label} />
              <Row label={t("rs.banner.label")} value={t(`rs.banner.${bannerId}`)} />
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
                {bannerSurcharge > 0 && (
                  <Row label={t(`rs.banner.${bannerId}`)} value={`+ ${formatCad(bannerSurcharge)}`} />
                )}
                {printOnlyDiscount > 0 && (
                  <Row label={t("banner.orderType.print-only")} value={`- ${formatCad(printOnlyDiscount)}`} />
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("rs.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(totalCents / activeQty))}/{t("rs.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("rs.selectOptions")}</p>
            )}

            <div className="space-y-3">
              <button type="button" onClick={handleAddToCart} disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${canAddToCart ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
                {t("rs.addToCart")}
              </button>
              <button type="button" onClick={handleBuyNow} disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${canAddToCart && !buyNowLoading ? "border-gray-900 text-gray-900 hover:bg-gray-50" : "cursor-not-allowed border-gray-200 text-gray-400"}`}>
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

      {/* ── Product content sections ── */}
      <RollUpStandSections />

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
                  {activeQty.toLocaleString()} × {tier.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("rs.selectOptions")}</p>
            )}
          </div>
          <button type="button" onClick={handleAddToCart} disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${canAddToCart ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
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
    <button type="button" onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"}`}>
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
