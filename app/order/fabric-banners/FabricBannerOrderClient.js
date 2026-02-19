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

// ─── Fabric Banner Configuration ───

const SIZES = [
  { id: "2x4", label: "2' × 4'", tag: "2×4", w: 24, h: 48 },
  { id: "3x5", label: "3' × 5'", tag: "3×5", w: 36, h: 60 },
  { id: "4x6", label: "4' × 6'", tag: "4×6", w: 48, h: 72 },
  { id: "4x8", label: "4' × 8'", tag: "4×8", w: 48, h: 96 },
  { id: "5x10", label: "5' × 10'", tag: "5×10", w: 60, h: 120 },
];

const MATERIALS = [
  { id: "polyester-knit", surcharge: 0 },
  { id: "satin", surcharge: 200 },
  { id: "canvas", surcharge: 300 },
];

const FINISHINGS = [
  { id: "pole-pocket-top", surcharge: 0 },
  { id: "pole-pockets-tb", surcharge: 100 },
  { id: "grommets", surcharge: 100 },
  { id: "sewn-edges", surcharge: 50 },
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const QUANTITIES = [1, 2, 5, 10];

// ─── Icons ───

function MaterialIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "polyester-knit":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path strokeLinecap="round" d="M7 9h10M7 13h10" opacity="0.35" />
        </svg>
      );
    case "satin":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 8c4-2 8 2 12 0s5-1 6-1" opacity="0.4" />
          <path d="M3 14c4-2 8 2 12 0s5-1 6-1" opacity="0.25" />
        </svg>
      );
    case "canvas":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
          <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h10" opacity="0.3" />
          <path d="M3 4h18v3H3z" opacity="0.12" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function FabricBannerOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeIdx, setSizeIdx] = useState(1); // 3×5 default
  const [materialId, setMaterialId] = useState("polyester-knit");
  const [finishingId, setFinishingId] = useState("pole-pocket-top");
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
        slug: "fabric-banners",
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
  }, [size.w, size.h, activeQty, sidesId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const finishingSurcharge = (FINISHINGS.find((f) => f.id === finishingId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + materialSurcharge + finishingSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t("fabr.title"),
      size.tag,
      t(`fabr.sides.${sidesId}`),
    ];

    return {
      id: "fabric-banners",
      name: nameParts.join(" — "),
      slug: "fabric-banners",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material: materialId,
        finishing: finishingId,
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
    showSuccessToast(t("fabr.addedToCart"));
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
          { label: t("fabr.breadcrumb"), href: "/shop/banners-displays/fabric-banners" },
          { label: t("fabr.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("fabr.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Size */}
          <Section label={t("fabr.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label} ({s.tag})
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("fabr.material.label")}>
            <div className="grid grid-cols-3 gap-3">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaterialId(m.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    materialId === m.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <MaterialIcon type={m.id} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`fabr.material.${m.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${materialId === m.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`fabr.materialDesc.${m.id}`)}
                  </span>
                  {m.surcharge > 0 && (
                    <span className={`text-[11px] font-medium ${materialId === m.id ? "text-amber-300" : "text-amber-600"}`}>
                      +{formatCad(m.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Finishing */}
          <Section label={t("fabr.finishing.label")}>
            <div className="flex flex-wrap gap-2">
              {FINISHINGS.map((f) => (
                <Chip key={f.id} active={finishingId === f.id} onClick={() => setFinishingId(f.id)}>
                  {t(`fabr.finishing.${f.id}`)}
                  {f.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(f.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Sides */}
          <Section label={t("fabr.sides.label")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sidesId === s.id} onClick={() => setSidesId(s.id)}>
                  {t(`fabr.sides.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("fabr.quantity")}>
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
              <label className="text-xs text-gray-500">{t("fabr.customQty")}:</label>
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
          <Section label={t("fabr.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("fabr.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("fabr.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("fabr.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("fabr.size")} value={`${size.label} (${size.tag})`} />
              <Row label={t("fabr.material.label")} value={t(`fabr.material.${materialId}`)} />
              <Row label={t("fabr.finishing.label")} value={t(`fabr.finishing.${finishingId}`)} />
              <Row label={t("fabr.sides.label")} value={t(`fabr.sides.${sidesId}`)} />
              <Row label={t("fabr.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("fabr.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`fabr.material.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {finishingSurcharge > 0 && (
                  <Row label={t(`fabr.finishing.${finishingId}`)} value={`+ ${formatCad(finishingSurcharge)}`} />
                )}
                <Row label={t("fabr.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("fabr.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("fabr.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("fabr.selectOptions")}</p>
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
                {t("fabr.addToCart")}
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
                {buyNowLoading ? t("fabr.processing") : t("fabr.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("fabr.badge.wrinkleFree")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("fabr.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {size.tag} {t(`fabr.sides.${sidesId}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("fabr.selectOptions")}</p>
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
            {t("fabr.addToCart")}
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
