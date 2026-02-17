"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";

const HST_RATE = 0.13;
const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Booklet Configuration ───

const BINDINGS = [
  {
    id: "saddle-stitch",
    slug: "booklets-saddle-stitch",
    icon: "staple",
    pageRule: "multiple-of-4",
    minPages: 8,
    maxPages: 64,
  },
  {
    id: "perfect-bound",
    slug: "booklets-perfect-bound",
    icon: "spine",
    pageRule: "any",
    minPages: 24,
    maxPages: 400,
  },
  {
    id: "wire-o",
    slug: "booklets-wire-o",
    icon: "coil",
    pageRule: "any",
    minPages: 12,
    maxPages: 200,
  },
];

const SIZES = [
  { id: "half-letter", label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
  { id: "letter", label: '8.5" × 11"', w: 8.5, h: 11 },
  { id: "6x9", label: '6" × 9"', w: 6, h: 9 },
  { id: "letter-landscape", label: '8.5" × 5.5" (横)', w: 8.5, h: 5.5 },
];

const PAGE_COUNTS_SADDLE = [8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64];
const PAGE_COUNTS_GENERAL = [12, 16, 20, 24, 28, 32, 36, 40, 48, 64, 80, 100, 120, 160, 200];

const INTERIOR_PAPERS = [
  { id: "100lb-gloss-text", label: "100lb Gloss Text" },
  { id: "100lb-matte-text", label: "100lb Matte Text" },
  { id: "80lb-uncoated", label: "80lb Uncoated" },
  { id: "70lb-offset", label: "70lb Offset" },
];

const COVER_PAPERS = [
  { id: "self-cover", label: null }, // i18n key used
  { id: "100lb-gloss-cover", label: "100lb Gloss Cover" },
  { id: "14pt-c2s", label: "14pt C2S" },
  { id: "16pt-c2s", label: "16pt C2S" },
];

const COVER_COATINGS = [
  { id: "none", label: null },
  { id: "gloss-lam", label: null },
  { id: "matte-lam", label: null },
  { id: "soft-touch", label: null },
];

const QUANTITIES = [25, 50, 100, 250, 500, 1000];

// ─── Icons ───

function BindingIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "staple":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
          <path strokeLinecap="round" d="M8 8h0M8 16h0" strokeWidth={3} />
        </svg>
      );
    case "spine":
      return (
        <svg {...common}>
          <rect x="4" y="2" width="16" height="20" rx="1" />
          <path strokeLinecap="round" d="M4 2h2v20H4z" fill="currentColor" opacity="0.2" />
          <path strokeLinecap="round" d="M8 6h8M8 10h8M8 14h6" />
        </svg>
      );
    case "coil":
      return (
        <svg {...common}>
          <rect x="6" y="2" width="14" height="20" rx="1" />
          <path d="M6 5H4a1 1 0 000 2h2M6 9H4a1 1 0 000 2h2M6 13H4a1 1 0 000 2h2M6 17H4a1 1 0 000 2h2" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function BookletOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [bindingId, setBindingId] = useState("saddle-stitch");
  const [sizeIdx, setSizeIdx] = useState(1); // letter
  const [pageCount, setPageCount] = useState(16);
  const [interiorPaper, setInteriorPaper] = useState("100lb-gloss-text");
  const [coverPaper, setCoverPaper] = useState("100lb-gloss-cover");
  const [coverCoating, setCoverCoating] = useState("none");
  const [quantity, setQuantity] = useState(100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const binding = useMemo(() => BINDINGS.find((b) => b.id === bindingId) || BINDINGS[0], [bindingId]);
  const size = SIZES[sizeIdx];
  const isSelfCover = coverPaper === "self-cover";

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Available page counts depend on binding
  const pageCounts = useMemo(() => {
    if (binding.pageRule === "multiple-of-4") {
      return PAGE_COUNTS_SADDLE.filter((p) => p >= binding.minPages && p <= binding.maxPages);
    }
    return PAGE_COUNTS_GENERAL.filter((p) => p >= binding.minPages && p <= binding.maxPages);
  }, [binding]);

  // Reset page count when binding changes if current is invalid
  useEffect(() => {
    if (binding.pageRule === "multiple-of-4" && pageCount % 4 !== 0) {
      setPageCount(pageCounts[0] || 16);
    } else if (pageCount < binding.minPages || pageCount > binding.maxPages) {
      setPageCount(pageCounts[0] || 16);
    }
  }, [bindingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disable cover coating for self-cover
  useEffect(() => {
    if (isSelfCover) setCoverCoating("none");
  }, [isSelfCover]);

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
        slug: binding.slug,
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
        material: interiorPaper,
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
  }, [binding.slug, size.w, size.h, activeQty, interiorPaper]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const unitCents = quoteData?.unitCents ?? 0;
  const subtotalCents = quoteData?.totalCents ?? 0;
  // Page count surcharge: pages beyond 16 add $0.02/page/booklet
  const extraPages = Math.max(0, pageCount - 16);
  const pageSurcharge = extraPages * 2 * activeQty;
  // Cover upgrade surcharge
  const coverUpgrade = coverPaper === "14pt-c2s" ? 15 : coverPaper === "16pt-c2s" ? 25 : 0;
  const coverSurchargeTotal = coverUpgrade * activeQty;
  // Coating surcharge
  const coatingPrice = coverCoating === "gloss-lam" ? 8 : coverCoating === "matte-lam" ? 10 : coverCoating === "soft-touch" ? 18 : 0;
  const coatingSurchargeTotal = isSelfCover ? 0 : coatingPrice * activeQty;

  const adjustedSubtotal = subtotalCents + pageSurcharge + coverSurchargeTotal + coatingSurchargeTotal;
  const taxCents = Math.round(adjustedSubtotal * HST_RATE);
  const totalCents = adjustedSubtotal + taxCents;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t(`booklet.binding.${bindingId}`),
      size.label,
      `${pageCount}pp`,
    ];

    return {
      id: binding.slug,
      name: nameParts.join(" — "),
      slug: binding.slug,
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        binding: bindingId,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        pageCount,
        interiorPaper,
        coverPaper,
        coverCoating: isSelfCover ? "none" : coverCoating,
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
    showSuccessToast(t("booklet.addedToCart"));
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
          { label: t("booklet.breadcrumb"), href: "/shop/marketing-business-print/booklets" },
          { label: t("booklet.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-[var(--color-gray-900)] sm:text-3xl">
        {t("booklet.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Binding Type */}
          <Section label={t("booklet.binding.label")}>
            <div className="grid grid-cols-3 gap-3">
              {BINDINGS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBindingId(b.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    bindingId === b.id
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-white shadow-md"
                      : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
                  }`}
                >
                  <BindingIcon type={b.icon} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`booklet.binding.${b.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${bindingId === b.id ? "text-[var(--color-gray-300)]" : "text-[var(--color-gray-400)]"}`}>
                    {t(`booklet.bindingDesc.${b.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("booklet.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Page Count */}
          <Section label={t("booklet.pageCount")}>
            <div className="flex flex-wrap gap-2">
              {pageCounts.map((p) => (
                <Chip key={p} active={pageCount === p} onClick={() => setPageCount(p)}>
                  {p}
                </Chip>
              ))}
            </div>
            {binding.pageRule === "multiple-of-4" && (
              <p className="mt-2 text-[11px] text-[var(--color-gray-400)]">{t("booklet.pageRuleSaddle")}</p>
            )}
          </Section>

          {/* Interior Paper */}
          <Section label={t("booklet.interiorPaper")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INTERIOR_PAPERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setInteriorPaper(p.id)}
                  className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    interiorPaper === p.id
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-50)] shadow-sm"
                      : "border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-400)]"
                  }`}
                >
                  <span className="block text-sm font-medium text-[var(--color-gray-800)]">{p.label}</span>
                  {interiorPaper === p.id && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-gray-900)]" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Cover Paper */}
          <Section label={t("booklet.coverPaper")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COVER_PAPERS.map((p) => {
                const displayLabel = p.label || t(`booklet.cover.${p.id}`);
                const surcharge = p.id === "14pt-c2s" ? "+$0.15" : p.id === "16pt-c2s" ? "+$0.25" : null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCoverPaper(p.id)}
                    className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      coverPaper === p.id
                        ? "border-[var(--color-gray-900)] bg-[var(--color-gray-50)] shadow-sm"
                        : "border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-400)]"
                    }`}
                  >
                    <span className="block text-sm font-medium text-[var(--color-gray-800)]">{displayLabel}</span>
                    {surcharge && (
                      <span className="mt-0.5 block text-[11px] font-medium text-amber-600">{surcharge}/ea</span>
                    )}
                    {coverPaper === p.id && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-gray-900)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Cover Coating */}
          <Section label={t("booklet.coverCoating")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COVER_COATINGS.map((c) => {
                const disabled = isSelfCover && c.id !== "none";
                const displayLabel = t(`booklet.coating.${c.id}`);
                const surcharge = c.id === "gloss-lam" ? "+$0.08" : c.id === "matte-lam" ? "+$0.10" : c.id === "soft-touch" ? "+$0.18" : null;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => !disabled && setCoverCoating(c.id)}
                    disabled={disabled}
                    className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      disabled
                        ? "cursor-not-allowed border-[var(--color-gray-100)] bg-[var(--color-gray-50)] text-[var(--color-gray-300)]"
                        : coverCoating === c.id
                          ? "border-[var(--color-gray-900)] bg-[var(--color-gray-50)] shadow-sm"
                          : "border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-400)]"
                    }`}
                  >
                    <span className={`block text-sm font-medium ${disabled ? "text-[var(--color-gray-300)]" : "text-[var(--color-gray-800)]"}`}>
                      {displayLabel}
                    </span>
                    {surcharge && !disabled && (
                      <span className="mt-0.5 block text-[11px] font-medium text-amber-600">{surcharge}/ea</span>
                    )}
                    {coverCoating === c.id && !disabled && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-gray-900)]" />
                    )}
                  </button>
                );
              })}
            </div>
            {isSelfCover && (
              <p className="mt-2 text-[11px] text-[var(--color-gray-400)]">{t("booklet.selfCoverNoCoating")}</p>
            )}
          </Section>

          {/* Quantity */}
          <Section label={t("booklet.quantity")}>
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
              <label className="text-xs text-[var(--color-gray-500)]">{t("booklet.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 75"
                className="w-28 rounded-lg border border-[var(--color-gray-300)] px-3 py-1.5 text-sm focus:border-[var(--color-gray-900)] focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("booklet.artwork")} optional>
            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
              <p className="mb-3 text-xs text-[var(--color-gray-600)]">{t("booklet.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-gray-800)]">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("booklet.remove")}
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
          <div className="sticky top-24 space-y-6 rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[var(--color-gray-900)]">{t("booklet.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("booklet.binding.label")} value={t(`booklet.binding.${bindingId}`)} />
              <Row label={t("booklet.size")} value={size.label} />
              <Row label={t("booklet.pageCount")} value={`${pageCount} pages`} />
              <Row label={t("booklet.interiorPaper")} value={INTERIOR_PAPERS.find((p) => p.id === interiorPaper)?.label || interiorPaper} />
              <Row label={t("booklet.coverPaper")} value={isSelfCover ? t("booklet.cover.self-cover") : COVER_PAPERS.find((p) => p.id === coverPaper)?.label || coverPaper} />
              {!isSelfCover && coverCoating !== "none" && (
                <Row label={t("booklet.coverCoating")} value={t(`booklet.coating.${coverCoating}`)} />
              )}
              <Row label={t("booklet.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "—"} />
            </dl>

            <hr className="border-[var(--color-gray-100)]" />

            {quoteLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-[var(--color-gray-100)]" />
                ))}
              </div>
            ) : quoteError ? (
              <p className="text-xs text-red-500">{quoteError}</p>
            ) : quoteData ? (
              <dl className="space-y-2 text-sm">
                <Row label={t("booklet.basePrice")} value={formatCad(subtotalCents)} />
                {pageSurcharge > 0 && (
                  <Row label={`${extraPages} ${t("booklet.extraPages")}`} value={`+ ${formatCad(pageSurcharge)}`} />
                )}
                {coverSurchargeTotal > 0 && (
                  <Row label={t("booklet.coverUpgrade")} value={`+ ${formatCad(coverSurchargeTotal)}`} />
                )}
                {coatingSurchargeTotal > 0 && (
                  <Row label={t(`booklet.coating.${coverCoating}`)} value={`+ ${formatCad(coatingSurchargeTotal)}`} />
                )}
                <Row label={t("booklet.subtotal")} value={formatCad(adjustedSubtotal)} />
                <Row label="HST (13%)" value={formatCad(taxCents)} />
                <div className="flex justify-between border-t border-[var(--color-gray-100)] pt-2">
                  <dt className="font-semibold text-[var(--color-gray-900)]">{t("booklet.total")}</dt>
                  <dd className="text-lg font-bold text-[var(--color-gray-900)]">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-[var(--color-gray-400)]">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("booklet.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-[var(--color-gray-400)]">{t("booklet.selectOptions")}</p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart
                    ? "bg-[var(--color-gray-900)] text-white hover:bg-[var(--color-gray-800)]"
                    : "cursor-not-allowed bg-[var(--color-gray-200)] text-[var(--color-gray-400)]"
                }`}
              >
                {t("booklet.addToCart")}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading
                    ? "border-[var(--color-gray-900)] text-[var(--color-gray-900)] hover:bg-[var(--color-gray-50)]"
                    : "cursor-not-allowed border-[var(--color-gray-200)] text-[var(--color-gray-400)]"
                }`}
              >
                {buyNowLoading ? t("booklet.processing") : t("booklet.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-[var(--color-gray-400)]">
              <span>{t("booklet.badge.fullColor")}</span>
              <span className="text-[var(--color-gray-300)]">|</span>
              <span>{t("booklet.badge.shipping")}</span>
              <span className="text-[var(--color-gray-300)]">|</span>
              <span>{t("booklet.badge.proof")}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MOBILE: Bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-gray-200)] bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-[var(--color-gray-200)]" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-bold text-[var(--color-gray-900)]">{formatCad(totalCents)}</p>
                <p className="truncate text-[11px] text-[var(--color-gray-500)]">
                  {activeQty.toLocaleString()} × {pageCount}pp {t(`booklet.binding.${bindingId}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--color-gray-400)]">{t("booklet.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-[var(--color-gray-900)] text-white hover:bg-[var(--color-gray-800)]"
                : "cursor-not-allowed bg-[var(--color-gray-200)] text-[var(--color-gray-400)]"
            }`}
          >
            {t("booklet.addToCart")}
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
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">{label}</h2>
        {optional && <span className="text-[10px] text-[var(--color-gray-400)]">(optional)</span>}
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
          ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-white"
          : "border-[var(--color-gray-300)] bg-white text-[var(--color-gray-700)] hover:border-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--color-gray-500)]">{label}</dt>
      <dd className="font-medium text-[var(--color-gray-800)]">{value}</dd>
    </div>
  );
}
